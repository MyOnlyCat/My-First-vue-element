'use strict';
const mongoose = require('mongoose');
const moment = require('moment');
const Service = require('egg').Service;

class DaoService extends Service {
    constructor(ctx) {
        super(ctx);
        this.defaultSort = {_id: -1};
        this.init && this.init();
    }

    success(result) {
        return {
            success: true,
            result,
        };
    }

    fail(message) {
        return {
            success: false,
            message,
        };
    }

    async index(pagin, selectFileds) {
        return await this.findByPage(this.queryCriteria(this.ctx.request.body), pagin, selectFileds, this.sort(this.ctx.request.body));
    }

    async showLocation() {
        return await this.find(this.queryCriteria(this.ctx.request.body))
    }


    async show(_id, selectFileds) {
        return await this.model.findOne({_id}, selectFileds).lean();
    }

    async update(_id, params) {
        params.updated = moment().valueOf();
        //订单为COMPLETE状态,表示用户点击的完成,下面的就应该删除指派表里面的信息
        if (params.status !== null && params.status === "COMPLETE") {
            await this.specificTasksDestroy({_id});
            //测试环境下不进行mysql操作
            // this.ctx.service.mysqlService.updateOrderData(_id, params);
        } else if (params.status !== null && params.status === "SERVICING") {
            //SERVICING,表示用户是修改的订单信息不进行删除操作,进行更新操作
            await this.specificTasksUpdate(_id, params);
            // 测试环境下不进行mysql操作
            // this.ctx.service.mysqlService.updateOrderData(_id, params);c
            // const parme = {'export':true, 'imgExport': true, 'serviceExport': true};
            // Object.assign(params, parme)
        }
        const result = await this.model.findOneAndUpdate({_id}, {$set: params}, {new: true});

        console.log("-----update    " + JSON.stringify(params));

        return {_id: result._id};
    }

    async create(request) {
        if (!request) {
            return;
        }
        request = await this.disposeParams(request);
        request._id = mongoose.Types.ObjectId();
        //第一次创建数据的时候添加UUID
        if (request.type !== undefined && request.type !== "app" ) {
            request.uuid = mongoose.Types.ObjectId().toString();
        }

        if (!request.created) {
            request.created = moment().valueOf();
        }

        if (request.operationTime === undefined) {
            //测试环境下不进行mysql操作
            // this.ctx.service.mysqlService.saveOrderTable(request);
            // const parme = {'export':true, 'imgExport': true, 'serviceExport': true};
            // Object.assign(request, parme)

        }
        if (request.status !== null && request.status === "SERVICING") {
            await this.specificTasksCreat(request);
        }

        const result = await this.model.create(request);
        //
        // console.log("------- 调用创建-------   " + JSON.stringify(request));
        //
        // this.ctx.service.mysqlService.saveOperation("SAVE" ,request);

        return {_id: result._id};
    }

    async specificTasksCreat(request) {
        console.log("触发订单指派表********进行保存订单");
        const specificTasks = {
            "_id": request._id,
            "userId": request.provider._id,
            "order": request
        };
        await this.ctx.model.SpecificTasks.create(specificTasks)
    }

    async specificTasksDestroy(_id) {
        console.log("触发订单指派销毁");
        // await this.ctx.model.SpecificTasks.remove(_id);
    }

    async specificTasksUpdate(_id, params) {
        console.log("触发订单指派表更新操作");
        const specificTasks = {
            "order": params
        };
        await this.ctx.model.SpecificTasks.findOneAndUpdate({_id}, {$set: specificTasks}, {new: true});
    }

    async disposeParams(request) {
        if (request.status === "SERVICING" || request.status === "COMPLETE") {
            if (request.district.citys !== null || request.district.citys !== undefined) {
                delete request.district.citys;
            }
            if (request.district.districts !== null || request.district.districts !== undefined) {
                delete request.district.districts;
            }
            if (request.district.streets !== null || request.district.streets !== undefined) {
                delete request.district.streets;
            }
            if (request.district.villages !== null || request.district.villages !== undefined) {
                delete request.district.villages;
            }
        }

        // if (request.newOrder !== null || request.newOrder== undefined) {
        //     if (request.newOrder.status === "SERVICING" || request.newOrder.status === "COMPLETE") {
        //         if (request.newOrder.district.citys !== null || request.newOrder.district.citys !== undefined) {
        //             delete request.newOrder.district.citys;
        //         }
        //         if (request.newOrder.district.districts !== null || request.newOrder.district.districts !== undefined) {
        //             delete request.newOrder.district.districts;
        //         }
        //         if (request.newOrder.district.streets !== null || request.newOrder.district.streets !== undefined) {
        //             delete request.newOrder.district.streets;
        //         }
        //         if (request.newOrder.district.villages !== null || request.newOrder.district.villages !== undefined) {
        //             delete request.newOrder.district.villages;
        //         }
        //     }
        // }
        //
        // if (request.oldOrder.status !== null || request.oldOrder.status !== undefined) {
        //     if (request.oldOrder.status === "SERVICING" || request.oldOrder.status === "COMPLETE") {
        //         if (request.oldOrder.district.citys !== null || request.oldOrder.district.citys !== undefined) {
        //             delete request.oldOrder.district.citys;
        //         }
        //         if (request.oldOrder.district.districts !== null || request.oldOrder.district.districts !== undefined) {
        //             delete request.oldOrder.district.districts;
        //         }
        //         if (request.oldOrder.district.streets !== null || request.oldOrder.district.streets !== undefined) {
        //             delete request.oldOrder.district.streets;
        //         }
        //         if (request.oldOrder.district.villages !== null || request.oldOrder.district.villages !== undefined) {
        //             delete request.oldOrder.district.villages;
        //         }
        //     }
        // }
        return request;
    }

    async destroy(_id) {
        this.saveLogAndData(_id);
        //触发指派表删除
        await this.specificTasksDestroy(_id);
        //删除mysql数据
        // this.ctx.service.mysqlService.dellOderData(_id);
        return await this.model.remove({_id});
    }

    async count(query) {
        return await this.model.count(query);
    }

    async countSearch(query) {
        const searchParams = this.queryCriteria(query)
        return await this.model.count(searchParams);
    }

    async find(query, selectFileds, sort = this.defaultSort) {
        return await this.model.find(query)
            .select(selectFileds)
            .sort(sort).lean();
    }

    async findOne(query) {
        return await this.model.findOne(query).lean();
    }

    async findByPage(params, pagin = {}, selectFileds, sort = this.defaultSort) {
        const count = await this.count(params);
        const page = Number(pagin.page || 1);
        const pageSize = Number(pagin.pageSize || 10);
        const from = (page - 1) * pageSize;

        const content = await this.model.find(params)
            .lean()
            .skip(from)
            .limit(pageSize)
            .select(selectFileds)
            .sort(sort)
        ;

        const result = {
            count,
            page,
            pageSize,
            content,
        };
        return result;
    }


    queryCriteria(search) {
        const queries = {};
        if (search.eqs) {
            Object.assign(queries, search.eqs);
        }
        if (search.likes) {
            for (const [key, value] of Object.entries(search.likes)) {
                queries[key] = {$regex: value};
            }
        }

        if (search.ins) {
            for (const [key, value] of Object.entries(search.ins)) {
                queries[key] = {$in: value};
            }
        }

        if (search.times) {
            for (const [key, value] of Object.entries(search.times)) {
                const start = value.start;
                const end = value.end;
                if (!queries[key] && (start || end)) {
                    queries[key] = {};
                }
                if (start) {
                    queries[key].$gte = start;
                }
                if (end) {
                    queries[key].$lte = end;
                }
            }
        }
        return queries;
    }

    sort(search) {
        let queries;
        if (search.sorts) {
            for (const [key, value] of Object.entries(search.sorts)) {
                if (!queries) {
                    queries = {};
                }
                let sortValue = -1;
                switch (value) {
                    case 'asc':
                        sortValue = 1;
                        break;
                    case 'desc':
                        sortValue = -1;
                        break;
                }
                queries[key] = sortValue;
            }
        }
        return queries;
    }

    async findOneAndUpdateById(_id, updateFields) {
        const result = await this.model.findOneAndUpdate({_id}, updateFields, {new: true});
        return result ? this.success() : this.fail();
    }

    async findOneAndUpdate(query, updateFields) {
        const result = await this.model.findOneAndUpdate(query, updateFields, {new: true});
        return result ? this.success() : this.fail();
    }

    async updateMulti(query, updateFields) {
        const result = await this.model.update(query, updateFields, {multi: true});
        return result;
    }

    async remove(query) {
        const removeModel =  await this.model.findOne(query);
        this.saveRemoveLogAndData(removeModel);
        return await this.model.remove(query);
    }

    async getIp(){
        let ip = this.ctx.headers['x-forwarded-for'] || this.ctx.ip || this.ctx.connection.remoteAddress || this.ctx.socket.remoteAddress || this.ctx.connection.socket.remoteAddress || '';
        if (ip.split(',').length > 0) {
            ip = ip.split(',')[0];
        }
        return ip;
    }

    async saveLogAndData(_id) {
        //得到储存ID
        const saveId = mongoose.Types.ObjectId();
        //得到IP
        const ip = await this.getIp();
        //记录日志
        this.ctx.logger.info("IP地址为 " + ip + " 执行 - " + " 删除 操作,操作储存ID为 (" + saveId + ")");
        const model = await this.model.findOne({_id});
        const data = {
            _id: saveId,
            operatorIP : ip,
            content: model
        };
        //执行记录
        this.ctx.model.DeleteModel.create(data)
    }

    async saveRemoveLogAndData(removeModel) {
        //得到储存ID
        const saveId = mongoose.Types.ObjectId();
        //得到IP
        const ip = await this.getIp();
        //记录日志
        this.ctx.logger.info("IP地址为 " + ip + " 执行 - " + " 删除 操作,操作储存ID为 (" + saveId + ")");
        const data = {
            _id: saveId,
            operatorIP : ip,
            content: removeModel
        };
        //执行记录
        this.ctx.model.DeleteModel.create(data)
    }
}

module.exports = DaoService;
