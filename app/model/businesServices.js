'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    business: Mixed, // 商家
    name: String, // 服务项目
    prices: Mixed, // 价格 {unit: 价格单位, value: 普通价格，memberValue: 会员价格， memberValueDiscount: 会员折扣,
    // category:"MULTI"，“SINGLE”, categoryUnit:类型单位, count:次数}
    attachments: [ String ], // 附件
    description: String,
    category: String, // 服务类型
    status: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //商家服务项目表
  return mongoose.model('businesservices', tempSchema);
};
