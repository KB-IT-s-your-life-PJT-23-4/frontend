<script setup>
import { nextTick, ref, watch } from 'vue'
import ModalSheet from '../layout/ModalSheet.vue'
import { loadKakaoMapSdk } from '@/utils/loadKakaoMapSdk.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  branch: { type: Object, default: null },
})

defineEmits(['close'])

const mapContainer = ref(null)
const mapError = ref('')

let mapInstance = null
let markerInstance = null

function kakaoMapLink(branch) {
  if (!branch) return ''
  return `https://map.kakao.com/link/map/${encodeURIComponent(branch.name)},${branch.y},${branch.x}`
}

async function renderMap() {
  if (!props.branch || !mapContainer.value) return

  mapError.value = ''

  try {
    const kakao = await loadKakaoMapSdk()
    const position = new kakao.maps.LatLng(props.branch.y, props.branch.x)

    if (!mapInstance) {
      mapInstance = new kakao.maps.Map(mapContainer.value, {
        center: position,
        level: 3,
      })
      mapInstance.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT)
    } else {
      mapInstance.setCenter(position)
    }

    if (markerInstance) {
      markerInstance.setMap(null)
    }
    markerInstance = new kakao.maps.Marker({ position })
    markerInstance.setMap(mapInstance)

    // 모달 등장 애니메이션이 끝난 뒤 컨테이너 크기를 다시 계산해야 지도가 잘려 보이지 않는다.
    setTimeout(() => mapInstance?.relayout(), 80)
  } catch (error) {
    mapError.value = error.message || '지도를 불러오지 못했어요.'
  }
}

watch(
  () => [props.show, props.branch],
  async ([show]) => {
    if (!show) return
    await nextTick()
    renderMap()
  },
  { immediate: true },
)
</script>

<template>
  <ModalSheet :show="props.show" :title="branch?.name" @close="$emit('close')">
    <div v-if="branch" class="branch-detail">
      <div ref="mapContainer" class="branch-map"></div>
      <p v-if="mapError" class="branch-detail-note">{{ mapError }}</p>

      <dl class="branch-detail-list">
        <template v-if="branch.roadAddress">
          <dt>도로명 주소</dt>
          <dd>{{ branch.roadAddress }}</dd>
        </template>
        <template v-if="branch.jibunAddress">
          <dt>지번 주소</dt>
          <dd>{{ branch.jibunAddress }}</dd>
        </template>
      </dl>

      <a
        v-if="branch.placeUrl"
        class="secondary-button compact branch-detail-link"
        :href="branch.placeUrl"
        target="_blank"
        rel="noreferrer"
      >
        카카오맵에서 영업시간 확인하기
      </a>
      <small v-else class="branch-detail-note">
        영업시간 정보는 카카오맵에서 별도로 확인해 주세요.
      </small>
    </div>

    <template #actions>
      <button type="button" class="primary-button compact" @click="$emit('close')">닫기</button>
    </template>
  </ModalSheet>
</template>

<style scoped>
.branch-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.branch-map {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-muted, #f3f4f6);
}

.branch-detail-list {
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 6px;
  column-gap: 12px;
  margin: 0;
}

.branch-detail-list dt {
  font-size: 13px;
  color: var(--text-muted, #6b7280);
  white-space: nowrap;
}

.branch-detail-list dd {
  font-size: 14px;
  margin: 0;
}

.branch-detail-link {
  text-align: center;
}

.branch-detail-note {
  color: var(--text-muted, #9ca3af);
  text-align: center;
}
</style>
