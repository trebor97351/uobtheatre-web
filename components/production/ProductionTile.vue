<template>
  <div
    class="
      production-tile
      px-4
      cursor-pointer
      transition-all
      hover:drop-shadow-dark
      drop-shadow-none
      filter
      sm:px-0
    "
  >
    <NuxtLink :to="`/production/${production.slug}`">
      <img
        class="max-w-full"
        :src="production.featuredImage.url"
        alt="show poster"
      />
      <h2
        class="
          production-title
          text-sta-orange text-2xl
          font-semibold
          transition-colors
        "
      >
        {{ production.name }}
      </h2>
      <h2 class="text-2xl transition-colors">
        {{ displayStartEnd(production.start, production.end, 'd MMM') }}
      </h2>
    </NuxtLink>
  </div>
</template>

<script>
import { displayStartEnd } from '@/utils'
export default {
  props: {
    production: {
      required: true,
      type: Object,
    },
  },
  methods: {
    displayStartEnd,
  },
}
</script>

<style scoped lang="scss">
.production-tile:hover .production-title {
  @apply text-sta-green;
}
</style>
