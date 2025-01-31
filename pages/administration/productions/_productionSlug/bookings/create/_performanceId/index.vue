<template>
  <card>
    <loading-container :loading="loading">
      <tickets-editor
        :booking="booking"
        :tickets-matrix="ticketsMatrix"
        :show-capacities="true"
        :show-prices="false"
        :errors="errors"
      />
      <form-label class="py-4" :required="true">
        User Email
        <template #control>
          <t-input
            v-model="bookingEmail"
            :disabled="!!booking.id"
            type="text"
            placeholder="joe.bloggs@example.org"
        /></template>
      </form-label>
      <sta-button
        colour="orange"
        :disabled="!bookingEmail || !booking.tickets.length"
        @click="create"
        >Create Booking</sta-button
      >
      <p>
        <strong>Note:</strong> Only complimentary bookings (100% discount) can
        be created here. Once you click create, booking confirmation will be
        sent to the email specified, and the booking will be instantly
        completed.
      </p>
    </loading-container>
  </card>
</template>

<script>
import FullPerformanceAndTicketOptionsQuery from '@/graphql/queries/FullPerformanceAndTicketOptions.gql'
import CreateBookingMutation from '@/graphql/mutations/booking/CreateBooking.gql'
import PayBookingMutation from '@/graphql/mutations/booking/PayBooking.gql'
import TicketsMatrix from '@/classes/TicketsMatrix'
import Booking from '@/classes/Booking'
import TicketsEditor from '@/components/booking/editor/TicketsEditor.vue'
import Card from '@/components/ui/Card.vue'
import FormLabel from '@/components/ui/FormLabel.vue'
import StaButton from '@/components/ui/StaButton.vue'
import { getValidationErrors, performMutation, successToast } from '@/utils'
import LoadingContainer from '@/components/ui/LoadingContainer.vue'
export default {
  components: {
    TicketsEditor,
    Card,
    FormLabel,
    StaButton,
    LoadingContainer,
  },
  async asyncData({ params, app, error }) {
    const { data } = await app.apolloProvider.defaultClient.query({
      query: FullPerformanceAndTicketOptionsQuery,
      variables: {
        id: params.performanceId,
      },
      fetchPolicy: 'no-cache',
    })

    const performance = data.performance
    if (!performance)
      return error({
        statusCode: 404,
        message: 'This performance does not exist',
      })

    const ticketsMatrix = new TicketsMatrix(performance)

    const booking = new Booking()
    booking.performance = performance

    return {
      ticketsMatrix,
      performance,
      booking,
    }
  },
  data() {
    return {
      ticketsMatrix: null,
      performance: null,
      loading: false,

      booking: null,
      bookingEmail: null,
      errors: null,
    }
  },
  head: {
    title: 'Create Complimentary Booking',
  },
  methods: {
    async create() {
      this.loading = true
      try {
        // Make the booking
        const data = await performMutation(
          this.$apollo,
          {
            mutation: CreateBookingMutation,
            variables: {
              adminDiscountPercentage: 1,
              performanceId: this.performance.id,
              targetUserEmail: this.bookingEmail,
              tickets: this.booking.toAPIData().tickets,
            },
          },
          'createBooking'
        )
        this.booking.updateFromAPIData(data.createBooking.booking)

        // Pay the booking
        await performMutation(
          this.$apollo,
          {
            mutation: PayBookingMutation,
            variables: {
              id: this.booking.id,
              totalPence: this.booking.totalPrice,
            },
          },
          'payBooking'
        )

        successToast.fire({
          title: 'Booking created!',
        })

        this.$router.replace(`../${this.booking.reference}`)
      } catch (e) {
        this.errors = getValidationErrors(e)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
