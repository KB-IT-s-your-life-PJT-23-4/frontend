<script setup>
import { useRouter } from "vue-router";
import AppIcon from "./AppIcon.vue";
import { useAppStore } from "../../stores/appStore.js";

defineProps({
  title: { type: String, default: "" },
  back: { type: Boolean, default: false },
});

const router = useRouter();
const store = useAppStore();
</script>

<template>
  <header class="app-header">
    <button
      v-if="back"
      class="icon-button header-back"
      type="button"
      aria-label="뒤로 가기"
      @click="router.back()"
    >
      <AppIcon name="back" :size="21" />
    </button>
    <RouterLink v-else class="brand-lockup" to="/" aria-label="미리줌 홈">
      <span class="brand-avatar"><AppIcon name="user" :size="19" /></span>
      <span>미리줌</span>
    </RouterLink>

    <h1 v-if="title" class="header-title">{{ title }}</h1>
    <span v-else class="header-spacer" />

    <RouterLink
      class="icon-button notification-button"
      to="/notifications"
      aria-label="알림 보기"
    >
      <AppIcon name="bell" :size="20" />
      <span v-if="store.unreadCount.value" class="notification-dot">
        {{ store.unreadCount.value }}
      </span>
    </RouterLink>
  </header>
</template>
