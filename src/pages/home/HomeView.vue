<script setup>
import calculatorIcon from '@/assets/home/calculator.png'
import editIcon from '@/assets/home/edit.png'
import heroImage from '@/assets/home/hero-family.png'
</script>

<template>
  <main class="home-main" data-node-id="40:4786">
    <section class="hero-card" data-node-id="40:4787">
      <img class="hero-card__image" :src="heroImage" alt="함께 웃고 있는 가족" />
      <div class="hero-card__overlay" aria-hidden="true"></div>
      <div class="hero-card__copy">
        <p>나의 목표</p>
        <h1>우리 가족 행복 플랜</h1>
      </div>
      <button class="hero-card__edit" type="button" aria-label="가족 목표 수정">
        <img :src="editIcon" alt="" />
      </button>
    </section>

    <section class="simulation-card" data-node-id="40:4884">
      <div class="simulation-card__heading">
        <span class="simulation-card__icon" aria-hidden="true">
          <img :src="calculatorIcon" alt="" />
        </span>
        <h2>내 증여세,<br />1분 만에 계산하기</h2>
      </div>

      <button class="simulation-card__button" type="button">
        <span>증여 시뮬레이션 시작하기</span>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </button>
    </section>
  </main>
</template>

<style scoped src="./home.css"></style>
