import {readFileSync} from 'fs';

import ProductStore from '@interfaces/productStore';
import {Product, ProductAmount} from '@models/product';
import {ArticleAmount} from '@models/article';
import ArticlesUsecaseInteractor from '@usecases/articles';
import {NotEnoughStockError} from '@models/errors';

const isArticleQuantityInStock = (articleInventoryMap) =>
  (article) =>
    articleInventoryMap.has(article.id) &&
    articleInventoryMap.get(article.id) >= article.amount;

const isAvailable = (articles) => {
  const articleInventoryMap = articles.reduce(
      (map, article) => {
        map.set(article.id, article.stock);
        return map;
      },
      new Map<number, number>(),
  );

  return (product) => product.articles.every(
      isArticleQuantityInStock(articleInventoryMap),
  );
};

class ProductUsecaseInteractor {
  store: ProductStore
  articleInteractor: ArticlesUsecaseInteractor

  constructor(
      store: ProductStore,
      articleInteractor: ArticlesUsecaseInteractor,
  ) {
    this.store = store;
    this.articleInteractor = articleInteractor;
  }

  async updateProductsFromFile(filePath: string): Promise<boolean> {
    const json = readFileSync(filePath, 'utf-8');
    const fileContent = JSON.parse(json);
    const products = fileContent.products.map(
        (entry) => new Product(
            entry.name,
            parseInt(entry.price, 10),
            entry.contain_articles.map(
                (art) => new ArticleAmount(
                    parseInt(art.art_id, 10),
                    parseInt(art.amount_of),
                ),
            ),
        ),
    );

    return this.store.updateProducts(products);
  }

  async getAvailableProducts(): Promise<Product[]> {
    const products = await this.store.queryAll();
    const articleIdsToQuery: number[] = Array.from(products.reduce(
        (set, product) => {
          product.articles.forEach((a) => set.add(a.id));
          return set;
        },
        new Set<number>(),
    ));

    const articles =
      await this.articleInteractor.getArticles(articleIdsToQuery);

    return products.filter(isAvailable(articles));
  }

  async getProductsByName(productNames: string[]): Promise<Product[]> {
    const products = await this.store.queryByNames(productNames);

    return products;
  }

  async purchaseProducts(productAmounts: ProductAmount[]): Promise<boolean> {
    const requiredProductAmountsById = productAmounts.reduce(
        (map, productAmount) => {
          const currentAmount = map.get(productAmount.name) || 0;
          map.set(productAmount.name, productAmount.amount + currentAmount);
          return map;
        },
        new Map<string, number>(),
    );

    const distinctProducts = await this.store.queryByNames(
        Array.from(requiredProductAmountsById.keys()),
    );

    const requiredArticleAmountsById = distinctProducts.reduce(
        (map, product) => {
          product.articles.forEach((articleAmount) => {
            const currentAmount = map.get(articleAmount.id) || 0;
            map.set(
                articleAmount.id,
                requiredProductAmountsById.get(product.name) *
                articleAmount.amount +
                currentAmount,
            );
          });
          return map;
        },
        new Map<number, number>(),
    );

    const articleAmounts = Array.from(requiredArticleAmountsById.entries())
        .map((entry) => new ArticleAmount(entry[0], -entry[1]));

    try {
      await this.articleInteractor.addStock(articleAmounts);
      return true;
    } catch (e) {
      if (e instanceof NotEnoughStockError) {
        return false;
      } else {
        throw e;
      }
    }
  }
}

export default ProductUsecaseInteractor;
