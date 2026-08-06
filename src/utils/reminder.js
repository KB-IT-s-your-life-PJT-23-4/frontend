import { formatCompactWon } from './finance'

// 백엔드 ReminderType (com.example.project.reminder.domain.ReminderType)
export const REMINDER_TYPE = {
  FILING_DEADLINE: 'FILING_DEADLINE',
  DEDUCTION_RENEWAL: 'DEDUCTION_RENEWAL',
}

// 알림함은 급한 것부터 본다. 그룹 순서를 배열로 고정해 화면이 정렬에 신경 쓰지 않게 한다.
export const REMINDER_GROUPS = ['기한 지남', '이번 주', '이번 달', '예정']

// 서버는 targetDate 와 daysRemaining 만 준다. "D-14" 같은 표기는 보는 시점에 따라 달라져
// 프론트 몫으로 남겨둔 것이라 여기서 만든다.
function dDayLabel(daysRemaining) {
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)}일 지남`
  if (daysRemaining === 0) return '오늘'
  return `D-${daysRemaining}`
}

function group(daysRemaining) {
  if (daysRemaining < 0) return '기한 지남'
  if (daysRemaining <= 7) return '이번 주'
  if (daysRemaining <= 30) return '이번 달'
  return '예정'
}

/**
 * 카드 색/아이콘. 두 유형은 날짜 성격이 반대라 같은 기준으로 칠하면 안 된다.
 * 신고기한은 마감일이라 임박할수록 경고지만, 갱신일은 시작일이라 지나면 오히려 좋은 소식이다.
 */
function tone(reminder) {
  if (reminder.type === REMINDER_TYPE.DEDUCTION_RENEWAL) {
    return reminder.daysRemaining <= 0 ? 'success' : 'info'
  }
  // PLANNED 도 기한은 같은 값이라 경고 기준을 낮추지 않는다. 마감은 마감이다.
  if (reminder.daysRemaining < 0) return 'warning'
  return reminder.daysRemaining <= 14 ? 'warning' : 'info'
}

/**
 * 아직 확정하지 않은(PLANNED) 증여의 신고기한.
 *
 * 예정일을 이체일로 보는 서비스라 기한 자체는 확정분과 같은 값이다. "예상"으로 흐리지 않는다 —
 * 진짜 마감인데 추정치처럼 읽히면 사용자가 느슨하게 받아들인다.
 * 다른 점은 날짜가 아니라 서류 확인이 안 끝났다는 것이라, 확정을 함께 유도한다.
 */
function plannedFilingCopy(reminder, name, amount) {
  if (reminder.daysRemaining < 0) {
    return {
      title: `${name} 님 증여의 신고기한이 지났어요`,
      body: `${amount}증여의 신고기한은 ${reminder.targetDate}였어요. 기한을 넘기면 가산세가 붙을 수 있으니 세무서에 확인해 주세요. 증여 현황에서 확정도 아직 남아 있어요.`,
    }
  }

  return {
    title: `${name} 님 증여 신고기한이 ${dDayLabel(reminder.daysRemaining)}이에요`,
    body: `${amount}증여는 ${reminder.targetDate}까지 신고해야 해요. 아직 확정 전이니 증여 현황에서 필수 서류를 확인하고 확정해 주세요.`,
  }
}

function completedFilingCopy(reminder, name, amount) {
  if (reminder.daysRemaining < 0) {
    return {
      title: `${name} 님 증여의 신고기한이 지났어요`,
      body: `${amount}증여의 신고기한은 ${reminder.targetDate}였어요. 기한을 넘기면 가산세가 붙을 수 있으니 세무서에 확인해 주세요.`,
    }
  }

  return {
    title: `${name} 님 증여 신고기한이 ${dDayLabel(reminder.daysRemaining)}이에요`,
    body: `${amount}증여는 ${reminder.targetDate}까지 신고해야 해요. 기한 안에 신고하면 산출세액의 3%를 공제받아요.`,
  }
}

function filingCopy(reminder) {
  const name = reminder.familyName ?? '수증자'
  const amount = reminder.amount ? `${formatCompactWon(reminder.amount)} ` : ''

  return reminder.status === 'PLANNED'
    ? plannedFilingCopy(reminder, name, amount)
    : completedFilingCopy(reminder, name, amount)
}

function renewalCopy(reminder) {
  const name = reminder.familyName ?? '수증자'

  if (reminder.daysRemaining <= 0) {
    return {
      title: `${name} 님의 증여 공제 한도가 갱신됐어요`,
      body: `${reminder.targetDate}부터 10년 합산에서 예전 증여가 빠져 공제 여력이 생겼어요. 증여 현황에서 남은 한도를 확인해 보세요.`,
    }
  }

  return {
    title: `${name} 님의 공제 한도 갱신이 ${dDayLabel(reminder.daysRemaining)} 남았어요`,
    body: `${reminder.targetDate}이 지나면 10년 합산에서 예전 증여가 빠져 공제 여력이 늘어나요.`,
  }
}

/**
 * 서버 리마인더 → 알림함 카드.
 *
 * 리마인더에는 고유 id 가 없어서(서버가 저장하지 않는다) `(giftId, type)`을 키로 쓴다.
 * 읽음 처리도 이 두 값을 그대로 돌려보낸다.
 */
export function toNotification(reminder) {
  const filing = reminder.type === REMINDER_TYPE.FILING_DEADLINE
  const copy = filing ? filingCopy(reminder) : renewalCopy(reminder)

  return {
    id: `reminder:${reminder.giftId}:${reminder.type}`,
    source: 'reminder',
    giftId: reminder.giftId,
    reminderType: reminder.type,
    group: group(reminder.daysRemaining),
    type: tone(reminder),
    badge: filing ? '신고기한' : '공제 갱신',
    title: copy.title,
    body: copy.body,
    time: dDayLabel(reminder.daysRemaining),
    unread: !reminder.readAt,
  }
}
