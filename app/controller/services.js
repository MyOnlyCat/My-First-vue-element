'use strict';
const CommonController = require('./commonController');

class ServicesController extends CommonController {
    init() {
        this.daoService = this.service.services;
    }

    async deleteBulk(ctx) {
        ctx.body = await this.daoService.remove({_id: {$in: ctx.request.body}});
    }

    /**
     * 查询这个地域下面的服务项目
     * @param {*} ctx
     */
    async searchByAdCode(ctx) {
        ctx.body = await this.daoService.searchByAdCode(ctx.request.body, ctx.query);
    }

}

module.exports = ServicesController;
