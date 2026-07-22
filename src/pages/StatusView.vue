<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "../components/layout/AppHeader.vue";
import AppIcon from "../components/layout/AppIcon.vue";
import ModalSheet from "../components/layout/ModalSheet.vue";
import { useAppStore } from "../stores/appStore";
import { formatCompactWon, formatWon, normalizeAmount } from "../utils/finance";

const store = useAppStore();
const router = useRouter();
const showAddGift = ref(false);
const planToDelete = ref(null);
const giftForm = reactive({
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  memo: "현금 증여",
});

const family = store.selectedFamily;
const remaining = computed(() =>
  Math.max(0, family.value.deductionLimit - family.value.giftedAmount),
);
const progress = computed(() =>
  Math.min(
    100,
    Math.round((family.value.giftedAmount / family.value.deductionLimit) * 100),
  ),
);
const familyPlans = computed(() =>
  store.state.plans.filter((plan) => plan.familyId === family.value.id),
);
const history = computed(() =>
  store.state.giftHistory.filter((gift) => gift.familyId === family.value.id),
);
const completedDocuments = computed(
  () => store.state.documents.filter((item) => item.done).length,
);

function setGiftAmount(value) {
  giftForm.amount = normalizeAmount(value).toLocaleString("ko-KR");
}

function submitGift() {
  const numericAmount = normalizeAmount(giftForm.amount);
  if (!numericAmount || !giftForm.date) return;
  store.addGift({
    familyId: family.value.id,
    amount: numericAmount,
    date: giftForm.date.replaceAll("-", "."),
    memo: giftForm.memo,
  });
  giftForm.amount = "";
  giftForm.memo = "현금 증여";
  showAddGift.value = false;
}

function confirmDelete() {
  if (!planToDelete.value) return;
  store.deletePlan(planToDelete.value.id);
  planToDelete.value = null;
}
</script>

<template>
  <div class="page status-page">
    <AppHeader />
    <div class="page-content status-content">
      <section class="family-switcher" aria-label="수증자 선택">
        <button
          v-for="item in store.state.families"
          :key="item.id"
          type="button"
          :class="{ active: item.id === family.id }"
          @click="store.selectFamily(item.id)"
        >
          {{ item.name }}
        </button>
        <button
          class="add-family-tab"
          type="button"
          aria-label="수증자 추가"
          @click="router.push('/my')"
        >
          <AppIcon name="plus" :size="18" />
        </button>
      </section>

      <section v-if="familyPlans.length" class="active-plan-card">
        <div class="active-plan-visual">
          <div class="plan-orbit" />
          <span class="plan-coin">₩</span>
          <span class="plan-document"
            ><AppIcon name="document" :size="31"
          /></span>
        </div>
        <div class="plan-card-copy">
          <div class="plan-card-eyebrow">
            <span>저축하며 불러요</span>
            <button
              type="button"
              aria-label="계획 삭제"
              @click="planToDelete = familyPlans[0]"
            >
              <AppIcon name="trash" :size="17" />
            </button>
          </div>
          <h2>
            {{ formatCompactWon(familyPlans[0].amount) }}을 준비하고 있어요
          </h2>
          <strong>{{ familyPlans[0].productName }}</strong>
          <div class="plan-card-meta">
            <span>예상 수익률 연 {{ familyPlans[0].rate }}%</span>
            <span>{{ familyPlans[0].giftDate }} 예정</span>
          </div>
        </div>
      </section>

      <section v-else class="empty-plan-card">
        <span><AppIcon name="calculator" :size="25" /></span>
        <h2>현재 저장한 증여 계획이 없어요</h2>
        <p>시뮬레이션을 돌려 우리 가족에게 맞는 계획을 만들어 보세요.</p>
        <RouterLink class="primary-button" to="/simulation"
          >시뮬레이션 시작하기</RouterLink
        >
      </section>

      <section class="deduction-card">
        <div class="deduction-card-heading">
          <div>
            <span>10년 주기 증여공제 한도</span>
            <h2>{{ formatCompactWon(family.giftedAmount) }} 증여했어요</h2>
          </div>
          <strong>{{ progress }}%</strong>
        </div>
        <div class="progress-track large">
          <span :style="{ width: `${progress}%` }" />
        </div>
        <div class="overview-labels">
          <span>현재까지 {{ formatWon(family.giftedAmount) }}</span>
          <span>한도 {{ formatWon(family.deductionLimit) }}</span>
        </div>
        <p>
          <AppIcon name="info" :size="16" /> 추가
          {{ formatCompactWon(remaining) }}까지 공제 한도 안에서 증여할 수
          있어요.
        </p>
      </section>

      <section class="renewal-card">
        <div class="renewal-icon"><AppIcon name="clock" :size="24" /></div>
        <div>
          <span>한도 갱신까지</span>
          <h2>{{ family.resetLabel }} 남았어요</h2>
        </div>
        <strong>{{ family.resetDate }}</strong>
      </section>

      <section class="status-section">
        <div class="section-heading-row">
          <h2>증여 현황</h2>
          <span>{{ history.length + familyPlans.length }}건</span>
        </div>

        <article class="status-list-card">
          <div class="status-card-title">
            <div>
              <span class="status-section-icon history"
                ><AppIcon name="clock" :size="19"
              /></span>
              <strong>증여 이력</strong>
            </div>
            <span>{{ history.length }}건</span>
          </div>
          <div v-if="history.length" class="gift-history-list">
            <div v-for="gift in history" :key="gift.id">
              <span
                >{{ gift.date }} <small>{{ gift.type }}</small></span
              >
              <strong>{{ formatCompactWon(gift.amount) }}</strong>
            </div>
          </div>
          <p v-else class="empty-inline">등록된 증여 이력이 없습니다.</p>
          <button
            class="soft-button full"
            type="button"
            @click="showAddGift = true"
          >
            <AppIcon name="plus" :size="17" /> 증여 이력 추가
          </button>
        </article>

        <article class="status-list-card">
          <div class="status-card-title">
            <div>
              <span class="status-section-icon planned"
                ><AppIcon name="calendar" :size="19"
              /></span>
              <strong>진행 중인 증여</strong>
            </div>
            <span>{{ familyPlans.length }}건</span>
          </div>
          <div v-if="familyPlans.length" class="ongoing-plan-list">
            <div
              v-for="plan in familyPlans"
              :key="plan.id"
              class="ongoing-plan-item"
            >
              <div>
                <strong>{{
                  formatCompactWon(plan.currentAmount || plan.amount)
                }}</strong>
                <span>증여 신고 전</span>
              </div>
              <span class="status-pill">진행 중</span>
              <p>
                <AppIcon name="info" :size="16" /> {{ plan.giftDate }} 일정과
                신고 서류를 미리 확인하세요.
              </p>
            </div>
          </div>
          <p v-else class="empty-inline">현재 진행 중인 증여가 없습니다.</p>
        </article>
      </section>

      <section class="status-section document-section">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">CHECKLIST</span>
            <h2>필수 증빙 서류</h2>
          </div>
          <span class="yellow-text"
            >{{ completedDocuments }}/{{
              store.state.documents.length
            }}
            준비</span
          >
        </div>
        <div class="document-list">
          <button
            v-for="document in store.state.documents"
            :key="document.id"
            type="button"
            :class="{ done: document.done }"
            @click="store.toggleDocument(document.id)"
          >
            <span class="document-icon"
              ><AppIcon name="document" :size="19"
            /></span>
            <span>
              <strong>{{ document.label }}</strong>
              <small>{{ document.description }}</small>
            </span>
            <span class="document-check"
              ><AppIcon name="check" :size="15"
            /></span>
          </button>
        </div>
      </section>

      <section class="expert-card">
        <span class="expert-avatar"><AppIcon name="chat" :size="28" /></span>
        <div>
          <h2>증여 신고가 어려우신가요?</h2>
          <p>AI 상담으로 상황을 정리하고 전문가 상담을 준비해 보세요.</p>
        </div>
        <RouterLink class="primary-button" to="/chat"
          >전문가 상담 준비</RouterLink
        >
      </section>
    </div>

    <ModalSheet
      :show="showAddGift"
      title="증여 정보를 입력해 주세요"
      description="신고된 과거 이력을 기록하면 공제 한도를 더 정확히 계산할 수 있어요."
      @close="showAddGift = false"
    >
      <form
        id="gift-history-form"
        class="modal-form"
        @submit.prevent="submitGift"
      >
        <label>
          <span>증여 금액</span>
          <div class="modal-input-affix">
            <input
              :value="giftForm.amount"
              inputmode="numeric"
              placeholder="0"
              required
              @input="setGiftAmount($event.target.value)"
            />
            <span>원</span>
          </div>
        </label>
        <label>
          <span>증여 날짜</span>
          <input v-model="giftForm.date" type="date" required />
        </label>
        <label>
          <span>메모</span>
          <textarea
            v-model="giftForm.memo"
            rows="3"
            placeholder="증여 목적이나 특이사항을 적어주세요."
          />
        </label>
        <aside class="info-callout compact">
          <AppIcon name="info" :size="18" />
          <p>
            등록한 금액은 최근 10년 누적 증여액과 남은 공제 한도에 바로
            반영됩니다.
          </p>
        </aside>
      </form>
      <template #actions>
        <button
          class="secondary-button"
          type="button"
          @click="showAddGift = false"
        >
          취소
        </button>
        <button class="primary-button" type="submit" form="gift-history-form">
          등록
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="Boolean(planToDelete)"
      title="해당 플랜을 삭제하시겠습니까?"
      description="삭제된 플랜은 복구할 수 없어요. 과거 증여 이력은 유지됩니다."
      danger
      @close="planToDelete = null"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <template #actions>
        <button
          class="secondary-button"
          type="button"
          @click="planToDelete = null"
        >
          취소
        </button>
        <button class="danger-button" type="button" @click="confirmDelete">
          삭제하기
        </button>
      </template>
    </ModalSheet>
  </div>
</template>
