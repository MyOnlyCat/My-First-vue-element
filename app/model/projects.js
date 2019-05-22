'use strict';
module.exports = app => {
    const mongoose = app.mongoose;
    const Mixed = mongoose.Schema.Types.Mixed;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        name: String,     //合同名
        district: Mixed,  //地域
        organization: Mixed,  //机构
        contract: String,
        start: Number,    //开始时间
        end: Number,      //结束时间
        price: Mixed, //  {type: String('SAME','TYPE'), targetCount:Number, value: Number, totalMoney: Number}
        location: [Number], //坐标
        nodeNumbers: Number, //网点数量
        income: Number, //收入
        expense: Number,//支出
        projectStatus: [Mixed],//状态
        manager: String, //负责人
        managers: [Mixed], //多负责人,电话 名字
        status: String,
        phones: [Mixed],
        created: Number,
        updated: Number,
        limit: Boolean, //是否启用限时
        limitTime: Number, //限时时间
        imgAmountLimit: Number, //图片数量限制
        serviceAmountFloat: Number //每次服务金额的浮动数,比如值是5,说明每次服务10元一次,金额浮动就在 15 - 5
    }, {
        versionKey: false,
    });
    //合同表
    return mongoose.model('projects', tempSchema);
};
