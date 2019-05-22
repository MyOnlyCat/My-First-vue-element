'use strict';
const CommonController = require('./commonController');
const mongoose = require('mongoose');
const moment = require('moment');
var _ = require('lodash');
const archiver = require('archiver');
const HtmlDocx = require('html-docx-js');
const xlsx = require('node-xlsx').default;
var fs = require('fs');


class OrdersController extends CommonController {
    init() {
        this.daoService = this.service.orders;
    }

    /**
     * when order change, update the Statistic
     * @param {*} oldOrder
     * @param {*} newOrder
     */
    async changedOrder(oldOrder, newOrder) {
        if (!newOrder.service) {
            return;
        }
        const oldServiceStr = oldOrder.service.map(s => ({_id: s._id, value: s.price.value})).sort();
        const newServiceStr = newOrder.service.map(s => ({_id: s._id, value: s.price.value})).sort();
        if (oldOrder.status === newOrder.status && _.isEqual(oldServiceStr, newServiceStr) && (newOrder.finishDate && oldOrder.finishDate === newOrder.finishDate)) {
            return;
        }
        if (oldOrder.status === 'COMPLETE') {
            //remove in ss
            await this.service.statisticByTargets.convertToStatisticByTarget(oldOrder, false);
            // await this.service.statisticByTargets.convertToOrderByTargets(oldOrder, false);
            await this.service.statisticByTargets.convertToStatisticByProvider(oldOrder, false);
        }
        if (newOrder.status === 'COMPLETE') {
            //add in ss
            await this.service.statisticByTargets.convertToStatisticByTarget({...oldOrder, ...newOrder});
            // await this.service.statisticByTargets.convertToOrderByTargets({ ...oldOrder, ...newOrder });
            await this.service.statisticByTargets.convertToStatisticByProvider({...oldOrder, ...newOrder});
        }
    }

    async destroy(ctx) {
        const orderId = ctx.params.id;
        const order = await this.daoService.show(orderId);
        if (!order) {
            this.fail('订单不存在', 417);
            return;
        }
        if ('COMPLETE' === order.status) {
            //remove in ss
            await this.service.statisticByTargets.convertToStatisticByTarget(order, false);
            await this.service.statisticByTargets.convertToStatisticByProvider(order, false);
        }
        ctx.body = await this.daoService.destroy(orderId);
    }

    async update(ctx) {
        const updateParams = ctx.request.body;
        const orderId = ctx.params.id;
        const order = await this.daoService.show(orderId);
        if (!order) {
            if (ctx.query.sendSMS === 'false') {
                updateParams._id = mongoose.Types.ObjectId(updateParams._id);
                await this.ctx.model.Orders.create(updateParams)
            }
            // this.fail('订单不存在', 417);
            // return;
        }
        // if ('COMPLETE' === updateParams.status || 'COMPLETE' === order.status) {
        //     this.changedOrder(order, updateParams);
        // }
        // if (order.status != updateParams.status && 'COMPLETE' == updateParams.status) {
        //     this.insertMessage({_id: orderId, ...updateParams})
        // }
        // if (order.provider != updateParams.provider && updateParams.provider) {
        //     await this.sendNewOrderPushMessage({...order, ...updateParams});
        // }
        if (updateParams.category == 'PHONE_BOOK' && updateParams.status) {
            if (order.status != updateParams.status) {
                await this.service.callRecords.findOneAndUpdate({'bookOrder._id': orderId}, {$set: {'bookOrder.status': updateParams.status}});
            }
        }
        if (ctx.query.sendSMS == 'true') {
            const time = moment(order.serviceDate).format("YYYY-MM-DD");
            let services = order.service;
            if (updateParams.service) {
                services = updateParams.service;
            }
            const serviceNames = services.map(s => s.name).join('、');
            const content = `您预约的居家养老服务（${serviceNames}）已经受理，预约服务日期${time}，我们将尽快安排服务人员跟您联系！ 【益养科技】`
            await this.service.sms.send(order.bookUser.phone, content);
        }
        ctx.body = await this.daoService.update(orderId, updateParams);
    }

    async create(ctx) {
        console.debug("开始获取订单编号时间  " + moment().format('YYYY-MM-DD HH:mm:ss'));
        const numbers = await this.generateBatchOrderNo();
        console.debug("结束获取订单编号时间  " + moment().format('YYYY-MM-DD HH:mm:ss'));
        const order = ctx.request.body;
        order.serialNumber = numbers;
        const result = await this.daoService.create(order);

        //这个是给服务人员推送短信,暂时关闭
        // if (order.provider && order.provider._id) {
        //     await this.sendNewOrderPushMessage({...result, ...order});
        // }

        //这个代码不知道是干嘛的没注释,而且 surplus 节点没有见到使用过
        // const target = await this.service.users.show(order.target._id);
        // if (target.subsidy && target.surplus && target.surplus.value != 0) {
        //     const surplus = target.surplus;
        //     let leftValue = surplus.value - order.service.map(s => s.price.value).reduce((a, b) => a + b);
        //     if (leftValue < 0) {
        //         leftValue = 0;
        //     }
        //     surplus.value = leftValue;
        //
        //     await this.service.users.update(order.target._id, {surplus});
        // }

        //这个是统计的,暂时不需要了那个统计页面了
        // if (order.status === 'COMPLETE') {
        //     //add in ss
        //     await this.service.statisticByTargets.convertToStatisticByTarget(order);
        //     await this.service.statisticByTargets.convertToStatisticByProvider(order);
        // }
        ctx.body = {...result, serialNumber: order.serialNumber};
        console.log("完成时间  " + moment().format('YYYY-MM-DD HH:mm:ss'));
    }

    /**
     * 生成订单号
     * @param {*} number
     */
    async generateBatchOrderNo() {
        const atanisi = Math.floor(Math.random() * 999999);
        const serialNumStr = moment().format('YYYYMMDD') + atanisi;

        const newSerialNumStr = await this.orderSerialNumberCheck(serialNumStr, 1);

        return newSerialNumStr;
    }

    async orderSerialNumberCheck(serialNumStr, count) {
        if (count < 10) {
            let orders = await this.daoService.find({
                serialNumber: serialNumStr
            },{'_id': 1});
            if (orders.length === 0) {
                return serialNumStr;
            } else {
                const atanisi = Math.floor(Math.random() * 999999);
                const serialNumStr = moment().format('YYYYMMDD') + atanisi;
                count = count + 1;
                this.orderSerialNumberCheck(serialNumStr, count);
            }
        }
    }

    /**
     * 推送消息
     * @param {*} order
     */
    async sendNewOrderPushMessage(order) {
        const user = await this.service.users.show(order.provider._id);
        const pushObject = {
            message: '您有新订单',
            audiences: [user.phone],
            extra: {
                orderId: order._id,
                title: '您有新的养老服务订单',
                content: '点击查看详情',
                type: 'ORDER',
            }
        };
        await this.service.push.sendExtra(pushObject);
    }

    async insertMessage(order) {
        const content = {
            type: 'ORDER',
            orderId: order._id,
            content: `订单${order.serialNumber}已完成`
        }
        const title = order.service.map(o => o.name).join(", ");
        const message = {
            title: title + "服务反馈",
            sender: order.provider,
            content,
            organization: order.organization,
            status: 'NEW'
        };
        return await this.service.messages.create(message);
    }

    //流水统计
    async findAndTurnover(ctx) {
        const pageObjects = await this.daoService.index(ctx.query);
        const totalMoney = await this.daoService.totalMoney(this.daoService.queryCriteria(ctx.request.body))
        pageObjects.totalMoney = totalMoney.totalMoney
        ctx.body = pageObjects;
    }


    /**
     * 搜索订单,并重新查询target
     * @param {*} ctx
     */
    async findAndTarget(ctx) {
        const pageObjects = await this.daoService.index(ctx.query);
        const promises = pageObjects.content.map(async o => {
            const target = await this.service.users.show(o.target._id);
            const provider = await this.service.users.show(o.provider._id);
            o.target = target;
            o.provider = provider;
            return o;
        });

        pageObjects.content = await Promise.all(promises);
        ctx.body = pageObjects;
    }

    /**
     * 返回以订单里每个服务项目做基本单位
     * @param {*} ctx
     */
    async findAndServiceItem(ctx) {
        const search = ctx.request.body;
        const metric = search.metric;
        if (metric && metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric);
            search.eqs = {...search.eqs, ...result}
        }

        const query = this.service.orders.queryCriteria(search)
        const pageObjects = await this.service.orders.findAndServiceItem(query, ctx.query);
        const promises = pageObjects.content.map(async o => {
            const target = await this.service.users.show(o.target._id);
            const provider = await this.service.users.show(o.provider._id);
            o.target = target;
            o.provider = provider;
            return o;
        })

        pageObjects.content = await Promise.all(promises);
        ctx.body = pageObjects;
    }

    /**
     * 生成订单号
     * @param {*} number
     */
    // async generateBatchOrderNo(number) {
    //     const result = [];
    //     const serialNumStr = moment().format('YYYYMMDD') + "00001";
    //     let serialNum = Number.parseInt(serialNumStr);
    //     let start = moment({hour: 0});
    //     let end = moment(start).add(1, 'day');
    //
    //     let orders = await this.daoService.find({
    //         serialNumber: {$gte: serialNum},
    //         created: {$gt: start.valueOf(), $lt: end.valueOf()}
    //     }, null, {serialNumber: -1});
    //     if (orders.length > 0) {
    //         const latestOrder = orders[0];
    //         serialNum = (latestOrder.serialNumber + 1);
    //     }
    //
    //     for (let i = 0; i < number; i++) {
    //         result.push((serialNum + i));
    //     }
    //
    //     return result;
    // }

    /**
     * 批量创建订单
     * @param {*} ctx
     */
    async saveBatch(ctx) {
        const orders = ctx.request.body;
        const numbers = await this.generateBatchOrderNo(orders.length);
        for (let i = 0; i < numbers.length; i++) {
            const order = orders[i];
            const serialNumber = numbers[i];
            order.serialNumber = serialNumber;
            await this.daoService.create(order);
        }
        this.success();
    }

    // 导出excel
    async exportDocx(ctx) {
        const html = `<!DOCTYPE html>
    <html>
    <head> 
    <meta charset="utf-8"> 
    <title>菜鸟教程(runoob.com)</title> 
    </head>
    <body>
     
    <div id="container" style="width:500px">
     
    <div id="header" style="background-color:#FFA500;">
    <h1 style="margin-bottom:0;">主要的网页标题</h1></div>
     
    <div id="menu" style="background-color:#FFD700;height:200px;width:100px;float:left;">
    <b>菜单</b><br>
    HTML<br>
    CSS<br>
    JavaScript</div>
     
    <div id="content" style="background-color:#EEEEEE;height:200px;width:400px;float:left;">
    内容在这里</div>
     
    <div id="footer" style="background-color:#FFA500;clear:both;text-align:center;">
    版权 © runoob.com</div>
     
    </div>
     
    </body>
    </html>
    `
        // fs.readFile('/media/sutdy/workspaces/node/hcc-sms-node-test/test.html', 'utf-8', function(err, html) {
        //   if (err) throw err;

        //   var docx = HtmlDocx.asBlob(html);
        //   fs.writeFile('/media/sutdy/workspaces/node/hcc-sms-node-test/test.docx', docx, function(err) {
        //     if (err) throw err;
        //   });
        // });


        var docx = HtmlDocx.asBlob(html);
        ctx.set('Content-Type', 'application/octet-stream');
        // ctx.set('Content-Length', fileMeta.length);
        ctx.attachment('test.docx');
        ctx.body = docx;
    }

    //导出订单图片
    async exportImages(ctx) {
        const query = ctx.request.body;
        if (!query.eqs['district.adcode']) {
            this.fail('请选择到村', 417);
            return;
        }
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric);
            query.eqs = {...query.eqs, ...result}
        }
        let queryCriteria = this.service.orders.queryCriteria(query);
        const results = await this.service.orders.find(queryCriteria, {target: 1, images: 1});
        const archive = archiver('zip',
            {
                zlib: {level: 9} // Sets the compression level.
            });
        archive.on('error', function (err) {
            console.error('Error while zipping', err);
        });

        const allPromises = results.map(async o => {
            const {target, images} = o;
            if (!images) {
                return;
            }
            const allPromises = [];
            images.forEach(i => {
                let file;
                if (ctx.app.config.env == 'prod') {
                    file = this.service.files.downloadSSOStream(i);
                } else {
                    file = this.service.files.downloadSSOStream(i);
                    // file = this.service.files.downloadStream(i);
                }
                allPromises.push(file);
            });
            const imagesBuffers = await Promise.all(allPromises);
            imagesBuffers.forEach((img, index) => {
                if (img) {
                    archive.append(img, {name: `${target.name}-${target.identityNumber}/${images[index]}`});
                } else {
                    console.log("空")
                }
            })
        });
        await Promise.all(allPromises);
        archive.finalize();
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.attachment('images.zip');
        ctx.body = archive;
    }

    //导出订单详情
    async exportOrderServices(ctx) {
        const query = ctx.request.body;
        // if (!query.eqs['district.adcode']) {
        //     this.fail('请选择到村', 417);
        //     return;
        // }
        console.log("进入方法");
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric);
            query.eqs = {...query.eqs, ...result}
        }
        let queryCriteria = this.service.orders.queryCriteria(query);
        let serviceObjs = await this.service.orders.statisticServiceName(queryCriteria);
        const serviceNames = [];
        serviceObjs.forEach(s => {
            serviceNames.push(s.service.name);
            serviceNames.push('单价');
        });
        console.log("开始查询数据........");
        console.log("查询条件为" + JSON.stringify(queryCriteria));
        let results = await this.service.orders.find(queryCriteria);
        console.log("数据查找完成,数据量" + results.length);
        console.log("开始前期处理");
        const promises = results.map(async o => {
            const target = await this.service.users.show(o.target._id);
            o.target = target;
            return o;
        });

        results = await Promise.all(promises);
        let map = 0;
        console.log("开始处理数据");
        const xlsData = results.map((t, index) => {
            const serviceData = [];
            serviceObjs.forEach(s => {
                let count, price = s.service.price.unitPrice || s.service.price.value;
                const findService = t.service.find(si => si._id === s._id);
                if (findService) {
                    count = findService.price.count || 1;
                    price = findService.price.unitPrice || findService.price.value;
                }
                serviceData.push(count);
                serviceData.push(price);
            });
            const orderPrice = t.service.map(s => s.price.value).reduce((a, b) => a + b);
            map = map + 1;
            console.log("完成订单---------------------------------" + map);
            return [index + 1, this.ctx.helper.formatDate(t.serviceDate, 'MM-DD'), t.district.ancestors.street + t.district.name, t.target.name, t.target.contactNumber, t.target.identityNumber, t.target.currentAddress, t.target.lifeCondition,
                ...serviceData, orderPrice];
        });

        const xlsHeader = ['序号', '服务日期', '乡镇', '姓名', '电话号码', '身份证号码', '户籍地址', '老人类型', ...serviceNames, '小计', '备注']
        const data = [xlsHeader, ...xlsData];

        const margin = {
            left: 0.75,
            right: 0.75,
            top: 1,
            bottom: 1,
            footer: 0.509722222222222,
            header: 0.509722222222222
        };
        const option = {'!ref': 'A1:G3', '!margins': margin};
        const buffer = xlsx.build([{name: '项目服务表', data}], option); // Returns a buffer
        console.log("数据处理完成");
        ctx.set('Content-Type', 'application/octet-stream');
        // ctx.set('Content-Length', fileMeta.length);
        ctx.attachment('项目服务表.xlsx');
        ctx.body = buffer;
    }

    /**
     * 服务人员今日服务订单的进度
     * @param ctx
     * @returns {Promise<void>}
     */
    async getServicePersionOrderByID(ctx) {
        const data = await this.daoService.getServicePersionOrderByID(ctx);
        ctx.body = data
    }

    async dellSpecificTasksX(ctx) {
        const xx = ctx.request.body;
        console.log(xx);
        this.ctx.body = await this.ctx.model.SpecificTasks.create(xx);
    }

    /**
     * 指派订单数据
     * @returns {Promise<void>}
     */
    async getSpecificTasksByID() {
        console.log("进入");
        const data = await this.daoService.getSpecificTasks();
        this.ctx.body = data
    }

    /**
     * 服务次数总览
     * @returns {Promise<void>}
     */
    async getServiceCountByID() {
        console.log("进入");
        const data = await this.daoService.getServiceCount();
        this.ctx.body = data
    }

    /**
     * 合同限时情况下订单的完成,和接取订单的处理
     * @param ctx
     * @returns {Promise<void>}
     */
    async getJudgeTimeLimit(ctx) {
        console.log("进入");
        const data = await this.daoService.judgeTimeLimit(ctx);
        ctx.body = data;
    }

    /**
     * 服务费用差异统计
     * @param ctx
     * @returns {Promise<void>}
     */
    async getServiceChargesDifference(ctx) {
        console.log("进入服务费用差异统计controller");
        const data = await this.daoService.serviceChargesDifference(ctx);
        ctx.body = data;
    }

    /**
     * 图片差异统计
     * 返回统计数据,以及异常订单数据
     * @param ctx
     * @returns {Promise<void>}
     */
    async getServiceImgDifference(ctx) {
        console.log("进入图片差异统计controller");
        const data = await this.daoService.serviceImgDifferenceError(ctx.query, ctx);
        // const data = await this.daoService.serviceImgDifferenceNormal(ctx.query, ctx);
        // await this.daoService.timeToCalculate();
        ctx.body = data;
    }

    /**
     * 图片差异统计
     * 返回正常订单数据
     * @param ctx
     * @returns {Promise<void>}
     */
    async getServiceImgDifferenceNormal(ctx) {
        console.log("进入图片差异统计controller");
        const data = await this.daoService.serviceImgDifferenceNormal(ctx.query, ctx);
        ctx.body = data;
    }

    /**
     * 根据用户权限得到合同
     * @param ctx
     * @returns {Promise<void>}
     */
    async getProjectByUserRole(ctx) {
        console.log("进入根据用户权限得到合同controller");
        const data = await this.daoService.projectByUserRole(ctx);
        ctx.body = data;
    }


    //showLocation
    async getlocationData() {
        this.ctx.body = this.daoService.showLocation();
    }

    /**
     * 得到根据合同的ID,查询数据库得到城市分布
     * @param ctx
     * @returns {Promise<void>}
     */
    async getOrderAnalysisDistrict(ctx) {
        const data = await this.daoService.orderAnalysisDistrict(ctx);
        ctx.body = data;
    }
    async getOrderAnalysisDistrictCopy(ctx) {
        const data = await this.daoService.orderAnalysisDistrictCopy(ctx);
        ctx.body = data;
    }

    /**
     * 获取合同区域下的订单数量
     * @param ctx
     * @returns {Promise<void>}
     */
    async orderAnalysisCount(ctx) {
        const data = await this.daoService.orderAnalysis(ctx);
        ctx.body = data;
    }
    /**
     * 获取合同区域下的订单最新图片
     * @param ctx
     * @returns {Promise<void>}
     */
    async latelyImagesOfOrderController(ctx) {
        const data = await this.daoService.latelyImagesOfOrder(ctx);
        ctx.body = data;
    }

    async projectInfoList(ctx) {
        const data = await this.daoService.projectInfoList(ctx);
        ctx.body = data;
    }

    async ageCalculate(ctx) {
        const data = await this.daoService.ageCalculate(ctx);
        ctx.body = data;
    }

    async updatImage(ctx) {
        const newVar = await this.daoService.findOneAndUpdatImage(ctx);
        ctx.body = newVar
    }

    async getaNYueOrderTime(ctx) {
        const data = await this.daoService.aNYueOrderTime(ctx.request.body.projectId, ctx.request.body.serviceTime);
        ctx.body = data;
    }


}

module.exports = OrdersController;
