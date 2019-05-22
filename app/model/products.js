'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String, // 名称
    barcode: String, // 条码
    prices: Mixed, // 价格 {value: 普通价格，memberValue: 会员价格， memberValueDiscount: 会员折扣,
    // }
    inventory: Mixed, // 库存{value: number, unit: String}
    actor: Mixed, // 操作者
    business: Mixed, // 所属商家
    shelfNumber: String, // 货架号
    location: String, // 存放位置
    attachments: [ String ], // 附件
    description: String, // 备注
    category: String, // 类型
    status: String, // 状态
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  // 商品
  return mongoose.model('products', tempSchema);
};
