import type { CSSProperties } from "react";

import type { XPBreakdown } from "../../xp/XPService";

type MomentumXPCardProps = {
  summary: XPBreakdown;
  expanded: boolean;
  onOpen: () => void;
};

const pillarMarks: Record<string, string> = {
  chinese: "文",
  athletics: "A",
  cooking: "C",
  finance: "F",
  happiness: "J",
  core: "M",
};

export default function MomentumXPCard({
  summary,
  expanded,
  onOpen,
}: MomentumXPCardProps) {
  const progression = summary.globalProgression;
  const activeContributions = summary.contributions
    .filter((contribution) => contribution.xp > 0)
    .slice(0, 6);
  const cardStyle = {
    "--momentum-xp-angle": `${progression.percentage * 3.6}deg`,
    "--momentum-xp-mid-angle": `${progression.percentage * 2.3}deg`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className="momentum-level-display"
      style={cardStyle}
      aria-label={`Momentum level ${progression.level}. Open progression details.`}
      aria-expanded={expanded}
      onClick={onOpen}
    >
      <span className="momentum-level-aura" aria-hidden="true" />
      <span className="momentum-level-grid" aria-hidden="true" />

      <span className="momentum-level-crest" aria-hidden="true">
        <span className="momentum-level-ring">
          <span className="momentum-level-core">
            <small>LV</small>
            <strong>{progression.level}</strong>
          </span>
        </span>
      </span>

      <span className="momentum-level-body">
        <span className="momentum-level-heading">
          <span>
            <small>Momentum rank</small>
            <strong>{summary.globalTitle}</strong>
          </span>
          <span className="momentum-level-total">
            {summary.totalXP.toLocaleString()}
            <small> lifetime XP</small>
          </span>
        </span>

        <span className="momentum-level-progress-copy">
          <span>{progression.xpIntoLevel} / {progression.xpForLevel} XP</span>
          <strong>{Math.round(progression.percentage)}%</strong>
        </span>

        <span className="momentum-level-bar">
          <span className="momentum-level-segments" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
          </span>
          <span
            className="momentum-level-fill"
            style={{ width: `${progression.percentage}%` }}
          >
            <i />
          </span>
        </span>

        <span className="momentum-level-footer">
          <span className="momentum-level-paths" aria-label={`${activeContributions.length} active XP paths`}>
            {activeContributions.length > 0 ? activeContributions.map((contribution) => (
              <i key={contribution.pillar} className={`pillar-${contribution.pillar}`} title={`${contribution.pillar}: ${contribution.xp} XP`}>
                {pillarMarks[contribution.pillar]}
              </i>
            )) : <small>Your first action ignites Momentum.</small>}
          </span>
          <span>{progression.xpToNextLevel} XP to Level {progression.level + 1} <b>↗</b></span>
        </span>
      </span>
    </button>
  );
}
