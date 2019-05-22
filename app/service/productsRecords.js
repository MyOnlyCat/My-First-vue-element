'use strict';
const DaoService = require('./daoService');

class ProductsRecordService extends DaoService {
  init() {
    this.model = this.ctx.model.ProductsRecords;
  }
}
module.exports = ProductsRecordService;
