import {ArticleAmount} from '@models/article';

class ProductAmount {
  name: string
  amount: number

  constructor(name: string, amount: number) {
    this.name = name;
    this.amount = amount;
  }
}

class Product {
  name: string
  price: number
  articles: ArticleAmount[]

  constructor(name: string, price: number, articles: ArticleAmount[]) {
    this.name = name;
    this.price = price;
    this.articles = articles;
  }
}

export default Product;
export {ProductAmount, Product};
