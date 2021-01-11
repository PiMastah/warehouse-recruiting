provider "aws" {
  region = "eu-central-1"
}

resource "aws_dynamodb_table" "articles" {
  name           = "Articles"
  billing_mode   = "PAY_PER_REQUEST"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "Id"

  attribute {
    name = "Id"
    type = "N"
  }
}

resource "aws_dynamodb_table" "products" {
  name           = "Products"
  billing_mode   = "PAY_PER_REQUEST"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "Name"

  attribute {
    name = "Name"
    type = "S"
  }
}
