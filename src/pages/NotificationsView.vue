<script setup>
import { computed, onMounted } from "vue";
import AppHeader from "../components/layout/AppHeader.vue";
import AppIcon from "../components/layout/AppIcon.vue";
import { useAppStore } from "../stores/appStore";

const store = useAppStore();
const groups = computed(() => {
  const grouped = new Map();
  store.state.notifications.forEach((item) => {
    if (!grouped.has(item.group)) grouped.set(item.group, []);
    grouped.get(item.group).push(item);
  });
  return [...grouped.entries()];
});

onMounted(() => {
  window.setTimeout(store.markNotificationsRead, 500);
});
</script>

<template>
  <div class="page notifications-page">
    <AppHeader title="알림" back />
    <div class="page-content narrow-content">
      <section
        v-for="[group, items] in groups"
        :key="group"
        class="notification-group"
      >
        <h2>{{ group }}</h2>
        <article
          v-for="item in items"
          :key="item.id"
          class="notification-card"
          :class="{ unread: item.unread }"
        >
          <div class="notification-card-icon" :class="item.type">
            <AppIcon
              :name="
                item.type === 'warning'
                  ? 'clock'
                  : item.type === 'success'
                    ? 'check'
                    : 'info'
              "
              :size="20"
            />
          </div>
          <div class="notification-card-copy">
            <div class="notification-card-meta">
              <span class="pill" :class="item.type">{{ item.badge }}</span>
              <time>{{ item.time }}</time>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </div>
        </article>
      </section>
      <p class="list-end-note">최근 30일의 알림을 모두 확인했어요.</p>
    </div>
  </div>
</template>
