'use strict';
const xlsx = require('node-xlsx').default;
const fs = require('fs');

const CommonController = require('./commonController');

class UsersController extends CommonController {
    init() {
        this.daoService = this.service.users;
    }

    // async getUsersAllData(ctx) {
    //     return await this.daoService.getData(ctx);
    // }


    async create(ctx) {
        const user = ctx.request.body;
        if (!['GOV', 'COMPANY'].includes(user.role)) {
            const count = await this.service.users.count({identityNumber: user.identityNumber});
            if (count > 0) {
                this.fail('身份证号码在系统已经存在', 417);
                return;
            }
        }
        if (user.shortName) {
            const count = await this.service.users.count({shortName: user.shortName});
            if (count > 0) {
                this.fail('简称在系统已经存在', 417);
                return;
            }
        }

        const projects = await this.getProjectByDistrict(user.district);
        if (projects && projects.length > 0) {
            const project = projects[0];
            user.subsidy = [{
                projectId: project._id.toHexString(),
                name: project.name,
                value: {value: project.price.value, unit: "元"}
            }]
        } else {
            user.subsidy = [];
        }
        await super.create(ctx);
    }

    async destroy(ctx) {
        const count = await this.service.orders.count({'target._id': ctx.params.id})
        if (count > 0) {
            this.fail('用户有订单,不能删除', 417);
            return;
        }
        ctx.body = await this.daoService.destroy(ctx.params.id);
    }

    async login(ctx) {
        const user = await this.service.users.login(ctx.query.phone, ctx.query.password);
        if (user && user.roles) {
            user.permissions = {};
            const allPromise = Object.keys(user.roles).map(async s => {
                if (Array.isArray(user.roles[s])) {
                    const roles = await this.getRolesBySystem(user.roles, s);
                    user.permissions[s] = roles;
                } else {
                    for (const orgId of Object.keys(user.roles[s])) {
                        const roles = await this.getRolesBySystemOrg(user.roles, s, orgId);
                        user.permissions[s] = {[orgId]: roles};
                    }
                }
            });
            await Promise.all(allPromise);
        }
        ctx.body = user;
    }

    async getUserWithRoles(ctx) {
        const user = await await this.daoService.show(ctx.params.id);

        if (user && user.roles) {
            user.permissions = {};
            const allPromise = Object.keys(user.roles).map(async s => {
                if (Array.isArray(user.roles[s])) {
                    const roles = await this.getRolesBySystem(user.roles, s);
                    user.permissions[s] = roles;
                } else {
                    for (const orgId of Object.keys(user.roles[s])) {
                        const roles = await this.getRolesBySystemOrg(user.roles, s, orgId);
                        user.permissions[s] = {[orgId]: roles};
                    }
                }
            });
            await Promise.all(allPromise);
        }
        ctx.body = user;
    }

    async getRolesBySystem(userRoles, system) {
        const searchParams = {system, name: {$in: userRoles[system]}};
        const roles = await this.service.roles.find(searchParams);
        const results = roles.map(a => ({[a.name]: a.permission})).reduce((a, b) => ({...a, ...b}), {});
        return results;
    }

    async getRolesBySystemOrg(userRoles, system, orgId) {
        const searchParams = {system, 'organization._id': orgId, name: {$in: userRoles[system][orgId]}};
        const roles = await this.service.roles.find(searchParams);
        const results = roles.map(a => ({[a.name]: a.permission})).reduce((a, b) => ({...a, ...b}), {});
        return results;
    }

    async identityNumber(ctx) {
        ctx.body = await this.service.users.findOne({identityNumber: ctx.params.id});
    }

    /**
     * 重置密码
     * @param {*} ctx
     */
    async resetPassword(ctx) {
        const _id = ctx.params.id;
        const user = await this.service.users.show(_id);
        if (user) {
            const md5Pass = this.ctx.helper.md5(user.phone.substring(user.phone.length - 6));
            ctx.body = await this.service.users.findOneAndUpdateById(_id, {$set: {password: md5Pass}});
        } else {
            this.fail();
        }
    }

    /**
     * 更新密码
     * @param {*} ctx
     */
    async updatePwd(ctx) {
        const query = ctx.request.body;
        const oldMd5Pass = ctx.helper.md5(query.oldPassword);
        const newMd5Pass = ctx.helper.md5(query.newPassword);
        ctx.body = await this.service.users.findOneAndUpdate({
            _id: ctx.params.id,
            password: oldMd5Pass
        }, {$set: {password: newMd5Pass}});
    }

    /**
     * 批量创建
     * @param {*} ctx
     */
    async bulk(ctx) {
        const users = ctx.request.body;
        app.logger.info(`bulk users:   ${users.length}`);
        users.map(async u => {
            const user = await this.service.users.findOne({identityNumber: u.identityNumber});
            if (user) {
                const newUser = Object({}, user, u);
                await this.service.users.update(user._id, {
                    currentAddress: u.currentAddress, subsidy: u.subsidy, lifeCondition: u.lifeCondition,
                    contactNumber: u.contactNumber, childrenNumber: u.childrenNumber, nation: u.nation, name: u.name
                });
            } else {
                await this.service.users.create(u);
            }
        })
        this.success();
    }


    /**
     * 本地测试批量导入
     * @param {*} ctx
     */
    async readUserFromExcel(ctx) {
        let index = 0;
        const params = {
            file: '/home/lee/Documents/批量导入老人模板.xlsx',
            excelIndex: {
                name: index++,
                identityNumber: index++,
                subsidy: index++,
                nation: index++,
                childrenNumber: index++,
                contactNumber: index++,
                lifeCondition: index++,
                currentAddress: index++,
                town: index++,
                village: index++,
            },
        }
        const workSheetsFromFile = xlsx.parse(params.file);
        var excelObj = workSheetsFromFile[0].data;
        console.log(`${params.file} : ${excelObj.length}`);
        const validateResults = await this.validteUserFromExcel(params, excelObj);

        const resultPromises = [];

        for (let i = 0; i < validateResults.canUploadUsers.length; i++) {
            const p = this.parseUserFromExcel(params, validateResults.canUploadUsers, i);
            resultPromises.push(p);
        }
        await Promise.all(resultPromises);
        console.log('finished')
        delete validateResults.canUploadUsers;
        ctx.body = validateResults;
    }

    /**
     * 批量导入
     * @param {} ctx
     */
    async readUserFromExcelStream(ctx) {
        let index = 0;
        const params = {
            // file: '/home/lee/Documents/批量导入老人模板.xlsx',
            adcode: ctx.query.adcode,
            excelIndex: {
                name: index++,
                identityNumber: index++,
                nation: index++,
                childrenNumber: index++,
                contactNumber: index++,
                lifeCondition: index++,
                currentAddress: index++,
                town: index++,
                village: index++,
            },
        };
        const stream = await ctx.getFileStream();

        const promise = new Promise((resole, reject) => {
            var buffers = [];
            stream.on('data', function (buffer) {
                buffers.push(buffer);
            });
            stream.on('end', function () {
                var buffer = Buffer.concat(buffers);
                resole(buffer);
            });
        });

        const fileBuffer = await promise;

        const workSheetsFromFile = xlsx.parse(fileBuffer, {type: 'buffer'});
        var excelObj = workSheetsFromFile[0].data;
        console.log(` ${excelObj.length}`);
        const validateResults = await this.validteUserFromExcel(params, excelObj);

        const resultPromises = [];

        for (let i = 0; i < validateResults.canUploadUsers.length; i++) {
            const p = this.parseUserFromExcel(params, validateResults.canUploadUsers, i);
            resultPromises.push(p);
        }
        await Promise.all(resultPromises);
        console.log('finished')
        delete validateResults.canUploadUsers;
        ctx.body = validateResults;
    }

    /**
     * 验证excel数据
     * @param {*} params
     * @param {*} excelObj
     */
    async validteUserFromExcel(params, excelObj) {
        const excelIndex = params.excelIndex;

        const resutls = {
            message: '',
            needFixUsers: [],
            canUploadUsers: [],
        }

        if (excelObj.length > 2000) {
            resutls.message = '最大导入不能超过2000人';
            return resutls;
        }

        for (let i = 1; i < excelObj.length; i++) {
            const content = excelObj[i];
            var valid = true;
            let message = '';
            if (content[excelIndex.identityNumber]) {
                content[excelIndex.identityNumber] = String(content[excelIndex.identityNumber]).trim().toUpperCase();
            }
            if (!this.ctx.helper.validator().identityCodeValid(content[excelIndex.identityNumber])) {
                message = '身份证格式不对<br>';
                valid = false;
            } else {
                var dob = this.ctx.helper.getMillisecond(this.getDob(content[excelIndex.identityNumber]));
                if (isNaN(dob)) {
                    message = '不能从身份证中取出生日<br>';
                    valid = false;
                }

                const haveDuplidateUser = excelObj.filter(u => String(u[excelIndex.identityNumber]).trim().toUpperCase() == String(content[excelIndex.identityNumber]).toUpperCase());
                if (haveDuplidateUser.length > 1) {
                    message += '重复的身份证<br>';
                    valid = false;
                }
            }

            if (!content[excelIndex.name]) {
                message += '姓名不能为空<br>';
                valid = false;
            } else {
                content[excelIndex.name] = String(content[excelIndex.name]).trim()
            }
            // if (!content[excelIndex.subsidy]) {
            //   message += '补贴金额不能为空<br>';
            //   valid = false;
            // }

            if (!content[excelIndex.currentAddress]) {
                message += '住址不能为空<br>';
                valid = false;
            }

            if (!content[excelIndex.town]) {
                message += '乡镇/街道不能为空<br>';
                valid = false;
            } else {
                content[excelIndex.town] = String(content[excelIndex.town]).trim()
            }

            if (!content[excelIndex.village]) {
                message += '村/社区不能为空<br>';
                valid = false;
            } else {
                content[excelIndex.village] = String(content[excelIndex.village]).trim()
            }

            const village = await this.getVillageDistrictByName(params.adcode, content[excelIndex.town], content[excelIndex.village])

            if (!village) {
                message += `没有在系统里找到村/社区:${content[excelIndex.village]}<br>`;
                valid = false;
            }
            content.push(message);


            if (!valid) {
                resutls.needFixUsers.push(content);
            } else {
                resutls.canUploadUsers.push(content);
            }
        }

        // const preparePromises = [];
        // const targetps = this.service.users.findOne({ identityNumber: o[excelIndex.identityNumber] });
        // preparePromises.push(targetps)

        // const villageps = this.service.districts.findOne({ name: o[excelIndex.village], level: 'village' }, { adcode: 1, ancestors: 1, level: 1, name: 1, parentAdcode: 1 });
        // preparePromises.push(villageps)
        return resutls;
    }

    async getVillageDistrictByName(districtAdCode, townName, villageName) {
        const key = `${districtAdCode}#${townName}#${villageName}`;
        if (!this.cache) {
            this.cache = {};
        }
        if (this.cache[key]) {
            return this.cache[key];
        }
        this.cache[key] = await this.service.districts.findOne({
            'ancestors.districtAdCode': districtAdCode,
            name: villageName,
            level: 'village',
            'ancestors.street': townName
        }, {adcode: 1, ancestors: 1, level: 1, name: 1, parentAdcode: 1});
        return this.cache[key];
    }

    async getProjectByDistrict(district) {
        if (!district) {
            return;
        }
        const key = `project#${district.adcode}`;
        if (!this.cache) {
            this.cache = {};
        }
        if (this.cache[key]) {
            return this.cache[key];
        }
        this.cache[key] = await this.service.projects.getProjectByDistrict(district);
        return this.cache[key];
    }

    getSex(idNo) {
        if (idNo.length == 15) {
            return idNo.charAt(14) % 2 == 1;
        }
        else {
            return idNo.charAt(16) % 2 == 1;
        }
    }

    getDob(idNo) {
        let tmpStr = '';
        if (idNo.length == 15) {
            tmpStr = idNo.substring(6, 12);
            tmpStr = "19" + tmpStr;
            return tmpStr;
        }
        else {
            tmpStr = idNo.substring(6, 14);
            return tmpStr;
        }
    }

    async parseUserFromExcel(params, excelObj, i) {
        const excelIndex = params.excelIndex;
        const o = excelObj[i];

        const preparePromises = [];
        const targetps = this.service.users.findOne({identityNumber: o[excelIndex.identityNumber]});
        preparePromises.push(targetps)

        const villageps = this.getVillageDistrictByName(params.adcode, o[excelIndex.town], o[excelIndex.village])
        preparePromises.push(villageps)

        const [target, village] = await Promise.all(preparePromises);
        o[excelIndex.currentAddress]
        var u = {
            district: {
                _id: village._id,
                adcode: village.adcode,
                ancestors: village.ancestors,
                level: village.level,
                name: village.name,
                parentAdcode: village.parentAdcode
            },
            name: o[excelIndex.name],
            identityNumber: o[excelIndex.identityNumber],
            lifeCondition: o[excelIndex.lifeCondition] ? o[excelIndex.lifeCondition] : '普通',
            contactNumber: o[excelIndex.contactNumber] ? o[excelIndex.contactNumber] : '无',
            childrenNumber: o[excelIndex.childrenNumber] ? Number.parseInt(o[excelIndex.childrenNumber]) : null,
            nation: o[excelIndex.nation] ? o[excelIndex.nation] : '',
            currentAddress: o[excelIndex.currentAddress],
            role: 'USER',
            subsidy: [],
            service: [],
            status: 'ACTIVE',
        }
        const idString = u.identityNumber;
        u.dob = this.ctx.helper.getMillisecond(this.getDob(idString));
        u.sex = this.getSex(idString);

        const projects = await this.getProjectByDistrict(village);
        let project = null;
        if (projects && projects.length > 0) {
            project = projects[0];
            u.subsidy = [{
                projectId: project._id.toHexString(),
                name: project.name,
                value: {value: project.price.value, unit: "元"}
            }]
        }

        if (target) {
            const query = {_id: target._id};
            const updateParams = {
                district: {
                    _id: village._id,
                    adcode: village.adcode,
                    ancestors: village.ancestors,
                    level: village.level,
                    name: village.name,
                    parentAdcode: village.parentAdcode
                },
                currentAddress: u.currentAddress, lifeCondition: u.lifeCondition,
                contactNumber: u.contactNumber, childrenNumber: u.childrenNumber, nation: u.nation, name: u.name,
                role: 'USER',
            };
            if (project) {
                // console.log(JSON.stringify(target));
                // console.log(JSON.stringify(target));

                let isHaveSubsidy = null;
                // console.log(Array.isArray(target.subsidy));
                if (Array.isArray(target.subsidy)) {
                    for (let j = 0; j < target.subsidy.length; j++) {
                        if (target.subsidy[j].projectId !== undefined) {
                            if (target.subsidy[j].projectId == project._id.toHexString()){
                                isHaveSubsidy = project._id.toHexString();
                            }
                        }
                        // console.log(j);
                    }
                } else {
                    // console.log("xxxxxxxxxxxxxxx");
                }
                // if (Array.isArray(target.subsidy) && target.subsidy.length > 0 ) {
                //
                // }
                // const isHaveSubsidy = target.subsidy.some(s => s.projectId == project._id.toHexString());
                if (isHaveSubsidy) {
                    query['subsidy.projectId'] = project._id.toHexString();
                    updateParams['subsidy.$.value.value'] = project.price.value;
                } else {
                    updateParams['$push'] = {subsidy: u.subsidy[0]}
                }
            }
            // const userModel = await this.service.users.findOne(query);
            // delete userModel.subsidy;
            // delete userModel.role;
            // userModel.subsidy = u.subsidy;
            // userModel.role = 'USER';
            await this.service.users.findOneAndUpdate(query, updateParams);
            // console.log("老人ID--" + query._id.toString());
            const orders = await this.service.orders.find(
                {'target._id':query._id.toString()}
            );
            // console.log("老人订单数为---" + orders.length + "   老人身份证为" + u.identityNumber);
            if (orders.length > 0) {
                await this.service.orders.updateMulti(
                    {'target.identityNumber':u.identityNumber},
                    {'district':u.district}
                );
                console.log("[*] 更新完" + orders.length + "条订单....老人身份证为" + u.identityNumber);
            }
        } else {
            await this.service.users.create(u);
        }

    }

    async update(ctx) {
        const oldUser = await this.daoService.show(ctx.params.id);
        const updateParams = ctx.request.body;
        if (updateParams.identityNumber) {
            const count = await this.service.users.count({
                identityNumber: updateParams.identityNumber,
                _id: {$ne: ctx.params.id}
            });
            if (count > 0) {
                this.fail('身份证号码在系统已经存在', 417);
                return;
            }
        }
        if (updateParams.shortName) {
            const count = await this.service.users.count({
                shortName: updateParams.shortName,
                _id: {$ne: ctx.params.id}
            });
            if (count > 0) {
                this.fail('简称在系统已经存在', 417);
                return;
            }
        }
        if (updateParams.phone && updateParams.role != 'USER') {
            const count = await this.service.users.count({phone: updateParams.phone, _id: {$ne: ctx.params.id}});
            if (count > 0) {
                this.fail('电话号码在系统已经存在', 417);
                return;
            }
        }

        const result = await this.daoService.update(ctx.params.id, updateParams);
        const newUser = await this.daoService.show(ctx.params.id);
        if (newUser.district != undefined && newUser.district != oldUser.district) {
            await this.updateDistrict({adcode: newUser.district.adcode}, oldUser)
        }
        if (newUser.identityNumber != undefined && (newUser.identityNumber != oldUser.identityNumber || newUser.name != oldUser.name)) {
            const updateParmas = {
                $set: {
                    'target.name': newUser.name,
                    'target.identityNumber': newUser.identityNumber,
                }
            }
            await this.service.orders.updateMulti({'target._id': oldUser._id.toHexString()}, updateParmas);
            await this.service.fingerPrintRecord.updateMulti({'target._id': oldUser._id.toHexString()}, updateParmas);
        }
        // if (newUser.access && newUser.access.length == 0) {
        //   delete newUser.access;
        // }
        ctx.body = result;
    }

    //更新用户district和用户对应order的
    async updateDistrict(searchParams, user) {
        const districts = await this.service.districts.find(searchParams)
        if (districts.length == 1) {
            const village = districts[0];
            //根据服务项目查找对应的合同
            const projects = await this.getProjectByDistrict(village);
            if (!projects || projects.length <= 0) {
                console.log(`: can't found project: ${village.name} ${village.adcode}`)
                return;
            }
            const project = projects[0];

            const updateUserParams = {
                district: {
                    adcode: village.adcode,
                    ancestors: village.ancestors,
                    level: village.level,
                    name: village.name,
                    parentAdcode: village.parentAdcode
                },
                subsidy: [{
                    projectId: project._id.toHexString(), name: project.name,
                    value: {
                        unit: "元",
                        value: project.price.value
                    }
                }],
                statusVillage: '1'
            };
            await this.service.users.updateMulti({_id: user._id}, updateUserParams)

            const updateOrderParams = {
                district: {
                    adcode: village.adcode,
                    ancestors: village.ancestors,
                    level: village.level,
                    name: village.name,
                    parentAdcode: village.parentAdcode
                },
                project: {
                    _id: project._id.toHexString(), name: project.name,
                }
            };

            await this.service.orders.updateMulti({'target._id': user._id.toHexString()}, updateOrderParams);

            await this.service.fingerPrintRecord.updateMulti({'target._id': user._id.toHexString()}, {district: updateOrderParams.district});

        } else {
            console.log(`can't found 村 in ${JSON.stringify(searchParams)}`)
        }
    }

    async statisticByRole(ctx) {
        ctx.body = await this.daoService.statisticByRole(ctx.request.body);
    }

    async count(ctx) {
        const query = ctx.request.body;
        if (!query.metric) {
            query.metric = {};
        }
        const metric = query.metric;
        if (metric.govLevel) {
            let result = this.service.districts.getMetricSQL(metric);
            query.eqs = {...query.eqs, ...result}
        }
        const count = await this.daoService.countSearch(query);

        ctx.body = {count};
    }

    async updateUserPortrait() {
        this.daoService.updatePortrait();
    }

    async getUserByProjectId(ctx) {
        const userList = await this.daoService.getServicerByProjectId(ctx.request.body._id);
        ctx.body = userList;
    }

    async searchUser(ctx) {
        ctx.body = await this.daoService.searchUser(ctx.query);
    }


};
module.exports = UsersController;