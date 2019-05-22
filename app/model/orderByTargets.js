'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    target: Mixed, // 老人
    project: Mixed, // 合同 包括organization
    // evaluation: Number,//服务评价
    // orderCount: Number, // 服务订单次数
    // orderItemCount: Number, // 服务项目次数
    // totalMoney: Number, // 服务总金额
    // date: String, //时间YYYY-MM-DD
    orders: [Mixed],
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  tempSchema.index({ 'target._id': -1, 'project._id': -1 });

  //暂时没有用
  return mongoose.model('orderbytargets', tempSchema);
};
