import { request } from './apiAdapter'

export function getMyProfile() {
  return request('/users/me')
}

export function updateMyProfile(profile) {
  return request('/users/me', {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}
