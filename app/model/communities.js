'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    province: String,
    provinceAdCode: String,
    city: String,
    cityAdCode: String,
    area: String,
    areaAdCode: String,
    community: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //这个表相关内容废弃
  return mongoose.model('communities', tempSchema);
};
