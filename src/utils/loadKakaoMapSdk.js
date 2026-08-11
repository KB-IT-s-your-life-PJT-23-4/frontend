let kakaoMapLoadingPromise = null

/**
 * 카카오 지도 JavaScript SDK를 동적으로 로드한다.
 * 여러 번 호출해도 실제 스크립트 삽입은 1회만 일어난다.
 *
 * @returns {Promise<typeof window.kakao>}
 */
export function loadKakaoMapSdk() {
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao)
  }

  if (kakaoMapLoadingPromise) {
    return kakaoMapLoadingPromise
  }

  kakaoMapLoadingPromise = new Promise((resolve, reject) => {
    const appKey = import.meta.env.VITE_KAKAO_JS_KEY

    if (!appKey) {
      reject(new Error('카카오 지도 키가 설정되어 있지 않습니다.'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao))
    }
    script.onerror = () => {
      kakaoMapLoadingPromise = null
      reject(new Error('카카오 지도를 불러오지 못했어요.'))
    }

    document.head.appendChild(script)
  })

  return kakaoMapLoadingPromise
}
