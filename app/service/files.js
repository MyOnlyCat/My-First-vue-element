'use strict';
const uuidv1 = require('uuid/v1');
let OSS = require('ali-oss');
let fs = require('fs');
let client = new OSS({
    accessKeyId: 'LTAIJ29Z6eh3ibgX',
    accessKeySecret: 'xGpWm9wQhnaRO38K0bfVj9zRQL8uvZ',
    bucket: 'hcc-sms-node',
    endpoint: 'hcc-sms-node.oss-cn-shenzhen.aliyuncs.com',
});

const folder = 'hcc-sms';
module.exports = app => {
    class FilesService extends app.Service {
        async downloadStream(id) {

            const fileMeta = await new Promise(resolve => {
                app.gfs.findOne({_id: id}, (err, fileMeta) => {
                    if (err || !fileMeta) {
                        resolve();
                        return;
                    }
                    resolve(fileMeta);
                });
            });
            if (fileMeta) {
                const file = await app.gfs.createReadStream({
                    _id: id,
                });
                return file;
            }
        }

        async download(id) {

            const fileMeta = await new Promise(resolve => {
                app.gfs.findOne({_id: id}, (err, fileMeta) => {
                    if (err || !fileMeta) {
                        resolve();
                        return;
                    }
                    this.ctx.set('Content-Type', 'application/octet-stream');
                    this.ctx.set('Content-Length', fileMeta.length);
                    this.ctx.attachment(fileMeta.filename);
                    resolve(fileMeta);
                });
            });
            if (fileMeta) {
                const file = await app.gfs.createReadStream({
                    _id: id,
                });
                return file;
            }
        }

        async findByIds(ids = []) {
            return await new Promise((resolve, reject) => {
                app.gfs.files.find({_id: {$in: ids.map(id => app.gfs.tryParseObjectId(id) || id)}}).toArray((err, files) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log(`files: ${files}`);
                    this.ctx.body = files;
                    resolve(files);
                });
            });
        }

        async upload(file) {
            console.log('upload' + file.length)
            const writeStream = app.gfs.createWriteStream({
                filename: file.filename,
            });
            file.pipe(writeStream);
            return await new Promise(resolve => {
                writeStream.on('close', function (file) {
                    console.log(`upload ${JSON.stringify(file)}`);
                    resolve(file);
                });
            });
        }

        async downloadSSOStream(id) {


            /**
             *  client: {
            accessKeyId: 'LTAIJ29Z6eh3ibgX',
            accessKeySecret: 'xGpWm9wQhnaRO38K0bfVj9zRQL8uvZ',
            bucket: 'hcc-sms-node',
            endpoint: 'oss-cn-shenzhen-internal.aliyuncs.com',
            timeout: '10s',
        },
             */

            // try {
            //     const file = await app.oss.getStream(`${folder}/${id}`);
            //     return file.stream;
            // } catch (err) {
            // }
            try {
                //先判断有没有后缀
                //这个是有后缀的情况
                if (id.indexOf(".") > 0) {
                    console.log("file的状态  默认--- ");
                    const file = await client.getStream("/hcc-sms/e6052910-f4a1-11e8-905c-79dd6a1bade5.jpg");
                    console.log("file的状态  默认--- ***" + JSON.stringify(file));
                    //如果有后缀,并且有oss上有图片的情况
                    if (file.stream !== undefined) {
                        return file.stream;
                    }
                } else { //没有后缀的情况
                    //先请求看看
                    console.log("file1的状态  默认--- ");
                    // const file1 = await app.oss.getStream(`${folder}/${id}`);
                    const file1 = await client.getStream(`${folder}/${id}`);
                    console.log("file1的状态--- " + JSON.stringify(file1));
                    //没有后缀能请求出来就返回
                    if (file1.stream !== undefined) {
                        console.log("没有后缀能 file1的状态--- ***" + file.stream);
                        return file1.stream;
                    } else { //没有后缀请求不出来的情况,可以加jpg 或者 png来请求看看
                        const file2 = await client.getStream(`${folder}/${id} + ".jpg"}`);
                        // const file2 = await app.oss.getStream(`${folder}/${id} + ".jpg"}`);
                        console.log("file2的状态---*** " + file.stream);
                        //加jpg有就返回
                        if (file2.stream !== undefined) {
                            console.log("加jpg file2的状态---*** " + file2.stream);
                            return file2.stream;
                        } else { //否则就加png了
                            console.log("file3的状态---*** " + file.stream);
                            // const file3 = await app.oss.getStream(`${folder}/${id} + ".png"`);
                            const file3 = await client.getStream(`${folder}/${id} + ".png"`);
                            if (file3.stream !== undefined) {
                                console.log("加png file3的状态---** " + file3.stream);
                                return file3.stream;
                            }
                        }
                    }
                }
            } catch (err) {
            }
        }

        async downloadSSO(id) {
            this.ctx.set('Content-Type', 'application/octet-stream');
            try {
                const file = await app.oss.getStream(`${folder}/${id}`);
                return file.stream;
            } catch (err) {
            }
        }

        async uploadSSO(file, id) {
            if (!id) {
                let suffix = this.ctx.helper.getNameSuffix(file.filename);
                suffix = suffix ? `.${suffix}` : '';
                id = uuidv1() + suffix;
            }
            const object = await this.uploadSSOPro(file, id);
            console.log(`uploadSSO ${object}`);
            return {_id: id, filename: file.filename};

        }

        async uploadSSOPro(file, id) {
            return new Promise(resolve => {
                app.oss.put(`${folder}/${id}`, file).then(result => {
                    resolve(result);
                }).catch(err => {
                    this.ctx.logger.error(`uploadSSOPro: ${this.ctx.href} ${file.filename} to ${id}, header: ${JSON.stringify(this.ctx.request.header)}`);

                    app.oss.put(`${folder}/${id}`, file).then(result => {
                        this.ctx.logger.error(`retry success uploadSSOPro: ${this.ctx.href} ${file.filename} to ${id}`);
                        resolve(result);
                    }).catch(err => {
                        this.ctx.logger.error(`retry fail uploadSSOPro: ${this.ctx.href} ${file.filename} to ${id}, header: ${JSON.stringify(this.ctx.request.header)}`);
                        throw err;
                    })
                })
            })
        }

        async destroy(_id) {
            return await new Promise((resolve, reject) => {
                app.bucket.delete((app.gfs.tryParseObjectId(_id) || _id), (err, res) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({success: true});
                });
            });
        }
    }

    return FilesService;
};
