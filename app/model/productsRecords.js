'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    products: [ Mixed ], // 物资{_id: String, name: String, price: {}, count: number}
    price: Mixed, // 总价
    business: Mixed, // 商家
    actor: Mixed, // 操作人
    target: Mixed, // 用户
    comment: String, // 备注
    attachments: [ String ], // 附件
    category: String, // 出入类型
    // ENTER:入库，SALE:销售， SCRAP:报废
    status: String, // 状态
    expire: Number, // 过期日期
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  // 商品记录
  return mongoose.model('productsrecords', tempSchema);
};
