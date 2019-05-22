'use strict';
const DaoService = require('./daoService');

class MessagesService extends DaoService {
  init() {
    this.model = this.ctx.model.Messages;
  }
}
module.exports = MessagesService;
