'use strict';
const Subscription = require('egg').Subscription;
class sendSMSByWeek extends Subscription{
    static get schedule() {
        return {
            //每周1的9点0分0秒触发
            //00 03 09 * * 1
            cron: '00 03 09 * * 1', //正式
            // cron: '20 * * * * *', //测试
            type: 'worker',
        };
    }

    /**
     * 监管人员的周报 type:1
     * @returns {Promise<void>}
     */
    async subscribe() {
        var config = await this.service.projectSMS.getConfig();
        var yes = "no";
        for (let i = 0; i < config.length; i++) {
            if (config[i].role[0] === "SUPERINTENDENT" && config[i].weekState[0] === true) {
                yes = "yes";
            }
        }
        if (yes === "yes") {
            await this.service.projectSMS.getAdminProjectResults(1);
        }
    }
}
module.exports = sendSMSByWeek;