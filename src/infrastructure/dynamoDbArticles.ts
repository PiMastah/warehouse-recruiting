import ArticleStore from '@interfaces/articleStore';
import {Article, ArticleAmount} from '@models/article';
import {NotEnoughStockError} from '@models/errors';
import * as AWS from 'aws-sdk';

const parseArticle = (item) => new Article(
    parseInt(item.Id.N, 10),
    item.Name.S,
    parseInt(item.Stock.N, 10),
);

class ArticlesDynamoDbStore implements ArticleStore {
  dynamoDb = new AWS.DynamoDB()
  tableName: string

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async updateArticles(articles: Article[]): Promise<boolean> {
    const items: AWS.DynamoDB.Types.WriteRequests = articles.map((article) => {
      return {
        PutRequest: {
          Item: {
            'Id': {
              N: article.id.toString(),
            },
            'Name': {
              S: article.name,
            },
            'Stock': {
              N: article.stock.toString(),
            },
          },
        },
      };
    });

    const params: AWS.DynamoDB.Types.BatchWriteItemInput = {
      RequestItems: {
        [this.tableName]: items,
      },
    };

    const makeRequest = async (params) => {
      const res = await this.dynamoDb.batchWriteItem(params).promise();
      if (
        res.UnprocessedItems &&
        Object.keys(res.UnprocessedItems).length > 0
      ) {
        await makeRequest({
          RequestItems: res.UnprocessedItems,
        });
      }
    };

    await makeRequest(params);

    return true;
  }

  async updateAmounts(articleAmounts: ArticleAmount[]): Promise<boolean> {
    const params = {
      TransactItems: articleAmounts.map((articleAmount) => {
        const item = {
          Update: {
            Key: {
              'Id': {
                N: articleAmount.id.toString(),
              },
            },
            TableName: this.tableName,
            UpdateExpression: 'ADD #Stock :delta',
            ExpressionAttributeNames: {
              '#Stock': 'Stock',
            },
            ExpressionAttributeValues: {
              ':delta': {
                N: articleAmount.amount.toString(),
              },
            },
          },
        };

        if (articleAmount.amount < 0) {
          item.Update['ConditionExpression'] = '#Stock >= :negativedelta';
          item.Update.ExpressionAttributeValues[':negativedelta'] = {
            N: Math.abs(articleAmount.amount).toString(),
          };
        }

        return item;
      }),
    };

    try {
      await this.dynamoDb.transactWriteItems(params).promise();
    } catch (e) {
      if (e.name == 'TransactionCanceledException') {
        throw new NotEnoughStockError('Insufficient Stock to fulfill request');
      }
      throw e;
    }

    return true;
  }

  async queryByIds(articleIds: number[]): Promise<Article[]> {
    const items: AWS.DynamoDB.Types.KeysAndAttributes = {
      Keys: articleIds.map((id) => {
        return {
          Id: {
            N: id.toString(),
          },
        };
      }),
    };

    const params: AWS.DynamoDB.Types.BatchGetItemInput = {
      RequestItems: {
        [this.tableName]: items,
      },
    };

    const makeRequest = async (params) => {
      const res = await this.dynamoDb.batchGetItem(params).promise();
      const items = res.Responses[this.tableName].map(parseArticle);
      if (
        res.UnprocessedKeys &&
        Object.keys(res.UnprocessedKeys).length > 0
      ) {
        const otherItems = await makeRequest({
          RequestItems: res.UnprocessedKeys,
        });
        return items.concat(otherItems);
      }
      return items;
    };

    const result = await makeRequest(params);

    return result;
  }
}

export default ArticlesDynamoDbStore;
