<template>
  <el-tabs v-model="activeName" @tab-click="handleClick">
    <el-tab-pane label="订单导出" name="first">


      <el-form label-position="left" status-icon :rules="rules" ref="form" :model="form" label-width="6%">
        <el-form-item label="请选择省:" >
        <!--  ---------------------------------------------------------------------    -->
        <el-select v-model="provinceCode" filterable disabled placeholder="请选择省"></el-select>
        </el-form-item>

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

        <el-form-item label="请选择区:" >
        <el-select v-model="form.districtCode" filterable clearable placeholder="请选择区" @change="changeDistrict">
          <el-option
            v-for="item in districtModel"
            :key="item.adcode"
            :label="item.name"
            :value="item.adcode">
          </el-option>
        </el-select>
        </el-form-item>

        <el-form-item label="请选择镇(街道):" >
        <el-select v-model="form.streetAdCode" filterable clearable placeholder="请选择镇(街道)" @change="changeStreet">
          <el-option
            v-for="item in streetModel"
            :key="item.adcode"
            :label="item.name"
            :value="item.adcode">
          </el-option>
        </el-select>
        </el-form-item>

        <el-form-item label="请选择社区(村):" >
        <el-select v-model="form.villageAdcode" filterable clearable placeholder="请选择社区(村)" @change="changeVillage">
          <el-option
            v-for="item in villageModel"
            :key="item.adcode"
            :label="item.name"
            :value="item.adcode">
          </el-option>
        </el-select>
        </el-form-item>

        <el-form-item label="导出开始时间" >
            <el-form-item prop="date1">
              <el-date-picker type="date" placeholder="选择开始日期" v-model="form.date1" ></el-date-picker>
            </el-form-item>
        </el-form-item>

        <el-form-item label="导出结束时间">
            <el-form-item prop="date2">
              <el-date-picker type="date" placeholder="选择结束时间" v-model="form.date2" ></el-date-picker>
            </el-form-item>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit('form')">立即导出</el-button>
          <el-button>取消</el-button>
        </el-form-item>
      </el-form>

    </el-tab-pane>


    <el-tab-pane label="随机时间批量派单" name="second">配置管理</el-tab-pane>
    <el-tab-pane label="指定时间批量派单" name="third">角色管理</el-tab-pane>
    <el-tab-pane label="异常价格订单查询" name="fourth">定时任务补偿</el-tab-pane>
  </el-tabs>
</template>
<script>
  export default {
    data() {
      const checkDate1 = (rule, value, callback) => {
        if (!value) {
          return callback(new Error("开始时间不能为空"))
        } else {
          callback()
        }
      };
      const checkDate2 = (rule, value, callback) => {
        if (!value) {
          return callback(new Error("结束时间不能为空"))
        }
        setTimeout(() => {
          const start = new Date(this.form.date1).getTime();
          const end = new Date(this.form.date2).getTime();
          if (start > end) {
            callback(new Error("请选择正确的时间范围"))
          } else {
            callback()
          }
        })
      };
      return {

        // 下拉数据开始
        provinceCode:'四川省',
        cityModel: '',
        districtModel: '',
        streetModel: '',
        villageModel: '',
        // 下拉数据结束

        // 定位下拉框选择到哪一级开始
        locationAddressStatus: '',
        // 定位下拉框选择到哪一级结束

        activeName: 'first',
        form: {
          region:'',
          cityAdCode: '',
          districtCode: '',
          streetAdCode: '',
          villageAdcode: '',
          date1: '',
          date2: '',

        },
        rules: {
          cityAdCode: [{ required: true, message: '请选择导出范围', trigger: 'change' }],
          date1: [{ validator: checkDate1, trigger: 'blur'}],
          date2: [{validator: checkDate2, trigger: 'blur'}],
        }
      };
    },
    methods: {
      handleClick(tab, event) {
        console.log(tab, event);
      },

      onSubmit(form) {
        this.$refs[form].validate((valid) => {
          if (valid) {
            alert('submit!');
            this.$http.post("/api/xixi",this.form).then(res =>{
              console.log(1)
            })
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },

      //-------------------------------------------
      changeCity() {
        this.form.districtCode = null;
        this.districtModel = null;
        this.form.streetAdCode = null;
        this.streetModel = null;
        this.form.villageAdcode = null;
        this.villageModel = null;
        this.$http.get("/api/initAddressCode" + "/" + 0 + "/" + this.form.cityAdCode).then(res => {
          this.districtModel = res.data.data;
          // 这里需要判断用户清空的情况保证准确定位选择的位置
          if (this.form.cityAdCode === null) {
            this.locationAddressStatus = null;
            console.log("清空 市 定位为 null");
          } else {
            this.locationAddressStatus = "district.ancestors.cityAdCode";
            console.log("目前选择到 市 条件为: " + this.locationAddressStatus);
          }
        })
      },
      changeDistrict() {
        this.form.streetAdCode = null;
        this.form.streetAdCode = null;
        this.form.villageAdcode = null;
        this.villageModel = null;
        this.$http.get("/api/initAddressCode" + "/" + 0 + "/" + this.form.districtCode).then(res => {
          this.streetModel = res.data.data;
          if (this.form.districtCode === null) {
            this.locationAddressStatus = "district.ancestors.cityAdCode";
            console.log("清空 区 定位为 跳转为上一级 定位到 市 条件为" + this.locationAddressStatus);
          } else {
            this.locationAddressStatus = "district.ancestors.districtAdCode";
            console.log("目前选择到 区 条件为: " + this.locationAddressStatus);
          }
        })
      },
      changeStreet() {
        this.form.villageAdcode = null;
        this.villageModel = null;
        this.$http.get("/api/initAddressCode" + "/" + 0 + "/" + this.form.streetAdCode).then(res => {
          this.villageModel = res.data.data;

          if (this.form.streetAdCode === null) {
            this.locationAddressStatus = "district.ancestors.districtAdCode";
            console.log("清空 镇/街道 定位为 跳转为上一级 定位到 区 条件为" + this.locationAddressStatus);
          } else {
            this.locationAddressStatus = "district.ancestors.streetAdCode";
            console.log("目前选择到 镇/街道 条件为: " + this.locationAddressStatus);
          }
        })
      },
      changeVillage() {
        if (this.form.villageAdcode === null) {
          this.locationAddressStatus = "district.ancestors.streetAdCode";
          console.log("清空 社区/村 定位为 跳转为上一级 定位到 镇/街道 条件为" + this.locationAddressStatus);
        } else {
          this.locationAddressStatus = "district.adcode";
          console.log("目前选择到 社区/村 条件为: " + this.locationAddressStatus);
        }
      },
      // 初始化市
      initAddress() {
        this.$http.get("/api/initAddressCode" + "/" + 1 + "/" + 0).then(res => {
          this.cityModel = res.data.data;
        })
      }
      //-------------------------------------------
    },
    // 页面加载完成调用初始化
    created: function () {
      this.initAddress();
    }
  };
</script>
