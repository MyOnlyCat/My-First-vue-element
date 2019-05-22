'use strict';
const DaoService = require('./daoService');

class transactionFlowService extends DaoService {
    init() {
        this.model = this.ctx.model.BusinesOrders;
    }

    async getAllData(ctx) {
        let queryCriteria = this.service.orders.queryCriteria(ctx.request.body);

        //交易流水
        const dealResults = await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: null,
                    price: {$sum: '$price.value'}
                }
            }
        ]);
        //处理小数点
        dealResults.forEach(x => x.price = this.ctx.helper.toFloat(x.price));
        console.log("交易流水 : " + JSON.stringify(dealResults));

        //充值金额 和 消费金额
        const classifyResults = await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: '$category',
                    price: {$sum: '$price.value'}
                }
            }]);
        //处理小数点
        classifyResults.forEach(x => x.price = this.ctx.helper.toFloat(x.price));
        console.log("充值金额 和 消费金额 : " + JSON.stringify(classifyResults));

        //注册会员和居家老人的充值消费(isHCS 为空代表居家老人 为false是会员)
        const membersConsumptionResults = await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: {isHCS: '$target.isHCS', category: '$category'},
                    price: {$sum: '$price.value'}
                }
            }]);
        //处理小数点
        membersConsumptionResults.forEach(x => x.price = this.ctx.helper.toFloat(x.price));
        console.log("注册会员和居家老人的充值消费" + JSON.stringify(membersConsumptionResults));

        //百分比结果数据
        const percentageResults = await this.model.aggregate([
            {$match: queryCriteria},
            {$match: {'category': 'CONSUME'}},
            {$unwind: '$service'},
            {
                $group: {
                    _id: {isHCS: '$target.isHCS', serviceType: "$service.category"},
                    price: {$sum: '$price.value'}
                }
            }
        ]);
        //处理小数点
        percentageResults.forEach(x => x.price = this.ctx.helper.toFloat(x.price));
        console.log("百分比结果数据" + JSON.stringify(percentageResults));

        const arrForIsHCS = percentageResults.map(x => {
            let result = {};
            if (x._id.isHCS === false) {
                result = {[x._id.serviceType]: x.price};
                return result
            }
        });
        const arrForIsHCSResults = arrForIsHCS.filter(x => x !== undefined);

        const arrForNoHCS = percentageResults.map(x => {
            let result = {};
            if (x._id.isHCS !== false) {
                result = {[x._id.serviceType]: x.price};
                return result
            }
        });
        const arrForNoHCSResults = arrForNoHCS.filter(x => x !== undefined);


        console.log("会员消费分类" + JSON.stringify(arrForIsHCSResults));
        console.log("非会员消费分类" + JSON.stringify(arrForNoHCSResults));

        let money;
        if (dealResults.length > 0) {
            money = dealResults[0].price
        } else {
            money = 0;
        }

        let consume;
        if (classifyResults.length > 0) {
            consume = classifyResults.find((value, index, arr) => {
                return value._id === "CONSUME"
            }).price;
        } else {
            consume = 0;
        }


        let deposit;
        if (classifyResults.length > 0) {
            deposit = classifyResults.find((value, index, arr) => {
                return value._id === "DEPOSIT"
            }).price;
        } else {
            deposit = 0;
        }

        let isHCSCONSUME;
        if (membersConsumptionResults.length > 0) {
            isHCSCONSUME = membersConsumptionResults.find(((value, index, arr) => {
                return value._id.isHCS === false && value._id.category === "CONSUME"
            })).price
        } else {
            isHCSCONSUME = 0;
        }

        let isHCSDEPOSIT;
        if (membersConsumptionResults.length > 0) {
            isHCSDEPOSIT = membersConsumptionResults.find(((value, index, arr) => {
                return value._id.isHCS === false && value._id.category === "DEPOSIT"
            })).price
        } else {
            isHCSDEPOSIT = 0;
        }

        let noHCSCONSUME;
        if (membersConsumptionResults.length > 0) {
            noHCSCONSUME = membersConsumptionResults.find(((value, index, arr) => {
                return value._id.isHCS !== false && value._id.category === "CONSUME"
            })).price
        } else {
            noHCSCONSUME = 0;
        }

        let noHCSDEPOSIT;
        if (membersConsumptionResults.length > 0) {
            noHCSDEPOSIT = membersConsumptionResults.find(((value, index, arr) => {
                return value._id.isHCS !== false && value._id.category === "DEPOSIT"
            })).price
        } else {
            noHCSDEPOSIT = 0;
        }

        const Results = {
            "amount": money,

            "CONSUME": consume,

            "DEPOSIT": deposit,

            "isHCS": { //membersConsumptionResults {"_id":{"category":"CONSUME"},"price":0.7}
                "CONSUME": isHCSCONSUME,

                "DEPOSIT": isHCSDEPOSIT,

                "service": arrForIsHCSResults

            },

            "noHCS": {
                "CONSUME": noHCSCONSUME,
                "DEPOSIT": noHCSDEPOSIT,
                "service": arrForNoHCSResults
            }
        };
        return Results;
    }
}

module.exports = transactionFlowService;