<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import PageHeading from '../components/layout/PageHeading.vue'
import { useAuthStore } from '../stores/authStore.js'
import '../assets/css/legal-document.css'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const documents = {
  terms: {
    title: '이용약관',
    description: '미리줌 서비스 이용에 필요한 기본 원칙과 정보 제공 범위를 안내합니다.',
    sections: [
      {
        title: '1. 서비스의 목적',
        paragraphs: [
          '미리줌은 가족의 증여 계획을 이해하고 비교할 수 있도록 시뮬레이션, AI 상담, 금융상품 및 증여 관련 정보를 제공하는 서비스입니다.',
        ],
      },
      {
        title: '2. 정보 제공의 성격',
        paragraphs: [
          '서비스에서 제공하는 내용은 일반적인 정보 제공과 참고용 가이드라인을 목적으로 합니다.',
          '계산 결과와 안내 내용은 사용자가 입력한 정보, 적용 기준, 법령 및 상품 조건에 따라 달라질 수 있습니다.',
        ],
        emphasized: true,
      },
      {
        title: '3. 전문가 확인이 필요한 사항',
        paragraphs: [
          '서비스의 정보는 법률·세무·투자 자문이나 실제 신고의 근거를 대신하지 않습니다.',
          '중요한 의사결정이나 실제 신고 전에는 세무사 등 관련 전문가 또는 관계 기관을 통해 최신 기준과 개인별 적용 내용을 확인해 주세요.',
        ],
      },
      {
        title: '4. 이용자의 책임',
        items: [
          '회원정보와 시뮬레이션 입력값은 정확한 내용으로 작성해 주세요.',
          '다른 사람의 정보를 동의 없이 입력하거나 부정한 목적으로 서비스를 이용해서는 안 됩니다.',
          '계정과 인증정보가 타인에게 노출되지 않도록 안전하게 관리해 주세요.',
        ],
      },
      {
        title: '5. 서비스의 변경 및 중단',
        paragraphs: [
          '서비스 품질 개선, 점검 또는 운영상 필요에 따라 기능과 제공 내용이 변경되거나 일시적으로 중단될 수 있습니다. 중요한 변경이 있는 경우 서비스 화면을 통해 안내합니다.',
        ],
      },
    ],
  },
  privacy: {
    title: '개인정보 처리방침',
    description: '미리줌이 다루는 개인정보와 보호 원칙을 이해하기 쉽게 안내합니다.',
    sections: [
      {
        title: '1. 수집하는 개인정보',
        items: [
          '회원가입 필수 정보: 이름, 이메일, 비밀번호, 생년월일, 전화번호',
          '선택 또는 서비스 이용 정보: 프로필 이미지, 가족·수증자 정보, 증여 이력, 시뮬레이션 결과, 상담 내용',
          '서비스 이용 과정에서 생성될 수 있는 정보: 접속 기록, 서비스 이용 기록, 오류 기록',
        ],
      },
      {
        title: '2. 개인정보 이용 목적',
        items: [
          '회원 가입과 본인 식별, 계정 관리',
          '증여 시뮬레이션, AI 상담, 이력 관리 등 핵심 기능 제공',
          '서비스 이용 안내와 알림 제공',
          '오류 확인, 부정 이용 방지 및 서비스 품질 개선',
        ],
      },
      {
        title: '3. 보관 및 파기 원칙',
        paragraphs: [
          '개인정보는 회원 탈퇴 또는 이용 목적이 달성될 때 지체 없이 파기하는 것을 원칙으로 합니다.',
          '관계 법령에 따라 일정 기간 보관이 필요한 정보는 해당 기간 동안 다른 정보와 분리하여 보관한 뒤 안전하게 파기합니다.',
        ],
      },
      {
        title: '4. 이용자의 권리',
        paragraphs: [
          '이용자는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보 삭제를 요청할 수 있습니다.',
          '개인정보 처리와 관련한 문의나 권리 행사는 서비스 내 제공되는 문의 경로를 통해 요청할 수 있습니다.',
        ],
      },
      {
        title: '5. 안전성 확보 조치',
        items: [
          '비밀번호는 원문을 확인할 수 없는 방식으로 변환하여 관리합니다.',
          '개인정보 보호를 위해 암호화, 접근 권한 관리 및 접속 기록 관리 등 필요한 보호 조치를 적용합니다.',
          '보관 목적이 끝난 개인정보는 복구하기 어려운 방법으로 안전하게 파기합니다.',
        ],
      },
      {
        title: '6. 방침의 변경',
        paragraphs: [
          '서비스 또는 관련 기준의 변경으로 처리방침이 달라지는 경우 변경 내용과 적용 시점을 서비스 화면을 통해 안내합니다.',
        ],
      },
    ],
  },
}

const documentKey = computed(() => (route.name === 'privacy-policy' ? 'privacy' : 'terms'))
const currentDocument = computed(() => documents[documentKey.value])

function goBack() {
  const previousPath = window.history.state?.back
  if (typeof previousPath === 'string' && previousPath.startsWith('/')) {
    router.back()
    return
  }

  router.push({ name: authStore.isLogin ? 'my' : 'signup' })
}
</script>

<template>
  <div class="page legal-document-page">
    <AppHeader />

    <div class="page-content legal-document-content">
      <PageHeading
        :title="currentDocument.title"
        heading-id="legal-document-title"
        :kicker="currentDocument.kicker"
        :description="currentDocument.description"
        back
        back-label="이전 화면"
        @back="goBack"
      />

      <nav class="legal-document-tabs" aria-label="약관 및 개인정보 안내">
        <RouterLink :to="{ name: 'terms' }">이용약관</RouterLink>
        <RouterLink :to="{ name: 'privacy-policy' }">개인정보 처리방침</RouterLink>
      </nav>

      <article class="legal-document-card">
        <div class="legal-document-meta">
          <span>서비스 안내용 초안</span>
          <span>안내 기준일 2026.08.19</span>
        </div>

        <section
          v-for="section in currentDocument.sections"
          :key="section.title"
          class="legal-document-section"
          :class="{ 'legal-document-section--emphasized': section.emphasized }"
        >
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <ul v-if="section.items">
            <li v-for="item in section.items" :key="item">{{ item }}</li>
          </ul>
        </section>

        <p class="legal-document-draft-note">
          본 문서는 서비스 이용자의 이해를 돕기 위한 안내 초안이며, 운영 정책과 관련 기준에 따라
          보완될 수 있습니다.
        </p>
      </article>
    </div>
  </div>
</template>
