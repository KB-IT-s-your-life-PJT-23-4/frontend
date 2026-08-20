import { request } from './apiAdapter'

const ADMIN_LAWTAX_PATH = '/admin/lawtax'

export async function listGiftTaxVersions() {
  const data = await request(`${ADMIN_LAWTAX_PATH}/versions`)
  return Array.isArray(data) ? data : []
}

export async function createGiftTaxVersion(payload) {
  return request(`${ADMIN_LAWTAX_PATH}/versions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateGiftTaxVersion(effectiveFrom, payload) {
  return request(`${ADMIN_LAWTAX_PATH}/versions/${effectiveFrom}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteGiftTaxVersion(effectiveFrom) {
  return request(`${ADMIN_LAWTAX_PATH}/versions/${effectiveFrom}`, { method: 'DELETE' })
}

export function listLawArticles({ page = 0, size = 10, lawCode, keyword } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })

  if (lawCode?.trim()) params.set('lawCode', lawCode.trim())
  if (keyword?.trim()) params.set('keyword', keyword.trim())

  return request(`${ADMIN_LAWTAX_PATH}/articles?${params.toString()}`)
}

export async function getLawSummaries() {
  const data = await request(`${ADMIN_LAWTAX_PATH}/articles/laws`)
  return Array.isArray(data) ? data : []
}

export function getLawArticle(lawId) {
  return request(`${ADMIN_LAWTAX_PATH}/articles/${encodeURIComponent(lawId)}`)
}
