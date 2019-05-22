'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const Mixed = mongoose.Schema.Types.Mixed;
  const tempSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    parentAdcode: String,//父adcode
    name: String,   //名字
    citycode: String, //城市code
    adcode: String,   //本地域的adcode
    center: String,
    level: String,  //本地域的level
    ancestors: Mixed,
    /** ancestors例子
     * {
      "streetAdCode": "511521100",
      "street": "柏溪镇",
      "province": "四川省",
      "provinceAdCode": "510000",
      "city": "宜宾市",
      "cityAdCode": "511500",
      "district": "宜宾县",
      "districtAdCode": "511521"
    }
     */
    created: Number,
  }, {
      versionKey: false,
    });
  //地域表
  return mongoose.model('districts', tempSchema);
};
