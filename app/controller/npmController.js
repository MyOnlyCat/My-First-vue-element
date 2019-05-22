'use strict';
const Controller = require('egg').Controller;
const moment = require('moment');
const mongoose = require('mongoose');

// const usersService = require('../service/users');
/**
 * POST跨域请求
 */
class NpmController extends Controller {

//******************************************************************有数据的二维码******************************************************************
    /**
     * 发送打包有数据的二维码数据请求
     * @returns {Promise<void>}
     * @param ctx
     */
    async packageQRDate(ctx) {
        console.log("打包请求发出");
        //那到老人数据
        const userData = await this.service.users.getData(ctx);
        // await this.service.users.getData();
        const x = JSON.stringify(userData);
        //请求
        const result = await ctx.curl('39.104.90.86:9080/jgyl/qrCodeController.do?saveQr', {
            // 必须指定 method
            method: 'POST',
            // 通过 contentType 告诉 HttpClient 以 JSON 格式发送
            contentType: 'json',
            data:
            userData
            ,
            // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
            dataType: 'json',
        });
        console.log(JSON.stringify(result)); //目前暂定返回任务ID
        console.log(JSON.stringify(result.data)); //目前暂定返回任务ID
        //下面开始保存步骤 第一步拼接数据
        if (result.data !== undefined && result.data !== null && result.data !== "") {
            // this.asveTaskData()
            const taskDate = {
                "_id": mongoose.Types.ObjectId(),
                "schedule": 1, //下载进度 1: 任务创建, 2: 任务完成
                "taskType": 1, //有数据的二维码下载
                "creatUserId": this.ctx.request.body.userid /*this.ctx.request.body.userid*/, //拿到创建任务的用户ID
                "taskID": result.data /*result.id*/, //获取Java接口返回的任务ID
                "taskCreatTime": moment().format('X') * 1000, //毫秒时间戳
                "taskFinishTime": null,
                "url": null
            };
            this.ctx.model.Task.create(taskDate);
            console.log("创建完成")
        }
        ctx.body = result;
    }

//******************************************************************空二维码******************************************************************
    /**
     * 发送打包空白二维码请求
     * @returns {Promise<void>}
     */
    async productionQRByPost(ctx) {
        console.log("空白二维码请求");
        const qrData = await this.service.users.productionQR(); //UUID的数组
        //请求
        const result = await ctx.curl('39.104.90.86:9080/jgyl/qrCodeController.do?saveQr', {
            // const result = await ctx.curl('192.168.31.133:9080/jgyl/qrCodeController.do?saveQr', {
            // 必须指定 method
            method: 'POST',
            // 通过 contentType 告诉 HttpClient 以 JSON 格式发送
            contentType: 'json',
            data:
            qrData
            ,
            // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
            dataType: 'json',
        });

        console.log("空白二维码结构" + JSON.stringify(result));

        if (result.data !== undefined && result.data !== null && result.data !== "") {
            // this.asveTaskData()
            const taskDate = {
                "_id": mongoose.Types.ObjectId(),
                "schedule": 1, //下载进度 1: 任务创建, 2: 任务完成
                "taskType": 2, //空白二维码下载
                "creatUserId": this.ctx.request.body.userid /*this.ctx.request.body.userid*/, //拿到创建任务的用户ID
                "taskID": result.data /*result.id*/, //获取Java接口返回的任务ID
                "taskCreatTime": moment().format('X') * 1000, //毫秒时间戳
                "taskFinishTime": null,
                "url": null
            };
            this.ctx.model.Task.create(taskDate);
            console.log("创建完成")
        }

        ctx.body = result;
    }

//******************************************************************Java回调******************************************************************

    /**
     * Java端请求保存二维码处理过程
     *
     * @returns {Promise<void>}
     */
    async recordTask() {
        const taskid = this.ctx.request.body.taskid;
        const url = this.ctx.request.body.url;
        console.log(url);
        await this.ctx.model.Task.update(
            {'taskID': taskid},
            {
                $set: {
                    'schedule': 2,
                    'url': 'http://39.104.90.86:80/filess' + url,
                    "taskFinishTime": moment().format('X') * 1000
                }
            }
        );
        console.log("下载任务状态变更");
        // ctx.body = {"msg" : "good"};
    }

//******************************************************************二维码下载******************************************************************

    /**
     * 下载二维码打包文件
     * @returns {Promise<void>}
     */
    async downloadTask() {
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
        var star = moment().format('X') * 1000; //请求的的时间
        var end = new Date(beforeDayEnd).getTime() + 345600000; //下载截止日期
        const userid = this.ctx.request.body.userid; //用户ID
        const urlArr = await this.ctx.model.Task.find(
            {'creatUserId': userid, 'schedule': 2},
            {'url': 1, '_id': 0, "taskFinishTime": 1, "taskType": 1}
        );
        const resultArr = urlArr.map(x => {
            let result = {};
            const ft = urlArr[0].taskFinishTime;
            if (star >= ft && star <= ft + 345600000) {
                console.log(urlArr[0].url);
                result = {["taskFinishTime"]: ft, ["url"]: urlArr[0].url, ["taskType"]: urlArr[0].taskType};
                return result
            }
        });

        console.log(JSON.stringify(resultArr));

        this.ctx.body = urlArr
    }

//******************************************************************实体保存******************************************************************

    /**
     * 保存下载任务情况
     * @param taskType 任务类型 1: 有数据的二维码 2:空二维码
     * @param schedule 任务进度 1: 任务创建, 2: 任务完成
     * @param result Java端返回的数据
     * @param taskFinishTime 任务完成的时间
     * @param url Java端生成完毕返回的下载地址
     * @returns {Promise<void>}
     */
    async asveTaskData(taskType, schedule, result, taskFinishTime, url) {
        const taskDate = {
            "_id": mongoose.Types.ObjectId(),
            "taskType": taskType, //任务类型 1: 有数据的二维码 2:空二维码
            "schedule": schedule, //下载进度 1: 任务创建, 2: 任务完成
            "creatUserId": 123 /*this.ctx.request.body.userid*/, //拿到创建任务的用户ID
            "taskID": result.data /*result.id*/, //获取Java接口返回的任务ID
            "taskCreatTime": moment().format('X') * 1000, //毫秒时间戳
            "taskFinishTime": taskFinishTime,
            "url": url
        };
        this.ctx.model.Task.create(taskDate);
    }


//******************************************************************根据用户的UUID获取用户信息******************************************************************


    async getUserDataByUUID() {
        console.log("进入UUID");
        const uuid = this.ctx.params.uuid;
        const userMsg = await this.ctx.model.Users.findOne(
            {'uuid': uuid}
        );
        this.ctx.body = userMsg
    }

//******************************************************************二维码绑定用户******************************************************************
    async saveUserByQRAndUserID(ctx) {
        console.log("绑定空白二维码");
        let data;
        const uuid = ctx.request.body.uuid;
        const userId = ctx.request.body.userid;
        const userMsg = await this.ctx.model.Users.findOne(
            {'_id': userId}
        );
        if (userMsg.uuid !== undefined) {
            if (userMsg !== null && userMsg.uuid !== null) {
                data = {"msg": "bad"};
            } else {
                await this.ctx.model.Users.update(
                    {'_id': userId},
                    {$set: {"uuid": uuid}}
                );
                data = {"msg": "good"};
            }
        } else {
            await this.ctx.model.Users.update(
                {'_id': userId},
                {$set: {"uuid": uuid}}
            );
            data = {"msg": "good"};
        }
        this.ctx.body = data
    }

    async abolishQR() {
        console.log("进入销毁");
        const res = await this.service.users.abolishQR();
        this.ctx.body = res;
    }

    async upUUID() {
        console.log("进入处理");
        const rse = await this.service.users.upDataUUID();
        this.ctx.body = rse;
    }

    async testUser1() {
        console.log("进入测试方法");
        const testarr = await this.service.users.getUserMsgByOrID();
        this.ctx.body = testarr;
    }

}

module.exports = NpmController;
