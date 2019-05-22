'use strict';
module.exports = app => {
    const mongoose = app.mongoose;
    const Mixed = mongoose.Schema.Types.Mixed;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        serialNumber: Number, //订单号
        service: [Mixed],   //服务项目
        district: Mixed,      //地域
        project: Mixed,       //所属合同
        organization: Mixed,  //所属机构
        target: Mixed,        //服务的老人
        bookUser: Mixed,      //预订人
        actor: Mixed, // 操作者
        provider: Mixed,  //服务人员
        providers: [Mixed], //服务人员列表-临时的
        serviceDate: Number,  //开始服务时间
        finishDate: Number,   //完成时间
        comment: String,      //评价
        voiceComment: String, //语音
        suggest: String,      //建议
        status: String, // BOOK: 预约, CANCEL: 取消
        category: {type: String, index: true}, // PHONE_BOOK: 电话预约, WECHAT_BOOK:微信预约
        evaluation: Number,   //打分
        images: [String],   //图片
        location: Mixed,      //服务定位地址
        created: Number,
        updated: Number,
        community: Mixed,
        export: Boolean, //订单信息是否导出
        imgExport: Boolean, //图片是否导出
        serviceExport: Boolean, //服务项目是否导出
    }, {
        versionKey: false,
    });
    tempSchema.index({
        created: -1,
        'target.identityNumber': -1,
        'target.name': -1,
        'organization._id': -1,
        category: -1
    });
    return mongoose.model('orders', tempSchema);
};
