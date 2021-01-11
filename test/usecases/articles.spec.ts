import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import ArticlesUsecaseInteractor from '@usecases/articles';
import ArticleStore from '@interfaces/articleStore';
import Article from '@models/article';

const {expect} = chai;

chai.use(sinonChai);

describe('Article Usecases', () => {
  let sandbox; let storeMock; let usecaseInteractor;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    storeMock = <ArticleStore>{};
  });

  describe('Loading from a file', () => {
    beforeEach(() => {
      storeMock.updateArticles = sandbox.stub().resolves([]);
      usecaseInteractor = new ArticlesUsecaseInteractor(storeMock);
    });

    it('adds entities from file to store', async () => {
      const filePath = __dirname + '/../../data/inventory.json';

      await usecaseInteractor.updateArticlesFromFile(filePath);

      expect(storeMock.updateArticles).to.have.been.calledWith([
        new Article(1, 'leg', 12),
        new Article(2, 'screw', 17),
        new Article(3, 'seat', 2),
        new Article(4, 'table top', 1),
      ]);
    });

    it('throws an error if file does not exist', async () => {
      const filePath = __dirname + '/../../data/nonexisting_file.json';

      const spy = sinon.spy();

      await usecaseInteractor.updateArticlesFromFile(filePath).catch(spy);

      expect(spy).to.have.been.calledOnce;
    });

    it('throws an error if store errors out', async () => {
      storeMock.updateArticles = sandbox.stub().rejects(new Error('An error'));

      const filePath = __dirname + '/../../data/inventory.json';

      const spy = sinon.spy();

      await usecaseInteractor.updateArticlesFromFile(filePath).catch(spy);

      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('Querying amounts by IDs', async () => {
    beforeEach(() => {
      storeMock.queryByIds = sandbox.stub().resolves([]);
      usecaseInteractor = new ArticlesUsecaseInteractor(storeMock);
    });

    it('calls the store with the correct parameters', async () => {
      await usecaseInteractor.getArticles([1, 2, 3]);

      expect(storeMock.queryByIds).to.have.been.calledWith([1, 2, 3]);
    });

    it('throws an error if store errors out', async () => {
      storeMock.queryByIds = sandbox.stub().rejects(new Error('An error'));

      const spy = sinon.spy();

      await usecaseInteractor.getArticles([1, 2, 3]).catch(spy);

      expect(spy).to.have.been.calledOnce;
    });
  });

  afterEach(() => {
    sandbox.restore();
  });
});
