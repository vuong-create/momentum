import type { XPBreakdown } from "../../xp/XPService";
import { MomentumMark } from "../../../components/NavigationIcon";
import PillarIcon from "../../activities/components/PillarIcon";
import { pillarThemes } from "../../../app/theme";

type MomentumXPCardProps = {
  summary: XPBreakdown;
  expanded: boolean;
  onOpen: () => void;
};

export default function MomentumXPCard({ summary, expanded, onOpen }: MomentumXPCardProps) {
  const progression = summary.globalProgression;
  const percentage = Math.max(0, Math.min(100, progression.percentage));
  const activeContributions = summary.contributions.filter((item) => item.xp > 0);

  return (
    <button
      type="button"
      className="momentum-level-display"
      aria-label={`Momentum level ${progression.level}. Open progression details.`}
      aria-expanded={expanded}
      onClick={onOpen}
    >
      <span className="momentum-level-crest" aria-hidden="true"><MomentumMark /></span>
      <span className="momentum-level-identity">
        <strong><small>LV</small> {progression.level}</strong>
        <span>{summary.globalTitle}</span>
      </span>
      <span className="momentum-level-progress">
        <span className="momentum-level-progress-copy">
          <span>{progression.xpIntoLevel} / {progression.xpForLevel} XP</span>
          <strong>{Math.round(percentage)}%</strong>
        </span>
        <span className="momentum-level-bar" aria-hidden="true">
          <span className="momentum-level-fill" style={{ width: `${percentage}%` }} />
          <span className="momentum-level-segments">{Array.from({ length: 16 }, (_, index) => <i key={index} />)}</span>
        </span>
        <span className="momentum-level-next">{progression.xpToNextLevel} XP to Level {progression.level + 1}</span>
      </span>
      <span className="momentum-level-summary">
        <span>{summary.totalXP.toLocaleString()} <small>lifetime XP</small></span>
        <span className="momentum-level-paths" aria-label={`${activeContributions.length} active XP paths`}>
          {activeContributions.map((item) => (
            <span key={item.pillar} title={`${pillarThemes[item.pillar].shortLabel}: ${item.xp} XP`}>
              <PillarIcon pillar={item.pillar} />
            </span>
          ))}
        </span>
      </span>
      <span className="momentum-level-open" aria-hidden="true">↗</span>
    </button>
  );
}
