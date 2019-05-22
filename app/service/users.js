'use strict';

const DaoService = require('./daoService');
const mongoose = require('mongoose');

class UsersService extends DaoService {

    constructor(ctx) {
        super(ctx);
        this.defaultSort = {_id: -1};
        this.init && this.init();
    }

    init() {
        this.model = this.ctx.model.Users;
        this.defaultPassword = this.app.config.default.user.password;
    }

    async getData(ctx) {
        const params = this.queryCriteria(ctx.request.body);
        const rest = await this.model.find(params, {name: 1, sex: 1, identityNumber: 1, uuid: 1});

        // for (let i = 0; i < rest.length; i++) {
        //     await this.model.update(
        //         {$set:{'uuid' : mongoose.Types.ObjectId().toString()}}
        //     )
        // }

        // const rest = await this.model.find({"role": "USER", "isHCS": {"$ne": false}}, {_id: 1});
        // for (let i = 0; i < rest.length; i++) {
        //     await this.model.update(
        //         {$set: {'uuid': mongoose.Types.ObjectId().toString()}}
        //     );
        //     console.log("更新第******(" + i + ")******");
        // }
        //
        // console.log("good");

        // const ass = await this.model.find({"role": "USER", "isHCS": {"$ne": false}});

        // console.log(JSON.stringify(ass));

        // return content;
        return rest;
    }

    /**
     * 生成空白二维码的UUID
     * 返回数组的UUID
     */
    async productionQR() {
        const count = this.ctx.request.body.count;
        const qrID = [];
        for (let i = 0; i < count; i++) {
            qrID.push(mongoose.Types.ObjectId().toString())
        }
        const qrarr = qrID.map(x => {
            let result = {}; // result = {["taskFinishTime"]: ft,["url"]: urlArr[0].url};
            result = {["name"]: "", ["sex"]: "", ["identityNumber"]: "", ["uuid"]: x, ["_id"]: ""};
            return result;
        });
        console.log("*********" + JSON.stringify(qrarr));
        console.log(JSON.stringify(qrID));
        return qrarr
    }

    /**
     * 废除和老人绑定的二维码
     * @returns {Promise<void>}
     */
    async abolishQR() {
        const _id = this.ctx.request.body._id;
        const res = await this.model.update(
            {'_id': _id},
            {$set: {'uuid': null}}
        );
        return res
    }


    async create(user) {
        const md5Pass = this.ctx.helper.md5(this.defaultPassword);
        user.password = md5Pass;
        return super.create(user);
    }

    async login(phone, password) {
        const md5Pass = this.ctx.helper.md5(password);
        const queries = {
            $or: [{phone}, {shortName: phone}], password: md5Pass,
        };

        return await this.model.findOne(queries).lean();
    }

    async statisticByRole(query) {
        let queryCriteria = this.service.orders.queryCriteria(query);

        return await this.model.aggregate([{
            $match: queryCriteria
        },
            {
                $group: {
                    _id: '$role',
                    role: {$first: '$role'},
                    count: {$sum: 1},
                }
            }
        ]);
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

    async updatePortrait() {
        // const parameter = {}; {"role":"USER", "isHCS":{"$ne":false}},
        // noinspection JSAnnotator
        let parameter;
        if (this.ctx.request.body._id && this.ctx.request.body.imgid) {
            parameter = {
                "_id": this.ctx.request.body._id,
            };
            await this.model.update(
                parameter,
                {$set: {'image': this.ctx.request.body.imgid}},
            );
            this.ctx.body = {"msg": "true"};
        }
        console.log(JSON.stringify(parameter));
    }

    async upDataUUID() {
        console.log("查询开始");
        const rest = await this.model.find({"role": "USER", "isHCS": {"$ne": false}}, {_id: 1});
        console.log("查询结束");
        console.log("任务数量***************" + rest.length);
        for (let i = 0; i < rest.length; i++) {
            console.log("处理ID为" + rest[i]._id);
            await this.model.update(
                {'_id': rest[i]._id},
                {$set: {'uuid': mongoose.Types.ObjectId().toString()}}
            );
            console.log("更新第******(" + i + ")******");
        }

        console.log("good");

        return "good";
    }


    //地区老人
    async getUserMsgByOrID() {
        //拿到服务人员的机构组织ID
        const params = this.queryCriteria(this.ctx.request.body);
        //根据机构ID去查询属于这个机构的所有合同ID
        const rest = await this.ctx.model.Projects.find(params, {_id: 1});
        //拿到合同ID,处理
        const ids = [];
        rest.forEach(x => {
            ids.push(x._id)
        });
        const p = await this.ctx.model.Users.find(
            {"subsidy.projectId": {"$in": ids}},
            {"_id": 1}
        );


        console.log(JSON.stringify(p));
        console.log(p.length);
        return ids
    }

    /**
     * 根据合同取合同下的服务人员
     * @param id
     * @returns {Promise<Array>}
     */
    async getServicerByProjectId(id) {
        const userIdList = await this.ctx.model.Orders.aggregate([
            {
                $match:
                    {
                        'project._id': id
                    }
            },
            {
                $group:
                    {
                        _id: "$provider._id"
                    }
            }
        ]);
        let userList = [];
        if (userIdList.length > 0) {
            for (let i = 0; i < userIdList.length; i++) {
                const userMode = await this.model.find(
                    {_id: userIdList[i]._id},
                    {_id: 1, sex: 1, phone: 1, name: 1}
                );
                userList.push(userMode);
            }
        }
        return userList;
    }

    async searchUser(pagin, selectFileds) {
        //处理参数
        const query = super.queryCriteria(this.ctx.request.body);
        const count = await this.count(query);
        const page = Number(pagin.page || 1);
        const pageSize = Number(pagin.pageSize || 10);
        const from = (page - 1) * pageSize;
        const content = await this.model.find(
            query,
            {name: 1, identityNumber: 1, district: 1, subsidy: 1}
        ).lean().skip(from).limit(pageSize).select(selectFileds).sort(super.sort(this.ctx.request.body));

        const result = {
            count,
            page,
            pageSize,
            content,
        };
        return result;
    }

}

module.exports = UsersService;
