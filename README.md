# MiriZoom(미리줌) Frontend

프로젝트의 프론트엔드 애플리케이션 저장소입니다.

> 현재 개발 진행 중인 프로젝트입니다.
> 기능, 화면 구성, 실행 방법은 개발 상황에 따라 변경될 수 있습니다.

---

## 1. 프로젝트 소개

### 프로젝트명

`MiriZoom`

### 프로젝트 개요

본 프로젝트는 증여 계획 수립부터 증여 내역 관리, 금융상품 비교, AI 세법 상담까지 제공하는 디지털 증여 관리 서비스입니다.

### 주요 사용자

* 증여를 계획하는 사용자
* 가족별 증여 내역을 관리하려는 사용자
* 증여세 및 금융상품 정보를 확인하려는 사용자

### 개발 기간

* 시작일: `2026-07-19`
* 종료 예정일: `2026-08-26`

---

## 2. 개발 진행 상태

| 구분 | 기능         | 상태   |
| -- | ---------- | ---- |
| 공통 | 프로젝트 초기 설정 | 완료   |
| 공통 | 공통 레이아웃    | 진행 중 |
| 회원 | 로그인        | 예정   |
| 회원 | 회원가입       | 예정   |
| 증여 | 증여 시뮬레이션   | 예정   |
| 증여 | 증여 현황 조회   | 예정   |
| AI | AI 상담      | 예정   |

상태는 다음 기준으로 작성합니다.

* 예정
* 진행 중
* 코드 리뷰
* 완료
* 보류

---

## 3. 기술 스택

### Frontend

| 구분               | 기술                                    |
| ---------------- | ------------------------------------- |
| Framework        | ![Vue.js](https://img.shields.io/badge/vue.js-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)                                 |
| Language         | ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)              |
| Build Tool       | ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)                                  |
| State Management | ![Pinia](https://img.shields.io/badge/Pinia-FFD859?style=flat-square&logo=pinia&logoColor=black)                                |
| Routing          | ![Vue Router](https://img.shields.io/badge/Vue_Router-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)                            |
| HTTP Client      | ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)                                 |
| UI               |![CSS](https://img.shields.io/badge/css-%23663399.svg?style=for-the-badge&logo=css&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![Bootstrap](https://img.shields.io/badge/bootstrap-%238511FA.svg?style=for-the-badge&logo=bootstrap&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) |
| Package Manager  | ![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)                                   |

### 개발 도구

| 구분               | 도구                                 |
| ---------------- | ---------------------------------- |
| IDE              | ![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white) |
| Version Control  | ![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)                        |
| Issue Management | ![Jira](https://img.shields.io/badge/jira-%230A0FFF.svg?style=for-the-badge&logo=jira&logoColor=white) ![GitHub Issues](https://img.shields.io/badge/GitHub_Issues-181717?style=flat-square&logo=github&logoColor=white)                |
| API Test         | ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)                            |
| Design           | ![Figma](https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white)                              |
| Collaboration    | ![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white) ![Notion](https://img.shields.io/badge/Notion-%23000000.svg?style=for-the-badge&logo=notion&logoColor=white)                              |

---

## 4. 주요 기능

### 공통 기능

* 공통 헤더 및 사이드바
* 공통 버튼, 입력창, 모달 컴포넌트
* 페이지 로딩 처리
* 공통 오류 메시지 처리
* 인증 상태에 따른 화면 접근 제어

### 회원 기능

* 회원가입
* 로그인
* 로그아웃
* 사용자 정보 조회
* 가족 또는 수증자 등록

### 증여 시뮬레이션

* 수증자 선택
* 증여 금액 입력
* 누적 증여 금액 확인
* 예상 증여세 계산 결과 표시
* 증여 시나리오 비교
* 금융상품 예상 수익 비교

### 증여 현황 관리

* 수증자별 증여 내역 조회
* 누적 증여 금액 확인
* 증여 공제 기간 확인
* 증여 일정 관리

### AI 상담

* 세법 관련 질문 입력
* AI 답변 출력
* 관련 법령 및 출처 표시
* 상담 내역 조회

---

## 5. 화면 구성

| 경로               | 페이지      | 설명                | 인증  |
| ---------------- | -------- | ----------------- | --- |
| `/`              | 메인 페이지   | 서비스 소개 및 주요 기능 이동 | 불필요 |
| `/login`         | 로그인 페이지  | 사용자 로그인           | 불필요 |
| `/signup`        | 회원가입 페이지 | 신규 회원가입           | 불필요 |
| `/simulation`    | 증여 시뮬레이션 | 증여 시나리오 계산        | 필요  |
| `/gift-history`  | 증여 현황    | 증여 내역 및 누적 금액 조회  | 필요  |
| `/ai-consulting` | AI 상담    | 세법 관련 AI 상담       | 필요  |
| `/mypage`        | 마이페이지    | 사용자 및 가족 정보 관리    | 필요  |
| `/404`           | 오류 페이지   | 존재하지 않는 페이지 처리    | 불필요 |

---

## 6. 프로젝트 디렉터리 구조

```text
src/
├─ api/
│  ├─ authApi.js
│  ├─ memberApi.js
│  ├─ simulationApi.js
│  └─ consultingApi.js
│
├─ assets/
│  ├─ images/
│  ├─ icons/
│  └─ styles/
│
├─ components/
│  ├─ common/
│  │  ├─ BaseButton.vue
│  │  ├─ BaseInput.vue
│  │  ├─ BaseModal.vue
│  │  └─ LoadingSpinner.vue
│  ├─ layout/
│  │  ├─ AppHeader.vue
│  │  ├─ AppSidebar.vue
│  │  └─ AppFooter.vue
│  └─ domain/
│     ├─ simulation/
│     ├─ member/
│     └─ consulting/
│
├─ composables/
│  ├─ useAuth.js
│  └─ useLoading.js
│
├─ constants/
│  ├─ apiUrl.js
│  ├─ routeName.js
│  └─ statusCode.js
│
├─ layouts/
│  ├─ DefaultLayout.vue
│  └─ AuthLayout.vue
│
├─ pages/
│  ├─ home/
│  │  └─ HomePage.vue
│  ├─ auth/
│  │  ├─ LoginPage.vue
│  │  └─ SignupPage.vue
│  ├─ simulation/
│  │  └─ SimulationPage.vue
│  ├─ consulting/
│  │  └─ ConsultingPage.vue
│  └─ error/
│     └─ NotFoundPage.vue
│
├─ router/
│  └─ index.js
│
├─ stores/
│  ├─ authStore.js
│  ├─ memberStore.js
│  └─ simulationStore.js
│
├─ utils/
│  ├─ dateUtils.js
│  ├─ formatUtils.js
│  └─ validationUtils.js
│
├─ App.vue
└─ main.js
```

### 디렉터리 역할

| 디렉터리          | 설명                       |
| ------------- | ------------------------ |
| `api`         | 백엔드 API 요청 함수            |
| `assets`      | 이미지, 아이콘, 공통 스타일         |
| `components`  | 재사용 가능한 Vue 컴포넌트         |
| `composables` | Composition API 기반 공통 로직 |
| `constants`   | URL, 상태 코드, 라우트명 등의 상수   |
| `layouts`     | 페이지 공통 레이아웃              |
| `pages`       | 라우터와 연결되는 페이지 컴포넌트       |
| `router`      | Vue Router 설정            |
| `stores`      | Pinia 전역 상태 관리           |
| `utils`       | 날짜, 숫자, 유효성 검사 등의 공통 함수  |

---

## 7. 개발 환경 설정

### 필수 설치 항목

* Node.js
* npm
* Git

### 권장 버전

```text
Node.js: 24 이상
npm: 10 이상
```

설치된 버전은 다음 명령어로 확인합니다.

```bash
node -v
npm -v
git --version
```

---

## 8. 프로젝트 설치 및 실행

### 저장소 복제

```bash
git clone 저장소_URL
```

### 프로젝트 디렉터리 이동

```bash
cd 프로젝트_디렉터리
```

### 패키지 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

실행 후 브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:5173
```

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 결과 미리 보기

```bash
npm run preview
```

---

## 9. 환경 변수 설정

프로젝트 루트 경로에 `.env` 또는 `.env.local` 파일을 생성합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_AI_API_BASE_URL=http://localhost:8000
```

Vue와 Vite에서 사용하는 환경 변수는 반드시 `VITE_` 접두사로 시작해야 합니다.

사용 예시:

```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
```

환경 변수 파일에는 API 키, 비밀번호, 토큰과 같은 민감 정보를 직접 커밋하지 않습니다.

`.gitignore` 예시:

```gitignore
.env
.env.local
.env.*.local
node_modules/
dist/
```

팀원이 참고할 수 있도록 `.env.example` 파일을 별도로 관리합니다.

```env
VITE_API_BASE_URL=
VITE_AI_API_BASE_URL=
```

---

## 10. API 요청 구조

Axios 인스턴스 예시:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default apiClient;
```

API 파일 작성 예시:

```javascript
import apiClient from '@/api/apiClient';

export const login = async (loginData) => {
  const response = await apiClient.post('/api/auth/login', loginData);
  return response.data;
};
```

---

## 11. 라우터 작성 규칙

라우트 이름은 문자열을 직접 반복해서 작성하지 않고 상수로 관리하는 것을 권장합니다.

```javascript
export const ROUTE_NAME = {
  HOME: 'home',
  LOGIN: 'login',
  SIGNUP: 'signup',
  SIMULATION: 'simulation',
  CONSULTING: 'consulting',
};
```

라우터 설정 예시:

```javascript
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/pages/home/HomePage.vue';
import LoginPage from '@/pages/auth/LoginPage.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      requiresAuth: false,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

인증이 필요한 페이지는 다음 메타 정보를 사용합니다.

```javascript
meta: {
  requiresAuth: true,
}
```

---

## 12. 컴포넌트 작성 규칙

### 컴포넌트 이름

Vue 컴포넌트 파일은 PascalCase를 사용합니다.

```text
BaseButton.vue
LoginForm.vue
SimulationResultCard.vue
```

### 기본 컴포넌트

재사용성이 높은 공통 컴포넌트에는 `Base` 접두사를 사용합니다.

```text
BaseButton.vue
BaseInput.vue
BaseModal.vue
BaseTable.vue
```

### 페이지 컴포넌트

라우터에 직접 등록되는 컴포넌트에는 `Page` 접미사를 사용합니다.

```text
HomePage.vue
LoginPage.vue
SimulationPage.vue
```

### Props 작성 예시

```vue
<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
</script>
```

### Emits 작성 예시

```vue
<script setup>
const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click');
};
</script>
```

---

## 13. 코드 작성 규칙

### 변수와 함수

camelCase를 사용합니다.

```javascript
const userName = '홍길동';

const getUserInfo = () => {};
```

### 상수

대문자와 언더스코어를 사용합니다.

```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024;
```

### Boolean 변수

의미를 명확히 하기 위해 `is`, `has`, `can`, `should` 접두사를 사용합니다.

```javascript
const isLoading = false;
const hasPermission = true;
const canSubmit = true;
```

### 이벤트 처리 함수

`handle` 접두사를 사용합니다.

```javascript
const handleSubmit = () => {};
const handleLogin = () => {};
const handleModalClose = () => {};
```

### API 함수

동작을 나타내는 동사로 시작합니다.

```javascript
getMembers();
createMember();
updateMember();
deleteMember();
```

---

## 14. Git 브랜치 전략

| 브랜치         | 설명           |
| ----------- | ------------ |
| `main`      | 배포 가능한 안정 버전 |
| `dev`       | 개발 기능 통합 브랜치 |
| `feature/*` | 신규 기능 개발     |
| `fix/*`     | 일반 오류 수정     |
| `hotfix/*`  | 운영 환경 긴급 수정  |

브랜치명에는 Jira 티켓 번호와 작업명을 포함합니다.

```text
feature/KAN-10_login-page
feature/KAN-21_simulation-result
fix/KAN-35_router-auth-error
```

### 작업 브랜치 생성

```bash
git checkout dev
git pull origin dev
git checkout -b feature/KAN-10_login-page
```

### 작업 완료 후 Push

```bash
git add .
git commit -m "KAN-10 feat: 로그인 페이지 구현"
git push origin feature/KAN-10_login-page
```

`main`과 `dev` 브랜치에는 직접 Push하지 않습니다.

---

## 15. 커밋 메시지 규칙

커밋 메시지는 다음 형식을 사용합니다.

```text
타입: 작업 내용
```

Jira 티켓 번호를 포함하는 경우:

```text
KAN-10 feat: 로그인 페이지 구현
```

### 커밋 타입

| 타입         | 설명             |
| ---------- | -------------- |
| `feat`     | 새로운 기능 추가      |
| `fix`      | 오류 수정          |
| `design`   | UI 및 스타일 수정    |
| `refactor` | 기능 변경 없는 코드 개선 |
| `docs`     | 문서 수정          |
| `test`     | 테스트 코드 작성      |
| `chore`    | 환경 설정, 패키지 변경  |
| `rename`   | 파일명 또는 경로 변경   |
| `remove`   | 파일 또는 코드 삭제    |

예시:

```text
KAN-10 feat: 로그인 폼 구현
KAN-11 fix: 토큰 만료 시 라우팅 오류 수정
KAN-12 design: 메인 페이지 카드 스타일 수정
KAN-13 refactor: API 요청 로직 분리
KAN-14 docs: README 실행 방법 추가
```

---

## 16. Pull Request 규칙

Pull Request는 기능 단위로 작성합니다.

### PR 제목

```text
[KAN-10] 로그인 페이지 구현
```

### PR 본문 예시

```md
## 작업 내용

- 로그인 입력 폼 구현
- 로그인 API 연동
- 로그인 성공 후 메인 페이지 이동
- 로그인 실패 메시지 출력

## 변경 화면

- 로그인 페이지

## 테스트 내용

- 정상 계정 로그인 확인
- 잘못된 비밀번호 입력 확인
- 빈 입력값 유효성 검사 확인

## 관련 티켓

- KAN-10

## 참고 사항

- 백엔드 로그인 API가 실행되어 있어야 테스트할 수 있습니다.
```

### PR 확인 사항

* 불필요한 콘솔 출력 제거
* 사용하지 않는 import 제거
* 환경 변수 및 비밀 정보 포함 여부 확인
* 로컬 실행 확인
* 관련 기능 테스트 완료
* 충돌 여부 확인
* Jira 티켓 연결 확인

---

## 17. 협업 절차

1. Jira 티켓을 확인합니다.
2. GitHub Issue를 생성하거나 연결합니다.
3. 최신 `develop`브랜치를 Pull합니다.
4. 작업 브랜치를 생성합니다.
5. 기능을 구현합니다.
6. 로컬에서 테스트합니다.
7. 커밋 후 원격 저장소에 Push합니다.
8. `develop` 브랜치를 대상으로 Pull Request를 생성합니다.
9. 코드 리뷰를 반영합니다.
10. 승인 후 병합합니다.
11. Jira 티켓 상태를 완료로 변경합니다.

---

## 18. 개발 시 주의사항

* `main`, `develop` 브랜치에 직접 Push하지 않습니다.
* API 주소를 코드에 직접 작성하지 않습니다.
* Access Token, API Key, 비밀번호를 커밋하지 않습니다.
* 공통으로 사용할 수 있는 UI는 컴포넌트로 분리합니다.
* 페이지 컴포넌트에 모든 로직을 작성하지 않습니다.
* API 요청 함수는 `api` 디렉터리로 분리합니다.
* 전역 상태가 필요할 때만 Pinia를 사용합니다.
* 임시 데이터에는 주석 또는 TODO를 표시합니다.
* 작업 완료 전 `npm run build`를 실행해 빌드 오류를 확인합니다.

---

## 19. TODO

### 공통

* [ ] Vue 프로젝트 초기 설정
* [ ] Vue Router 설정
* [ ] Pinia 설정
* [ ] Axios 인스턴스 설정
* [ ] 환경 변수 설정
* [ ] 공통 레이아웃 구현
* [ ] 공통 컴포넌트 구현
* [ ] 오류 처리 구조 구현

### 회원

* [ ] 회원가입 페이지
* [ ] 로그인 페이지
* [ ] 인증 상태 관리
* [ ] 로그아웃
* [ ] 마이페이지

### 증여 시뮬레이션

* [ ] 증여 정보 입력 폼
* [ ] 증여세 계산 결과 화면
* [ ] 시나리오 비교 화면
* [ ] 금융상품 비교 차트
* [ ] 결과 저장 기능

### AI 상담

* [ ] 상담 질문 입력
* [ ] 답변 출력
* [ ] 로딩 상태 처리
* [ ] 답변 출처 표시
* [ ] 상담 내역 조회

---

## 20. 알려진 문제

| 문제                 | 원인           | 상태    |
| ------------------ | ------------ | ----- |
| 새로고침 시 인증 상태 초기화   | 토큰 복원 로직 미구현 | 수정 예정 |
| API 서버 미실행 시 화면 오류 | 공통 오류 처리 미구현 | 진행 중  |
| 모바일 화면 레이아웃 깨짐     | 반응형 스타일 미완성  | 수정 예정 |

---

## 21. 팀원 및 담당 기능

| 이름  | 담당 기능          |
| --- | -------------- |
| 팀원명 | 공통 컴포넌트 및 레이아웃 |
| 팀원명 | 회원가입 및 로그인     |
| 팀원명 | 증여 시뮬레이션       |
| 팀원명 | 증여 현황 관리       |
| 팀원명 | AI 상담          |

담당 기능은 개발 상황에 따라 변경될 수 있습니다.

---

## 22. 관련 문서

* API 명세서: `https://app.notion.com/p/API-4980fc2f0eff82388e4d01106256dc6f?source=copy_link`
* Figma: `https://www.figma.com/design/LndmaUkYhdadsAhZ9UJ30k/PJT%EC%9E%91%EC%97%85%EC%8B%A4?node-id=1-104&t=vjN5NQSlAktdFQWh-0`
* Jira 프로젝트: `https://lshyeong47.atlassian.net/jira/software/projects/KAN/summary`
* Notion 문서: `https://app.notion.com/p/KB-48a0fc2f0eff83b0b049810b0e652d8c?source=copy_link`
* Backend 저장소: `링크 입력`
* 배포 주소: 개발 완료 후 추가 예정

---

## 23. 문의

프로젝트 관련 문의는 GitHub Issue 또는 프로젝트 협업 채널을 이용합니다.
