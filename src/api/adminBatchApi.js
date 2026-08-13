import { request } from './apiAdapter'

const ADMIN_BATCH_PATH = '/admin/batch'

// GET /api/admin/batch/job — [{ jobName, displayName, running, lastExecution }]
// running 은 이 서버 메모리 기준이다. 메타테이블의 STARTED 는 톰캣이 죽으면 그대로 남아서 못 믿는다.
export function getAdminBatchJobs() {
  return request(`${ADMIN_BATCH_PATH}/job`)
}

// GET /api/admin/batch/execution — { executions, pagination }
export function getAdminBatchExecutionPage({ page = 0, size = 20, jobName, status } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (jobName?.trim()) params.set('jobName', jobName.trim())
  if (status?.trim()) params.set('status', status.trim())

  return request(`${ADMIN_BATCH_PATH}/execution?${params.toString()}`)
}

// POST /api/admin/batch/job/{jobName}/run — 접수만 하고 바로 돌아온다(202). 이미 돌고 있으면 409.
export function runAdminBatchJob(jobName) {
  return request(`${ADMIN_BATCH_PATH}/job/${encodeURIComponent(jobName)}/run`, { method: 'POST' })
}

// POST /api/admin/batch/execution/{id}/restart — 실패/중단된 실행만 가능. 성공한 실행이면 409.
export function restartAdminBatchExecution(jobExecutionId) {
  return request(`${ADMIN_BATCH_PATH}/execution/${jobExecutionId}/restart`, { method: 'POST' })
}
