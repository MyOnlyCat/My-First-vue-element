'use strict';
const xlsx = require('node-xlsx').default;
const CommonController = require('./commonController');
let fs = require('fs');

class DistrictsController extends CommonController {
  init() {
    this.daoService = this.service.districts;
  }

  /**
   * 创建区域
   * @param {*} ctx 
   */
  async create(ctx) {
    const district = ctx.request.body;
    if (!district.adcode) {//如果没有传adcode,则取父区域的下所有区域,取最大的adcode加1
      const maxAdcode = await this.service.districts.findByPage({ parentAdcode: district.parentAdcode}, {pageSize: 1}, { adcode: 1, ancestors: 1, level: 1, name: 1, parentAdcode: 1 }, { adcode: -1 });
      let adcode = district.parentAdcode + '001';
      if (maxAdcode.count > 0) {
        adcode = String(Number.parseInt(maxAdcode.content[0].adcode) + 1)
      }
      district.adcode = adcode;
    }

    ctx.body = await this.daoService.create(district);
  }

  async update(ctx) {
    const district = await this.daoService.show(ctx.params.id);
    if (ctx.request.body.name && ctx.request.body.name != district.name) {
      //如果更新了名字,更新其它表
      if (district.level != 'village') {
        const updateParam = {[`ancestors.${district.level}`]: ctx.request.body.name};
        const queryParam = {[`ancestors.${district.level}AdCode`]: district.adcode};
        await this.daoService.updateMulti({[`ancestors.${district.level}AdCode`]: district.adcode}, {[`ancestors.${district.level}`]: ctx.request.body.name});
        await this.service.users.updateMulti({[`district.ancestors.${district.level}AdCode`]: district.adcode}, {[`district.ancestors.${district.level}`]: ctx.request.body.name})
        await this.service.projects.updateMulti({[`district.ancestors.${district.level}AdCode`]: district.adcode}, {[`district.ancestors.${district.level}`]: ctx.request.body.name})
        await this.service.orders.updateMulti({[`district.ancestors.${district.level}AdCode`]: district.adcode}, {[`district.ancestors.${district.level}`]: ctx.request.body.name})
        await this.service.services.updateMulti({[`district.ancestors.${district.level}AdCode`]: district.adcode}, {[`district.ancestors.${district.level}`]: ctx.request.body.name})
      }
      await this.service.users.updateMulti({[`district.adcode`]: district.adcode}, {[`district.name`]: ctx.request.body.name})
      await this.service.projects.updateMulti({[`district.adcode`]: district.adcode}, {[`district.name`]: ctx.request.body.name})
      await this.service.orders.updateMulti({[`district.adcode`]: district.adcode}, {[`district.name`]: ctx.request.body.name})
      await this.service.services.updateMulti({[`district.adcode`]: district.adcode}, {[`district.name`]: ctx.request.body.name})

    }
    await super.update(ctx);
  }

  /**
   * 根据parentAdcode来查找子区域
   * @param {*} ctx 
   */
  async parentCode(ctx) {
    const code = ctx.params.code;
    ctx.body = await this.daoService.find({ parentAdcode: code });
  }

  /**
   * 从高德地图接口取区域,转换进自己的区域表里
   * @param {*} ctx 
   */
  async findFromAmp(ctx) {
    this.ctx = ctx;
    this.findDistricts = {};
    this.getDistrict(0)
    // this.getDistrict(1, "province", "510000")
    // this.getDistrict(2, "city", "510600")
    // this.getDistrict(3, "district", "510683")
    ctx.body = {};
  }

  async getDistrict(runLevel, level, keywords) {
    let parentAdcode = keywords || "0";
    level = level || "country";
    keywords = keywords || "%E4%B8%AD%E5%9B%BD";
    let result = await this.ctx.curl(`http://restapi.amap.com/v3/config/district?subdistrict=1&extensions=base&key=53796c81138f80552a62c08c4b9a699a&s=rsv3&output=json&platform=JS&logversion=2.0&sdkversion=1.3&appname=http%3A%2F%2Flocalhost%3A8100%2F&level=${level}&keywords=${keywords}`, {
      method: 'GET',
      dataType: 'json',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      }
    });

    let data = result.data;

    if (!data.districts || data.districts.length == 0) {
      console.log(JSON.stringify(data))
      return
    }
    let districts = data.districts[0].districts;
    if (level == "country") {
      districts = districts.filter(d => d.adcode == '510000')
    }
    for (let i in districts) {
      var entity = districts[i];
      entity.parentAdcode = parentAdcode;
      let ancestors = {};
      switch (entity.level) {
        case 'province':
          break;
        case 'city':
          let province = this.findDistricts[parentAdcode];
          ancestors.province = province.name;
          ancestors.provinceAdCode = province.adcode;
          break;
        case 'district':
          let city = this.findDistricts[parentAdcode];
          ancestors = { ...city.ancestors }
          ancestors.city = city.name;
          ancestors.cityAdCode = city.adcode;
          break;
      }
      entity.ancestors = ancestors;
      this.findDistricts[entity.adcode] = entity;
      await this.daoService.create(entity);
    }

    runLevel = ++runLevel
    if (runLevel <= 3) {
      await this.parseAmp(districts, runLevel);
    }

  }

  async parseAmp(districts, runLevel, start = 0) {
    let cc = 0;
    let pss = [];
    let step = 3;
    for (let i = start; i < districts.length && i < (start + step); i++) {
      cc++;
      var entity = districts[i];

      if (entity.level == 'district') {
        step = 3;
        pss.push(this.findFromQQStreet(entity.adcode));

      } else {
        step = 1;
        pss.push(this.getDistrict(runLevel, entity.level, entity.adcode));
      }
    }
    await Promise.all(pss);
    if ((start + step) < districts.length) {
      await this.parseAmp(districts, runLevel, start + step);
    }
  }


  async findFromQQStreet(id) {

    let result;
    try {
      result = await this.ctx.curl(`http://apis.map.qq.com/ws/district/v1/getchildren?id=${id}&key=IL4BZ-2IHKQ-ZPB5C-GJN3H-J6XSO-54BNM`, {
        method: 'GET',
        dataType: 'json'
      });
    } catch (error) {
      console.log(`findFromQQStreet error ${id} ` + error)
      await this.ctx.helper.sleep(1000);
      await this.findFromQQStreet(id);
      return;
    }


    let data = result.data;

    if (!data.result || data.result.length == 0) {
      console.log(`findFromQQStreet error ${id} ` + JSON.stringify(data))
      await this.ctx.helper.sleep(1000);
      await this.findFromQQStreet(id);
      return
    }

    var districts = data.result[0];
    for (let i in districts) {
      var entity = districts[i];

      let district = this.findDistricts[id];
      let ancestors = { ...district.ancestors }
      ancestors.district = district.name;
      ancestors.districtAdCode = district.adcode;

      let newEntity = {
        "parentAdcode": id,
        "name": entity.fullname,
        "adcode": entity.id,
        "center": `${entity.location.lng},${entity.location.lat}`,
        ancestors,
        "level": "street"
      }
      await this.daoService.create(newEntity);
    }

  }
  async importVillages(ctx) {
    this.ctx = ctx;
    this.getVillages()
    ctx.body = {};
  }

  async getVillages() {
    var file = "/media/study/workspaces/workspace_node/district-import/villages.json";
    let towns = {};
    var villages = JSON.parse(fs.readFileSync(file));

    const step = 50;

    let parse = async (start = 0, end = step) => {
      let promises = [];
      for (let i = start; i < villages.length && i < end; i++) {

        let village = villages[i];
        // console.log(village)
        let adcode = village.townId.substring(0, 9);
        if (!towns[village.townId]) {
          towns[village.townId] = this.daoService.findOne({ adcode });
        }

        let p = towns[village.townId].then(async findTown => {
          if (!findTown) {
            return;
          }
          // console.log(JSON.stringify(succ));
          // let entity = {
          //   "parentAdcode": village.townId,
          //   "name": village.village,
          //   "citycode": findTown.citycode,
          //   "adcode": village.villageId,
          //   "level": "village"
          // }

          // await this.service.communities.create(entity);

          let ancestors = { ...findTown.ancestors }
          ancestors.street = findTown.name;
          ancestors.streetAdCode = findTown.adcode;

          let newEntity = {
            "parentAdcode": adcode,
            "name": village.village,
            "adcode": village.villageId,
            ancestors,
            "level": "village"
          }
          await this.daoService.create(newEntity);
        })
        promises.push(p);
      }
      Promise.all(promises).then(async succ => {
        if (end < villages.length) {
          await parse(end, end + step);
        }
      });
    }
    await parse();
  }

  async readVillagesFromExcelStream(ctx) {
    let index = 0;
    const params = {
      // file: '/home/lee/Documents/批量导入老人模板.xlsx',
      adcode: ctx.query.adcode,
      excelIndex: {
        town: index++,
        village: index++,
      },
    }
    const stream = await ctx.getFileStream();

    const promise = new Promise((resole, reject)=>{
      var buffers = [];
      stream.on('data', function(buffer) {
        buffers.push(buffer);
      });
      stream.on('end', function() {
        var buffer = Buffer.concat(buffers);
        resole(buffer);
      });
    })

    const fileBuffer = await promise;

    const workSheetsFromFile = xlsx.parse(fileBuffer, {type:'buffer'});
    var excelObj = workSheetsFromFile[0].data;
    console.log(` ${excelObj.length}`);
    const validateResults = await this.validteVillageFromExcel(params, excelObj);

    const resultPromises = [];

    for (let i = 0; i < validateResults.canUploadVillages.length; i++) {
      const p = await this.parseVillageFromExcel(params, validateResults.canUploadVillages, i);
      resultPromises.push(p);
    }
    // await Promise.all(resultPromises);
    console.log('finished')
    delete validateResults.canUploadVillages;
    ctx.body = validateResults;
  }


  async parseVillageFromExcel(params, excelObj, i) {
    const excelIndex = params.excelIndex;
    const o = excelObj[i];

    const findTown = await this.getVillageDistrictByName(params.adcode, o[excelIndex.town])

    let ancestors = { ...findTown.ancestors }
    ancestors.street = findTown.name;
    ancestors.streetAdCode = findTown.adcode;
    const maxAdcodeVillage = await this.service.districts.findByPage({ level: 'village', 'ancestors.streetAdCode': findTown.adcode }, {pageSize: 1}, { adcode: 1, ancestors: 1, level: 1, name: 1, parentAdcode: 1 }, { adcode: -1 });
    let villageAdcode = findTown.adcode + '001';
    if (maxAdcodeVillage.count > 0) {
      villageAdcode = String(Number.parseInt(maxAdcodeVillage.content[0].adcode) + 1)
    }
    let newEntity = {
      "parentAdcode": findTown.adcode,
      "name": o[excelIndex.village],
      "adcode": villageAdcode,
      ancestors,
      "level": "village"
    }
    await this.daoService.create(newEntity);
  }


  async validteVillageFromExcel(params, excelObj) {
    const excelIndex = params.excelIndex;

    const resutls = {
      message: '',
      needFixVillages: [],
      canUploadVillages: [],
    }

    if (excelObj.length > 2000) {
      resutls.message = '最大导入不能超过2000条';
      return resutls;
    }

    for (let i = 1; i < excelObj.length; i++) {
      const content = excelObj[i];
      var valid = true;
      let message = '';

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

      const findTown = await this.getVillageDistrictByName(params.adcode, content[excelIndex.town])

      if (!findTown) {
        message += `没有在系统里找到乡镇/街道:${content[excelIndex.town]}<br>`;
        valid = false;
      }
      content.push(message);

      if (!valid) {
        resutls.needFixVillages.push(content);
      } else {
        const villageCount = await this.service.districts.count({ 'ancestors.districtAdCode': params.adcode, name: content[excelIndex.village], level: 'village', 'ancestors.street': content[excelIndex.town] });
        if (villageCount == 0) {
          //不存在才添加
          resutls.canUploadVillages.push(content);
        }
      }
    }
    return resutls;
  }

  async getVillageDistrictByName(districtAdCode, townName) {
    const key = `${districtAdCode}#${townName}`;
    if (!this.cache) {
      this.cache = {};
    }
    if (this.cache[key]) {
      return this.cache[key];
    }
    this.cache[key] = await this.service.districts.findOne({ 'ancestors.districtAdCode': districtAdCode, name: townName, level: 'street' }, { adcode: 1, ancestors: 1, level: 1, name: 1, parentAdcode: 1 });
    return this.cache[key];
  }

};
module.exports = DistrictsController;