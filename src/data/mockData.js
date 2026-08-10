export const initialState = {
  user: {
    id: 1,
    name: '김지수',
    loginId: 'kimjiso123',
    birthDate: '1970.01.01',
    phone: '010-1234-5678',
    email: 'jisoo.kim@example.com',
    address: '서울특별시 강남구 테헤란로 123',
    joinedAt: '2023.01.15',
  },
  selectedFamilyId: 1,
  families: [
    {
      id: 1,
      name: '김서윤',
      relation: '자녀',
      birthDate: '2002.11.20',
      peerAverageGiftAmount: 32000000,
      deductionLimit: 50000000,
      giftedAmount: 20000000,
      resetDate: '2034.01.15',
      resetLabel: '7년 6개월',
      tone: 'blue',
    },
    {
      id: 2,
      name: '김도현',
      relation: '자녀',
      birthDate: '2005.06.12',
      peerAverageGiftAmount: 28000000,
      deductionLimit: 50000000,
      giftedAmount: 10000000,
      resetDate: '2035.05.20',
      resetLabel: '8년 10개월',
      tone: 'mint',
    },
    {
      id: 3,
      name: '김하윤',
      relation: '자녀',
      birthDate: '2008.09.18',
      peerAverageGiftAmount: 18000000,
      deductionLimit: 50000000,
      giftedAmount: 0,
      resetDate: '미정',
      resetLabel: '증여 이력 없음',
      tone: 'blue',
    },
  ],
  giftHistory: [
    {
      id: 101,
      familyId: 1,
      date: '2024.01.15',
      type: '현금',
      amount: 10000000,
      status: 'COMPLETED',
    },
    {
      id: 102,
      familyId: 1,
      date: '2023.05.20',
      type: '현금',
      amount: 10000000,
      status: 'COMPLETED',
    },
    {
      id: 103,
      familyId: 2,
      date: '2025.05.20',
      type: '현금',
      amount: 10000000,
      status: 'COMPLETED',
    },
  ],
  plans: [
    {
      id: 701,
      familyId: 1,
      resultId: 201,
      title: '공제 한도 우선 증여',
      amount: 5000000,
      currentAmount: 5000000,
      deferredAmount: 0,
      giftDate: '2026.08.20',
      productName: 'KB Star 정기예금',
      productType: 'DEPOSIT',
      rate: 3.2,
      status: 'PLANNED',
    },
  ],
  // 저장했지만 아직 증여로 등록하지 않은 시뮬레이션. 데모 모드에는 등록 흐름이 없어 비워 둔다.
  simulationPlans: [],
  simulations: [
    { id: 301, familyId: 1, date: '2026.07.20 14:30', amount: 80000000, tax: 5000000 },
    { id: 302, familyId: 1, date: '2026.07.15 10:20', amount: 60000000, tax: 3000000 },
    { id: 303, familyId: 2, date: '2026.07.01 09:45', amount: 50000000, tax: 0 },
  ],
  notifications: [
    {
      id: 1,
      group: '오늘',
      type: 'success',
      badge: '한도 상황',
      title: '김서윤 님의 증여 계획이 저장됐어요',
      body: '이번 계획을 통해 5,000만원 한도 안에서 차근차근 준비할 수 있어요.',
      time: '방금 전',
      unread: true,
    },
    {
      id: 2,
      group: '오늘',
      type: 'warning',
      badge: 'D-30',
      title: '증여세 신고 기한이 한 달 남았어요',
      body: '신고 전 필수 서류 체크리스트를 미리 확인해 보세요.',
      time: '오후 2:30',
      unread: true,
    },
    {
      id: 3,
      group: '이번 주',
      type: 'info',
      badge: '새 정보',
      title: '금융상품 정보가 새로 업데이트됐어요',
      body: '2026년 7월 기준 금리와 위험도를 반영했어요.',
      time: '3일 전',
      unread: false,
    },
  ],
  documents: [
    {
      id: 'family',
      label: '가족관계증명서',
      // 증여자와 수증자의 관계는 회차가 바뀌어도 그대로라 한 번 발급하면 회차 전체에 쓴다.
      scope: 'plan',
      description: '수증자와의 관계 증명',
      intro:
        '증여자와 수증자가 어떤 가족 관계인지 확인하는 서류예요. 관계에 따라 공제 한도(직계존비속 5,000만원, 배우자 6억원 등)가 달라지기 때문에 꼭 필요해요. 주민센터나 아래 사이트에서 발급할 수 있어요.',
      guide: {
        title: '발급할 때 확인하세요',
        plain: true,
        steps: [
          '증여자 기준으로 발급해야 수증자와의 관계가 나타나요',
          '일반 증명서에는 관계가 일부만 나오니 상세 증명서로 발급하세요',
        ],
      },
      links: [
        {
          label: '전자가족관계등록시스템',
          icon: 'external',
          primary: true,
          href: 'https://efamily.scourt.go.kr',
        },
        {
          label: '정부24',
          icon: 'external',
          href: 'https://www.gov.kr',
        },
      ],
    },
    {
      id: 'transfer',
      label: '이체확인증',
      // 회차마다 송금이 따로 일어나므로 회차별로 다시 발급해야 한다.
      scope: 'tranche',
      description: '실제 자금 이동 기록',
      guide: {
        title: 'KB스타뱅킹 발급 방법',
        steps: [
          'KB스타뱅킹 앱 실행 > 로그인',
          '홈 화면 > 해당 계좌의 [더보기] 메뉴',
          '[이체결과조회(이체확인증)] 선택',
          '증여 대금 송금 [조회기간] 입력',
          '[조회] 클릭 > 이체확인증 저장 및 발급',
        ],
      },
      sampleImage: '/samples/transfer-confirmation.png',
      sampleCaption: '은행에서 발급한 이체확인증 예시',
    },
    {
      id: 'tax',
      label: '증여세 신고서',
      // 회차마다 증여일이 달라 신고기한도 따로 온다. 회차별로 각각 신고한다.
      scope: 'tranche',
      description: '세무서 제출용 서식',
      intro:
        '홈택스(PC/모바일) 또는 세무서에서 직접 작성할 수 있습니다. 증여재산 평가 명세서와 함께 제출해야 합니다.',
      guide: {
        title: '신고 서류 작성 순서',
        plain: true,
        steps: ['증여재산 및 평가명세서', '증여세 과세표준 신고 및 자진납부계산서', '자진 납부서'],
      },
      links: [
        {
          label: '한 번에 작성하기',
          icon: 'external',
          primary: true,
          href: 'https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&tmIdx=41&tm2lIdx=4107000000&tm3lIdx=4107010000',
        },
      ],
    },
  ],
  // 증여(gift) 건별 서류 체크 상태: { [giftId]: ['family', 'transfer'] }
  documentChecks: {},
  settings: {
    giftSchedule: true,
    productNews: true,
    serviceNotice: true,
  },
}

export const products = [
  {
    id: 1,
    type: 'DEPOSIT',
    label: '예금',
    name: 'KB Star 정기예금',
    provider: 'KB국민은행',
    rate: 3.2,
    calculationMethod: 'DEPOSIT_SIMPLE_INTEREST',
    minRate: 2.8,
    maxRate: 3.2,
    period: '1~36개월',
    limit: '최소 100만원',
    conditions: ['KB스타뱅킹 가입', '만기 자동재예치 선택'],
    risk: '매우 낮음',
    riskLevel: 1,
    color: '#3f78a8',
    feature: '목돈을 안정적으로 운용하는 대표 예금안',
    siteUrl: 'https://obank.kbstar.com/quics?page=C016613',
  },
  {
    id: 2,
    type: 'DEPOSIT',
    label: '예금',
    name: 'KB 국민수퍼정기예금',
    provider: 'KB국민은행',
    rate: 3.1,
    calculationMethod: 'DEPOSIT_SIMPLE_INTEREST',
    minRate: 2.7,
    maxRate: 3.1,
    period: '1개월~3년',
    limit: '가입 금액 제한 없음',
    conditions: ['영업점·비대면 채널 가입', '계약 기간별 우대'],
    risk: '매우 낮음',
    riskLevel: 1,
    color: '#3f78a8',
    feature: '기간을 세분화해 운용할 수 있는 예금안',
    siteUrl: 'https://www.kbstar.com',
  },
  {
    id: 3,
    type: 'DEPOSIT',
    label: '예금',
    name: 'KB 골든라이프 연금우대예금',
    provider: 'KB국민은행',
    rate: 3.0,
    calculationMethod: 'DEPOSIT_SIMPLE_INTEREST',
    minRate: 2.6,
    maxRate: 3.0,
    period: '1년',
    limit: '최소 300만원',
    conditions: ['연금 수령 실적', '급여·연금 계좌 연결'],
    risk: '매우 낮음',
    riskLevel: 1,
    color: '#3f78a8',
    feature: '연금 수령 고객을 위한 장기 예금안',
    siteUrl: 'https://www.kbstar.com',
  },
  {
    id: 101,
    type: 'SAVINGS',
    label: '적금',
    name: 'KB국민행복적금',
    provider: 'KB국민은행',
    rate: 4.0,
    calculationMethod: 'SAVINGS_MONTHLY_INSTALLMENT',
    paymentTiming: 'END_OF_MONTH',
    minRate: 3.0,
    maxRate: 4.0,
    period: '1년',
    limit: '월 1만원~50만원',
    monthlyMaxAmount: 500000,
    conditions: ['자동이체 등록', '마케팅 동의'],
    risk: '매우 낮음',
    riskLevel: 1,
    color: '#4f86b5',
    feature: '매월 나누어 준비하는 단기 적립안',
    siteUrl: 'https://obank.kbstar.com/quics?page=C016614',
  },
  {
    id: 102,
    type: 'SAVINGS',
    label: '적금',
    name: 'KB스타적금Ⅱ',
    provider: 'KB국민은행',
    rate: 3.8,
    calculationMethod: 'SAVINGS_MONTHLY_INSTALLMENT',
    paymentTiming: 'END_OF_MONTH',
    minRate: 2.9,
    maxRate: 3.8,
    period: '1년',
    limit: '월 1만원~30만원',
    monthlyMaxAmount: 300000,
    conditions: ['KB스타뱅킹 거래', '목표 금액 달성'],
    risk: '매우 낮음',
    riskLevel: 1,
    color: '#4f86b5',
    feature: '목표 금액을 정해 준비하는 적립안',
    siteUrl: 'https://www.kbstar.com',
  },
  {
    id: 103,
    type: 'SAVINGS',
    label: '적금',
    name: 'KB차차차 적금',
    provider: 'KB국민은행',
    rate: 3.6,
    calculationMethod: 'SAVINGS_MONTHLY_INSTALLMENT',
    paymentTiming: 'END_OF_MONTH',
    minRate: 2.8,
    maxRate: 3.6,
    period: '1년',
    limit: '월 5만원~50만원',
    monthlyMaxAmount: 500000,
    conditions: ['자동이체 실적', '만기 유지'],
    risk: '매우 낮음',
    riskLevel: 1,
    color: '#4f86b5',
    feature: '생활 주기에 맞춰 꾸준히 쌓는 적립안',
    siteUrl: 'https://www.kbstar.com',
  },
  {
    id: 201,
    type: 'ETF',
    recommendationProfiles: ['GROWTH'],
    label: 'ETF',
    name: 'RISE 미국나스닥100',
    provider: 'KB자산운용',
    rate: 13.4,
    calculationMethod: 'ETF_COMPOUND_RETURN',
    period: '장기 운용 권장',
    limit: '1주 단위 거래',
    trackingIndex: 'NASDAQ-100 Index',
    topHoldings: [
      { name: 'NVIDIA', ratio: 8.7 },
      { name: 'Microsoft', ratio: 7.9 },
      { name: 'Apple', ratio: 7.6 },
      { name: 'Amazon', ratio: 5.8 },
      { name: 'Broadcom', ratio: 5.1 },
      { name: 'Meta Platforms', ratio: 4.0 },
      { name: 'Alphabet A', ratio: 3.1 },
      { name: 'Tesla', ratio: 3.0 },
      { name: 'Alphabet C', ratio: 2.9 },
      { name: 'Costco', ratio: 2.4 },
    ],
    volatility: 20.8,
    risk: '높음',
    riskLevel: 5,
    color: '#7f73d8',
    feature: '미국 대형 기술주 지수를 추종하는 성장형 상품',
    siteUrl: 'https://www.kbam.co.kr/',
  },
  {
    id: 202,
    type: 'ETF',
    recommendationProfiles: ['BALANCED', 'GROWTH'],
    label: 'ETF',
    name: 'RISE 미국S&P500',
    provider: 'KB자산운용',
    rate: 10.1,
    calculationMethod: 'ETF_COMPOUND_RETURN',
    period: '장기 운용 권장',
    limit: '1주 단위 거래',
    trackingIndex: 'S&P 500 Index',
    topHoldings: [
      { name: 'NVIDIA', ratio: 7.5 },
      { name: 'Microsoft', ratio: 6.2 },
      { name: 'Apple', ratio: 5.8 },
      { name: 'Amazon', ratio: 3.9 },
      { name: 'Meta Platforms', ratio: 2.8 },
      { name: 'Broadcom', ratio: 2.4 },
      { name: 'Alphabet A', ratio: 2.1 },
      { name: 'Berkshire Hathaway', ratio: 2.0 },
      { name: 'Alphabet C', ratio: 1.8 },
      { name: 'Tesla', ratio: 1.7 },
    ],
    volatility: 15.2,
    risk: '다소 높음',
    riskLevel: 4,
    color: '#7f73d8',
    feature: '미국 대표 500개 기업 지수를 추종하는 상품',
    siteUrl: 'https://www.kbam.co.kr/',
  },
  {
    id: 203,
    type: 'ETF',
    recommendationProfiles: ['BALANCED', 'GROWTH'],
    label: 'ETF',
    name: 'RISE 200',
    provider: 'KB자산운용',
    rate: 7.2,
    calculationMethod: 'ETF_COMPOUND_RETURN',
    period: '중·장기 운용 권장',
    limit: '1주 단위 거래',
    trackingIndex: 'KOSPI 200 Index',
    topHoldings: [
      { name: '삼성전자', ratio: 22.1 },
      { name: 'SK하이닉스', ratio: 9.2 },
      { name: 'KB금융', ratio: 3.1 },
      { name: '현대차', ratio: 2.8 },
      { name: 'NAVER', ratio: 2.5 },
      { name: '셀트리온', ratio: 2.3 },
      { name: '기아', ratio: 2.2 },
      { name: '신한지주', ratio: 2.1 },
      { name: 'POSCO홀딩스', ratio: 2.0 },
      { name: 'LG에너지솔루션', ratio: 1.9 },
    ],
    volatility: 13.4,
    risk: '보통',
    riskLevel: 4,
    color: '#7f73d8',
    feature: '국내 대표 기업 지수를 추종하는 상품',
    siteUrl: 'https://www.kbam.co.kr/',
  },
  {
    id: 204,
    type: 'ETF',
    etfType: 'BOND_MIXED',
    recommendationProfiles: ['STABLE'],
    label: 'ETF',
    name: 'RISE 삼성전자SK하이닉스채권혼합50',
    provider: 'KB자산운용',
    rate: 8.8,
    calculationMethod: 'ETF_COMPOUND_RETURN',
    period: '중·장기 운용 권장',
    limit: '1주 단위 거래',
    trackingIndex: 'KAP 삼성전자SK하이닉스채권혼합50 지수',
    topHoldings: [
      { name: '삼성전자', ratio: 25.0, assetType: 'EQUITY' },
      { name: 'SK하이닉스', ratio: 25.0, assetType: 'EQUITY' },
      { name: '국고채권 3년물', ratio: 9.8, assetType: 'BOND' },
      { name: '국고채권 5년물', ratio: 8.7, assetType: 'BOND' },
      { name: '통안증권 1년물', ratio: 7.6, assetType: 'BOND' },
      { name: '국고채권 10년물', ratio: 6.2, assetType: 'BOND' },
      { name: '단기 국고채 ETF', ratio: 5.1, assetType: 'BOND' },
      { name: '현금성 자산', ratio: 4.0, assetType: 'CASH' },
      { name: '원화 예금', ratio: 3.1, assetType: 'CASH' },
      { name: '기타 채권', ratio: 2.5, assetType: 'BOND' },
    ],
    volatility: 10.6,
    risk: '보통',
    riskLevel: 4,
    color: '#7067c8',
    feature: '삼성전자와 SK하이닉스 50%, 국내 단기채권 50%로 구성한 혼합형 상품',
    siteUrl: 'https://riseetf.co.kr/prod/finderDetail/44K1',
  },
  {
    id: 205,
    type: 'ETF',
    etfType: 'BOND_MIXED',
    recommendationProfiles: ['STABLE', 'BALANCED'],
    label: 'ETF',
    name: 'RISE 200채권혼합50',
    provider: 'KB자산운용',
    rate: 6.2,
    calculationMethod: 'ETF_COMPOUND_RETURN',
    period: '중·장기 운용 권장',
    limit: '1주 단위 거래',
    trackingIndex: '코스피200 KTB 지수',
    topHoldings: [
      { name: 'RISE 200', ratio: 49.8, assetType: 'EQUITY' },
      { name: '국고채권 3년물', ratio: 9.6, assetType: 'BOND' },
      { name: '국고채권 5년물', ratio: 8.8, assetType: 'BOND' },
      { name: '국고채권 10년물', ratio: 7.5, assetType: 'BOND' },
      { name: '통안증권 2년물', ratio: 6.4, assetType: 'BOND' },
      { name: 'RISE 국고채3년', ratio: 5.1, assetType: 'BOND' },
      { name: '단기 국고채 ETF', ratio: 4.0, assetType: 'BOND' },
      { name: '원화 예금', ratio: 3.5, assetType: 'CASH' },
      { name: '현금성 자산', ratio: 2.8, assetType: 'CASH' },
      { name: '기타 채권', ratio: 2.5, assetType: 'BOND' },
    ],
    volatility: 8.9,
    risk: '보통',
    riskLevel: 4,
    color: '#7067c8',
    feature: 'KOSPI 200과 국내 국채를 각각 50% 수준으로 분산한 혼합형 상품',
    siteUrl: 'https://riseetf.co.kr/prod/finderDetail/4440',
  },
  {
    id: 206,
    type: 'ETF',
    etfType: 'BOND_MIXED',
    recommendationProfiles: ['STABLE'],
    label: 'ETF',
    name: 'RISE 테슬라애플아마존채권혼합',
    provider: 'KB자산운용',
    rate: 9.1,
    calculationMethod: 'ETF_COMPOUND_RETURN',
    period: '중·장기 운용 권장',
    limit: '1주 단위 거래',
    trackingIndex: 'iSelect 미국빅데이터TOP3 채권혼합 지수',
    topHoldings: [
      { name: 'Tesla', ratio: 10.0, assetType: 'EQUITY' },
      { name: 'Apple', ratio: 10.0, assetType: 'EQUITY' },
      { name: 'Amazon', ratio: 10.0, assetType: 'EQUITY' },
      { name: '미국 국채 1~3년', ratio: 14.2, assetType: 'BOND' },
      { name: '미국 국채 3~5년', ratio: 12.8, assetType: 'BOND' },
      { name: '미국 국채 7~10년', ratio: 11.4, assetType: 'BOND' },
      { name: '미국 단기채 ETF', ratio: 9.6, assetType: 'BOND' },
      { name: '달러 예금', ratio: 8.2, assetType: 'CASH' },
      { name: '원화 예금', ratio: 7.1, assetType: 'CASH' },
      { name: '현금성 자산', ratio: 6.7, assetType: 'CASH' },
    ],
    volatility: 11.7,
    risk: '보통',
    riskLevel: 4,
    color: '#7067c8',
    feature: '미국 대형 기술주 3종과 미국 국채를 함께 편입한 혼합형 상품',
    siteUrl: 'https://riseetf.co.kr/prod/finderDetail/44E1',
  },
]

export const faqItems = [
  {
    id: 1,
    question: '현금 증여 공제',
    prompt: '자녀에게 현금을 증여할 때 공제 한도가 궁금해요.',
    answer:
      '성년 자녀는 10년간 합산해 5천만원, 미성년 자녀는 2천만원까지 증여재산공제가 적용될 수 있어요. 과거 10년 내 동일인에게 받은 증여액을 함께 확인해야 합니다.',
  },
  {
    id: 2,
    question: '주식 증여 신고',
    prompt: '주식을 증여하면 신고는 어떻게 하나요?',
    answer:
      '상장주식은 원칙적으로 증여일 전후 일정 기간의 종가 평균을 기준으로 평가합니다. 평가액과 공제 후 과세표준을 계산해 증여일이 속한 달의 말일부터 3개월 이내 신고하는 흐름으로 준비하세요.',
  },
  {
    id: 3,
    question: '신고 준비 서류',
    prompt: '증여세 신고 전에 어떤 서류를 준비해야 하나요?',
    answer:
      '증여계약서, 가족관계증명서, 주민등록등본, 송금증이나 이체확인증, 증여재산 평가자료를 준비하면 좋아요. 재산 유형과 거래 방식에 따라 추가 서류가 필요할 수 있습니다.',
  },
]

export const faqCategories = [
  {
    title: '미리줌',
    items: [
      {
        question: '서비스 소개',
        prompt: '미리줌은 어떤 서비스인가요?',
        answer:
          'MiriZoom(미리줌)은 자녀에게 자산을 안전하고 지혜롭게 물려줄 수 있도록 증여 현황 관리 및 맞춤형 금융상품 시뮬레이션을 제공하는 스마트 증여 케어 서비스입니다.',
        showBranchButton: false,
        showTaxOfficeButton: false,
      },
      {
        question: '시뮬레이션 사용 방법',
        prompt: '미리줌 시뮬레이션은 어떻게 사용하나요?',
        answer:
          '자녀를 선택하고 증여하고자 하는 자산 금액을 입력하면, 즉시 증여 시 예상 세액과 세무 최적화 시나리오(분할 증여 등)를 비교 분석해 드립니다. 시뮬레이션 결과를 바탕으로 자녀 성향에 맞는 KB 금융상품 포트폴리오까지 한눈에 추천받으실 수 있습니다.',
        showBranchButton: false,
        showTaxOfficeButton: false,
      },
      {
        question: '현황관리',
        prompt: '미리줌에서 증여 현황 관리는 어떻게 하나요?',
        answer:
          '과거에 자녀에게 증여했던 이력을 등록하면 10년 합산 공제 한도 잔여액과 다음 공제 한도 리셋 주기를 타임라인으로 쉽게 모니터링할 수 있습니다. 증여세 신고 독려 알림 및 필수 서류 체크리스트 기능도 함께 지원합니다.',
        showBranchButton: false,
        showTaxOfficeButton: false,
      },
    ],
  },
  {
    title: '증여',
    items: [
      {
        question: '증여와 상속',
        prompt: '증여와 상속의 차이점이 무엇인가요?',
        answer: `증여와 상속은 재산을 물려받는 '시기'가 가장 큰 차이점이에요!

• 증여는 주는 분이 살아계실 때 재산을 넘겨받는 것을 말해요.
• 상속은 사망 후에 재산을 물려받는 것을 뜻한답니다.

두 장치는 공제 한도나 세금을 계산하는 방식이 완전히 다르기 때문에 미리 꼼꼼하게 비교해 보고 준비하시는 것이 좋아요.`,
        showBranchButton: false,
        showTaxOfficeButton: false,
      },
      {
        question: '증여자와 수증자',
        prompt: '증여자와 수증자의 개념이 궁금해요',
        answer: `증여자는 재산을 '주는 사람'을 말해요.
수증자는 그 재산을 '받는 사람'을 뜻해요.`,
        showBranchButton: false,
        showTaxOfficeButton: false,
      },
      {
        question: '생활비·교육비 제외 여부',
        prompt: '자녀에게 주는 생활비나 교육비도 증여세가 부과되나요?',
        answer: `일상적인 수준의 생활비나 학교 학자금은 기본적으로 세금이 붙지 않는 비과세 항목이에요.

하지만 아주 중요한 주의사항이 있어요!
이 돈을 쓰지 않고 차곡차곡 모아서 자녀 이름으로 주식이나 예적금을 가입하거나, 부동산 등을 취득하는 데 사용하면 증여세가 부과될 수 있으니 꼭 주의하셔야 해요.`,
        showBranchButton: false,
        showTaxOfficeButton: false,
      },
      {
        question: '주식·부동산 증여',
        prompt: '주식이나 부동산을 증여할 때 주의할 점이 무엇인가요?',
        answer: `현금만 증여세 대상이 되는 게 아니랍니다!

주식이나 부동산, 아파트 분양권 등 경제적인 가치가 있는 모든 자산은 전부 증여세 과세 대상에 포함돼요. 자산 종류에 따라 시가를 평가하는 기준이 조금씩 다르니 신고 전에 꼼꼼히 체크해 보시는 걸 추천드려요.`,
        showBranchButton: true,
        showTaxOfficeButton: true,
      },
      {
        question: '차용증 효력',
        prompt: '가족 간 금전 거래 시 차용증의 법적 효력과 작성 방법이 궁금해요.',
        answer: `홈택스 (세금신고 ➔ 증여세 신고 ➔ 맞춤신고 찾기) 메뉴를 통해 1분 만에 신고할 수 있습니다.

━━━━━━━━━━━━━━━━━━━━

▶︎ 1단계 (기본정보 입력)증여일과 증여자의 주민등록번호를 입력한 뒤 관계(부모, 배우자 등)를 조회하여 선택합니다.

▶︎ 2단계 (세대생략 및 대납 여부)조부모가 손자녀에게 증여하는 경우 세대생략(30% 할증)을 선택하고, 부모가 세금을 대신 내준다면 『증여세 포함 계산하기』를 클릭합니다.

▶︎ 3단계 (10년 이력 합산)최근 10년 내 동일인에게 1천만 원 이상 증여받은 이력이 있다면 『10년이내 증여 합산신고 대상 불러오기』로 조회하여 합산합니다.

▶︎ 4단계 (공제 한도 확인)직계존속(성인 5천 / 미성년 2천), 배우자(6억), 혼인·출산(평생 1억 추가) 등 관계별 공제액과 3% 신고세액공제가 자동 반영되었는지 확인합니다.

▶︎ 5단계 (제출 및 납부 완료)최종 세액 확인 후 『신고서 제출하기』를 누르고, 증빙서류(계좌이체 내역서, 가족관계증명서)를 첨부하여 세금을 납부하면 완료됩니다.`,
        showBranchButton: false,
        showTaxOfficeButton: false,
      },
    ],
  },
  {
    title: '증여세',
    items: [
      {
        question: '추가공제(혼인·출산)',
        prompt: '혼인이나 출산 시 받을 수 있는 증여세 추가 공제 혜택은 무엇인가요?',
        answer: `혼인이나 출산(입양 포함)을 하실 때 부모님이나 조부모님으로부터 재산을 받으면, 기존 성년 자녀 기본 공제 5천만 원 외에 최대 1억 원까지 증여세를 추가로 공제받으실 수 있습니다. 기본 공제와 합하면 총 1억 5천만 원까지 세금 없이 증여가 가능합니다.

━━━━━━━━━━━━━━━━━━━━

1. 언제까지 받아야 하나요?
- 혼인: 혼인신고일 전후로 각각 2년 이내 (총 4년 기간)
- 출산 및 입양: 자녀의 출생일 또는 입양신고일로부터 2년 이내에 증여받아야 혜택이 적용됩니다.

2. 부모님과 조부모님께 각각 따로 받을 수 있나요?
어머니, 아버지, 할머니, 할아버지는 모두 직계존속이라는 하나의 그룹으로 묶이기 때문에 합산해서 총 1억 원이 추가 공제 한도입니다.
다만 결혼하는 부부라면 신랑과 신부가 각각 자기 부모님께 1억 5천만 원씩(총 3억 원) 받고, 추가로 시부모님이나 장인·장모님(기타친족 공제 1천만 원)을 활용하면 부부가 세금 없이 받을 수 있는 총 금액은 최대 3억 2천만 원까지 늘어납니다.

3. 절세 꿀팁: 조부모님께 먼저 받는 것이 유리합니다.
만약 공제 한도를 넘겨서 부모님과 조부모님 모두에게 돈을 받을 계획이라면 순서가 중요합니다. 조부모님이 손자녀에게 바로 주면 원래 30%의 할증세액(세대생략 가산세)이 붙지만, 이 추가 공제 혜택을 조부모님 증여에 먼저 사용하면 할증세액을 완전히 피할 수 있어서 절세에 훨씬 유리합니다.

4. 비혼 부부, 한부모, 입양 부모도 가능한가요?
네, 가능합니다. 혼인신고를 하지 않고 아이를 출산하는 비혼 부부나 한부모 가정, 그리고 입양을 결정한 입양부모 모두 차별 없이 똑같이 최대 1억 5천만 원까지 세금 없이 증여받으실 수 있습니다.

━━━━━━━━━━━━━━━━━━━━

증여세가 나오지 않더라도 나중에 국세청의 자금 출처 확인에 대응하기 위해 증여세 신고는 해두시는 것이 바람직합니다. 증여받은 달의 말일부터 3개월 이내에 관할 세무서나 홈택스를 통해 신고해 주세요.`,
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '추가공제(창업)',
        prompt: '창업자금을 증여받을 때 적용되는 추가 공제 한도가 궁금해요.',
        answer: `자녀의 중소기업 창업을 지원하기 위해 나라에서 제공하는 파격적인 세금 혜택입니다. 18세 이상의 거주자가 60세 이상의 부모님(부모 사망 시 조부모)으로부터 창업 자금을 증여받는 경우, 증여세 과세가액에서 5억 원을 먼저 공제해 주고 5억 원을 초과하는 금액에 대해서는 10%의 낮은 특례 세율만 적용합니다.

예를 들어 일반 증여로 현금 5억 원을 받으면 8천만 원 가량의 세금을 내야 하지만, 창업자금 특례를 활용하면 5억 원까지는 세금이 단 한 푼도 발생하지 않습니다. 한도는 기본 50억 원이며, 창업 후 정규직 직원을 10명 이상 고용하는 경우에는 최대 100억 원까지 한도가 늘어납니다.

━━━━━━━━━━━━━━━━━━━━

1. 어떤 업종이든 모두 가능한가요?
부동산 임대업이나 소비성 서비스업 등 일부 제한 업종을 제외한 음식점업, 제조업, 건설업, 통신판매업 등 대부분의 중소기업 업종은 모두 가능합니다. 다만 많은 분들이 관심을 가지는 카페(비알코올 음료점업)는 세법상 음식점업이 아니므로 특례 대상에서 제외되니 주의해야 합니다. 또한 기존 사업을 승계하거나 폐업 후 재개업하는 등 사실상 새로운 창업으로 보기 어려운 경우도 제외됩니다.

2. 증여받을 수 있는 자산의 종류는 무엇인가요?
증여 대상 자산은 원칙적으로 현금, 예금, 채권 같은 금전이어야 합니다. 토지, 건물, 주식, 부동산을 취득할 수 있는 권리 등 양도소득세 과세 대상이 되는 자산은 특례를 받을 수 없습니다.

3. 자금 사용과 사후관리 기준은 어떻게 되나요?
- 창업 기한: 자금을 증여받은 날로부터 2년 이내에 실제로 창업을 해야 합니다.
- 사용 기한: 증여받은 자금은 4년 이내에 모두 사업용 자산 취득이나 임차보증금 등 '사업 관련 목적'으로만 소진해야 합니다. 개인적인 물품 구입이나 여행비 등으로 쓰면 안 됩니다.
- 의무 유지 기간: 창업한 사업은 최소 10년 동안 폐업하지 않고 유지해야 합니다. (단, 부도로 인한 폐업이나 사업 전환을 위해 2년 이내에 재개업하는 등 정당한 사유가 인정되면 세금이 추징되지 않습니다.)

━━━━━━━━━━━━━━━━━━━━

이 특례를 적용받으려면 증여받은 날이 속하는 달의 말일부터 3개월 이내에 증여세 신고를 하면서 '창업자금 특례 신청서'를 반드시 함께 제출해야 합니다. 또한 창업일이 속하는 해부터 4년 동안은 매년 창업자금 사용명세서를 세무서에 제출하여 사후관리를 받아야 하므로, 평소에 지출 증빙 서류를 철저히 챙겨두는 것이 중요합니다.`,
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '증여재산 반환 시',
        prompt: '증여한 재산을 다시 반환하면 증여세가 취소되나요?',
        answer: `증여받은 재산을 다시 원래 주인에게 돌려줄 때, 그 '반환 시기'와 '재산의 종류'에 따라 증여세가 부과되는 방식이 완전히 달라집니다. 특히 금전(현금)은 시기와 상관없이 돌려주더라도 무조건 양쪽 모두에 세금이 나오므로 가장 주의해야 합니다.

━━━━━━━━━━━━━━━━━━━━

[핵심 요건 및 반환 시기별 과세 기준]
■ 재산의 종류에 따른 차이점
  • 금전(현금): 한 번 주면 돌려받더라도 증여세 취소가 절대 불가능합니다. 처음 줄 때와 다시 돌려줄 때 각각 독립된 증여로 보아 양쪽 모두에 세금이 부과됩니다.
  • 주식 및 부동산: 아래의 반환 시기에 따라 세금이 면제되거나 취소될 수 있습니다.

■ 주식 및 부동산의 반환 시기별 세금 계산
  • 신고기한 이내 반환 (증여일이 속한 달의 말일부터 3개 월 이내): 당초 증여와 반환하는 것 모두 증여세를 과세하지 않습니다. 처음부터 증여가 없었던 것으로 인정받을 수 있습니다.
  • 신고기한 경과 후 3개월 이내 반환 (증여 후 4~6개월 사이): 처음 증여한 것에 대해서는 세금이 부과되지만, 원래 주인에게 다시 돌려주는 반환 행위에 대해서는 세금을 매기지 않습니다.
  • 신고기한 경과 후 3개월 초과 반환 (증여 후 6개월 이후): 처음 증여했을 때와 돌려줄 때 모두 증여세가 부과됩니다. 즉, 세금을 두 번 내야 하므로 반환 실익이 없어집니다.

■ 세금이 취소되거나 제외되는 특수한 경우
  • 법원 판결: 증여받은 재산이 취득원인 무효 판결에 의해 권리가 말소되는 경우에는 증여세가 과세되지 않으며, 이미 과세된 세금도 취소됩니다. (단, 형식적인 재판 절차만 거친 경우는 제외됩니다.)
  • 유류분 반환: 재산을 증여받은 사람이 민법에 따라 유류분 권리자에게 재산을 반환한 경우, 그 반환한 가액만큼은 처음부터 증여가 없었던 것으로 처리됩니다.

━━━━━━━━━━━━━━━━━━━━

증여자가 법적인 연대납부의무자로서 수증자의 증여세를 대신 납부해 주는 것은 증여로 보지 않습니다. 하지만 연대납세의무자에 해당하지 않는데도 자녀나 수증자의 세금을 대신 내주면, 그 대납한 세액만큼 재산을 추가로 증여한 것으로 간주하여 증여세가 추가로 부과될 수 있으니 꼭 유의해야 합니다.`,
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '누진공제액',
        prompt: '증여세 계산할 때 적용되는 누진공제액이 무엇인가요?',
        answer: `증여세는 재산 금액(과세표준)이 커질수록 세율이 최저 10%에서 최고 50%까지 총 5단계로 점차 높아지는 구조를 가지고 있습니다.금액이 커져서 다음 세율 구간으로 이동할 때, 전체 금액에 높은 세율을 곱하면 하위 구간에서 이미 계산된 세금과의 차액 때문에 세금이 과도하게 계산됩니다. 이를 쉽고 빠르게 정산하기 위해 미리 정해둔 편리한 차액 공제 금액을 누진공제액이라고 합니다.과세표준에 해당하는 구간의 증여세율을 곱한 뒤, 해당 구간의 누진공제액을 빼주면 산출세액을 아주 간편하게 계산할 수 있습니다.

━━━━━━━━━━━━━━━━━━━━

[과세표준 구간별 세율 및 누진공제액]
▶︎ 1억 원 이하 구간: 세율 10% (누진공제액 없음)
▶︎ 1억 원 초과 ~ 5억 원 이하 구간: 세율 20% (누진공제액 1,000만 원)
▶︎ 5억 원 초과 ~ 10억 원 이하 구간: 세율 30% (누진공제액 6,000만 원)
▶︎ 10억 원 초과 ~ 30억 원 이하 구간: 세율 40% (누진공제액 1억 6,000만 원)
▶︎ 30억 원 초과 구간: 세율 50% (누진공제액 4억 6,000만 원)

━━━━━━━━━━━━━━━━━━━━

과세표준에 증여세율을 곱한 뒤 누진공제액을 차감하면 간편하게 산출세액을 도출할 수 있습니다. 과세표준이 높아질수록 적용되는 증여세율도 상승하므로, 증여 시기와 방법 등에 따른 철저한 절세 전략 수립이 필수적입니다.`,
        showBranchButton: false,
        showTaxOfficeButton: false,
      },
      {
        question: '증여세 대납',
        prompt: '부모님이 자녀의 증여세를 대신 납부하면 어떻게 되나요?',
        answer: `원칙적으로 증여세는 재산을 받은 사람(수증자)이 내야 하는 세금입니다.

자녀가 내야 할 증여세를 부모가 대신 납부해 주면, 국세청은 부모가 대납한 세액만큼 자녀에게 재산을 추가로 증여한 것으로 간주합니다. 이 경우 대납한 금액이 증여재산가액에 포함되어 증여세가 추가로 부과될 수 있습니다.

다만, 부모가 세법상 정해진 법적 연대납부의무자로서 증여세를 대신 납부하는 특수한 경우에는 추가 증여로 보지 않아 세금이 더 나오지 않습니다. 연대납세의무에 해당하지 않는데도 단순히 세금을 대신 내주는 것은 추가 과세 대상이 되므로 꼭 유의해야 합니다.`,
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '증여세 분납',
        prompt: '증여세 분납도 가능한가요?',
        answer: `납부해야 할 증여세가 많다면 한 번에 모두 내지 않고 나누어 낼 수 있는 분납 제도를 활용할 수 있습니다.
납부할 세액이 1천만 원을 초과하는 경우, 신고납부기한이 지난 후 2개 월 이내에 분할하여 납부하는 것이 가능합니다.

━━━━━━━━━━━━━━━━━━━━

- 납부할 세액이 2천만 원 이하일 때: 1천만 원을 초과하는 금액에 대해 분납이 가능합니다. (예: 세액이 1천5백만 원이라면 1천만 원은 먼저 내고, 나머지 5백만 원은 2개월 이내에 분납)

- 납부할 세액이 2천만 원을 초과할 때: 전체 세액의 50% 이하에 해당하는 금액까지 분납할 수 있습니다.

━━━━━━━━━━━━━━━━━━━━

1. 신청 방법
별도의 까다로운 서류를 작성하여 제출할 필요는 없습니다. 증여세 신고서를 작성할 때 '분납' 항목에 분할하여 납부할 세액을 기재하여 신고서를 제출하면 분납 신청이 자동으로 완료됩니다.

2. 연부연납과의 관계
주의할 점은 장기간에 걸쳐 세금을 나누어 내는 연부연납을 이미 허가받은 상태라면, 증여세 분납은 중복으로 허용되지 않습니다.`,
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '과거 신고 내역',
        prompt: '과거에 신고한 증여 내역이 현재 증여세 계산에 영향을 주나요?',
        answer: `과거 증여세 신고 내역은 홈택스에서 간편하게 조회할 수 있습니다.

[조회 방법]
홈택스 로그인 ➔ 세금신고 ➔ 증여세 신고 ➔ 신고내역 조회 메뉴에서 기간을 설정하여 조회 및 출력이 가능합니다.`,
        showBranchButton: false,
        showTaxOfficeButton: false,
      },
    ],
  },
  {
    title: '서류',
    items: [
      {
        question: '증여재산 및 평가명세서',
        prompt: '증여재산 및 평가명세서는 어떻게 작성하고 제출하나요?',
        answer: '',
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '증여세 과세표준 신고 및 자진납부계산서',
        prompt: '증여세 과세표준 신고 및 자진납부계산서 작성 방법을 알려줘',
        answer: '',
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '자진 납부서',
        prompt: '증여세 자진 납부서는 어디서 발급받고 어떻게 납부하나요?',
        answer: '',
        showBranchButton: true,
        showTaxOfficeButton: true,
      },
    ],
  },
  {
    title: '간편신고',
    items: [
      {
        question: '현금 증여',
        prompt: '현금을 증여했을 때 홈택스로 간편하게 신고하는 방법이 있나요?',
        answer: `홈택스 [세금신고 ➔ 증여세 신고 ➔ 맞춤신고 찾기] 메뉴를 통해 1분 만에 신고할 수 있습니다.

━━━━━━━━━━━━━━━━━━━━

[핵심 요건 및 주의사항]증여세 대납 주의: 부모나 증여자가 자녀의 증여세를 대신 납부해 주는 경우, 대신 내준 세금만큼도 증여재산가액에 포함하여 신고해야 하므로 『증여세 포함 계산하기』를 이용해야 합니다.세대생략/비거주자: 자녀를 건너뛰고 손자녀에게 바로 증여하면 30% 할증세액(세대생략가산액)이 부과되며, 국내 거주자가 아닌 비거주자는 증여재산공제를 받을 수 없습니다.공제 한도(10년 합산): 배우자 6억 원, 직계존속 5천만 원(미성년 자녀 2천만 원), 직계비속 5천만 원, 기타 친족 1천만 원이 적용됩니다. (혼인·출산 추가 공제는 평생 1억 원 한도)

━━━━━━━━━━━━━━━━━━━━

▶︎ 1단계 [기본정보 및 수증자 구분 입력]홈택스 로그인 후 메뉴에 진입하여 증여일자, 증여자의 주민등록번호를 입력합니다. 증여자와의 관계를 조회하여 선택하고 연락처, 거주자 여부 및 세대생략 여부를 체크합니다.

▶︎ 2단계 [현금 금액 및 대납 여부 입력]현금만 증여받았는지 묻는 질문에 ‘예’를 선택한 후, 증여받은 현금 금액을 입력합니다. 증여세 대납 여부에 따라 필요시 『증여세 포함 계산하기』를 누른 뒤 세액을 확인하고 『반영하기』 ➔ 『증여세 정기 신고하기』를 클릭합니다.

▶︎ 3단계 [10년 이내 과거 증여 가산]10년 이내에 동일인으로부터 받은 증여가액 합계가 1천만 원 이상인 경우, 증여재산가산액 『입력/수정』 ➔ 『10년이내 증여 합산신고 대상 불러오기』를 눌러 대상을 선택하고 『선택완료』 ➔ 『입력완료』를 누릅니다.

▶︎ 4단계 [증여재산공제 및 세액 확인]관계에 따라 자동 계산된 증여재산공제 금액을 확인합니다. (과거 10년 내 공제 이력이 있다면 차감 필수) 증여재산가산액이 있다면 기납부세액을 추가로 입력하고, 3% 신고세액공제가 적용된 최종 결과가 맞다면 『이대로 신고하기』를 누릅니다.

▶︎ 5단계 [신고서 최종 제출]증여재산공제 관련 주의사항을 확인한 뒤 수정사항이 없으면 신고서를 저장합니다. 마지막으로 최종 납부할 세액과 주의사항을 체크하고 『신고서 제출하기』를 누르면 완료됩니다.`,
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '창업자금 증여',
        prompt: '창업자금 증여에 대한 간편 신고 절차를 알려줘',
        answer: `홈택스 [세금신고 ➔ 증여세 신고 ➔ 창업자금 과세특례 신고] 메뉴를 통해 1분 만에 신고할 수 있습니다.

━━━━━━━━━━━━━━━━━━━━
[핵심 요건 및 주의사항]대상: 18세 이상 자녀가 60세 이상 부모로부터 중소기업 창업 목적으로 현금 등을 증여받는 경우혜택: 5억 원 기본 공제 후, 초과 금액에 대해 10% 단일 세율 적용요건: 양도세 대상이 아닌 재산(현금·예금 등)이어야 하며, 증여일로부터 2년 이내 창업 및 4년 이내 자금 전액을 사용해야 합니다.
━━━━━━━━━━━━━━━━━━━━

▶︎ 1단계 [기본정보 입력]홈택스 로그인 후 메뉴에 진입하여 증여일자, 증여자의 주민등록번호를 입력합니다. 수증자 주민등록번호 확인 후 증여자와의 관계(부모-자녀)를 선택합니다.

▶︎ 2단계 [신고내용 작성 이동]연락처를 입력하고 『저장하기』 후 확인 버튼을 눌러 본격적인 신고내용 작성 화면으로 이동합니다.

▶︎ 3단계 [증여재산명세 입력]증여재산가액 『입력/수정』을 누르고 종류를 '증여재산-창업자금'으로 선택합니다. 평가방법과 금액을 입력한 후 『입력하기』 ➔ 『입력완료』를 순서대로 누릅니다.

▶︎ 4단계 [세액 자동계산 및 확인]과세가액에서 5억 원이 자동으로 공제되고 10% 세율이 적용된 결과 화면을 확인합니다. 내용이 맞다면 『이대로 신고하기-예』를 클릭합니다.

▶︎ 5단계 [신고서 제출 및 서류 첨부]최종 납부세액 확인 후 "상기 내용에 대해 확인했습니다."에 체크하고 『신고서 제출하기』를 누릅니다. 마지막으로 『창업자금 특례 신청 및 사용내역서』 증빙서류를 첨부하면 완료됩니다.`,
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '주식 증여',
        prompt: '주식을 증여한 후 간편하게 세액을 신고하는 프로세스가 궁금해요.',
        answer: `홈택스 [세금신고 ➔ 증여세 신고 ➔ 정기신고] 메뉴를 통해 1분 만에 신고할 수 있습니다.

━━━━━━━━━━━━━━━━━━━━

[핵심 요건 및 주의사항]평가 기준: 상장주식은 '기준시가 등 보충적평가법'을 선택하여 조회 기간의 종가 평균가액으로 평가합니다. 비상장주식은 수량과 단가를 직접 입력합니다.세대생략/비거주자: 손자녀 등 세대를 건너뛴 증여는 30% 할증세액이 자동 계산되며, 비거주자는 증여재산공제를 적용받을 수 없습니다.공제 한도(10년 합산): 배우자 6억 원, 직계존속 5천만 원(미성년 자녀 2천만 원), 직계비속 5천만 원, 기타 친족 1천만 원이 적용됩니다. (혼인·출산 추가 공제는 평생 1억 원 한도)

━━━━━━━━━━━━━━━━━━━━

▶︎ 1단계 [기본정보 및 수증자 구분 입력]홈택스 로그인 후 메뉴에 진입하여 증여일자, 증여자의 주민등록번호를 입력합니다. 수증자 주민등록번호 확인 후 관계를 선택하고 연락처와 수증자 구분(미성년자·비거주자·세대생략 여부)을 체크한 뒤 『저장하기』를 누릅니다.

▶︎ 2단계 [주식 평가액 및 재산명세 입력]증여재산명세의 『입력/수정』을 누른 뒤 구분을 '증여재산-일반', '유가증권(상장 또는 비상장)'으로 선택합니다. 상장주식은 보충적평가법을 통해 평균가액을 확인하여 수량을 입력하고, 비상장주식은 단가와 수량을 직접 입력한 후 『입력하기』 ➔ 『입력완료』를 누릅니다.

▶︎ 3단계 [10년 이내 과거 증여 가산]10년 이내에 동일인으로부터 받은 증여가액 합계가 1천만 원 이상인 경우, 증여재산가산액 『입력/수정』 ➔ 『10년이내 증여 합산신고 대상 불러오기』를 눌러 대상을 선택하고 『선택완료』 ➔ 『입력완료』를 누릅니다.

▶︎ 4단계 [증여재산공제 및 세액 확인]관계에 따라 자동 계산된 증여재산공제 금액을 확인합니다. (과거 10년 내 공제 이력이 있다면 차감 필수) 증여재산가산액이 있다면 기납부세액을 추가로 입력하고, 3% 신고세액공제가 적용된 최종 결과가 맞다면 『이대로 신고하기』를 누릅니다.

▶︎ 5단계 [신고서 최종 제출]증여재산공제 관련 주의사항을 확인한 뒤 수정사항이 없으면 신고서를 저장합니다. 마지막으로 최종 납부할 세액을 확인하고 『신고서 제출하기』를 누르면 완료됩니다.`,
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
      {
        question: '주택 증여',
        prompt: '주택을 증여했을 때 필요한 간편 신고 가이드를 제공해줘',
        answer: `홈택스 [세금신고 ➔ 증여세 신고 ➔ 정기신고] 메뉴를 통해 1분 만에 신고할 수 있습니다.

━━━━━━━━━━━━━━━━━━━━

[핵심 요건 및 주의사항]평가 기준: 주택은 증여일 현재 시가로 평가합니다. 매매·감정가액이 없으면 동일 단지 내 주거면적 5% 이내, 공시가격 5% 이내 요건을 모두 충족하는 '유사매매사례가액'을 시가로 적용합니다.채무인수액(부담부증여): 증여재산에 담보된 임대보증금이나 금융기관 대출 등 자녀가 인수한 채무가 있다면 『채무액』 항목에 반드시 입력하여 차감해야 합니다.공제 한도(10년 합산): 배우자 6억 원, 직계존속 5천만 원(미성년 자녀 2천만 원), 직계비속 5천만 원, 기타 친족 1천만 원이 적용됩니다. (혼인·출산 추가 공제는 평생 1억 원 한도)

━━━━━━━━━━━━━━━━━━━━

▶︎ 1단계 [기본정보 및 수증자 구분 입력]홈택스 로그인 후 메뉴에 진입하여 증여일자, 증여자의 주민등록번호를 입력합니다. 수증자 주민등록번호 확인 후 관계를 선택하고 연락처와 수증자 구분(미성년자·비거주자·세대생략 여부)을 체크한 뒤 『저장하기』를 누릅니다.

▶︎ 2단계 [등기자료 불러오기 및 주택 평가]증여재산명세의 『입력/수정』을 누른 뒤 구분을 '증여재산-일반', 종류를 '공동주택(부수토지 포함)'으로 선택합니다. 『등기자료 불러오기』를 통해 부동산 명세를 불러와 선택하고, 시가 또는 『기준시가 및 유사매매사례가액 조회』를 통해 확인한 가액을 입력합니다. 부담부증여인 경우 채무액까지 입력한 후 『입력하기』 ➔ 『입력완료』를 누릅니다.

▶︎ 3단계 [10년 이내 과거 증여 가산]10년 이내에 동일인으로부터 받은 증여가액 합계가 1천만 원 이상인 경우, 증여재산가산액 『입력/수정』 ➔ 『10년이내 증여 합산신고 대상 불러오기』를 눌러 대상을 선택하고 『선택완료』 ➔ 『입력완료』를 누릅니다.

▶︎ 4단계 [증여재산공제 및 세액 확인]관계에 따라 자동 계산된 증여재산공제 금액을 확인합니다. (과거 10년 내 공제 이력이 있다면 차감 필수) 증여재산가산액이 있다면 기납부세액을 추가로 입력하고, 3% 신고세액공제가 적용된 최종 결과가 맞다면 『이대로 신고하기-여』를 누릅니다.

▶︎ 5단계 [신고서 최종 제출]증여재산공제 관련 주의사항을 확인한 뒤 수정사항이 없으면 신고서를 저장합니다. 마지막으로 최종 납부할 세액과 주의사항을 체크하고 『신고서 제출하기』를 누르면 완료됩니다.`,
        showBranchButton: false,
        showTaxOfficeButton: true,
      },
    ],
  },
  {
    title: 'ETF',
    items: [
      {
        question: '원금보장',
        prompt: 'ETF는 원금 보장이 되나요?',
        answer: `원금 보장이 되지 않습니다.

주식처럼 거래소에 상장되어 실시간으로 거래되는 펀드이기 때문에, 투자한 지수나 편입 자산의 가격 변동에 따라 원금 손실이 발생할 수 있습니다.

다만 개별 주식에 직접 투자하는 것보다 여러 종목에 분산 투자하므로 상대적으로 위험을 낮출 수 있는 장점이 있습니다. 예금자보호법 대상은 아니므로 투자 시 유의해야 합니다.`,
        showBranchButton: true,
        showTaxOfficeButton: false,
      },
      {
        question: 'S&P500와 나스닥100',
        prompt: 'S&P500과 나스닥100 ETF의 특징과 차이점을 비교해줘',
        answer: `안정적인 시장 분산 투자는 S&P500을, 고수익 기술주 중심 투자는 나스닥100을 선택하는 것이 좋습니다.

━━━━━━━━━━━━━━━━━━━━

- S&P500 ETF: 미국의 대표 대기업 500개 종목에 투자합니다. IT, 금융, 소비재 등 전 산업군에 골고루 분산되어 있어 미국 시장 전체의 안정적인 흐름을 추종합니다.

- 나스닥100 ETF: 나스닥 시장의 우량 기술 기업 100개에 투자합니다. 빅테크, 성장주 비중이 압도적으로 높아 S&P500보다 변동성은 크지만 높은 기대수익률을 추구합니다.`,
        showBranchButton: true,
        showTaxOfficeButton: false,
      },
    ],
  },
  {
    title: '예적금',
    items: [
      {
        question: '이자소득세',
        prompt: '예적금 이자에 붙는 세금은 얼마인가요?',
        answer: `일반 예적금 이자소득세율은 총 15.4%입니다.

세부적으로는 이자소득세 14%와 지방소득세 1.4%가 합산된 수치입니다. 은행에서 만기 이자를 지급할 때 이 세금을 자동으로 원천징수하고 남은 금액만 통장에 입금해 줍니다.

이자 세금을 아끼고 싶다면 가입 자격에 따라 세금을 면제받거나 낮출 수 있는 비과세 종합저축 또는 ISA(개인종합자산관리계좌)를 활용하는 것이 유리합니다.`,
        showBranchButton: true,
        showTaxOfficeButton: false,
      },
      {
        question: '중도해지',
        prompt: '예적금을 중도 해지하면 이자가 얼마나 깎이나요?',
        answer: `만기를 채우지 못하고 중도 해지하면 당초 약정된 금리보다 훨씬 낮은 중도해지 이율이 적용됩니다.중도해지는 영업점 방문 또는 KB스타뱅킹 앱을 통해 신청하실 수 있습니다.`,
        showBranchButton: true,
        showTaxOfficeButton: false,
      },
      {
        question: '예금자보호한도',
        prompt: '예금자보호한도가 뭐야?',
        answer: `금융회사가 파산해도 예금보험공사 등이 예금을 지켜주는 한도예요!

• 2025년 9월 1일부터 1인당 최대 1억 원으로 상향되었어요.
• '금융회사별'로 합산하여 계산되므로 여러 은행에 나누어 예치하는 것이 안전해요.
• 한도는 원금과 이자를 모두 합산한 금액 기준이에요.

시중은행뿐 아니라 신협, 농협, 수협, 새마을금고 등 상호금융도 각 자체 제도를 통해 동일하게 1억 원까지 보호되니 참고하세요.`,
        showBranchButton: true,
        showTaxOfficeButton: false,
      },
    ],
  },
]
