'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    user: Mixed,
    content: Mixed,
    category: String,
    status: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
//暂时没有用
  return mongoose.model('records', tempSchema);
};
