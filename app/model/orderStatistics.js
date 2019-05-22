'use strict';
module.exports = app => {
    const mongoose = app.mongoose;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        projectId: String, //合同ID
        imgCount: Number, //合同下所有完成订单的照片总数
        orrderCount: Number, //合同下完成的订单数
        userCount: Number, //合同下的老人数量
        errorOrderCount: Number, //合同下的异常订单数量
        totalMoney: Number, //合同总金额
    }, {
        versionKey: false,
    });
    return mongoose.model('orderstatistics', tempSchema);
};
