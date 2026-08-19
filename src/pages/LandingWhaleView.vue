<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '../components/layout/AppIcon.vue'
import brandSymbol from '../assets/brand-symbol.png'
import '../assets/css/landing-whale.css'

const root = ref(null)
const storyScene = ref(null)

// 인트로 재생 여부는 첫 렌더 전에 정해야 표어의 등장 지연이 한 프레임도 어긋나지 않는다.
const playIntro =
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !window.location.hash
// showIntro는 커튼이 걷히면 꺼지지만, hasIntro는 페이지가 살아 있는 동안 유지한다.
// 도중에 바뀌면 표어의 animation-delay가 재계산되어 글자가 툭 튀어나온다.
const hasIntro = ref(playIntro)
const showIntro = ref(playIntro)
let observer
let frame
let previousScrollRestoration
let introUnlockTimer

// 인트로 커튼이 걷히면(약 1초) 스크롤 잠금을 푼다. animationend가 유실되어도
// 페이지가 영영 스크롤되지 않는 일이 없도록 타이머로 한 번 더 풀어 준다.
const INTRO_UNLOCK_FALLBACK_MS = 1600

function unlockIntroScroll() {
  if (introUnlockTimer) {
    window.clearTimeout(introUnlockTimer)
    introUnlockTimer = undefined
  }
  showIntro.value = false
  document.documentElement.classList.remove('whale-intro-locked')
}

function handleIntroComplete(event) {
  if (event.animationName !== 'whale-intro-lift') return
  unlockIntroScroll()
}

function clamp(value) {
  return Math.min(1, Math.max(0, value))
}

function updateMotion() {
  frame = undefined
  const page = root.value
  const scene = storyScene.value
  if (!page) return

  const pageTravel = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
  page.style.setProperty('--page-progress', String(clamp(window.scrollY / pageTravel)))

  if (scene) {
    const rect = scene.getBoundingClientRect()
    const travel = Math.max(scene.offsetHeight - window.innerHeight, 1)
    page.style.setProperty('--story-progress', String(clamp(-rect.top / travel)))
  }
}

function requestMotion() {
  if (frame) return
  frame = window.requestAnimationFrame(updateMotion)
}

onMounted(() => {
  const page = root.value
  if (!page) return

  if ('scrollRestoration' in window.history) {
    previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
  }
  if (!window.location.hash) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }))
  }

  if (playIntro) {
    document.documentElement.classList.add('whale-intro-locked')
    introUnlockTimer = window.setTimeout(unlockIntroScroll, INTRO_UNLOCK_FALLBACK_MS)
  }

  const targets = page.querySelectorAll('[data-reveal]')
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    targets.forEach((target) => observer.observe(target))
  } else {
    targets.forEach((target) => target.classList.add('is-visible'))
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
  unlockIntroScroll()
  if ('scrollRestoration' in window.history && previousScrollRestoration) {
    window.history.scrollRestoration = previousScrollRestoration
  }
})

const concerns = [
  [
    '01',
    '어디서부터 시작해야 할지',
    '흩어진 정보를 찾고 우리 가족에게 맞는 기준을 고르기 어려워요.',
  ],
  [
    '02',
    '어떤 선택이 더 나은지',
    '지금 증여할 때와 나누어 증여할 때의 차이를 직접 계산하기 복잡해요.',
  ],
  [
    '03',
    '무엇을 물어봐야 할지',
    '전문가 상담 전에 상황과 질문을 정리하는 일부터 막막하게 느껴져요.',
  ],
]

const features = [
  {
    index: '01',
    label: 'COMPARE',
    title: '선택지를 같은 기준으로.',
    text: '증여 시점과 운용 방법에 따른 장기 결과를 한 화면에서 비교합니다.',
    icon: 'chart',
  },
  {
    index: '02',
    label: 'RECORD',
    title: '10년의 기록을 한곳에.',
    text: '잊기 쉬운 가족별 증여 내역과 계좌·상품 정보를 이어서 관리합니다.',
    icon: 'calendar',
  },
  {
    index: '03',
    label: 'ASK AI',
    title: '모르는 내용은 쉽게.',
    text: '증여와 관련된 낯선 내용을 질문하고 이해하기 쉬운 답을 확인합니다.',
    icon: 'sparkles',
  },
]

const steps = [
  {
    index: '01',
    label: 'FAMILY',
    metric: '10년',
    title: '가족 정보 입력',
    text: '가족 관계와 생년월일을 알려주세요.',
  },
  {
    index: '02',
    label: 'AMOUNT',
    metric: '5천만원',
    title: '증여 금액 입력',
    text: '계획 중인 금액과 시점을 입력해요.',
  },
  {
    index: '03',
    label: 'RESULT',
    metric: '+860만원',
    title: '맞춤 결과 확인',
    text: '선택지별 결과와 다음 행동을 확인하세요.',
  },
]

const faqs = [
  ['무료로 이용할 수 있나요?', '회원가입 후 미리줌의 기본 기능을 무료로 시작할 수 있어요.'],
  [
    '어떤 정보를 입력해야 하나요?',
    '가족 관계, 생년월일과 계획 중인 증여 금액 등 최소한의 정보를 입력해요.',
  ],
  [
    '입력한 정보는 안전하게 보관되나요?',
    '서비스 제공에 필요한 범위에서 정보를 다루며 자세한 기준은 개인정보처리방침에서 안내합니다.',
  ],
  [
    '전문적인 세무·법률 자문을 대체하나요?',
    '아니요. 계산과 AI 답변은 계획을 돕는 참고 정보이며 전문가의 개별 자문을 대체하지 않습니다.',
  ],
  [
    '결과를 다시 확인할 수 있나요?',
    '로그인하면 시뮬레이션 결과와 가족별 증여 기록을 저장할 수 있어요.',
  ],
]
</script>

<template>
  <div ref="root" class="whale-landing" :class="{ 'has-intro': hasIntro }">
    <div
      v-if="showIntro"
      class="whale-intro"
      aria-hidden="true"
      @animationend="handleIntroComplete"
    >
      <span>MIRIZOOM</span>
    </div>

    <div class="whale-progress" aria-hidden="true"><i /></div>

    <header class="whale-nav">
      <RouterLink class="whale-logo" to="/" aria-label="미리줌 홈">
        <img :src="brandSymbol" alt="" />
        <strong>미리줌</strong>
      </RouterLink>
      <nav aria-label="랜딩 페이지 메뉴">
        <a href="#why">WHY</a>
        <a href="#features">FEATURES</a>
        <a href="#how">HOW</a>
        <a href="#faq">FAQ</a>
      </nav>
      <RouterLink class="whale-login" to="/login">로그인</RouterLink>
    </header>

    <main>
      <section class="whale-hero">
        <div class="whale-hero-orbit orbit-one" />
        <div class="whale-hero-orbit orbit-two" />
        <div class="whale-shell whale-hero-inner">
          <p class="whale-mono whale-hero-kicker">THE GIFT PLANNER FOR YOUR FAMILY</p>
          <h1>
            <span><i>미리 준비하는</i></span>
            <span><i>다음 10년,</i></span>
            <em><i>증여.</i></em>
          </h1>
          <div class="whale-hero-bottom">
            <p>중요한 증여 결정을 비교하고,<br />가족의 긴 계획을 한곳에서 관리하세요.</p>
            <a href="#story" class="whale-scroll-link">SCROLL TO EXPLORE <i>↓</i></a>
          </div>
        </div>
      </section>

      <div class="whale-marquee" aria-hidden="true">
        <div>
          <span>COMPARE BEFORE YOU GIVE</span><i>✦</i><span>PLAN TEN YEARS AHEAD</span><i>✦</i
          ><span>COMPARE BEFORE YOU GIVE</span><i>✦</i><span>PLAN TEN YEARS AHEAD</span>
        </div>
      </div>

      <section id="story" ref="storyScene" class="whale-story">
        <div class="whale-story-sticky">
          <div class="whale-story-copy">
            <p class="whale-mono">A CLEARER VIEW</p>
            <h2>시간이 만드는 차이를<br />눈으로 확인하세요.</h2>
          </div>

          <div class="whale-phone" aria-label="미리줌 시뮬레이션 결과 예시">
            <div class="whale-phone-top">
              <span><img :src="brandSymbol" alt="" /> 미리줌</span><small>계산 완료</small>
            </div>
            <div class="whale-phone-copy">
              <small>김미래 님의 맞춤 결과</small>
              <span>10년 후 예상 자산</span>
              <strong>1억 4,820만원</strong>
            </div>
            <div class="whale-chart">
              <i /><i /><i />
              <svg viewBox="0 0 400 150" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="whale-chart-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#ffd966" stop-opacity=".45" />
                    <stop offset="1" stop-color="#ffd966" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path
                  class="whale-chart-fill"
                  d="M0 132 C65 122 92 104 145 102 S232 70 282 67 S345 39 400 18 V150 H0Z"
                />
                <path
                  pathLength="1"
                  class="whale-chart-line"
                  d="M0 132 C65 122 92 104 145 102 S232 70 282 67 S345 39 400 18"
                />
              </svg>
              <div><span>현재</span><span>5년</span><span>10년</span></div>
            </div>
            <div class="whale-compare-row is-best">
              <span>지금 증여</span><strong>1억 4,820만원</strong>
            </div>
            <div class="whale-compare-row">
              <span>나누어 증여</span><strong>1억 3,960만원</strong>
            </div>
          </div>

          <div class="whale-story-stat stat-one">
            <small>예상 차이</small><strong>+ 860만원</strong>
          </div>
          <div class="whale-story-stat stat-two">
            <small>장기 기록</small><strong>안전하게 저장</strong>
          </div>
          <span class="whale-story-step">01 — 03</span>
        </div>
      </section>

      <section id="why" class="whale-section whale-why">
        <div class="whale-shell">
          <div class="whale-heading" data-reveal>
            <p class="whale-mono">WHY MIRIZOOM</p>
            <h2>증여를 계획할 때,<br />누구나 한 번은 멈춥니다.</h2>
          </div>
          <div class="whale-concern-list">
            <article
              v-for="(item, index) in concerns"
              :key="item[0]"
              data-reveal
              :style="{ '--delay': `${index * 90}ms` }"
            >
              <span>{{ item[0] }}</span>
              <h3>{{ item[1] }}</h3>
              <p>{{ item[2] }}</p>
              <i>↗</i>
            </article>
          </div>
        </div>
      </section>

      <section id="features" class="whale-section whale-features">
        <div class="whale-shell">
          <div class="whale-heading is-light" data-reveal>
            <p class="whale-mono">BUILT FOR CLARITY</p>
            <h2>계획부터 기록까지.<br />한 흐름으로.</h2>
          </div>
          <div class="whale-feature-grid">
            <article
              v-for="(feature, index) in features"
              :key="feature.index"
              data-reveal
              :style="{ '--delay': `${index * 100}ms` }"
            >
              <div class="whale-feature-meta">
                <span>{{ feature.index }}</span
                ><small>{{ feature.label }}</small>
              </div>
              <div class="whale-feature-icon"><AppIcon :name="feature.icon" :size="34" /></div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.text }}</p>
              <small v-if="feature.index === '03'" class="whale-ai-note"
                >AI 답변은 일반적인 이해를 돕는 참고 정보이며 전문 세무사의 자문을 대체하지
                않습니다.</small
              >
            </article>
          </div>
        </div>
      </section>

      <section id="how" class="whale-section whale-how">
        <div class="whale-shell">
          <div class="whale-heading whale-how-heading" data-reveal>
            <p class="whale-mono">THREE STEPS</p>
            <h2>딱 세 단계면<br />충분해요.</h2>
            <p class="whale-how-sub">
              가족 정보만 알려주면 남은 계산은 미리줌이 차근차근 채워드려요.
            </p>
          </div>
          <div class="whale-how-cards">
            <article
              v-for="(step, index) in steps"
              :key="step.index"
              class="whale-how-card"
              data-reveal
              :style="{ '--delay': `${index * 90}ms` }"
            >
              <div class="whale-how-card-top">
                <span class="whale-how-card-index">{{ step.index }}</span>
                <small>{{ step.label }}</small>
              </div>
              <div class="whale-how-card-art">
                <i aria-hidden="true" />
                <strong>{{ step.metric }}</strong>
              </div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="whale-section whale-result">
        <div class="whale-shell whale-result-grid">
          <div class="whale-result-copy" data-reveal>
            <p class="whale-mono">MORE THAN NUMBERS</p>
            <h2>숫자 다음의<br />선택까지.</h2>
            <p>핵심 요약, 같은 기준의 비교, 예상 비용과 다음 행동을 함께 정리합니다.</p>
          </div>
          <div class="whale-result-card" data-reveal>
            <span class="whale-mono">RECOMMENDED PLAN</span>
            <h3>지금 증여하고<br />장기 운용하기</h3>
            <div><span>10년 후 예상 자산</span><strong>1억 4,820만원</strong></div>
            <div><span>비교안 대비 차이</span><strong>+ 860만원</strong></div>
            <p>입력한 조건에 따른 예시이며 실제 결과는 개별 상황에 따라 달라질 수 있습니다.</p>
          </div>
        </div>
      </section>

      <section class="whale-section whale-trust">
        <div class="whale-shell">
          <div class="whale-heading" data-reveal>
            <p class="whale-mono">BUILT ON TRUST</p>
            <h2>기준과 한계를<br />분명하게.</h2>
          </div>
          <div class="whale-trust-row">
            <article data-reveal>
              <AppIcon name="document" :size="27" />
              <h3>근거 있는 계산</h3>
              <p>관련 법령과 공제 기준을 바탕으로 계산 조건을 함께 안내해요.</p>
            </article>
            <article data-reveal>
              <AppIcon name="shield" :size="27" />
              <h3>개인정보 보호</h3>
              <p>필요한 정보만 다루고 가족의 기록을 안전하게 관리하기 위해 노력해요.</p>
            </article>
            <article data-reveal>
              <AppIcon name="info" :size="27" />
              <h3>명확한 역할</h3>
              <p>미리줌은 계획 도구이며 개별 판단은 전문가와 확인해야 합니다.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" class="whale-section whale-faq">
        <div class="whale-shell whale-faq-grid">
          <div class="whale-heading" data-reveal>
            <p class="whale-mono">FAQ</p>
            <h2>시작하기 전,<br />궁금한 것들.</h2>
          </div>
          <div class="whale-faq-list">
            <details v-for="(faq, index) in faqs" :key="faq[0]" :open="index === 0" data-reveal>
              <summary>
                <span>{{ String(index + 1).padStart(2, '0') }}</span
                ><strong>{{ faq[0] }}</strong
                ><i>+</i>
              </summary>
              <p>{{ faq[1] }}</p>
            </details>
          </div>
        </div>
      </section>

      <section class="whale-final">
        <div class="whale-final-ring" />
        <div class="whale-shell" data-reveal>
          <p class="whale-mono">START YOUR FAMILY PLAN</p>
          <h2>미리 보면,<br />쉬워집니다.</h2>
          <p>우리 가족의 긴 계획을 오늘부터 시작하세요.</p>
          <RouterLink to="/simulation"
            >무료로 시작하기 <AppIcon name="arrow" :size="18"
          /></RouterLink>
        </div>
      </section>
    </main>

    <footer class="whale-footer">
      <div class="whale-shell">
        <div><img :src="brandSymbol" alt="" /><strong>미리줌</strong></div>
        <nav>
          <a href="#">이용약관</a><a href="#">개인정보처리방침</a
          ><a href="mailto:help@mirizoom.kr">문의하기</a>
        </nav>
        <p>
          미리줌의 계산 결과와 AI 답변은 참고용 정보이며 세무·법률 전문가의 자문을 대체하지
          않습니다.
        </p>
        <small>© 2026 MIRIZOOM</small>
      </div>
    </footer>
  </div>
</template>
