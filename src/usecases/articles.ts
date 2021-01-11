import {readFileSync} from 'fs';

import ArticleStore from '@interfaces/articleStore';
import {Article, ArticleAmount} from '@models/article';

class ArticlesUsecaseInteractor {
  store: ArticleStore

  constructor(store: ArticleStore) {
    this.store = store;
  }

  async updateArticlesFromFile(filePath: string): Promise<boolean> {
    const json = readFileSync(filePath, 'utf-8');
    const fileContent = JSON.parse(json);
    const articles = fileContent.inventory.map(
        (entry) => new Article(
            parseInt(entry.art_id, 10),
            entry.name,
            parseInt(entry.stock, 10),
        ),
    );

    return this.store.updateArticles(articles);
  }

  async addStock(articleAmounts: ArticleAmount[]): Promise<boolean> {
    return this.store.updateAmounts(articleAmounts);
  }

  async getArticles(articleIds: number[]): Promise<Article[]> {
    return this.store.queryByIds(articleIds);
  }
}

export default ArticlesUsecaseInteractor;
