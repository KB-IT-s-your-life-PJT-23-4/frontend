import { request } from './apiAdapter'

const ADMIN_PRODUCT_PATH = '/admin/product'

export async function listProductVersions() {
  const data = await request(`${ADMIN_PRODUCT_PATH}/versions`)
  return Array.isArray(data) ? data : []
}

export async function getProductsByVersion(versionId, { type = 'all' } = {}) {
  const params = new URLSearchParams()
  if (type && type !== 'all') params.set('type', type.toUpperCase())
  const query = params.toString()
  const data = await request(
    `${ADMIN_PRODUCT_PATH}/versions/${versionId}/products${query ? `?${query}` : ''}`,
  )
  return Array.isArray(data) ? data : []
}

export async function updateProduct(versionId, productVersionId, changes) {
  return request(`${ADMIN_PRODUCT_PATH}/versions/${versionId}/products/${productVersionId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export async function createProductVersion({ versionCode, dataDate }) {
  return request(`${ADMIN_PRODUCT_PATH}/versions`, {
    method: 'POST',
    body: JSON.stringify({ versionCode, dataDate }),
  })
}
