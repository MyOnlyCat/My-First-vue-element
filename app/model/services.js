'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    item: Mixed,  //项目
    description: String,  //服务介绍
    images: [ String ], //照片
    organization: Mixed,  //机构
    district: Mixed,      //区域
    community: Mixed,     //废弃
    project: Mixed,       //所属合同
    members: [ String ],  //暂时没有用
    price: Mixed,         //价格
    priority: Number,     //权重
    status: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //服务项目表
  return mongoose.model('services', tempSchema);
};
