import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
};

export default function SectionHeader({
  eyebrow,
  title,
  aside,
}: SectionHeaderProps) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>

      {aside && <div className="section-aside">{aside}</div>}
    </div>
  );
}