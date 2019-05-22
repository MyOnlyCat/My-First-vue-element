'use strict';
const DaoService = require('./daoService');

class BusinessService extends DaoService {
  init() {
    this.model = this.ctx.model.Business;
  }

  async create(record) {
    const numbers = await this.generateNo(1);
    record.serialNumber = numbers[0];
    return super.create(record);
  }

  async generateNo(number) {
    const result = [];
    const serialNumStr = '100001';
    let serialNum = Number.parseInt(serialNumStr);

    const record = await this.model.find({ }).sort({ serialNumber: -1 }).limit(1);
    if (record.length > 0) {
      const latestRecord = record[0];
      if (Number.isInteger(latestRecord.serialNumber)) {
        serialNum = (latestRecord.serialNumber + 1);
      }
    }

    for (let i = 0; i < number; i++) {
      result.push((serialNum + i));
    }

    return result;
  }


}
module.exports = BusinessService;
