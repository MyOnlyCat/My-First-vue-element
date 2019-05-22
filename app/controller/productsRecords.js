'use strict';
const CommonController = require('./commonController');

class ProductsRecordController extends CommonController {
  init() {
    this.daoService = this.service.productsRecords;
  }

  async create(ctx) {
    const record = ctx.request.body;
    ctx.body = await this.createOne(record);
  }

  async bulk(ctx) {
    const records = ctx.request.body;
    records.map(async record => {
      await this.createOne(record);
    });
    this.success();
  }

  async createOne(record) {
    const result = await this.daoService.create(record);
    record.products.map(async p => {
      let count = Number.parseInt(p.count);
      switch (record.category) {
        case 'ENTER':
        case 'RETURN':
          break;
        case 'REQUISITION':
        case 'SCRAP':
          count = -(record.count);
          break;
      }

      await this.service.products.findOneAndUpdateById(p._id, { $inc: { 'inventory.value': count } });
    });

    return result;
  }

  // 取消
  async cancel(ctx) {
    const oldRecord = await this.daoService.show(ctx.params.id);
    oldRecord.products.map(async p => {
      let count = Number.parseInt(p.count);
      switch (oldRecord.category) {
        case 'ENTER':
        case 'RETURN':
          break;
        case 'REQUISITION':
        case 'SCRAP':
          count = -(oldRecord.count);
          break;
      }

      await this.service.products.findOneAndUpdateById(p._id, { $inc: { 'inventory.value': -count } });
    });

    ctx.body = await this.daoService.update(ctx.params.id, { status: 'CANCEL' });
  }

}
module.exports = ProductsRecordController;
