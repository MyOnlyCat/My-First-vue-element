'use strict';
module.exports = app => {
    const mongoose = app.mongoose;
    const Mixed = mongoose.Schema.Types.Mixed;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        newOrder: Mixed, //修改过后
        oldOrder: Mixed, //修改之前
        operationUser: String, //操作人员
        operationID: String, //操作人员ID
        operationType: String, //操作类型 (DELL,UPDATE,CREATE)
        operationTime: Number, //操作时间
    }, {
        versionKey: false,
    });
    return mongoose.model('ordersBackup', tempSchema);
};