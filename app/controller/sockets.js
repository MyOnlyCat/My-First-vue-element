'use strict';

const Controller = require('egg').Controller;

/**
 * 为websocket用的
 */
class SocketsController extends Controller {
  async ping() {
    const message = this.ctx.args[0];
    this.ctx.socket.join('testRoom');
    await this.ctx.socket.emit('message', `Hi! I've got your message: ${message}`);//测试用,如连接正常,客户端会收到这条消息
  }
  
  async disconnect() {
    const message = this.ctx.args[0];
    console.log(message);
  }

  async joinRoom() {
    const room = this.ctx.args[0];
    this.ctx.socket.join(room);
    
    // let rooms = Object.keys(this.ctx.app.io.sockets.adapter.rooms);
    // console.log(rooms); // [ <socket.id>, 'room 237' ]

    await this.ctx.socket.emit('message', `join room ${room} ok`);
  }
}

module.exports = SocketsController;
