import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import ProductUsecaseInteractor from '@usecases/products';
import ProductStore from '@interfaces/productStore';
import {Product, ProductAmount} from '@models/product';
import {Article, ArticleAmount} from '@models/article';
import ArticleUsecaseInteractor from '@usecases/articles';
import ArticleStore from '@interfaces/articleStore';
import {NotEnoughStockError} from '@models/errors';

const {expect} = chai;

chai.use(sinonChai);

describe('Product Usecases', () => {
  let sandbox;
  let storeMock;
  let usecaseInteractor;
  let articleUsecaseInteractor;
  let articleStoreMock;
  let exampleProducts;
  let exampleArticles;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    storeMock = <ProductStore>{};
    articleStoreMock = <ArticleStore>{};
    articleUsecaseInteractor = new ArticleUsecaseInteractor(articleStoreMock);
    usecaseInteractor = new ProductUsecaseInteractor(
        storeMock,
        articleUsecaseInteractor,
    );
    exampleProducts = [
      new Product(
          'Dining Chair',
          1000,
          [
            new ArticleAmount(1, 4),
            new ArticleAmount(2, 8),
            new ArticleAmount(3, 1),
          ],
      ),
      new Product(
          'Dinning Table',
          1000,
          [
            new ArticleAmount(1, 4),
            new ArticleAmount(2, 8),
            new ArticleAmount(4, 1),
          ],
      ),
    ];
    exampleArticles = [
      new Article(1, 'leg', 12),
      new Article(2, 'screw', 17),
      new Article(3, 'seat', 2),
      new Article(4, 'table top', 1),
    ];
  });

  describe('Loading from a file', () => {
    beforeEach(() => {
      storeMock.updateProducts = sandbox.stub().resolves([]);
    });

    it('adds entities from file to store', async () => {
      const filePath = __dirname + '/../../data/products.json';

      await usecaseInteractor.updateProductsFromFile(filePath);

      expect(storeMock.updateProducts).to.have.been.calledWith(exampleProducts);
    });

    it('throws an error if file does not exist', async () => {
      const filePath = __dirname + '/../../data/nonexisting_file.json';

      const spy = sinon.spy();

      await usecaseInteractor.updateProductsFromFile(filePath).catch(spy);

      expect(spy).to.have.been.calledOnce;
    });

    it('throws an error if store errors out', async () => {
      storeMock.updateProducts = sandbox.stub().rejects(new Error('An error'));

      const filePath = __dirname + '/../../data/products.json';

      const spy = sinon.spy();

      await usecaseInteractor.updateProductsFromFile(filePath).catch(spy);

      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('getting available products', async () => {
    beforeEach(() => {
      storeMock.queryAll = sandbox.stub().resolves(exampleProducts);
      articleStoreMock.queryByIds = sandbox.stub().resolves(exampleArticles);
    });

    describe('throws an error', () => {
      it('if product store errors out', async () => {
        storeMock.queryAll = sandbox.stub().rejects(new Error('An error'));

        const spy = sinon.spy();

        await usecaseInteractor.getAvailableProducts().catch(spy);

        expect(spy).to.have.been.calledOnce;
      });

      it('if article store errors out', async () => {
        articleStoreMock.queryByIds =
          sandbox.stub().rejects(new Error('An error'));

        const spy = sinon.spy();

        await usecaseInteractor.getAvailableProducts().catch(spy);

        expect(spy).to.have.been.calledOnce;
      });
    });

    it(
        'returns products if all the contained articles ' +
        'are available each in sufficient quantity',
        async () => {
          const availableProducts =
            await usecaseInteractor.getAvailableProducts();

          expect(availableProducts).to.deep.equal(exampleProducts);
        },
    );

    describe('does not return a product', () => {
      it('if any contained article does not exist', async () => {
        articleStoreMock.queryByIds = sandbox.stub().resolves(
            exampleArticles.slice(0, 3),
        );

        const availableProducts =
          await usecaseInteractor.getAvailableProducts();

        expect(availableProducts).to.contain(exampleProducts[0]);
        expect(availableProducts).not.to.contain(exampleProducts[1]);
        expect(availableProducts).to.have.lengthOf(1);
      });

      it('if any contained article has insufficient stock', async () => {
        exampleArticles[2].stock = 0;

        const availableProducts =
          await usecaseInteractor.getAvailableProducts();

        expect(availableProducts).not.to.contain(exampleProducts[0]);
        expect(availableProducts).to.contain(exampleProducts[1]);
        expect(availableProducts).to.have.lengthOf(1);
      });
    });

    it('returns an empty array if no products are available', async () => {
      articleStoreMock.queryByIds = sandbox.stub().resolves([]);

      const availableProducts =
          await usecaseInteractor.getAvailableProducts();

      expect(availableProducts).to.have.lengthOf(0);
    });
  });

  describe('purchasing products', async () => {
    let productAmounts;
    beforeEach(() => {
      productAmounts = [new ProductAmount('Dining Chair', 5)];
      storeMock.queryByNames = sandbox.stub().resolves(
          exampleProducts.slice(0, 1),
      );
      articleStoreMock.updateAmounts = sandbox.stub().resolves(true);
    });

    describe('throws an error', () => {
      it('if product store errors out', async () => {
        storeMock.queryByNames = sandbox.stub().rejects(new Error('An error'));

        const spy = sinon.spy();

        await usecaseInteractor.purchaseProducts(productAmounts).catch(spy);

        expect(spy).to.have.been.calledOnce;
      });

      it('if article store errors out', async () => {
        articleStoreMock.updateAmounts =
          sandbox.stub().rejects(new Error('An error'));

        const spy = sinon.spy();

        await usecaseInteractor.purchaseProducts(productAmounts).catch(spy);

        expect(spy).to.have.been.calledOnce;
      });
    });

    it('returns a negative result in case of insufficient stock', async () => {
      articleStoreMock.updateAmounts.throws(
          () => new NotEnoughStockError('Insufficient stock'),
      );

      const result = await usecaseInteractor.purchaseProducts(productAmounts);

      expect(result).not.to.be.ok;
    });

    it('calls article store to reduce amounts correctly', async () => {
      productAmounts = [new ProductAmount('Dining Chair', 1)];

      const result = await usecaseInteractor.purchaseProducts(productAmounts);

      expect(result).to.be.ok;
      expect(articleStoreMock.updateAmounts).to.have.been.calledOnce;
      expect(articleStoreMock.updateAmounts).to.have.been.calledWith([
        new ArticleAmount(1, -4),
        new ArticleAmount(2, -8),
        new ArticleAmount(3, -1),
      ]);
    });

    it('can handle multiple products with different amounts', async () => {
      exampleArticles = exampleArticles.map((article) => {
        article.stock *= 1000;
        return article;
      });
      storeMock.queryByNames = sandbox.stub().resolves(exampleProducts);
      productAmounts = [
        new ProductAmount('Dining Chair', 3),
        new ProductAmount('Dinning Table', 5),
      ];

      const result = await usecaseInteractor.purchaseProducts(productAmounts);

      expect(result).to.be.ok;
      expect(articleStoreMock.updateAmounts).to.have.been.calledOnce;
      expect(articleStoreMock.updateAmounts).to.have.been.calledWith([
        new ArticleAmount(1, -(3*4 + 5*4)),
        new ArticleAmount(2, -(3*8 + 5*8)),
        new ArticleAmount(3, -(3*1)),
        new ArticleAmount(4, -(5*1)),
      ]);
    });
  });

  afterEach(() => {
    sandbox.restore();
  });
});
