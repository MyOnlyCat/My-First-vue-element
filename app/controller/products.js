'use strict';
const CommonController = require('./commonController');

class ProductsController extends CommonController {
  init() {
    this.daoService = this.service.products;
  }

  // 如果表里有这条物资数据,则增加数量,没有则新增一条物资
  // async create(ctx) {
  // 	const temp = ctx.request.body;
  // 	const product = await this.daoService.findOne({ category: temp.category, name: temp.name, isDonated: !!temp.isDonated, location: temp.location })
  // 	let result;
  // 	if (product) {
  // 		product.counts.value = product.counts.value + newCount;
  // 		product.inventory.value = product.inventory.value + newCount;
  // 		const updateParams = {
  // 			'counts.value': product.counts.value,
  // 			'inventory.value': product.inventory.value,
  // 		}
  // 		await this.daoService.update(product._id, updateParams);
  // 		result = product;
  // 	} else {
  // 		temp.inventory = temp.counts;
  // 		result = await this.daoService.create(temp);
  // 	}

  // 	const newRecord = {
  // 		"category": "ENTER",//ENTER:入库，REQUISITION:领用， RETURN：归还， SCRAP:报废
  // 		"product": { "_id": result._id, "name": temp.name },
  // 		"counts": temp.counts,
  // 		"actor": temp.actor,
  // 		"location": temp.location,
  // 		comment: temp.comment,
  // 		"status": "NEW",
  // 		"attachments": []
  // 	}
  // 	this.service.productsRecords.create(newRecord);
  // 	ctx.body = result;
  // }

  async update(ctx) {
    const updateParams = ctx.request.body;
    const materia = await this.daoService.show(ctx.params.id);
    if (updateParams.name != undefined && updateParams.name != materia.name) {
      this.service.productsRecords.updateMulti({ 'product._id': ctx.params.id }, { $set: { 'product.name': updateParams.name } });
    }
    ctx.body = await this.daoService.update(ctx.params.id, updateParams);
  }

  async groupByField(ctx) {
    ctx.body = await this.daoService.groupByField(ctx.request.body);
  }


}
module.exports = ProductsController;
