<template>
  <admin-page title="Create a Booking">
    <p>Select a performance below to create a complimentry booking for.</p>

    <loading-container :loading="$apollo.queries.performancesData.loading">
      <template v-if="performancesData">
        <time-grouped-performance-selector
          :performances="performancesData.edges.map((edge) => edge.node)"
          @select-performance="$router.push(`create/${$event.id}`)"
        />
        <div class="flex justify-center">
          <pagination-bar
            class="mx-auto"
            :current-offset="performancesOffset"
            :page-info="performancesData.pageInfo"
            :disabled="$apollo.queries.performancesData.loading"
            @previousPage="
              performancesOffset = Math.max(
                0,
                performancesOffset - performancesData.edges.length
              )
            "
            @nextPage="performancesOffset += performancesData.edges.length"
          />
        </div>
      </template>
    </loading-container>
  </admin-page>
</template>

<script>
import AdminPerformancesIndexQuery from '@/graphql/queries/admin/productions/AdminPerformancesIndex.gql'
import AdminProductionLookupQuery from '@/graphql/queries/admin/productions/AdminProductionLookup.gql'
import AdminPage from '@/components/admin/AdminPage.vue'
import PaginationBar from '@/components/ui/PaginationBar.vue'
import LoadingContainer from '@/components/ui/LoadingContainer.vue'
import TimeGroupedPerformanceSelector from '@/components/performance/TimeGroupedPerformanceSelector.vue'
export default {
  components: {
    AdminPage,
    PaginationBar,
    LoadingContainer,
    TimeGroupedPerformanceSelector,
  },
  async asyncData({ params, error, app }) {
    // Execute query
    const { data } = await app.apolloProvider.defaultClient.query({
      query: AdminProductionLookupQuery,
      variables: {
        slug: params.productionSlug,
      },
    })

    const production = data.production
    if (!production)
      return error({
        statusCode: 404,
        message: 'This production does not exist',
      })
    return {
      production,
    }
  },
  apollo: {
    performancesData: {
      query: AdminPerformancesIndexQuery,
      variables() {
        return {
          productionSlug: this.production.slug,
          offset: this.performancesOffset,
          soldOut: false,
          disabled: false,
          take: 8,
        }
      },
      update: (data) => data.production.performances,
    },
  },
  data() {
    return {
      production: null,

      performancesData: null,
      performancesOffset: 0,
    }
  },
  head() {
    const title = `Create booking for ${this.production.name}`
    return {
      title,
    }
  },
}
</script>
