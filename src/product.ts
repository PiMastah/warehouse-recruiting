class ArticleAmount {
  id: number
  amount: number

  constructor(id: number, amount: number) {
    this.id = id
    this.amount = amount
  }
}

class Product {
  name: String
  price: number
  articles: ArticleAmount[]

  constructor(name: String, price: number, articles) {
    this.name = name
    this.price = price
    this.articles = articles
  }
}

export default Product
export { ArticleAmount, Product }