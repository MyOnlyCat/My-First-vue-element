'use strict';
const CommonController = require('./commonController');
class ProjectsController extends CommonController {
  init() {
    this.daoService = this.service.projects;
  }

  async getProjectByDistrict(ctx) {
    ctx.body = await this.daoService.getProjectByDistrict(ctx.request.body);
  }

  async getActiveProjects(ctx) {
    ctx.body = await this.daoService.getActiveProjects(ctx.request.body);
  }

    async getProjectByAdcode(ctx) {
        console.log(ctx.request.body);
        ctx.body = await this.daoService.getProjectBtcode(ctx.request.body);
    }
}
module.exports = ProjectsController;
