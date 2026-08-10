<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { resolveProfileImageUrl, validateProfileImage } from '../../utils/profileImage'
import '../../assets/css/profile-image-field.css'

const props = defineProps({
  imageUrl: { type: String, default: '' },
  displayName: { type: String, default: '사용자' },
  initialLength: { type: Number, default: 1 },
  maxBytes: { type: Number, required: true },
  showLabel: { type: Boolean, default: true },
  disabled: Boolean,
})

const emit = defineEmits(['update:file', 'update:remove', 'update:valid'])
const input = ref(null)
const selectedPreview = ref('')
const removed = ref(false)
const imageFailed = ref(false)
const error = ref('')

const initials = computed(() => {
  const name = props.displayName.trim() || '사용자'
  const length = Math.max(1, props.initialLength)
  return length === 1 ? name.slice(0, 1) : name.slice(-length)
})
const currentImage = computed(() => resolveProfileImageUrl(props.imageUrl))
const preview = computed(() => (removed.value ? '' : selectedPreview.value || currentImage.value))
const maxMegabytes = computed(() => Math.floor(props.maxBytes / 1024 / 1024))

function revokePreview() {
  if (selectedPreview.value) URL.revokeObjectURL(selectedPreview.value)
  selectedPreview.value = ''
}

function openPicker() {
  if (!props.disabled) input.value?.click()
}

function selectFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  const message = validateProfileImage(file, props.maxBytes)
  if (message) {
    revokePreview()
    error.value = message
    emit('update:file', null)
    emit('update:valid', false)
    return
  }

  revokePreview()
  selectedPreview.value = URL.createObjectURL(file)
  removed.value = false
  imageFailed.value = false
  error.value = ''
  emit('update:file', file)
  emit('update:remove', false)
  emit('update:valid', true)
}

function removeImage() {
  revokePreview()
  removed.value = true
  imageFailed.value = false
  error.value = ''
  emit('update:file', null)
  emit('update:remove', true)
  emit('update:valid', true)
}

watch(
  () => props.imageUrl,
  () => {
    imageFailed.value = false
  },
)

onBeforeUnmount(revokePreview)
</script>

<template>
  <section
    class="profile-image-field"
    :aria-labelledby="showLabel ? 'profile-image-label' : undefined"
    :aria-label="showLabel ? undefined : '프로필 사진'"
  >
    <span v-if="showLabel" id="profile-image-label" class="profile-image-label">프로필 사진</span>
    <button
      class="profile-image-picker"
      type="button"
      :disabled="disabled"
      aria-label="프로필 사진 선택 또는 변경"
      @click="openPicker"
    >
      <span class="profile-image-preview">
        <img
          v-if="preview && !imageFailed"
          :src="preview"
          alt="선택한 프로필 사진 미리보기"
          @error="imageFailed = true"
        />
        <span v-else>{{ initials }}</span>
      </span>
      <span class="profile-image-camera" aria-hidden="true">
        <AppIcon name="plus" :size="14" />
      </span>
    </button>

    <input
      ref="input"
      class="profile-image-input"
      type="file"
      accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
      :disabled="disabled"
      @change="selectFile"
    />

    <div class="profile-image-actions">
      <button class="soft-button" type="button" :disabled="disabled" @click="openPicker">
        사진 선택 또는 변경
      </button>
      <button
        v-if="preview"
        class="profile-image-remove"
        type="button"
        :disabled="disabled"
        @click="removeImage"
      >
        사진 삭제
      </button>
    </div>
    <p class="profile-image-help">JPG, PNG, GIF, WebP · 최대 {{ maxMegabytes }}MB</p>
    <p v-if="error" class="profile-field-error" role="alert">{{ error }}</p>
  </section>
</template>
