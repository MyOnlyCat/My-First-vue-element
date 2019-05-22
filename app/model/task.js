'use strict';
module.exports = app => {
    const mongoose = app.mongoose;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        taskType: String, //任务类型 1: 有数据的二维码下载 2:空二维码
        schedule: Number, //下载进度 1: 任务创建, 2: 任务完成
        creatUserId: String, //创建任务的用户ID
        taskID: String, //任务ID
        taskCreatTime: Number, //任务创建时间
        taskFinishTime: Number, //任务完成时间
        url: String, //下载地址
    }, {
        versionKey: false,
    });
    return mongoose.model('task', tempSchema);
};