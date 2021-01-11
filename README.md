# Warehouse Software

This repository contians code for an assessment (see Assignment.md) during a recruitment process. The code base strives to adhere to the Clean Architecture principles.

## Setup

### node package dependencies

`npm install`

Code developed and tested with Node v14.15.4

### terraform resources

Assuming AWS provider configuration is done via credentials & config files or ENV params (namely AWS access & secret key as well as region):

`terraform apply`

This will setup the two required tables for the demo code (s. below).

Code developed and tested with Terraform v0.14.2 & provider registry.terraform.io/hashicorp/aws v3.23.0

## Running Tests

`npm run test`

### Example output:

```
  Article DynamoDb Store
    updating articles
      √ generates a BatchWriteRequest
      √ raises an error if the request fails
    updating amounts
      √ generates a TransactWriteRequest
      √ generates a condition for amounts < 0
      √ raises an error if the request fails
    querying article Ids
      √ generates a BatchGetRequest
      √ raises an error if the request fails

  Products DynamoDb Store
    updating products
      √ generates a BatchWriteRequest
      √ raises an error if the request fails
    querying product Names
      √ generates a BatchGetRequest
      √ raises an error if the request fails
    querying all products
      √ scans the products table
      √ raises an error if the request fails

  Article
    properties
      √ has an id
      √ has a name
      √ has a stock

  Product
    properties
      √ has a name
      √ has a price
      √ has contained articles

  Article Usecases
    Loading from a file
      √ adds entities from file to store
      √ throws an error if file does not exist
      √ throws an error if store errors out
    Querying amounts by IDs
      √ calls the store with the correct parameters
      √ throws an error if store errors out

  Product Usecases
    Loading from a file
      √ adds entities from file to store
      √ throws an error if file does not exist
      √ throws an error if store errors out
    getting available products
      √ returns products if all the contained articles are available each in sufficient quantity
      √ returns an empty array if no products are available
      throws an error
        √ if product store errors out
        √ if article store errors out
      does not return a product
        √ if any contained article does not exist
        √ if any contained article has insufficient stock
    purchasing products
      √ returns a negative result in case of insufficient stock
      √ calls article store to reduce amounts correctly
      √ can handle multiple products with different amounts
      throws an error
        √ if product store errors out
        √ if article store errors out


  38 passing (79ms)
```

## Linting

`npm run lint`

Automatically fixes fixable errors, outputs rule violations.

## Code Demo

`npm run demo`

This code takes the entities configured in the data folder, puts them into the relevant tables and showcases the usage of most relevant methods.

## Open Topics

- input validation is (mostly) not added yet
- no logging implemented yet
- no application metrics available
- Currently no checks for limits of item amount in DynamoDB methods (e.g. buying products with more than 25 contained distinct articles, getting more than 100 items at once, updating more than 25 items at once will currently lead to breakage and is not handled properly)
- currently only unit tests, demo code could be further refined into an integration test suite
- test fixtures should be refactored out of the actual tests due to repetition and for better readability

## Notes / Thoughts

- Prices have been added to the JSON file representing example products
- Article stocks are updated using a transaction (e.g. in case of buying products) as to avoid handling partial purchases and allowing service scaling without side effects
- Using this code base, it should be fairly easy to provide an API over HTTP by extracting model instances from request bodies and using the relevant usecase interactor methods

### Further infrastrucutre topics

- building a docker image
- setting up an ECS/EKS service + load balancer
- CI/CD pipelines
- API Gateway
- Cognito Integration (e.g. for exposing certain endpoints like updating available stock only to certain roles)
