import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import {Article, ArticleAmount} from '@models/article';
import ArticlesDynamoDbStore from '@infrastructure/dynamoDbArticles';

const {expect} = chai;

chai.use(sinonChai);

describe('Article DynamoDb Store', () => {
  let sandbox;
  let store;
  let exampleArticles;
  beforeEach(() => {
    store = new ArticlesDynamoDbStore('Articles-Test');
    sandbox = sinon.createSandbox();
    store.dynamoDb = sandbox.stub();

    exampleArticles = [
      new Article(1, 'leg', 12),
      new Article(2, 'screw', 17),
      new Article(3, 'seat', 2),
      new Article(4, 'table top', 1),
    ];
  });

  describe('updating articles', () => {
    beforeEach(() => {
      store.dynamoDb.batchWriteItem = sandbox.stub().returns({
        promise: () => Promise.resolve({}),
      });
    });

    it('generates a BatchWriteRequest', async () => {
      await store.updateArticles(exampleArticles.slice(0, 1));

      expect(store.dynamoDb.batchWriteItem).to.have.been.calledOnce;
      expect(store.dynamoDb.batchWriteItem).to.have.been.calledWith({
        RequestItems: {
          'Articles-Test': [{
            PutRequest: {
              Item: {
                'Id': {
                  N: '1',
                },
                'Name': {
                  S: 'leg',
                },
                'Stock': {
                  N: '12',
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

      await store.updateArticles(exampleArticles.slice(0, 1)).catch(spy);

      expect(store.dynamoDb.batchWriteItem).to.have.been.calledOnce;
      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('updating amounts', () => {
    beforeEach(() => {
      store.dynamoDb.transactWriteItems = sandbox.stub().returns({
        promise: () => Promise.resolve(),
      });
    });

    it('generates a TransactWriteRequest', async () => {
      await store.updateAmounts([new ArticleAmount(1, 10)]);

      expect(store.dynamoDb.transactWriteItems).to.have.been.calledOnce;
      expect(store.dynamoDb.transactWriteItems).to.have.been.calledWith({
        TransactItems: [{
          Update: {
            Key: {
              'Id': {
                N: '1',
              },
            },
            TableName: 'Articles-Test',
            UpdateExpression: 'ADD #Stock :delta',
            ExpressionAttributeNames: {
              '#Stock': 'Stock',
            },
            ExpressionAttributeValues: {
              ':delta': {
                N: '10',
              },
            },
          },
        }],
      });
    });

    it('generates a condition for amounts < 0', async () => {
      await store.updateAmounts([new ArticleAmount(1, -10)]);

      expect(store.dynamoDb.transactWriteItems).to.have.been.calledOnce;
      expect(store.dynamoDb.transactWriteItems).to.have.been.calledWith({
        TransactItems: [{
          Update: {
            Key: {
              'Id': {
                N: '1',
              },
            },
            TableName: 'Articles-Test',
            UpdateExpression: 'ADD #Stock :delta',
            ConditionExpression: '#Stock >= :negativedelta',
            ExpressionAttributeNames: {
              '#Stock': 'Stock',
            },
            ExpressionAttributeValues: {
              ':delta': {
                N: '-10',
              },
              ':negativedelta': {
                N: '10',
              },
            },
          },
        }],
      });
    });

    it('raises an error if the request fails', async () => {
      store.dynamoDb.transactWriteItems = sandbox.stub().returns({
        promise: () => Promise.reject(new Error('An Error')),
      });

      const spy = sandbox.spy();

      await store.updateAmounts([new ArticleAmount(1, 10)]).catch(spy);

      expect(store.dynamoDb.transactWriteItems).to.have.been.calledOnce;
      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('querying article Ids', () => {
    beforeEach(() => {
      store.dynamoDb.batchGetItem = sandbox.stub().returns({
        promise: () => Promise.resolve({
          'Responses': {
            'Articles-Test': [{
              'Id': {
                N: '1',
              },
              'Name': {
                S: 'leg',
              },
              'Stock': {
                N: '12',
              },
            }],
          },
        }),
      });
    });

    it('generates a BatchGetRequest', async () => {
      const result = await store.queryByIds([1]);

      expect(result).to.deep.equal(exampleArticles.slice(0, 1));

      expect(store.dynamoDb.batchGetItem).to.have.been.calledOnce;
      expect(store.dynamoDb.batchGetItem).to.have.been.calledWith({
        RequestItems: {
          'Articles-Test': {
            Keys: [{
              Id: {
                N: '1',
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

      await store.queryByIds([1]).catch(spy);

      expect(store.dynamoDb.batchGetItem).to.have.been.calledOnce;
      expect(spy).to.have.been.calledOnce;
    });
  });

  afterEach(() => {
    sandbox.restore();
  });
});
