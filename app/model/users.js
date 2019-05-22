'use strict';
var uuid = require('uuid');
module.exports = app => {
    const mongoose = app.mongoose;

    const Mixed = mongoose.Schema.Types.Mixed;
    const tempSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId, //主键ObjectID
        name: String, // 名字
        shortName: String, //简写，用来登陆
        dob: Number, // 生日
        sex: Boolean, // 性别
        role: String, // 角色
        roles: Mixed, // 角色权限
        //permissions  //权限
        access: [String],
        phone: String, // 本人手机
        contactNumber: String, // 联系电话
        nation: String, // 民族
        identityNumber: String, // 身份证号码
        password: String,     //密码
        status: String,
        metric: Mixed,
        lifeCondition: String,
        oldCategory: String, // 老人类别
        district: Mixed, // 所在区域
        project: Mixed, // 项目
        isHCS: Boolean, // 是否居家养老人员
        member: Mixed, // 会员  {type: 会员卡类型, number: 会员卡编号}
        memberAccount: Mixed, // 会员帐户  {value: , unit: }
        organization: Mixed,  //机构
        currentAddress: String,
        registerAddress: String,
        socialSecurityNo: String,
        image: String, // 头像
        subsidy: Mixed, //补贴
        surplus: Mixed,
        service: [Mixed], //可服务项目
        residentType: String,
        emergencyContactName: String, //紧急联系人
        emergencyContactNumber: String, //紧急联系人电话
        childrenNumber: Number,     //子女数
        byside: Boolean,          //子女是否在身边
        childRelationShip: String,  //子女交流情况
        createBy: String,         //采集者
        childName: String,      //子女姓名
        childPhone: String,     //子女联系电话
        childAddress: String,   //子女住址
        comment: String,        //备注
        created: Number,
        updated: Number,
        uuid: String, //二维码ID
        orderJurisdiction: Boolean, //服务人员是否能查看所有订单的权限
    }, {
        versionKey: false,
    });
    tempSchema.index({identityNumber: 1});

    //老人,服务人员,系统人员表
    return mongoose.model('users', tempSchema);
};
