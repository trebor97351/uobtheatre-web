import axios from 'axios'
import { authService } from '.'

export default async function (context, file, name = undefined) {
  const endpoint = context.$config.api.upload_endpoint

  const formData = new FormData()
  formData.append('file', file, name)
  const result = await axios.post(endpoint, formData, {
    headers: {
      'content-type': 'multipart/form-data',
      Authorization: `JWT ${authService.currentAuthToken(context)}`,
    },
  })
  return result.data
}
