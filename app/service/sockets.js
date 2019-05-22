'use strict';

const Service = require('egg').Service;
const moment = require('moment');

class SocketsService extends Service {

    /**
     * 发送消息到房间，房间由区域决定
     * @param {*} district 
     * @param {*} eventName 
     * @param {*} args 
     */
    async emitRoomsByDistrict(district, eventName, ...args) {
      const adcodes = this.service.districts.getDistrictAncestorSQL(district);
      let rooms = Object.keys(this.ctx.app.io.sockets.adapter.rooms);
      adcodes.forEach(async adcode=> {
        if (rooms.includes(adcode)) {
          await this.ctx.app.io.to(adcode).emit(eventName, ...args);
        }
      })
    }
}

module.exports = SocketsService;