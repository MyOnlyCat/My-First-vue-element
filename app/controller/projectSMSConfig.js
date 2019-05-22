'use strict';
const CommonController = require('./commonController');
class PojectSMSConfigController extends CommonController{
    init() {
        this.daoService = this.service.projectSMSConfig;
    }
}

module.exports = PojectSMSConfigController;