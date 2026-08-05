export const PROFILE_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const DEMO_PROFILE_IMAGE_MAX_BYTES = 1024 * 1024

const CONTENT_TYPE_EXTENSIONS = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
}

export function validateProfileImage(file, maxBytes = PROFILE_IMAGE_MAX_BYTES) {
  if (!(file instanceof File)) return '이미지 파일을 선택해주세요.'
  if (file.size > maxBytes) {
    const megabytes = Math.floor(maxBytes / 1024 / 1024)
    return `이미지는 최대 ${megabytes}MB까지 선택할 수 있어요.`
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const allowedExtensions = CONTENT_TYPE_EXTENSIONS[file.type]
  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    return 'JPG, PNG, GIF, WebP 이미지 파일만 선택할 수 있어요.'
  }
  return ''
}

export function resolveProfileImageUrl(value) {
  if (!value || /^(blob:|data:|https?:\/\/)/i.test(value)) return value || ''

  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  if (!apiBase) return value

  const origin = globalThis.location?.origin ?? 'http://localhost'
  const resolvedBase = new URL(apiBase, origin)
  if (value.startsWith('/api/')) {
    const apiIndex = resolvedBase.pathname.lastIndexOf('/api')
    const contextPath = apiIndex >= 0 ? resolvedBase.pathname.slice(0, apiIndex) : ''
    return `${resolvedBase.origin}${contextPath}${value}`
  }

  return new URL(value.replace(/^\//, ''), `${resolvedBase.href}/`).href
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('이미지 미리보기를 저장하지 못했습니다.'))
    reader.readAsDataURL(file)
  })
}
