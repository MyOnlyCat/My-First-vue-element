'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    provider: Mixed, // 服务人员
    evaluation: Number,//服务评价
    orderCount: Number, // 服务订单次数
    orderItemCount: Number, // 服务项目次数
    totalMoney: Number, // 服务总金额
    service: [Mixed],
    project: Mixed, // 合同 包括organization
    district: Mixed, // 合同 包括organization
    date: String, //时间YYYY-MM-DD
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  return mongoose.model('statisticbyproviders', tempSchema);
};
