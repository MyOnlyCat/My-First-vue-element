'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    short: String,
    description: String,
    value: String,
    codeType: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  //字典表
  return mongoose.model('codes', tempSchema);
};
