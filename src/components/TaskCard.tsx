type TaskCardProps = {
  title: string;
  pillar: string;
  xpReward: number;
  difficulty: string;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

const pillarIcons: Record<string, string> = {
  core: "⭐",
  chinese: "🇨🇳",
  athletics: "🏐",
  cooking: "🍳",
  finance: "💰",
  happiness: "📖",
};

export default function TaskCard({
  title,
  pillar,
  xpReward,
  difficulty,
  completed,
  onToggle,
  onDelete,
}: TaskCardProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-card)",
        padding: "14px",
        marginBottom: "12px",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggle}
        />

        <span
          style={{
            textDecoration: completed
              ? "line-through"
              : "none",
          }}
        >
          {pillarIcons[pillar]} {title}
        </span>
      </div>

      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          color: "var(--muted)",
        }}
      >
        {pillar} · {difficulty} · +{xpReward} XP

        <button
          style={{
            marginLeft: "10px",
          }}
          onClick={onDelete}
        >
          ✕
        </button>
      </div>
    </div>
  );
}