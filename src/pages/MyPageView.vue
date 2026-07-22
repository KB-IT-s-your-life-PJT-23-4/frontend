<script setup>
import { computed, reactive, ref } from "vue";
import AppHeader from "../components/layout/AppHeader.vue";
import AppIcon from "../components/layout/AppIcon.vue";
import ModalSheet from "../components/layout/ModalSheet.vue";
import { useAppStore } from "../stores/appStore";
import { formatCompactWon } from "../utils/finance";

const store = useAppStore();
const showAddFamily = ref(false);
const showProfile = ref(false);
const showSettings = ref(false);
const simulationToDelete = ref(null);
const familyForm = reactive({ name: "", relation: "자녀", birthDate: "" });
const profileForm = reactive({
  name: store.state.user.name,
  phone: store.state.user.phone,
  email: store.state.user.email,
  address: store.state.user.address,
});

const familySummary = computed(() =>
  store.state.families.map((family) => ({
    ...family,
    lastGift: store.state.giftHistory.find(
      (gift) => gift.familyId === family.id,
    ),
  })),
);

function submitFamily() {
  if (!familyForm.name || !familyForm.birthDate) return;
  store.addFamily(familyForm);
  familyForm.name = "";
  familyForm.relation = "자녀";
  familyForm.birthDate = "";
  showAddFamily.value = false;
}

function submitProfile() {
  store.updateProfile({ ...profileForm });
  showProfile.value = false;
}

function confirmSimulationDelete() {
  if (!simulationToDelete.value) return;
  store.deleteSimulation(simulationToDelete.value.id);
  simulationToDelete.value = null;
}
</script>

<template>
  <div class="page my-page">
    <AppHeader />
    <div class="page-content my-content">
      <section class="profile-summary-card">
        <div class="profile-avatar">
          {{ store.state.user.name.slice(0, 1) }}
        </div>
        <div>
          <span>반가워요</span>
          <h2>{{ store.state.user.name }}님</h2>
          <p>가족의 다음 10년을 차근차근 준비하고 있어요.</p>
        </div>
        <button
          class="soft-button compact"
          type="button"
          @click="showProfile = true"
        >
          내 정보
        </button>
      </section>

      <section class="mypage-section">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">FAMILY</span>
            <h2>가족 관계망</h2>
          </div>
          <button class="text-link" type="button" @click="showAddFamily = true">
            수증자 추가 <AppIcon name="plus" :size="16" />
          </button>
        </div>
        <div class="family-card-list">
          <button
            v-for="family in familySummary"
            :key="family.id"
            class="family-profile-card"
            type="button"
            @click="
              store.selectFamily(family.id);
              $router.push('/status');
            "
          >
            <span class="family-avatar" :class="family.tone">{{
              family.name.slice(-2)
            }}</span>
            <span class="family-profile-copy">
              <strong
                >{{ family.name }} <small>{{ family.relation }}</small></strong
              >
              <span
                >{{ family.birthDate }} · 최근 10년
                {{ formatCompactWon(family.giftedAmount) }}</span
              >
            </span>
            <AppIcon name="chevron" :size="17" />
          </button>
        </div>
      </section>

      <section class="mypage-menu-list">
        <button type="button" @click="showSettings = true">
          <span class="menu-icon"><AppIcon name="settings" :size="20" /></span>
          <span
            ><strong>알림 및 앱 설정</strong
            ><small>증여 일정과 상품 알림을 관리해요</small></span
          >
          <AppIcon name="chevron" :size="17" />
        </button>
        <button type="button" @click="showProfile = true">
          <span class="menu-icon"><AppIcon name="user" :size="20" /></span>
          <span
            ><strong>회원 정보 관리</strong
            ><small>연락처와 주소를 확인해요</small></span
          >
          <AppIcon name="chevron" :size="17" />
        </button>
        <button
          type="button"
          @click="
            store.showToast('약관 화면은 실제 서비스 연동 시 제공돼요.', 'info')
          "
        >
          <span class="menu-icon"><AppIcon name="document" :size="20" /></span>
          <span
            ><strong>이용약관 · 개인정보 처리방침</strong
            ><small>서비스 이용 정책을 확인해요</small></span
          >
          <AppIcon name="chevron" :size="17" />
        </button>
      </section>

      <section class="mypage-section history-section">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">RECENT</span>
            <h2>시뮬레이션 이력</h2>
          </div>
          <span>{{ store.state.simulations.length }}건</span>
        </div>
        <div class="simulation-history-list">
          <article v-for="item in store.state.simulations" :key="item.id">
            <div class="history-topline">
              <span>
                {{
                  store.state.families.find(
                    (family) => family.id === item.familyId,
                  )?.name
                }}
                님
              </span>
              <button
                type="button"
                aria-label="시뮬레이션 이력 삭제"
                @click="simulationToDelete = item"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
            <h3>{{ item.date }}</h3>
            <p>
              증여 {{ formatCompactWon(item.amount) }} · 예상 세금
              {{ formatCompactWon(item.tax) }}
            </p>
            <RouterLink class="soft-button full" to="/simulation"
              >새 조건으로 비교하기</RouterLink
            >
          </article>
        </div>
      </section>

      <div class="mypage-footer-actions">
        <button
          type="button"
          @click="store.showToast('현재는 데모 로그인 상태예요.', 'info')"
        >
          로그아웃
        </button>
        <button type="button" @click="store.resetDemo">데모 초기화</button>
      </div>
      <p class="version-label">미리줌 데모 1.0</p>
    </div>

    <ModalSheet
      :show="showAddFamily"
      title="수증자 정보를 등록할까요?"
      description="이름과 관계, 생년월일을 입력하면 가족별 증여 한도를 따로 관리할 수 있어요."
      @close="showAddFamily = false"
    >
      <form id="family-form" class="modal-form" @submit.prevent="submitFamily">
        <label>
          <span>이름</span>
          <input
            v-model.trim="familyForm.name"
            type="text"
            placeholder="이름을 입력하세요"
            required
          />
        </label>
        <label>
          <span>관계</span>
          <select v-model="familyForm.relation">
            <option>자녀</option>
            <option>배우자</option>
            <option>기타</option>
          </select>
        </label>
        <label>
          <span>생년월일</span>
          <input v-model="familyForm.birthDate" type="date" required />
        </label>
      </form>
      <template #actions>
        <button
          class="secondary-button"
          type="button"
          @click="showAddFamily = false"
        >
          취소
        </button>
        <button class="primary-button" type="submit" form="family-form">
          등록
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="showProfile"
      title="회원 정보를 수정할까요?"
      description="변경한 정보는 이 브라우저의 데모 데이터에만 저장됩니다."
      @close="showProfile = false"
    >
      <form
        id="profile-form"
        class="modal-form"
        @submit.prevent="submitProfile"
      >
        <label
          ><span>이름</span
          ><input v-model.trim="profileForm.name" type="text" required
        /></label>
        <label
          ><span>전화번호</span
          ><input v-model.trim="profileForm.phone" type="tel" required
        /></label>
        <label
          ><span>이메일</span
          ><input v-model.trim="profileForm.email" type="email" required
        /></label>
        <label
          ><span>주소</span
          ><input v-model.trim="profileForm.address" type="text" required
        /></label>
      </form>
      <template #actions>
        <button
          class="secondary-button"
          type="button"
          @click="showProfile = false"
        >
          취소
        </button>
        <button class="primary-button" type="submit" form="profile-form">
          저장
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="showSettings"
      title="알림 및 앱 설정"
      description="필요한 소식만 선택해서 받아보세요."
      @close="showSettings = false"
    >
      <div class="settings-list">
        <button type="button" @click="store.toggleSetting('giftSchedule')">
          <span
            ><strong>증여 일정 알림</strong
            ><small>신고 기한과 증여 예정일</small></span
          >
          <span
            class="toggle"
            :class="{ on: store.state.settings.giftSchedule }"
            ><i
          /></span>
        </button>
        <button type="button" @click="store.toggleSetting('productNews')">
          <span
            ><strong>금융상품 알림</strong
            ><small>금리와 상품 정보 업데이트</small></span
          >
          <span class="toggle" :class="{ on: store.state.settings.productNews }"
            ><i
          /></span>
        </button>
        <button type="button" @click="store.toggleSetting('serviceNotice')">
          <span
            ><strong>서비스 공지</strong
            ><small>새 기능과 점검 안내</small></span
          >
          <span
            class="toggle"
            :class="{ on: store.state.settings.serviceNotice }"
            ><i
          /></span>
        </button>
      </div>
      <template #actions>
        <button
          class="primary-button full"
          type="button"
          @click="showSettings = false"
        >
          완료
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="Boolean(simulationToDelete)"
      title="이 이력을 삭제할까요?"
      description="삭제된 시뮬레이션 결과는 다시 확인할 수 없어요."
      danger
      @close="simulationToDelete = null"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <template #actions>
        <button
          class="secondary-button"
          type="button"
          @click="simulationToDelete = null"
        >
          취소
        </button>
        <button
          class="danger-button"
          type="button"
          @click="confirmSimulationDelete"
        >
          삭제하기
        </button>
      </template>
    </ModalSheet>
  </div>
</template>
