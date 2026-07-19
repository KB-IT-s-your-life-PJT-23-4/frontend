<script setup>
import notificationIcon from '@/assets/home/notification.png'
import profileIcon from '@/assets/home/profile.png'
</script>

<template>
  <header class="app-header" data-node-id="211:13">
    <div class="app-header__inner">
      <a class="brand" href="/" aria-label="미리줌 홈">
        <span class="brand__mark" aria-hidden="true">
          <img :src="profileIcon" alt="" />
        </span>
        <span class="brand__name">미리줌</span>
      </a>

      <button class="notification-button" type="button" aria-label="알림 열기">
        <img :src="notificationIcon" alt="" />
        <span class="notification-button__badge" aria-hidden="true"></span>
      </button>
    </div>
  </header>
</template>
