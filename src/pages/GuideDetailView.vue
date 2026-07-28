<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'

const route = useRoute()
const guides = {
  mirizoom: {
    title: '미리줌 이용 가이드',
    intro:
      '안녕하세요, 미리줌입니다 :)\n처음 이용하시는 분들을 위해 서비스 이용 방법을 쉽게 안내해드릴게요.',
    sections: [
      [
        "미리줌은 '현금 증여'만 다루고 있어요",
        [
          '미리줌은 부동산이나 주식 같은 다양한 자산이 아니라, 현금 증여에만 집중하고 있어요.',
          '미리줌은 자녀에게 최대한 목돈을 쥐여줄 수 있는 방법을 찾는 데 특화된 서비스이기 때문이에요. 여러 자산을 폭넓게 다루기보다, 현금 증여 하나만큼은 가장 정확하고 도움이 되게 안내해드리고 있습니다.',
        ],
      ],
      [
        '시뮬레이션, 이렇게 사용해보세요',
        [
          '1. 자녀 선택하고 증여 금액 입력하기\n증여하고 싶은 자녀를 선택한 뒤, 얼마를 증여하고 싶은지 금액을 입력해주세요.',
          '2. 증여 기간 정하기\n증여를 한 번에 하실지, 여러 해에 걸쳐 나눠서 하실지 기간을 정해주세요. 최소 1년부터 최대 20년까지 설정하실 수 있어요.\n\n기간에 따라 포트폴리오에 담기는 상품도 달라져요. 예를 들어 저축보험은 10년 이상 유지해야 비과세 혜택을 받을 수 있어서, 짧은 기간을 선택하시면 포트폴리오 구성에서 제외되거나 다른 상품으로 대체될 수 있어요.',
          '3. 증여세, 누가 부담할지 알려주세요\n자녀가 세금을 낼 경우: 증여 금액 안에서 예상 세금만큼을 미리 계산해드려요.\n부모님이 세금을 대신 낼 경우: 세금까지 함께 증여하는 것으로 보고, 추가로 필요한 증여액까지 계산해드려요.',
          '4. 미리줌이 알려주는 최적의 시나리오 받아보기\n입력하신 정보를 바탕으로, 미리줌이 가장 알맞은 증여 방법을 추천해드려요.\n\n미리줌이 제안하는 증여 일정과, 고객님의 상황에 딱 맞는 10년 포트폴리오를 확인해보세요! 포트폴리오 안에서 여러 금융 상품을 비교해보면서, 원하시는 상품으로 증여 계획을 완성하실 수 있어요.',
        ],
      ],
    ],
  },
  'tax-brackets': {
    title: '과세 구간 확인하기',
    intro: '증여세는 과세표준에 따라 10%부터 50%까지 누진세율이 적용됩니다.',
    sections: [
      ['과세표준 1억 원 이하', '세율 10%'],
      ['과세표준 1억 원 초과 ~ 5억 원 이하', '세율 20%, 누진공제 1천만 원'],
      ['과세표준 5억 원 초과', '구간별 세율과 누진공제를 적용해 계산합니다.'],
    ],
  },
  'gift-reporting': {
    title: '증여세 신고 방법 A-Z',
    intro:
      '증여세 신고 및 납부는 증여받은 날이 속하는 달의 말일부터 3개월 이내에 해야 해요.\n신고 기한부터 구비 서류, 분할납부까지 순서대로 안내해드릴게요.',
    sections: [],
  },
  'non-cash-gifts': {
    title: '현금 외 증여에 대하여',
    intro: '부동산·주식 등 비현금 자산은 증여일 기준 평가액이 중요합니다.',
    sections: [
      ['부동산', '시가를 우선 적용하며, 조건에 따라 보충적 평가방법을 사용합니다.'],
      ['주식', '상장·비상장 여부에 따라 평가 기준이 다르므로 확인이 필요합니다.'],
      ['유의 사항', '자산별 취득세·양도소득세 등 부수 세금도 함께 검토하세요.'],
    ],
  },
}
const guide = computed(() => guides[route.params.slug] ?? guides.mirizoom)
const isMirizoomGuide = computed(() => route.params.slug === 'mirizoom')
const isTaxGuide = computed(() => route.params.slug === 'tax-brackets')
const isGiftReportingGuide = computed(() => route.params.slug === 'gift-reporting')
const isNonCashGuide = computed(() => route.params.slug === 'non-cash-gifts')
const activeNonCashChapter = ref('real-estate')
const activeReportingMethod = ref('online')
</script>

<template>
  <div class="page guide-detail-page">
    <AppHeader />
    <main class="page-content guide-detail-content">
      <RouterLink class="text-link back-link" to="/"
        ><AppIcon name="chevron" :size="16" /> 홈으로</RouterLink
      >
      <h1>{{ guide.title }}</h1>
      <p class="guide-intro">{{ guide.intro }}</p>
      <section v-if="isMirizoomGuide" class="mirizoom-guide">
        <article class="guide-highlight-card">
          <span class="guide-highlight-label">미리줌의 기준</span>
          <h2>현금 증여에만<br />집중하고 있어요.</h2>
          <p>
            미리줌은 부동산이나 주식 같은 다양한 자산이 아니라, <strong>현금 증여</strong>에만
            집중하고 있어요.
          </p>
          <p>
            자녀에게 최대한 목돈을 쥐여줄 수 있는 방법을 찾는 데 특화된 서비스이기 때문이에요. 여러
            자산을 폭넓게 다루기보다, 현금 증여 하나만큼은 가장 정확하고 도움이 되게 안내해드리고
            있습니다.
          </p>
        </article>

        <div class="guide-flow-heading">
          <span class="section-kicker">시뮬레이션 사용 방법</span>
          <h2>이렇게 사용해보세요</h2>
          <p>네 가지 정보만 입력하면 나에게 맞는 증여 계획을 확인할 수 있어요.</p>
        </div>

        <ol class="guide-step-list">
          <li class="guide-step-card">
            <span class="guide-step-number">01</span>
            <div>
              <h3>자녀 선택하고 증여 금액 입력하기</h3>
              <p>증여하고 싶은 자녀를 선택한 뒤, 얼마를 증여하고 싶은지 금액을 입력해주세요.</p>
            </div>
          </li>
          <li class="guide-step-card">
            <span class="guide-step-number">02</span>
            <div>
              <h3>증여 기간 정하기</h3>
              <p>
                증여를 한 번에 하실지, 여러 해에 걸쳐 나눠서 하실지 기간을 정해주세요.
                <strong>최소 1년부터 최대 20년</strong>까지 설정할 수 있어요.
              </p>
              <aside class="guide-tip">
                <strong>알아두세요</strong
                ><span
                  >기간에 따라 포트폴리오 상품이 달라져요. 저축보험은 10년 이상 유지해야 비과세
                  혜택을 받을 수 있어, 짧은 기간을 선택하면 다른 상품으로 대체될 수 있어요.</span
                >
              </aside>
            </div>
          </li>
          <li class="guide-step-card">
            <span class="guide-step-number">03</span>
            <div>
              <h3>증여세 부담자 선택하기</h3>
              <div class="tax-choice-list">
                <p>
                  <strong>자녀가 세금을 낼 경우</strong
                  ><span>증여 금액 안에서 예상 세금만큼을 미리 계산해드려요.</span>
                </p>
                <p>
                  <strong>부모님이 대신 낼 경우</strong
                  ><span
                    >세금까지 함께 증여하는 것으로 보고, 추가로 필요한 증여액까지
                    계산해드려요.</span
                  >
                </p>
              </div>
            </div>
          </li>
          <li class="guide-step-card">
            <span class="guide-step-number">04</span>
            <div>
              <h3>나에게 맞는 시나리오 확인하기</h3>
              <p>입력하신 정보를 바탕으로 미리줌이 가장 알맞은 증여 방법을 추천해드려요.</p>
              <p>
                제안하는 증여 일정과 고객님 상황에 맞는 <strong>10년 포트폴리오</strong>를
                확인해보세요. 여러 금융 상품을 비교해 원하는 상품으로 증여 계획을 완성할 수 있어요.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <section v-else-if="isTaxGuide" class="tax-guide">
        <article class="tax-guide-hero">
          <span>증여세 핵심 요약</span>
          <h2>과세표준과 세율,<br />한눈에 확인하세요.</h2>
          <p>증여재산공제 후 남은 과세표준에 따라 세율과 누진공제가 달라져요.</p>
        </article>

        <article class="tax-table-card">
          <h2>증여세 과세표준 및 세율표</h2>
          <div class="tax-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>과세표준</th>
                  <th>세율</th>
                  <th>누진공제</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1억 원 이하</td>
                  <td>10%</td>
                  <td>없음</td>
                </tr>
                <tr>
                  <td>1억 원 초과<br />~ 5억 원 이하</td>
                  <td>20%</td>
                  <td>1,000만 원</td>
                </tr>
                <tr>
                  <td>5억 원 초과<br />~ 10억 원 이하</td>
                  <td>30%</td>
                  <td>6,000만 원</td>
                </tr>
                <tr>
                  <td>10억 원 초과<br />~ 30억 원 이하</td>
                  <td>40%</td>
                  <td>1억 6,000만 원</td>
                </tr>
                <tr>
                  <td>30억 원 초과</td>
                  <td>50%</td>
                  <td>4억 6,000만 원</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="guide-caption">
            세율은 과세표준에 적용하며, 누진공제는 누진세율 계산 시 세액에서 차감하는 금액이에요.
          </p>
        </article>

        <article class="deduction-limit-card">
          <span class="section-kicker">증여재산공제 한도</span>
          <h2>자녀에게 증여할 때</h2>
          <div class="deduction-limit-grid">
            <div>
              <span>성년 자녀</span><strong>5,000만 원</strong><small>10년 합산 기준</small>
            </div>
            <div>
              <span>미성년 자녀</span><strong>2,000만 원</strong><small>10년 합산 기준</small>
            </div>
          </div>
        </article>

        <article class="tax-example-card">
          <h2>성년 자녀에게 1억 5,000만 원을 증여한다면?</h2>
          <div class="tax-short-example">
            <span>증여 금액 <b>1억 5,000만 원</b></span
            ><i>−</i><span>증여재산공제 <b>5,000만 원</b></span
            ><i>=</i><strong>과세표준 1억 원</strong>
          </div>
          <p>과세표준 1억 원에는 세율 10%가 적용되어, 산출세액은 <b>1,000만 원</b>이에요.</p>
        </article>
      </section>
      <section v-else-if="isGiftReportingGuide" class="tax-guide gift-reporting-guide">
        <article class="tax-guide-hero">
          <span>증여세 신고·납부 가이드</span>
          <h2>증여세 신고,<br />언제 어떻게 하나요?</h2>
          <p>
            증여받은 날이 속하는 달의 말일부터 3개월 이내에 신고하고 납부해야 해요. 기한 안에
            신고하면 세액의 3%를 공제받을 수 있어요.
          </p>
        </article>

        <article class="guide-section">
          <h2>신고 기한과 납부의무자</h2>
          <div class="info-pair">
            <div><strong>신고·납부 기한</strong><span>증여받은 달의 말일부터 3개월 이내</span></div>
            <div>
              <strong>납부의무자</strong
              ><span>재산을 증여받은 사람(수증자)이 납세지 관할 세무서에 신고·납부해요.</span>
            </div>
          </div>
          <div class="tax-summary">
            <strong>기한 내 신고하면</strong><span>신고세액공제 3%</span>
            <p>증여세 신고기한 내에 신고서를 제출하면 세액의 3%를 공제받을 수 있어요.</p>
          </div>
        </article>

        <article class="guide-section">
          <h2>신고 절차, 이렇게 진행돼요</h2>
          <p>홈택스 온라인 신고와 세무서 방문 신고, 두 가지 방법 중 편한 방법을 선택하세요.</p>

          <div class="chapter-tabs" role="tablist" aria-label="증여세 신고 방법">
            <button
              :class="{ active: activeReportingMethod === 'online' }"
              type="button"
              role="tab"
              :aria-selected="activeReportingMethod === 'online'"
              @click="activeReportingMethod = 'online'"
            >
              홈택스 온라인 신고
            </button>
            <button
              :class="{ active: activeReportingMethod === 'visit' }"
              type="button"
              role="tab"
              :aria-selected="activeReportingMethod === 'visit'"
              @click="activeReportingMethod = 'visit'"
            >
              세무서 방문 신고
            </button>
          </div>

          <ol v-show="activeReportingMethod === 'online'" class="process-list">
            <li>
              <b>01</b>
              <div>
                <strong>국세청 홈택스 접속</strong><span>홈택스 홈페이지에 로그인해요.</span>
              </div>
            </li>
            <li>
              <b>02</b>
              <div>
                <strong>증여세 신고서 작성</strong
                ><span>증여세 신고 메뉴의 정기 신고에서 신고서를 작성해요.</span>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                <strong>증빙 서류 제출</strong
                ><span>관련 증빙 서류를 온라인으로 첨부해 제출해요.</span>
              </div>
            </li>
          </ol>

          <ol v-show="activeReportingMethod === 'visit'" class="process-list">
            <li>
              <b>01</b>
              <div>
                <strong>관할 세무서 방문</strong><span>납세지 관할 세무서를 방문해요.</span>
              </div>
            </li>
            <li>
              <b>02</b>
              <div>
                <strong>과세표준신고서 제출</strong
                ><span>증여세 과세표준신고 및 자진납부계산서를 제출해요.</span>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                <strong>평가·입증서류 첨부</strong
                ><span>증여재산 평가명세서와 채무사실 입증서류를 함께 첨부해요.</span>
              </div>
            </li>
          </ol>
        </article>

        <article class="guide-section">
          <h2>신고 시 구비 서류</h2>
          <ul class="check-list">
            <li>가족관계증명서</li>
            <li>이체확인증</li>
            <li>증여세 신고서(세무서 방문 신고 시 필요)</li>
            <li>증여재산 및 평가명세서</li>
            <li>증여세 과세표준 신고 및 자진납부계산서</li>
            <li>자진납부서</li>
          </ul>
        </article>

        <article class="guide-section">
          <h2>분할납부와 연부연납</h2>
          <p>
            증여세는 한 번에 납부하는 것이 원칙이지만, 세부담을 분산하고 납세 의무를 쉽게 이행할 수
            있도록 일정 요건을 충족하면 나누어 낼 수 있어요. 2회로 나누어 내는 것을
            <strong>분납</strong>, 장기간에 걸쳐 나누어 내는 것을 <strong>연부연납</strong>이라고
            해요.
          </p>

          <div class="deduction-limit-card">
            <span class="section-kicker">분납 요건</span>
            <h2>납부세액이 1,000만 원을 초과할 때</h2>
            <div class="deduction-limit-grid">
              <div><span>세액 2,000만 원 이하</span><strong>1,000만 원 초과분</strong></div>
              <div><span>세액 2,000만 원 초과</span><strong>세액의 50% 이하</strong></div>
            </div>
            <p class="guide-caption">
              신고서의 '분납'란에 분할 납부할 세액을 적어 제출하면 별도 신청서 없이 분납이 완료돼요.
            </p>
          </div>

          <div class="deduction-limit-card" style="margin-top: 12px">
            <span class="section-kicker">연부연납 요건</span>
            <h2>아래 조건을 모두 충족해야 해요</h2>
            <ul class="check-list">
              <li>
                납부세액이 2,000만 원을 초과할 것(각 회분 분할납부세액이 1,000만 원을 초과하도록
                기간을 정해요)
              </li>
              <li>연부연납 신청 세액에 상당하는 납세담보를 제공할 것</li>
              <li>신청 기한 내에 연부연납허가신청서를 제출할 것</li>
            </ul>
            <div class="rate-grid">
              <div class="emphasis">
                <span>연부연납 가산금 이자율</span><strong>연 3.5%</strong
                ><small>2024년 3월 22일 이후 적용</small>
              </div>
            </div>
          </div>
        </article>

        <article class="guide-section">
          <h2>증여세 납부는 이렇게 해요</h2>
          <ul class="check-list">
            <li>자진납부서를 작성해 신고기한 이내에 은행이나 우체국에 직접 납부</li>
            <li>신용카드로 납부</li>
            <li>홈택스 등 전자납부 시스템으로 납부</li>
          </ul>
        </article>

        <article class="tax-table-card">
          <h2>신고·납부를 하지 않으면 생기는 가산세</h2>
          <div class="tax-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>구분</th>
                  <th>가산세율</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>일반 무신고</td>
                  <td>20%</td>
                  <td>무신고납부세액 기준</td>
                </tr>
                <tr>
                  <td>부정 무신고</td>
                  <td>40%</td>
                  <td>무신고납부세액 기준</td>
                </tr>
                <tr>
                  <td>일반 과소신고</td>
                  <td>10%</td>
                  <td>과소신고납부세액 기준</td>
                </tr>
                <tr>
                  <td>부정 과소신고</td>
                  <td>40%</td>
                  <td>과소신고납부세액 기준</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="guide-caption">
            신고기한 내 신고하면 세액의 3%를 공제받지만, 신고하지 않거나 적게 신고하면 위 가산세를
            추가로 부담해요.
          </p>
        </article>

        <article class="guide-section">
          <h2>납부까지 늦어지면?</h2>
          <p>
            세금을 납부하지 않거나 납부할 세액보다 적게 냈다면 납부지연가산세를 추가로 부담해요.
            계산식은 <strong>미납·미달납부세액 × 미납기간 × 이자율(22/100,000)</strong>이며,
            미납기간은 납부기한 다음 날부터 실제 납부일 또는 납세고지일까지예요.
          </p>
        </article>
      </section>
      <section v-else-if="isNonCashGuide" class="non-cash-guide">
        <p class="guide-disclaimer">
          세율·조정대상지역 등은 변경될 수 있으므로, 실제 증여 전 최신 기준을 반드시 확인하세요.
        </p>

        <div class="chapter-tabs" role="tablist" aria-label="현금 외 증여 챕터">
          <button
            :class="{ active: activeNonCashChapter === 'real-estate' }"
            type="button"
            role="tab"
            :aria-selected="activeNonCashChapter === 'real-estate'"
            @click="activeNonCashChapter = 'real-estate'"
          >
            부동산 증여
          </button>
          <button
            :class="{ active: activeNonCashChapter === 'stock' }"
            type="button"
            role="tab"
            :aria-selected="activeNonCashChapter === 'stock'"
            @click="activeNonCashChapter = 'stock'"
          >
            주식 증여
          </button>
          <button
            :class="{ active: activeNonCashChapter === 'grandparent' }"
            type="button"
            role="tab"
            :aria-selected="activeNonCashChapter === 'grandparent'"
            @click="activeNonCashChapter = 'grandparent'"
          >
            조부모 증여
          </button>
        </div>

        <div
          v-show="activeNonCashChapter === 'real-estate'"
          class="noncash-chapter real-estate-chapter"
        >
          <article class="asset-hero real-estate">
            <span>부동산 증여</span>
            <h2>부동산 증여는<br />어떻게 하나요?</h2>
            <p>
              증여세만 계산하고 진행하면 취득세 중과나 신고 기한 때문에 예상하지 못한 비용이 생길 수
              있어요. 부동산 증여의 세금과 절차를 차례로 살펴보세요.
            </p>
          </article>
          <article class="guide-section">
            <h2>부동산 증여란 무엇인가요?</h2>
            <p>
              아파트 등 부동산을 소유한 사람이 주로 배우자나 자녀 등 가족에게 대가 없이 소유권을
              넘겨주는 것을 말해요.
            </p>
            <div class="tax-summary">
              <strong>세금 계산 기준</strong><span>증여세 + 취득세</span>
              <p>
                부동산은 현재 시가를 기준으로 재산가액이 정해져, 향후 가치 상승분에 대한 세금 부담을
                줄이는 효과를 기대할 수 있어요.
              </p>
            </div>
          </article>
          <article class="guide-section">
            <h2>부동산 증여 절차</h2>
            <p>보통 네 단계를 순서대로 진행해요.</p>
            <ol class="process-list">
              <li>
                <b>01</b>
                <div>
                  <strong>증여 계약서 작성</strong
                  ><span>증여자와 수증자가 증여계약서를 작성하고 인감도장을 찍어요.</span>
                </div>
              </li>
              <li>
                <b>02</b>
                <div>
                  <strong>취득세 신고·납부</strong
                  ><span
                    >계약일이 취득일이며, 그 달 말일부터 3개월 이내 시·군·구청에 신고·납부해요. 등기
                    전에 처리해야 해요.</span
                  >
                </div>
              </li>
              <li>
                <b>03</b>
                <div>
                  <strong>소유권 이전 등기</strong
                  ><span
                    >관할 등기소에 소유권 이전 등기를 신청해요. 법무사에게 맡기는 경우가
                    많아요.</span
                  >
                </div>
              </li>
              <li>
                <b>04</b>
                <div>
                  <strong>증여세 신고·납부</strong
                  ><span
                    >증여받은 달 말일부터 3개월 이내에 관할 세무서 또는 홈택스에서
                    신고·납부해요.</span
                  >
                </div>
              </li>
            </ol>
          </article>
          <article class="guide-section">
            <h2>준비 서류 체크리스트</h2>
            <ul class="check-list">
              <li>증여계약서</li>
              <li>양쪽 인감증명서와 인감도장</li>
              <li>주민등록등본·가족관계증명서</li>
              <li>등기부등본·토지대장·건축물대장</li>
              <li>취득세 납부 영수증</li>
            </ul>
          </article>
          <article class="guide-section">
            <h2>증여 취득세, 어떻게 계산하나요?</h2>
            <div class="rate-grid">
              <div>
                <span>일반 세율</span><strong>약 3.8%</strong
                ><small>본세 3.5% + 지방교육세 0.3%<br />85㎡ 초과 시 농어촌특별세 0.2% 추가</small>
              </div>
              <div class="emphasis">
                <span>중과 가능 세율</span><strong>최대 12.4%</strong
                ><small>본세 12% + 지방교육세 0.4%</small>
              </div>
            </div>
            <p>
              12% 중과는 받는 사람이 아니라 <strong>주는 사람이 다주택자인지</strong>가 핵심이에요.
              증여자가 1세대 2주택 이상이고, 조정대상지역 주택이며, 시가표준액이 3억 원 이상인 경우
              적용될 수 있어요.
            </p>
            <aside class="guide-tip">
              <strong>예시: 시가인정액 5억 원 아파트</strong
              ><span
                >일반 세율이면 약 1,900만 원, 12% 중과 대상이면 약 6,200만 원으로 크게 차이 날 수
                있어요.</span
              >
            </aside>
          </article>
          <article class="guide-section">
            <h2>배우자 증여 시 주의점</h2>
            <p>
              배우자에게는 10년 합산 최대 6억 원까지 증여재산공제가 가능하지만, 취득세는 별도로 내야
              해요. 또 증여받은 배우자가 10년 안에 제3자에게 팔면 양도소득세 이월과세가 적용될 수
              있으니 장기 보유 계획을 함께 검토하세요.
            </p>
          </article>
        </div>

        <div
          v-show="activeNonCashChapter === 'grandparent'"
          class="noncash-chapter grandparent-guide"
        >
          <article class="asset-hero grandparent">
            <span>조부모 증여</span>
            <h2>조부모 증여는<br />어떻게 되나요?</h2>
            <p>
              손주에게 직접 증여할 때는 일반 증여공제와 함께 세대생략 할증과세 여부를 확인해야 해요.
            </p>
          </article>
          <article class="guide-section">
            <h2>세대생략 할증과세란?</h2>
            <p>
              조부모가 손주처럼 자신의 자녀가 아닌 직계비속에게 증여하면, 일반 증여세 산출세액에
              <strong>30%를 가산</strong>해요. 수증자가 미성년자이고 증여재산가액이 20억 원을
              초과하는 경우에는 40%가 가산될 수 있어요.
            </p>
            <div class="rate-grid">
              <div>
                <span>성년 손주 공제</span><strong>5,000만 원</strong><small>10년 합산 기준</small>
              </div>
              <div class="emphasis">
                <span>미성년 손주 공제</span><strong>2,000만 원</strong
                ><small>10년 합산 기준</small>
              </div>
            </div>
          </article>
          <article class="guide-section">
            <h2>계산 예시: 미성년 손주에게 5,000만 원 증여</h2>
            <div class="calculation-card">
              <p>
                <span>① 과세표준</span><strong>(5,000만 원 − 2,000만 원) × 10%</strong
                ><b>기본 증여세 300만 원</b>
              </p>
              <p>
                <span>② 세대생략 할증</span><strong>300만 원 × 1.3</strong><b>최종 세액 390만 원</b>
              </p>
              <p class="result"><span>세금 납부 후 증여액</span><b>4,610만 원</b></p>
            </div>
            <p class="guide-caption">
              단순 예시이며, 기존 증여 이력·재산가액·공제 적용 여부에 따라 실제 세액은 달라질 수
              있어요.
            </p>
          </article>
          <article class="guide-section">
            <h2>증여 순서도 함께 비교해보세요</h2>
            <p>
              부모와 조부모 모두에게 증여받을 계획이 있다면, 세대생략 할증과 공제 적용을 고려해
              순서와 시점을 비교하는 것이 중요해요. 조부모·부모가 동시에 증여하거나 공제 한도를
              초과하면 세액이 달라질 수 있으므로, 실행 전 개별 상황으로 계산해보세요.
            </p>
            <aside class="guide-tip">
              <strong>핵심 체크</strong
              ><span
                >조부모가 손주에게 직접 증여하는 경우에는 기본 증여세 외에 세대생략 할증 가능성을
                반드시 확인하세요.</span
              >
            </aside>
          </article>
        </div>
        <div v-show="activeNonCashChapter === 'stock'" class="noncash-chapter stock-guide">
          <article class="asset-hero stock">
            <span>주식 증여</span>
            <h2>주식 증여는<br />어떻게 되나요?</h2>
            <p>
              주식은 언제, 누구에게, 어떻게 증여하는지에 따라 세금 차이가 커질 수 있어요. 국내·해외
              주식의 평가와 절세 포인트를 확인해보세요.
            </p>
          </article>
          <article class="guide-section">
            <h2>왜 주식 증여를 하나요?</h2>
            <p>
              주식은 시가 기준으로 과세되므로 가치가 낮을 때 미리 증여하면 향후 시세 상승분에 대한
              세금 부담을 줄일 수 있어요. 다만 상장주식은 단일 날짜가 아닌 전후 평균 가격으로
              평가하므로 단기 급등락은 주의해야 해요.
            </p>
          </article>
          <article class="guide-section">
            <h2>주식 가치 평가와 절세 포인트</h2>
            <div class="info-pair">
              <div>
                <strong>상장주식</strong
                ><span>증여일 전후 2개월, 총 4개월간 종가 평균으로 평가해요.</span>
              </div>
              <div>
                <strong>비상장주식</strong
                ><span
                  >객관적 거래 가격이 있으면 시가로, 없으면 세법상 보충적 평가방법을 적용해요.</span
                >
              </div>
              <div>
                <strong>해외주식</strong
                ><span>평가 기간은 국내와 같고, 증여일 고시환율로 원화 환산해요.</span>
              </div>
              <div><strong>해외 ETF</strong><span>전일 종가를 시가로 평가해요.</span></div>
            </div>
            <ul class="check-list">
              <li>주가 하락 구간과 10년 단위 공제 한도를 함께 검토하기</li>
              <li>수증자를 분산해 공제 총액과 세율 구간 관리하기</li>
              <li>환율·평가 근거·자금 흐름을 문서로 보관하기</li>
            </ul>
          </article>
          <article class="guide-section">
            <h2>주식 증여 체크리스트</h2>
            <ul class="check-list">
              <li>증여계약서에 당사자·주식 수·증여일 기재</li>
              <li>상장·비상장 여부에 맞는 가치 평가</li>
              <li>명의개서 및 주주명부 변경 완료</li>
              <li>증여일이 속한 달 말일부터 3개월 안에 신고</li>
              <li>수증자의 증여세 납부 재원 확보</li>
              <li>최대주주 할증·특수관계인 거래 등 세무 리스크 검토</li>
            </ul>
          </article>
          <article class="guide-section">
            <h2>꼭 기억하세요</h2>
            <p>
              양도가 아닌 증여로 처리되어야 해요. 장외 거래 등 양도로 분류되면 양도소득세가 발생할
              수 있어 거래 방식과 명의 이전 절차를 확인하는 것이 중요합니다.
            </p>
          </article>
        </div>
      </section>
      <section v-else class="guide-sections">
        <article v-for="[heading, body] in guide.sections" :key="heading" class="guide-section">
          <h2>{{ heading }}</h2>
          <p v-for="paragraph in Array.isArray(body) ? body : [body]" :key="paragraph">
            {{ paragraph }}
          </p>
        </article>
      </section>
    </main>
  </div>
</template>
