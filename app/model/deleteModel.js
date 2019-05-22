'use strict';
module.exports = app => {
    const mongoose = app.mongoose;
    const Mixed = mongoose.Schema.Types.Mixed;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        operatorIP: String,  //操作人员IP
        content: Mixed, //储存内容
    }, {
        versionKey: false,
    });
    //通话记录
    return mongoose.model('deleteModel', tempSchema);
};
