'use strict';
const api = '/api/v1';
module.exports = app => {
    const {router, controller, io} = app;
    router.options('/**', controller.home.index);
    router.post(api + '/oauth2/token', app.oAuth2Server.token());
    router.get(api + '/oss/getStsToken', controller.oss.getStsToken);
    router.get(api + '/districts/parent/:code', controller.districts.parentCode);
    router.get(api + '/districts/importVillages', controller.districts.importVillages);
    router.get(api + '/districts/findFromAmp', controller.districts.findFromAmp); // 从高德地图导入
    router.post(api + '/districts/search', controller.districts.index);
    router.post(api + '/districts/readVillagesFromExcelStream', controller.districts.readVillagesFromExcelStream); // 从excel里导入村
    router.resources('districts', api + '/districts', controller.districts);

    router.post(api + '/fingerPrintRecord/findBy', controller.fingerPrintRecord.findBy);
    router.post(api + '/fingerPrintRecord/search', controller.fingerPrintRecord.index);
    router.resources('fingerPrintRecord', api + '/fingerPrintRecord', controller.fingerPrintRecord);

    router.get(api + '/codes/:codeType', controller.codes.findByType);
    router.resources('codes', api + '/codes', controller.codes);

    router.post(api + '/messages/search', controller.messages.index);
    router.resources('messages', api + '/messages', controller.messages);

    router.post(api + '/orders/search', controller.orders.index);
    router.post(api + '/orders/findAndTurnover', controller.orders.findAndTurnover);
    router.post(api + '/orders/findAndTarget', controller.orders.findAndTarget);
    router.post(api + '/orders/findAndServiceItem', controller.orders.findAndServiceItem);
    router.post(api + '/orders/batch', controller.orders.saveBatch);
    router.post(api + '/orders/upImages', controller.orders.updatImage);
    router.post(api + '/orders/exportDocx', controller.orders.exportDocx);
    router.post(api + '/orders/exportImages', controller.orders.exportImages);
    router.post(api + '/orders/exportOrderServices', controller.orders.exportOrderServices);
    router.resources('orders', api + '/orders', controller.orders);

    router.post(api + '/organizations/search', controller.organizations.index);
    router.resources('organizations', api + '/organizations', controller.organizations);

    router.post(api + '/records/search', controller.records.index);
    router.resources('records', api + '/records', controller.records);

    // 商家
    router.post(api + '/business/search', controller.business.index);
    router.resources('business', api + '/business', controller.business);

    // 商家服务项目
    router.post(api + '/businesServices/search', controller.businesServices.index);
    router.resources('businesServices', api + '/businesServices', controller.businesServices);

    // 会员操作记录
    // router.post(api + '/memberRecords/search', controller.memberRecords.index);
    // router.resources('memberRecords', api + '/memberRecords', controller.memberRecords);

    // 会员消费记录
    router.post(api + '/businesOrders/search', controller.businesOrders.index);
    router.get(api + '/businesOrders/:id/cancel', controller.businesOrders.cancel);
    router.post(api + '/businesOrders/countMoney', controller.businesOrders.countMoney);
    router.post(api + '/businesOrders/exportTransitionToExcel', controller.businesOrders.exportTransitionToExcel);
    router.resources('businesOrders', api + '/businesOrders', controller.businesOrders);

    // 操作记录
    router.post(api + '/operateRecords/search', controller.operateRecords.index);
    router.resources('operateRecords', api + '/operateRecords', controller.operateRecords);

    router.post(api + '/callRecords/search', controller.callRecords.index);// 通话记录
    router.resources('callRecords', api + '/callRecords', controller.callRecords);

    // 角色
    router.post(api + '/roles/search', controller.roles.index);
    router.resources('roles', api + '/roles', controller.roles);

    router.post(api + '/services/search', controller.services.index);
    router.post(api + '/services/searchByAdCode', controller.services.searchByAdCode);
    router.post(api + '/services/deleteBulk', controller.services.deleteBulk);
    router.resources('services', api + '/services', controller.services);

    router.post(api + '/users/search', controller.users.index);
    // router.post(api + '/users/all', controller.users.getUsersAllData);
    router.post(api + '/users/all', controller.users.updateUserPortrait);
    router.post(api + '/users/count', controller.users.count);
    router.post(api + '/users/statisticByRole', controller.users.statisticByRole);
    router.get(api + '/users/getUserWithRoles/:id', controller.users.getUserWithRoles);
    router.get(api + '/users/login', controller.users.login);
    router.get(api + '/users/identityNumber/:id', controller.users.identityNumber);
    router.get(api + '/users/resetPassword/:id', controller.users.resetPassword);
    router.post(api + '/users/updatePwd/:id', controller.users.updatePwd);
    router.post(api + '/users/bulk', controller.users.bulk);
    router.get(api + '/users/readUserFromExcel', controller.users.readUserFromExcel);
    router.post(api + '/users/readUserFromExcelStream', controller.users.readUserFromExcelStream);
    router.resources('users', api + '/users', controller.users);

    router.post(api + '/projects/search', controller.projects.index);
    router.post(api + '/projects/getProjectByDistrict', controller.projects.getProjectByDistrict);
    router.post(api + '/projects/getActiveProjects', controller.projects.getActiveProjects);
    router.resources('projects', api + '/projects', controller.projects);

    router.post(api + '/projectOrders/search', controller.projectOrders.index);
    router.resources('projectOrders', api + '/projectOrders', controller.projectOrders);

    router.post(api + '/communities/search', controller.communities.index);
    router.resources('communities', api + '/communities', controller.communities);


    // 物资管理
    router.post(api + '/products/search', controller.products.index);
    router.post(api + '/products/groupByField', controller.products.groupByField);
    router.resources('products', api + '/products', controller.products);

    // 物资管理记录
    router.post(api + '/productsRecords/search', controller.productsRecords.index);
    router.post(api + '/productsRecords/bulk', controller.productsRecords.bulk);
    router.get(api + '/productsRecords/:id/cancel', controller.productsRecords.cancel);
    router.resources('productsRecords', api + '/productsRecords', controller.productsRecords);

    //居家养老统计 start
    router.post(api + '/statistic/userAge', controller.statistic.statisticAges);
    router.post(api + '/statistic/orderItem', controller.statistic.statisticOrderItem);
    router.post(api + '/statistic/orderUser', controller.statistic.statisticOrderUser);
    router.post(api + '/statistic/organization', controller.statistic.statisticOrganization);
    router.post(api + '/statistic/organizationServer', controller.statistic.statisticOrganizationServer);
    router.post(api + '/statistic/districtReport', controller.statistic.statisticDistrictReport);
    // router.post(api + '/statistic/communityReport', controller.statistic.communityReport);
    router.post(api + '/statistic/communityServer', controller.statistic.statisticByProvider);
    router.post(api + '/statistic/orderByProject', controller.statistic.statisticOrderByProject);
    router.post(api + '/statistic/orderByTimeCompare', controller.statistic.orderByTimeCompare);
    router.post(api + '/statistic/orderByYearMonth', controller.statistic.orderByYearMonth);
    //居家养老统计 end

    //居家养老按照老人统计 start
    router.post(api + '/statisticByTargets/search', controller.statisticByTargets.index);
    router.post(api + '/statisticByTargets/convertFromOrder', controller.statisticByTargets.convertFromOrder);
    router.post(api + '/statisticByTargets/statisticByTarget', controller.statisticByTargets.statisticByTarget);
    router.post(api + '/statisticByTargets/statisticByDays', controller.statisticByTargets.statisticByDays);
    router.post(api + '/statisticByTargets/getTargets', controller.statisticByTargets.getTargets);
    router.post(api + '/statisticByTargets/statisticByDistrict', controller.statisticByTargets.statisticByDistrict);
    router.post(api + '/statisticByTargets/statisticByProject', controller.statisticByTargets.statisticByProject);
    router.post(api + '/statisticByTargets/statisticByTargetAgeSex', controller.statisticByTargets.statisticByTargetAgeSex);
    router.resources('statisticByTarget', api + '/statisticByTargets', controller.statisticByTargets);
    //居家养老按照老人统计 end

    //居家养老按照服务人员统计 start
    router.post(api + '/statisticByProviders/search', controller.statisticByProviders.index);
    router.post(api + '/statisticByProviders/statisticByProvider', controller.statisticByProviders.statisticByProvider);
    router.post(api + '/statisticByProviders/statisticByServiceItem', controller.statisticByProviders.statisticByServiceItem);
    router.post(api + '/statisticByProviders/getProviders', controller.statisticByProviders.getProviders);
    router.resources('statisticByProvider', api + '/statisticByProviders', controller.statisticByProviders);
    //居家养老按照服务人员统计 end
    router.post(api + '/orderByTargets/statisticByTarget', controller.orderByTargets.statisticByTarget);
    router.post(api + '/orderByTargets/search', controller.orderByTargets.index);
    router.resources('orderByTargets', api + '/orderByTargets', controller.orderByTargets);

    //商家统计 start
    router.post(api + '/statisticBusiness/running', controller.statisticBusiness.running);
    router.post(api + '/statisticBusiness/info', controller.statisticBusiness.info);
    router.post(api + '/statisticBusiness/orderByYearMonth', controller.statisticBusiness.orderByYearMonth);
    router.post(api + '/statisticBusiness/orderByWeekDay', controller.statisticBusiness.orderByWeekDay);

    //商家统计 end

    router.post(api + '/versions/search', controller.versions.index);
    router.get(api + '/versions/:appName/:platform/:versionCode', controller.versions.findByVersion);
    router.get('/versions/:appName/:platform/:versionCode', controller.versions.findByVersion);
    router.resources('versions', api + '/versions', controller.versions);
    router.get(api + '/file/list', controller.files.list);
    router.post(api + '/file/upload', controller.files.upload);
    router.post(api + '/file/uploadSSO', controller.files.uploadSSO);
    router.delete(api + '/file/:id', controller.files.destroy);
    router.get(api + '/file/:id', controller.files.download);
    router.get(api + '/file/sso/:id', controller.files.downloadSSO);
    router.post(api + '/file/convertToSSO', controller.files.convertToSSO);

    //交易流水 start
    router.post(api + '/transaction', controller.transactionFlow.getTransactionData);
    //交易流水 end

    //短信管理create
    router.resources(api + '/projectSMS', controller.projectSMS);
    router.post(api + '/projectSMS/search', controller.projectSMS.index);
    //短信配置
    router.resources(api + '/configSMS', controller.projectSMSConfig);
    router.post(api + '/configSMS/search', controller.projectSMSConfig.index);
    //订单操作历史
    router.post(api + '/orderBackup/search', controller.orderBackup.index);
    router.post(api + '/orderBackup', controller.orderBackup.create);
    //发送二维码下载请求
    router.post(api + '/downmsg', controller.npmController.packageQRDate);
    router.post(api + '/downloadQR', controller.npmController.downloadTask);
    //Java回馈接口
    router.post(api + '/recordTask', controller.npmController.recordTask); //Jvaa
    //uuid获取信息
    router.get(api + '/msguuid/:uuid', controller.npmController.getUserDataByUUID);
    //空白二维码
    router.post(api + '/downEmptyQR', controller.npmController.productionQRByPost); //
    //二维码绑定老人
    router.post(api + '/saveUserByQR', controller.npmController.saveUserByQRAndUserID); //

    router.post(api + '/upUUID', controller.npmController.upUUID); //

    //销毁老人二维码
    router.post(api + '/abolishQR', controller.npmController.abolishQR); //

    //地区数据接口(没写完)
    router.post(api + '/testuser', controller.npmController.testUser1); //

    //服务人员的每日订单完成统计(现在改为根据角色的权限进行展示,也没写完)
    router.post(api + '/servicePersionOrdes', controller.orders.getServicePersionOrderByID); //

    //服务人员指派订单信息
    router.get(api + '/serviceTasking/:userid', controller.orders.getSpecificTasksByID);

    //服务人员服务次数总览
    router.get(api + '/serviceCount/:userid', controller.orders.getServiceCountByID);

    //限时合同的处理
    router.post(api + '/serviceLimit', controller.orders.getJudgeTimeLimit);

    //订单服务费用的差异统计
    router.post(api + '/serviceAmountLimit', controller.orders.getServiceChargesDifference);

    //图片差异统计(异常)
    router.post(api + '/serviceImgDifference', controller.orders.getServiceImgDifference);
    //图片差异统计(正常)
    router.post(api + '/serviceImgDifferenceNormal', controller.orders.getServiceImgDifferenceNormal);

    //根据用户权限得到合同
    router.post(api + '/projectById', controller.orders.getProjectByUserRole);

    //地域获取合同
    router.post(api + '/project/getProjectByAdcode', controller.projects.getProjectByAdcode);

    //根据合同ID,取服务人员
    router.post(api + '/users/searchByProjectId', controller.users.getUserByProjectId);

    //根据服务人员获取服务人员的订单完成时的坐标
    router.post(api + '/orders/findAll', controller.orders.getlocationData);

    //重新定义的老人查询
    router.post(api + '/users/searchV2', controller.users.searchUser);

    //订单分析的数据接口
    router.post(api + '/orders/analysisDistrict', controller.orders.getOrderAnalysisDistrict);

    //订单分析的数据测试接口
    router.post(api + '/orders/analysisDistrictCopy', controller.orders.getOrderAnalysisDistrictCopy);

    //获取首页的服务监管的数据信息
    router.post(api + '/orders/orderAnalysisCount', controller.orders.orderAnalysisCount);

    //获取首页最近订单图片展示订单信息
    router.post(api + '/orders/orderlatelyImage', controller.orders.latelyImagesOfOrderController);

    //获取首页合同的进度信息
    router.post(api + '/orders/projectInfoList', controller.orders.projectInfoList);

    //首页年龄分布
    router.post(api + '/orders/ageCalculate', controller.orders.ageCalculate);

    //删除指派订单
    router.post(api + '/specificTasks', controller.orders.dellSpecificTasksX);

    router.post(api + '/orders/anyue', controller.orders.getaNYueOrderTime);

    // socket.io start
    io.route('disconnect', controller.sockets.disconnect);
    io.route('chat', controller.sockets.ping);
    io.route('joinRoom', controller.sockets.joinRoom);
    // socket.io end


};
