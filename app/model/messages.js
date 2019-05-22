'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    sender: Mixed,
    content: Mixed,
    organization: Mixed,
    status: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //消息记录
  return mongoose.model('messages', tempSchema);
};
