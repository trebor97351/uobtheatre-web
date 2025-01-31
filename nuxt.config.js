import config from './config'
import FaIconSet from './plugins/fontawesome.config'

export default {
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  publicRuntimeConfig: config(),

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: '',
    titleTemplate: (titleChunk) =>
      titleChunk
        ? `${titleChunk} - UOB Theatre`
        : 'UOB Theatre | The Home Of Bristol Student Theatre',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'og:title',
        name: 'og:title',
        content: 'UOB Theatre',
      },
      {
        hid: 'og:site_name',
        name: 'og:site_name',
        content: 'UOB Theatre',
      },
      {
        hid: 'og:description',
        name: 'og:description',
        content:
          'From Aristophanes to Ayckbourn, from Puccini to pantomime, Bristol Student Theatre has it all. Find out about our performances, buy tickets, discover our societies and how to get involved, and sign up to our newsletter to stay updated with all the latest shows.',
      },
      {
        hid: 'description',
        name: 'description',
        content:
          'From Aristophanes to Ayckbourn, from Puccini to pantomime, Bristol Student Theatre has it all. Find out about our performances, buy tickets, discover our societies and how to get involved, and sign up to our newsletter to stay updated with all the latest shows.',
      },
      {
        name: 'keywords',
        content:
          'bristol,student,theatre,performing,arts,university,winston,bristol su',
      },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@360;600&display=swap',
      },
    ],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ['~/assets/styles/app.scss', 'leaflet/dist/leaflet.css'],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '~/plugins/vue-filters.js',
    '~/plugins/vue-tailwind.js',
    '~/plugins/initial-auth.js',
    '~/plugins/auth-helpers.js',
    '~/plugins/gtag.js',
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: false,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',

    // // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',

    // TailwindCSS
    '@nuxtjs/tailwindcss',

    // Font Awesome
    '@nuxtjs/fontawesome',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',

    '@nuxtjs/apollo',

    '@nuxtjs/sentry',
  ],

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      name: 'UOB Theatre',
      lang: 'en',
      description:
        'The offical app for UOBTheatre.com, the hub for Bristol student performing arts and events',
      background_color: '#2B303A',
      theme_color: '#4B8F8C',
    },
  },

  // Loading Bar
  loading: {
    color: '#FF9F1C',
    height: '5px',
  },

  // Initial SPA Loading Spinner
  loadingIndicator: {
    background: '#2B303A',
  },

  // ESLint
  eslint: {
    fix: true,
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extend(config, ctx) {
      config.module.rules.push({
        test: /\.(ogg|mp3|wav|mpe?g)$/i,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
        },
      })
    },
  },

  // Apollo Configuration
  apollo: {
    clientConfigs: {
      default: '~/plugins/vue-apollo.config.js',
    },
    // Name of cookie to store token
    tokenName: config().auth.cookie,

    // Sets the authentication type for any authorized request.
    authenticationType: 'JWT',
  },

  // FontAwesome Configuration
  fontawesome: {
    icons: FaIconSet,
  },

  // Sentry
  sentry: {
    dsn: config().services.sentry.id, // Enter your project's DSN here
    // Additional Module Options go here
    // https://sentry.nuxtjs.org/sentry/options
    config: {
      // Add native Sentry config here
      // https://docs.sentry.io/platforms/javascript/guides/vue/configuration/options/
    },
  },
}
