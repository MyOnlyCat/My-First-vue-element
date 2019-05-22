'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    target: Mixed, // 用户
    district: Mixed, // 所在区域
    fingerPrint: String,  //指纹数据
    created: Number,
  }, {
    versionKey: false,
  });
//指纹表
  return mongoose.model('fingerprintrecords', tempSchema);
};
