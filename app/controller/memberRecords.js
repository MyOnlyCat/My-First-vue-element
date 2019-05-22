'use strict';
const CommonController = require('./commonController');

//暂时没有用
class MemberRecordsController extends CommonController {
  init() {
    this.daoService = this.service.memberRecords;
  }

  // 会员充，退费记录
  async create(ctx) {
    const record = ctx.request.body;
    const user = await this.service.users.show(record.target._id);
    if (!user) {
      this.fail('用户末找到', 404);
      return;
    }

    let money = 0;

    switch (record.category) {
      case 'DEPOSIT':
        money = record.price.value;
        break;
      case 'REFUND':
        money = -record.price.value;
        break;
    }

    let account = user.memberAccount;
    if (!account) {
      account = { value: 0, unit: '元' };
    }

    if (Number.isNaN(account.value)) {
      account.value = 0;
    }
    account.value = Number.parseFloat((account.value + money).toFixed(2));

    await this.service.users.update(record.target._id, { memberAccount: account });

    ctx.body = await this.daoService.create(record);
  }

  // 统计钱
  async countMoney(ctx) {
    ctx.body = await this.daoService.countMoney(ctx.request.body);
  }

  async update(ctx) {
    const oldRecord = await this.daoService.show(ctx.params.id);
    const updateParams = ctx.request.body;
    let oldMoney = 0;
    switch (oldRecord.category) {
      case 'DEPOSIT':
        oldMoney = oldRecord.price.value;
        break;
      case 'REFUND':
        oldMoney = -oldRecord.price.value;
        break;
    }
    let newMoney = 0;
    switch (updateParams.category) {
      case 'DEPOSIT':
        newMoney = updateParams.price.value;
        break;
      case 'REFUND':
        newMoney = -updateParams.price.value;
        break;
    }

    if (newMoney && newMoney != oldMoney) {
      const sumValue = Number.parseFloat((newMoney - oldMoney).toFixed(2));
      await this.service.users.findOneAndUpdateById(oldRecord.target._id, { $inc: { 'memberAccount.value': sumValue } });
    }
    await super.update(ctx);
  }

  // 取消
  async cancel(ctx) {
    const oldRecord = await this.daoService.show(ctx.params.id);
    let oldMoney = 0;
    switch (oldRecord.category) {
      case 'DEPOSIT':
        oldMoney = oldRecord.price.value;
        break;
      case 'REFUND':
        oldMoney = -oldRecord.price.value;
        break;
    }

    await this.service.users.findOneAndUpdateById(oldRecord.target._id, { $inc: { 'memberAccount.value': -oldMoney } });
    ctx.body = await this.daoService.update(ctx.params.id, { status: 'CANCEL' });
  }
}
module.exports = MemberRecordsController;
