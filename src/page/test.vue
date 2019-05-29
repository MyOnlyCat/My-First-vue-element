<template>
  <el-tabs v-model="activeName" @tab-click="handleClick">
    <el-tab-pane label="订单导出" name="first">


      <el-form label-position="top" status-icon :rules="rules" ref="form" :model="form" label-width="6%">

        <el-row :gutter="40">
          <el-divider><i class="el-icon-location"> 位置选择</i></el-divider>
          <el-col :span="4.8">
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
              <el-select v-model="form.villageAdcode" filterable clearable placeholder="请选择社区(村)"
                         @change="changeVillage">
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
        <el-divider><i class="el-icon-setting"> 其它信息选择</i></el-divider>
        <el-row :gutter="40">
          <el-col :span="4.8">
            <el-form-item label="服务人员选择">
              <el-input placeholder="请选择服务人员" :readonly=true v-model="form.name" suffix-icon="el-icon-user"
                        @click.native="changeSelectUserDialogTableVisibleStatus"></el-input>
            </el-form-item>
            <!--
            这里引用子组件  ref="userSelect" 获取子组件的元素 使用 this.$refs.userSelect.  可调用修改子组件的属性
             @watchChild 监听子组件调用父组件,watchChild背子组件触发则调用父组件的 SelectTheUser方法
            -->
            <user-select ref="userSelect" @watchChild="SelectTheUser"></user-select>
          </el-col>

          <el-col :span="4.8">
            <el-form-item label="老人姓名">
              <el-input placeholder="请选择服务人员" :readonly=true v-model="form.oldManName" suffix-icon="el-icon-user"
                        @click.native="changeSelectOldManDialogTableVisibleStatus"></el-input>
            </el-form-item>
            <!--
            这里引用子组件  ref="userSelect" 获取子组件的元素 使用 this.$refs.userSelect.  可调用修改子组件的属性
             @watchChild 监听子组件调用父组件,watchChild背子组件触发则调用父组件的 SelectTheUser方法
            -->
            <oldMan-select ref="oldManSelect" @watchChild="SelectTheOldMan"></oldMan-select>
          </el-col>

        </el-row>

        <!-- Table -->
        <!--        <el-button type="text" @click="dialogTableVisible = true">打开嵌套表格的 Dialog</el-button>-->


        <el-form-item label="导出开始时间">
          <el-date-picker
            v-model="time"
            type="daterange"
            align="right"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :picker-options="pickerOptions">
          </el-date-picker>
        </el-form-item>


      </el-form>
    </el-tab-pane>


    <el-tab-pane label="随机时间批量派单" name="second">配置管理</el-tab-pane>
    <el-tab-pane label="指定时间批量派单" name="third">角色管理</el-tab-pane>
    <el-tab-pane label="异常价格订单查询" name="fourth">定时任务补偿</el-tab-pane>
  </el-tabs>
</template>

<style>
  .serachUser .el-select .el-input {
    width: 150px;
  }

  .serachUser .input-with-select .el-input-group__prepend {
    background-color: #fff;
  }
</style>

<script>
  import userSelect from "../components/UserSelection"
  import oldManSelect from "../components/OldManSelection"
  export default {
    components: {
      'user-select':userSelect,
      'oldMan-select': oldManSelect
    },
    data() {
      return {
        // 时间选择器数据开始
        pickerOptions: {
          shortcuts: [{
            text: '最近一周',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit('pick', [start, end]);
            }
          }, {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit('pick', [start, end]);
            }
          }, {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit('pick', [start, end]);
            },

          }, {
            text: '所有',
            onClick(picker) {
              picker.$emit('pick', []);
            }
          }]
        },
        time: '',
        // 时间选择器数据结束

        // 分页数据选中开始
        userInfo: {
          name: '',
          id: ''
        },
        // 分页数据选中结束

        // 老人信息开始
        oldManInfo: {
          name: '',
          id: ''
        },
        // 老人信息结束

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

        //
        activeName: 'first',
        form: {
          region: '',
          cityAdCode: '',
          districtCode: '',
          streetAdCode: '',
          villageAdcode: '',
          date1: '',
          date2: '',
          name: '',
          oldManName:'',
        },
        rules: {
          cityAdCode: [{ required: true, message: '请选择导出范围', trigger: 'change' }],
        }
      };
    },
    methods: {
      handleClick(tab, event) {
        console.log(tab, event);
      },

      /**
       *  通过$refs.userSelect 修改子组件的dialog显示状态
       */
      changeSelectUserDialogTableVisibleStatus() {
        this.$refs.userSelect.dialogTableVisible=true
      },

      changeSelectOldManDialogTableVisibleStatus() {
        this.$refs.oldManSelect.dialogTableVisible=true
      },

      /**
       * 负责处理子组件传过来的行信息
       * 修改dialog的显示状态
       * 赋值给 userInfo 方便保存以及传值
       * @param rowInfo 选中的行信息
       * @constructor
       */
      SelectTheUser(rowInfo) {
        // 赋值给全局量
        this.userInfo.name = rowInfo.name;
        this.userInfo.id = rowInfo.id;
        // 给输入框展示
        this.form.name = this.userInfo.name;
        // 关闭Dialog
        this.$refs.userSelect.dialogTableVisible = false;
      },

      /**
       * 负责处理子组件传过来的行信息
       * 修改dialog的显示状态
       * 赋值给 oldManInfo 方便保存以及传值
       * @param rowInfo 选中的行信息
       * @constructor
       */
      SelectTheOldMan(rowInfo) {
        // 赋值给全局量
        this.oldManInfo.name = rowInfo.name;
        this.oldManInfo.id = rowInfo.id;
        // 给输入框展示
        this.form.oldManName = this.oldManInfo.name;
        // 关闭Dialog
        this.$refs.oldManSelect.dialogTableVisible = false;
      },

      onSubmit(form) {
        this.$refs[form].validate((valid) => {
          if (valid) {
            alert('submit!');
            this.$http.post('/api/xixi', this.form)
              .then(res => {
                console.log(1);
              });
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
      },
      //-------------------------------------------
    },
    // 页面加载完成调用初始化
    created: function() {
      this.initAddress();
    }
  };
</script>
