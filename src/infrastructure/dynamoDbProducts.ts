import ProductStore from '@interfaces/productStore';
import {ArticleAmount} from '@models/article';
import Product from '@models/product';
import * as AWS from 'aws-sdk';

const parseProduct = (item) => new Product(
    item.Name.S,
    parseInt(item.Price.N, 10),
    Object.entries(item.Articles.M).map(
        (entry) => {
          return new ArticleAmount(
              parseInt(entry[0], 10),
              parseInt(entry[1]['N'], 10),
          );
        },
    ),
);

class ProductsDynamoDbStore implements ProductStore {
  dynamoDb = new AWS.DynamoDB()
  tableName: string

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async updateProducts(products: Product[]): Promise<boolean> {
    const items: AWS.DynamoDB.Types.WriteRequests = products.map((product) => {
      return {
        PutRequest: {
          Item: {
            'Name': {
              S: product.name,
            },
            'Price': {
              N: product.price.toString(),
            },
            'Articles': {
              M: product.articles.reduce((acc, articleAmount) => {
                acc[articleAmount.id] = {
                  N: articleAmount.amount.toString(),
                };
                return acc;
              }, {}),
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
  async queryByNames(productNames: string[]): Promise<Product[]> {
    const items: AWS.DynamoDB.Types.KeysAndAttributes = {
      Keys: productNames.map((name) => {
        return {
          Name: {
            S: name,
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
      const items = res.Responses[this.tableName].map(parseProduct);
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

  async queryAll(): Promise<Product[]> {
    const makeRequest =
      async (startKey?: AWS.DynamoDB.Types.Key): Promise<Product[]> => {
        const params = {
          TableName: this.tableName,
        };

        if (startKey) {
          params['ExclusiveStartKey'] = startKey;
        }

        const result = await this.dynamoDb.scan(params).promise()
            .then(async (res) => {
              const items = res.Items.map(parseProduct);

              if (res.LastEvaluatedKey) {
                const otherResult = await makeRequest(res.LastEvaluatedKey);

                return items.concat(otherResult);
              }

              return items;
            });

        return result;
      };

    const result = await makeRequest();

    return result;
  }
}

export default ProductsDynamoDbStore;
