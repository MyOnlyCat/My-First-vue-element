'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    target: Mixed, // 会员
    business: Mixed, // 商家
    price: Mixed, //
    category: String, // 类型  {DEPOSIT:充值, REFUND: 退款}
    status: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //暂时没有用
  return mongoose.model('memberrecords', tempSchema);
};
