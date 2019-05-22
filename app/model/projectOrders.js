'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    actor: Mixed, // 操作者
    project: Mixed, // 项目
    price: Mixed, // 总价
    category: String, // 类型  {INCOME:收入	, EXPENSE: 支出}
    description: String, //备注
    status: String,
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
//暂时没有用
  return mongoose.model('projectorders', tempSchema);
};
