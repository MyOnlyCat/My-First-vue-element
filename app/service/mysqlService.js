'use strict';
const mongoose = require('mongoose');
const DaoService = require('./daoService');

class MysqlService extends DaoService {


    async saveOperation(type, request) {
        console.info("操作记录保存");
        const conn = await this.app.mysql.beginTransaction();
        let newVar = await this.getTime();
        try {
            await conn.insert('operation', {
                    'type': type,
                    'operation_time': newVar,
                    'content': JSON.stringify(request)
                }
            );
            await conn.commit(); // 提交事务
            console.info("提交到Mysql");
        } catch (e) {
            await conn.rollback(); // 一定记得捕获异常后回滚事务！！
            console.info("保存失败,事务回滚");
            throw e;
        }
    }


    /**
     * 保存到mysql数据库的订单表 j_order
     * @param ctx
     * @returns {Promise<void>}
     */
    async saveOrderTable(ctx) {
        console.info("进入Mysql订单保存");
        const conn = await this.app.mysql.beginTransaction();
        let orderId = ctx._id;
        let sex = 0;
        if (parameter.target.sex) {
            sex = 1;
        }
        let phone = null;
        /**
         'target_current_address': ctx.target.currentAddress,
         'target_sex': sex,
         'older_id': ctx.target._id.toString(),
         */
        let target_name = null;
        let target_identityNumber = null;
        let target_current_address = null;
        let older_id = null;
        if (ctx.target !== undefined) {
            if (ctx.target.phone !== "无" || ctx.target.phone !== undefined) {
                phone = ctx.target.phone;
            }
            if (ctx.target.name !== undefined) {
                target_name = ctx.target.name;
            }
            if (ctx.target.identityNumber !== undefined) {
                target_identityNumber = ctx.target.identityNumber.toString();
            }
            if (ctx.target.currentAddress !== undefined) {
                target_current_address = ctx.target.currentAddress;
            }
            if (ctx.target._id !== undefined) {
                older_id = ctx.target._id.toString();
            }
        }

        let community_name = null;
        let community_id = null;

        if (ctx.community !== undefined) {
            community_name = ctx.community.name;
            community_id = ctx.community._id.toString();
        }

        let ancestors_street_adcode = null;
        let ancestors_street_name = null;
        let ancestors_city_adcode = null;
        let ancestors_city_name = null;
        let ancestors_province_adcode = null;
        let ancestors_province_name = null;
        let ancestors_district_name = null;
        let ancestors_district_adcode = null;
        if (ctx.district !== undefined) {
            if (ctx.district.ancestors !== undefined) {
                ancestors_street_adcode = ctx.district.ancestors.streetAdCode
                ancestors_street_name = ctx.district.ancestors.street
                ancestors_city_adcode = ctx.district.ancestors.cityAdCode
                ancestors_city_name = ctx.district.ancestors.city
                ancestors_province_adcode = ctx.district.ancestors.provinceAdCode
                ancestors_province_name = ctx.district.ancestors.province
                ancestors_district_name = ctx.district.ancestors.district
                ancestors_district_adcode = ctx.district.ancestors.districtAdCode
            }
        }
        let district_adcode = null;
        let district_level = null;
        let district_name = null;
        let district_parent_adcode = null;
        if (ctx.district !== undefined) {
            if (ctx.district.adcode !== undefined) {
                district_adcode = ctx.district.adcode
            }

            if (ctx.district.level !== undefined) {
                district_level = ctx.district.level
            }

            if (ctx.district.name !== undefined) {
                district_name = ctx.district.name
            }

            if (ctx.district.parentAdcode !== undefined) {
                district_parent_adcode = ctx.district.parentAdcode
            }
        }

        let servicer_id = null;
        let provider_name = null;
        let category = null;
        let actor_id = null;
        let actor_name = null;
        let book_user_name = null;
        let book_user_phone = null;

        if (ctx.provider !== undefined) {
            provider_name = ctx.provider.name;
            if (ctx.provider._id !== undefined) {
                servicer_id = ctx.provider._id.toString()
            }
        }
        if (ctx.bookUser !== undefined) {
            book_user_name = ctx.bookUser.name;
            book_user_phone = ctx.bookUser.phone;
        }
        if (ctx.actor !== undefined) {
            actor_id = ctx.actor._id;
            actor_name = ctx.actor.name;
        }
        if (ctx.category !== undefined && ctx.category.length !== 0) {
            this.ctx.logger.info("错误打印" + JSON.stringify(ctx.category));
            category = ctx.category;
        }
        let img_num = 0;
        if (ctx.images !== undefined) {
            img_num = ctx.images.length;
        }
        let created = null;
        if (ctx.created !== undefined && ctx.created !== null)
            created = ctx.created.toString();

        console.info("district_adcode长度" + district_adcode);

        try {
            await conn.insert('j_order',
                {
                    'id': mongoose.Types.ObjectId().toString(),
                    'order_id': orderId,
                    'serial_number': ctx.serialNumber,
                    'community_name': community_name,
                    'community_id': community_id,
                    'organization_id': ctx.organization._id,
                    'organization_name': ctx.organization.name,
                    'older_id': older_id,
                    'target_name': target_name,
                    'target_identityNumber': target_identityNumber,
                    'target_phone': phone,
                    'target_current_address': target_current_address,
                    'target_sex': sex,
                    'servicer_id': servicer_id,
                    'provider_name': provider_name,
                    'service_date': ctx.serviceDate,
                    'finish_date': ctx.finishDate,
                    'status': ctx.status.toString(),
                    'evaluation': ctx.evaluation,
                    'created': created, //太长
                    'updated': ctx.updated, //保存的时候没有这个字段 提前tostring要判断
                    'contract_id': ctx.project._id.toString(),
                    'project_name': ctx.project.name,
                    'district_adcode': district_adcode,
                    'district_level': district_level,
                    'district_name': district_name,
                    'district_parent_adcode': district_parent_adcode,
                    'ancestors_street_adcode': ancestors_street_adcode,
                    'ancestors_street_name': ancestors_street_name,
                    'ancestors_district_adcode': ancestors_district_adcode,
                    'ancestors_district_name': ancestors_district_name,
                    'ancestors_city_adcode': ancestors_city_adcode,
                    'ancestors_city_name': ancestors_city_name,
                    'ancestors_province_adcode': ancestors_province_adcode,
                    'ancestors_province_name': ancestors_province_name,
                    'image_num': img_num,
                }
            );
            for (let i = 0; i < ctx.service.length; i++) {
                console.info("开始处理服务项目");
                await conn.insert('j_service',
                    {
                        'id': mongoose.Types.ObjectId().toString(),
                        'order_id': orderId,
                        'service_id': ctx.service[i]._id.toString(),
                        'service_name': ctx.service[i].name,
                        'service_count': ctx.service[i].price.count,
                        'service_unit_price': ctx.service[i].price.unitPrice,
                        'service_value': ctx.service[i].price.value,
                        'service_category_unit': ctx.service[i].price.categoryUnit,
                        'service_category': ctx.service[i].price.category
                    }
                );
            }
            for (let i = 0; i < ctx.images.length; i++) {
                console.info("开始处理图片");
                await conn.insert('j_order_image',
                    {
                        'order_id': ctx._id,
                        'img_path': null,
                        'img_name': ctx.images[i],
                        'server': null,
                    }
                )
            }
            await conn.commit(); // 提交事务
            console.info("提交到Mysql");
        } catch (e) {
            await conn.rollback(); // 一定记得捕获异常后回滚事务！！
            console.info("保存失败,事务回滚");
            throw e;
        }
    }

    /**
     * 删除mysql数据库的订单数据,关联的也删除
     * @param _id 订单ID
     * @returns {Promise<void>}
     */
    async dellOderData(_id) {
        const conn = await this.app.mysql.beginTransaction();
        console.info("开始执行关联删除");
        try {
            await conn.delete('j_order', {
                order_id: _id
            });
            await conn.delete('j_service', {
                order_id: _id
            });
            await conn.delete('j_order_image', {
                order_id: _id
            });
            await conn.commit();
            console.info("完成删除")
        } catch (err) {
            await conn.rollback(); // 一定记得捕获异常后回滚事务！！
            console.info("删除失败,出现异常,事务回滚");
            throw err;
        }
    }

    async updateOrderData(_id, ctx) {
        console.info("进入更新方法,先触发删除操作");
        await this.dellOderData(_id);
        console.info("触发mysql更新,直接触发重新保存");
        this.saveOrderTable(ctx);
    }

    async getTime() {
        let date = new Date();
        let seperator1 = "-";
        let seperator2 = ":";
        let month = date.getMonth() + 1;
        let strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        let currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes()
            + seperator2 + date.getSeconds();
        return currentdate;
    }

}

module.exports = MysqlService;