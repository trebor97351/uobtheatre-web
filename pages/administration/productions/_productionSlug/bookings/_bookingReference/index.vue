<template>
  <admin-page title="View Booking">
    <h2 class="text-sta-orange text-h2">Reference - {{ booking.reference }}</h2>
    <production-banner
      class="pb-2 md:pb-8"
      :production="production"
      :show-buy-tickets-button="false"
      :show-detailed-info="false"
    />
    <card title="Admin Information" class="mb-4">
      <table>
        <table-row v-for="(row, index) in adminInfo" :key="index">
          <table-head-item>{{ row[0] }}</table-head-item>
          <table-row-item>{{ row[1] }}</table-row-item>
        </table-row>
      </table>
    </card>
    <div class="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <performance-overview
        class="lg:col-span-2"
        :production="production"
        :performance="booking.performance"
      />
      <venue-overview
        class="lg:col-span-1"
        :venue-data="booking.performance.venue.slug"
        :online="booking.performance.isOnline"
        :in-person="booking.performance.isInperson"
      />

      <payment-overview class="lg:col-span-1" :booking="booking" />
      <tickets-overview class="lg:col-span-2" :booking="booking" />
    </div>
  </admin-page>
</template>

<script>
import AdminPage from '@/components/admin/AdminPage.vue'
import ProductionBanner from '@/components/production/ProductionBanner.vue'
import PerformanceOverview from '@/components/booking/overview/PerformanceOverview.vue'
import VenueOverview from '@/components/booking/overview/VenueOverview.vue'
import PaymentOverview from '@/components/booking/overview/PaymentOverview.vue'
import TicketsOverview from '@/components/booking/overview/TicketsOverview.vue'
import Booking from '@/classes/Booking'
import Card from '@/components/ui/Card.vue'
import TableRow from '@/components/ui/Tables/TableRow.vue'
import TableHeadItem from '@/components/ui/Tables/TableHeadItem.vue'
import TableRowItem from '@/components/ui/Tables/TableRowItem.vue'
export default {
  components: {
    AdminPage,
    ProductionBanner,
    PerformanceOverview,
    VenueOverview,
    PaymentOverview,
    TicketsOverview,
    TableHeadItem,
    TableRowItem,
    TableRow,
    Card,
  },
  async asyncData({ app, params, error }) {
    const { data } = await app.apolloProvider.defaultClient.query({
      query: require('@/graphql/queries/admin/productions/AdminBookingDetail.gql'),
      variables: {
        bookingReference: params.bookingReference,
      },
    })

    if (!data.bookings.edges[0])
      return error({
        statusCode: 404,
        message: 'This booking does not exist',
      })

    const rawBooking = data.bookings.edges[0].node

    return {
      booking: Booking.fromAPIData(rawBooking),
      rawBooking,
    }
  },
  head() {
    const title = `Booking ${this.booking.reference}`
    return { title }
  },
  computed: {
    production() {
      return this.booking.performance.production
    },
    adminInfo() {
      return [
        ['Status', this.rawBooking.status.description],
        [
          'Created At',
          this.$options.filters.dateFormat(
            this.rawBooking.createdAt,
            'dd/MMM/y HH:mm ZZZZ'
          ),
        ],
        [
          'Updated At',
          this.$options.filters.dateFormat(
            this.rawBooking.updatedAt,
            'dd/MMM/y HH:mm ZZZZ'
          ),
        ],
        [
          'Created By',
          `${this.rawBooking.creator.firstName} ${this.rawBooking.creator.lastName}`,
        ],
        [
          'Owned By',
          `${this.rawBooking.user.firstName} ${this.rawBooking.user.lastName} (Email: ${this.rawBooking.user.email})`,
        ],
        ['Admin Discount', this.rawBooking.adminDiscountPercentage],
      ]
    },
  },
}
</script>
