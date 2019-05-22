'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    target: Mixed, // 老人
    evaluation: Number,//服务评价
    orderCount: Number, // 服务订单次数
    orderItemCount: Number, // 服务项目次数
    totalMoney: Number, // 服务总金额
    project: Mixed, // 合同 包括organization
    date: String, //时间YYYY-MM-DD
    created: Number,
    updated: Number,
  }, {
    versionKey: false,
  });
  tempSchema.index({ 'project.organization._id': -1, 'date': -1 });
  tempSchema.index({ 'target._id': -1, 'date': -1 });
  tempSchema.index({ 'target.district.ancestors.cityAdCode': -1 , 'date': -1 });
  tempSchema.index({ 'target.district.ancestors.districtAdCode': -1 , 'date': -1 });
  tempSchema.index({ 'target.district.ancestors.streetAdCode': -1 });
  tempSchema.index({ 'target.district.adcode': -1 , 'date': -1  });
//统计表,按老人来,最小单位是天
  return mongoose.model('statisticbytargets', tempSchema);
};
