'use strict';
const DaoService = require('./daoService');

class projectSMSConfigService extends DaoService {
    init() {
        this.model = this.ctx.model.ProjectSMSConfig;
    }
}
module.exports = projectSMSConfigService;