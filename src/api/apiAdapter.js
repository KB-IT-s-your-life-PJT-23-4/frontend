import { faqItems, products } from "../data/mockData";
import { calculateSimulation } from "../utils/finance";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "요청을 처리하지 못했습니다.");
  }
  return payload?.data ?? payload;
}

function wait(ms = 420) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function consultationFallback(question) {
  const normalized = question.replace(/\s/g, "");
  const matched = faqItems.find((item) =>
    item.prompt
      .replace(/\s/g, "")
      .split(/[,.?]/)
      .filter((token) => token.length > 2)
      .some((token) => normalized.includes(token)),
  );
  if (matched) return matched.answer;
  if (normalized.includes("미성년")) {
    return "미성년 자녀가 직계존속에게 증여받는 경우 10년간 합산한 증여재산공제는 일반적으로 2천만원 범위에서 검토해요. 과거 10년 이력과 증여자 관계에 따라 달라질 수 있어요.";
  }
  if (normalized.includes("아파트") || normalized.includes("부동산")) {
    return "부동산 증여는 시가 평가, 취득세, 등기 비용과 증여세를 함께 살펴봐야 해요. 공동주택가격만으로 단정하기보다 증여일 전후 거래가액과 감정가액 적용 여부를 전문가와 확인하는 것이 안전해요.";
  }
  if (normalized.includes("기한") || normalized.includes("신고")) {
    return "증여세는 원칙적으로 증여일이 속하는 달의 말일부터 3개월 이내에 신고·납부해요. 예를 들어 7월 15일 증여라면 10월 31일까지 준비하는 방식입니다.";
  }
  return "질문하신 상황은 증여자와 수증자의 관계, 최근 10년 이력, 재산 유형에 따라 결과가 달라질 수 있어요. 미리줌 시뮬레이션에서 금액을 먼저 비교한 뒤 세무 전문가에게 최종 확인을 권해드려요.";
}

export const api = {
  isMock: !API_BASE,

  async runSimulation({ family, amount, years = 10 }) {
    if (API_BASE) {
      return request("/simulations", {
        method: "POST",
        body: JSON.stringify({
          familyId: family.id,
          amount,
          investmentPeriodYears: years,
        }),
      });
    }
    await wait(650);
    return calculateSimulation({ amount, family, products, years });
  },

  async saveGiftPlan(resultId, memo = "미리줌에서 저장한 증여 계획") {
    if (API_BASE) {
      return request(`/simulation-results/${resultId}/gift-plans`, {
        method: "POST",
        body: JSON.stringify({ memo }),
      });
    }
    await wait(350);
    return { giftPlans: [], message: "증여 계획이 저장되었습니다." };
  },

  async askConsultation(question) {
    if (API_BASE) {
      return request("/ai-consultations", {
        method: "POST",
        body: JSON.stringify({ question }),
      });
    }
    await wait(850);
    return {
      answer: consultationFallback(question),
      references: [
        {
          lawName: "상속세 및 증여세법",
          articleNo: "제53조",
          title: "증여재산 공제",
        },
      ],
      disclaimer:
        "일반적인 정보 제공을 위한 답변이며 실제 신고 전 전문가 확인이 필요합니다.",
    };
  },
};
