'use strict';
const DaoService = require('./daoService');
const moment = require('moment');
var mongoose = require('mongoose');

class ProjectSMSService extends DaoService {
    init() {
        this.model = this.ctx.model.ProjectSMS;
    }

    /**
     * 负责人日报
     * @param projectList
     * @returns {Promise<void>}
     */
    async sendSMS(projectList) {
        const time = await this.getQueryTime(0); //查询时间
        var curDate = new Date();
        var preDate = new Date(curDate.getTime() - 24 * 60 * 60 * 1000);
        var yesterDay = moment(preDate).format("MM-DD");
        for (let i = 0; i < projectList.length; i++) {
            var orderCount = await this.getBeforeDatOrderCount(projectList[i].id, time); //新增订单
            var servicePersionCount = await this.getBeforeServiceForPersionCount(projectList[i].id, time); //服务多少人
            var serviceMoneyCount = await this.getProjectFinishMoney(projectList[i].id); //以服务金额
            var percent = await this.getPercent(serviceMoneyCount, projectList[i].money); //完成百分比
            const msg = `你所负责${projectList[i].city}项目昨日${yesterDay}新增${orderCount}订单，为${servicePersionCount}位老人提供服务，已完成进度${percent}%。 【益养科技】`
            await this.service.sms.send(projectList[i].phone, msg);
            // await this.service.sms.send(18048602571, msg);
            console.log("短信目标:(" + projectList[i].phone + ")" + "短信内容:(" + msg + ")");
        }
    }

    /**
     * 管理人员的 日报周报月报
     * @returns {Promise<void>}
     */
    async getAdminProjectResults(type) {
        const projectsList = await this.ctx.model.ProjectSMS.aggregate([
            {$unwind: '$phones'},
            {
                $group: {
                    '_id': '$_id',
                    'name': {$push: '$role'},
                    'state': {$push: '$state'},
                    'projects': {$push: '$projects._id'},
                    'phones': {$push: '$phones'}
                }
            }
        ]);
        for (let i = 0; i < projectsList.length; i++) {
            //判断是发送短信
            if (projectsList[i].state[0] === true) {

                var city = "";
                var msgTime;
                if (type === 0) {
                    msgTime = "昨日";
                }
                if (type === 1) {
                    msgTime = "上周";
                }
                if (type === 2) {
                    msgTime = "上月";
                }

                //那到需要发送短信的项目ID
                var projectIDList = projectsList[i].projects;
                console.log(JSON.stringify(projectIDList));
                //获取项目的所有信息
                var projectList = await this.getProjectListByObjectID(projectIDList[0]);


                console.log("需要发送");
                //判断是否需要截取前三个项目
                if (projectList.length > 3) {
                    console.log("需要截取");
                    city = await this.interceptList(projectList, 1); //截取拼装完过后的前五项目
                } else {
                    city = await this.interceptList(projectList, 2); //截取拼装完过后的前五项目
                }
                var percent = await this.getAdminAllProjectMoney(projectList); //完成百分比
                var finishProjectNameString = await this.getFinishProject(projectList); //拼接已完成项目
                //如果为空就需要跟换模板
                var templateType = 0;
                if (finishProjectNameString === "") {
                    templateType = 1;
                }
                var queryTime = await this.getQueryTime(type); //查询时间条件
                console.log("查询时间" + JSON.stringify(queryTime));
                var projectCount = projectList.length; //所有的项目数量
                var weakTime = await this.getWeakTime(type); //获取短信显示的时间区间
                //计算新增多少订单
                var order = 0; //新增订单数
                var servicePersionCount = 0; //服务多少人


                for (let j = 0; j < projectIDList[0].length; j++) {
                    // var order = 0;
                    var id = projectIDList[0][j];
                    order = order + await this.getBeforeDatOrderCount(id, queryTime);
                    servicePersionCount = servicePersionCount + await this.getBeforeServiceForPersionCount(id, queryTime)
                }

                /**
                 * 你所负责 {**} 等 {**}个项目上周（{**}）共新增 {**}个订单，
                 * 为{**}位老人提供服务，总进度完成{**}%。
                 * 其中{**},等{**}个项目已完成 【益养科技】
                 */

                console.log("新增订单数" + order);
                console.log("服务人数" + servicePersionCount);
                let msg;
                if (templateType === 0) {
                    //你所负责{**}等{**}个项目上周（{**}）共新增{**}个订单，为{**}位老人提供服务，总进度完成{**}%。 其中{**},等{**}个项目已完成【益养科技】
                    msg = `你所负责 ${city} 等 ${projectCount}个项目${msgTime}（${weakTime}）共新增 ${order}个订单，为${servicePersionCount}位老人提供服务，总进度完成${percent}%。 其中${finishProjectNameString[0]}等${finishProjectNameString[1]}个项目已完成【益养科技】`;
                } else if (templateType === 1) {
                    //你所负责{**}等{**}个项目上周（{**}）共新增{**}个订单，为{**}位老人提供服务，总进度完成{**}%。【益养科技】
                    msg = `你所负责 ${city}等${projectCount}个项目${msgTime}（${weakTime}）共新增 ${order}个订单，为${servicePersionCount}位老人提供服务，总进度完成${percent}%。【益养科技】`;
                }
                await this.service.sms.send(projectsList[i].phones, msg);
                // await this.service.sms.send(18048602571, msg);
                // console.log("短信发送状态" + JSON.stringify(result));
                console.log("短信目标:(" + projectList[i].phone + ")" + "短信内容:(" + msg + ")");
            }
        }
    }


    async getConfig() {
        const config = await this.ctx.model.ProjectSMSConfig.aggregate([{
            $group: {
                '_id': "$_id",
                'role': {$push: '$role'},
                'dayState': {$push: '$dayState'},
                'weekState': {$push: '$weekState'},
                'monthState': {$push: '$monthState'},
            }
        }]);
        return config;
    }

    /**
     * 根据ObjectID的数组查找项目集合
     * @param objectIDList
     * @returns {Promise<*>}
     */
    async getProjectListByObjectID(objectIDList) {
        const projectsList = await this.ctx.model.Projects.find(
            {
                "_id": {
                    $in: objectIDList
                }
            }
        );
        return projectsList;
    }

    /**
     *获取项目监管方的所有合同的总完成比例
     * @param list
     * @returns {Promise<*>}
     */
    async getAdminAllProjectMoney(list) {
        var newarr = [];
        var projectMoney = [];
        // for (let i = 0; i < list.length; i++) {
        //     ollad.push(list[i]._id);
        // }
        for (let i = 0; i < list.length; i++) {
            var yes = "yes";
            list[i].projectStatus.map(x => {
                if (x.status === "END") {
                    yes = "no";
                    return;
                }
            });
            //金额这里只查询合同状态是未结束的
            if (yes === "yes") {
                newarr.push(list[i]._id);
            }
            //项目总价是查询所有的
            projectMoney.push(list[i].price.totalMoney);
        }

        var totalMoney = 0;
        for (let i = 0; i < projectMoney.length; i++) {
            totalMoney = totalMoney + projectMoney[i];
        }

        var money = 0;
        for (let i = 0; i < newarr.length; i++) {
            money = money + await this.getProjectFinishMoney(newarr[i].toString())
        }

        console.log("项目总金额" + JSON.stringify(totalMoney));
        console.log("服务总金额" + JSON.stringify(newarr));
        console.log("服务总金额" + JSON.stringify(money));

        //计算百分比
        var moneyI = this.ctx.helper.toInteger(money);
        var totalMoneyI = this.ctx.helper.toInteger(totalMoney);
        var percent = await this.getPercent(moneyI, totalMoneyI);
        console.log("百分比" + percent);
        return percent
    }

    /**
     * 项目大于五个只显示五个,然后进行拼接
     * @param list 需要处理的
     * @param type 1: 大于3个; 2: 小于3个
     * @returns {Promise<string>}
     */
    async interceptList(list, type) {
        var city = "";
        if (type === 1) {
            var newlist = list.slice(0, 3);
            for (let i = 0; i < newlist.length; i++) {
                if (i === newlist.length - 1) {
                    city = city + newlist[i].district.name
                } else {
                    city = city + newlist[i].district.name + ","
                }
            }
        } else if (type === 2) {
            for (let i = 0; i < list.length; i++) {
                if (i === list.length - 1) {
                    city = city + list[i].district.name
                } else {
                    city = city + list[i].district.name + ","
                }
            }
        }

        console.log("区域拼接" + city);

        return city
    }

    /**
     *
     * @returns {Promise<Array>}
     */
    async getProjectsResults() {
        let Results = [];
        let Results2 = {};
        const projectsResults = await this.ctx.model.Projects.aggregate([
            {$match: {"organization._id": "5983dea25700002f49b90e03"}},
            {
                $group: {
                    '_id': '$_id',
                    'money': {$sum: '$price.totalMoney'},
                    'projectStatus': {$push: '$projectStatus'},
                    'user': {$push: '$managers'},
                    'name': {$push: '$name'},
                    'city': {$push: "$district.name"}
                }
            }
        ]);
        //遍历处理
        // result = {[x._id.serviceType]: x.price};

        projectsResults.map(x => {
            let phones = {};
            if (x.projectStatus.length === 0 || x.projectStatus[0].length === 0) {
                if (x.user.length !== 0) {
                    x.user[0].forEach(u => {
                        if (u.name !== "" && u.name !== null && u.name !== undefined) {
                            Results2 = {
                                'id': x._id.toString(),
                                'city': x.city,
                                'money': x.money,
                                'name': u.name,
                                'phone': u.phone,
                            };
                            Results.push(Results2);
                        }
                        // console.debug("项目区域(" + x.city + ")" + "项目ID(" + x._id + ")" + "||负责人(" + u.name + ")" + "||电话(" + u.phone + ")");
                    })
                }
            } else {
                x.projectStatus.map(y => {
                    var yes;
                    y.forEach(q => {
                        if (q.status === "END") {
                            yes = "no";
                        }
                    });
                    if (yes !== "no") {
                        x.user.map(p => {
                            p.map(n => {
                                if (n.name !== "" && n.name !== null && n.name !== undefined) {
                                    Results2 = {
                                        'id': x._id.toString(),
                                        'city': x.city,
                                        'money': x.money,
                                        'name': n.name,
                                        'phone': n.phone,
                                    };
                                    Results.push(Results2);
                                }
                                // console.debug("项目区域(" + x.city + ")" + "项目ID(" + x._id + ")" + "||负责人(" + n.name + ")" + "||电话(" + n.phone + ")");
                            })
                        })
                    }
                })
            }
        });
        return Results;
    };

    /**
     * 计算新增多少订单
     * @param projectID
     * @param createdTime
     * @returns {Promise<*>}
     */
    async getBeforeDatOrderCount(projectID, createdTime) {
        const orderList = await this.ctx.model.Orders.aggregate([
            {$match: {'project._id': projectID, "organization._id": "5983dea25700002f49b90e03", 'created': createdTime}},
                {$group: {'_id' : '$project._id' , 'count' : {$sum : 1}}}
        ]);
        if (orderList.length !== 0 && orderList !== undefined) {
            return orderList[0].count;
        } else {
            return 0;
        }
    }

    /**
     * 计算服务多少人
     * @param projectID
     * @param createdTime
     * @returns {Promise<*>}
     */
    async getBeforeServiceForPersionCount(projectID, createdTime) {
        const persionCount = await this.ctx.model.Orders.aggregate([
            {
                $match: {
                    'project._id': projectID,
                    'created': createdTime,
                    'organization._id': '5983dea25700002f49b90e03'
                }
            },
            {$group: {'_id': '$target.identityNumber', "total": {$sum: 1}}},
            {$group: {'_id': null, "total": {$sum: 1}}}
        ]);
        if (persionCount.length !== 0 && persionCount !== undefined) {
            return persionCount[0].total;
        } else {
            return 0;
        }

    }

    /**
     * 获取当前合同完成多少钱
     * @param projectID
     * @returns {Promise<*>}
     */
    async getProjectFinishMoney(projectID) {
        const projectMoney = await this.ctx.model.Orders.aggregate([
            {$match: {'project._id': projectID}},
            {$unwind: "$service"},
            {$group: {_id: null, price: {$sum: '$service.price.value'}}}
        ]);
        // projectMoney.forEach(x => x.price = this.ctx.helper.toFloat(x.price));
        if (projectMoney.length !== 0 && projectMoney !== undefined) {
            return projectMoney[0].price;
        } else {
            return 0;
        }
    }

    /**
     * 获取已经完成的项目区域和总的项目个数
     * @param projectList
     * @returns {Promise<*>}
     */
    async getFinishProject(projectList) {
        var projectNameString = "";
        var arrayList = [];
        var count = 0;
        for (let i = 0; i < projectList.length; i++) {
            projectList[i].projectStatus.map(x => {
                if (x.status === "END" && i === projectList.length - 1) {
                    projectNameString = projectNameString + projectList[i].district.name + "。";
                    count = count + 1;
                } else if (x.status === "END") {
                    projectNameString = projectNameString + projectList[i].district.name + "，";
                    count = count + 1;
                }
            })
        }
        if (count === 0) {
            return ""
        } else {
            console.log("已完成项目区域" + projectNameString + "项目个数" + count);
            arrayList.push(projectNameString);
            arrayList.push(count);
            // var projectString = `其中${projectNameString}等${count}个项目已完成`;
            return arrayList;
        }
    }

    /**
     * 计算百分比
     * @param num
     * @param total
     * @returns {Promise<*>}
     */
    async getPercent(num, total) {
        if (isNaN(num) || isNaN(total)) {
            return "-";
        }
        return total <= 0 ? "0" : (Math.round(num / total * 10000) / 100.00);
    }


    /**
     * 获取时间查询条件
     * @param type 0 : 查询前一天的; 1 查询上一周的 :  2 : 查询上个月 3: 查询今日的
     * @returns {Promise<{$gte: number, $lte: number}>}
     */
    async getQueryTime(type) {
        var query;
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        if (month < 10) {
            month = "0" + month;
        }
        if (day < 10) {
            day = "0" + day;
        }
        var beforeDayStar = year + "-" + month + "-" + day;
        var beforeDayEnd = year + "-" + month + "-" + day + " 24:0:0";
        //周报
        if (type === 1) {
            query = {$gte: new Date(beforeDayStar).getTime() - 604800000, $lte: new Date(beforeDayEnd).getTime()}
        }
        //日报时间周期
        if (type === 0) {
            query = {
                $gte: new Date(beforeDayStar).getTime() - 86400000,
                $lte: new Date(beforeDayEnd).getTime() - 86400000
            };
        }
        //月报时间周期
        if (type === 2) {
            var newMonth;
            var newYear;
            if (month === 1) {
                newMonth = 12;
                newYear = year - 1;
            } else {
                newMonth = month - 1;
                newYear = year;
            }
            var monthStar = newYear + "-" + newMonth + "-" + "01";
            var monthEnd = year + "-" + month + "-" + "01" + " 24:0:0";
            query = {$gte: new Date(monthStar).getTime(), $lte: new Date(monthEnd).getTime()};
        }

        if (type === 3) {
            query = {
                $gte: new Date(beforeDayStar).getTime(),
                $lte: new Date(beforeDayEnd).getTime()
            };
        }
        return query;
    }

    /**
     * 短信时间拼接
     * @param type 0 : 日的拼接 ;1 : 拼接周到周的时间; 2 : 拼接月到月的时间;
     * @returns {Promise<*>}
     */
    async getWeakTime(type) {
        var newString;
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        if (month < 10) {
            month = "0" + month;
        }
        if (day < 10) {
            day = "0" + day;
        }

        if (type === 0) {
            var preDate = new Date(date.getTime() - 24 * 60 * 60 * 1000);
            newString = moment(preDate).format("MM-DD");
        }

        //周的拼接
        if (type === 1) {
            var beforeDayStar = year + "-" + month + "-" + day + "    0:0:0";
            var star = new Date(beforeDayStar).getTime() - 604800000;
            var starString = moment(star).format("MM-DD");
            var end = new Date(beforeDayStar).getTime()
            var endString = moment(end).format("MM-DD");
            newString = starString + '到' + endString;
        }
        //月的拼接
        if (type === 2) {
            var newMonth;
            var newYear;
            if (month === 1) {
                newMonth = 12;
                newYear = year - 1;
            } else {
                newMonth = month - 1;
                newYear = year;
            }
            var monthStar = newMonth + "-" + "01";
            var monthEnd = month + "-" + "01";
            newString = monthStar + '到' + monthEnd;
        }

        return newString;
    }


}

module.exports = ProjectSMSService;