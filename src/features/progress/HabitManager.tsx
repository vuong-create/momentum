import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Habit, type Pillar } from "../../database/db";
import { homePillars, pillarThemes } from "../../app/theme";
import { completionDay, habitDayTask, offset, periodOn, saveHabit, sunday, todayKey } from "./habitService";
import "./progress.css";
import { chineseActivityCatalog } from "../chinese/activityCatalog";

const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function Manager({ week }: { week: string }) {
  const habits = useLiveQuery(() => db.habits.toArray()) ?? [];
  const rules = useLiveQuery(() => db.recurrenceRules.toArray()) ?? [];
  const tasks = useLiveQuery(() => db.plannedActivities.toArray()) ?? [];
  const today = todayKey();
  const [editing,setEditing] = useState<number | "new" | null>(null);
  const [title,setTitle] = useState("");
  const [pillar,setPillar] = useState<Pillar>("core");
  const [from,setFrom] = useState(today);
  const [mode,setMode] = useState("fixed");
  const [days,setDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [target,setTarget] = useState(3);
  const [kind,setKind] = useState("");
  const [chosen,setChosen] = useState(week <= today && today <= offset(week,6) ? today : week);
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);
  function edit(h?: Habit) {
    setKind(h?.activityKind ?? "");
    const p = h?.periods.at(-1);
    const rule = rules.find(r => r.id === p?.ruleId);
    setEditing(h?.id ?? "new"); setTitle(h?.title ?? ""); setPillar(h?.pillar ?? "core"); setFrom(p && p.from > today ? p.from : today);
    setMode(p?.target ? "flex" : "fixed"); setTarget(p?.target ?? 3); setDays(rule?.weekdays ?? [0,1,2,3,4,5,6]); setNotice("");
  }
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setNotice("");
    try { await action(); } catch (e) { setNotice(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(false); }
  }
  return <div className="habit-manager"><div className="habit-tools"><strong>Your habits</strong><button onClick={() => edit()}>+ New habit</button></div>
    {habits.map(h => {
      const p = periodOn(h,offset(week,6));
      const rule = rules.find(r => r.id === p?.ruleId);
      const total = new Set(tasks.filter(a => a.habitId === h.id).map(completionDay).filter(d => d && d >= week && d <= offset(week,6))).size;
      return <div className="habit-row" key={h.id}><b>{h.title}</b><span>{p?.target ? total + "/" + p.target + " this week" : rule?.frequency === "weekly" ? rule.weekdays?.map(i=>weekdays[i]).join(" · ") : rule?.frequency ?? "Upcoming"}</span>
        {p?.target && <><input aria-label={h.title + " planned day"} type="date" value={chosen} onChange={e=>setChosen(e.target.value)} />
          <button disabled={busy} onClick={()=>run(async()=>{await habitDayTask(h.id!,chosen); setNotice("Scheduled for " + chosen);})}>{chosen === today ? "Add to today" : "Add to day"}</button></>}
        <button onClick={()=>edit(h)}>Edit schedule</button></div>;
    })}
    {!habits.length && <p>Create a habit, or open a recurring task and choose “Track as habit”.</p>}
    {editing !== null && <form className="habit-form" onSubmit={e=>{e.preventDefault(); void run(async()=>{
      await saveHabit(title,pillar,from,mode==="flex"?{target}:{days},typeof editing==="number"?editing:undefined,pillar==="chinese" && kind ? kind : undefined); setEditing(null); setNotice("Habit schedule saved.");
    });}}>
      <label>Habit name<input required disabled={editing!=="new"} value={title} onChange={e=>setTitle(e.target.value)} /></label>
      <label>Pillar<select disabled={editing!=="new"} value={pillar} onChange={e=>setPillar(e.target.value as Pillar)}>{(["core",...homePillars] as Pillar[]).map(k=><option key={k} value={k}>{pillarThemes[k].shortLabel}</option>)}</select></label>
      {pillar==="chinese" && <label>Link Chinese practice<select disabled={editing!=="new"} value={kind} onChange={e=>setKind(e.target.value)}><option value="">None</option>{chineseActivityCatalog.map(c=><option key={c.type} value={"chinese:"+c.type}>{c.label}</option>)}</select></label>}
      <label>{editing==="new"?"Start date":"Change from"}<input type="date" required min={editing==="new"?undefined:today} value={from} onChange={e=>setFrom(e.target.value)} /></label>
      <label>Schedule<select value={mode} onChange={e=>setMode(e.target.value)}><option value="fixed">On specific days</option><option value="flex">Times per week</option></select></label>
      {mode==="flex"?<label>Weekly target<input type="number" min="1" max="7" required value={target} onChange={e=>setTarget(Number(e.target.value))}/></label>:
        <div className="habit-tools" aria-label="Scheduled weekdays">{weekdays.map((d,i)=><button type="button" key={d} aria-pressed={days.includes(i)} onClick={()=>setDays(days.includes(i)?days.filter(n=>n!==i):[...days,i].sort())}>{d}</button>)}</div>}
      <div className="habit-tools"><button disabled={busy}>Save schedule</button><button type="button" onClick={()=>setEditing(null)}>Cancel</button></div>
    </form>}<span role="status">{notice}</span></div>;
}
export default function HabitManager({week}: {week:string}) {
  const [open,setOpen] = useState(false);
  return <section className="habit-entry"><div className="habit-tools"><button aria-expanded={open} onClick={()=>setOpen(!open)}>Habits</button><Link to="/progress">Progress ↗</Link></div>{open && <Manager key={week} week={sunday(week)}/>}</section>;
}
