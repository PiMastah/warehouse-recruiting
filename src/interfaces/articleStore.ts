import {Article, ArticleAmount} from '@models/article';

interface ArticleStore {
  updateArticles: (articles: Article[]) => Promise<boolean>
  updateAmounts: (articleAmounts: ArticleAmount[]) => Promise<boolean>
  queryByIds: (articleIds: number[]) => Promise<Article[]>
}

export default ArticleStore;
