<script setup>
import AppIcon from "./AppIcon.vue";

const items = [
  {
    to: "/simulation",
    label: "시뮬레이션",
    shortLabel: "시뮬레이션",
    icon: "calculator",
  },
  { to: "/status", label: "현황", shortLabel: "현황", icon: "chart" },
  { to: "/", label: "홈", shortLabel: "홈", icon: "home" },
  { to: "/chat", label: "AI 상담", shortLabel: "상담", icon: "chat" },
  { to: "/my", label: "내 정보", shortLabel: "마이", icon: "user" },
];
</script>

<template>
  <nav class="bottom-nav" aria-label="주요 메뉴">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav-item"
    >
      <span class="nav-icon"><AppIcon :name="item.icon" :size="21" /></span>
      <span class="nav-label nav-label-full">{{ item.label }}</span>
      <span class="nav-label nav-label-short">{{ item.shortLabel }}</span>
    </RouterLink>
  </nav>
</template>
