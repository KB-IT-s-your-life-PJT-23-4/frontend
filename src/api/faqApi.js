import { request } from './apiAdapter'

/**
 * FAQ 카테고리 + 문항 목록 조회
 *
 * GET /api/ai/faq
 *
 * @returns {Promise<Array<{
 *   title: string,
 *   items: Array<{
 *     faqId: number,
 *     question: string,
 *     prompt: string,
 *     answer: string,
 *     showBranchButton: boolean,
 *     showTaxOfficeButton: boolean,
 *   }>,
 * }>>}
 */
export async function listFaqCategories() {
  const response = await request('/ai/faq')
  return response?.categories ?? []
}
