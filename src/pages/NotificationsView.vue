<script setup>
import { computed, onMounted, ref } from "vue";
import AppHeader from "../components/layout/AppHeader.vue";
import AppIcon from "../components/layout/AppIcon.vue";
import PageHeading from "../components/layout/PageHeading.vue";
import { useAppStore } from "../stores/appStore";

const store = useAppStore();
const loading = ref(false);
const loadError = ref("");

const groups = computed(() => {
  const grouped = new Map();
  store.notifications.value.forEach((item) => {
    if (!grouped.has(item.group)) grouped.set(item.group, []);
    grouped.get(item.group).push(item);
  });
  return [...grouped.entries()];
});

// 리마인더는 서버가 조회 시점에 계산하므로 화면에 들어올 때마다 새로 읽는다.
onMounted(async () => {
  loading.value = true;
  try {
    await store.ensureStatusLoaded();
  } catch (error) {
    loadError.value = error.message || "알림을 불러오지 못했어요.";
  } finally {
    loading.value = false;
  }

  // 읽음 처리는 화면을 잠깐 본 뒤에. 스쳐 지나간 알림까지 읽음으로 만들지 않는다.
  window.setTimeout(() => {
    store.markNotificationsRead().catch(() => {});
  }, 500);
});
</script>

<template>
  <div class="page notifications-page">
    <AppHeader />
    <div class="page-content narrow-content">
      <PageHeading title="알림" />

      <p v-if="loading" class="list-end-note">알림을 불러오는 중이에요.</p>
      <p v-else-if="loadError" class="list-end-note">{{ loadError }}</p>
      <p v-else-if="!groups.length" class="list-end-note">
        아직 도착한 알림이 없어요.
      </p>

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
      <p v-if="groups.length" class="list-end-note">
        기한이 지난 알림은 30일간 보여드려요.
      </p>
    </div>
  </div>
</template>
