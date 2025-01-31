<template>
  <div class="min-h-full bg-sta-gray">
    <div class="container">
      <production-banner
        class="pb-2 md:pb-8"
        :production="production"
        :show-buy-tickets-button="false"
        :show-detailed-info="false"
      />
      <div class="flex flex-wrap mb-2 md:flex-nowrap md:space-x-2">
        <div class="md:flex-none md:w-1/4 w-full flex-col">
          <booking-navigation
            class="hidden md:flex"
            :current-stage-index="currentStageIndex"
            :production="production"
            :booking="booking"
            @goto-stage="navigateToStage"
          />
          <div
            v-if="currentStage"
            class="mb-1 text-center md:hidden flex items-center"
          >
            <clickable-link
              v-if="currentStageIndex > 0"
              class="text-white flex-1"
              @click="gotoPreviousStage"
            >
              <font-awesome-icon icon="chevron-left" class="fa-2x" />
            </clickable-link>
            <h1
              class="text-sta-green text-h2 sm:text-h1 justify-center flex-auto"
            >
              {{ currentStage.name }}
            </h1>
            <div class="flex-1"></div>
          </div>
          <div
            v-if="booking.raw && booking.raw.expiresAt"
            class="p-2 bg-sta-green-dark my-2 rounded text-center shadow-inner"
          >
            You have
            <strong>
              <time-remaining-countdown
                :expires-at="booking.raw.expiresAt"
                @finished="bookingExpired"
              />
            </strong>
            to complete this booking
          </div>
        </div>

        <div
          id="booking-view"
          class="flex-grow sm:pb-4 max-w-full bg-sta-gray-dark sm:p-3"
        >
          <NuxtChild
            ref="stageComponent"
            :production="production"
            :booking="booking"
            :ticket-matrix="ticketMatrix"
            @hook:mounted="onChildMount"
            @select-performance="onSelectPerformance"
            @next-stage="navigateToStage()"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Booking from '@/classes/Booking'
import TicketsMatrix from '@/classes/TicketsMatrix'
import BookingNavigation from '@/components/booking/BookingNavigation.vue'
import ProductionBanner from '@/components/production/ProductionBanner.vue'
import ClickableLink from '@/components/ui/ClickableLink.vue'
import { swal } from '@/utils'

import ProductionBasicInfoFragment from '@/graphql/fragments/production/ProductionBasicInfoFragment.gql'
import ProductionPerformancesFragment from '@/graphql/fragments/production/ProductionPerformancesFragment.gql'
import gql from 'graphql-tag'
import TimeRemainingCountdown from '@/components/ui/Formatters/TimeRemainingCountdown.vue'
import {
  getNextStage,
  getPreviousStage,
  getStageIndex,
} from './book/-bookingStages'
export default {
  components: {
    BookingNavigation,
    ProductionBanner,
    ClickableLink,
    TimeRemainingCountdown,
  },
  middleware: 'authed',
  async asyncData({ params, app, error }) {
    const { data } = await app.apolloProvider.defaultClient.query({
      query: gql`
        query production($slug: String!) {
          production(slug: $slug) {
            ...ProductionBasicInfo
            ...ProductionPerformances
          }
        }
        ${ProductionBasicInfoFragment}
        ${ProductionPerformancesFragment}
      `,
      variables: {
        slug: params.slug,
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
  data() {
    return {
      booking: new Booking(),
      ticketMatrix: null,
      previousBooking: null,
      currentStage: null,
    }
  },
  head() {
    return {
      title: `Book ${this.production.name}`,
      script: [{ src: this.$config.services.square.script, defer: true }],
    }
  },
  computed: {
    currentStageIndex() {
      return getStageIndex(this.currentStage)
    },
    crumbs() {
      return [
        { text: 'Whats On', path: '/productions' },
        {
          text: this.production.name,
          path: `/production/${this.production.slug}`,
        },
        { text: 'Book' },
      ]
    },
  },
  methods: {
    bookingExpired() {
      const production = this.production
      this.loadDataForStage()
      this.booking = new Booking()
      swal
        .fire({
          title: 'Booking Expired',
          text: "Sorry! Your booking has expired. We do this to ensure that tickets aren't reserved for too long.",
          confirmButtonText: 'Create a new booking',
          cancelButtonText: 'Return to home',
          showCancelButton: true,
          showConfirmButton: true,
        })
        .then(({ isConfirmed, isDismissed }) => {
          if (isDismissed) return this.$router.push('/')
          return this.$router.push(`/production/${production.slug}/book`)
        })
    },
    onChildMount() {
      this.currentStage = this.$refs.stageComponent.$options.stageInfo

      this.loadDataForStage()
      if (!this.currentStage.shouldBeUsed(this.production, this.booking)) {
        return this.navigateToStage(null, true)
      }
      if (!this.currentStage.eligable(this.production, this.booking)) {
        return this.gotoPreviousStage()
      }
    },
    gotoPreviousStage() {
      this.navigateToStage(
        getPreviousStage(this.currentStageIndex, this.production, this.booking)
      )
    },
    navigateToStage(stage = null, replace = false) {
      if (!stage)
        stage = getNextStage(
          this.currentStageIndex,
          this.production,
          this.booking
        )

      this.$router[replace ? 'replace' : 'push']({
        name: stage.stageInfo.routeName,
        hash: '#booking-view',
        params: {
          slug: this.production.slug,
          performanceId: this.booking.performance
            ? this.booking.performance.id
            : null,
        },
      })
    },
    loadDataForStage() {
      if (this.$route.params.performanceId) {
        // Check if user already has a draft booking for this performance if not already
        if (this.previousBooking === null) {
          this.$apollo
            .query({
              query: require('@/graphql/queries/DraftBookingForPerformance.gql'),
              variables: {
                performanceID: this.$route.params.performanceId,
              },
              fetchPolicy: 'no-cache',
            })
            .then(({ data }) => {
              this.previousBooking = data.me.bookings.edges.length
                ? data.me.bookings.edges[0].node
                : false

              if (this.previousBooking) {
                swal
                  .fire({
                    title: 'Resume previous booking?',
                    text: 'You previously started a booking for this performance. Would you like to resume it?',
                    showCancelButton: true,
                    confirmButtonText: 'Resume',
                    cancelButtonText: 'No, start fresh',
                  })
                  .then((result) => {
                    if (result.isConfirmed) {
                      this.booking.updateFromAPIData(this.previousBooking)
                    }
                  })
              }
            })
        }

        if (!this.booking.performance) {
          this.booking.performance = this.production.performances.edges
            .map((edge) => edge.node)
            .find(
              (performance) =>
                performance.id === this.$route.params.performanceId
            )
        }

        if (!this.ticketMatrix) {
          this.$apollo
            .query({
              query: require('@/graphql/queries/PerformanceTicketOptions.gql'),
              variables: {
                id: this.booking.performance.id,
              },
            })
            .then((result) => {
              this.ticketMatrix = new TicketsMatrix(result.data.performance)
            })
        }
      }
    },
    onSelectPerformance(performance) {
      this.booking.performance = performance
      this.booking.tickets = []
      this.navigateToStage()
    },
  },
}
</script>
