import type { MomentumQuote } from "./quotes";
import { hashDailyValue } from "./quotes";

export interface ChineseIdiom extends MomentumQuote {
  pinyin: string;
  meaning: string;
}

export const chineseIdioms: ChineseIdiom[] = [
  { id: "idiom-water-stone", text: "水滴石穿", pinyin: "shuǐ dī shí chuān", meaning: "Persistent effort can overcome great difficulty.", author: "Chinese idiom" },
  { id: "idiom-persevere", text: "持之以恆", pinyin: "chí zhī yǐ héng", meaning: "Continue with steady perseverance.", author: "Chinese idiom" },
  { id: "idiom-step-by-step", text: "循序漸進", pinyin: "xún xù jiàn jìn", meaning: "Advance gradually in the proper order.", author: "Chinese idiom" },
  { id: "idiom-grounded", text: "腳踏實地", pinyin: "jiǎo tà shí dì", meaning: "Work earnestly with both feet on the ground.", author: "Chinese idiom" },
  { id: "idiom-review", text: "溫故知新", pinyin: "wēn gù zhī xīn", meaning: "Gain new understanding by reviewing the old.", author: "Chinese idiom" },
  { id: "idiom-practice", text: "熟能生巧", pinyin: "shú néng shēng qiǎo", meaning: "Practice develops skill and mastery.", author: "Chinese idiom" },
  { id: "idiom-diligence", text: "勤能補拙", pinyin: "qín néng bǔ zhuō", meaning: "Diligence can compensate for lack of talent.", author: "Chinese idiom" },
  { id: "idiom-refine", text: "精益求精", pinyin: "jīng yì qiú jīng", meaning: "Keep improving what is already good.", author: "Chinese idiom" },
  { id: "idiom-focus", text: "專心致志", pinyin: "zhuān xīn zhì zhì", meaning: "Devote the whole mind to one purpose.", author: "Chinese idiom" },
  { id: "idiom-all-out", text: "全力以赴", pinyin: "quán lì yǐ fù", meaning: "Give the task your complete effort.", author: "Chinese idiom" },
  { id: "idiom-indomitable", text: "百折不撓", pinyin: "bǎi zhé bù náo", meaning: "Remain undaunted despite repeated setbacks.", author: "Chinese idiom" },
  { id: "idiom-self-renewal", text: "自強不息", pinyin: "zì qiáng bù xí", meaning: "Strive constantly for self-improvement.", author: "Chinese idiom" },
  { id: "idiom-deep-roots", text: "厚積薄發", pinyin: "hòu jī bó fā", meaning: "Build deep reserves, then apply them with restraint.", author: "Chinese idiom" },
  { id: "idiom-prepare", text: "未雨綢繆", pinyin: "wèi yǔ chóu móu", meaning: "Prepare before difficulty arrives.", author: "Chinese idiom" },
  { id: "idiom-danger", text: "居安思危", pinyin: "jū ān sī wéi", meaning: "Stay mindful of danger even in peaceful times.", author: "Chinese idiom" },
  { id: "idiom-emulate", text: "見賢思齊", pinyin: "jiàn xián sī qí", meaning: "Seeing the worthy, aspire to equal them.", author: "Chinese idiom" },
  { id: "idiom-many-minds", text: "集思廣益", pinyin: "jí sī guǎng yì", meaning: "Gather many ideas to gain greater benefit.", author: "Chinese idiom" },
  { id: "idiom-truth", text: "實事求是", pinyin: "shí shì qiú shì", meaning: "Seek truth from facts.", author: "Chinese idiom" },
  { id: "idiom-apply", text: "學以致用", pinyin: "xué yǐ zhì yòng", meaning: "Learn in order to put knowledge into practice.", author: "Chinese idiom" },
  { id: "idiom-meticulous", text: "一絲不苟", pinyin: "yī sī bù gǒu", meaning: "Be meticulous in every detail.", author: "Chinese idiom" },
  { id: "idiom-easy-solution", text: "迎刃而解", pinyin: "yíng rèn ér jiě", meaning: "A problem resolves readily once the key is found.", author: "Chinese idiom" },
  { id: "idiom-half-effort", text: "事半功倍", pinyin: "shì bàn gōng bèi", meaning: "Gain twice the result with half the effort.", author: "Chinese idiom" },
  { id: "idiom-infer", text: "舉一反三", pinyin: "jǔ yī fǎn sān", meaning: "Infer many things from a single example.", author: "Chinese idiom" },
  { id: "idiom-integrate", text: "融會貫通", pinyin: "róng huì guàn tōng", meaning: "Integrate knowledge into a complete understanding.", author: "Chinese idiom" },
  { id: "idiom-analogy", text: "觸類旁通", pinyin: "chù lèi páng tōng", meaning: "Understand related matters through analogy.", author: "Chinese idiom" },
  { id: "idiom-clarity", text: "豁然開朗", pinyin: "huò rán kāi lǎng", meaning: "Suddenly see things with complete clarity.", author: "Chinese idiom" },
  { id: "idiom-new-opening", text: "柳暗花明", pinyin: "liǔ àn huā míng", meaning: "Discover new hope after apparent difficulty.", author: "Chinese idiom" },
  { id: "idiom-turning-path", text: "峰迴路轉", pinyin: "fēng huí lù zhuǎn", meaning: "Circumstances change and reveal a new path.", author: "Chinese idiom" },
  { id: "idiom-fortune-turns", text: "否極泰來", pinyin: "pǐ jí tài lái", meaning: "When adversity reaches its limit, fortune returns.", author: "Chinese idiom" },
  { id: "idiom-content", text: "知足常樂", pinyin: "zhī zú cháng lè", meaning: "Contentment brings lasting happiness.", author: "Chinese idiom" },
  { id: "idiom-composed", text: "安之若素", pinyin: "ān zhī ruò sù", meaning: "Remain composed in changed circumstances.", author: "Chinese idiom" },
  { id: "idiom-calm", text: "心平氣和", pinyin: "xīn píng qì hé", meaning: "Keep a calm mind and even temper.", author: "Chinese idiom" },
  { id: "idiom-unhurried", text: "從容不迫", pinyin: "cóng róng bù pò", meaning: "Act calmly and without haste.", author: "Chinese idiom" },
  { id: "idiom-unruffled", text: "泰然自若", pinyin: "tài rán zì ruò", meaning: "Remain calm and self-possessed.", author: "Chinese idiom" },
  { id: "idiom-harmony", text: "和而不同", pinyin: "hé ér bù tóng", meaning: "Live in harmony without demanding sameness.", author: "Chinese idiom" },
  { id: "idiom-empathy", text: "推己及人", pinyin: "tuī jǐ jí rén", meaning: "Extend understanding of yourself to others.", author: "Chinese idiom" },
  { id: "idiom-help-others", text: "成人之美", pinyin: "chéng rén zhī měi", meaning: "Help others accomplish what is good.", author: "Chinese idiom" },
  { id: "idiom-source", text: "飲水思源", pinyin: "yǐn shuǐ sī yuán", meaning: "Remember the source of what sustains you.", author: "Chinese idiom" },
  { id: "idiom-kindness", text: "投桃報李", pinyin: "tóu táo bào lǐ", meaning: "Return kindness with kindness.", author: "Chinese idiom" },
  { id: "idiom-timely-help", text: "雪中送炭", pinyin: "xuě zhōng sòng tàn", meaning: "Offer help when it is needed most.", author: "Chinese idiom" },
  { id: "idiom-together", text: "同舟共濟", pinyin: "tóng zhōu gòng jì", meaning: "Work together through shared difficulty.", author: "Chinese idiom" },
  { id: "idiom-complement", text: "相輔相成", pinyin: "xiāng fǔ xiāng chéng", meaning: "Different parts support and complete one another.", author: "Chinese idiom" },
  { id: "idiom-enhance", text: "相得益彰", pinyin: "xiāng dé yì zhāng", meaning: "Two strengths bring out the best in each other.", author: "Chinese idiom" },
  { id: "idiom-torch", text: "薪火相傳", pinyin: "xīn huǒ xiāng chuán", meaning: "Pass knowledge and tradition between generations.", author: "Chinese idiom" },
  { id: "idiom-past-future", text: "承先啟後", pinyin: "chéng xiān qǐ hòu", meaning: "Carry forward the past and open the future.", author: "Chinese idiom" },
  { id: "idiom-renew", text: "日新月異", pinyin: "rì xīn yuè yì", meaning: "Change and improve with each passing day.", author: "Chinese idiom" },
  { id: "idiom-vitality", text: "生生不息", pinyin: "shēng shēng bù xí", meaning: "Life and renewal continue without end.", author: "Chinese idiom" },
  { id: "idiom-joy", text: "樂在其中", pinyin: "lè zài qí zhōng", meaning: "Find joy within the process itself.", author: "Chinese idiom" },
  { id: "idiom-after-hardship", text: "苦盡甘來", pinyin: "kǔ jìn gān lái", meaning: "Sweetness arrives after hardship has passed.", author: "Chinese idiom" },
  { id: "idiom-duty", text: "任重道遠", pinyin: "rèn zhòng dào yuǎn", meaning: "The responsibility is heavy and the road is long.", author: "Chinese idiom" },
];

export function getDailyChineseIdiom(dateKey: string) {
  return chineseIdioms[hashDailyValue(`idiom:${dateKey}`) % chineseIdioms.length];
}

export function idiomAsQuote(idiom: ChineseIdiom): MomentumQuote {
  return { id: idiom.id, text: idiom.text, author: idiom.author, source: `${idiom.pinyin} · ${idiom.meaning}` };
}
