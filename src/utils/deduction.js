// 공제 현황(누적 증여액·남은 한도·갱신일)의 산출은 GET /api/gm/deduction 이 담당한다.
// 기준: 상속세 및 증여세법 제53조 — 동일인(직계존속 기준) 10년 합산.
// 합산 대상은 확정된 증여(COMPLETED)만. 진행 중(PLANNED)은 아직 증여가 일어나지 않았으므로 제외한다.
//
// 여기 남은 것은 (1) 서버 값을 화면 문구로 바꾸는 표기 헬퍼, (2) 목데이터 모드용 한도 계산이다.
// 서버 연동 모드에서 한도를 다시 계산하지 말 것 — 두 벌이 되면 어긋난다.

export const ADULT_AGE = 19
export const DEDUCTION_WINDOW_YEARS = 10

// family.relation 컬럼이 ENUM('SPOUSE','LINEAL_DESCENDANT','OTHER')이라 저장 코드와 화면 라벨을 분리한다.
// 라벨 사전에는 SPOUSE 도 남겨둔다. 선택지에서 뺐어도 이미 저장된 행은 화면에 그려야 한다.
const RELATION_LABELS = {
  LINEAL_DESCENDANT: '자녀',
  SPOUSE: '배우자',
  OTHER: '기타 친족',
}

// 신규 수증자는 자녀만 등록한다. 기존 저장 데이터 표기를 위해 위 라벨 사전은 유지한다.
export const RELATION_OPTIONS = [
  { code: 'LINEAL_DESCENDANT', label: RELATION_LABELS.LINEAL_DESCENDANT },
]

// 데모 데이터/이전 화면에서 쓰던 한글 관계값을 백엔드 ENUM으로 되돌린다.
const LABEL_TO_CODE = {
  자녀: 'LINEAL_DESCENDANT',
  아들: 'LINEAL_DESCENDANT',
  딸: 'LINEAL_DESCENDANT',
  손자: 'LINEAL_DESCENDANT',
  손녀: 'LINEAL_DESCENDANT',
  배우자: 'SPOUSE',
  기타: 'OTHER',
  '기타 친족': 'OTHER',
}

// 배우자 공제는 서비스 범위 밖이라 값을 두지 않는다(백엔드 gift_deduction_limit 시드도 동일).
export const DEDUCTION_LIMITS = {
  LINEAL_DESCENDANT_ADULT: 50000000,
  LINEAL_DESCENDANT_MINOR: 20000000,
  OTHER: 10000000,
}

export function relationLabel(relation) {
  return RELATION_LABELS[relation] ?? relation ?? ''
}

export function relationCode(relation) {
  if (RELATION_LABELS[relation]) return relation
  return LABEL_TO_CODE[relation] ?? 'OTHER'
}

export function parseDate(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? new Date(value) : null
  const normalized = String(value ?? '')
    .slice(0, 10)
    .replaceAll('.', '-')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null
  const parsed = new Date(`${normalized}T00:00:00`)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

// 화면 표기용 2026.07.30
export function toDotDate(value) {
  const date = parseDate(value)
  if (!date) return ''
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

// 백엔드 전송용 2026-07-30
export function toIsoDate(value) {
  const date = parseDate(value)
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function addYears(date, years) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

export function isMinorAt(birthDate, referenceDate = new Date()) {
  const birth = parseDate(birthDate)
  const reference = parseDate(referenceDate) ?? new Date()
  if (!birth) return false
  return addYears(birth, ADULT_AGE) > reference
}

/** 배우자는 산출 대상이 아니라 null 을 준다. 호출부는 한도 없음으로 표시해야 한다. */
export function deductionLimitFor(relation, birthDate, referenceDate = new Date()) {
  const code = relationCode(relation)
  if (code === 'SPOUSE') return null
  if (code === 'OTHER') return DEDUCTION_LIMITS.OTHER
  return isMinorAt(birthDate, referenceDate)
    ? DEDUCTION_LIMITS.LINEAL_DESCENDANT_MINOR
    : DEDUCTION_LIMITS.LINEAL_DESCENDANT_ADULT
}

// 또래 평균 증여액은 참고 지표용 데이터가 없어 연령대로 근사한다.
export function peerAverageGiftAmount(birthDate, referenceDate = new Date()) {
  const birth = parseDate(birthDate)
  const reference = parseDate(referenceDate) ?? new Date()
  if (!birth) return 30000000
  const age = reference.getFullYear() - birth.getFullYear()
  if (age < 19) return 18000000
  if (age < 30) return 30000000
  return 42000000
}

function monthsBetween(from, to) {
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  return to.getDate() < from.getDate() ? months - 1 : months
}

function renewalLabel(reference, renewalDate) {
  if (!renewalDate) return '증여 이력 없음'
  if (renewalDate <= reference) return '갱신 완료'
  const months = Math.max(0, monthsBetween(reference, renewalDate))
  const years = Math.floor(months / 12)
  const restMonths = months % 12
  if (years && restMonths) return `${years}년 ${restMonths}개월`
  if (years) return `${years}년`
  if (restMonths) return `${restMonths}개월`
  return '1개월 미만'
}

/**
 * 서버가 준 갱신일(nextRenewalDate)을 화면 표기값으로 바꾼다.
 * 남은 기간은 보는 사람 기준이라 서버가 아니라 여기서 계산한다.
 * @param nextRenewalDate 'YYYY-MM-DD' 또는 null(확정 증여 없음)
 * @param renewalAmount 그날 늘어나는 공제 여력(원). 서버가 10년 창 규칙으로 계산해 준다
 */
export function renewalDisplay(nextRenewalDate, renewalAmount = null, referenceDate = new Date()) {
  const reference = parseDate(referenceDate) ?? new Date()
  const renewal = parseDate(nextRenewalDate)

  return {
    nextRenewalDate: renewal ? toDotDate(renewal) : null,
    daysUntilRenewal: renewal
      ? Math.max(0, Math.ceil((renewal - reference) / (24 * 60 * 60 * 1000)))
      : null,
    resetDate: renewal ? toDotDate(renewal) : '미정',
    resetLabel: renewalLabel(reference, renewal),
    // 0원이면 그날 늘어나는 여력이 없다는 뜻이라 문구를 띄우지 않는다.
    renewalAmount: renewal && renewalAmount ? renewalAmount : null,
  }
}

export function deductionProgress({ usedAmount, deductionLimit }) {
  if (!deductionLimit) return 0
  return Math.min(100, Math.max(0, Math.round((usedAmount / deductionLimit) * 100)))
}
