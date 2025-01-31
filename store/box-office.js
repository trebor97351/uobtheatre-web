import Cookie from 'js-cookie'

const locationCookieKey = 'uobtheatre-boxoffice-location'

export const state = () => ({
  locationId: null,
  terminalDevice: null,
  inProgressBookingID: null,
})

export const mutations = {
  SET_LOCATION(state, locationId) {
    state.locationId = locationId
  },
  SET_TERMINAL_DEVICE(state, device) {
    state.terminalDevice = device
  },
  SET_IN_PROGRESS_BOOKING_ID(state, id) {
    state.inProgressBookingID = id
  },
}

export const actions = {
  rememberState(context) {
    context.commit('SET_LOCATION', Cookie.get(locationCookieKey))
  },
  setDeviceLocation(context, locationId, temporary = false) {
    if (!locationId) Cookie.remove(locationCookieKey)
    else
      Cookie.set(locationCookieKey, locationId, {
        expires: temporary ? null : 365 * 1000,
      })
    context.commit('SET_LOCATION', locationId)
  },
  async retrieveAvailableTerminalDevices(context) {
    if (!context.state.locationId) return []
    const { data } = await this.app.apolloProvider.defaultClient.query({
      query: require('@/graphql/queries/box-office/BoxOfficePaymentDevices.gql'),
    })
    return data.paymentDevices.filter(
      (device) => device.locationId === context.state.locationId
    )
  },
}
