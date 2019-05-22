'use strict';
const DaoService = require('./daoService');

class ProductsService extends DaoService {
  init() {
    this.model = this.ctx.model.Products;
  }

  async groupByField(query) {
    const queryParams = this.queryCriteria(query);
    const field = query.metric.field;
    const results = await this.model.aggregate(
      [
        {
          $match: queryParams,
        },
        {
          $group: {
            _id: { [field]: `$${field}` },
          },
        },

      ]
    );
    return results;
  }
}
module.exports = ProductsService;
