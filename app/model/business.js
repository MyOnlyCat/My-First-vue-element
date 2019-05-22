'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    serialNumber: String, // 商家号
    name: String, // 名称
    owner: Mixed, // 拥有者
    address: String, // 地址
    contact: String, // 联系人
    phone: String, // 联系电话
    header: String, // 商家头像
    signature: String, // 个性签名
    category: String, // 商家类型
    account: Mixed, // 商家帐户
    scopeOfBussiness: String, // 经营范围
    taxId: String, // 纳税人识别号
    start: Number, // 协议签订日期
    end: Number, // 协议终止日期
    location: Mixed, // 商家地图坐标
    district: Mixed, // 所在区域
    status: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //商家表
  return mongoose.model('business', tempSchema);
};
