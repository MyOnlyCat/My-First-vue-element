'use strict';
const DaoService = require('./daoService');

class OrderBackupService extends DaoService {
    init() {
        this.model = this.ctx.model.OrderBackup;
    }
}
module.exports = OrderBackupService;