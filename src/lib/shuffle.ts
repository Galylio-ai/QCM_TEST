import { QUESTIONS } from './questions';

function shuffle<T>(arr: T[], seed: number): T[] {
  let s = seed;
  function rand() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type OrderedQuestion = {
  originalIndex: number;
  displayIndex: number;
  question: string;
  antiFraud: boolean;
  choiceOrder: number[];
  shuffledChoices: string[];
  correctShuffledIndex: number;
};

export function buildOrderedQuestions(token: string): OrderedQuestion[] {
  const qSeed = seedFromString(token + ':q');
  const order = shuffle(QUESTIONS.map((_, i) => i), qSeed);
  return order.map((origIdx, displayIdx) => {
    const q = QUESTIONS[origIdx];
    const choiceSeed = seedFromString(token + ':c:' + origIdx);
    const choiceOrder = shuffle([0, 1, 2, 3], choiceSeed);
    return {
      originalIndex: origIdx,
      displayIndex,
      question: q.q,
      antiFraud: !!q.antiFraud,
      choiceOrder,
      shuffledChoices: choiceOrder.map(i => q.choices[i]),
      correctShuffledIndex: choiceOrder.indexOf(q.answer)
    };
  });
}
