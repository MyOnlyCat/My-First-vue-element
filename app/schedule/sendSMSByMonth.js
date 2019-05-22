'use strict';
const Subscription = require('egg').Subscription;
class sendSMSByMonth extends Subscription{
    static get schedule() {
        return {
            //每月的1号早上9点05分触发
            cron: '00 02 09 1 * *', //正式
            // cron: '50 * * * * *', //测试
            type: 'worker',
        };
    }

    /**
     * 监管人员的月报 type:2
     * @returns {Promise<void>}
     */
    async subscribe() {
        var config = await this.service.projectSMS.getConfig();
        var yes = "no";
        for (let i = 0; i < config.length; i++) {
            if (config[i].role[0] === "SUPERINTENDENT" && config[i].monthState[0] === true) {
                yes = "yes";
            }
        }
        if (yes === "yes") {
            await this.service.projectSMS.getAdminProjectResults(2);
        }
    }
}
module.exports = sendSMSByMonth;