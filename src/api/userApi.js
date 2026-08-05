import { request } from './apiAdapter'

export function getMyProfile() {
  return request('/users/me')
}

export function updateMyProfile(profile, { image = null, removeImage = false } = {}) {
  const body = new FormData()
  body.append('profile', new Blob([JSON.stringify(profile)], { type: 'application/json' }))
  if (image) body.append('image', image)
  body.append('removeImage', String(removeImage))

  return request('/users/me', {
    method: 'PUT',
    body,
  })
}

export function deleteMyAccount() {
  return request('/users/me', {
    method: 'DELETE',
  })
}
