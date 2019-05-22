'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    callUser: Mixed,  //打电话的人
    actor: Mixed, //接话员
    bookOrder: Mixed, //订单
    comment: String,  
    category: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //通话记录
  return mongoose.model('callrecords', tempSchema);
};
