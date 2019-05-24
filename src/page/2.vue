<template>
  <el-tabs v-model="activeName" @tab-click="handleClick">
    <el-tab-pane label="订单导出" name="first">


      <el-form label-position="top" status-icon :rules="rules" ref="form" :model="form" label-width="6%">

      <!--  11      -->
        <addressSelect :form="form"></addressSelect>
        <el-divider><i class="el-icon-setting">  其它信息选择</i></el-divider>

        <el-form-item label="服务人员选择">
          <el-input placeholder="请选择服务人员" v-model="form.name" @click.native="dialogTableVisible=true"></el-input>
        </el-form-item>
        <el-dialog center title="服务人员搜索" :visible.sync="dialogTableVisible">
          <div class="serachUser">
            <el-input size="medium" placeholder="请输入内容" v-model="input3" class="input-with-select">
              <el-select v-model="select" slot="prepend" placeholder="搜索条件选择">
                <el-option label="服务人员姓名" value="name"></el-option>
                <el-option label="服务人员电话" value="phone"></el-option>
                <el-option label="服务人员身份证" value="identityNumber"></el-option>
              </el-select>
              <el-button slot="append" icon="el-icon-search" @click.native="serachUser(select, input3)"></el-button>
            </el-input>
          </div>
          <el-table :data="gridData">
            <el-table-column property="name" label="姓名" width="80"></el-table-column>
            <el-table-column property="phone" label="电话" width="250"></el-table-column>
            <el-table-column property="identityNumber" label="身份证" width="250"></el-table-column>
            <el-table-column property="address" label="地址" width="250"></el-table-column>
            <el-table-column label="选择"><el-button type="primary" icon="el-icon-check" circle></el-button></el-table-column>
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
  import addressSelect from "../components/AddressSelect"
  export default {
    components: {addressSelect},
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

          },{
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

        //
        input3: '',
        select: '',

        // 分页数据开始
        pageSize: 5,
        totalSize: 0,
        startPageNumber: 1,
        showStatus: true,
        // 分页数据结束





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


      serachUser(select,input3) {
        const params ={
          'selectType': select,
          'selectParam': input3,
          'pageNumber': this.startPageNumber,
          'pageSize': this.pageSize,
        };
        this.$http.post('/api/searchUsers',params)
          .then(res => {
            this.gridData = [];
            this.select = select;
            this.input3 = input3;
            this.gridData = res.data.data.userInfoList;
            this.totalSize = res.data.data.count;
            if (this.totalSize > this.pageSize) {
              this.showStatus = false;
            } else {
              this.showStatus = true;
            }
          });
      },
      handleCurrentChange(val) {
        console.log("当前页-" + val);
        const params ={
          'selectType': this.select,
          'selectParam': this.input3,
          'pageNumber': val,
          'pageSize': this.pageSize,
        };
        this.$http.post('/api/searchUsers',params)
          .then(res => {
            this.gridData = [];
            this.gridData = res.data.data.userInfoList;
            this.totalSize = res.data.data.count;
            if (this.totalSize > this.pageSize) {
              this.showStatus = false;
            } else {
              this.showStatus = true;
            }
          });
      },
      //-------------------------------------------
    }
  };
</script>
