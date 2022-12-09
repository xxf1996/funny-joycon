import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import transformerDirectives from '@unocss/transformer-directives'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Unocss({
      transformers: [
        transformerDirectives() // UnoCSS transformer for @apply、@screen and theme() directive
      ]
    })
  ],
  server: {
    port: 5177,
    open: true,
  },
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${path.resolve(__dirname, 'src')}/`,
      },
    ]
  }
})
