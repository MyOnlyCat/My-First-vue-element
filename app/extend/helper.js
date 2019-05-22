'use strict';
const crypto = require('crypto');
const moment = require('moment');
const Big = require('big.js');
const VALIDATOR = Symbol('Helpers#validator');

module.exports = {
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    md5(str) {
        const md5 = crypto.createHash('md5');
        return md5.update(str).digest('hex');
    },
    toFloat(v, fixedLength = 2) {
        return Number.parseFloat(new Big(v).toFixed(fixedLength));
    },
    toInteger(v, fixedLength = 0) {
        if (v === 0) {
            return 0;
        } else {
            return Number.parseFloat(new Big(v).toFixed(fixedLength));
        }
    },
    isNumber(value) {
        const patrn = /^(-)?\d+(\.\d+)?$/;
        if (patrn.exec(value) == null || value == "") {
            return false
        } else {
            return true
        }
    },

    getMillisecond(time) {
        return moment(time).valueOf();
    },
    formatDate(time, style = 'YYYY-MM-DD') {
        if (!time) {
            return;
        }
        return moment(time).format(style);
    },
    getNameSuffix(name) {
        const filenames = name.split('.');
        if (filenames.length > 1) {
            const suffix = filenames[filenames.length - 1];
            return suffix;
        }
    },
    validator() {
        if (this[VALIDATOR]) {
            // 例如，从 header 中获取，实际情况肯定更复杂
            return this[VALIDATOR];
        }
        const validator = {
            toString(str) {
                if (str) {
                    return str;
                }
                return '';
            },
            identityCodeValid(code) {
                // 身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X
                const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
                if (reg.test(validator.toString(code)) === false) {
                    return false;
                }
                return true;
            },
        };

        this[VALIDATOR] = validator;
        return this[VALIDATOR];
    },

    /**
     * 获取时间查询条件
     * @param type 0 : 查询前一天的; 1 查询上一周的 :  2 : 查询上个月 3: 查询今日的 4: 比如今天8月14 就查询 7月14 到 8月14
     * @returns {Promise<{$gte: number, $lte: number}>}
     */
    async getQueryTime(type, field) {
        var query;
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        if (month < 10) {
            month = "0" + month;
        }
        if (day < 10) {
            day = "0" + day;
        }
        var beforeDayStar = year + "-" + month + "-" + day + " 0:0:0";
        var beforeDayEnd = year + "-" + month + "-" + day + " 24:0:0";
        //周报
        if (type === 1) {
            query = {$gte: new Date(beforeDayStar).getTime() - 604800000, $lte: new Date(beforeDayEnd).getTime()}
        }
        //日报时间周期
        if (type === 0) {
            //"created":{"$gte":1501516800000,"$lte":1564588800000}
            query = {
                $gte: new Date(beforeDayStar).getTime() - 86400000,
                $lte: new Date(beforeDayEnd).getTime() - 86400000
            };
        }
        //日报时间周期 自定字段
        if (type === 5) {
            //"created":{"$gte":1501516800000,"$lte":1564588800000}
            query = {
                [field]: {
                    $gte: new Date(beforeDayStar).getTime() - 86400000,
                    $lte: new Date(beforeDayEnd).getTime() - 86400000
                }
            };
        }

        //前日时间 自定字段
        if (type === 10) {
            //"created":{"$gte":1501516800000,"$lte":1564588800000}
            query = {
                [field]: {
                    $gte: new Date(beforeDayStar).getTime() - (86400000 * 2),
                    $lte: new Date(beforeDayEnd).getTime() - (86400000 * 2)
                }
            };
        }
        //月报时间周期
        if (type === 2) {
            var newMonth;
            var newYear;
            if (month === "01") {
                newMonth = 12;
                newYear = year - 1;
            } else {
                newMonth = month - 1;
                newYear = year;
            }
            var monthStar = newYear + "-" + newMonth + "-" + "01";
            var monthEnd = year + "-" + month + "-" + "01" + " 24:0:0";
            query = {
                $gte: new Date(monthStar).getTime(),
                $lte: new Date(monthEnd).getTime()
            };
        }

        //上月自定字段
        if (type === 8) {
            var newMonth;
            var newYear;
            if (month === "01") {
                newMonth = 12;
                newYear = year - 1;
            } else {
                newMonth = month - 1;
                newYear = year;
            }
            var monthStar = newYear + "-" + newMonth + "-" + "01";
            var monthEnd = year + "-" + month + "-" + "01" + " 24:0:0";
            query = {
                [field]: {
                    $gte: new Date(monthStar).getTime(),
                    $lte: new Date(monthEnd).getTime()
                }
            };
        }

        if (type === 3) {
            query = {
                $gte: new Date(beforeDayStar).getTime(),
                $lte: new Date(beforeDayEnd).getTime()
            };
        }

        //自定字段
        if (type === 6) {
            query = {
                [field]: {
                    $gte: new Date(beforeDayStar).getTime(),
                    $lte: new Date(beforeDayEnd).getTime()
                }
            };
        }

        if (type === 4) {
            query = {
                $gte: new Date(beforeDayStar).getTime() - 2592000000,
                $lte: new Date(beforeDayEnd).getTime()
            };
        }
        //上月自定
        if (type === 7) {
            query = {
                [field]: {
                    $gte: new Date(beforeDayStar).getTime() - 2592000000,
                    $lte: new Date(beforeDayEnd).getTime()
                }
            };
        }

        //本月到现在的时间自定字段
        if (type === 9) {
            var beforeDayStar = year + "-" + month + "-" + "01" + " 0:0:0";
            var beforeDayEnd = year + "-" + month + "-" + day + " 24:0:0";
            query = {
                [field]: {
                    $gte: new Date(beforeDayStar).getTime(),
                    $lte: new Date(beforeDayEnd).getTime()
                }
            }
        }
        return query;
    },
    /**
     * 计算百分比
     * @param num
     * @param total 总数
     * @returns {Promise<*>}
     */
    async getPercent(num, total) {
        if (isNaN(num) || isNaN(total)) {
            return "-";
        }
        return total <= 0 ? "0" : (Math.round(num / total * 10000) / 100.00);
    }

};
