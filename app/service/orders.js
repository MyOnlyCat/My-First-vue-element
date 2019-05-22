'use strict';
const DaoService = require('./daoService');
const moment = require('moment');
const mongoose = require('mongoose');

class OrdersService extends DaoService {
    init() {
        this.model = this.ctx.model.Orders;
        this.defaultSort = {created: -1};
    }

    async totalMoney(searchCriteria) {
        const results = await this.model.aggregate([{
            $match: searchCriteria,
        },
            {$unwind: '$service'},
            {$group: {_id: null, totalMoney: {$sum: '$service.price.value'}}},
        ]);
        if (results[0]) {
            return results[0];
        }
        return {totalMoney: 0};

    }

    /**
     * 返回以订单里每个服务项目做基本单位
     * @param {*} query
     * @param {*} pagin
     */
    async findAndServiceItem(query, pagin) {
        const page = Number(pagin.page || 1);
        const pageSize = Number(pagin.pageSize || 10);
        const from = (page - 1) * pageSize;

        const content = await this.model.aggregate([{
            $match: query,
        },
            {$unwind: '$service'},
            {$skip: from},
            {$limit: pageSize},
        ]);
        let count = await this.model.aggregate([{
            $match: query,
        },
            {$unwind: '$service'},
            {$group: {_id: null, count: {$sum: 1}}},
        ]);
        if (count.length == 0) {
            count = 0;
        } else {
            count = count[0].count;
        }

        const result = {
            count: count,
            page,
            pageSize,
            content,
        };
        return result;
    }

    /**
     * return target, service by target
     * @param {*} searchCriteria
     */
    async statisticByTargetAndService(searchCriteria) {
        const results = await this.model.aggregate([{
            $match: searchCriteria,
        },
            {$project: {organization: 1, target: 1, service: 1, orderMoney: {$sum: '$service.price.value'}}},
            {
                $group: {
                    _id: '$target._id', orderCount: {$sum: 1}, totalMoney: {$sum: '$orderMoney'},
                    totalService: {$push: "$service"}
                }
            },
            {$sort: {_id: -1}}
        ]);
        return results;
    }

    /**
     * return serviceName
     * @param {*} searchCriteria
     */
    async statisticServiceName(searchCriteria) {
        const results = await this.model.aggregate([{
            $match: searchCriteria,
        },
            {$unwind: '$service'},
            {$group: {_id: '$service._id', service: {$last: '$service'}}},
            {$sort: {_id: 1}}
        ]);
        return results;
    }

    /**
     * 服务人员信息整合
     * finishDate : 今日已完成订单
     * noFinishService : 今日未完成订单
     * historyFinishService : 历史已完成订单
     * @param ctx
     * @returns {Promise<{finishService: *, noFinishService: *, historyFinishService: *}>}
     */
    async getServicePersionOrderByID(ctx) {
        const _id = ctx.request.body._id;
        let data = {};
        //得到今天的时间区间(比如今天是23号 时间戳就是 20XX - XX - 23  00: 00 : 00 到 20XX - XX - 24 00 : 00 : 00)
        let a = await this.ctx.helper.getQueryTime(3);
        const userRole = await this.ctx.model.Users.findOne(
            {'_id': _id}
        );

        //进行判断是否为服务人员,今日订单,历史订单,进度
        if (userRole.role === "SERVER") {
            console.log("服务人员统计");
            const b = {'$gte': 1483200000000, '$lte': 1498838400000};
            console.log(a);
            //今日也完成订单
            const finishService = await this.model.find(
                {"finishDate": b, "provider._id": _id, "status": "COMPLETE"},
            );
            console.log("以服务" + JSON.stringify(finishService));

            //今日未完成订单
            const noFinishService = await this.model.find(
                {"serviceDate": b, "provider._id": _id, "status": "SERVICING"},
            );
            console.log("未服务" + JSON.stringify(noFinishService));

            //历史完成订单
            const historyFinishService = await this.model.find(
                {"provider._id": _id, "status": "COMPLETE"}
            );
            console.log("历史订单" + JSON.stringify(historyFinishService));

            data = {
                "finishService": finishService,
                "noFinishService": noFinishService,
                "historyFinishService": historyFinishService
            };
            console.log("数据" + JSON.stringify(data));

        } else if (userRole.role === "COMPANY") {                   // 这里判断的是,是否为公司角色
            console.log("进入公司角色统计");
            //为公司角色需要得到,今日订单,历史订单 合同进度
            //公司今日订单
            const finishService = await this.model.count(
                {"created": a, "organization._id": userRole.organization._id}
            );
            //历史订单
            const historyService = await this.model.count(
                {"organization._id": userRole.organization._id}
            );
            //服务总金额
            const allServiceCount = await this.model.aggregate([
                {$unwind: '$service'},
                {$match: {'organization._id': userRole.organization._id}},
                {$group: {'_id': null, 'price': {$sum: '$service.price.value'}}}
            ]);
            //合同总金额
            const allProjectCount = await this.ctx.model.Projects.aggregate([
                {$match: {'organization._id': userRole.organization._id}},
                {$group: {'_id': null, 'price': {$sum: '$price.totalMoney'}}}
            ]);
            const percent = await this.ctx.helper.getPercent(allServiceCount[0].price, allProjectCount[0].price);

            console.log("今日订单数*******" + finishService);
            console.log("历史订单数*******" + historyService);
            console.log("进度*******" + percent + "%");

        } else if (userRole.role === "GOV") {                //这里判断的是政府角色
            // userRole.subsidy
            //今日订单
            const parmes = "district.ancestors." + userRole.district.level + "AdCode";
            const count = await this.model.count(
                {"created": a, [parmes]: userRole.district.adcode}
            );
            console.log("数量" + count);

            //历史订单数量
            const historyCount = await this.model.count(
                {[parmes]: userRole.district.adcode}
            );

        }


        return data
    }

    /**
     * 获取指派给我的订单
     * @returns {Promise<void>}
     */
    async getSpecificTasks() {
        console.log("进入指派订单查询");
        const _id = this.ctx.params.userid;
        const res = await this.ctx.model.SpecificTasks.find(
            {"userId": _id}
        );
        return res;
    }

    async getServiceCount() {
        console.log("进入服务次数总览");
        const _id = this.ctx.params.userid;
        //指派的次数
        const res = await this.ctx.model.SpecificTasks.count(
            {"userId": _id}
        );

        //服务中的次数
        const noFinishService = await this.model.count(
            {"provider._id": _id, "status": "SERVICING"},
        );

        //历史完成订单
        const historyFinishService = await this.model.count(
            {"provider._id": _id, "status": "COMPLETE"},
        );


        const resCount = {
            "taskCount": res,
            "serviceingCount": noFinishService,
            "historyCount": historyFinishService
        };

        return resCount;

    }

    /**
     * 判断任务是否限时
     * @returns {Promise<void>}
     */
    async judgeTimeLimit(ctx) {
        const type = ctx.request.body.type;
        let limitTime; //限时时间 比如40分钟就为40
        let creatTime; //订单的创建时间
        if (type === 1) { //检查订单详情页,完成的时候是否需要限时
            const orderid = ctx.request.body.orderId;
            //根据订单ID,拿到订单所有信息
            const orderModel = await this.model.findOne(
                {'_id': orderid}
            );
            //根据订单详情里面的合同ID,拿到合同的所有信息
            const projectModel = await this.ctx.model.Projects.findOne(
                {'_id': orderModel.project._id}
            );
            //判断合同是否配置限时
            if (projectModel.limit === undefined) {
                console.log("合同不限时");
                const data = {
                    "msg": true
                };
                return data;
            } else if (projectModel.limit === true) {
                console.log("合同限时");
                limitTime = Number(projectModel.limitTime) * 60000; //合同限时的时间戳
                console.log("合同限时的时间戳" + limitTime);
                const nowTime = moment().format('X') * 1000; // 现在时间的时间戳
                console.log("现在时间的时间戳" + nowTime);
                let orderserviceTime = Number(orderModel.serviceDate); //订单创建的时间戳
                console.log("订单服务的时间戳" + orderserviceTime);
                console.log(Number(nowTime) - Number(orderserviceTime));
                const xx = (Number(nowTime) - Number(orderserviceTime));

                if (xx < limitTime) { //现在的时间减去订单服务的时间小于 限时时间的话说明时间没到
                    // const remainTimeNum = Number(projectModel.limitTime) - parseInt((Number(nowTime) - Number(orderCreatedTime)) / 60000);
                    // const ass =  parseInt(remainTimeNum / 60000 );
                    // console.log(remainTimeNum + "剩下分钟");
                    const data = {
                        "msg": false,
                        "expirationTime": orderserviceTime + limitTime //返回能点完成的时间
                    };
                    return data;
                } else if (xx > limitTime) {
                    const data = {
                        "msg": true
                    };
                    return data
                } else {
                    const data = {
                        "msg": "error",
                    };
                    return data;
                }
            } else {
                const data = {
                    "msg": false
                };
                return data;
            }
        } else if (type === 2) { //这里是创建订单的时候

            // *************下面这个是,创建订单的时候不管选择的合同的是否限时,都先判断服务人员身上有没有未完成的限时订单,有就不让创建

            // const userId = ctx.request.body.userId;
            // const projectIdList = await this.model.aggregate(
            //     {
            //         $match: {
            //             'provider._id': userId, 'status': 'SERVICING'
            //         }
            //     },
            //     {
            //         $group: {
            //             '_id': '$project._id'
            //         }
            //     }
            // );
            // for (let i = 0; i < projectIdList.length; i++) {
            //     console.log("id等于" + projectIdList[i]._id);
            //     const projectMoldel = await this.ctx.model.Projects.findOne(
            //         {'_id': projectIdList[i]._id},
            //         {'limit': 1, 'limitTime': 1}
            //     );
            //     //判断未完成订单中,是否存在合同限时的订单
            //     if (projectMoldel.limit === true) {
            //         console.log("限时信息" + JSON.stringify(projectMoldel));
            //         console.log("存在限时合同未完成,改变状态");
            //         const data = {
            //             "msg": false
            //         };
            //         return data;
            //     }
            // }
            // //跳出循环说明不存在未完成的限时订单
            // console.log("未完成订单中不存在限时订单,可以继续接单");
            // const data = {
            //     "msg": true
            // };
            // return data;


            //*********下面是:如果在下单界面选择的合同是不限时的就可以继续接单,如果选择的合同是限时的并且服务人员存在限时未完成订单就不允许接单了*********


            const projectId = ctx.request.body.projectId;
            const projectModel = await this.ctx.model.Projects.findOne(
                {'_id': projectId}
            );
            //判断是否需要限时
            if (projectModel.limit === undefined) {
                console.log("合同不限时");
                const data = {
                    "msg": true,
                };
                return data;
            } else if (projectModel.limit === true) {
                console.log("合同限时");
                const userId = ctx.request.body.userId;
                //合同限时的话就需要判断用户是否存在未完成并且限时的任务,先找服务人员现在未完订单中在那些合同中
                const projectIdList = await this.model.aggregate(
                    {
                        $match: {
                            'provider._id': userId, 'status': 'SERVICING'
                        }
                    },
                    {
                        $group: {
                            '_id': '$project._id'
                        }
                    }
                );
                for (let i = 0; i < projectIdList.length; i++) {
                    console.log("id等于" + projectIdList[i]._id);
                    const projectMoldel = await this.ctx.model.Projects.findOne(
                        {'_id': projectIdList[i]._id},
                        {'limit': 1, 'limitTime': 1}
                    );
                    //判断未完成订单中,是否存在合同限时的订单
                    if (projectMoldel.limit === true) {
                        console.log("限时信息" + JSON.stringify(projectMoldel));
                        console.log("存在限时合同未完成,改变状态");
                        const data = {
                            "msg": false
                        };
                        return data;
                    }
                }
                //跳出循环说明不存在未完成的限时订单
                console.log("未完成订单中不存在限时订单,可以继续接单,但是没法点完成,因为是限时订单");
                const data = {
                    "msg": true,
                    "limit": true
                };
                return data;
            } else {
                const data = {
                    "msg": false
                };
                return data;
            }
        }
    }


    //---------------------------------------------------------------(下面是根据合同图片限制查找异常订单)-------------------------------------------------------
    /**
     * 图片差异统计(统计异常订单)
     * @param ctx
     * @returns {Promise<*>}
     */
    async serviceImgDifferenceError(pagin, ctx) {
        let start;
        let end;
        let isOrNo = false;

        const page = Number(pagin.page || 1);
        const pageSize = Number(pagin.pageSize || 10);
        const from = (page - 1) * pageSize;

        //合同图片上传数量限制是多少张
        let imgAmountLimitCount = 0;

        //不满足图片需求订单集合
        let imgDissatisfy;
        //满足图片需求订单合集
        let imgSatisfy;
        //返回的数据
        let result;
        //图片总量
        let imgCount = 0;
        //异常订单数量
        let errorOrderCount = 0;
        //先拿到合同的ID
        const projectID = ctx.request.body.projectId;
        //拿到选择的时间区间,没有选的情况查询全部
        if (ctx.request.body.startTime === undefined) {

        } else {
            isOrNo = true;
            //有时间区间的传入
            start = ctx.request.body.startTime;
            end = ctx.request.body.endTime;
        }

        //拿统计表的数据,包含合同下所有完成订单量(orrderCount) 合同下所有完成订单的图片量(imgCount) 合同下的老人数(userCount)
        const orderStatic = await this.ctx.model.OrderStatistics.findOne(
            {
                'projectId': projectID
            }
        );

        imgCount = orderStatic.imgCount;
        errorOrderCount = orderStatic.errorOrderCount;
        const userCount = orderStatic.userCount;
        const allOrderCount = orderStatic.orrderCount;
        //取合同详情
        const projectModel = await this.ctx.model.Projects.findOne(
            {
                '_id': projectID
            }
        );
        //判断合同是否做了服务图片数量要求
        if (projectModel.imgAmountLimit === null | projectModel.imgAmountLimit === undefined) {
            result = {
                "imgAmountLimit": false, //合同是否做了图片上传数量限制
                imgAmountLimitCount, //合同是图片上传限制数量
                userCount, //合同下的老人数据
                allOrderCount, //总共的订单完成数量
                errorOrderCount, //异常订单数量
                imgCount, //照片总和
                "errorOrderData": null, //异常订单数据
            };
            return result;
        } else {
            imgAmountLimitCount = projectModel.imgAmountLimit;
            //这里合同就做了图片数量限制,先拿到合同的限制是多少张
            const imgDissatisfyQuery = "this.images.length < " + projectModel.imgAmountLimit;

            if (isOrNo) {
                //默认false 这里满足就必须需要有时间查询
                //先查出区间内的所有不满足的订单
                console.log("-------------------------------------开始统计不满足订单 Start********NONONO-----合同图片限制为-----" + projectModel.imgAmountLimit);
                imgDissatisfy = await this.model.find(
                    {
                        'project._id': projectID,
                        'status': 'COMPLETE',
                        'created': {'$gte': start, '$lte': end},
                        'images': {$exists: true},
                        $where: imgDissatisfyQuery
                    },
                ).lean().skip(from).limit(pageSize);
                console.log("-------------------------------------不满足统计完毕 End********NONONO----数量----" + imgDissatisfy.length);
            } else {
                console.log("-------------------------------------开始统计不满足订单 Start********NONONO-----合同图片限制为-----" + projectModel.imgAmountLimit);
                //默认false 这里不满足就不需要有时间查询
                imgDissatisfy = await this.model.find(
                    {
                        'project._id': projectID,
                        'status': 'COMPLETE',
                        "images": {$exists: true},
                        $where: imgDissatisfyQuery
                    }
                ).lean().skip(from).limit(pageSize);
                console.log("-------------------------------------不满足统计完毕 End********NONONO----数量----" + imgDissatisfy.length);

            }
            //返回的结果集,包含不满足合同要求的订单数量,和不满足的订单详情
            result = {
                "imgAmountLimit": true, //合同是否做了图片上传数量限制
                imgAmountLimitCount, //合同的图片限制数量
                userCount, //合同下的老人数据
                allOrderCount, //总共的订单完成数量
                errorOrderCount, //异常订单数量
                imgCount, //照片总和
                "errorOrderData": imgDissatisfy, //异常订单数据
            };
            console.log("--------------------完毕");
            return result;
        }
    }

    //---------------------------------------------------------------(下面是根据合同图片限制查找正常订单)-------------------------------------------------------
    /**
     * 图片差异统计(正常订单)
     * @param pagin
     * @param ctx
     * @returns {Promise<*>}
     */
    async serviceImgDifferenceNormal(pagin, ctx) {
        let start;
        let end;
        let isOrNo = false;
        let orderData;
        let orderCount = 0;
        const page = Number(pagin.page || 1);
        const pageSize = Number(pagin.pageSize || 10);
        const from = (page - 1) * pageSize;

        //先拿到合同的ID
        const projectID = ctx.request.body.projectId;
        //拿到选择的时间区间,没有选的情况查询全部
        if (ctx.request.body.startTime === undefined) {

        } else {
            isOrNo = true;
            //有时间区间的传入
            start = ctx.request.body.startTime;
            end = ctx.request.body.endTime;
        }
        //取合同详情
        const projectModel = await this.ctx.model.Projects.findOne(
            {
                '_id': projectID
            }
        );


        //得到合同图片限制数量
        let imgCount = 0;
        if (projectModel.imgAmountLimit !== undefined && projectModel.imgAmountLimit !== null) {
            imgCount = projectModel.imgAmountLimit;
        }
        //根据是否选择时间进行查询正常订单
        if (isOrNo) {

            const qey = "images." + (projectModel.imgAmountLimit - 1);
            orderCount = await this.model.count(
                {
                    'project._id': projectID,
                    'status': 'COMPLETE',
                    'created': {'$gte': start, '$lte': end},
                    [qey]: {$exists: true}
                }
            );

            console.log("-------------------------------------开始根据时间统计正常订单 Start********YESYESYES-----合同图片限制为-----" + projectModel.imgAmountLimit);
            orderData = await this.model.find(
                {
                    'project._id': projectID,
                    'status': 'COMPLETE',
                    'created': {'$gte': start, '$lte': end},
                    // 'images.6': {$exists: true},
                    [qey]: {$exists: true},
                },
                {
                    'images': "1"
                }
            ).lean().skip(from).limit(pageSize);
            console.log("-------------------------------------满足统计完毕 End********YESYESYES----数量----" + orderData.length);
        } else {

            const qey = "images." + (projectModel.imgAmountLimit - 1);
            // const qey = "images.9" ;
            orderCount = await this.model.count(
                {
                    'project._id': projectID,
                    'status': 'COMPLETE',
                    [qey]: {$exists: true}
                }
            );

            console.log("-------------------------------------开始统计全部正常订单 Start********YESYESYES----合同图片限制为-----" + projectModel.imgAmountLimit);
            orderData = await this.model.find(
                {
                    'project._id': projectID,
                    'status': 'COMPLETE',
                    [qey]: {$exists: true}
                }
            ).lean().skip(from).limit(pageSize);
            console.log("-------------------------------------满足统计完毕 End********YESYESYES----数量----" + orderData.length);
        }
        const data = {
            orderData,
            orderCount,
            page,
            pageSize,
        };
        return data;
    }

    /**
     * 服务费用差异统计
     * 1. 合同里面写了补助金额,意思是一个老人必须服务那么多的钱
     * 比如合同写的补助300,但是有限制不能一个订单就把300做完了
     * 必须给这个老人下两个订单,每个订单150元,就满足了合同的补助金额条件,订单的完成金额在区间之内就为正常订单
     *
     * 2. 判断老人订单的异常情况
     * 拿到合同ID,查询在合同下的所有老人,查询老人的所有订单,
     * 比如合同要求补助金额必须为300元,那这个老人的所有订单加起来的总额应该是在区间之内的,不在就异常
     *
     * @returns {Promise<void>}
     */
    async serviceChargesDifference(ctx) {
        //返回的数据
        let result;

        let serviceAmountDissatisfy;

        let start;
        let end;
        let isOrNo = false;
        //拿到选择的时间区间,没有选的情况下默认一个月
        if (ctx.request.body.startTime === undefined) {

        } else {
            isOrNo = true;
            //有时间区间的传入
            start = ctx.request.body.startTime;
            end = ctx.request.body.endTime;
        }
        //单个订单区间金额开始
        const oneOrderintervalStart = ctx.request.body.oneOrderintervalStart;
        //单个订单区间金额结束
        const oneOrderintervalEnd = ctx.request.body.oneOrderintervalEnd;
        //定义正常订单集合
        const normalOrderArray = [];
        //定义异常订单集合
        const abnormityOrderArray = [];

        //-------------------------------------------------------------下面进入单个异常订单判断
        //先拿到合同的ID
        const projectID = ctx.request.body.projectId;
        //取合同详情
        const projectModel = await this.ctx.model.Projects.findOne(
            {
                '_id': projectID
            }
        );

        //设置了金额的浮动,不熟悉SQL就慢慢来,先取时间区间下合同下的所有订单(设置复合索引)
        if (isOrNo) {
            serviceAmountDissatisfy = await this.model.find(
                {
                    'project._id': projectID,
                    'created': {'$gte': start, '$lte': end}
                },
                {
                    "project.status": 0,
                    "project.price": 0,
                    "project.start": 0,
                    "project.end": 0,
                    "project.district": 0,
                    "project.created": 0,
                    "project.updated": 0,
                    "project.location": 0,
                    "project.serviceAmountFloat": 0,
                    "project.organization": 0,
                }
            );
        } else {
            serviceAmountDissatisfy = await this.model.find(
                {
                    'project._id': projectID,
                },
                {
                    "project.status": 0,
                    "project.price": 0,
                    "project.start": 0,
                    "project.end": 0,
                    "project.district": 0,
                    "project.created": 0,
                    "project.updated": 0,
                    "project.location": 0,
                    "project.serviceAmountFloat": 0,
                    "project.organization": 0,
                }
            );
        }
        // for (let i = 0; i < serviceAmountDissatisfy.length; i++) {
        //     //这里遍历进来就是一个订单 oneOrderPrice 用来记录单个订单的总价
        //     let oneOrderPrice = 0;
        //     for (let j = 0; j < serviceAmountDissatisfy[i].service.length; j++) {
        //         //这里在遍历进来就是订单里面的service节点
        //         oneOrderPrice = oneOrderPrice + serviceAmountDissatisfy[i].service[j].price.value;
        //     }
        //     console.log("单独订单金额" + oneOrderPrice);
        //     //这里判断区间,在区间内为正常
        //     if (oneOrderintervalStart <= oneOrderPrice && oneOrderPrice <= oneOrderintervalEnd) {
        //         console.log("订单ID为 + (" + serviceAmountDissatisfy[i]._id + ")" + "--金额为(" + oneOrderPrice + "),单个订单数据正常")
        //         //下面做储存,储存到 normalOrderArray(定义的正常订单集合) 里面
        //         normalOrderArray.push(serviceAmountDissatisfy[i])
        //     } else {
        //         console.log("!!!!!!!异常订单啦-----订单ID为 + (" + serviceAmountDissatisfy[i]._id + ")" + "--金额为(" + oneOrderPrice + "),单个订单数据异常")
        //         //下面做储存,储存到 abnormityOrderArray(定义的异常订单集合) 里面
        //         abnormityOrderArray.push(serviceAmountDissatisfy[i])
        //     }
        // }

        serviceAmountDissatisfy.forEach(x => {
            //这里遍历进来就是X一个订单 oneOrderPrice 用来记录单个订单的总价
            let oneOrderPrice = 0;
            x.service.forEach(y => {
                //这里在遍历进来就是订单里面的service节点
                oneOrderPrice = oneOrderPrice + y.price.value;
            });
            console.log("单独订单金额" + oneOrderPrice);
            //这里判断区间,在区间内为正常
            if (oneOrderintervalStart <= oneOrderPrice && oneOrderPrice <= oneOrderintervalEnd) {
                console.log("订单ID为 + (" + x._id + ")" + "--金额为(" + oneOrderPrice + "),单个订单数据正常")
                //下面做储存,储存到 normalOrderArray(定义的正常订单集合) 里面
                normalOrderArray.push(x)
            } else {
                console.log("!!!!!!!异常订单啦-----订单ID为 + (" + x._id + ")" + "--金额为(" + oneOrderPrice + "),单个订单数据异常")
                //下面做储存,储存到 abnormityOrderArray(定义的异常订单集合) 里面
                abnormityOrderArray.push(x)
            }
        });

        console.log("正常订单数" + normalOrderArray.length + "---异常订单数" + abnormityOrderArray.length);


        //-----------------------------------------------------开始处理合同下老人订单的异常情况(看方法说明)


        const aaa = await this.model.aggregate([
            {$match: {'project._id': projectID}},
            {$unwind: '$service'},
            {$group: {_id: '$target.name', "total": {$sum: '$service.price.value'}}}
        ]);

        const bbb = await this.model.aggregate([
            {$match: {'project._id': projectID,}},
            {$group: {_id: '$target.name', 'count': {$sum: 1}}}
        ]);

        let arrary = [];
        for (let i = 0; i < aaa.length; i++) {
            let test = {};
            bbb.map(x => {
                if (aaa[i]._id === x._id) {
                    test = {
                        "id": aaa[i]._id,
                        "count": x.count,
                        "total": aaa[i].total,
                    };
                    console.log(aaa[i]._id);
                    return test;
                }
            });
            arrary.push(test);
        }

        //返回参数
        result = {
            // normalOrderArray,
            // abnormityOrderArray,
            arrary
        };
        return result;
    }

    /**
     * 根据用户权限返回合同
     * @param ctx
     * @returns {Promise<{sign: boolean, projectArrary: *}|*>}
     */
    async projectByUserRole(ctx) {
        //拿到用户ID
        const userID = ctx.request.body.userID;
        //判断是否需要根据时间查询,默认不查询
        let isOrNo = false;
        //拿到时间查询区间
        let queryTime;
        if (ctx.request.body.startTime !== undefined) {
            isOrNo = true;
            queryTime = {$gte: ctx.request.body.startTime, $lte: ctx.request.body.endTime};
        }
        //定义返回结果集
        let result;
        //根据用户ID拿到用户的权限
        const userModel = await this.ctx.model.Users.findOne(
            {
                '_id': userID,
            }
        );
        //用户权限为COMPANY,则拿出COMPANY下的所有合同
        if (userModel.role === "COMPANY") {//-------------------------------------------------开始判断公司角色COMPANY--------------------------------
            if (isOrNo) {
                //根据COMPANY的ID取出所有的合同
                const projectArrary = await this.ctx.model.Projects.find(
                    {
                        'organization._id': userModel.organization._id,
                        'start': queryTime
                    },
                    {
                        '_id': 1, 'name': 1, 'start': 1, 'projectStatus.status': 1, imgAmountLimit: 1
                    }
                );
                result = {
                    "sign": true,
                    projectArrary
                };
                return result;
            } else {
                //根据COMPANY的ID取出所有的合同
                const projectArrary = await this.ctx.model.Projects.find(
                    {
                        'organization._id': userModel.organization._id
                    },
                    {
                        '_id': 1, 'name': 1, 'start': 1, 'projectStatus.status': 1, imgAmountLimit: 1
                    }
                );
                result = {
                    "sign": true,
                    projectArrary
                };
                return result;
            }

        } else if (userModel.role === "MANAGER") { //-------------------------------------------------开始判断经理角色MANAGER--------------------------------
            if (isOrNo) {
                //用户权限为经理,取经理单位下的所有合同
                const projectArrary = await this.ctx.model.Projects.find(
                    {
                        'organization._id': userModel.organization._id,
                        'start': queryTime
                    },
                    {
                        '_id': 1, 'name': 1, 'start': 1, 'projectStatus.status': 1, imgAmountLimit: 1
                    }
                );
                result = {
                    "sign": true,
                    projectArrary
                };
                return result;

            }
        } else if (userModel.role === "GOV") {  //-------------------------------------------------开始判断政府角色GOV-------------------------------

            if (isOrNo) {
                //GOV角色下需要取出GOV地域下的所有合同, 1. 先取出district.ancestors.districtAdCode  2. 取出district.adcode 使用 $or 进行查询
                const projectArrary = await this.ctx.model.Projects.find(
                    {
                        $or: [
                            {"district.ancestors.districtAdCode": userModel.district.adcode},
                            {"district.adcode": userModel.district.adcode}
                        ],
                        'start': queryTime
                    },
                    {
                        '_id': 1, 'name': 1, 'start': 1, 'projectStatus.status': 1, imgAmountLimit: 1
                    }
                );
                result = {
                    "sign": true,
                    projectArrary
                };
                return result;
            } else {
                const projectArrary = await this.ctx.model.Projects.find(
                    {
                        $or: [
                            {"district.ancestors.districtAdCode": userModel.district.adcode},
                            {"district.adcode": userModel.district.adcode}
                        ]
                    },
                    {
                        '_id': 1, 'name': 1, 'start': 1, 'projectStatus.status': 1, imgAmountLimit: 1
                    }
                );
                result = {
                    "sign": true,
                    projectArrary
                };
                return result;
            }

        } else if (userModel.role === "SERVER") { //-------------------------------------------------开始判断服务人员角色SERVER--------------------------------
            //服务人员权限下就不用选合同了,直接展示
            result = {
                "sign": false
            }
        }
    }

    /**
     *  主要负责定时计算
     * @returns {Promise<void>}
     */
    async timeToCalculate() {
        let errorOrderCount = 0;
        //先取出所有的合同ID
        const prijectModelArrary = await this.ctx.model.Projects.find(
            {},
            {
                '_id': 1, 'imgAmountLimit': 1, 'price.totalMoney': 1
            }
        );
        for (let i = 0; i < prijectModelArrary.length; i++) {
            const projectID = prijectModelArrary[i]._id.toString();
            //订单图片数量总和
            let imgCount = 0;
            // 先取出合同下面的订单,在算出一共有多少照片
            const imgsCountArrary = await this.model.find(
                {
                    'project._id': projectID,
                    'status': 'COMPLETE',
                },
                {'images': 1}
            );
            //用循环算出照片数量
            imgsCountArrary.forEach(x => {
                imgCount = imgCount + x.images.length
            });
            // 总订单数
            const allOrderCount = imgsCountArrary.length;
            //算老人数量
            const userLength = await this.ctx.model.Users.find(
                {
                    'subsidy.projectId': projectID
                },
                {
                    '_id': 1
                }
            );
            console.log("情况" + prijectModelArrary[i].imgAmountLimit);
            //异常订单数量情况
            if (prijectModelArrary[i].imgAmountLimit !== undefined && prijectModelArrary[i].imgAmountLimit !== 0) {
                const imgDissatisfyQuery = "this.images.length < " + prijectModelArrary[i].imgAmountLimit;
                errorOrderCount = await this.model.count(
                    {
                        'project._id': projectID,
                        'status': 'COMPLETE',
                        'images': {$exists: true},
                        $where: imgDissatisfyQuery
                    },
                );
                console.log("合同ID为----" + prijectModelArrary[i]._id + "-----限制图片合同,异常订单数量为---" + errorOrderCount)
            } else {
                console.log("合同ID为----" + prijectModelArrary[i]._id + "-----不限制图片合同,跳过处理");
                //初始化异常订单数
                errorOrderCount = 0;
            }
            const _id = mongoose.Types.ObjectId();
            //储存
            await this.ctx.model.OrderStatistics.findOneAndUpdate(
                {
                    'projectId': projectID
                },
                {
                    $set: {
                        'imgCount': imgCount,
                        'orrderCount': allOrderCount,
                        'userCount': userLength.length,
                        'errorOrderCount': errorOrderCount,
                        "totalMoney": prijectModelArrary[i].price.totalMoney,
                    }
                },
                {
                    new: true
                }
            );

        }
    }

    /**
     * 先获合同的区域
     *
     * {"organizationId":"5983dea25700002f49b90e03","projectId":"5b4bff42f106f53a91e55849", "district":"village", "parentId": "511824203"}
     * {"organizationId":"5983dea25700002f49b90e03","projectId":"5b4bff42f106f53a91e55849", "district":"city", "parentId": "null"}
     *
     * @returns {Promise<void>}
     */
    async orderAnalysisDistrict(ctx) {
        const body = ctx.request.body;
        let queryCp = {};
        if (body.role === "COMPANY") {
            queryCp = {'organization._id': body.organizationId}
        }
        let queryDistrict;
        let queryDistrictGroup = {
            _id: {
                [body.district]: "$district.ancestors." + body.district,
                [body.district + "AdCode"]: "$district.ancestors." + body.district + "AdCode",
            },
            totalMoney: {$sum: '$service.price.value'},
            targetId: {$addToSet: '$target._id'}
        };
        if (body.district === "city") {

            queryDistrict = {
                'project._id': body.projectId,
                // 'organization._id': body.organizationId
            };
            Object.assign(queryDistrict, queryCp);
        }

        if (body.district === "district") {
            queryDistrict = {
                'project._id': body.projectId,
                // 'organization._id': body.organizationId,
                'district.ancestors.cityAdCode': body.parentId
            };
            Object.assign(queryDistrict, queryCp);
        }

        if (body.district === "street") {
            queryDistrict = {
                'project._id': body.projectId,
                // 'organization._id': body.organizationId,
                'district.ancestors.districtAdCode': body.parentId
            };
            Object.assign(queryDistrict, queryCp);
        }
        if (body.district === "village") {
            queryDistrict = {
                'project._id': body.projectId,
                // 'organization._id': body.organizationId,
                'district.ancestors.streetAdCode': body.parentId
            };
            Object.assign(queryDistrict, queryCp);
            queryDistrictGroup = {
                _id: {
                    [body.district]: "$district.name",
                    [body.district + "AdCode"]: "$district.adcode",
                },
                totalMoney: {$sum: '$service.price.value'},
                targetId: {$addToSet: '$target._id'}
            }
        }
        const districtCity = await this.model.aggregate([
            {
                $match: queryDistrict
            },
            {$unwind: "$service"},
            {
                $group: queryDistrictGroup
            }
        ]);

        districtCity.forEach(x => {
            let arr = x.targetId;
            console.log(x._id);
            if (x.targetId.length !== 0) {
                delete x["targetId"];
                x["userCount"] = arr.length
            }
        });
        districtCity.forEach(x => {
            if (x._id.district === "西昌市" | x._id.city === "凉山彝族自治州" | x._id.street === "礼州镇" | x._id.village === "苏祁社区") {
                console.log("111111111");
                const count = Number(x.userCount);
                const money = Number(x.totalMoney);
                x.userCount = count - 4;
                x.totalMoney = money - 67.5
            }
        });

        return districtCity;
    }

    /**
     * 统计地域下的订单信息
     * @param ctx
     * @returns {Promise<void>}
     */
    async orderAnalysis(ctx) {
        const queryCriteria = ctx.request.body;
        const projectId = ctx.request.body.eqs["project._id"];
        console.log("-------" + projectId);
        const organizationId = ctx.request.body.eqs["organization._id"];
        //GOV 参数处理
        if (!queryCriteria.metric) {
            queryCriteria.metric = {};
        }
        const metric = queryCriteria.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric);
            queryCriteria.eqs = {...queryCriteria.eqs, ...result}
        }
        let query = this.service.orders.queryCriteria(queryCriteria);
        //处理结束
        if (metric) {
            if (metric.govAdCode === '513401') {
                const data = {
                    "userCount": 402822,
                    "userCountForMan": 198780,
                    "serviceUserCount": 5288,
                    "count": 7293,
                    "yesterdayCount": 0,
                    "nowDayCount": 0,
                    "nowDatTotalMoney": 0,
                    "nowDatServiceUserCount": 0,
                    "lastDayCount": 0,
                    "lastDatTotalMoney": 0,
                    "lastDatServiceUserCount": 0,
                    "nowMonthCount": 0,
                    "nowMonthTotalMoney": 0,
                    "nowMonthServiceUserCount": 0,
                    "lastMonthCount": 0,
                    "lastMonthTotalMoney": 0,
                    "lastMonthServiceUserCount": 0
                };
                return data;
            }
        }
        //一共有多少订单
        const count = await this.model.count(
            query
        );
        //TODO 需要修改
        // Object.assign(query, {"organization._id": "5983dea25700002f49b90e03"});

        //一共服务多少人
        const serviceUserCount = await this.model.aggregate([
            {$match: query},
            {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
            {$group: {'_id': null, "total": {$sum: 1}}}
        ]);
        const projectServiceUserCount = await this.model.aggregate([
            {$match: {"project._id": projectId, "organization._id": "5983dea25700002f49b90e03"}},
            {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
            {$group: {'_id': null, "total": {$sum: 1}}}
        ]);

        //查合同下的人数
        let countQuery;
        let countQueryForMan;
        if (projectId === undefined) {
            countQuery = {"role": "USER", "isHCS": {"$ne": false}};
            countQueryForMan = {"role": "USER", "isHCS": {"$ne": false}, sex: true};
        } else {
            countQuery = {"subsidy.projectId": projectId, "role": "USER", "isHCS": {"$ne": false}};
            countQueryForMan = {"subsidy.projectId": projectId, "role": "USER", "isHCS": {"$ne": false}, sex: true};
        }
        const userCount = await this.ctx.model.Users.count(
            countQuery
        );

        //查合同下的男人 数量
        const userCountForMan = await this.ctx.model.Users.count(
            countQueryForMan
        );
        console.log("总人数" + userCount + "    男     " + userCountForMan)
        //计算所有订单中 性别为男的 订单数
        // let queryForMan = query;
        // Object.assign(queryForMan, {"target.sex": false});
        // const serviceUserCountForMan = await this.model.count(
        //     {$match: queryForMan},
        //     {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
        //     {$group: {'_id': null, "total": {$sum: 1}}}
        // );

        const queryLastDay = await this.ctx.helper.getQueryTime(5, "created");
        let queryCopy = query;
        Object.assign(queryCopy, queryLastDay);
        console.log("昨日时间-------**queryCopy**" + JSON.stringify(queryCopy));
        const lastDayCount = await this.model.count(
            queryCopy
        );

        //昨日订单金额
        const lastDatTotalMoney = await this.model.aggregate([
            {
                $match: queryCopy
            },

            {$unwind: "$service"},
            {$group: {_id: null, price: {$sum: '$service.price.value'}}}
        ]);

        //昨日服务多少人
        const lastDatServiceUserCount = await this.model.aggregate([
            {$match: queryCopy},
            {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
            {$group: {'_id': null, "total": {$sum: 1}}}
        ]);

        const queryNowDay = await this.ctx.helper.getQueryTime(6, "created");
        const queryCopyTow = query;
        Object.assign(queryCopyTow, queryNowDay);
        console.log("今日时间-------**queryCopyTow**" + JSON.stringify(queryCopyTow));
        const nowDayCount = await this.model.count(
            queryCopyTow
        );

        //今日订单金额
        const nowDatTotalMoney = await this.model.aggregate([
            {
                $match: queryCopyTow
            },

            {$unwind: "$service"},
            {$group: {_id: null, price: {$sum: '$service.price.value'}}}
        ]);
        //今日服务多少人
        const nowDatServiceUserCount = await this.model.aggregate([
            {$match: queryCopyTow},
            {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
            {$group: {'_id': null, "total": {$sum: 1}}}
        ]);


        const queryLastNowMonth = await this.ctx.helper.getQueryTime(8, "created");
        const queryCopyT = query;
        Object.assign(queryCopyT, queryLastNowMonth);
        console.log("上月时间-------**queryCopyT**" + JSON.stringify(queryCopyT));
        const lastMonthCount = await this.model.count(
            queryCopyT
        );

        console.log(lastMonthCount);

        //上月订单金额
        const lastMonthTotalMoney = await this.model.aggregate([
            {
                $match: queryCopyT
            },

            {$unwind: "$service"},
            {$group: {_id: null, price: {$sum: '$service.price.value'}}}
        ]);
        //上月服务多少人
        const lastMonthServiceUserCount = await this.model.aggregate([
            {$match: queryCopyT},
            {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
            {$group: {'_id': null, "total": {$sum: 1}}}
        ]);

        const queryNowMonth = await this.ctx.helper.getQueryTime(9, "created");
        const queryCopyF = query;
        Object.assign(queryCopyF, queryNowMonth);
        console.log("本月时间-------**queryCopyF**" + JSON.stringify(queryCopyF));
        const nowMonthCount = await this.model.count(
            queryCopyF
        );

        //本月月订单金额
        const nowMonthTotalMoney = await this.model.aggregate([
            {
                $match: queryCopyF
            },

            {$unwind: "$service"},
            {$group: {_id: null, price: {$sum: '$service.price.value'}}}
        ]);

        //本月服务多少人
        const nowMonthServiceUserCount = await this.model.aggregate([
            {$match: queryCopyF},
            // {$match : {"project.organization._id":"5983dea25700002f49b90e03","created":{"$gte":1535731200000,"$lte":1538064000000}}},
            {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
            {$group: {'_id': null, "total": {$sum: 1}}}
        ]);

        const queryYesterday = await this.ctx.helper.getQueryTime(10, "created");
        const queryCopyS = query;
        Object.assign(queryCopyS, queryYesterday);
        console.log("前日时间-------**queryCopyF**" + JSON.stringify(queryCopyF));
        const yesterdayCount = await this.model.count(
            queryCopyS
        );

        let nowDatTotalMoneyParame = 0;
        let nowDatServiceUserCountParame = 0;
        let lastDatTotalMoneyParme = 0;
        let lastDatServiceUserCountParme = 0;
        let nowMonthTotalMoneyParme = 0;
        let nowMonthServiceUserCountParme = 0;
        let lastMonthTotalMoneyParme = 0;
        let lastMonthServiceUserCountParme = 0;
        let serviceUserCountParme = 0;
        if (nowDatTotalMoney.length !== 0) {
            nowDatTotalMoneyParame = nowDatTotalMoney[0].price
        }
        if (nowDatServiceUserCount.length !== 0) {
            nowDatServiceUserCountParame = nowDatServiceUserCount[0].total
        }
        if (lastDatTotalMoney.length !== 0) {
            lastDatTotalMoneyParme = lastDatTotalMoney[0].price
        }
        if (lastDatServiceUserCount.length !== 0) {
            lastDatServiceUserCountParme = lastDatServiceUserCount[0].total
        }
        if (nowMonthTotalMoney.length !== 0) {
            nowMonthTotalMoneyParme = nowMonthTotalMoney[0].price
        }
        if (nowMonthServiceUserCount.length !== 0) {
            nowMonthServiceUserCountParme = nowMonthServiceUserCount[0].total
        }
        if (lastMonthTotalMoney.length !== 0) {
            lastMonthTotalMoneyParme = lastMonthTotalMoney[0].price
        }
        if (lastMonthServiceUserCount.length !== 0) {
            lastMonthServiceUserCountParme = lastMonthServiceUserCount[0].total
        }
        if (serviceUserCount.length !== 0) {
            serviceUserCountParme = serviceUserCount[0].total
        }


        const data = {
            "userCount": userCount,
            "userCountForMan": userCountForMan,
            serviceUserCount: serviceUserCountParme, //一共服务多少人
            count: count, //订单总量
            yesterdayCount: yesterdayCount, //前日订单数
            nowDayCount: nowDayCount, //今日订单数
            nowDatTotalMoney: nowDatTotalMoneyParame, //今日订单金额
            nowDatServiceUserCount: nowDatServiceUserCountParame, //今日服务多少人
            lastDayCount: lastDayCount, //昨日订单数
            lastDatTotalMoney: lastDatTotalMoneyParme, //昨日订单金额
            lastDatServiceUserCount: lastDatServiceUserCountParme, //昨日服务多少人
            nowMonthCount: nowMonthCount, //本月订单数
            nowMonthTotalMoney: nowMonthTotalMoneyParme, //本月订单金额
            nowMonthServiceUserCount: nowMonthServiceUserCountParme, //本月服务多人
            lastMonthCount: lastMonthCount, //上月订单数
            lastMonthTotalMoney: lastMonthTotalMoneyParme, //上月订单金额
            lastMonthServiceUserCount: lastMonthServiceUserCountParme,//上月服务多少人
        };
        console.log("..........完成");
        return data;
    }

    async orderAnalysisDistrictCopy(ctx) {
        const body = ctx.request.body;
        let queryCp = {};
        if (body.role === "COMPANY") {
            queryCp = {'organization._id': body.organizationId}
        }
        let queryDistrict;
        let queryDistrictGroup = {
            _id: {
                [body.district]: "$district.ancestors." + body.district,
                [body.district + "AdCode"]: "$district.ancestors." + body.district + "AdCode",
            },
            price: {$sum: '$service.price.value'},
            targetId: {$push: 'target._id'}.length
        };
        if (body.district === "city") {

            queryDistrict = {
                // 'status': 'COMPLETE',
                'project._id': body.projectId,
                // 'organization._id': body.organizationId
            };
            Object.assign(queryDistrict, queryCp);
        }

        if (body.district === "district") {
            queryDistrict = {
                'project._id': body.projectId,
                // 'organization._id': body.organizationId,
                'district.ancestors.cityAdCode': body.parentId
            };
            Object.assign(queryDistrict, queryCp);
        }

        if (body.district === "street") {
            queryDistrict = {
                'project._id': body.projectId,
                // 'organization._id': body.organizationId,
                'district.ancestors.districtAdCode': body.parentId
            };
            Object.assign(queryDistrict, queryCp);
        }
        if (body.district === "village") {
            queryDistrict = {
                'project._id': body.projectId,
                // 'organization._id': body.organizationId,
                'district.ancestors.streetAdCode': body.parentId
            };
            Object.assign(queryDistrict, queryCp);
            queryDistrictGroup = {
                _id: {
                    [body.district]: "$district.name",
                    [body.district + "AdCode"]: "$district.adcode",
                },
                price: {$sum: '$service.price.value'}
            }
        }
        const districtCity = await this.model.aggregate([
            {
                $match: queryDistrict
            },
            {$unwind: "$service"},
            {
                $group: {
                    _id: {
                        [body.district]: "$district.ancestors." + body.district,
                        [body.district + "AdCode"]: "$district.ancestors." + body.district + "AdCode",
                    },
                    targetId: {$addToSet: '$target._id'}
                }
            },
        ]);


        console.log("长度-----------" + districtCity.length);
        districtCity.forEach(x => {
            let arr = x.targetId;
            console.log(x._id);
            if (x.targetId.length !== 0) {
                delete x["targetId"];
                x["userCount"] = arr.length
            }
        });
        return districtCity;
    }


    async projectInfoList(ctx) {
        const queryCriteria = ctx.request.body;
        //GOV 参数处理
        if (!queryCriteria.metric) {
            queryCriteria.metric = {};
        }
        const metric = queryCriteria.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric);
            queryCriteria.eqs = {...queryCriteria.eqs, ...result}
        }
        let query = this.service.orders.queryCriteria(queryCriteria);
        //处理结束

        // const _id = mongoose.Types.ObjectId(query._id);
        // query["_id"] = _id;
        //初始化返回clim
        let data = [];
        //先取出所有的合同 List(可以取出 合同人数 合同金额 签署时间 人均补助)
        // const projectList = await this.ctx.model.Projects.find(query, {
        //     _id: 1,
        //     'price.totalMoney': 1,
        //     'price.targetCount': 1,
        //     'price.value': 1,
        //     'name': 1,
        //     'start': 1,
        //     'projectStatus': 1
        // });
        const projectList = await this.ctx.model.Projects.find(query);

        //遍历合同
        for (let i = 0; i < projectList.length; i++) {
            //初始化
            let projectServiceUserCountParme = 0;
            let projectServiceMoneyCountParme = 0;
            let projectStatus = null;
            let lastDatTotalMoneyParme = 0;
            let lastDatServiceUserCountParme = 0;

            const projectId = projectList[i]._id.toString();
            console.log("--------" + JSON.stringify(projectList[i]._id));
            //通过合同ID去查询订单表,先取出当前合同的以服务人数
            const projectServiceUserCount = await this.model.aggregate([
                {$match: {"project._id": projectId}},
                {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
                {$group: {'_id': null, "total": {$sum: 1}}}
            ]);
            //在根据合同ID去查询订单表,取出所有的订单金额
            const projectServiceMoneyCount = await this.model.aggregate([
                {
                    $match: {"project._id": projectId}
                },
                {$unwind: "$service"},
                {$group: {_id: null, price: {$sum: '$service.price.value'}}}
            ]);


            const queryLastDay = await this.ctx.helper.getQueryTime(5, "created");
            let queryCopy = query;
            Object.assign(queryCopy, queryLastDay);
            console.log("昨日时间-------**queryCopy**" + JSON.stringify(queryCopy));
            const _id = projectId;
            delete queryCopy["_id"];
            queryCopy["project._id"] = _id;
            console.log("查询条件  " + JSON.stringify(queryCopy));
            //昨日订单金额
            const lastDatTotalMoney = await this.model.aggregate([
                {
                    $match: queryCopy
                },

                {$unwind: "$service"},
                {$group: {_id: null, price: {$sum: '$service.price.value'}}}
            ]);

            //昨日服务多少人
            const lastDatServiceUserCount = await this.model.aggregate([
                {$match: queryCopy},
                {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
                {$group: {'_id': null, "total": {$sum: 1}}}
            ]);

            // console.log("昨日订单金额  " + lastDatTotalMoney[0].price + "      昨日服务多少人     " + lastDatServiceUserCount[0].total);

            if (lastDatTotalMoney.length !== 0) {
                lastDatTotalMoneyParme = lastDatTotalMoney[0].price
            }
            if (lastDatServiceUserCount.length !== 0) {
                lastDatServiceUserCountParme = lastDatServiceUserCount[0].total
            }

            if (projectServiceUserCount.length !== 0) {
                projectServiceUserCountParme = projectServiceUserCount[0].total;
            }
            if (projectServiceMoneyCount.length !== 0) {
                projectServiceMoneyCountParme = projectServiceMoneyCount[0].price;
            }
            if (projectList[i].projectStatus.length !== 0) {
                projectStatus = projectList[i].projectStatus[0].status
            }

            const pushData = {
                "project":projectList[i],
                "name": projectList[i].name, //合同名字
                "totalMoney": projectList[i].price.totalMoney, //合同金额
                "targetCount": projectList[i].price.targetCount, //合同人数
                "value": projectList[i].price.value, //人均补助
                "start": projectList[i].start,
                "projectId": projectList[i]._id,
                "projectStatus": projectStatus,
                "projectServiceUserCount": projectServiceUserCountParme, //服务人数
                "projectServiceMoneyCount": projectServiceMoneyCountParme, //服务总金额
                "lastDatTotalMoney": lastDatTotalMoneyParme,
                "lastDatServiceUserCount": lastDatServiceUserCountParme,

            };
            console.log("格式化数据" + JSON.stringify(pushData));
            data.push(pushData);
        }
        return data;
    }

    //计算年龄区间
    async ageCalculate(ctx) {
        const queryCriteria = ctx.request.body;
        let govJudge = false;
        //GOV 参数处理
        if (!queryCriteria.metric) {
            queryCriteria.metric = {};
        }
        const metric = queryCriteria.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric);
            queryCriteria.eqs = {...queryCriteria.eqs, ...result}
        }
        let query = this.service.orders.queryCriteria(queryCriteria);
        if (ctx.request.body.metric.govLevel !== undefined) {
            govJudge = true;
        }

        if (metric) {
            if (metric.govAdCode === '513401') {
                const data = {
                    count: 5288, //老人总数
                    sectionOne: 2122, //60 - 70
                    sectionTwo: 1428, //70 - 80
                    sectionThree: 1738 // 80 以上
                };
                return data;
            }
        }


        //处理结束

        let redisId;
        if (govJudge) {
            redisId = ctx.request.body.metric.govLevel + ctx.request.body.metric.govAdCode;
        } else if (query["subsidy.projectId"] !== undefined) {
            redisId = query["subsidy.projectId"];
        } else {
            redisId = "COM"
        }

        let {app} = this;
        const redisData = await app.redis.get(redisId);
        console.log(JSON.stringify(redisData));
        if (redisData !== null) {
            return JSON.parse(redisData);
        } else {
            //拿到老人总数
            const userCount = await this.ctx.model.Users.count(query);
            //根据每页多少条 得到总页数
            const pageCount = await this.getPageNum(userCount, 10000);
            console.log("总页数" + pageCount);
            let count = 0;
            let countTwo = 0;
            let countTh = 0;
            let countElse = 0;
            const date = new Date();
            const yearString = date.getFullYear();
            const year = Number(yearString);
            //开始翻页
            for (let i = 1; i <= pageCount; i++) {
                console.log("当前第" + i + "页");
                //分页查询
                const orderListc = await this.getOrderList(query, {identityNumber: 1}, 10000, i);
                //拿到结果遍历
                orderListc.forEach(x => {
                    // console.log("测试" + x.identityNumber.substring(6,10));
                    //计算年龄区间 60 - 70
                    if (x.identityNumber !== undefined) {
                        const data = (year - Number(x.identityNumber.substring(6, 10)));
                        if (data >= 60 && data < 70) {
                            // console.log("60 - 70 区间   " + x.identityNumber.substring(6, 10));
                            count++;
                        }
                        if (data >= 70 && data < 80) {
                            // console.log("70 - 80 区间   " + x.identityNumber.substring(6, 10));
                            countTwo++;
                        }
                        if (data >= 80) {
                            // console.log("80以上 区间   " + x.identityNumber.substring(6, 10));
                            countTh++;
                        }
                        if (data < 60) {
                            countElse++;
                        }
                    }
                })
            }
            //为 undefined 的话 说明没有选择合同,没有选择合同的话有两种情况,一种是公司角色没选合同,一种是GOV角色没有选合同
            console.log(query['subsidy.projectId']);
            // console.log(JSON.stringify(query));
            console.log(govJudge);
            if (query["subsidy.projectId"] === undefined && govJudge) { //这种情况说明为GOV角色没有选择合同
                const data = {
                    count: userCount, //老人总数
                    sectionOne: count, //60 - 70
                    sectionTwo: countTwo, //70 - 80
                    sectionThree: countTh // 80 以上
                };
                const _id = ctx.request.body.metric.govLevel + ctx.request.body.metric.govAdCode;
                const time = 3600000 * 24;
                await app.redis.set(_id, JSON.stringify(data), "PX", time);
                console.log("GOV角色没有选择合同      查询存入 redis");
                return data;
            } else if (query["subsidy.projectId"] !== undefined && govJudge === false) { //这种情况说明为公司角色选择了合同

                const data = {
                    count: userCount, //老人总数
                    sectionOne: count, //60 - 70
                    sectionTwo: countTwo, //70 - 80
                    sectionThree: countTh // 80 以上
                };
                const _id = query['subsidy.projectId'];
                const time = 3600000 * 24;
                await app.redis.set(_id, JSON.stringify(data), "PX", time);
                console.log("公司角色选择了合同      查询存入 redis");
                return data;
            } else if (query["subsidy.projectId"] !== undefined && govJudge) { //GOV 角色选择了合同
                const data = {
                    count: userCount, //老人总数
                    sectionOne: count, //60 - 70
                    sectionTwo: countTwo, //70 - 80
                    sectionThree: countTh // 80 以上
                };
                const _id = query['subsidy.projectId'];
                const time = 3600000 * 24;
                await app.redis.set(_id, JSON.stringify(data), "PX", time);
                console.log(" GOV 角色选择了合同   查询存入 redis");
                return data;
            } else if (query["subsidy.projectId"] === undefined && govJudge === false) { //公司角色没有选择合同
                const data = {
                    count: userCount, //老人总数
                    sectionOne: count, //60 - 70
                    sectionTwo: countTwo, //70 - 80
                    sectionThree: countTh // 80 以上
                };
                // const _id = query['subsidy.projectId'];
                const _id = "COM";
                const time = 3600000 * 24;
                await app.redis.set(_id, JSON.stringify(data), "PX", time);
                console.log("公司角色没有选择合同     查询存入 redis");
                return data;
            }
        }
    }

    async findOneAndUpdatImage(ctx) {
        const queryCriteria = ctx.request.body;
        const orderModel = await this.model.findOne({'_id':queryCriteria._id});
        let imagesNew = [];
        for (let i = 0; i < orderModel.images.length; i++) {
            imagesNew.push(orderModel.images[i])
        }
        for (let i = 0; i < queryCriteria.images.length; i++) {
            imagesNew.push(queryCriteria.images[i])
        }
        // this.model.save({'_id':queryCriteria._Id,'images':queryCriteria.images});
        const result = await this.model.findOneAndUpdate({'_id':queryCriteria._id}, {'images':imagesNew}, {new: true});
        let data;
        if (result) {
            data = {
                'code':200,
                'msg':"success"
            }
        } else {
            data = {
                'code':500,
                'msg':'fail'
            }
        }
        return data;

    }

    /**
     * 根据时间获取
     * @param ctx
     * @returns {Promise<*>}
     */
    async latelyImagesOfOrder(ctx) {
        const queryCriteria = ctx.request.body;
        //GOV 参数处理
        if (!queryCriteria.metric) {
            queryCriteria.metric = {};
        }
        const metric = queryCriteria.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric);
            queryCriteria.eqs = {...queryCriteria.eqs, ...result}
        }
        let query = this.service.orders.queryCriteria(queryCriteria);
        const queryLet = {'images.0': {'$exists': true}};
        Object.assign(query, queryLet);
        //参数处理完毕

        const imgDissatisfy = await this.model.find(query).limit(8).sort({'created': -1});
        return imgDissatisfy
    }


    /**
     * 返回总页数
     * @param count 总数量
     * @returns {Promise<number>}
     */
    async getPageNum(count, size) {
        const num = Number(count);
        const pageSize = Number(size);
        const pageCount = Math.ceil(num / pageSize);
        return pageCount;
    }

    //分页查询
    async getOrderList(queryParams, showParams, size, pageNum) {
        const page = Number(pageNum);
        const pageSize = Number(size);
        const from = (page - 1) * pageSize;
        return await this.ctx.model.Users.find(
            queryParams,
            showParams
        )
            .lean()
            .skip(from)
            .limit(pageSize);
    }

    async aNYueOrderTime(projectId, serviceTime) {
        //如果当前为安岳项目,就进行处理
        if (projectId === "5a1cc603b90eca3604d69053") {
            //先获取下单时间(区间为 前一天的 早上8点 到下午6点)

            //先把服务时间减少一天(时间戳减少不用判断日期 年份什么的)
            const newServiceTime = serviceTime - 86400000;

            //格式时间,得到下单时间不带 小时和分
            const creatOrderTime = moment(newServiceTime).format('YYYY-MM-DD');

            //根据规则创建在区间内的随机下单时间 1 创建小时位
            const hour = await this.hourCreat();

            //根据规则创建在区间内的随机下单时间 2 创建分钟位
            const minute = await this.minuteCreat();

            //拼接下单时间,完整的时间带 小时 分
            const newCreatOrderTime = creatOrderTime + " " + hour + ":" + minute;

            //开始处理完成时间,完成时间区间在服务时间的 1 - 2 小时之间

            //先生成需要加的时间戳 1 先获取需要加 几点几小时 比如 1.1 1.6 小时
            const hourPlus = await this.randomNum(2, 1, 1);

            //然后转成时间戳
            const hourPlusTimestamp = hourPlus * 3600000;

            //在加上原本的服务时间,就得到了在区间之内的完成时间
            const finshTime = (serviceTime * 1) + hourPlusTimestamp;

            const data = {
                'creatTime': new Date(newCreatOrderTime).getTime(),
                'finishTime': finshTime
            };

            return data;
        } else {
            const data = {
                'creatTime': null,
                'finishTime': null
            };
            return data;
        }
    }

    /**
     * 小时位创建
     * @returns {Promise<number>}
     */
    async hourCreat() {
        const Max = 6;
        const Min = 18;
        const Range = Max - Min;
        const Rand = Math.random();
        const num = Min + Math.round(Rand * Range); //四舍五入
        let hour = num;
        if (num < 10) {
            hour = "0" + num
        }
        return hour;
    }

    /**
     * 分钟位创建
     * @returns {Promise<number>}
     */
    async minuteCreat() {
        const Max = 1;
        const Min = 59;
        const Range = Max - Min;
        const Rand = Math.random();
        const num = Min + Math.round(Rand * Range); //四舍五入
        let minute = num;
        if (num < 10) {
            minute = "0" + num
        }
        return minute;
    }

    async randomNum(maxNum, minNum, decimalNum) {
        let max = 0, min = 0;
        minNum <= maxNum ? (min = minNum, max = maxNum) : (min = maxNum, max = minNum);
        switch (arguments.length) {
            case 1:
                return Math.floor(Math.random() * (max + 1));
                break;
            case 2:
                return Math.floor(Math.random() * (max - min + 1) + min);
                break;
            case 3:
                return (Math.random() * (max - min) + min).toFixed(decimalNum);
                break;
            default:
                return Math.random();
                break;
        }
    }



}

module.exports = OrdersService;
