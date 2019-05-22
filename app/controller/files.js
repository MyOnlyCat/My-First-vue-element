'use strict';
const moment = require('moment');
const Controller = require('egg').Controller;

class FilesController extends Controller {

  /**
   * 根据id来下载文件,生产环境从阿里oss取,开发环境从mongodb取
   * @param {*} ctx 
   */
  async download(ctx) {
    if (ctx.app.config.env == 'prod') {
      await this.downloadSSO(ctx);
    } else {
      await this.downloadLocal(ctx);
    }
  }

  async downloadLocal(ctx) {
    const uid = ctx.query.uid;
    const type = ctx.query.type;
    const id = ctx.params.id;
    if (uid && type) {
      const user = await this.service.users.show(uid);

      let exist = false;
      if (user.downloads && user.downloads.length > 0) {
        exist = user.downloads.some(d => {
          return d.id == id && d.type == type;
        });
      }
      if (!exist) {
        await this.service.users.findOneAndUpdate({ _id: uid },
          { $push: { downloads: { id, created: moment().valueOf(), type } } });
      }
    }

    ctx.body = await this.service.files.download(ctx.params.id);
  }

  async list(ctx) {
    await this.service.files.findByIds(ctx.queries.ids);
  }
  /**
   * 生产环境上传到阿里oss,开发环境保存到mongodb
   * @param {*} ctx 
   */
  async upload(ctx) {
    if (ctx.app.config.env == 'prod') {
      await this.uploadSSO(ctx);
    } else {
      await this.uploadLocal(ctx);
    }
  }

  async uploadLocal(ctx) {
    const stream = await ctx.getFileStream();
    ctx.body = await this.service.files.upload(stream);
  }

  async uploadSSO(ctx) {
    const stream = await ctx.getFileStream();
    ctx.body = await this.service.files.uploadSSO(stream);
  }

  async downloadSSO(ctx) {
    const uid = ctx.query.uid;
    const type = ctx.query.type;
    const id = ctx.params.id;
    if (uid && type) {
      const user = await this.service.users.show(uid);

      let exist = false;
      if (user.downloads && user.downloads.length > 0) {
        exist = user.downloads.some(d => {
          return d.id == id && d.type == type;
        });
      }
      if (!exist) {
        await this.service.users.findOneAndUpdate({ _id: uid },
          { $push: { downloads: { id, created: moment().valueOf(), type } } });
      }
    }

    ctx.body = await this.service.files.downloadSSO(ctx.params.id);
  }

  /**
   * 从本地数据库保存文件到阿里OSS
   * @param {*} ctx 
   */
  async convertToSSO(ctx) {
    const search = ctx.request.body;
    const queries = {};
    if (search.times) {
      for (const [ key, value ] of Object.entries(search.times)) {
        const start = value.start;
        const end = value.end;
        if (!queries[key] && (start || end)) {
          queries[key] = {};
        }
        if (start) {
          queries[key].$gte = new Date(start);
        }
        if (end) {
          queries[key].$lte = new Date(end);
        }
      }
      console.log(queries);
      const searchFiles = async (queries, pagin) => {
        const count = await new Promise(resolve => {
          ctx.app.gfs.files.count(queries, function(err, fileMeta) {
            if (err || !fileMeta) {
              resolve();
              return;
            }
            resolve(fileMeta);
          });
        });

        const page = Number(pagin.page || 1);
        const pageSize = Number(pagin.pageSize || 10);
        const from = (page - 1) * pageSize;

        const content = await new Promise(resolve => {
          ctx.app.gfs.files.find(queries)
            .skip(from)
            .limit(pageSize)
            .toArray(function(err, fileMeta) {
              if (err || !fileMeta) {
                resolve();
                return;
              }
              resolve(fileMeta);
            });
        });
        const result = {
          count,
          page,
          pageSize,
          content,
        };
        return result;
      };

      const pagin = { page: 1, pageSize: 1000 };
      let first = true;
      let results;
      while (first || ((pagin.page - 1) * pagin.pageSize) < results.count) {
        results = await searchFiles(queries, pagin);
        await this.convertPartsToSSO(results);
        pagin.page = pagin.page + 1;
        first = false;
      }
      console.log('convertToSSO: finished');
    }

  }

  async convertPartsToSSO(results) {

    console.log(`convertPartsToSSO: page: ${results.page} - pageSize: ${results.pageSize} - count: ${results.count}`);

    let resultPromises = [];
    const parsePromises = async (arrays, start, step) => {
      for (let i = start; i < arrays.length && i < start + step; i++) {
        const fileMeta = arrays[i];
        let id = fileMeta._id;
        if (typeof id !== 'string') {
          id = fileMeta._id.toHexString();
        }
        const file = await this.ctx.app.gfs.createReadStream({
          _id: id,
        });
        const p = this.service.files.uploadSSO(file, id);
        resultPromises.push(p);
      }
    };

    let start = 0,
      step = 100;
    while (start < results.content.length) {
      await this.ctx.helper.sleep(1000);
      await parsePromises(results.content, start, step);
      await Promise.all(resultPromises);
      resultPromises = [];
      start = start + step;
    }
  }

  async destroy(ctx) {
    ctx.body = await this.service.files.destroy(ctx.params.id);
  }
}

module.exports = FilesController;
