<template>
    <div>
      <el-select v-model="value" filterable clearable placeholder="请选择合同">
        <el-option
          v-for="item in projectList"
          :key="item.id"
          :label="item.name"
          :value="item.id">
        </el-option>
      </el-select>
    </div>
</template>

<script>
  export default {
    name: 'ProjectSelection',
    data() {
      return {
        value: '',
        projectList: '',
      }
    },
    methods: {
      getAllProjectInfo() {
        this.$http.post('/api/getAllProjectInfo')
          .then(res => {
            this.projectList = res.data.data;
          });
      }
    },
    // 页面加载完成调用初始化
    created: function() {
      this.getAllProjectInfo();
    }
  };
</script>

<style scoped>

</style>
