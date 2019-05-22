'use strict';
const Subscription = require('egg').Subscription;

class sendSMSToLeaderByDay extends Subscription {
    static get schedule() {
        return {
            cron: '0 0 9 * * *', //正式
            // cron: '50 * * * * *', //测试
            type: 'worker',
        };
    }

    /**
     * 负责人员的日报
     * @returns {Promise<void>}
     */
    async subscribe() {

        var config = await this.service.projectSMS.getConfig();
        var yes = "no";
        for (let i = 0; i < config.length; i++) {
            if (config[i].role[0] === "PRINCIPAL" && config[i].dayState[0] === true) {
                yes = "yes";
            }
        }
        if (yes === "yes") {
            const projectList = await this.service.projectSMS.getProjectsResults();
            await this.service.projectSMS.sendSMS(projectList)
        }
    }
}

module.exports = sendSMSToLeaderByDay;