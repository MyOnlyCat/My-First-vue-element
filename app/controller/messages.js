'use strict';
const CommonController = require('./commonController');
class MessagesController extends CommonController {
  init() {
    this.daoService = this.service.messages;
  }
}
module.exports = MessagesController;
