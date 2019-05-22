'use strict';
const xlsx = require('node-xlsx').default;
const fs = require('fs');
const moment = require('moment');
const CommonController = require('./commonController');

class BusinesOrdersController extends CommonController {
  init() {
    this.daoService = this.service.businesOrders;
  }
  getRecordValue(record) {
    const result = {};
    switch (record.category) {
      case 'DEPOSIT':
        result.money = record.price.value;
        result.point = record.price.point;
        break;
      case 'REFUND':
      case 'CONSUME':
        result.money = -record.price.value;
        result.point = -record.price.point;
        result.returnPoint = record.price.returnPoint;
        break;
    }
    return result;
  }
  // 创建商家订单交易记录
  async create(ctx) {
    const record = ctx.request.body;
    const user = await this.service.users.show(record.target._id);
    if (!user) {
      this.fail('用户末找到', 404);
      return;
    }
    const business = await this.service.business.show(record.business._id);
    if (!business) {
      this.fail('商家末找到', 404);
      return;
    }

    const money = this.getRecordValue(record);

    const account = this.getAccount(user.memberAccount);

    if (money.money) {
      //钱
      account.value = Number.parseFloat((account.value + money.money).toFixed(2));
    }
    if (money.point) {
      //积分
      account.point = Number.parseFloat((account.point + money.point).toFixed(2));
    }
    if (money.returnPoint) {
      //返回积分
      account.point = Number.parseFloat((account.point + money.returnPoint).toFixed(2));
    }
    //更新用户
    await this.service.users.update(record.target._id, { memberAccount: account });

    if (record.category == 'CONSUME') { // 消费
      const bAccount = this.getAccount(business.account);

      if (money.money) {
        bAccount.value = Number.parseFloat((bAccount.value - money.money).toFixed(2));
      }
      if (money.point) {
        bAccount.point = Number.parseFloat((bAccount.point - money.point).toFixed(2));
      }
      //更新商家
      await this.service.business.update(record.business._id, { account: bAccount });
    }
    //创建交易记录
    const result = await this.daoService.create(record);
    if (record.district) {
      record._id = result._id;
      const district = record.district;
      //通过socket推送新交易记录
      await this.service.sockets.emitRoomsByDistrict(district, 'newBusinesOrder', record);
    }
    ctx.body = result;
  }

  getAccount(account) {
    if (!account) {
      account = { value: 0, point: 0 };
    }
    if (!account.value) {
      account.value = 0;
    }
    if (!account.point) {
      account.point = 0;
    }
    return account;
  }

  /**
   * 更新交易记录
   * @param {*} ctx 
   */
  async update(ctx) {
    const oldRecord = await this.daoService.show(ctx.params.id);
    const updateParams = ctx.request.body;

    const oldMoney = this.getRecordValue(oldRecord);

    const newMoney = this.getRecordValue(updateParams);

    if (newMoney && newMoney != oldRecord.money) {//更改了钱,要在用户和商家重新算钱,积分,返回积分
      let money = 0;
      let point = 0;
      let bussinessPoint = 0;
      if (oldMoney.money) {
        money = Number.parseFloat((money - oldMoney.money).toFixed(2));
      }
      if (oldMoney.point) {
        point = Number.parseFloat((point - oldMoney.point).toFixed(2));
        bussinessPoint = Number.parseFloat((bussinessPoint - oldMoney.point).toFixed(2));
      }
      if (oldMoney.returnPoint) {
        point = Number.parseFloat((point - oldMoney.returnPoint).toFixed(2));
      }

      if (newMoney.money) {
        money = Number.parseFloat((money + newMoney.money).toFixed(2));
      }
      if (newMoney.point) {
        point = Number.parseFloat((point + newMoney.point).toFixed(2));
        bussinessPoint = Number.parseFloat((bussinessPoint + newMoney.point).toFixed(2));
      }
      if (newMoney.returnPoint) {
        point = Number.parseFloat((point + newMoney.returnPoint).toFixed(2));
      }

      await this.service.users.findOneAndUpdateById(oldRecord.target._id, { $inc: { 'memberAccount.value': money } });
      await this.service.users.findOneAndUpdateById(oldRecord.target._id, { $inc: { 'memberAccount.point': point } });
      if (oldRecord.category == 'CONSUME') { // 消费
        await this.service.business.findOneAndUpdateById(oldRecord.business._id, { $inc: { 'account.value': -money } });
        await this.service.business.findOneAndUpdateById(oldRecord.business._id, { $inc: { 'account.point': -bussinessPoint } });
      }
    }
    await super.update(ctx);
  }

  // 取消
  async cancel(ctx) {
    const oldRecord = await this.daoService.show(ctx.params.id);
    const oldMoney = this.getRecordValue(oldRecord);
    let money = 0;
    let point = 0;
    let bussinessPoint = 0;
    if (oldMoney.money) {
      money = Number.parseFloat((money + oldMoney.money).toFixed(2));
    }
    if (oldMoney.point) {
      point = Number.parseFloat((point + oldMoney.point).toFixed(2));
      bussinessPoint = Number.parseFloat((bussinessPoint + oldMoney.point).toFixed(2));
    }
    if (oldMoney.returnPoint) {
      point = Number.parseFloat((point + oldMoney.returnPoint).toFixed(2));
    }

    await this.service.users.findOneAndUpdateById(oldRecord.target._id, { $inc: { 'memberAccount.value': -money } });
    await this.service.users.findOneAndUpdateById(oldRecord.target._id, { $inc: { 'memberAccount.point': -point } });
    if (oldRecord.category == 'CONSUME') { // 消费
      await this.service.business.findOneAndUpdateById(oldRecord.business._id, { $inc: { 'account.value': money } });
      await this.service.business.findOneAndUpdateById(oldRecord.business._id, { $inc: { 'account.point': bussinessPoint } });
    }
    ctx.body = await this.daoService.update(ctx.params.id, { status: 'CANCEL' });
  }

  // 统计钱
  async countMoney(ctx) {
    ctx.body = await this.daoService.countMoney(ctx.request.body);
  }

  // 导出excel
  async exportTransitionToExcel(ctx) {
    const margin = { left: 0.75, right: 0.75, top: 1, bottom: 1, footer: 0.509722222222222, header: 0.509722222222222 };
    const range1 = { s: { c: 0, r: 0 }, e: { c: 6, r: 0 } };
    const range2 = { s: { c: 6, r: 1 }, e: { c: 0, r: 1 } };
    const option = { '!merges': [ range1, range2 ], '!ref': 'A1:G3', '!margins': margin };

    const query = this.daoService.queryCriteria(ctx.request.body);
    const times = {};
    if (!query.created) {
      this.fail('请选择时间范围', 417);
      return;
    }
    times.start = query.created.$gte;
    times.end = query.created.$lte;
    const start = moment(times.start);
    const end = moment(times.end);
    if (start.add(1, 'year').isBefore(end)) {
      this.fail('时间范围不能超过一年', 417);
      return;
    }


    let transitions = await this.daoService.find(query);
    const categorys = { DEPOSIT: '充值', REFUND: '退款', CONSUME: '消费' };
    transitions = transitions.map((t, index) => {
      return [ index + 1, t.target.name, t.target.isHCS !== false ? '居家养老人员' : '普通会员', t.target.identityNumber, categorys[t.category], t.price.value, this.formatDate(t.created) ];
    });
    const data = [[ '交易记录' ], [ `时间范围：${this.formatDate(times.start)}-${this.formatDate(times.end)}` ], [ '序号', '会员姓名', '会员类型', '会员身份证号', '交易类型', '交易金额', '交易时间' ], ...transitions ];

    const buffer = xlsx.build([{ name: '交易记录', data }], option); // Returns a buffer

    ctx.set('Content-Type', 'application/octet-stream');
    // ctx.set('Content-Length', fileMeta.length);
    ctx.attachment('test.xlsx');
    ctx.body = buffer;
  }

  formatDate(date) {
    if (!date) {
      return '';
    }
    return moment(date).format('YYYY-MM-DD HH:mm');
  }


}
module.exports = BusinesOrdersController;
