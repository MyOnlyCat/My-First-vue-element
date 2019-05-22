'use strict';
module.exports = app => {
    const mongoose = app.mongoose;
    const Mixed = mongoose.Schema.Types.Mixed;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        userId: String,
        order: Mixed,  //订单详情
    }, {
        versionKey: false,
    });
    //订单指派表(服务派单时进行使用)
    return mongoose.model('specificTasks', tempSchema);
};
