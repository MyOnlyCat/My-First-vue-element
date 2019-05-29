<template>
  <div class="user-select">
  <el-dialog center title="服务人员搜索" :visible.sync="dialogTableVisible">
    <div class="serachUser">
      <el-input size="medium" placeholder="请输入内容" v-model="selectInput" prefix-icon="el-input__icon el-icon-search"
                @keyup.enter.native="serachUser(selectType, selectInput)" class="input-with-select">
        <el-select v-model="selectType" slot="prepend" placeholder="搜索条件选择">
          <el-option label="服务人员姓名" value="name"></el-option>
          <el-option label="服务人员电话" value="phone"></el-option>
          <el-option label="服务人员身份证" value="identityNumber"></el-option>
        </el-select>
        <el-button slot="append" icon="el-icon-search"
                   @click.native="serachUser(selectType, selectInput)"></el-button>
      </el-input>
    </div>
    <el-table :data="gridData" v-loading="loadingTable" element-loading-text="拼命加载中">
      <el-table-column property="name" label="姓名" width="80"></el-table-column>
      <el-table-column property="phone" label="电话" width="200"></el-table-column>
      <el-table-column property="identityNumber" label="身份证" width="250"></el-table-column>
      <el-table-column property="currentAddress" label="详细地址" width="250"></el-table-column>
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
  </div>
</template>

<script>
  export default {
    name: 'UserSelection',
    data() {
      return {
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
        gridData: [],
        pageSize: 5,
        totalSize: 0,
        startPageNumber: 1,
        showStatus: true,
        // 分页数据结束
        selectProperty: "User",
        //分页数据选中
        userInfo: {
          name: '',
          id: ''
        },
      }
    },
    methods: {

      SelectTheUser(rowInfo) {
        console.log(rowInfo)
        // this.$emit.SelectTheUser(rowInfo)
        this.$emit('watchChild', rowInfo);
        // // 赋值给全局量
        // this.userInfo.name = rowInfo.name;
        // this.userInfo.id = rowInfo.id;
        // // 给输入框展示
        // this.form.name = this.userInfo.name;
        // // 关闭Dialog
        // this.dialogTableVisible = false;
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
          return false;
        } else if (selectType === '' || selectType === null) {
          this.$message({
            message: '请选择查询条件!',
            center: true,
            type: 'error'
          });
          return false;
        } else if (selectInput === '' || selectInput === null) {
          this.$message({
            message: '请输入查询内容!',
            center: true,
            type: 'error'
          });
          return false;
        } else {
          return true;
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
            'selectProperty': this.selectProperty,
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


      serachUser(selectType, selectInput) {
        const res = this.check(selectType, selectInput);

        if (res) {
          this.loadingTable = true;
          console.log('加载情况' + this.loadingTable);

          const params = {
            'selectType': selectType,
            'selectParam': selectInput,
            'pageNumber': this.startPageNumber,
            'pageSize': this.pageSize,
            'selectProperty': this.selectProperty,
          };
          this.$http.post('/api/searchUsers', params)
            .then(res => {
              this.gridData = [];
              this.select = selectType;
              this.selectInput = selectInput;
              this.gridData = res.data.data.userInfoList;
              this.totalSize = res.data.data.count;
              this.loadingTable = false;
            });
        } else {
          this.gridData = [];
          this.selectInput = '';
          this.totalSize = 0;
        }
      }

    }
  };
</script>

<style scoped>

</style>
