import type { JournalEntryCategory } from "../../database/db";

export type JournalPrompt = {
  id: string;
  category: JournalEntryCategory;
  label: string;
  question: string;
  suggestedTitle: string;
  template: string;
};

export const journalCategories: Array<{
  id: JournalEntryCategory;
  label: string;
  mark: string;
}> = [
  { id: "reflection", label: "Reflection", mark: "◐" },
  { id: "gratitude", label: "Gratitude", mark: "✦" },
  { id: "memory", label: "Memory", mark: "◇" },
  { id: "growth", label: "Growth", mark: "↗" },
  { id: "ideas", label: "Ideas", mark: "∴" },
  { id: "books", label: "Books", mark: "▥" },
];

export const journalPrompts: JournalPrompt[] = [
  {
    id: "daily-reset",
    category: "reflection",
    label: "Daily reset",
    question: "What deserves a second look today?",
    suggestedTitle: "Today, honestly",
    template: "What happened?\n\n\nWhat did I notice in myself?\n\n\nWhat do I want to carry forward?\n\n",
  },
  {
    id: "three-good-things",
    category: "gratitude",
    label: "Three good things",
    question: "What quietly made today better?",
    suggestedTitle: "Three good things",
    template: "1. \n\n2. \n\n3. \n\nWhy did these matter to me?\n\n",
  },
  {
    id: "keep-this-moment",
    category: "memory",
    label: "Keep a moment",
    question: "What would you regret forgetting?",
    suggestedTitle: "A moment worth keeping",
    template: "Where was I?\n\n\nWhat happened?\n\n\nThe detail I want to remember most:\n\n",
  },
  {
    id: "work-through-it",
    category: "growth",
    label: "Work through it",
    question: "What feels difficult—and what is it asking of you?",
    suggestedTitle: "Working through something",
    template: "What am I feeling?\n\n\nWhat might be underneath it?\n\n\nWhat is one kind, useful next step?\n\n",
  },
  {
    id: "develop-an-idea",
    category: "ideas",
    label: "Develop an idea",
    question: "What idea keeps returning to you?",
    suggestedTitle: "An idea to explore",
    template: "The idea:\n\n\nWhy it interests me:\n\n\nQuestions or possibilities:\n\n\nA small next experiment:\n\n",
  },
  {
    id: "reading-reflection",
    category: "books",
    label: "Reading reflection",
    question: "What changed after reading this?",
    suggestedTitle: "Reading reflection",
    template: "Book or passage:\n\n\nWhat stayed with me?\n\n\nA line or idea worth keeping:\n\n\nHow might this change what I do?\n\n",
  },
];

export function getJournalCategory(category?: JournalEntryCategory) {
  return journalCategories.find((option) => option.id === category);
}
