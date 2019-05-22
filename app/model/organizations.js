'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,       //机构名
    description: String,  //公司简介
    phone: String,        //联系电话
    address: String,      //公司地址
    image: [ String ],    //机构图片
    qualified: Mixed,
    header: String, //机构头像
    area: [ Mixed ],    //服务区域(废弃), 现在直接从project里面取
    canProvideService: [ Mixed ], //可提供的服务(废弃)
    scale:String, //规模
    location: [ Number ],
    comment: String,
    status: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //机构表
  return mongoose.model('organizations', tempSchema);
};
