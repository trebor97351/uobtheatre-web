<template>
  <div>
    <h1 class="text-h1">Your Productions</h1>
    <div class="flex items-end space-x-4">
      <div><t-input placeholder="Search by name" /></div>
    </div>
    <card class="mt-6">
      <paginated-table
        :items="
          productionsData ? productionsData.edges.map((edge) => edge.node) : []
        "
        :loading="$apollo.queries.productionsData.loading"
        :offset.sync="productionsOffset"
        :page-info="productionsData ? productionsData.pageInfo : {}"
      >
        <template #head>
          <table-head-item>Name</table-head-item>
          <table-head-item>Dates</table-head-item>
        </template>
        <template #default="slotProps">
          <table-row
            v-for="(production, index) in slotProps.items"
            :key="index"
          >
            <table-row-item>
              <nuxt-link
                :to="`productions/${production.slug}`"
                class="font-semibold text-sta-orange hover:text-sta-orange-dark"
              >
                {{ production.name }}
              </nuxt-link>
            </table-row-item>
            <table-row-item>
              {{ displayStartEnd(production.start, production.end, 'd MMMM') }}
            </table-row-item>
          </table-row>
        </template>
      </paginated-table>
    </card>
  </div>
</template>

<script>
import PaginatedTable from '@/components/ui/Tables/PaginatedTable.vue'
import AdminProductionsQuery from '@/graphql/queries/admin/productions/AdminProductionsIndex.gql'
import { displayStartEnd } from '@/utils'
import TableHeadItem from '@/components/ui/Tables/TableHeadItem.vue'
import TableRow from '@/components/ui/Tables/TableRow.vue'
import TableRowItem from '@/components/ui/Tables/TableRowItem.vue'
import Card from '@/components/ui/Card.vue'
export default {
  components: {
    PaginatedTable,
    TableHeadItem,
    TableRowItem,
    Card,
    TableRow,
  },
  data() {
    return {
      productionsData: null,
      productionsOffset: 0,
      productionsStatusFilter: null,
      productionsRunDateFilter: null,
    }
  },
  head: {
    title: 'Your Productions',
  },
  methods: {
    displayStartEnd,
  },
  apollo: {
    productionsData: {
      query: AdminProductionsQuery,
      variables() {
        return {
          offset: this.productionsOffset,
          status: this.productionsStatusFilter,
          startLte: this.productionsRunDateFilter
            ? this.productionsRunDateFilter + 'T23:59:59'
            : null,
          endGte: this.productionsRunDateFilter
            ? this.productionsRunDateFilter + 'T00:00:00'
            : null,
        }
      },
      update: (data) => data.productions,
    },
  },
}
</script>
