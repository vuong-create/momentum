export interface MomentumQuote {
  id: string;
  text: string;
  author: string;
  source?: string;
}

// Kept local intentionally: Home stays instant, private, and available offline.
export const momentumQuotes: MomentumQuote[] = [
  { id: "lao-tzu-journey", text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { id: "marcus-obstacle", text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { id: "confucius-speed", text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { id: "seneca-luck", text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { id: "aristotle-habits", text: "We are what we repeatedly do.", author: "Aristotle" },
  { id: "maya-courage", text: "Courage is the most important of all the virtues.", author: "Maya Angelou" },
  { id: "frankl-response", text: "Between stimulus and response, there is a space.", author: "Viktor Frankl" },
  { id: "thoreau-direction", text: "Go confidently in the direction of your dreams.", author: "Henry David Thoreau" },
  { id: "hepburn-impossible", text: "Nothing is impossible. The word itself says I’m possible.", author: "Audrey Hepburn" },
  { id: "roosevelt-believe", text: "Believe you can and you’re halfway there.", author: "Theodore Roosevelt" },
  { id: "marcus-mind", text: "You have power over your mind—not outside events.", author: "Marcus Aurelius", source: "Meditations" },
  { id: "marcus-time", text: "Waste no more time arguing what a good person should be. Be one.", author: "Marcus Aurelius", source: "Meditations" },
  { id: "marcus-present", text: "Confine yourself to the present.", author: "Marcus Aurelius", source: "Meditations" },
  { id: "epictetus-control", text: "Make the best use of what is in your power.", author: "Epictetus" },
  { id: "epictetus-progress", text: "No great thing is created suddenly.", author: "Epictetus" },
  { id: "epictetus-listen", text: "We have two ears and one mouth so that we can listen twice as much as we speak.", author: "Epictetus" },
  { id: "seneca-begin", text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { id: "seneca-difficulty", text: "It is not because things are difficult that we do not dare.", author: "Seneca" },
  { id: "seneca-direction", text: "If one does not know to which port one is sailing, no wind is favorable.", author: "Seneca" },
  { id: "confucius-learning", text: "Learning without thought is labor lost; thought without learning is perilous.", author: "Confucius", source: "Analects" },
  { id: "confucius-correction", text: "To make a mistake and not correct it—that is a mistake.", author: "Confucius", source: "Analects" },
  { id: "confucius-mountain", text: "The person who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { id: "lao-tzu-content", text: "Those who know they have enough are rich.", author: "Lao Tzu", source: "Tao Te Ching" },
  { id: "lao-tzu-water", text: "Nothing is softer or more flexible than water, yet nothing can resist it.", author: "Lao Tzu" },
  { id: "lao-tzu-knowledge", text: "To know that you do not know is the highest.", author: "Lao Tzu" },
  { id: "aristotle-start", text: "Well begun is half done.", author: "Aristotle" },
  { id: "aristotle-quality", text: "Quality is not an act; it is a habit.", author: "Aristotle" },
  { id: "socrates-examined", text: "The unexamined life is not worth living.", author: "Socrates", source: "Plato’s Apology" },
  { id: "heraclitus-character", text: "Character is destiny.", author: "Heraclitus" },
  { id: "cicero-gratitude", text: "Gratitude is not only the greatest of virtues, but the parent of all others.", author: "Cicero" },
  { id: "shakespeare-action", text: "Action is eloquence.", author: "William Shakespeare", source: "Coriolanus" },
  { id: "shakespeare-ready", text: "The readiness is all.", author: "William Shakespeare", source: "Hamlet" },
  { id: "bacon-knowledge", text: "Knowledge itself is power.", author: "Francis Bacon" },
  { id: "goethe-action", text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { id: "emerson-self-trust", text: "Trust thyself: every heart vibrates to that iron string.", author: "Ralph Waldo Emerson", source: "Self-Reliance" },
  { id: "emerson-enthusiasm", text: "Nothing great was ever achieved without enthusiasm.", author: "Ralph Waldo Emerson" },
  { id: "emerson-path", text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { id: "thoreau-morning", text: "An early-morning walk is a blessing for the whole day.", author: "Henry David Thoreau" },
  { id: "thoreau-simplicity", text: "Our life is frittered away by detail. Simplify, simplify.", author: "Henry David Thoreau", source: "Walden" },
  { id: "whitman-sunshine", text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
  { id: "dickinson-forever", text: "Forever is composed of nows.", author: "Emily Dickinson" },
  { id: "eliot-never-late", text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { id: "tolstoy-change", text: "Everyone thinks of changing the world, but no one thinks of changing himself.", author: "Leo Tolstoy" },
  { id: "twain-secret", text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { id: "wilde-experience", text: "Experience is simply the name we give our mistakes.", author: "Oscar Wilde" },
  { id: "james-act", text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { id: "douglass-struggle", text: "If there is no struggle, there is no progress.", author: "Frederick Douglass" },
  { id: "lincoln-years", text: "In the end, it is not the years in your life, but the life in your years.", author: "Abraham Lincoln" },
  { id: "washington-success", text: "Success is to be measured not by position, but by obstacles overcome.", author: "Booker T. Washington" },
  { id: "japanese-fall", text: "Fall seven times, stand up eight.", author: "Japanese proverb" },
  { id: "african-alone", text: "If you want to go far, go together.", author: "African proverb" },
  { id: "english-well", text: "A thing worth doing is worth doing well.", author: "English proverb" },
  { id: "latin-fortune", text: "Fortune favors the bold.", author: "Latin proverb" },
  { id: "momentum-quiet", text: "Quiet consistency changes the shape of a life.", author: "Momentum" },
  { id: "momentum-return", text: "The return is part of the practice.", author: "Momentum" },
  { id: "momentum-small", text: "Small actions become a direction when you repeat them.", author: "Momentum" },
  { id: "momentum-attention", text: "What receives your attention begins to take form.", author: "Momentum" },
  { id: "momentum-rest", text: "Rest is not leaving the path; it is how you remain on it.", author: "Momentum" },
  { id: "momentum-patience", text: "Patience gives good work enough time to become itself.", author: "Momentum" },
  { id: "momentum-today", text: "A life is built in ordinary days like this one.", author: "Momentum" },
];

export function hashDailyValue(value: string) {
  return value.split("").reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
}

export function getDailyQuote(dateKey: string) {
  return momentumQuotes[hashDailyValue(`quote:${dateKey}`) % momentumQuotes.length];
}
