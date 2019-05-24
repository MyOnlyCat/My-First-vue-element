<template>
    <div class="address-select">
      <el-row :gutter="40">
        <el-divider><i class="el-icon-location">  位置选择</i></el-divider>
        <el-col :span="4.8" >
          <el-form-item label="请选择省:">
            <el-select v-model="provinceCode" filterable disabled placeholder="请选择省"></el-select>
          </el-form-item>
        </el-col>

        <el-col :span="4.8">
          <el-form-item label="请选择市:" prop="cityAdCode">
            <el-select v-model="form.cityAdCode" filterable clearable placeholder="请选择市" @change="changeCity">
              <el-option
                v-for="item in cityModel"
                :key="item.adcode"
                :label="item.name"
                :value="item.adcode">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="4.8">
          <el-form-item label="请选择区:">
            <el-select v-model="form.districtCode" filterable clearable placeholder="请选择区" @change="changeDistrict">
              <el-option
                v-for="item in districtModel"
                :key="item.adcode"
                :label="item.name"
                :value="item.adcode">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="4.8">
          <el-form-item label="请选择镇(街道):">
            <el-select v-model="form.streetAdCode" filterable clearable placeholder="请选择镇(街道)" @change="changeStreet">
              <el-option
                v-for="item in streetModel"
                :key="item.adcode"
                :label="item.name"
                :value="item.adcode">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="4.8">
          <el-form-item label="请选择社区(村):">
            <el-select v-model="form.villageAdcode" filterable clearable placeholder="请选择社区(村)" @change="changeVillage">
              <el-option
                v-for="item in villageModel"
                :key="item.adcode"
                :label="item.name"
                :value="item.adcode">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

      </el-row>
    </div>
</template>

<script>
  export default {
    name: 'AddressSelect',
    props: {
      form: '',
    },
    data() {
      return {
        // 下拉数据开始
        provinceCode: '四川省',
        cityModel: '',
        districtModel: '',
        streetModel: '',
        villageModel: '',
        // 下拉数据结束
        // 定位下拉框选择到哪一级开始
        locationAddressStatus: '',
        // 定位下拉框选择到哪一级结束
      }
    },
    methods: {
      //-------------------------------------------
      changeCity() {
        this.form.districtCode = null;
        this.districtModel = null;
        this.form.streetAdCode = null;
        this.streetModel = null;
        this.form.villageAdcode = null;
        this.villageModel = null;
        this.$http.get('/api/initAddressCode' + '/' + 0 + '/' + this.form.cityAdCode)
          .then(res => {
            this.districtModel = res.data.data;
            // 这里需要判断用户清空的情况保证准确定位选择的位置
            if (this.form.cityAdCode === null) {
              this.locationAddressStatus = null;
              console.log('清空 市 定位为 null');
            } else {
              this.locationAddressStatus = 'district.ancestors.cityAdCode';
              console.log('目前选择到 市 条件为: ' + this.locationAddressStatus);
            }
          });
      },
      changeDistrict() {
        this.form.streetAdCode = null;
        this.form.streetAdCode = null;
        this.form.villageAdcode = null;
        this.villageModel = null;
        this.$http.get('/api/initAddressCode' + '/' + 0 + '/' + this.form.districtCode)
          .then(res => {
            this.streetModel = res.data.data;
            if (this.form.districtCode === null) {
              this.locationAddressStatus = 'district.ancestors.cityAdCode';
              console.log('清空 区 定位为 跳转为上一级 定位到 市 条件为' + this.locationAddressStatus);
            } else {
              this.locationAddressStatus = 'district.ancestors.districtAdCode';
              console.log('目前选择到 区 条件为: ' + this.locationAddressStatus);
            }
          });
      },
      changeStreet() {
        this.form.villageAdcode = null;
        this.villageModel = null;
        this.$http.get('/api/initAddressCode' + '/' + 0 + '/' + this.form.streetAdCode)
          .then(res => {
            this.villageModel = res.data.data;

            if (this.form.streetAdCode === null) {
              this.locationAddressStatus = 'district.ancestors.districtAdCode';
              console.log('清空 镇/街道 定位为 跳转为上一级 定位到 区 条件为' + this.locationAddressStatus);
            } else {
              this.locationAddressStatus = 'district.ancestors.streetAdCode';
              console.log('目前选择到 镇/街道 条件为: ' + this.locationAddressStatus);
            }
          });
      },
      changeVillage() {
        if (this.form.villageAdcode === null) {
          this.locationAddressStatus = 'district.ancestors.streetAdCode';
          console.log('清空 社区/村 定位为 跳转为上一级 定位到 镇/街道 条件为' + this.locationAddressStatus);
        } else {
          this.locationAddressStatus = 'district.adcode';
          console.log('目前选择到 社区/村 条件为: ' + this.locationAddressStatus);
        }
      },
      // 初始化市
      initAddress() {
        this.$http.get('/api/initAddressCode' + '/' + 1 + '/' + 0)
          .then(res => {
            this.cityModel = res.data.data;
          });
      }
    },
    // 页面加载完成调用初始化
    created: function() {
      this.initAddress();
    }
  };
</script>

<style scoped>

</style>
