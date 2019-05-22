'use strict';
module.exports = app => {
    const mongoose = app.mongoose;
    const Mixed = mongoose.Schema.Types.Mixed;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        name: String, //监管方名字
        role: String, //监管方职位
        phones: [Number], //监管方电话
        projects: [Mixed], //项目信息
        district: Mixed,  //地域
        state: Boolean, //是否发送短信
    }, {
        versionKey: false,
    });
    return mongoose.model('projectSMS', tempSchema);
};