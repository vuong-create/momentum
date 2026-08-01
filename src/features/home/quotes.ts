export interface MomentumQuote {
  id: string;
  text: string;
  author: string;
}

export const momentumQuotes: MomentumQuote[] = [
  {
    id: "lao-tzu-journey",
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu",
  },
  {
    id: "marcus-obstacle",
    text: "The obstacle is the way.",
    author: "Marcus Aurelius",
  },
  {
    id: "confucius-speed",
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
  },
  {
    id: "seneca-luck",
    text: "Luck is what happens when preparation meets opportunity.",
    author: "Seneca",
  },
  {
    id: "aristotle-habits",
    text: "We are what we repeatedly do.",
    author: "Aristotle",
  },
  {
    id: "maya-courage",
    text: "Courage is the most important of all the virtues.",
    author: "Maya Angelou",
  },
  {
    id: "frankl-response",
    text: "Between stimulus and response, there is a space.",
    author: "Viktor Frankl",
  },
  {
    id: "thoreau-direction",
    text: "Go confidently in the direction of your dreams.",
    author: "Henry David Thoreau",
  },
  {
    id: "hepburn-impossible",
    text: "Nothing is impossible. The word itself says I’m possible.",
    author: "Audrey Hepburn",
  },
  {
    id: "roosevelt-believe",
    text: "Believe you can and you’re halfway there.",
    author: "Theodore Roosevelt",
  },
];

function hashDate(value: string) {
  return value
    .split("")
    .reduce(
      (total, character) =>
        (total * 31 + character.charCodeAt(0)) >>> 0,
      7
    );
}

export function getDailyQuote(dateKey: string) {
  const index = hashDate(dateKey) % momentumQuotes.length;

  return momentumQuotes[index];
}