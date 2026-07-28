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
    title: '증여 신고 방법 A-Z',
    intro: '증여받은 달의 말일부터 3개월 이내에 신고·납부해야 합니다.',
    sections: [
      ['1. 서류 준비', '증여계약서, 가족관계증명서, 재산 평가자료를 준비합니다.'],
      ['2. 신고서 작성', '홈택스에서 증여세 신고서를 작성하고 첨부 서류를 제출합니다.'],
      ['3. 세액 납부', '신고 기한 안에 세액을 납부하고 접수 내역을 보관합니다.'],
    ],
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
const isNonCashGuide = computed(() => route.params.slug === 'non-cash-gifts')
const activeNonCashChapter = ref('real-estate')
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

<style scoped>
.guide-detail-content {
  max-width: 760px;
  padding-top: 40px;
  padding-bottom: 72px;
}
.back-link {
  display: flex;
  width: max-content;
  align-items: center;
  margin-bottom: 30px;
}
.back-link :deep(svg) {
  transform: rotate(180deg);
}
.guide-detail-content h1 {
  margin: 10px 0 12px;
  font-size: clamp(28px, 5vw, 42px);
}
.guide-intro {
  margin: 0;
  color: #626879;
  font-size: 17px;
  line-height: 1.7;
  white-space: pre-line;
}
.guide-sections,
.mirizoom-guide {
  display: grid;
  gap: 14px;
  margin: 34px 0;
}
.guide-section {
  padding: 23px;
  border: 1px solid #e8e9ef;
  border-radius: 16px;
  background: #fff;
}
.guide-section h2 {
  margin: 0 0 12px;
  font-size: 18px;
}
.guide-section p {
  margin: 0;
  color: #626879;
  line-height: 1.7;
  white-space: pre-line;
}
.guide-section p + p {
  margin-top: 18px;
}
.guide-highlight-card {
  padding: 26px;
  border-radius: 22px;
  background: linear-gradient(135deg, #173e61, #2e638e);
  color: #fff;
}
.guide-highlight-label {
  color: #ffd93d;
  font-size: 12px;
  font-weight: 700;
}
.guide-highlight-card h2 {
  margin: 10px 0 18px;
  font-size: 27px;
  line-height: 1.3;
  letter-spacing: -0.05em;
}
.guide-highlight-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  line-height: 1.75;
}
.guide-highlight-card p + p {
  margin-top: 14px;
}
.guide-highlight-card strong {
  color: #fff2a6;
}
.guide-flow-heading {
  padding: 17px 4px 4px;
}
.guide-flow-heading h2 {
  margin: 5px 0 7px;
  font-size: 23px;
}
.guide-flow-heading p {
  margin: 0;
  color: #6b7080;
  font-size: 14px;
  line-height: 1.6;
}
.guide-step-list {
  display: grid;
  margin: 0;
  padding: 0;
  gap: 12px;
  list-style: none;
  counter-reset: steps;
}
.guide-step-card {
  display: grid;
  grid-template-columns: auto 1fr;
  padding: 20px;
  gap: 14px;
  border: 1px solid #e4e9f0;
  border-radius: 18px;
  background: #fff;
}
.guide-step-number {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 11px;
  background: #fff5cf;
  color: #886600;
  font-size: 12px;
  font-weight: 700;
}
.guide-step-card h3 {
  margin: 4px 0 8px;
  font-size: 17px;
  line-height: 1.4;
}
.guide-step-card p {
  margin: 0;
  color: #626879;
  font-size: 14px;
  line-height: 1.7;
}
.guide-step-card p + p {
  margin-top: 14px;
}
.guide-tip {
  display: grid;
  margin-top: 15px;
  padding: 13px;
  gap: 5px;
  border-radius: 13px;
  background: #f1f7ff;
  color: #55738e;
  font-size: 12px;
  line-height: 1.6;
}
.guide-tip strong {
  color: #346388;
}
.tax-choice-list {
  display: grid;
  gap: 8px;
}
.tax-choice-list p {
  display: grid;
  padding: 12px;
  gap: 4px;
  border-radius: 12px;
  background: #f7f9fc;
}
.tax-choice-list strong {
  color: #344f69;
  font-size: 13px;
}
.tax-choice-list span {
  color: #626879;
  font-size: 12px;
  line-height: 1.55;
}
@media (max-width: 390px) {
  .guide-highlight-card,
  .guide-step-card {
    padding: 18px;
  }
  .guide-highlight-card h2 {
    font-size: 24px;
  }
  .guide-step-card {
    gap: 11px;
  }
  .guide-step-card h3 {
    font-size: 15px;
  }
}
@media (min-width: 760px) {
  .guide-highlight-card {
    padding: 32px;
  }
  .guide-step-card {
    padding: 24px;
  }
  .guide-step-list {
    gap: 14px;
  }
}
.non-cash-guide {
  display: grid;
  gap: 14px;
  margin: 34px 0;
}
.guide-disclaimer {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff8df;
  color: #7a6739;
  font-size: 12px;
  line-height: 1.55;
}
.asset-hero {
  padding: 26px;
  border-radius: 22px;
  color: #fff;
}
.asset-hero.real-estate {
  background: linear-gradient(135deg, #495c73, #7890a7);
}
.asset-hero.grandparent {
  background: linear-gradient(135deg, #755457, #aa7478);
}
.asset-hero.stock {
  background: linear-gradient(135deg, #215f66, #45968c);
}
.asset-hero span {
  color: #fff3a6;
  font-size: 12px;
  font-weight: 700;
}
.asset-hero h2 {
  margin: 9px 0 15px;
  font-size: 27px;
  line-height: 1.28;
  letter-spacing: -0.05em;
}
.asset-hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1.7;
}
.tax-summary {
  display: grid;
  margin-top: 17px;
  padding: 15px;
  gap: 5px;
  border-radius: 14px;
  background: #f2f7fb;
}
.tax-summary strong {
  color: #345a7c;
  font-size: 13px;
}
.tax-summary > span {
  color: #172231;
  font-size: 18px;
  font-weight: 700;
}
.tax-summary p {
  font-size: 12px;
}
.process-list {
  display: grid;
  margin: 16px 0 0;
  padding: 0;
  gap: 13px;
  list-style: none;
}
.process-list li {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 11px;
}
.process-list b {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 9px;
  color: #886600;
  background: #fff5cf;
  font-size: 10px;
}
.process-list div {
  display: grid;
  gap: 4px;
}
.process-list strong {
  font-size: 14px;
}
.process-list span {
  color: #626879;
  font-size: 13px;
  line-height: 1.6;
}
.check-list {
  display: grid;
  margin: 14px 0 0;
  padding: 0;
  gap: 8px;
  list-style: none;
}
.check-list li {
  padding-left: 20px;
  color: #526174;
  font-size: 13px;
  line-height: 1.55;
  position: relative;
}
.check-list li::before {
  position: absolute;
  left: 0;
  color: #25845a;
  content: '✓';
  font-weight: 700;
}
.rate-grid,
.info-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 16px 0;
  gap: 9px;
}
.rate-grid > div,
.info-pair > div {
  display: grid;
  padding: 14px;
  gap: 5px;
  border-radius: 14px;
  background: #f5f8fb;
}
.rate-grid .emphasis {
  background: #fff5d8;
}
.rate-grid span,
.info-pair span {
  color: #647286;
  font-size: 11px;
  line-height: 1.5;
}
.rate-grid strong {
  font-size: 20px;
}
.rate-grid small {
  color: #687687;
  font-size: 10px;
  line-height: 1.55;
}
.info-pair strong {
  color: #345a7c;
  font-size: 13px;
}
.calculation-card {
  display: grid;
  margin-top: 14px;
  overflow: hidden;
  border: 1px solid #ecdca5;
  border-radius: 15px;
}
.calculation-card p {
  display: grid;
  margin: 0;
  padding: 14px;
  gap: 4px;
  background: #fffdf5;
}
.calculation-card p + p {
  border-top: 1px solid #eee5c7;
}
.calculation-card span {
  color: #7b714f;
  font-size: 11px;
}
.calculation-card strong {
  color: #526174;
  font-size: 13px;
}
.calculation-card b {
  color: #725b11;
  font-size: 15px;
}
.calculation-card .result {
  background: #fff5cf;
}
.calculation-card .result b {
  font-size: 19px;
}
.guide-caption {
  margin-top: 11px !important;
  color: #87909d !important;
  font-size: 11px !important;
  line-height: 1.55 !important;
}
@media (max-width: 390px) {
  .asset-hero,
  .guide-section {
    padding: 18px;
  }
  .asset-hero h2 {
    font-size: 24px;
  }
  .rate-grid,
  .info-pair {
    grid-template-columns: 1fr;
  }
}
@media (min-width: 760px) {
  .asset-hero {
    padding: 32px;
  }
  .non-cash-guide {
    gap: 16px;
  }
}
.stock-guide,
.grandparent-guide {
  display: grid;
  gap: 14px;
}

.noncash-chapter {
  display: grid;
  gap: 14px;
}

.stock-guide {
  order: 2;
}

.grandparent-guide {
  order: 3;
}

.chapter-tabs {
  display: flex;
  padding: 4px;
  gap: 4px;
  overflow-x: auto;
  border: 1px solid #dfe6ef;
  border-radius: 16px;
  background: #eef3f8;
  scrollbar-width: none;
}

.chapter-tabs button {
  min-width: max-content;
  padding: 10px 13px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #728094;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.chapter-tabs button.active {
  background: var(--surface);
  color: var(--blue-strong);
  box-shadow: 0 3px 9px rgba(42, 62, 86, 0.12);
}

.tax-guide {
  display: grid;
  gap: 14px;
  margin: 34px 0;
}

.tax-guide-hero,
.deduction-limit-card,
.tax-example-card,
.tax-table-card {
  padding: 23px;
  border-radius: 20px;
}

.tax-guide-hero {
  background: linear-gradient(135deg, #173e61, #3c719b);
  color: #fff;
}

.tax-guide-hero > span {
  color: #ffe887;
  font-size: 12px;
  font-weight: 700;
}
.tax-guide-hero h2 {
  margin: 9px 0 12px;
  font-size: 27px;
  line-height: 1.3;
  letter-spacing: -0.05em;
}
.tax-guide-hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 14px;
  line-height: 1.65;
}

.tax-table-card,
.tax-example-card {
  border: 1px solid #e4e9f0;
  background: #fff;
}
.tax-table-card h2,
.deduction-limit-card h2,
.tax-example-card h2 {
  margin: 0 0 16px;
  font-size: 15px;
  line-height: 1.4;
}
.tax-table-scroll {
  overflow-x: auto;
}
.tax-table-card table {
  width: 100%;
  min-width: 430px;
  border-spacing: 0;
  font-size: 12px;
  text-align: left;
}
.tax-table-card th {
  padding: 12px 13px;
  background: #edf4fb;
  color: #496a87;
  font-weight: 700;
}
.tax-table-card th:first-child {
  border-radius: 10px 0 0 10px;
}
.tax-table-card th:last-child {
  border-radius: 0 10px 10px 0;
}
.tax-table-card td {
  padding: 13px;
  border-bottom: 1px solid #edf0f4;
  color: #526174;
  line-height: 1.45;
}
.tax-table-card td:nth-child(2) {
  color: #2d638f;
  font-weight: 700;
}
.tax-table-card td:nth-child(3) {
  color: #7a6b45;
}

.deduction-limit-card {
  background: #fff6d7;
}
.deduction-limit-card .section-kicker {
  color: #8b6d13;
}
.deduction-limit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.deduction-limit-grid > div {
  display: grid;
  padding: 15px;
  gap: 5px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.68);
}
.deduction-limit-grid span,
.deduction-limit-grid small {
  color: #786f5c;
  font-size: 11px;
}
.deduction-limit-grid strong {
  color: #564409;
  font-size: 19px;
}

.tax-example-card > .section-kicker {
  color: #3a719a;
}
.tax-example-card ol {
  display: grid;
  margin: 0;
  padding: 0;
  gap: 12px;
  list-style: none;
}
.tax-example-card li {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 11px;
}
.tax-example-card li > b {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: #e9f2fc;
  color: #386b91;
  font-size: 11px;
}
.tax-example-card li div {
  display: grid;
  gap: 4px;
}
.tax-example-card li strong {
  font-size: 14px;
}
.tax-example-card li span {
  color: #6b7887;
  font-size: 12px;
}
.tax-example-card li em {
  color: #235d87;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
}

@media (max-width: 390px) {
  .tax-guide-hero,
  .deduction-limit-card,
  .tax-example-card,
  .tax-table-card {
    padding: 18px;
  }
  .tax-guide-hero h2 {
    font-size: 24px;
  }
  .deduction-limit-grid {
    grid-template-columns: 1fr;
  }
}
@media (min-width: 760px) {
  .tax-guide {
    gap: 16px;
  }
  .tax-guide-hero,
  .deduction-limit-card,
  .tax-example-card,
  .tax-table-card {
    padding: 30px;
  }
}

/* 모바일에서도 표 전체가 카드 안에 들어오도록 고정 폭을 제거합니다. */
.tax-table-scroll {
  overflow: visible;
}

.tax-table-card table {
  min-width: 0;
  table-layout: fixed;
}

.tax-table-card th,
.tax-table-card td {
  padding: 11px 7px;
  word-break: keep-all;
}

.tax-table-card th:nth-child(1),
.tax-table-card td:nth-child(1) {
  width: 46%;
}
.tax-table-card th:nth-child(2),
.tax-table-card td:nth-child(2) {
  width: 20%;
}
.tax-table-card th:nth-child(3),
.tax-table-card td:nth-child(3) {
  width: 34%;
}

.tax-short-example {
  display: flex;
  margin: 0 0 12px;
  padding: 15px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 7px;
  border-radius: 14px;
  background: #f2f7fc;
  color: #526174;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
}

.tax-short-example b,
.tax-short-example strong {
  color: #285f88;
}

.tax-short-example i {
  color: #8a98a8;
  font-style: normal;
}

.tax-example-card > p {
  margin: 0;
  color: #637184;
  font-size: 13px;
  line-height: 1.65;
}

@media (max-width: 390px) {
  .tax-table-card th,
  .tax-table-card td {
    padding: 10px 5px;
    font-size: 11px;
  }
}
</style>
