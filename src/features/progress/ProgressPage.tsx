import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Pillar } from "../../database/db";
import { homePillars, pillarThemes } from "../../app/theme";
import { matchesRule } from "../activities/services/recurrenceService";
import { getChineseActivityDefinition } from "../chinese/activityCatalog";
import { completionDay, habitDayTask, offset, periodOn, sunday, todayKey } from "./habitService";
import "./progress.css";
import { isActivityVisible } from "../activities/services/activityLifecycle";

const colors: Record<Pillar,string> = { core:"#b6a7df", athletics:"#8eb7de", chinese:"#df8c93", cooking:"#d9ae80", finance:"#86b996", happiness:"#c7a6c7" };
const label = (day:string, options:Intl.DateTimeFormatOptions) => new Date(day+"T12:00:00").toLocaleDateString("en-US",options);
export default function ProgressPage() {
  const today = todayKey();
  const [weeks,setWeeks] = useState(12);
  const [pillar,setPillar] = useState("all");
  const [habit,setHabit] = useState(0);
  const [selected,setSelected] = useState(today);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const track = useRef<HTMLDivElement>(null);
  const data = useLiveQuery(async()=> {
    const [habits,rules,tasks,chinese] = await Promise.all([db.habits.toArray(),db.recurrenceRules.toArray(),db.plannedActivities.toArray(),db.chineseActivities.toArray()]);
    return {habits,rules,tasks,chinese};
  });
  const h = data?.habits.find(x=>x.id===habit);
  const days = useMemo(()=>{
    const map = new Map<string,string[]>();
    const add = (d:string,title:string)=>{ const list = map.get(d) ?? []; list.push(title); map.set(d,list); };
    if (!data) return map;
    for (const a of data.tasks) {
      const d = completionDay(a);
      if (d && (h ? a.habitId===h.id : pillar==="all" || a.pillar===pillar)) add(d,a.title);
    }
    if (!h && (pillar==="all" || pillar==="chinese")) for (const c of data.chinese) {
      if (!c.deletedAt && !c.plannedActivityId) add(c.date,getChineseActivityDefinition(c.type).label);
    }
    return map;
  },[data,h,pillar]);
  const start = offset(sunday(today),-7*(weeks-1));
  const selectedItems = days.get(selected) ?? [];
  const exceptions = useMemo(()=>{
    const scheduled = new Set<string>(), removed = new Set<string>();
    for (const a of data?.tasks ?? []) {
      if (!h || a.habitId !== h.id) continue;
      if (a.scheduledDate && isActivityVisible(a)) scheduled.add(a.scheduledDate);
      if (a.recurrenceDate && (!isActivityVisible(a) || a.recurrenceDate !== a.scheduledDate)) removed.add(a.recurrenceDate);
    }
    return {scheduled,removed};
  },[data,h]);
  function expected(d:string) {
    if (exceptions.scheduled.has(d)) return true;
    if (exceptions.removed.has(d)) return false;
    const ruleId = h && periodOn(h,d)?.ruleId;
    const rule = ruleId && data?.rules.find(r=>r.id===ruleId);
    return !!rule && matchesRule(rule,d);
  }
  useEffect(()=>{if(track.current)track.current.scrollLeft=track.current.scrollWidth;},[weeks]);
  const weekDays = Array.from({length:7},(_,i)=>offset(sunday(selected),i));
  const weeklyTarget = h && periodOn(h,selected)?.target;
  return <div className="progress-page" style={{"--pixel-ink":colors[h?.pillar ?? (pillar==="all"?"core":pillar as Pillar)]} as CSSProperties}>
    <Link to="/planner">← Planner</Link><header><small>MOMENTUM / HISTORY</small><h1>Progress</h1></header>
    <section className="progress-calendar" aria-label="Activity calendar"><div className="habit-tools">
      <label>Map<select value={habit} onChange={e=>{setHabit(Number(e.target.value));setNotice("");}}><option value={0}>Activity</option>{data?.habits.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
      {!h && <label>Pillar<select value={pillar} onChange={e=>setPillar(e.target.value)}><option value="all">All pillars</option>{(["core",...homePillars] as Pillar[]).map(k=><option key={k} value={k}>{pillarThemes[k].shortLabel}</option>)}</select></label>}
      <label>Range<select value={weeks} onChange={e=>{setWeeks(Number(e.target.value));setSelected(today);}}><option value={12}>12 weeks</option><option value={53}>Year</option></select></label></div>
      <div className="pixel-atlas" data-range={weeks}><div className="pixel-axis">{["","Su","Mo","Tu","We","Th","Fr","Sa"].map(x=><small key={x}>{x}</small>)}</div>
      <div className="pixel-scroll" ref={track}><div className="pixel-weeks" style={{gridTemplateColumns:"repeat("+weeks+", var(--cell))"}}>
        {Array.from({length:weeks},(_,w)=>{
          const first=offset(start,7*w), last=offset(first,6);
          return <div className="pixel-week" key={first}><small>{w===0 || first.slice(0,7)!==last.slice(0,7) || first.endsWith("-01") ? label(last,{month:"short"}) : ""}</small>
            {Array.from({length:7},(_,i)=>{
              const d=offset(first,i), n=days.get(d)?.length ?? 0;
              const due = expected(d), desc = h ? n?"Done":due?"Scheduled, not logged":"Not scheduled" : n+" completions";
              return <button key={d} disabled={d>today} data-day={d} data-level={h && n ? 4 : n<3 ? n : n<5 ? 3 : 4} data-due={due && !n && d<=today} data-today={d===today}
                aria-label={d+" · "+desc} title={d+" · "+desc} aria-pressed={selected===d} tabIndex={selected===d?0:-1}
                onKeyDown={e=>{const delta=({ArrowUp:-1,ArrowDown:1,ArrowRight:7,ArrowLeft:-7} as Record<string,number>)[e.key];if(delta){e.preventDefault();const next=offset(d,delta);if(next>=start && next<=today){setSelected(next);track.current?.querySelector<HTMLButtonElement>('[data-day="'+next+'"]')?.focus();}}}}
                onClick={()=>{setSelected(d);setNotice("");}}/>;
            })}</div>;
        })}</div></div></div>
      <p className="pixel-legend">{h?"Filled: done　·　Outline: scheduled, not logged　·　Dim: not scheduled":"Completions per day"} {!h && [0,1,2,3,4].map((v)=><span key={v}><i data-level={v}/>{["0","1","2","3–4","5+"][v]}</span>)}</p>
    </section>{h && <aside className="habit-week"><strong>{h.title} · week of {label(weekDays[0],{month:"short",day:"numeric"})}</strong>
      {weeklyTarget && <span> · {weekDays.filter(d=>days.has(d)).length}/{weeklyTarget} days completed</span>}
      <div>{weekDays.map(d=><button key={d} disabled={d>today || d<start} aria-pressed={selected===d} onClick={()=>{setSelected(d);setNotice("");}}>{label(d,{weekday:"short"})} {days.has(d)?"✓":expected(d)?"○":"·"}</button>)}</div>
    </aside>}<section className="progress-detail"><small>{label(selected,{weekday:"long"})} · {selected.slice(0,4)}</small><h2>{label(selected,{month:"long",day:"numeric"})}</h2>
      {selectedItems.length ? <ul>{selectedItems.map((s,i)=><li key={i}>{s}</li>)}</ul> : <p>{!data?"Loading history…":h && !expected(selected)?"No habit check-in.":"No completions recorded."}</p>}
      {h && !selectedItems.length && (expected(selected) || periodOn(h,selected)?.target) && <button disabled={busy} onClick={async()=>{
        setBusy(true);setNotice("");try{await habitDayTask(h.id!,selected,true);setNotice("Check-in saved.");}catch(e){setNotice(e instanceof Error?e.message:"Could not save.");}finally{setBusy(false);}
      }}>Log for {label(selected,{month:"short",day:"numeric"})}</button>}<p role="status">{notice}</p>
    </section></div>;
}
