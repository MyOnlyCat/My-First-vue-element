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

        <el-form-item label="服务人员选择">
          <el-input placeholder="请选择服务人员" readonly=true v-model="form.name" @click.native="dialogTableVisible=true"></el-input>
        </el-form-item>
        <el-dialog center title="服务人员搜索" :visible.sync="dialogTableVisible">
          <div class="serachUser">
            <el-input size="medium" placeholder="请输入内容" v-model="selectInput" @keyup.enter.native="serachUser(selectType, selectInput)" class="input-with-select">
              <el-select v-model="selectType" slot="prepend" placeholder="搜索条件选择">
                <el-option label="服务人员姓名" value="name"></el-option>
                <el-option label="服务人员电话" value="phone"></el-option>
                <el-option label="服务人员身份证" value="identityNumber"></el-option>
              </el-select>
              <el-button slot="append" icon="el-icon-search" @click.native="serachUser(selectType, selectInput)"></el-button>
            </el-input>
          </div>
          <el-table :data="gridData" v-loading="loadingTable" element-loading-text="拼命加载中">
            <el-table-column property="name" label="姓名" width="80"></el-table-column>
            <el-table-column property="phone" label="电话" width="200"></el-table-column>
            <el-table-column property="identityNumber" label="身份证" width="250"></el-table-column>
            <el-table-column property="address" label="地址" width="250"></el-table-column>
            <el-table-column label="选择">
              <template slot-scope="scope">
              <el-button size="mini" @click.native="SelectTheUser(scope.row)">选中</el-button>
              </template>
            </el-table-column>
          </el-table>
          <!-- @size-change 每页大小变化     @current-change  页数变化  :current-page.sync 默认选择第几页 -->
          <!--          @current-change="handleCurrentChange"-->
          <div class="block" align="center">
            <el-pagination
              layout="prev, pager, next"
              @current-change="handleCurrentChange"
              :current-page.sync="startPageNumber"
              :page-size="pageSize"
              :total="totalSize"
              :hide-on-single-page="showStatus">
            </el-pagination>
          </div>

        </el-dialog>

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
  export default {
    data() {
      return {

        gridData: [],

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

        // dialog状态数据开始
        dialogTableVisible: false,
        // dialog状态数据结束

        // 加载遮罩开始(默认不遮盖)
        loadingTable: false,
        // 加载遮罩结束(默认不遮盖)

        //搜索框内容选择以及内容输入开始
        selectInput: '',
        selectType: '',
        //搜索框内容选择以及内容输入结束

        // 分页数据开始
        pageSize: 5,
        totalSize: 0,
        startPageNumber: 1,
        showStatus: true,
        // 分页数据结束

        //分页数据选中
        userInfo: {
          name: '',
          id: ''
        },

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

      SelectTheUser(rowInfo) {
        // 赋值给全局量
        this.userInfo.name = rowInfo.name;
        this.userInfo.id = rowInfo.id;
        // 给输入框展示
        this.form.name = this.userInfo.name;
        // 关闭Dialog
        this.dialogTableVisible = false;
      },

      /**
       *  搜索检查条件
       * @param selectType
       * @param selectInput
       * @returns {boolean}
       */
      check(selectType, selectInput) {
        console.log(selectType);
        if (selectType === '' && selectInput === '') {
          this.$message({
            message: '请选择查询条件!',
            center: true,
            type: 'error'
          });
          return false
        } else if (selectType === '' || selectType === null) {
          this.$message({
            message: '请选择查询条件!',
            center: true,
            type: 'error'
          });
          return false
        } else if (selectInput === '' || selectInput === null) {
          this.$message({
            message: '请输入查询内容!',
            center: true,
            type: 'error'
          });
          return false
        } else {
          return true
        }
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
      serachUser(selectType, selectInput) {
        const res = this.check(selectType, selectInput);

        if (res) {
          this.loadingTable = true;
          console.log("加载情况" + this.loadingTable);

          const params = {
            'selectType': selectType,
            'selectParam': selectInput,
            'pageNumber': this.startPageNumber,
            'pageSize': this.pageSize,
          };
          this.$http.post('/api/searchUsers', params)
            .then(res => {
              this.gridData = [];
              this.select = selectType;
              this.selectInput = selectInput;
              this.gridData = res.data.data.userInfoList;
              this.totalSize = res.data.data.count;
              this.loadingTable = false
            });
        } else {
          this.gridData = [];
          this.selectInput = '';
          this.totalSize = 0;
        }
      },
      handleCurrentChange(val) {
        const res = this.check(this.selectType, this.selectInput);
        if (res) {
          this.loadingTable = true;
          const params = {
            'selectType': this.selectType,
            'selectParam': this.selectInput,
            'pageNumber': val,
            'pageSize': this.pageSize,
          };
          this.$http.post('/api/searchUsers', params)
            .then(res => {
              this.gridData = [];
              this.gridData = res.data.data.userInfoList;
              this.totalSize = res.data.data.count;
              this.loadingTable = false;
            });
        } else {
          this.gridData = [];
          this.selectInput = '';
          this.totalSize = 0;
        }
      },
      //-------------------------------------------
    },
    // 页面加载完成调用初始化
    created: function() {
      this.initAddress();
    }
  };
</script>
