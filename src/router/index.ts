import { createRouter, createWebHistory } from "vue-router";
import MainPage from "../pages/MainPage.vue";

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'Main', component: MainPage },
        {
            path: '/evaluation',
            name: 'Evaluation',
            component: () => import('../pages/EvaluationPage.vue')
        }
    ]
});

export default router;