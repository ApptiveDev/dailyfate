import { WritingPrompt } from '../types/writing';

/**
 * 샘플 글감 데이터
 * MVP: 120개 목표, 현재 샘플 30개
 */
export const SAMPLE_PROMPTS: WritingPrompt[] = [
  // ===== 카피라이팅 (copywriting) =====
  {
    id: 'copy-001',
    type: 'copywriting',
    category: '광고카피',
    title: '당신의 하루를 한 문장으로 표현한다면?',
    description: '오늘 하루를 광고 카피처럼 한 줄로 압축해보세요.',
    placeholder: '오늘 하루는...',
  },
  {
    id: 'copy-002',
    type: 'copywriting',
    category: '브랜드슬로건',
    title: '나를 브랜드라고 생각하면, 나의 슬로건은?',
    description: '자신만의 정체성을 담은 슬로건을 만들어보세요.',
    constraint: '10자 이내',
    placeholder: '나의 슬로건:',
  },
  {
    id: 'copy-003',
    type: 'copywriting',
    category: '상품소개',
    title: '지금 마시고 있는 음료를 30자로 소개해보세요',
    description: '일상의 음료를 매력적으로 표현해보세요.',
    constraint: '30자 이내',
    placeholder: '이 음료는...',
  },
  {
    id: 'copy-004',
    type: 'copywriting',
    category: '헤드라인',
    title: '오늘의 날씨를 뉴스 헤드라인처럼 써보세요',
    description: '평범한 날씨를 흥미롭게 전달해보세요.',
    placeholder: '[속보]',
  },
  {
    id: 'copy-005',
    type: 'copywriting',
    category: '광고카피',
    title: '퇴근길을 설레게 만드는 한 문장',
    description: '지친 퇴근길도 설렘으로 바꿔보세요.',
    placeholder: '퇴근길,',
  },
  {
    id: 'copy-006',
    type: 'copywriting',
    category: '브랜드슬로건',
    title: '당신이 자주 가는 카페의 새 슬로건을 만들어주세요',
    description: '그 공간의 분위기를 담아보세요.',
    constraint: '15자 이내',
  },
  {
    id: 'copy-007',
    type: 'copywriting',
    category: '상품소개',
    title: '지금 입고 있는 옷을 패션 매거진처럼 소개해보세요',
    description: '일상복도 스타일리시하게!',
  },

  // ===== 서사 글감 (narrative) =====
  {
    id: 'narr-001',
    type: 'narrative',
    category: '장면묘사',
    title: '오늘 아침, 눈을 떴을 때 가장 먼저 본 것은?',
    description: '그 순간을 생생하게 묘사해보세요.',
    placeholder: '눈을 떴을 때...',
  },
  {
    id: 'narr-002',
    type: 'narrative',
    category: '대사',
    title: '오늘 나눈 대화 중 기억에 남는 두 마디',
    description: '짧은 대사 두 줄로 그 순간을 담아보세요.',
    constraint: '대사 2줄만',
    placeholder: '"..." / "..."',
  },
  {
    id: 'narr-003',
    type: 'narrative',
    category: '감정묘사',
    title: '지금 이 순간의 기분을 날씨로 표현한다면?',
    description: '감정을 날씨에 비유해 풀어보세요.',
    placeholder: '내 마음의 날씨는...',
  },
  {
    id: 'narr-004',
    type: 'narrative',
    category: '장면묘사',
    title: '오늘 점심 풍경을 소설 한 단락처럼',
    description: '평범한 점심 시간을 문학적으로 표현해보세요.',
  },
  {
    id: 'narr-005',
    type: 'narrative',
    category: '인물묘사',
    title: '오늘 마주친 낯선 사람을 세 문장으로 묘사해보세요',
    description: '스쳐 지나간 인연을 글로 남겨보세요.',
    constraint: '3문장',
  },
  {
    id: 'narr-006',
    type: 'narrative',
    category: '감정묘사',
    title: '퇴근 후 현관문을 열었을 때의 기분',
    description: '집에 돌아온 그 순간의 감정을 담아보세요.',
  },
  {
    id: 'narr-007',
    type: 'narrative',
    category: '장면묘사',
    title: '창밖으로 보이는 풍경을 묘사해보세요',
    description: '지금 이 순간, 창밖의 세계를 글로 옮겨보세요.',
  },

  // ===== 제약 글쓰기 (constraint) =====
  {
    id: 'cons-001',
    type: 'constraint',
    category: '금지어',
    title: '"좋다"라는 말 없이 오늘 하루를 표현해보세요',
    description: '다른 표현을 찾아 더 풍부하게!',
    constraint: '금지어: 좋다, 좋은, 좋았다',
  },
  {
    id: 'cons-002',
    type: 'constraint',
    category: '형용사제한',
    title: '형용사 딱 3개만 써서 아침을 묘사해보세요',
    description: '제한된 단어로 더 정확하게.',
    constraint: '형용사 3개만 사용',
  },
  {
    id: 'cons-003',
    type: 'constraint',
    category: '문장구조',
    title: '모든 문장을 질문으로만 써보세요',
    description: '오늘 하루를 질문들로 풀어보세요.',
    constraint: '의문문만 사용',
    placeholder: '오늘은...?',
  },
  {
    id: 'cons-004',
    type: 'constraint',
    category: '글자수',
    title: '정확히 50자로 지금 기분을 표현해보세요',
    description: '한 글자도 빠짐없이, 넘치지도 않게.',
    constraint: '정확히 50자',
  },
  {
    id: 'cons-005',
    type: 'constraint',
    category: '금지어',
    title: '"나"라는 단어 없이 자기소개 해보세요',
    description: '1인칭 없이 자신을 표현하는 도전!',
    constraint: '금지어: 나, 저, 제가',
  },
  {
    id: 'cons-006',
    type: 'constraint',
    category: '문장구조',
    title: '한 문장으로 오늘 가장 기억에 남는 순간 쓰기',
    description: '끊지 않고 하나의 긴 문장으로.',
    constraint: '1문장 (마침표 1개)',
  },
  {
    id: 'cons-007',
    type: 'constraint',
    category: '형용사제한',
    title: '색깔 단어만 사용해서 오늘을 표현해보세요',
    description: '빨강, 파랑, 노랑... 색으로 말하는 하루.',
    constraint: '색깔 관련 단어만',
  },

  // ===== 오늘의 질문 (question) =====
  {
    id: 'ques-001',
    type: 'question',
    category: '자기성찰',
    title: '자서전을 쓴다면, 첫 문장은 무엇일까요?',
    description: '당신의 이야기는 어떻게 시작될까요?',
    placeholder: '나의 이야기는...',
  },
  {
    id: 'ques-002',
    type: 'question',
    category: '가치관',
    title: '10년 후의 나에게 해주고 싶은 말은?',
    description: '미래의 자신에게 보내는 메시지.',
  },
  {
    id: 'ques-003',
    type: 'question',
    category: '일상',
    title: '오늘 하루 중 다시 살고 싶은 순간이 있다면?',
    description: '그 순간을 떠올리며 써보세요.',
  },
  {
    id: 'ques-004',
    type: 'question',
    category: '자기성찰',
    title: '나를 가장 나답게 만드는 것은 무엇인가요?',
    description: '나다움에 대해 생각해보세요.',
  },
  {
    id: 'ques-005',
    type: 'question',
    category: '관계',
    title: '오늘 고마웠던 사람에게 하고 싶은 말',
    description: '표현하지 못한 감사를 글로 남겨보세요.',
  },
  {
    id: 'ques-006',
    type: 'question',
    category: '가치관',
    title: '행복이란 무엇인지 나만의 정의를 내려보세요',
    description: '당신에게 행복은 어떤 모습인가요?',
    placeholder: '행복이란...',
  },
  {
    id: 'ques-007',
    type: 'question',
    category: '일상',
    title: '오늘 배운 것 하나를 적어보세요',
    description: '작은 깨달음도 좋습니다.',
  },
  {
    id: 'ques-008',
    type: 'question',
    category: '자기성찰',
    title: '지금의 고민을 5년 전의 나에게 설명한다면?',
    description: '과거의 나는 이해할 수 있을까요?',
  },
  {
    id: 'ques-009',
    type: 'question',
    category: '관계',
    title: '가장 최근에 웃었던 이유는 무엇인가요?',
    description: '웃음의 순간을 기록해보세요.',
  },
];

/**
 * 오늘의 글감 가져오기
 * 날짜 기반으로 일관된 글감 반환
 */
export const getTodayPrompt = (date: Date = new Date()): WritingPrompt => {
  const dayOfYear = getDayOfYear(date);
  const index = dayOfYear % SAMPLE_PROMPTS.length;
  return SAMPLE_PROMPTS[index];
};

/**
 * 랜덤 글감 가져오기 (현재 글감 제외)
 */
export const getRandomPrompt = (excludeId?: string): WritingPrompt => {
  const filtered = excludeId
    ? SAMPLE_PROMPTS.filter(p => p.id !== excludeId)
    : SAMPLE_PROMPTS;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
};

/**
 * 타입별 글감 가져오기
 */
export const getPromptsByType = (type: WritingPrompt['type']): WritingPrompt[] => {
  return SAMPLE_PROMPTS.filter(p => p.type === type);
};

// 유틸: 연중 몇 번째 날인지 계산
const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};
