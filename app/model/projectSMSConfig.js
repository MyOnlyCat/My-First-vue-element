'use strict';
module.exports = app => {
    const mongoose = app.mongoose;
    const Mixed = mongoose.Schema.Types.Mixed;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        name: String, //名称
        role: String, //发送对象
        time: Number,
        dayState: Boolean, //日报启用状态
        weekState: Boolean, //周报启用状态
        monthState: Boolean, //月报启用状态
    }, {
        versionKey: false,
    });
    return mongoose.model('projectSMSConfig', tempSchema);
};