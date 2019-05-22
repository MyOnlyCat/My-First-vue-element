'use strict';

module.exports = {
  async getConstant(ctx, sectionId, key, name) {
    if (!this[sectionId]) {
      this[sectionId] = {};
    }
    const results = this[sectionId];
    let result;
    if (!results[key]) {
      console.log(`getConstant key ${JSON.stringify(Object.keys(ctx))}`);
      result = await ctx.service.codes.findOne({ 'section._id': sectionId, key }).then(r => {
        results[key] = r;
        return r;
      });
    } else {
      result = results[key];
    }
    return result;
  },

  async getConstantValue(ctx, sectionId, key, name) {
    const result = await this.getConstant(ctx, sectionId, key);
    return result.value.find(v => v.name == name).value;
  },
};
