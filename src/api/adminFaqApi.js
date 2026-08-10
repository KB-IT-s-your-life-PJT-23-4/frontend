import { request } from './apiAdapter'

const ADMIN_FAQ_PATH = '/admin/faq'

export function getAdminFaqPage({ page = 0, size = 10, categoryId, keyword } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })

  if (categoryId !== null && categoryId !== undefined && String(categoryId).trim()) {
    params.set('categoryId', String(categoryId))
  }
  if (keyword?.trim()) params.set('keyword', keyword.trim())

  return request(`${ADMIN_FAQ_PATH}?${params.toString()}`)
}

export async function getAdminFaqCategories() {
  const data = await request(`${ADMIN_FAQ_PATH}/category`)
  return Array.isArray(data?.categories) ? data.categories : []
}

export async function getFaqEditorCatalog() {
  const data = await request('/ai/faq')
  const categories = Array.isArray(data?.categories) ? data.categories : []
  return categories.flatMap((category) =>
    (Array.isArray(category.items) ? category.items : []).map((faq) => ({
      ...faq,
      categoryName: category.title,
    })),
  )
}

export function createAdminFaq(faq) {
  return request(ADMIN_FAQ_PATH, {
    method: 'POST',
    body: JSON.stringify(faq),
  })
}

export function updateAdminFaq(faqId, faq) {
  return request(`${ADMIN_FAQ_PATH}/${encodeURIComponent(faqId)}`, {
    method: 'PATCH',
    body: JSON.stringify(faq),
  })
}

export function deleteAdminFaq(faqId) {
  return request(`${ADMIN_FAQ_PATH}/${encodeURIComponent(faqId)}`, { method: 'DELETE' })
}

export function createAdminFaqCategory(categoryName) {
  return request(`${ADMIN_FAQ_PATH}/category`, {
    method: 'POST',
    body: JSON.stringify({ categoryName }),
  })
}

export function updateAdminFaqCategory(categoryId, categoryName) {
  return request(`${ADMIN_FAQ_PATH}/category`, {
    method: 'PATCH',
    body: JSON.stringify({ categoryId, categoryName }),
  })
}

export function deleteAdminFaqCategory(categoryId) {
  return request(`${ADMIN_FAQ_PATH}/category/${encodeURIComponent(categoryId)}`, {
    method: 'DELETE',
  })
}
