import {expect} from 'chai';
import Article from '@models/article';

describe('Article', () => {
  describe('properties', () => {
    let article; let articleId; let articleName; let articleStock;

    beforeEach(() => {
      articleId = 123;
      articleName = 'example article1';
      articleStock = 5;
      article = new Article(articleId, articleName, articleStock);
    });

    it('has an id', () => {
      expect(article).to.have.own.property('id', articleId);
    });

    it('has a name', () => {
      expect(article).to.have.own.property('name', articleName);
    });

    it('has a stock', () => {
      expect(article).to.have.own.property('stock', articleStock);
    });
  });
});
