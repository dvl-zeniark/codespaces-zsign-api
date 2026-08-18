// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: 'standalone'
  }),

  // No cookie/session auth here to protect - the real secret (ZSIGN_API_KEY)
  // never leaves the server. Default Origin-checking would also reject
  // legitimate cross-origin traffic this app depends on: real webhook
  // deliveries from ZSign's servers are POSTs that will never share this
  // app's Origin, by definition.
  security: {
    checkOrigin: false
  },

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});