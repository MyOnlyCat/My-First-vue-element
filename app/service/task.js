'use strict';
const DaoService = require('./daoService');

class TaskService extends DaoService {
    init() {
        this.model = this.ctx.model.Task;
    }
}

module.exports = TaskService;