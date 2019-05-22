'use strict';
const moment = require('moment');
const DaoService = require('./daoService');

class StatisticByTargetServices extends DaoService {
    init() {
        this.model = this.ctx.model.StatisticByTargets;
    }

    /**
     * 被服务人员统计
     * @param {*} query
     */
    async statisticByTarget(query) {
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric, 'target.');
            query.eqs = {...query.eqs, ...result}
        }
        let queryCriteria = this.service.orders.queryCriteria(query);

        const result = await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: '$target._id',
                    orderCount: {$sum: '$orderCount'},
                    orderItemCount: {$sum: '$orderItemCount'},
                    totalMoney: {$sum: '$totalMoney'}
                }
            },
            {
                $group: {
                    _id: null,
                    targetCount: {$sum: 1},
                    orderCount: {$sum: '$orderCount'},
                    orderItemCount: {$sum: '$orderItemCount'},
                    totalMoney: {$sum: '$totalMoney'}
                }
            },
        ]);
        result.forEach(r => r.totalMoney = this.ctx.helper.toFloat(r.totalMoney));
        return result;
    }

    /**
     * 按天来统计
     * @param {*} query
     */
    async statisticByDays(query) {
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric, 'target.');
            query.eqs = {...query.eqs, ...result}
        }
        let queryCriteria = this.service.orders.queryCriteria(query);

        const result = await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: '$date',
                    targetCount: {$sum: 1},
                    orderCount: {$sum: '$orderCount'},
                    orderItemCount: {$sum: '$orderItemCount'},
                    totalMoney: {$sum: '$totalMoney'}
                }
            }
        ]);
        result.forEach(r => r.totalMoney = this.ctx.helper.toFloat(r.totalMoney));
        return result;
    }

    /**
     * 点老人,返回这个老人的订单
     * @param {*} query
     * @param {*} param1
     */
    async getTargets(query, {page = 1, pageSize = 10} = {page: 1, pageSize: 10}) {
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric, 'target.');
            query.eqs = {...query.eqs, ...result}
        }
        let queryCriteria = this.service.orders.queryCriteria(query);
        let sort = this.service.orders.sort(query) || {orderCount: -1};
        const from = (page - 1) * pageSize;
        let countPromise = await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: '$target._id',
                }
            },
            {$group: {_id: null, count: {$sum: 1}}},
        ]);


        const contentPromise = await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: '$target._id',
                    target: {$first: '$target'},
                    orderCount: {$sum: '$orderCount'},
                    orderItemCount: {$sum: '$orderItemCount'},
                    totalMoney: {$sum: '$totalMoney'}
                }
            },
            {$sort: sort},
            {$skip: from},
            {$limit: pageSize}
        ]);

        let [count, content] = await Promise.all([countPromise, contentPromise])

        content.forEach(r => r.totalMoney = this.ctx.helper.toFloat(r.totalMoney));
        if (count.length == 0) {
            count = 0;
        } else {
            count = count[0].count;
        }

        const result = {
            count,
            page,
            pageSize,
            content,
        };
        return result;

    }


    /**
     * 区域来统计
     * @param {*} query
     */
    async statisticByDistrict(query) {
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric, 'target.');
            query.eqs = {...query.eqs, ...result}
        }
        let queryCriteria = this.service.orders.queryCriteria(query);
        const districts = await this.service.districts.find({parentAdcode: metric.govAdCode})
        const childLevel = districts[0].level;
        let groupBylevel;
        if (childLevel === 'village') {
            groupBylevel = 'district.adcode';
        } else {
            groupBylevel = `district.ancestors.${childLevel}AdCode`;
        }

        const results = await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: '$target._id',
                    target: {$first: '$target'},
                    orderCount: {$sum: '$orderCount'},
                    orderItemCount: {$sum: '$orderItemCount'},
                    totalMoney: {$sum: '$totalMoney'}
                }
            },
            {
                $group: {
                    _id: `$target.${groupBylevel}`,
                    targetCount: {$sum: 1},
                    orderCount: {$sum: '$orderCount'},
                    orderItemCount: {$sum: '$orderItemCount'},
                    totalMoney: {$sum: '$totalMoney'}
                }
            }
        ]);

        results.forEach(r => {
            r.totalMoney = this.ctx.helper.toFloat(r.totalMoney);
            const district = districts.find(d => d.adcode === r._id);
            r.district = district;
        });
        return results;
    }

    /**
     * 合同来统计
     * @param {*} query
     */
    async statisticByProject1(query) {
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric, 'target.');
            query.eqs = {...query.eqs, ...result}
        }
        let queryCriteria = this.service.orders.queryCriteria(query);

        const results = await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: '$target._id',
                    project: {$last: '$project'},
                    evaluation: {$sum: {$multiply: ["$evaluation", "$orderCount"]}},
                    orderCount: {$sum: '$orderCount'},
                    orderItemCount: {$sum: '$orderItemCount'},
                    totalMoney: {$sum: '$totalMoney'}
                }
            },
            {
                $group: {
                    _id: `$project._id`,
                    project: {$last: '$project'},
                    evaluation: {$sum: "$evaluation"},
                    targetCount: {$sum: 1},
                    orderCount: {$sum: '$orderCount'},
                    orderItemCount: {$sum: '$orderItemCount'},
                    totalMoney: {$sum: '$totalMoney'}
                }
            },
            {
                $project: {
                    project: 1,
                    targetCount: 1,
                    orderCount: 1,
                    orderItemCount: 1,
                    totalMoney: 1,
                    evaluation: {$divide: ["$evaluation", '$orderCount']}
                }
            }
        ]).allowDiskUse(true);

        const pids = results.map(r => r.project._id);
        const projects = await this.service.projects.find({_id: {$in: pids}});
        results.forEach(r => {
            r.totalMoney = this.ctx.helper.toFloat(r.totalMoney);
            const project = projects.find(p => p._id.toHexString() === r.project._id)
            r.project = project;
        });
        const xx = results;
        console.log("------" + results[0].project._id);

        if (results.length >= 1) {
            for (let i = 0; i < results.length; i++) {
                const projectIdCopy = results[i].project._id.toString();
                const projectServiceMoneyCount = await this.ctx.model.Orders.aggregate([
                    {
                        $match: {"project._id": projectIdCopy}
                    },
                    {$unwind: "$service"},
                    {$group: {_id: null, price: {$sum: '$service.price.value'}}}
                ]);
                if (projectServiceMoneyCount.length !== 0) {
                    results[i].totalMoney = projectServiceMoneyCount[0].price;
                } else {
                    results[i].totalMoney = 0;
                }

            }
        }

        return results;
    }

    async statisticByProject(query) {
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric, 'target.');
            query.eqs = {...query.eqs, ...result}
        }
        let queryCriteria = this.service.orders.queryCriteria(query);

        const id = queryCriteria['project.organization._id'];

        delete queryCriteria['project.organization._id'];

        queryCriteria['organization._id'] = id;

        const results = await this.ctx.model.Projects.find(
            queryCriteria,
            {'_id':1,'name':1}
        );

        let returnData = [];
        let data = null;
        if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                 data = {
                    'num':i,
                    'project':results[i]
                };
                returnData.push(data);
            }
        }
        return returnData;
    }


    /**
     * 老人性别,年龄来统计
     * @param {*} query
     */
    async statisticByTargetAgeSex(query) {
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric, 'target.');
            query.eqs = {...query.eqs, ...result}
        }
        let queryCriteria = this.service.orders.queryCriteria(query);

        const sexResultsPromise = this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: '$target._id',
                    target: {$last: '$target'},
                }
            },
            {$group: {_id: '$target.sex', count: {$sum: 1}}},
        ]).allowDiskUse(true);

        const searchByAges = async (start, end) => {
            const dateRange = {['target.dob']: {}};
            if (start) {
                let now = moment();
                dateRange['target.dob']['$lte'] = now.subtract(start, 'year').valueOf();
            }
            if (end) {
                let now = moment();
                dateRange['target.dob']['$gt'] = now.subtract(end, 'year').valueOf();
            }
            let count = await this.model.aggregate([{
                $match: {...queryCriteria, ...dateRange}
            },
                {
                    $group: {
                        _id: '$target._id',
                    }
                },
                {$group: {_id: null, count: {$sum: 1}}},
            ]);

            if (count.length == 0) {
                count = 0;
            } else {
                count = count[0].count;
            }
            return count;
        }
        const age6ResultsPromise = searchByAges(null, 60);
        const age67ResultsPromise = searchByAges(60, 70);
        const age78ResultsPromise = searchByAges(70, 80);
        const age8ResultsPromise = searchByAges(80, null);

        const [sexResults, age6Results, age67Results, age78Results, age8Results] = await Promise.all([sexResultsPromise, age6ResultsPromise, age67ResultsPromise, age78ResultsPromise, age8ResultsPromise])
        const sexR = sexResults.map(sex => {
            return {[sex._id]: sex.count};
        }).reduce((a, b) => {
            return {...a, ...b}
        }, {});

        const result = {
            ...sexR,
            before60: age6Results,
            6070: age67Results,
            7080: age78Results,
            after80: age8Results,
        }

        return result;
    }

    async convertToStatisticByTarget(myDoc, add = true) {
        try {
            const target = await this.service.users.show(myDoc.target._id, {
                name: 1,
                identityNumber: 1,
                dob: 1,
                lifeCondition: 1,
                currentAddress: 1,
                phone: 1,
                district: 1,
                role: 1,
                sex: 1,
                created: 1
            });
            // const target = await this.service.users.show(myDoc.target._id);
            const finishDate = this.ctx.helper.formatDate(myDoc.finishDate || myDoc.created);

            let record = await this.findOne({'target._id': myDoc.target._id, date: finishDate});
            target._id = target._id.toHexString();
            let orderMoney = 0;
            let orderItemCount = 0;
            myDoc.service.forEach(function (s) {
                let count = s.price.count || 1;
                orderItemCount += Number.parseInt(count);
                orderMoney += s.price.value;
            });

            if (!record) {
                if (!add) {
                    return;
                }
                const project = await this.geProject(myDoc.project._id)
                record = {
                    target: target,
                    evaluation: myDoc.evaluation || 5,
                    orderCount: 1,
                    orderItemCount: orderItemCount,
                    totalMoney: orderMoney,
                    project: project,
                    date: finishDate
                };
                await this.create(record);
            } else {
                let updateParams;
                const orderEvaluation = myDoc.evaluation || 5;
                if (add) {
                    const evaluation = this.ctx.helper.toFloat((record.evaluation * record.orderCount + orderEvaluation) / (record.orderCount + 1));
                    updateParams = {
                        evaluation,
                        orderCount: record.orderCount + 1,
                        orderItemCount: record.orderItemCount + orderItemCount,
                        totalMoney: record.totalMoney + orderMoney,
                    }
                    await this.update({_id: record._id}, updateParams);
                } else {
                    if (record.orderCount > 1) {
                        const evaluation = this.ctx.helper.toFloat((record.evaluation * record.orderCount - orderEvaluation) / (record.orderCount - 1));
                        updateParams = {
                            evaluation,
                            orderCount: record.orderCount - 1,
                            orderItemCount: record.orderItemCount - orderItemCount,
                            totalMoney: record.totalMoney - orderMoney,
                        }
                        await this.update({_id: record._id}, updateParams);
                    } else {
                        await this.destroy(record._id);
                    }
                }
            }
            // console.log(record);

        } catch (error) {
            console.log(error);
            console.log('error convertToStatisticByTarget :' + myDoc._id);
        }
    }

    async convertToOrderByTargets(myDoc, add = true) {
        try {
            const target = await this.service.users.show(myDoc.target._id, {
                name: 1,
                identityNumber: 1,
                dob: 1,
                lifeCondition: 1,
                currentAddress: 1,
                phone: 1,
                district: 1,
                role: 1,
                sex: 1,
                created: 1
            });
            // const target = await this.service.users.show(myDoc.target._id);
            const finishDate = this.ctx.helper.formatDate(myDoc.finishDate || myDoc.created);

            let record = await this.service.orderByTargets.findOne({
                'target._id': myDoc.target._id,
                'project._id': myDoc.project._id
            });
            target._id = target._id.toHexString();
            let orderMoney = 0;
            let orderItemCount = 0;
            myDoc.service.forEach(function (s) {
                let count = s.price.count || 1;
                orderItemCount += count;
                orderMoney += s.price.value;
            });

            if (!record) {
                if (!add) {
                    return;
                }
                const project = await this.geProject(myDoc.project._id);
                const orders = [{
                    evaluation: myDoc.evaluation || 5,
                    orderCount: 1,
                    orderItemCount: orderItemCount,
                    totalMoney: orderMoney,
                    date: finishDate
                }];
                record = {
                    target: target,
                    project: project,
                    orders,
                };
                await this.service.orderByTargets.create(record);
            } else {
                let updateParams;
                const orderEvaluation = myDoc.evaluation || 5;
                const eorder = record.orders.find(o => o.date === finishDate);
                if (eorder) {
                    if (add) {
                        const evaluation = this.ctx.helper.toFloat((eorder.evaluation * eorder.orderCount + orderEvaluation) / (eorder.orderCount + 1));

                        eorder.evaluation = evaluation;
                        eorder.orderCount = eorder.orderCount + 1;
                        eorder.orderItemCount = eorder.orderItemCount + orderItemCount;
                        eorder.totalMoney = eorder.totalMoney + orderMoney;
                    } else {
                        const evaluation = eorder.orderCount <= 1 ? 0 : this.ctx.helper.toFloat((eorder.evaluation * eorder.orderCount - orderEvaluation) / (eorder.orderCount - 1));
                        eorder.evaluation = evaluation;
                        eorder.orderCount = eorder.orderCount - 1;
                        eorder.orderItemCount = eorder.orderItemCount - orderItemCount;
                        eorder.totalMoney = eorder.totalMoney - orderMoney;
                    }
                } else {
                    record.orders.push({
                        evaluation: myDoc.evaluation || 5,
                        orderCount: 1,
                        orderItemCount: orderItemCount,
                        totalMoney: orderMoney,
                        date: finishDate
                    })
                }
                await this.service.orderByTargets.update({_id: record._id}, {orders: record.orders});
            }
            // console.log(record);

        } catch (error) {
            console.log(error);
            console.log('error convertToStatisticByTarget :' + myDoc._id);
        }
    }

    async convertToStatisticByProvider(myDoc, add = true) {
        try {
            const provider = await this.geProvider(myDoc.provider._id);
            const finishDate = this.ctx.helper.formatDate(myDoc.finishDate || myDoc.created);

            const project = await this.geProject(myDoc.project._id)
            let record = await this.service.statisticByProviders.findOne({
                'provider._id': myDoc.provider._id,
                'project._id': project._id,
                date: finishDate
            });
            let orderMoney = 0;
            let orderItemCount = 0;
            myDoc.service.forEach(function (s) {
                let count = s.price.count || 1;
                orderItemCount += count;
                orderMoney += s.price.value;
            });

            const orderServiceItems = myDoc.service.map(s => ({name: s.name, count: s.price.count || 1}));
            if (!record) {
                if (!add) {
                    return;
                }
                record = {
                    provider: provider,
                    evaluation: myDoc.evaluation || 5,
                    orderCount: 1,
                    orderItemCount: orderItemCount,
                    totalMoney: orderMoney,
                    service: orderServiceItems,
                    project: project,
                    district: myDoc.district,
                    date: finishDate
                };
                await this.service.statisticByProviders.create(record);
            } else {
                let updateParams;
                const orderEvaluation = myDoc.evaluation || 5;
                if (add) {
                    const evaluation = this.ctx.helper.toFloat((record.evaluation * record.orderCount + orderEvaluation) / (record.orderCount + 1));

                    record.service.forEach(eServiceItem => {
                        const findItem = orderServiceItems.find(s => s.name === eServiceItem.name);
                        if (findItem) {
                            eServiceItem.count += findItem.count;
                        }
                    });
                    const newItems = orderServiceItems.filter(s => {
                        return !record.service.some(eServiceItem => eServiceItem.name === s.name)
                    })

                    record.service = record.service.concat(newItems);

                    updateParams = {
                        evaluation,
                        orderCount: record.orderCount + 1,
                        orderItemCount: record.orderItemCount + orderItemCount,
                        totalMoney: record.totalMoney + orderMoney,
                        service: record.service,
                    }
                } else {
                    if (record.orderCount > 1) {
                        const evaluation = this.ctx.helper.toFloat((record.evaluation * record.orderCount - orderEvaluation) / (record.orderCount - 1));

                        record.service.forEach(eServiceItem => {
                            const findItem = orderServiceItems.find(s => s.name === eServiceItem.name);
                            eServiceItem.count -= findItem.count;
                        });

                        updateParams = {
                            evaluation,
                            orderCount: record.orderCount - 1,
                            orderItemCount: record.orderItemCount - orderItemCount,
                            totalMoney: record.totalMoney - orderMoney,
                            service: record.service,
                        }
                        await this.service.statisticByProviders.update({_id: record._id}, updateParams);
                    } else {
                        await this.service.statisticByProviders.destroy(record._id);
                    }
                }


            }
            // console.log(record);

        } catch (error) {
            console.log(error);
            console.log('error convertToStatisticByProvider :' + myDoc._id);
        }
    }

    async geProvider(id) {
        const key = `provider_${id}`;
        if (!this.cache) {
            this.cache = {};
        }
        if (this.cache[key]) {
            return this.cache[key];
        }
        this.cache[key] = await this.service.users.show(id, {
            name: 1,
            identityNumber: 1,
            dob: 1,
            currentAddress: 1,
            phone: 1,
            role: 1,
            sex: 1,
            created: 1
        });
        this.cache[key]._id = this.cache[key]._id.toHexString();
        ;
        return this.cache[key];
    }

    async geProject(id) {
        const key = `project_${id}`;
        if (!this.cache) {
            this.cache = {};
        }
        if (this.cache[key]) {
            return this.cache[key];
        }
        this.cache[key] = await this.service.projects.show(id);
        this.cache[key]._id = this.cache[key]._id.toHexString();
        ;
        return this.cache[key];
    }
}

module.exports = StatisticByTargetServices;
