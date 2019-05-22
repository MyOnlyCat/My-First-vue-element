'use strict';
const DaoService = require('./daoService');

class MemberRecordsService extends DaoService {
  init() {
    this.model = this.ctx.model.MemberRecords;
  }

  async countMoney(query) {
    const queryCriteria = this.queryCriteria(query);

    const results = await this.model.aggregate([{
      $match: queryCriteria,
    },
    { $group: { _id: null, totalMoney: { $sum: '$price.value' } } },
    ]);
    if (results[0]) {
      return results[0];
    }
    return { totalMoney: 0 };

  }
}
module.exports = MemberRecordsService;
