<template>
  <el-tabs v-model="activeName" @tab-click="handleClick">
    <el-tab-pane label="订单导出" name="first">


      <el-form label-position="top" status-icon :rules="rules" ref="form" :model="form" label-width="6%">
        <el-divider><i class="el-icon-location"> 位置选择</i></el-divider>
        <address-select :form="form"></address-select>

        <el-divider><i class="el-icon-setting"> 其它信息选择</i></el-divider>
        <el-row :gutter="40">
          <el-col :span="4.8">
            <el-form-item label="服务人员选择:">
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
            <el-form-item label="老人选择:">
              <el-input placeholder="请选择服务人员" :readonly=true v-model="form.oldManName" suffix-icon="el-icon-user"
                        @click.native="changeSelectOldManDialogTableVisibleStatus"></el-input>
            </el-form-item>
            <!--
            这里引用子组件  ref="userSelect" 获取子组件的元素 使用 this.$refs.userSelect.  可调用修改子组件的属性
             @watchChild 监听子组件调用父组件,watchChild背子组件触发则调用父组件的 SelectTheUser方法
            -->
            <oldMan-select ref="oldManSelect" @watchChild="SelectTheOldMan"></oldMan-select>
          </el-col>

          <el-col :span="4.8">
            <el-form-item label="合同选择:">
              <project-select></project-select>
            </el-form-item>
          </el-col>

          <el-col :span="4.8">
            <el-form-item label="订单状态选择:">
              <el-select v-model="orderStatusValue" clearable placeholder="请选择">
                <el-option
                  v-for="item in orderStatus"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="4.8">
            <el-form-item label="时间区间选择:">
              <time-select></time-select>
            </el-form-item>
          </el-col>

        </el-row>
        <el-divider><i class="el-icon-download"> 下载信息配置</i></el-divider>
        <el-row :gutter="40">
          <el-col :span="4.8">
            <el-form-item label="下载用户信息填写(用于提取文件):">
              <el-input
                placeholder="请输入下载用户信息"
                v-model="input"
                clearable>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-button type="primary">下载<i class="el-icon-download el-icon--right"></i></el-button>
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
  import userSelect from '../components/UserSelection';
  import oldManSelect from '../components/OldManSelection';
  import addressSelect from '../components/AddressSelect';
  import projectSelect from '../components/ProjectSelection';
  import timeSelect from '../components/TimeSelection';

  export default {
    components: {
      'user-select': userSelect,
      'oldMan-select': oldManSelect,
      'address-select': addressSelect,
      'project-select': projectSelect,
      'time-select': timeSelect,
    },
    data() {
      return {

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

        orderStatusValue: '',
        orderStatus: [
          {
            value: 'COMPLETE',
            label: '已完成'
          },
          {
            value: 'SERVICING',
            label: '服务中'
          }
        ],

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
          oldManName: '',
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
        this.$refs.userSelect.dialogTableVisible = true;
      },

      changeSelectOldManDialogTableVisibleStatus() {
        this.$refs.oldManSelect.dialogTableVisible = true;
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
      }
    }
  };
</script>
