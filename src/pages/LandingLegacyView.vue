<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '../components/layout/AppIcon.vue'
import brandSymbol from '../assets/brand-symbol.png'
import '../assets/css/landing-legacy.css'

const landingPage = ref(null)
const graphSection = ref(null)
const productStage = ref(null)
let revealObserver
let graphFrame
let previousScrollRestoration

if ('scrollRestoration' in window.history) {
  previousScrollRestoration = window.history.scrollRestoration
  window.history.scrollRestoration = 'manual'
}

function updateGraphProgress() {
  graphFrame = undefined
  const graph = graphSection.value
  const stage = productStage.value
  if (!graph || !stage || window.innerWidth > 640) {
    landingPage.value?.style.setProperty('--graph-progress', '1')
    return
  }

  const rect = graph.getBoundingClientRect()
  const distance = Math.max(graph.offsetHeight - window.innerHeight, 1)
  const progress = Math.min(1, Math.max(0, -rect.top / distance))
  const detailsProgress = Math.min(1, Math.max(0, (progress - 0.52) / 0.2))
  const floatProgress = Math.min(1, Math.max(0, (progress - 0.7) / 0.18))
  landingPage.value?.style.setProperty('--graph-progress', String(progress))
  landingPage.value?.style.setProperty('--graph-details-progress', String(detailsProgress))
  landingPage.value?.style.setProperty('--graph-float-progress', String(floatProgress))
}

function requestGraphUpdate() {
  if (graphFrame) return
  graphFrame = window.requestAnimationFrame(updateGraphProgress)
}

onMounted(() => {
  const page = landingPage.value
  if (!page) return

  if (!window.location.hash) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      updateGraphProgress()
    })
  }

  const textTargets = page.querySelectorAll(
    '.landing-eyebrow, .landing-hero-copy h1, .landing-hero-copy > p, .landing-hero-proof, .landing-demo-copy > *, .landing-section-heading > *, .feature-copy > *, .process-list h3, .process-list p, .result-benefits li, .landing-final-cta h2, .landing-final-cta p',
  )
  const visualTargets = page.querySelectorAll(
    '.landing-product-stage, .problem-card, .feature-preview, .process-list li, .result-card, .trust-grid article, .faq-list details',
  )

  textTargets.forEach((element, index) => {
    element.classList.add('landing-reveal-text')
    element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`)
  })
  visualTargets.forEach((element, index) => {
    element.classList.add('landing-reveal-visual')
    element.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 90}ms`)
  })

  page.classList.add('is-motion-ready')
  const revealTargets = page.querySelectorAll('.landing-reveal-text, .landing-reveal-visual')
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          revealObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -7% 0px' },
    )
    revealTargets.forEach((element) => revealObserver.observe(element))
  } else {
    revealTargets.forEach((element) => element.classList.add('is-visible'))
  }

  updateGraphProgress()
  window.addEventListener('scroll', requestGraphUpdate, { passive: true })
  window.addEventListener('resize', requestGraphUpdate)
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  window.removeEventListener('scroll', requestGraphUpdate)
  window.removeEventListener('resize', requestGraphUpdate)
  if (graphFrame) window.cancelAnimationFrame(graphFrame)
  if ('scrollRestoration' in window.history && previousScrollRestoration) {
    window.history.scrollRestoration = previousScrollRestoration
  }
})

const problems = [
  {
    number: '01',
    title: '무엇부터 알아봐야 할지 막막해요',
    description: '흩어진 증여 정보를 찾고, 우리 가족에게 맞는 기준을 고르기 어려워요.',
  },
  {
    number: '02',
    title: '선택지의 차이가 한눈에 안 보여요',
    description: '지금 증여할 때와 나누어 증여할 때의 장기 결과를 직접 계산하기 복잡해요.',
  },
  {
    number: '03',
    title: '상담 전에 생각을 정리하기 어려워요',
    description: '무엇을 물어보고 어떤 자료를 준비해야 하는지 몰라 상담이 더 어렵게 느껴져요.',
  },
]

const features = [
  {
    icon: 'chart',
    label: 'COMPARE',
    title: '시나리오 비교',
    description: '증여 시점과 운용 방법에 따른 예상 결과를 같은 기준으로 비교해요.',
    type: 'compare',
  },
  {
    icon: 'calendar',
    label: 'RECORD',
    title: '장기 증여 기록 관리',
    description: '잊기 쉬운 가족별 증여 기록과 계좌·상품을 한곳에서 이어서 관리해요.',
    type: 'record',
  },
  {
    icon: 'sparkles',
    label: 'ASK AI',
    title: 'AI 증여 상담',
    description: '증여와 관련해 낯선 내용을 간단히 질문하고 이해하기 쉬운 답을 확인해요.',
    type: 'ai',
  },
]

const faqs = [
  {
    question: '무료로 이용할 수 있나요?',
    answer:
      '회원가입 후 미리줌의 기본 기능을 무료로 시작할 수 있어요. 제공 범위는 서비스 운영 정책에 따라 달라질 수 있습니다.',
  },
  {
    question: '어떤 정보를 입력해야 하나요?',
    answer:
      '가족 관계와 생년월일, 계획 중인 증여 금액 등 시뮬레이션에 필요한 최소한의 정보를 입력해요.',
  },
  {
    question: '입력한 정보는 안전하게 보관되나요?',
    answer:
      '미리줌은 서비스 제공에 필요한 범위에서 정보를 다루며, 자세한 처리 기준은 개인정보처리방침에서 안내합니다.',
  },
  {
    question: '결과가 전문적인 세무·법률 자문을 대체하나요?',
    answer:
      '아니요. 미리줌의 계산과 AI 답변은 이해와 계획 수립을 돕는 참고 정보이며, 개별 사안에 대한 세무사·변호사의 전문 자문을 대체하지 않습니다.',
  },
  {
    question: '결과를 저장하거나 다시 확인할 수 있나요?',
    answer: '로그인하면 시뮬레이션 결과와 가족별 증여 이력을 저장하고 다시 확인할 수 있어요.',
  },
]
</script>

<template>
  <div ref="landingPage" class="landing-page">
    <header class="landing-header">
      <RouterLink class="landing-logo" to="/" aria-label="미리줌 홈">
        <img :src="brandSymbol" alt="" />
        <strong>미리줌</strong>
      </RouterLink>
      <nav class="landing-nav" aria-label="랜딩 페이지 메뉴">
        <a href="#features">주요 기능</a>
        <a href="#how-it-works">이용 방법</a>
        <a href="#trust">안심 기준</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div class="landing-header-actions">
        <RouterLink class="landing-login" to="/login">로그인</RouterLink>
      </div>
    </header>

    <main>
      <section class="landing-hero">
        <div class="landing-hero-glow landing-hero-glow-one" />
        <div class="landing-hero-glow landing-hero-glow-two" />
        <div class="landing-container landing-hero-grid">
          <div class="landing-hero-copy">
            <span class="landing-eyebrow"><i /> 우리 가족 증여 플래너</span>
            <h1 class="landing-hero-title">
              <span>복잡한 미래 계획을,</span>
              <em>지금 명확하게.</em>
            </h1>
            <p>
              맞춤형 시뮬레이션으로 중요한 증여 결정을 쉽게 비교하고,<br class="desktop-only" />
              우리 가족의 긴 계획을 한곳에서 관리하세요.
            </p>
            <div class="landing-hero-proof">
              <span><AppIcon name="check" :size="15" /> 간편한 3단계 입력</span>
              <span><AppIcon name="check" :size="15" /> 결과 저장 및 관리</span>
            </div>
          </div>
        </div>
        <a class="landing-scroll-cue" href="#demo" aria-label="그래프 시연 보기">
          <span>SCROLL</span><i />
        </a>
      </section>

      <section id="demo" ref="graphSection" class="landing-demo">
        <div class="landing-demo-sticky">
          <div class="landing-container landing-demo-inner">
            <div class="landing-demo-copy">
              <span class="landing-kicker">SCROLL TO COMPARE</span>
              <h2>시간이 만드는 차이를<br />직접 확인해 보세요.</h2>
            </div>
            <div
              ref="productStage"
              class="landing-product-stage"
              aria-label="미리줌 시뮬레이션 결과 예시"
            >
              <div class="landing-product-card">
                <div class="product-window-head">
                  <span class="product-mini-logo"><img :src="brandSymbol" alt="" /></span>
                  <strong>증여 시뮬레이션</strong>
                  <span class="product-window-status"><i /> 계산 완료</span>
                </div>
                <div class="product-summary">
                  <span>김미래 님의 맞춤 결과</span>
                  <strong>10년 후 예상 자산</strong>
                  <b>1억 4,820만원</b>
                  <small>입력한 조건을 기준으로 한 예상 결과예요</small>
                </div>
                <div class="product-chart" aria-hidden="true">
                  <div class="product-chart-labels">
                    <span>1.5억</span><span>1억</span><span>5천</span>
                  </div>
                  <div class="product-chart-grid"><i /><i /><i /></div>
                  <svg viewBox="0 0 420 130" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="landing-chart-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#ffcc00" stop-opacity=".36" />
                        <stop offset="1" stop-color="#ffcc00" stop-opacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      class="product-chart-area"
                      d="M0 112 C60 105 80 91 135 88 S220 64 270 58 S340 34 420 15 V130 H0Z"
                    />
                    <path
                      class="product-chart-line"
                      pathLength="1"
                      d="M0 112 C60 105 80 91 135 88 S220 64 270 58 S340 34 420 15"
                    />
                  </svg>
                  <div class="product-chart-years">
                    <span>현재</span><span>5년</span><span>10년</span>
                  </div>
                </div>
                <div class="product-options">
                  <div>
                    <span class="option-dot is-yellow" /><span>지금 증여</span
                    ><strong>1억 4,820만원</strong>
                  </div>
                  <div>
                    <span class="option-dot is-blue" /><span>나누어 증여</span
                    ><strong>1억 3,960만원</strong>
                  </div>
                </div>
              </div>
              <div class="landing-float-card landing-float-tax">
                <span><AppIcon name="calculator" :size="18" /></span>
                <div><small>예상 절세 효과</small><strong>약 860만원</strong></div>
              </div>
              <div class="landing-float-card landing-float-family">
                <span><AppIcon name="user" :size="18" /></span>
                <div><small>가족 증여 기록</small><strong>안전하게 저장됐어요</strong></div>
                <AppIcon name="check" :size="17" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="problems" class="landing-section landing-problems">
        <div class="landing-container">
          <div class="landing-section-heading">
            <span class="landing-kicker">왜 미리줌인가요?</span>
            <h2>증여를 계획할 때,<br />이런 순간이 있지 않나요?</h2>
            <p>누구나 한 번쯤 겪는 막막함에서 미리줌은 시작했습니다.</p>
          </div>
          <div class="problem-grid">
            <article v-for="problem in problems" :key="problem.number" class="problem-card">
              <span>{{ problem.number }}</span>
              <h3>{{ problem.title }}</h3>
              <p>{{ problem.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="features" class="landing-section landing-features">
        <div class="landing-container">
          <div class="landing-section-heading is-centered">
            <span class="landing-kicker">미리줌의 핵심 기능</span>
            <h2>계획부터 기록까지,<br />한 흐름으로 이어져요.</h2>
          </div>
          <div class="feature-list">
            <article
              v-for="(feature, index) in features"
              :key="feature.title"
              class="feature-row"
              :class="{ 'is-reversed': index % 2 === 1 }"
            >
              <div class="feature-copy">
                <span class="feature-icon"><AppIcon :name="feature.icon" :size="22" /></span>
                <small>{{ feature.label }}</small>
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.description }}</p>
                <span v-if="feature.type === 'ai'" class="feature-disclaimer">
                  AI 답변은 일반적인 세법 이해를 돕는 참고 정보이며 전문 세무사의 자문을 대체하지
                  않아요.
                </span>
              </div>
              <div class="feature-preview" :class="`is-${feature.type}`">
                <template v-if="feature.type === 'compare'">
                  <span class="preview-label">시나리오 비교</span>
                  <div class="preview-result-row is-best">
                    <i>A</i><span>지금 증여 후 장기 운용<small>10년 후 예상</small></span
                    ><strong>1억 4,820만원</strong>
                  </div>
                  <div class="preview-result-row">
                    <i>B</i><span>5년 뒤 나누어 증여<small>10년 후 예상</small></span
                    ><strong>1억 3,960만원</strong>
                  </div>
                  <div class="preview-insight">
                    <AppIcon name="sparkles" :size="17" /> A안은 투자 기간을 더 길게 확보할 수
                    있어요.
                  </div>
                </template>
                <template v-else-if="feature.type === 'record'">
                  <div class="record-head">
                    <span><b>김미래</b> 님의 증여 현황</span><strong>총 3건</strong>
                  </div>
                  <div class="record-progress"><i /></div>
                  <div class="record-scale">
                    <span>사용한 공제 한도</span><strong>3,200만원 / 5,000만원</strong>
                  </div>
                  <div class="record-timeline">
                    <div>
                      <i /><span><b>2026. 08. 12</b>현금 증여 · 적금 계좌</span
                      ><strong>1,000만원</strong>
                    </div>
                    <div>
                      <i /><span><b>2024. 03. 04</b>현금 증여 · 투자 계좌</span
                      ><strong>1,200만원</strong>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="ai-message is-user">자녀에게 3천만원을 주면 증여세가 나오나요?</div>
                  <div class="ai-message is-answer">
                    <span><AppIcon name="sparkles" :size="16" /></span>
                    <p>
                      공제 한도는 자녀의 나이와 최근 10년간 받은 증여 내역에 따라 달라져요. 먼저
                      이전 증여 기록을 함께 확인해 볼까요?
                    </p>
                  </div>
                  <div class="ai-suggestions">
                    <span>공제 한도 알아보기</span><span>이전 증여 확인하기</span>
                  </div>
                </template>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" class="landing-section landing-process">
        <div class="landing-container">
          <div class="landing-section-heading is-centered is-light">
            <span class="landing-kicker">간단한 이용 과정</span>
            <h2>딱 세 단계면 충분해요.</h2>
            <p>어려운 세법 용어 없이, 알고 있는 정보부터 입력하세요.</p>
          </div>
          <ol class="process-list">
            <li>
              <span>01</span><i><AppIcon name="user" :size="26" /></i>
              <h3>가족 정보 입력</h3>
              <p>증여할 가족과 관계,<br />생년월일을 알려주세요.</p>
            </li>
            <li>
              <span>02</span><i><AppIcon name="wallet" :size="26" /></i>
              <h3>증여 금액 입력</h3>
              <p>계획 중인 금액과<br />시점을 간단히 입력해요.</p>
            </li>
            <li>
              <span>03</span><i><AppIcon name="chart" :size="26" /></i>
              <h3>맞춤 결과 확인</h3>
              <p>선택지별 예상 결과와<br />다음 행동을 확인하세요.</p>
            </li>
          </ol>
          <RouterLink class="landing-button landing-process-cta" to="/simulation">
            내 증여 계획 확인하기 <AppIcon name="arrow" :size="18" />
          </RouterLink>
        </div>
      </section>

      <section class="landing-section landing-result">
        <div class="landing-container landing-result-grid">
          <div class="landing-section-heading">
            <span class="landing-kicker">결과 미리보기</span>
            <h2>숫자만 보여주지 않고,<br />다음 선택까지 안내해요.</h2>
            <p>같은 조건으로 선택지를 비교하고, 지금 확인해야 할 내용을 함께 정리합니다.</p>
            <ul class="result-benefits">
              <li><AppIcon name="check" :size="16" /> 핵심 결과를 한 문장으로 요약</li>
              <li><AppIcon name="check" :size="16" /> 같은 기준으로 선택지 비교</li>
              <li><AppIcon name="check" :size="16" /> 예상 비용과 다음 행동 제안</li>
            </ul>
          </div>
          <div class="result-card">
            <div class="result-card-head"><span>맞춤 결과 요약</span><small>예시 화면</small></div>
            <div class="result-recommend">
              <span><AppIcon name="sparkles" :size="18" /></span>
              <div><small>추천 시나리오</small><strong>지금 증여하고 장기 운용하기</strong></div>
            </div>
            <div class="result-metrics">
              <div><span>10년 후 예상 자산</span><strong>1억 4,820만원</strong></div>
              <div><span>비교안 대비 차이</span><strong class="is-positive">+ 860만원</strong></div>
            </div>
            <div class="result-next">
              <small>NEXT STEP</small><strong>최근 10년간 증여 내역을 확인해 보세요.</strong
              ><AppIcon name="arrow" :size="17" />
            </div>
            <p>
              본 결과는 입력한 조건에 따른 예시이며, 실제 세금과 결과는 개별 상황에 따라 달라질 수
              있습니다.
            </p>
          </div>
        </div>
      </section>

      <section id="trust" class="landing-section landing-trust">
        <div class="landing-container">
          <div class="landing-section-heading is-centered">
            <span class="landing-kicker">안심하고 계획하세요</span>
            <h2>중요한 결정인 만큼,<br />기준과 한계를 분명하게.</h2>
          </div>
          <div class="trust-grid">
            <article>
              <span><AppIcon name="document" :size="24" /></span>
              <h3>근거 있는 계산 기준</h3>
              <p>
                관련 법령과 공제 기준을 바탕으로 계산하며, 기준이 되는 조건을 결과와 함께 안내해요.
              </p>
            </article>
            <article>
              <span><AppIcon name="shield" :size="24" /></span>
              <h3>개인정보 보호</h3>
              <p>
                서비스 제공에 필요한 정보만 다루고, 가족의 소중한 기록을 안전하게 관리하기 위해
                노력해요.
              </p>
            </article>
            <article>
              <span><AppIcon name="info" :size="24" /></span>
              <h3>명확한 역할과 한계</h3>
              <p>
                미리줌은 계획을 돕는 도구입니다. 개별 세무·법률 판단은 반드시 전문가와 확인해
                주세요.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" class="landing-section landing-faq">
        <div class="landing-container landing-faq-grid">
          <div class="landing-section-heading">
            <span class="landing-kicker">자주 묻는 질문</span>
            <h2>시작하기 전,<br />궁금한 점을 확인하세요.</h2>
          </div>
          <div class="faq-list">
            <details v-for="(faq, index) in faqs" :key="faq.question" :open="index === 0">
              <summary>
                <span>{{ faq.question }}</span
                ><i><AppIcon name="plus" :size="18" /></i>
              </summary>
              <p>{{ faq.answer }}</p>
            </details>
          </div>
        </div>
      </section>

      <section class="landing-final-cta">
        <div class="landing-final-orbit" />
        <div class="landing-container">
          <span class="landing-eyebrow"><i /> 우리 가족의 긴 계획을 오늘부터</span>
          <h2>복잡한 증여,<br />미리 보면 쉬워집니다.</h2>
          <p>비교하고 기록하며 우리 가족에게 맞는 답을 찾아보세요.</p>
          <div class="landing-hero-actions is-centered">
            <RouterLink class="landing-button" to="/simulation"
              >무료로 시작하기 <AppIcon name="arrow" :size="18"
            /></RouterLink>
          </div>
        </div>
      </section>
    </main>

    <footer class="landing-footer">
      <div class="landing-container">
        <div class="landing-footer-brand">
          <span><img :src="brandSymbol" alt="" /></span>
          <div><strong>미리줌</strong><small>우리 가족 증여 플래너</small></div>
        </div>
        <div class="landing-footer-links">
          <a href="#">이용약관</a><a href="#">개인정보처리방침</a
          ><a href="mailto:help@mirizoom.kr">문의하기</a>
        </div>
        <p>
          미리줌이 제공하는 계산 결과와 AI 답변은 참고용 정보이며, 세무·법률 전문가의 자문을
          대체하지 않습니다.
        </p>
        <small>© 2026 MiriZoom. All rights reserved.</small>
      </div>
    </footer>
  </div>
</template>
