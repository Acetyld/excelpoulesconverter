// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon', '@nuxt/ui', '@nuxt/image'],
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'dark',
  },
  runtimeConfig: {
    allowedIps: ['93.119.3.188', '185.88.64.178']
  },
  nitro: {
    serverAssets: [
      {
        baseName: 'node_modules/xlsx',
        dir: './node_modules/xlsx'
      }
    ]
  }
})