import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    history:createWebHashHistory(),
    routes: [
        {
            path:'/',
            name:'EditorPage',
            component: () => import('@/views/EditorPage.vue')
        }
    ]
})

export default router