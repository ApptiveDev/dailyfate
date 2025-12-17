import { FortuneData, UserSettings } from '../types/fortune';

// Placeholder implementation. Replace with your real API call (e.g., Gemini) as needed.
export async function fetchDailyFortune(date: Date, _settings: UserSettings): Promise<FortuneData> {
  // Simulate network latency
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));

  // Simple seeded text based on date for deterministic feel
  const seed = date.toISOString().slice(0, 10);
  return {
    overview: `${seed}의 하루, 차분하게 흐르며 작은 성취가 다가옵니다.`,
    wealth: '지출을 정리하면 숨은 여유가 보입니다. 작은 투자 아이디어를 메모해 두세요.',
    love: '가벼운 안부 인사가 관계를 따뜻하게 만듭니다. 듣는 태도가 호감을 올립니다.',
    success: '미뤄둔 일을 하나 끝내면 팀의 신뢰가 쌓입니다. 마감 전 확인을 한 번 더.',
    action: '호흡을 고르고 해야 할 일을 한 장씩 뜯어내듯 처리해 보세요.',
    lunarDate: '음력 정보 준비 중',
  };
}
