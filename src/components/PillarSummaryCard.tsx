import { Link } from "react-router-dom";
import type { PillarTheme } from "../app/theme";

type PillarSummaryCardProps = {
  theme: PillarTheme;
  summary: string;
};

export default function PillarSummaryCard({
  theme,
  summary,
}: PillarSummaryCardProps) {
  return (
    <Link
      to={theme.route}
      className={`pillar-card ${theme.className}`}
    >
      <div className="pillar-icon" aria-hidden="true">
        {theme.icon}
      </div>

      <div className="pillar-card-content">
        <h3>{theme.label}</h3>
        <p>{theme.description}</p>
        <strong>{summary}</strong>
      </div>
    </Link>
  );
}