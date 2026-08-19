<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '../components/layout/AppIcon.vue'
import brandMark from '../assets/brand-mark.png'
import '../assets/css/landing.css'

const root = ref(null)
const navLight = ref(true)

let frame
let observer
let scenes = []

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

function updateMotion() {
  frame = undefined
  const page = root.value
  if (!page) return

  const viewportHeight = window.innerHeight
  const pageTravel = Math.max(document.documentElement.scrollHeight - viewportHeight, 1)
  page.style.setProperty('--page-progress', String(clamp01(window.scrollY / pageTravel)))

  scenes.forEach((scene) => {
    const rect = scene.getBoundingClientRect()
    const travel = Math.max(scene.offsetHeight - viewportHeight, 1)
    scene.style.setProperty('--p', String(clamp01(-rect.top / travel)))
  })

  // 밝은 배경(히어로·마지막 CTA) 위에서는 내비게이션 색을 뒤집는다.
  const navEdge = 96
  const hero = page.querySelector('.mz-hero')
  const final = page.querySelector('.mz-final')
  const overHero = hero ? hero.getBoundingClientRect().bottom > navEdge : false
  const overFinal = final ? final.getBoundingClientRect().top < navEdge : false
  navLight.value = overHero || overFinal
}

function requestMotion() {
  if (frame) return
  frame = window.requestAnimationFrame(updateMotion)
}

onMounted(() => {
  const page = root.value
  if (!page) return

  document.documentElement.classList.add('mz-landing-active')
  scenes = Array.from(page.querySelectorAll('[data-scene]'))

  const revealTargets = page.querySelectorAll('[data-reveal]')
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )
    revealTargets.forEach((target) => observer.observe(target))
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'))
  }

  updateMotion()
  window.addEventListener('scroll', requestMotion, { passive: true })
  window.addEventListener('resize', requestMotion)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (frame) window.cancelAnimationFrame(frame)
  window.removeEventListener('scroll', requestMotion)
  window.removeEventListener('resize', requestMotion)
  document.documentElement.classList.remove('mz-landing-active')
  scenes = []
})

const heroAssets = ['현금', '예금', '주식', '펀드', '채권', '보험']

const stackCards = [
  {
    label: 'LIMIT',
    icon: 'wallet',
    title: '한도를\n정확하게',
    text: '가족별 공제 한도와 남은 금액을 자동으로 계산해 보여줍니다.',
  },
  {
    label: 'SIMULATION',
    icon: 'calculator',
    title: '결과를\n미리',
    text: '지금 증여할 때와 나누어 증여할 때를 같은 조건으로 계산합니다.',
  },
  {
    label: 'COMPARE',
    icon: 'chart',
    title: '선택을\n나란히',
    text: '세금과 10년 뒤 자산, 예상 비용을 한 화면에서 비교합니다.',
  },
  {
    label: 'RECORD',
    icon: 'calendar',
    title: '10년을\n이어서',
    text: '잊기 쉬운 증여 이력과 계좌·상품 정보를 한곳에 모아 둡니다.',
  },
  {
    label: 'ASK AI',
    icon: 'sparkles',
    title: '어려운 건\n물어보고',
    text: '증여와 관련된 낯선 내용을 쉬운 말로 확인할 수 있습니다.',
  },
  {
    label: 'REPORT',
    icon: 'document',
    title: '신고까지\n준비',
    text: '증여 신고에 필요한 서류와 일정을 미리 챙겨 둡니다.',
  },
]

const flowAssets = [
  { name: '현금', amount: '4,200만원', x: -34, y: -26, delay: 0 },
  { name: '예금', amount: '3,100만원', x: 32, y: -32, delay: 1 },
  { name: '주식', amount: '2,800만원', x: -40, y: 14, delay: 2 },
  { name: '펀드', amount: '1,900만원', x: 38, y: 10, delay: 3 },
  { name: '채권', amount: '1,400만원', x: -26, y: 34, delay: 4 },
  { name: '보험', amount: '1,420만원', x: 28, y: 36, delay: 5 },
]

const orbitTiles = Array.from({ length: 12 }, (_, index) => index * 30)

const strips = [
  { speed: 300, screens: ['증여 현황', '시뮬레이션', '가족 관리'] },
  { speed: -420, screens: ['AI 상담', '한도 확인', '증여 이력'] },
  { speed: 240, screens: ['비교 결과', '신고 준비', '알림'] },
]

const footerLinks = [
  { label: '이용약관', href: '#' },
  { label: '개인정보처리방침', href: '#' },
  { label: '문의하기', href: 'mailto:help@mirizoom.kr' },
]
</script>

<template>
  <div ref="root" class="mz-landing">
    <div class="mz-progress" aria-hidden="true"><i /></div>

    <header class="mz-nav" :class="{ 'is-light': navLight }">
      <RouterLink class="mz-brand" to="/" aria-label="미리줌 홈">
        <span class="mz-brand-mark"><img :src="brandMark" alt="" /></span>
        <strong>미리줌</strong>
      </RouterLink>
      <div class="mz-nav-actions">
        <RouterLink class="mz-nav-login" to="/login">로그인</RouterLink>
        <RouterLink class="mz-nav-cta" to="/simulation">시뮬레이션 시작</RouterLink>
      </div>
    </header>

    <main>
      <section class="mz-hero">
        <div class="mz-hero-inner">
          <p class="mz-micro mz-hero-rail is-left">MIRIZOOM · 증여 플래너</p>
          <p class="mz-micro mz-hero-rail is-right">시뮬레이션 / 한도 관리 / AI 상담</p>

          <div class="mz-hero-copy">
            <h1>
              <span>복잡한 증여.</span>
              <span>미리 계산.</span>
              <span>걱정 없이.</span>
            </h1>
            <div class="mz-hero-lead">
              <ul class="mz-hero-assets" aria-label="계산에 반영되는 자산 종류">
                <li v-for="(asset, index) in heroAssets" :key="asset" :style="{ '--i': index }">
                  {{ asset }}
                </li>
              </ul>
              <p>
                감이 아니라 기준으로.<br />
                공제 한도와 세금, 10년 뒤 결과까지 같은 조건으로 비교합니다.
              </p>
            </div>
            <RouterLink class="mz-hero-cta" to="/simulation">
              무료로 시작하기 <AppIcon name="arrow" :size="17" />
            </RouterLink>
          </div>

          <div class="mz-hero-panel">
            <div class="mz-hero-index"><i /><span>01</span></div>

            <div class="mz-hero-card">
              <div class="mz-hero-card-head">
                <span>10년 후 예상 자산</span>
                <small>계산 완료</small>
              </div>
              <strong class="mz-hero-card-value">1억 4,820만원</strong>
              <div class="mz-hero-chart">
                <svg viewBox="0 0 320 140" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="mz-hero-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="#ffcc00" stop-opacity=".38" />
                      <stop offset="1" stop-color="#ffcc00" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    class="mz-hero-chart-fill"
                    d="M0 122 C52 116 74 96 116 92 S186 60 226 56 S276 26 320 10 V140 H0Z"
                  />
                  <path
                    class="mz-hero-chart-line"
                    pathLength="1"
                    d="M0 122 C52 116 74 96 116 92 S186 60 226 56 S276 26 320 10"
                  />
                </svg>
                <div class="mz-hero-chart-axis">
                  <span>현재</span><span>5년</span><span>10년</span>
                </div>
              </div>
            </div>

            <div class="mz-hero-tile">
              <span>10년 플랜 연결됨</span>
              <AppIcon name="check" :size="18" />
            </div>

            <p class="mz-hero-note">
              공제 한도부터 세금까지, 한 화면에서.<br />
              가족 단위로 이어지는 기록.
            </p>
          </div>
        </div>
      </section>

      <section id="features" class="mz-scene mz-stack" data-scene>
        <div class="mz-scene-sticky">
          <p class="mz-micro mz-rail is-left">한 겹씩<br />쌓이는 계획</p>
          <p class="mz-micro mz-rail is-right">증여를<br />복잡하지 않게</p>

          <div class="mz-stack-deck">
            <article
              v-for="(card, index) in stackCards"
              :key="card.label"
              class="mz-stack-card"
              :style="{ '--i': index, '--n': stackCards.length + 1 }"
            >
              <span class="mz-micro">{{ card.label }}</span>
              <AppIcon :name="card.icon" :size="30" />
              <h3>{{ card.title }}</h3>
              <p>{{ card.text }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="mz-scene mz-flow" data-scene>
        <div class="mz-scene-sticky">
          <p class="mz-micro mz-rail is-left">흩어진 자산이<br />하나의 현황으로</p>
          <p class="mz-micro mz-rail is-right">가족 전체를<br />한 번에</p>

          <div class="mz-flow-stage">
            <span
              v-for="asset in flowAssets"
              :key="asset.name"
              class="mz-flow-chip"
              :style="{ '--x': asset.x, '--y': asset.y, '--d': asset.delay }"
            >
              <small>{{ asset.name }}</small>
              <strong>{{ asset.amount }}</strong>
            </span>

            <div class="mz-flow-card">
              <span class="mz-micro">총 증여 자산</span>
              <strong>1억 4,820<em>만원</em></strong>
              <p>연결된 가족 3명 기준으로 합산했습니다.</p>
              <div class="mz-flow-bars"><i /><i /><i /><i /></div>
            </div>

            <h2 class="mz-flow-title">보이는 만큼<br />쉬워집니다.</h2>
          </div>
        </div>
      </section>

      <section class="mz-scene mz-orbit" data-scene>
        <div class="mz-scene-sticky">
          <p class="mz-micro mz-rail is-left">가족 모두의<br />계획을 한곳에</p>
          <p class="mz-micro mz-rail is-right">실제 가족을<br />위해 만들었습니다</p>

          <div class="mz-orbit-stage">
            <i v-for="angle in orbitTiles" :key="angle" :style="{ '--a': `${angle}deg` }" />
            <div class="mz-orbit-core">
              <img :src="brandMark" alt="" />
              <strong>미리줌</strong>
              <p>가족의 증여를 한 흐름으로 잇습니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cycle" class="mz-scene mz-cycle" data-scene>
        <div class="mz-scene-sticky">
          <div class="mz-cycle-head">
            <p class="mz-micro">10년마다 다시 시작되는 한도</p>
            <h2>10년을 알면,<br />순서가 보입니다.</h2>
            <p class="mz-cycle-sub">
              증여 공제는 10년 단위로 합산됩니다. 남은 한도와 다음 갱신 시점을 미리 확인하세요.
            </p>
          </div>

          <div class="mz-cycle-stage">
            <div class="mz-cycle-ticks is-left" aria-hidden="true">
              <i v-for="tick in 5" :key="`l-${tick}`" :style="{ '--t': tick - 1 }" />
            </div>

            <div class="mz-cycle-card">
              <div class="mz-cycle-card-head">
                <span>자녀 공제 한도</span>
                <small>10년 합산</small>
              </div>
              <strong>3,200<em>만원</em> <span>/ 5,000만원</span></strong>
              <div class="mz-cycle-gauge"><i /></div>
              <div class="mz-cycle-meta">
                <span>남은 한도</span>
                <strong>1,800만원</strong>
              </div>
            </div>

            <div class="mz-cycle-ticks is-right" aria-hidden="true">
              <i v-for="tick in 5" :key="`r-${tick}`" :style="{ '--t': tick - 1 }" />
            </div>
          </div>

          <p class="mz-cycle-mono"><span>다음 갱신</span> 2031.04</p>
        </div>
      </section>

      <section class="mz-scene mz-strip" data-scene>
        <div class="mz-scene-sticky">
          <p class="mz-micro mz-rail is-left">같은 계획<br />다른 순간</p>
          <p class="mz-micro mz-rail is-right">하나의 흐름<br />매일의 기록</p>

          <div class="mz-strip-stage" aria-hidden="true">
            <div
              v-for="(strip, index) in strips"
              :key="index"
              class="mz-strip-column"
              :style="{ '--speed': strip.speed }"
            >
              <div v-for="screen in strip.screens" :key="screen" class="mz-strip-phone">
                <span class="mz-strip-phone-label">{{ screen }}</span>
                <i /><i /><i />
              </div>
            </div>
          </div>

          <h2 class="mz-strip-title" data-reveal>
            증여는 한 번이 아니라<br />
            <em>10년의 흐름</em>입니다.
          </h2>
        </div>
      </section>

      <section class="mz-final">
        <div class="mz-final-inner" data-reveal>
          <p class="mz-micro">START YOUR FAMILY PLAN</p>
          <h2>미리 보면,<br />쉬워집니다.</h2>
          <p class="mz-final-sub">우리 가족의 10년 계획을 오늘 시작하세요.</p>
          <div class="mz-final-actions">
            <RouterLink class="mz-final-primary" to="/simulation">
              무료로 시작하기 <AppIcon name="arrow" :size="17" />
            </RouterLink>
            <RouterLink class="mz-final-ghost" to="/login">로그인</RouterLink>
          </div>
        </div>
        <span class="mz-final-wordmark" aria-hidden="true">MIRIZOOM</span>
      </section>
    </main>

    <footer class="mz-footer">
      <div class="mz-footer-inner">
        <div class="mz-footer-brand">
          <img :src="brandMark" alt="" />
          <strong>미리줌</strong>
        </div>
        <nav aria-label="footer">
          <a v-for="link in footerLinks" :key="link.label" :href="link.href">{{ link.label }}</a>
        </nav>
        <p>
          미리줌의 계산 결과와 AI 답변은 계획을 돕기 위한 참고 정보이며, 세무·법률 전문가의 개별
          자문을 대체하지 않습니다.
        </p>
        <small>© 2026 MIRIZOOM</small>
      </div>
    </footer>
  </div>
</template>
