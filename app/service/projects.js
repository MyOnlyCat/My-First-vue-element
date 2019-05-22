'use strict';
const moment = require('moment');
const DaoService = require('./daoService');

class ProjectsService extends DaoService {
    init() {
        this.model = this.ctx.model.Projects;
    }

    async index(pagin, selectFileds) {
        const query = this.ctx.request.body;
        const queryCriteria = this.queryCriteria(query);
        let districtSql;
        if (query.metric && query.metric.adcode) {
            //例如， 得到所在村的合同
            const adcode = query.metric.adcode;
            const district = await this.service.districts.findOne({adcode});
            districtSql = this.service.districts.getDistrictAncestorSQL(district);
            districtSql = {'district.adcode': {$in: districtSql}}
        }

        let result = await this.findByPage({...queryCriteria, ...districtSql}, pagin, selectFileds, this.sort(query));
        return result;
    }

    async update(_id, params) {
        if (params.price && params.price.value != null) {
            const project = await this.show(_id);
            if (project.price.value != params.price.value) {
                const districtSql = this.service.districts.getDistrictSQL(project.district);
                districtSql['subsidy.projectId'] = project._id.toHexString();
                this.service.users.updateMulti(districtSql, {$set: {'subsidy.$.value.value': params.price.value}})
            }
        }
        return super.update(_id, params);
    }

    async create(request) {
        const project = await super.create(request);
        if (project) {
            const districtSql = this.service.districts.getDistrictSQL(request.district);
            const param = {
                subsidy: {
                    projectId: project._id.toHexString(),
                    name: request.name,
                    value: {value: request.price.value, unit: "元"}
                }
            };
            const results = await this.service.users.updateMulti(districtSql, {$push: param})
            console.log(results)
        }

        return project;
    }

    async getProjectByDistrict(district) {
        if (!district) {
            return;
        }
        const districtSql = this.service.districts.getDistrictAncestorSQL(district);
        const query = {
            'district.adcode': {$in: districtSql}
        }
        const now = moment().valueOf();
        query.start = {$lte: now};
        query.end = {$gte: now};
        const project = await this.find(query);
        return project;
    }

    async getActiveProjects(query) {
        const queryCriteria = this.queryCriteria(query);
        let districtSql;
        if (query.metric && query.metric.adcode) {
            //例如， 得到所在村的合同
            const adcode = query.metric.adcode;
            const district = await this.service.districts.findOne({adcode});
            districtSql = this.service.districts.getDistrictAncestorSQL(district);
            districtSql = {'district.adcode': {$in: districtSql}};
            // const now = moment().valueOf();
            // districtSql.start = {$lte: now};
            // districtSql.end = {$gte: now};
        }

        // if (!district) {
        //   return;
        // }
        // const districtSql = this.service.districts.getDistrictAncestorSQL(district);
        // const query = {
        //   'district.adcode': { $in: districtSql }
        // }
        console.log({...queryCriteria, ...districtSql});
        const projects = await this.find({...queryCriteria, ...districtSql});
        return projects;
    }

    async getProjectBtcode(query) {
        const classOne = await this.model.find(
            {
                "organization._id":query.organizationId,
                "$or":[{"district.ancestors.streetAdCode":query.streetAdCode},{"district.adcode":query.streetAdCode}]
            }
        );
        if (classOne.length !== 0) {
            console.info("4级地域存在合同");
            await this.dellProjectJson(classOne);
            return classOne
        }
        //-----------------------------------------------------------------------------------
        const classTwo = await this.model.find(
            {
                "organization._id":query.organizationId,
                "$or":[{"district.ancestors.districtAdCode":query.districtAdCode},{"district.adcode":query.districtAdCode}]
            }
        );
        if (classTwo.length !== 0) {
            console.info("3级地域存在合同");
            await this.dellProjectJson(classTwo);
            return classTwo
        }
        //-----------------------------------------------------------------------------------
        const classThree = await this.model.find(
            {
                "organization._id":query.organizationId,
                "$or":[{"district.ancestors.cityAdCode":query.cityAdCode},{"district.adcode":query.cityAdCode}]
            }
        );
        if (classThree.length !== 0) {
            console.info("2级地域存在合同");
            await this.dellProjectJson(classThree);
            return classThree
        }
        //-----------------------------------------------------------------------------------
        const classFore = await this.model.find(
            {
                "organization._id":query.organizationId,
                "$or":[{"district.ancestors.provinceAdCode":query.provinceAdCode},{"district.adcode":query.provinceAdCode}]
            }
        );
        if (classFore.length !== 0) {
            console.info("1级地域存在合同");
            await this.dellProjectJson(classFore);
            return classFore
        }
    }

    async dellProjectJson(data) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].projectStatus !== undefined && data[i].projectStatus !== null) {
                if (data[i].projectStatus.length > 0) {
                    if (data[i].projectStatus[0].status === "END") {
                        if (i > -1) {
                            data.splice(i, 1);
                        }
                    }
                }
            }
        }
        console.log(data.length)
    }


}

module.exports = ProjectsService;
