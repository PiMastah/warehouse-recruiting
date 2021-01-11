import ArticlesDynamoDbStore from '@infrastructure/dynamoDbArticles';
import ProductsDynamoDbStore from '@infrastructure/dynamoDbProducts';
import {ArticleAmount} from '@models/article';
import {ProductAmount} from '@models/product';
import ArticlesUsecaseInteractor from '@usecases/articles';
import ProductUsecaseInteractor from '@usecases/products';

const articleStore = new ArticlesDynamoDbStore('Articles');
const productStore = new ProductsDynamoDbStore('Products');

const articleUseCases = new ArticlesUsecaseInteractor(articleStore);
const productUseCases = new ProductUsecaseInteractor(
    productStore,
    articleUseCases,
);

(async () => {
  console.log('Loading articles & products from json files in ./data');
  await articleUseCases.updateArticlesFromFile(
      __dirname + '/data/inventory.json',
  );
  await productUseCases.updateProductsFromFile(
      __dirname + '/data/products.json',
  );

  console.log('Querying articles by Ids');
  const someArticles = await articleUseCases.getArticlesById([1, 2]);
  console.log('Found articles', JSON.stringify(someArticles, undefined, 2));

  console.log('Querying products by Names');
  const someProducts = await productUseCases.getProductsByName([
    'Dining Chair',
    'Dinning Table',
  ]);
  console.log('Found products', JSON.stringify(someProducts, undefined, 2));

  console.log('Querying non-existant articles by Ids - ID 99');
  const missingArticles = await articleUseCases.getArticlesById([99]);
  console.log('Found articles', JSON.stringify(missingArticles, undefined, 2));

  console.log('Querying non-existant product by Name - Name Living Room Chair');
  const missingProducts = await productUseCases.getProductsByName([
    'Living Room Chair',
  ]);
  console.log('Found products', JSON.stringify(missingProducts, undefined, 2));

  console.log('Adding article stocks - ID 4 Stock +10');
  await articleUseCases.addStock([new ArticleAmount(4, 10)]);
  let updatedArticles = await articleUseCases.getArticlesById([4]);
  console.log('Articles (Id 4)', JSON.stringify(updatedArticles, undefined, 2));

  console.log('Adding article stocks - ID 4 Stock -20');
  try {
    await articleUseCases.addStock([new ArticleAmount(4, -20)]);
  } catch (e) {
    console.log(`Caught error ${e.name}, ${e.message}`);
  }
  updatedArticles = await articleUseCases.getArticlesById([4]);
  console.log('Articles (Id 4)', JSON.stringify(updatedArticles, undefined, 2));

  console.log('Adding article stocks - ID 4 Stock -10');
  await articleUseCases.addStock([new ArticleAmount(4, -10)]);
  updatedArticles = await articleUseCases.getArticlesById([4]);
  console.log('Articles (Id 4)', JSON.stringify(updatedArticles, undefined, 2));

  console.log('Getting available Products');
  let availableProducts = await productUseCases.getAvailableProducts();
  console.log(
      'Available Products',
      JSON.stringify(availableProducts, undefined, 2),
  );

  console.log('Trying to buy two chairs and one table at the same time');
  let purchaseSuccess = await productUseCases.purchaseProducts([
    new ProductAmount('Dining Chair', 2),
    new ProductAmount('Dinning Table', 1),
  ]);
  console.log(`Did purchase go through: ${purchaseSuccess}`);
  availableProducts = await productUseCases.getAvailableProducts();
  console.log(
      'Available Products',
      JSON.stringify(availableProducts, undefined, 2),
  );

  console.log('Trying to buy one chair and one table at the same time');
  purchaseSuccess = await productUseCases.purchaseProducts([
    new ProductAmount('Dining Chair', 1),
    new ProductAmount('Dinning Table', 1),
  ]);
  console.log(`Did purchase go through: ${purchaseSuccess}`);
  availableProducts = await productUseCases.getAvailableProducts();
  console.log(
      'Available Products',
      JSON.stringify(availableProducts, undefined, 2),
  );
})();
