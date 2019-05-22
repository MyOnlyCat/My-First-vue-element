'use strict';
const CommonController = require('./commonController');

class TaskController extends CommonController {
    init() {
        this.daoService = this.service.task;
    }
}
module.exports = TaskController;