import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import test from '@/page/test'
import test2 from '@/page/2'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/2',
      name: '1',
      component: test2
    },
    {
      path: '/',
      name: 'test',
      component: test
    }
  ]
})
