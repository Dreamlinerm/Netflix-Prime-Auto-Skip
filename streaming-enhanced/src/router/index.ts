// import { apolloCache } from '@/apollo'
// import { AdminLevel, GetCurrentUserDocument } from '@/gql-types'
// import { verify_required_permissions } from '@/utils'
// import '@ionic/vue-router'
// import { createRouter, createWebHistory } from '@ionic/vue-router'
// import { RouteRecordRaw } from 'vue-router'
// import loginRoutes from './login.router'
// import testRoutes from './test.router'

// declare module 'vue-router' {
//   interface RouteMeta {
//     requiredPermissions?: AdminLevel[]
//     requiresAuth?: boolean
//     enteringLoginSites?: boolean
//   }
// }

// const routes: Array<RouteRecordRaw> = [
//   {
//     path: '/',
//     component: () => import('@/views/landingPages/OnboardingPage.vue'),
//     name: 'onboarding',
//     meta: { enteringLoginSites: true }
//   },
//   {
//     path: '/disclaimer',
//     name: 'disclaimer',
//     component: () => import('@/views/landingPages/Legal.vue')
//   },
//   {
//     path: '/privacy',
//     name: 'privacy',
//     component: () => import('@/views/landingPages/Legal.vue')
//   },
//   {
//     path: '/imprint',
//     name: 'imprint',
//     component: () => import('@/views/landingPages/Legal.vue')
//   },
//   {
//     path: '/map',
//     component: () => import('@/views/MapNav.vue'),
//     children: [
//       // Main Menu
//       {
//         name: 'projects',
//         path: 'projects',
//         component: () => import('@/views/project/ProjectPage.vue')
//       },
//       {
//         name: 'change-project',
//         path: 'projects/change/:projectId?',
//         component: () => import('@/views/project/ChangeProject.vue')
//       },
//       // Project Menu
//       {
//         name: 'project-details',
//         path: ':projectId/project-details',
//         component: () => import('@/views/project/IndividualProjectPage.vue')
//       },
//       {
//         name: 'objects',
//         path: ':projectId/objects',
//         component: () => import('@/views/project/Objects.vue')
//       },
//       {
//         name: 'wind-potential',
//         path: ':projectId/Wind-potential',
//         component: () => import('@/views/project/WindPotential.vue')
//       },
//       {
//         name: 'potential-area',
//         path: ':projectId/potential-area',
//         component: () => import('@/views/project/PotentialArea.vue')
//       },
//       // Simulations
//       {
//         name: 'layouts',
//         path: ':projectId/layouts',
//         component: () => import('@/views/simulations/Layouts.vue')
//       },
//       {
//         name: 'change-windturbine',
//         path: ':projectId/scenario/change-windturbine/:turbineId?',
//         component: () => import('@/views/project/ChangeWindturbine.vue')
//       },
//       {
//         name: 'turbulence',
//         path: ':projectId/turbulence',
//         component: () => import('@/views/simulations/turbulence.vue')
//       },
//       {
//         name: 'shadow-cast',
//         path: ':projectId/shadow-cast',
//         component: () => import('@/views/simulations/ShadowCast.vue')
//       },
//       {
//         name: 'noise-cast',
//         path: ':projectId/noise-cast',
//         component: () => import('@/views/simulations/NoiseCast.vue')
//       },
//       {
//         name: 'energyYield',
//         path: ':projectId/energyYield',
//         component: () => import('@/views/simulations/energyYield.vue')
//       },
//       // Survey Menu
//       {
//         name: 'publish',
//         path: ':projectId/publish',
//         component: () => import('@/views/survey/Publish.vue')
//       },
//       {
//         name: 'survey',
//         path: ':projectId/survey',
//         component: () => import('@/views/survey/survey.vue')
//       },
//       {
//         path: ':projectId/frontend',
//         name: 'frontend',
//         component: () => import('@/views/PublicApp/FrontendText.vue')
//       },

//       // Miscellaneous
//       {
//         name: 'UI-Elements',
//         path: 'ui-elements',
//         component: () => import('@/views/project/UI-Elements.vue')
//       }
//     ]
//   },
//   {
//     path: '/no-map',
//     component: () => import('@/views/MapNav.vue'),
//     props: () => ({ map: false, sidebar: true }),
//     children: [
//       {
//         path: 'turbine-database',
//         component: () => import('@/views/turbineDatabase/TurbineDatabase.vue'),
//         props: () => ({ map: false, sidebar: true })
//       },
//       {
//         name: 'user_settings',
//         path: '/user_settings',
//         component: () => import('@/views/settings/settings.vue')
//       },
//       {
//         path: 'test-graph-ql',
//         component: () => import('@/views/TestGraphQl.vue')
//       }
//     ]
//   },
//   {
//     path: '/:catchAll(.*)',
//     name: 'NotFound',
//     redirect: { name: 'projects' }
//   }
// ]

// const router = createRouter({
//   history: createWebHistory(process.env.BASE_URL),
//   routes: [...routes, ...loginRoutes, ...testRoutes]
// })
// router.beforeEach((to) => {
//   const userQuery = apolloCache.readQuery({ query: GetCurrentUserDocument })
//   if (to.meta.requiresAuth && to.meta.requiredPermissions) {
//     return verify_required_permissions(to.meta.requiredPermissions, userQuery?.currentUser)
//   }
//   if (to.meta.enteringLoginSites) {
//     if (userQuery?.currentUser) {
//       // showToast('Du bist bereits eingeloggt!', 3000, 'success')
//       return 'projects'
//     }
//   }
//   return
// })

// export default router
