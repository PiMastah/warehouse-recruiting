import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import Product from '@models/product';
import {ArticleAmount} from '@models/article';
import ProductsDynamoDbStore from '@infrastructure/dynamoDbProducts';

const {expect} = chai;

chai.use(sinonChai);

describe('Products DynamoDb Store', () => {
  let sandbox;
  let store;
  let exampleProducts;
  beforeEach(() => {
    store = new ProductsDynamoDbStore('Products-Test');
    sandbox = sinon.createSandbox();
    store.dynamoDb = sandbox.stub();

    exampleProducts = [
      new Product(
          'Dining Chair',
          1000,
          [
            new ArticleAmount(1, 4),
            new ArticleAmount(2, 8),
            new ArticleAmount(3, 1),
          ],
      ),
      new Product(
          'Dinning Table',
          1000,
          [
            new ArticleAmount(1, 4),
            new ArticleAmount(2, 8),
            new ArticleAmount(4, 1),
          ],
      ),
    ];
  });

  describe('updating products', () => {
    beforeEach(() => {
      store.dynamoDb.batchWriteItem = sandbox.stub().returns({
        promise: () => Promise.resolve({}),
      });
    });

    it('generates a BatchWriteRequest', async () => {
      await store.updateProducts(exampleProducts.slice(0, 1));

      expect(store.dynamoDb.batchWriteItem).to.have.been.calledOnce;
      expect(store.dynamoDb.batchWriteItem).to.have.been.calledWith({
        RequestItems: {
          'Products-Test': [{
            PutRequest: {
              Item: {
                'Name': {
                  S: 'Dining Chair',
                },
                'Price': {
                  N: '1000',
                },
                'Articles': {
                  M: {
                    '1': {
                      N: '4',
                    },
                    '2': {
                      N: '8',
                    },
                    '3': {
                      N: '1',
                    },
                  },
                },
              },
            },
          }],
        },
      });
    });

    it('raises an error if the request fails', async () => {
      store.dynamoDb.batchWriteItem = sandbox.stub().returns({
        promise: () => Promise.reject(new Error('An Error')),
      });

      const spy = sandbox.spy();

      await store.updateProducts(exampleProducts.slice(0, 1)).catch(spy);

      expect(store.dynamoDb.batchWriteItem).to.have.been.calledOnce;
      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('querying product Names', () => {
    beforeEach(() => {
      store.dynamoDb.batchGetItem = sandbox.stub().returns({
        promise: () => Promise.resolve({
          'Responses': {
            'Products-Test': [{
              'Name': {
                S: 'Dining Chair',
              },
              'Price': {
                N: '1000',
              },
              'Articles': {
                M: {
                  '1': {
                    N: '4',
                  },
                  '2': {
                    N: '8',
                  },
                  '3': {
                    N: '1',
                  },
                },
              },
            }],
          },
        }),
      });
    });

    it('generates a BatchGetRequest', async () => {
      const result = await store.queryByNames(['Dining Chair']);

      expect(result).to.deep.equal(exampleProducts.slice(0, 1));

      expect(store.dynamoDb.batchGetItem).to.have.been.calledOnce;
      expect(store.dynamoDb.batchGetItem).to.have.been.calledWith({
        RequestItems: {
          'Products-Test': {
            Keys: [{
              Name: {
                S: 'Dining Chair',
              },
            }],
          },
        },
      });
    });

    it('raises an error if the request fails', async () => {
      store.dynamoDb.batchGetItem = sandbox.stub().returns({
        promise: () => Promise.reject(new Error('An Error')),
      });

      const spy = sandbox.spy();

      await store.queryByNames(['Dining Chair']).catch(spy);

      expect(store.dynamoDb.batchGetItem).to.have.been.calledOnce;
      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('querying all products', () => {
    beforeEach(() => {
      store.dynamoDb.scan = sandbox.stub().returns({
        promise: () => Promise.resolve({
          'Items': [{
            'Name': {
              S: 'Dining Chair',
            },
            'Price': {
              N: '1000',
            },
            'Articles': {
              M: {
                '1': {
                  N: '4',
                },
                '2': {
                  N: '8',
                },
                '3': {
                  N: '1',
                },
              },
            },
          }],
        }),
      });
    });

    it('scans the products table', async () => {
      const result = await store.queryAll();

      expect(result).to.deep.equal(exampleProducts.slice(0, 1));

      expect(store.dynamoDb.scan).to.have.been.calledOnce;
      expect(store.dynamoDb.scan).to.have.been.calledWith({
        TableName: 'Products-Test',
      });
    });

    it('raises an error if the request fails', async () => {
      store.dynamoDb.scan = sandbox.stub().returns({
        promise: () => Promise.reject(new Error('An Error')),
      });

      const spy = sandbox.spy();

      await store.queryAll().catch(spy);

      expect(store.dynamoDb.scan).to.have.been.calledOnce;
      expect(spy).to.have.been.calledOnce;
    });
  });

  afterEach(() => {
    sandbox.restore();
  });
});
