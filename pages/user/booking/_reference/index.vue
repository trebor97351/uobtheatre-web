<template>
  <div class="mb-10 min-h-full text-white bg-sta-gray">
    <div v-if="booking.performance" class="container">
      <alert v-if="booking.status.value == 'CANCELLED'" level="danger"
        >This booking has been cancelled, and is no longer valid</alert
      >
      <h1 class="pt-2 text-h1">Your Booking</h1>
      <h2 class="text-sta-orange text-h2">
        Reference - {{ booking.reference }}
      </h2>
      <production-banner
        class="pb-2 md:pb-8"
        :production="production"
        :show-buy-tickets-button="false"
        :show-detailed-info="false"
      />
      <div class="w-full text-center lg:hidden">
        <button
          id="ticket-jump"
          class="btn m-1 p-2 py-1"
          @click="jumpToTickets"
          @keypress="jumpToTickets"
        >
          Jump to tickets <font-awesome-icon icon="chevron-down" />
        </button>
      </div>

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

      <div v-if="booking.status.value == 'PAID'" class="mt-4">
        <div
          ref="tickets"
          class="
            flex
            items-center
            justify-between
            px-4
            py-2
            text-h2
            hover:bg-opacity-80
            cursor-pointer
          "
          :class="[expanded ? 'bg-sta-orange' : 'bg-sta-green']"
          @click="ticketToggle"
          @keypress="ticketToggle"
        >
          <h3 class="inline-block">View Tickets</h3>
          <font-awesome-icon :icon="expanded ? 'chevron-up' : 'chevron-down'" />
        </div>
        <div
          v-if="expanded"
          class="
            grid
            gap-4
            grid-cols-1
            2xl:grid-cols-4
            px-4
            py-4
            bg-sta-gray-dark
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >
          <ticket
            v-for="(ticket, index) in booking.tickets"
            :key="index"
            :performance="booking.performance"
            :reference="booking.reference"
            :ticket="ticket"
            :user="$store.state.auth.user"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Booking from '@/classes/Booking'
import PaymentOverview from '@/components/booking/overview/PaymentOverview.vue'
import PerformanceOverview from '@/components/booking/overview/PerformanceOverview.vue'
import TicketsOverview from '@/components/booking/overview/TicketsOverview.vue'
import VenueOverview from '@/components/booking/overview/VenueOverview.vue'
import Ticket from '@/components/booking/Ticket.vue'
import ProductionBanner from '@/components/production/ProductionBanner.vue'
import Alert from '@/components/ui/Alert.vue'

export default {
  components: {
    VenueOverview,
    PerformanceOverview,
    TicketsOverview,
    ProductionBanner,
    PaymentOverview,
    Ticket,
    Alert,
  },
  middleware: 'authed',
  async asyncData({ app, params, error }) {
    const { data } = await app.apolloProvider.defaultClient.query({
      query: require('@/graphql/queries/UserCompletedBooking.gql'),
      variables: {
        bookingRef: params.reference,
      },
    })

    if (!data.me.bookings.edges[0])
      return error({
        statusCode: 404,
        message: 'This booking does not exist',
      })

    return {
      booking: Booking.fromAPIData(data.me.bookings.edges[0].node),
    }
  },
  data() {
    return {
      booking: null,
      user: null,
      expanded: false,
    }
  },
  head() {
    const production = this.production
    return {
      title: production ? `Booking for ${production.name}` : 'Loading...',
    }
  },
  computed: {
    production() {
      return this.booking.performance
        ? this.booking.performance.production
        : null
    },
    crumbs() {
      return [
        { text: 'My Account', path: '/user' },
        { text: 'Booking Details' },
      ]
    },
  },
  methods: {
    ticketToggle() {
      this.expanded = !this.expanded
    },
    jumpToTickets() {
      this.expanded = true
      this.$refs.tickets.scrollIntoView()
    },
  },
}
</script>
