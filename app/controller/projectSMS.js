'use strict';
const CommonController = require('./commonController');
class PojectSMSController extends CommonController{
    init() {
        this.daoService = this.service.projectSMS;
    }
}

module.exports = PojectSMSController;