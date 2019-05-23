// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
// -----------------------------------------------------页面入口
import Vue from 'vue'
import App from './App'
import router from './router'
// ElementUI相关
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);
// ElementUI相关结束

// Axios 相关
import api from 'axios';
// api.defaults.headers.common['Authorization'] = 'Bearer 26944db8d7518081015f641eb5b747a56061d333';
Vue.prototype.$http = api;
// Axios 相关结束

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
