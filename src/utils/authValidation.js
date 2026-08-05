const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ENGLISH_PATTERN = /[A-Za-z]/
const DIGIT_PATTERN = /\d/
const ASCII_SPECIAL_PATTERN = /[!-/:-@[-`{-~]/
const PRINTABLE_ASCII_PATTERN = /^[\x21-\x7e]{8,64}$/
const PHONE_PATTERN = /^01[016789]-\d{3,4}-\d{4}$/
const BIRTH_DATE_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2})$/

export function validateName(value) {
  const name = value.trim()
  if (!name) return '이름을 입력해주세요.'
  if (name.length < 2 || name.length > 50) {
    return '이름은 2자 이상 50자 이하로 입력해주세요.'
  }
  return ''
}

export function validateEmail(value) {
  const email = value.trim()
  if (!email) return '이메일을 입력해주세요.'
  if (email.length > 255 || !EMAIL_PATTERN.test(email)) {
    return '올바른 이메일 형식이 아닙니다.'
  }
  return ''
}

export function validatePassword(value, { login = false } = {}) {
  if (!value) return '비밀번호를 입력해주세요.'
  if (login) return ''
  const isValid =
    PRINTABLE_ASCII_PATTERN.test(value) &&
    ENGLISH_PATTERN.test(value) &&
    DIGIT_PATTERN.test(value) &&
    ASCII_SPECIAL_PATTERN.test(value)

  if (!isValid) {
    return '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.'
  }
  return ''
}

export function validateBirthDate(value) {
  if (!value) return '생년월일을 입력해주세요.'

  const match = value.match(BIRTH_DATE_PATTERN)
  if (!match) return '생년월일을 YYYY.MM.DD 형식으로 입력해주세요.'

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const isValid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) &&
    date <= new Date()

  return isValid ? '' : '올바른 생년월일을 입력해주세요.'
}

export function validatePhone(value) {
  if (!value) return '전화번호를 입력해주세요.'
  return PHONE_PATTERN.test(value) ? '' : '올바른 전화번호 형식이 아닙니다.'
}

export function formatBirthDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
}

export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}
