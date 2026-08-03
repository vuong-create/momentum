export type NavigationIconName =
  | "home"
  | "planner"
  | "chinese"
  | "athletics"
  | "cooking"
  | "finance"
  | "journal"
  | "settings";

type NavigationIconProps = {
  name: NavigationIconName;
};

export function MomentumMark() {
  return (
    <svg
      className="momentum-mark"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="momentum-mark-enamel"
        d="M16 3.2 19.5 11l8 3.2-7.9 3.4L16 28.8l-3.8-11.1-7.7-3.5 7.9-3.1L16 3.2Z"
      />
      <path className="momentum-mark-shine" d="m10.1 13.1 3.2-1.3L16 6.4" />
      <path className="momentum-mark-letter" d="m10.8 18.1 1-5 4.2 4.2 4.2-4.2 1 5" />
    </svg>
  );
}

export default function NavigationIcon({ name }: NavigationIconProps) {
  return (
    <svg
      className="navigation-illustration"
      data-icon={name}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {name === "home" && (
        <>
          <circle className="nav-icon-accent" cx="23.3" cy="8.3" r="3.5" />
          <path
            className="nav-icon-paper"
            d="M5.2 15.2 15.7 6.6l10.9 8.6-1.8 2.2-1.7-1.3v10H8.3v-10l-1.6 1.3-1.5-2.2Z"
          />
          <path className="nav-icon-warm" d="M11 15.2h9.8v10.9H11z" />
          <path className="nav-icon-accent" d="M13.7 18.3h4.5v7.8h-4.5z" />
          <path className="nav-icon-ink-line" d="M5.2 15.2 15.7 6.6l10.9 8.6M8.3 14.5v11.6h14.8V14.5M11 15.2h9.8M13.7 26.1v-7.8h4.5v7.8" />
          <path className="nav-icon-highlight" d="m9.3 13.2 6.4-5.1" />
        </>
      )}

      {name === "planner" && (
        <>
          <path className="nav-icon-paper" d="M4.4 8.7c4.3-.9 8-.1 11.5 2.2v15.2c-3.6-2.2-7.3-3-11.5-2V8.7Z" />
          <path className="nav-icon-paper" d="M27.6 8.7c-4.3-.9-8-.1-11.7 2.2v15.2c3.7-2.2 7.5-3 11.7-2V8.7Z" />
          <path className="nav-icon-accent" d="M6.8 6.4h4v4.1H6.8zM21.1 6.4h4v3.8h-4z" />
          <path className="nav-icon-warm" d="m22.7 17.1 4.9 4.8-1.7 1.7-4.9-4.9-.7-2.3 2.4.7Z" />
          <path className="nav-icon-ink-line" d="M4.4 8.7c4.3-.9 8-.1 11.5 2.2v15.2c-3.6-2.2-7.3-3-11.5-2V8.7ZM27.6 8.7c-4.3-.9-8-.1-11.7 2.2v15.2c3.7-2.2 7.5-3 11.7-2V8.7ZM15.9 10.9v15.2" />
          <path className="nav-icon-detail" d="M7.1 14c2-.2 3.7.2 5.4 1M7.1 17.9c1.7-.1 3.4.2 4.8.9M19.4 14.7c1.7-.7 3.4-1 5.4-.8" />
          <path className="nav-icon-ink-line" d="m20.3 16.4 2.4.7 4.9 4.8-1.7 1.7-4.9-4.9-.7-2.3Z" />
        </>
      )}

      {name === "chinese" && (
        <>
          <path className="nav-icon-warm" d="m7 7.7 15-2.3 2.4 16-15 2.3-2.4-16Z" />
          <path className="nav-icon-paper" d="M5.3 10.8 20.8 8l2.6 15.3-15.5 2.8-2.6-15.3Z" />
          <path className="nav-icon-accent" d="m17.3 18.3 3.3-.6.6 3.3-3.3.6-.6-3.3Z" />
          <path className="nav-icon-ink-line" d="m7 7.7 15-2.3 2.4 16-2.2.4M5.3 10.8 20.8 8l2.6 15.3-15.5 2.8-2.6-15.3Z" />
          <path className="nav-icon-detail" d="m9.3 15 8.2-1.5M13 11.9l1.9 10.6M10.2 17.4c1.7 2.2 4.3 3.4 7.8 3.7M17.7 15.2c-.7 3-2.5 5.3-5.4 7" />
        </>
      )}

      {name === "athletics" && (
        <>
          <path className="nav-icon-paper" d="M5.2 18.5c3.8 0 6.5-2.1 8.4-6.4l3.5 1.4c.1 3.6 2.3 5.4 6.6 5.5 2.2.1 3.7 1 4.3 2.7-.4 2.5-2.7 3.8-6.9 3.8H8.3c-3 0-4.4-1.2-4.3-3.6.1-1.3.5-2.5 1.2-3.4Z" />
          <path className="nav-icon-accent" d="M4.2 21.4c5.5 1.1 12.9 1.3 22.3.5.6.5.8 1.1.5 1.7-1.1 1.3-3.2 1.9-6.2 1.9H8.2c-2.7 0-4-1-4-3v-1.1Z" />
          <path className="nav-icon-warm" d="m13.6 12.1 3.5 1.4c.1 1.5.5 2.7 1.2 3.5l-5.5.2-2.2-1.4c1.2-.9 2.2-2.1 3-3.7Z" />
          <path className="nav-icon-ink-line" d="M5.2 18.5c3.8 0 6.5-2.1 8.4-6.4l3.5 1.4c.1 3.6 2.3 5.4 6.6 5.5 2.2.1 3.7 1 4.3 2.7-.4 2.5-2.7 3.8-6.9 3.8H8.3c-3 0-4.4-1.2-4.3-3.6.1-1.3.5-2.5 1.2-3.4Z" />
          <path className="nav-icon-detail" d="m11.3 15.1 5.1 2.2M9.4 17l4.5 2M5.1 21.1c5.8 1.3 13.4 1.5 22.2.5" />
          <path className="nav-icon-highlight" d="M7 18.4c1.3-.3 2.4-.8 3.4-1.6" />
        </>
      )}

      {name === "cooking" && (
        <>
          <ellipse className="nav-icon-paper" cx="16" cy="18.2" rx="12.3" ry="8.2" />
          <path className="nav-icon-warm" d="M7.1 17.8c.3-4.8 4.7-8.6 10-8.6 4 0 7.5 2.1 8.1 5.4.7 3.9-2.7 7.5-7.9 8.5-4.7.9-9.3-1.4-10.2-5.3Z" />
          <path className="nav-icon-accent" d="M9.4 17.2c.3-3.4 3.6-6 7.5-6 3.1 0 5.6 1.5 6.1 3.8.5 2.7-2 5.3-5.9 6-3.6.7-7-1-7.7-3.8Z" />
          <path className="nav-icon-paper" d="M12.6 15c.2-1.3 1.6-2.2 3.2-2 1.3.1 2.3.9 2.2 1.8-.1 1.1-1.4 2-2.9 2-1.5 0-2.6-.8-2.5-1.8Z" />
          <ellipse className="nav-icon-ink-line" cx="16" cy="18.2" rx="12.3" ry="8.2" />
          <path className="nav-icon-ink-line" d="M7.1 17.8c.3-4.8 4.7-8.6 10-8.6 4 0 7.5 2.1 8.1 5.4.7 3.9-2.7 7.5-7.9 8.5-4.7.9-9.3-1.4-10.2-5.3ZM12.6 15c.2-1.3 1.6-2.2 3.2-2 1.3.1 2.3.9 2.2 1.8-.1 1.1-1.4 2-2.9 2-1.5 0-2.6-.8-2.5-1.8Z" />
          <path className="nav-icon-detail" d="m11 18.3 2.5 1.6m2-1.1 2.4 1.5m2.2-3.3 2.2 1.1" />
          <path className="nav-icon-highlight" d="M9.2 14.8c1.2-2.1 3.4-3.5 6-4" />
        </>
      )}

      {name === "finance" && (
        <>
          <path className="nav-icon-paper" d="M5.2 8.4h13.4v17.2H5.2z" />
          <path className="nav-icon-warm" d="M7.6 5.7H21v17.2h-2.4V8.4h-11V5.7Z" />
          <ellipse className="nav-icon-accent" cx="22.4" cy="21.7" rx="5.5" ry="2.6" />
          <path className="nav-icon-accent" d="M16.9 17.7h11v4h-11z" />
          <path className="nav-icon-ink-line" d="M5.2 8.4h13.4v17.2H5.2zM7.6 8.4V5.7H21v11.7" />
          <path className="nav-icon-detail" d="M8.3 12.5h7.1M8.3 16.1h5.1M8.3 19.7h3.4" />
          <ellipse className="nav-icon-ink-line" cx="22.4" cy="17.7" rx="5.5" ry="2.6" />
          <path className="nav-icon-ink-line" d="M16.9 17.7v4c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-4" />
          <path className="nav-icon-highlight" d="M19.3 16.9c1.7-.7 4.2-.8 6.1-.1" />
        </>
      )}

      {name === "journal" && (
        <>
          <path className="nav-icon-warm" d="m7.2 5.6 15.2-1 1.3 20.8-15.2 1-1.3-20.8Z" />
          <path className="nav-icon-paper" d="M5.3 6.9h15.4v20H5.3z" />
          <path className="nav-icon-accent" d="m16.8 21.8 7.5-11.9 2.7 1.7-7.5 11.9-3.8 2.5 1.1-4.2Z" />
          <path className="nav-icon-ink-line" d="M5.3 6.9h15.4v20H5.3zM8.2 5.6V4.4h14.2l1 4.2" />
          <path className="nav-icon-detail" d="M9 11.4h7.9M9 15h7.9M9 18.6h5.2" />
          <path className="nav-icon-ink-line" d="m16.8 21.8 7.5-11.9 2.7 1.7-7.5 11.9-3.8 2.5 1.1-4.2Z" />
          <path className="nav-icon-highlight" d="m24.3 12.2 1.3.8" />
        </>
      )}

      {name === "settings" && (
        <>
          <circle className="nav-icon-paper" cx="16" cy="16" r="10.8" />
          <circle className="nav-icon-warm" cx="16" cy="16" r="6.7" />
          <circle className="nav-icon-accent" cx="16" cy="16" r="3.4" />
          <path className="nav-icon-ink-line" d="M16 5.2a10.8 10.8 0 1 1 0 21.6 10.8 10.8 0 0 1 0-21.6Zm0 7.4a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Z" />
          <path className="nav-icon-detail" d="M16 5.2v3M16 23.8v3M5.2 16h3M23.8 16h3M8.4 8.4l2.1 2.1M21.5 21.5l2.1 2.1M23.6 8.4l-2.1 2.1M10.5 21.5l-2.1 2.1" />
          <path className="nav-icon-highlight" d="M10.3 9.6a8.1 8.1 0 0 1 7.9-1.4" />
        </>
      )}
    </svg>
  );
}
