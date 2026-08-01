import { useState } from "react";

import { pillarThemes, type PillarKey } from "../../../app/theme";
import type { ActivityTemplate } from "../../../database/db";
import { describeRecurrence } from "../../activities/services/recurrenceService";

type PlannerTemplatesProps = {
  templates: ActivityTemplate[];
  selectedDayLabel: string;
  onUse: (template: ActivityTemplate) => Promise<void>;
  onDelete: (template: ActivityTemplate) => Promise<void>;
};

export default function PlannerTemplates({
  templates,
  selectedDayLabel,
  onUse,
  onDelete,
}: PlannerTemplatesProps) {
  const [expanded, setExpanded] = useState(templates.length > 0);
  const [workingId, setWorkingId] = useState<number | null>(null);

  if (templates.length === 0) return null;

  return (
    <section className="planner-templates">
      <button type="button" className="planner-templates-heading" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span><strong>Templates</strong><small>Reusable starts for {selectedDayLabel}</small></span>
        <span>{templates.length} {expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="planner-template-list">
          {templates.map((template) => {
            const theme = pillarThemes[template.pillar as PillarKey];
            return (
              <article key={template.id} className={`planner-template ${theme.className}`}>
                <span className="planner-template-dot" />
                <button type="button" className="planner-template-use" disabled={workingId === template.id} onClick={async () => {
                  setWorkingId(template.id ?? null);
                  try { await onUse(template); } finally { setWorkingId(null); }
                }}>
                  <strong>{template.title}</strong>
                  <small>{template.recurrencePreset ? describeRecurrence(template.recurrencePreset) : theme.shortLabel}</small>
                </button>
                <button type="button" className="planner-template-delete" onClick={() => onDelete(template)} aria-label={`Delete ${template.title} template`}>×</button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
