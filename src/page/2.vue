<template>
  <el-tabs v-model="activeName" @tab-click="handleClick">
    <el-tab-pane label="订单导出" name="first">


      <el-form label-position="top" status-icon :rules="rules" ref="form" :model="form" label-width="6%">

      <!--  11      -->
        <addressSelect :form="form"></addressSelect>
        <el-form-item label="服务人员选择">
          <el-input placeholder="请选择服务人员" :readonly=true v-model="form.name"
                    @click.native="changeDialogTableVisibleStatus"></el-input>
        </el-form-item>
        <userSelect ref="userSelect" @watchChild="SelectTheUser"></userSelect>
        <el-divider><i class="el-icon-setting">  其它信息选择</i></el-divider>
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
  import userSelect from "../components/UserSelection"
  export default {
    components: {addressSelect,userSelect},
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

          },{
            text: '所有',
            onClick(picker) {
              picker.$emit('pick', []);
            }
          }]
        },
        time: '',
        // 时间选择器数据结束

        //
        activeName: 'first',

        userInfo: {
          name: '',
          id: ''
        },

        form: {
          region: '',
          cityAdCode: '',
          districtCode: '',
          streetAdCode: '',
          villageAdcode: '',
          date1: '',
          date2: '',
          name:'',
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
      changeDialogTableVisibleStatus() {
        this.$refs.userSelect.dialogTableVisible=true
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

      SelectTheUser(rowInfo) {
        console.log(rowInfo)
        // 赋值给全局量
        this.userInfo.name = rowInfo.name;
        this.userInfo.id = rowInfo.id;
        // 给输入框展示
        this.form.name = this.userInfo.name;
        // 关闭Dialog
        this.$refs.userSelect.dialogTableVisible=false
      },
      //-------------------------------------------
    }
  };
</script>
