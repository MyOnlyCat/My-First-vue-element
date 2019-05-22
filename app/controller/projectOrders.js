'use strict';
const CommonController = require('./commonController');
//暂时没有用
class ProjectOrdersController extends CommonController {
  init() {
    this.daoService = this.service.projectOrders;
  }

  async create(ctx) {
    const record = ctx.request.body;
    const project = await this.service.projects.show(record.project._id); 
    const updateParameters = {};
    if (record.category === 'INCOME') {
      let income = project.income||0;
      income += record.price.value;
      updateParameters.income = income;
    } else if (record.category === 'EXPENSE') {
      let expense = project.expense||0;
      expense += record.price.value;
      updateParameters.expense = expense;
    }

    await this.service.projects.update(record.project._id, updateParameters);
    ctx.body =  await this.daoService.create(record);
  }

  async update(ctx) {
    this.fail('不能编辑', 417)
  }

  async destroy(ctx) {
    const record = await this.daoService.show(ctx.params.id); 
    const project = await this.service.projects.show(record.project._id); 
    const updateParameters = {};
    if (record.category === 'INCOME') {
      let income = project.income||0;
      income -= record.price.value;
      updateParameters.income = income;
    } else if (record.category === 'EXPENSE') {
      let expense = project.expense||0;
      expense -= record.price.value;
      updateParameters.expense = expense;
    }

    await this.service.projects.update(record.project._id, updateParameters);
    ctx.body =  await this.daoService.destroy(record);
  }
}
module.exports = ProjectOrdersController;
