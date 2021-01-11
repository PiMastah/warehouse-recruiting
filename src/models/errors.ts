class NotEnoughStockError extends Error {
  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, NotEnoughStockError.prototype);
    this.name = 'NotEnoughStock';
    this.stack = (<any> new Error()).stack;
  }
}

export {NotEnoughStockError};
