'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    appName: String,  //app名称	
    version: String,  //版本
    versionCode: Number,//版本号
    template: String,    //更新内容
    forceUpdate: Boolean, //强制更新
    url: String,          //下载url
    platform: String,     //平台
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //版本表,为app升级使用
  return mongoose.model('versions', tempSchema);
};
