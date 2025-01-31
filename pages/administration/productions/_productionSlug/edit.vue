<template>
  <admin-page :title="`Edit ${production.name}`">
    <template #toolbar>
      <sta-button colour="green" @click="save">Save Changes</sta-button>
      <sta-button colour="orange" @click="$router.go(-1)">Cancel</sta-button>
    </template>
    <non-field-error :errors="errors" />
    <production-editor
      ref="editor"
      :production="production"
      v-bind.sync="production"
      :errors="errors"
    />
  </admin-page>
</template>

<script>
import AdminProductionEditQuery from '@/graphql/queries/admin/productions/AdminProductionEdit.gql'
import ProductionEditor from '@/components/production/editor/ProductionEditor.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import StaButton from '@/components/ui/StaButton.vue'
import NonFieldError from '@/components/ui/NonFieldError.vue'
import {
  getValidationErrors,
  loadingSwal,
  performMutation,
  successToast,
} from '@/utils'
import Swal from 'sweetalert2'
export default {
  components: { ProductionEditor, AdminPage, StaButton, NonFieldError },
  async asyncData({ params, error, app }) {
    // Execute query
    const { data } = await app.apolloProvider.defaultClient.query({
      query: AdminProductionEditQuery,
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
  data() {
    return {
      production: null,
      errors: null,
    }
  },

  head() {
    const title = this.production
      ? `Edit ${this.production.name}`
      : 'Loading...'
    return {
      title,
    }
  },
  methods: {
    async save() {
      this.errors = null
      loadingSwal.fire()
      try {
        await performMutation(
          this.$apollo,
          {
            mutation: require('@/graphql/mutations/admin/production/ProductionMutation.gql'),
            variables: {
              input: await this.$refs.editor.getInputData(),
            },
          },
          'production'
        )
        const { data } = await this.$apollo.query({
          query: AdminProductionEditQuery,
          variables: {
            slug: this.production.slug,
          },
        })
        this.production = data.production
        this.$router.replace(`../${this.production.slug}`)
        successToast.fire({ title: 'Production Updated' })
      } catch (e) {
        this.errors = getValidationErrors(e)
        Swal.close()
      }
    },
  },
}
</script>
