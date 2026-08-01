type CardProps = {
  title?: string;
  children: React.ReactNode;
};

export default function Card({
  title,
  children,
}: CardProps) {
  return (
    <section
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-card)",
        padding: "24px",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
      }}
    >
      {title && (
        <h2
          style={{
            marginTop: 0,
          }}
        >
          {title}
        </h2>
      )}

      {children}
    </section>
  );
}