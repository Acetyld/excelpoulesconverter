// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon', '@nuxt/ui', '@nuxt/image'],
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'dark',
  },
})