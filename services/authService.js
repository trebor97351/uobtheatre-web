import gql from 'graphql-tag'
import cookie from 'js-cookie'
import jwtDecode from 'jwt-decode'

import Errors from '@/classes/Errors'
import ErrorsPartial from '@/graphql/partials/ErrorsPartial'
import ValidationError from '@/errors/ValidationError'
import UnverifiedLoginError from '@/errors/auth/UnverifiedLoginError'

let refreshTimer

export default {
  currentAuthToken(context) {
    return (
      context.store?.state?.auth?.token || context.$store?.state?.auth?.token
    )
  },

  isRemembering(context) {
    return cookie.get(context.$config.auth.rememberKey)
  },

  /**
   * @param {object} context Nuxt Context
   * @returns {boolean} Whether or not the user is logged in
   */
  isLoggedIn(context) {
    return !!this.currentAuthToken(context) && !!context.store.state.auth.user
  },

  logout(context, trigger = true) {
    clearTimeout(refreshTimer)
    context.store.dispatch('auth/logout') // Remove token
    cookie.remove(context.$config.auth.refreshTokenKey) // Remove fresh token cookie
    cookie.remove(context.$config.auth.rememberKey) // Remove remember cookie
    if (trigger) window.localStorage.setItem('logout', Date.now())
  },

  /**
   * @param {object} context Nuxt Context
   * @returns {string|null} API Authentication Token
   */
  async silentRefresh(context) {
    const refreshToken = cookie.get(context.$config.auth.refreshTokenKey)
    if (!refreshToken) return this.logout(context)

    const provider = context.app
      ? context.app.apolloProvider
      : context.$apolloProvider

    const { data } = await provider.defaultClient.mutate({
      mutation: gql`
        mutation ($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            token
            refreshToken
          }
        }
      `,
      variables: {
        refreshToken,
      },
    })

    if (!data.refreshToken.token) return this.logout(context)

    this.setToken(context, data.refreshToken.token)
    this.setRefreshToken(context, data.refreshToken.refreshToken)
    this.queueRefresh(context, data.refreshToken.token)

    return context.store.dispatch('auth/loadUserDetails', {
      apollo: context.app.apolloProvider.defaultClient,
      nuxtContext: context,
    })
  },

  setRefreshToken(context, token, remember = null) {
    const rememberLengthDays = 365
    if (remember !== null) {
      if (remember)
        cookie.set(context.$config.auth.rememberKey, true, {
          expires: remember ? rememberLengthDays : null,
        })
      else if (cookie.get(context.$config.auth.rememberKey)) {
        cookie.remove(context.$config.auth.rememberKey)
      }
    }

    cookie.set(context.$config.auth.refreshTokenKey, token, {
      expires: this.isRemembering(context) ? rememberLengthDays : null,
    })
  },

  queueRefresh(context) {
    if (refreshTimer) clearTimeout(refreshTimer)
    const { exp } = jwtDecode(this.currentAuthToken(context))
    let timeoutSeconds = exp - Math.round(Date.now() / 1000) - 30

    if (timeoutSeconds < 1) timeoutSeconds = 1

    refreshTimer = setTimeout(() => {
      refreshTimer = null
      this.silentRefresh(context)
    }, timeoutSeconds * 1000)
  },

  setToken(context, token) {
    context.store.dispatch('auth/login', token)
  },

  /**
   * Attempt a login with the API using the supplied credentials
   *
   * @param {object} componentContext Vue Component "this" Context
   * @param {string} email User's Email
   * @param {string} password User's Password
   * @param {boolean} remember Whether or not to remember the user on this browser
   * @returns {Promise} API Response Promise
   */
  login(componentContext, email, password, remember = false) {
    return new Promise((resolve, reject) => {
      componentContext.$apollo
        .mutate({
          mutation: gql`
            mutation($email: String!, $password: String!) {
              login(email: $email, password: $password) {
                ${ErrorsPartial}
                token
                refreshToken
                user {
                  verified
                }
              }
            }
          `,
          variables: {
            email,
            password,
          },
        })
        .then(({ data }) => {
          if (!data.login.success)
            return reject(
              new ValidationError(Errors.createFromAPI(data.login.errors))
            )

          if (!data.login.user.verified)
            return reject(new UnverifiedLoginError())

          const standardContext = {
            store: componentContext.$store,
            $config: componentContext.$config,
            app: {
              apolloProvider: componentContext.$apolloProvider,
            },
          }

          this.setToken(standardContext, data.login.token)
          this.setRefreshToken(
            standardContext,
            data.login.refreshToken,
            remember
          )
          this.queueRefresh(standardContext)
          standardContext.store
            .dispatch('auth/loadUserDetails', {
              apollo: standardContext.app.apolloProvider.defaultClient,
            })
            .then(() => resolve(data.login))
        })
    })
  },

  /**
   * Attempts to resend the user's verification email
   *
   * @param {object} componentContext Vue Component "this" Context
   * @param {string} email User's Email
   * @returns {Promise} API Response Promise
   */
  resendVerificationEmail(componentContext, email) {
    return new Promise((resolve, reject) => {
      componentContext.$apollo
        .mutate({
          mutation: gql`
            mutation($email: String!) {
              resendActivationEmail(email: $email) {
                ${ErrorsPartial}
              }
            }
          `,
          variables: {
            email,
          },
        })
        .then(({ data }) => {
          if (!data.resendActivationEmail.success)
            return reject(
              new ValidationError(
                Errors.createFromAPI(data.resendActivationEmail.errors)
              )
            )

          return resolve()
        })
    })
  },

  /**
   * Attempt to register a new user
   *
   * @param {object} componentContext Vue Component "this" Context
   * @param {object} userDetails The users details
   * @param {string} userDetails.firstName User's first name
   * @param {string} userDetails.lastName User's last name
   * @param {string} userDetails.email User's Email
   * @param {string} userDetails.password User's Password
   * @param {string} userDetails.confirmedPassword User's Password (Confirmation)
   * @returns {Promise} API Response Promise
   */
  register(
    componentContext,
    { firstName, lastName, email, password, confirmedPassword }
  ) {
    return new Promise((resolve, reject) => {
      componentContext.$apollo
        .mutate({
          mutation: gql`
            mutation(
              $firstName: String!
              $lastName: String!
              $email: String!
              $password: String!
              $confirmedPassword: String!
            ) {
              register(
                firstName: $firstName
                lastName: $lastName
                email: $email
                password1: $password
                password2: $confirmedPassword
              ) {
                ${ErrorsPartial}
              }
            }
          `,
          variables: {
            email,
            password,
            confirmedPassword,
            firstName,
            lastName,
          },
        })
        .then((result) => {
          if (result.data.register.success) {
            return resolve(result.data.register)
          }
          return reject(
            new ValidationError(
              Errors.createFromAPI(result.data.register.errors)
            )
          )
        })
    })
  },

  requestPasswordReset(componentContext, { email }) {
    return new Promise((resolve, reject) => {
      componentContext.$apollo
        .mutate({
          mutation: gql`
            mutation($email: String!) {
              sendPasswordResetEmail(email: $email) {
                ${ErrorsPartial}
              }
            }
          `,
          variables: {
            email,
          },
        })
        .then((result) => {
          if (result.data.sendPasswordResetEmail.success) {
            return resolve(result.data.sendPasswordResetEmail)
          }
          return reject(
            new ValidationError(
              Errors.createFromAPI(result.data.sendPasswordResetEmail.errors)
            )
          )
        })
    })
  },

  resetPassword(componentContext, { token, password, confirmedPassword }) {
    return new Promise((resolve, reject) => {
      componentContext.$apollo
        .mutate({
          mutation: gql`
            mutation($token: String!, $password: String!, $confirmedPassword: String!) {
              passwordReset(token: $token, newPassword1: $password, newPassword2: $confirmedPassword) {
                ${ErrorsPartial}
              }
            }
          `,
          variables: {
            token,
            password,
            confirmedPassword,
          },
        })
        .then((result) => {
          if (result.data.passwordReset.success) {
            return resolve(result.data.passwordReset)
          }
          return reject(
            new ValidationError(
              Errors.createFromAPI(result.data.passwordReset.errors)
            )
          )
        })
    })
  },

  activateAccount(componentContext, { token }) {
    return new Promise((resolve, reject) => {
      componentContext.$apollo
        .mutate({
          mutation: gql`
            mutation($token: String!) {
              verifyAccount(token: $token) {
                ${ErrorsPartial}
              }
            }
          `,
          variables: {
            token,
          },
        })
        .then((result) => {
          if (result.data.verifyAccount.success) {
            return resolve(result.data.verifyAccount)
          }
          return reject(
            new ValidationError(
              Errors.createFromAPI(result.data.verifyAccount.errors)
            )
          )
        })
    })
  },
}
