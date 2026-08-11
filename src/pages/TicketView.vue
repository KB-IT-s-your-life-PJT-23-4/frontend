<script setup>
import { computed, onMounted, ref } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import BranchDetailModal from '../components/branch/BranchDetailModal.vue'
import { fetchNearbyBranches, fetchTicketStatus, issueTicket } from '@/api/ticketApi.js'
import '../assets/css/ticketView.css'

const loadingLocation = ref(true)
const loadingBranches = ref(false)
const locationError = ref('')
const operatingBranches = ref([])
const nearbyBranches = ref([])

const lastCoords = ref(null)

const loadingMessage = computed(() => {
  if (loadingLocation.value) return '현재 위치를 확인하는 중이에요'
  if (loadingBranches.value) return '근처 지점을 찾는 중이에요'
  return ''
})
const detailBranch = ref(null)
const showDetailModal = ref(false)

const selectedBranch = ref(null)
const showServiceModal = ref(false)
const issuing = ref(false)
const issueError = ref('')
const issuedTicket = ref(null)

const SERVICE_TYPES = [
  { value: 'DEPOSIT_SAVINGS_FUND_TRUST', label: '예금/적금/펀드/신탁' },
  { value: 'PERSONAL_LOAN', label: '개인대출' },
]

function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저에서는 위치 정보를 사용할 수 없습니다.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => reject(new Error('위치 정보 접근이 거부되었습니다. 위치 권한을 허용해 주세요.')),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  })
}

async function attachWaitingCounts(branches) {
  const results = await Promise.allSettled(
    branches.map((branch) => fetchTicketStatus(branch.branchId)),
  )

  return branches.map((branch, index) => {
    const result = results[index]
    return {
      ...branch,
      waitingCount: result.status === 'fulfilled' ? result.value.waitingCount : null,
    }
  })
}

async function fetchBranchesForCoords(coords) {
  const result = await fetchNearbyBranches({
    x: coords.longitude,
    y: coords.latitude,
  })

  const branchesWithWaiting = await attachWaitingCounts(result.operatingBranches)

  operatingBranches.value = branchesWithWaiting.sort((a, b) => a.distanceMeters - b.distanceMeters)

  nearbyBranches.value = result.nearbyBranches
}

async function loadNearbyBranches() {
  loadingLocation.value = true
  locationError.value = ''

  try {
    const coords = await requestCurrentPosition()

    lastCoords.value = coords

    loadingLocation.value = false
    loadingBranches.value = true

    const result = await fetchNearbyBranches({
      x: coords.longitude,
      y: coords.latitude,
    })

    operatingBranches.value = await attachWaitingCounts(result.operatingBranches)
    nearbyBranches.value = result.nearbyBranches

    await fetchBranchesForCoords(coords)
  } catch (error) {
    locationError.value = error.message || '지점 정보를 불러오지 못했습니다.'
  } finally {
    loadingLocation.value = false
    loadingBranches.value = false
  }
}

async function refreshBranchesSilently() {
  if (!lastCoords.value) return
  try {
    await fetchBranchesForCoords(lastCoords.value)
  } catch {}
}

function openServiceModal(branchId, displayName) {
  selectedBranch.value = { branchId, displayName }
  issueError.value = ''
  issuedTicket.value = null
  showServiceModal.value = true
}

function openOperatingDetail(branch) {
  detailBranch.value = {
    name: branch.branchName,
    roadAddress: branch.roadAddress,
    jibunAddress: branch.jibunAddress,
    placeUrl: branch.placeUrl,
    x: branch.longitude,
    y: branch.latitude,
  }
  showDetailModal.value = true
}

function openNearbyDetail(branch) {
  detailBranch.value = {
    name: branch.placeName,
    roadAddress: branch.roadAddressName,
    jibunAddress: branch.addressName,
    placeUrl: branch.placeUrl,
    x: branch.x,
    y: branch.y,
  }
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  detailBranch.value = null
}

function closeServiceModal() {
  showServiceModal.value = false
  selectedBranch.value = null
}

async function selectService(serviceType) {
  if (!selectedBranch.value?.branchId) return

  issuing.value = true
  issueError.value = ''

  try {
    const ticket = await issueTicket({
      branchId: selectedBranch.value.branchId,
      serviceType,
    })

    issuedTicket.value = {
      ...ticket,
      branchName: selectedBranch.value.displayName,
    }
    refreshBranchesSilently()
  } catch (error) {
    issueError.value = error.message || '번호표 발급에 실패했습니다.'
  } finally {
    issuing.value = false
  }
}

onMounted(loadNearbyBranches)
</script>

<template>
  <div class="ticket-view">
    <AppHeader />

    <div class="ticket-content">
      <h1 class="ticket-title">가까운 영업점 번호표 뽑기</h1>
      <p class="ticket-subtitle">번호표를 미리 뽑고 대기 시간 없이 방문해 보세요.</p>

      <div v-if="loadingLocation || loadingBranches" class="ticket-state ticket-loading">
        <div class="ticket-loading-badge">
          <span class="ticket-loading-ping" />
          <span class="ticket-loading-ping ticket-loading-ping-delay" />
          <AppIcon :name="loadingLocation ? 'map' : 'refresh'" :size="26" />
        </div>
        <p class="ticket-loading-text">
          {{ loadingMessage }}
          <span class="ticket-loading-dots" aria-hidden="true"><i /><i /><i /></span>
        </p>
      </div>

      <div v-else-if="locationError" class="ticket-state error">
        {{ locationError }}
        <button type="button" class="secondary-button compact" @click="loadNearbyBranches">
          다시 시도
        </button>
      </div>

      <template v-else>
        <section v-if="operatingBranches.length > 0" class="branch-section">
          <h2 class="branch-section-title">가장 가까운 번호표 운영 지점</h2>
          <ul class="branch-list">
            <li
              v-for="branch in operatingBranches"
              :key="'operating-' + branch.branchId"
              class="branch-card"
            >
              <div class="branch-info">
                <span class="branch-name-row">
                  <button
                    type="button"
                    class="branch-name branch-name-button"
                    @click="openOperatingDetail(branch)"
                  >
                    {{ branch.branchName }}
                  </button>
                  <span
                    class="branch-badge"
                    title="은행 업무와 증권 업무를 한 곳에서 볼 수 있는 지점이에요."
                    >은행·증권 복합점포
                  </span>
                </span>
                <span class="branch-address">{{ branch.address }}</span>
                <span class="branch-meta">
                  <span class="branch-distance"
                    >{{ Math.round(branch.distanceMeters / 100) / 10 }}km</span
                  >
                  <span v-if="branch.waitingCount !== null" class="branch-waiting">
                    현재 {{ branch.waitingCount }}명 대기 중
                  </span>
                  <span v-else class="branch-waiting muted">대기 인원 확인 불가</span>
                </span>
              </div>

              <button
                type="button"
                class="primary-button compact"
                @click="openServiceModal(branch.branchId, branch.branchName)"
              >
                번호표 뽑기
              </button>
            </li>
          </ul>
        </section>

        <section v-if="nearbyBranches.length > 0" class="branch-section">
          <h2 class="branch-section-title">근처 지점</h2>
          <ul class="branch-list">
            <li
              v-for="branch in nearbyBranches"
              :key="branch.placeName + branch.x"
              class="branch-card"
            >
              <div class="branch-info">
                <button
                  type="button"
                  class="branch-name branch-name-button"
                  @click="openNearbyDetail(branch)"
                >
                  {{ branch.placeName }}
                </button>
                <span class="branch-address">{{
                  branch.roadAddressName || branch.addressName
                }}</span>
              </div>

              <button
                v-if="branch.ticketAvailable"
                type="button"
                class="primary-button compact"
                @click="openServiceModal(branch.branchId, branch.placeName)"
              >
                번호표 뽑기
              </button>
              <span v-else class="branch-unavailable">번호표 미운영 지점</span>
            </li>
          </ul>
        </section>
        <br /><br />

        <div
          v-if="operatingBranches.length === 0 && nearbyBranches.length === 0"
          class="ticket-state"
        >
          근처에서 지점을 찾지 못했어요.
        </div>
      </template>
    </div>

    <ModalSheet
      :show="showServiceModal"
      :title="issuedTicket ? '번호표가 발급되었어요' : '신청 업무를 선택해 주세요'"
      :description="selectedBranch?.displayName"
      @close="closeServiceModal"
    >
      <template v-if="issuedTicket">
        <div class="issued-ticket">
          <span class="issued-ticket-number">{{ issuedTicket.ticketNumber }}</span>
          <p>현재 {{ issuedTicket.waitingCount }}명이 대기 중이에요.</p>
        </div>
      </template>

      <template v-else>
        <div class="service-type-list">
          <button
            v-for="service in SERVICE_TYPES"
            :key="service.value"
            type="button"
            class="secondary-button"
            :disabled="issuing"
            @click="selectService(service.value)"
          >
            {{ service.label }}
          </button>
        </div>
        <small v-if="issueError" class="ticket-error" role="alert">{{ issueError }}</small>
      </template>

      <template #actions>
        <button type="button" class="primary-button compact" @click="closeServiceModal">
          닫기
        </button>
      </template>
    </ModalSheet>
    <BranchDetailModal :show="showDetailModal" :branch="detailBranch" @close="closeDetailModal" />
  </div>
</template>
