'use strict';
const CommonController = require('./commonController');
class OrderBackupController extends CommonController{
    init() {
        this.daoService = this.service.orderBackup;
    }
}

module.exports = OrderBackupController;