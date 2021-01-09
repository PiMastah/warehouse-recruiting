import { expect } from 'chai'
import * as sinon from 'sinon'
import { Product, ArticleAmount } from '../src/product'

describe('Product', () => {
  describe('properties', () => {  
    let product, productName, productPrice, articleAmounts

    beforeEach(() => {
      productName = 'example product'
      productPrice = 1099
      articleAmounts = [new ArticleAmount(23, 10), new ArticleAmount(42, 1)]
      product = new Product(productName, productPrice, articleAmounts)
    })
   
    it('has a name', () => {
      expect(product).to.have.own.property('name', productName)
    })

    it('has a price', () => {
      expect(product).to.have.own.property('price', productPrice)
    })

    it('has contained articles', () => {
      expect(product).to.have.own.property('articles', articleAmounts)
    })
  })
})