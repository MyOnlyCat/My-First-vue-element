<template>
  <div>
    <template>
      <el-select v-model="provinceCode" filterable disabled placeholder="请选择省" @change="changeCity"></el-select>
      <el-select v-model="cityAdCode" filterable clearable placeholder="请选择市" @change="changeCity">
        <el-option
          v-for="item in cityModel"
          :key="item.adcode"
          :label="item.name"
          :value="item.adcode">
        </el-option>
      </el-select>
      <el-select v-model="districtCode" filterable clearable placeholder="请选择区" @change="changeDistrict">
        <el-option
          v-for="item in districtModel"
          :key="item.adcode"
          :label="item.name"
          :value="item.adcode">
        </el-option>
      </el-select>
      <el-select v-model="streetAdCode" filterable clearable placeholder="请选择镇(街道)" @change="changeStreet">
        <el-option
          v-for="item in streetModel"
          :key="item.adcode"
          :label="item.name"
          :value="item.adcode">
        </el-option>
      </el-select>
      <el-select v-model="villageAdcode" filterable clearable placeholder="请选择社区(村)">
        <el-option
          v-for="item in villageModel"
          :key="item.adcode"
          :label="item.name"
          :value="item.adcode">
        </el-option>
      </el-select>
    </template>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        // 下拉数据开始
        provinceCode:'四川省',
        cityModel: '',
        cityAdCode: '',
        districtModel: '',
        districtCode: '',
        streetModel: '',
        streetAdCode: '',
        villageModel: '',
        villageAdcode: '',
        // 下拉数据结束
      }
    },
    methods: {
      changeCity() {
        this.districtCode = null;
        this.districtModel = null;
        this.streetAdCode = null;
        this.streetModel = null;
        this.villageAdcode = null;
        this.villageModel = null;
        this.$http.get("/api/initAddressCode" + "/" + 0 + "/" + this.cityAdCode).then(res => {
          this.districtModel = res.data.data;
        })
      },
      changeDistrict() {
        this.streetAdCode = null;
        this.streetAdCode = null;
        this.villageAdcode = null;
        this.villageModel = null;
        this.$http.get("/api/initAddressCode" + "/" + 0 + "/" + this.districtCode).then(res => {
          this.streetModel = res.data.data;
        })
      },
      changeStreet() {
        this.villageAdcode = null;
        this.villageModel = null;
        this.$http.get("/api/initAddressCode" + "/" + 0 + "/" + this.streetAdCode).then(res => {
          this.villageModel = res.data.data;
        })
      },
      // 初始化市
      initAddress() {
        this.$http.get("/api/initAddressCode" + "/" + 1 + "/" + 0).then(res => {
          this.cityModel = res.data.data;
        })
      }
    },
    // 页面加载完成调用初始化
    created: function () {
      this.initAddress();
    }
  }
</script>
