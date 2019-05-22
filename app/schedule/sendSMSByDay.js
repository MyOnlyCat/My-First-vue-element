'use strict';
const Subscription = require('egg').Subscription;

class sendSMSByDay extends Subscription {
    static get schedule() {
        return {
            //每天的早上9点02分触发
            cron: '0 1 9 * * *', //正式
            // cron: '50 * * * * *', //测试
            type: 'worker',
        };
    }

    /**
     * 监管人员的日报 type:0
     * @returns {Promise<void>}
     */
    async subscribe() {
        var config = await this.service.projectSMS.getConfig();
        var yes = "no";
        for (let i = 0; i < config.length; i++) {
            if (config[i].role[0] === "SUPERINTENDENT" && config[i].dayState[0] === true) {
                yes = "yes";
            }
        }
        if (yes === "yes") {
            await this.service.projectSMS.getAdminProjectResults(0);
        }
    }
}

module.exports = sendSMSByDay;