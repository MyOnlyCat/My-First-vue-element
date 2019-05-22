'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    business: Mixed, // 商家
    target: Mixed, // 用户
    district: Mixed, // 地域
    service: [ Mixed ], // 服务项目
    price: Mixed, // 总价
    category: String, // 类型  {DEPOSIT:充值, REFUND: 退款， CONSUME: 消费}
    status: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //商家订单表
  return mongoose.model('businesorders', tempSchema);
};
