class ArticleAmount {
  id: number
  amount: number

  constructor(id: number, amount: number) {
    this.id = id;
    this.amount = amount;
  }
}

class Article {
  id: number
  name: string
  stock: number

  constructor(id: number, name: string, stock) {
    this.id = id;
    this.name = name;
    this.stock = stock;
  }
}

export default Article;
export {ArticleAmount, Article};
