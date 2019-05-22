'use strict';
const CommonController = require('./commonController');
class transactionFlowController extends CommonController{
    init() {
        this.daoService = this.service.transactionFlow;
    }
    //post请求
    async getTransactionData(ctx){
        console.log(ctx.request.body.times);
        const result = await this.daoService.getAllData(ctx);
        return ctx.body = result;
    }
    
}
module.exports = transactionFlowController;