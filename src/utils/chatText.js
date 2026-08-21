const STANDALONE_SEPARATOR = /^[\t ]*(?:[-_=—–―─━][\t ]*){6,}$/gm

/** 채팅 폭을 넘는 텍스트 구분선을 모바일 말풍선에 맞는 고정 길이로 줄인다. */
export function shortenChatSeparators(value) {
  return String(value ?? '').replace(STANDALONE_SEPARATOR, '──────')
}
