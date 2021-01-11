import Product from '@models/product';

interface ProductStore {
  updateProducts: (products: Product[]) => Promise<boolean>
  queryByNames: (productNames: string[]) => Promise<Product[]>
  queryAll: () => Promise<Product[]>
}

export default ProductStore;
