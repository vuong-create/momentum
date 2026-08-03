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
      <path className="momentum-mark-trail" d="M3.7 11.2h5.1M2.7 16h5.2M4.2 20.8h4" />
      <path
        className="momentum-mark-ribbon"
        d="m8.9 24 2.7-15.8 5 7.5 4.7-7L24.6 24H21l-1.5-7.4-2.9 4.3-3-4.4-1.2 7.5H8.9Z"
      />
      <path className="momentum-mark-highlight" d="m12.4 10.6 4.2 6.2 3.8-5.7" />
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
          <path className="nav-icon-paper" d="M6.2 13.6h19.6v12.8H6.2z" />
          <path className="nav-icon-warm" d="M4.1 11.2c6.2-2.6 17.6-2.6 23.8 0l-1.2 3.4H5.3l-1.2-3.4Z" />
          <path className="nav-icon-accent" d="M10.8 14.4h10.4v6.8H10.8z" />
          <path className="nav-icon-ink-line" d="M4.1 11.2c6.2-2.6 17.6-2.6 23.8 0l-1.2 3.4H5.3l-1.2-3.4ZM6.2 14.6v11.8h19.6V14.6" />
          <path className="nav-icon-detail" d="m7.5 10.3.8 4.3m4.3-5.3.3 5.3m6.5-5.3-.3 5.3m5.4-4.3-.8 4.3M10.8 14.4v6.8h10.4v-6.8M16 14.4v6.8M8.1 17h2.7M8.1 20h2.7M21.2 17h2.7M21.2 20h2.7M9.4 15.6v9.3M22.6 15.6v9.3" />
          <circle className="nav-icon-highlight" cx="16" cy="17.5" r="1.15" />
        </>
      )}

      {name === "planner" && (
        <>
          <path className="nav-icon-paper" d="M4.8 8.8c4.1-.7 7.8.1 11.2 2.3v15c-3.5-2.2-7.2-3-11.2-2.2V8.8Z" />
          <path className="nav-icon-paper" d="M27.2 8.8c-4.1-.7-7.8.1-11.2 2.3v15c3.5-2.2 7.2-3 11.2-2.2V8.8Z" />
          <path className="nav-icon-accent" d="M7.1 6.2h3.4v3.6H7.1zM14.3 7.4h3.4v3.1h-3.4zM21.5 6.2h3.4v3.6h-3.4z" />
          <path className="nav-icon-ink-line" d="M4.8 8.8c4.1-.7 7.8.1 11.2 2.3v15c-3.5-2.2-7.2-3-11.2-2.2V8.8ZM27.2 8.8c-4.1-.7-7.8.1-11.2 2.3v15c3.5-2.2 7.2-3 11.2-2.2V8.8ZM16 11.1v15" />
          <path className="nav-icon-detail" d="M7.5 14.2c1.9-.1 3.6.3 5.3 1M7.5 18.1c1.7-.1 3.3.2 4.8.9M19.2 15.2c1.7-.7 3.4-1.1 5.3-1M19.7 18.9c1.5-.6 3-.9 4.8-.8" />
        </>
      )}

      {name === "chinese" && (
        <>
          <path className="nav-icon-warm" d="M12.2 4.7h7.6l1.3 6.8H10.9l1.3-6.8Z" />
          <path className="nav-icon-paper" d="M7.4 11.5h17.2v15H7.4z" />
          <path className="nav-icon-accent" d="M9.8 13.9h12.4v10.2H9.8z" />
          <path className="nav-icon-ink-line" d="M12.2 4.7h7.6l1.3 6.8M7.4 11.5h17.2v15H7.4zM16 14.8v8.5M12.3 16.3h7.4v5.4h-7.4z" />
          <path className="nav-icon-highlight" d="M13.4 6.2h4.9" />
        </>
      )}

      {name === "athletics" && (
        <g transform="rotate(-6 16 16)">
          <path className="nav-icon-paper" d="M9.2 14.6h13.6v2.8H9.2z" />
          <path className="nav-icon-warm" d="M3.2 11h3.7v10H3.2c-.8 0-1.4-.6-1.4-1.4v-7.2c0-.8.6-1.4 1.4-1.4ZM28.8 11h-3.7v10h3.7c.8 0 1.4-.6 1.4-1.4v-7.2c0-.8-.6-1.4-1.4-1.4Z" />
          <path className="nav-icon-accent" d="M6.9 8.8h3.3v14.4H6.9zM25.1 8.8h-3.3v14.4h3.3z" />
          <path className="nav-icon-ink-line" d="M3.2 11h3.7V8.8h3.3v5.8h11.6V8.8h3.3V11h3.7c.8 0 1.4.6 1.4 1.4v7.2c0 .8-.6 1.4-1.4 1.4h-3.7v2.2h-3.3v-5.8H10.2v5.8H6.9V21H3.2c-.8 0-1.4-.6-1.4-1.4v-7.2c0-.8.6-1.4 1.4-1.4Z" />
          <path className="nav-icon-highlight" d="M3.5 12.8v5.5M8.5 10.6v7.3" />
        </g>
      )}

      {name === "cooking" && (
        <>
          <path className="nav-icon-warm" d="M5.2 17.4C5.5 11.1 11 6.8 17.6 7.3c5.8.4 9.7 3.8 9.1 8.7-.5 4.8-5 8.5-10.8 8.8-6 .3-10.9-2.9-10.7-7.4Z" />
          <path className="nav-icon-accent" d="M8.1 17c.3-4.6 4.4-7.7 9.2-7.4 4.3.4 7 2.7 6.6 6.2-.4 3.5-3.7 6.2-8 6.4-4.5.2-8-2.1-7.8-5.2Z" />
          <path className="nav-icon-paper" d="M12.1 14.5c.2-1.6 1.8-2.7 3.7-2.6 1.5.1 2.7 1 2.5 2.1-.1 1.4-1.6 2.4-3.3 2.5-1.8 0-3.1-.8-2.9-2Z" />
          <path className="nav-icon-ink-line" d="M5.2 17.4C5.5 11.1 11 6.8 17.6 7.3c5.8.4 9.7 3.8 9.1 8.7-.5 4.8-5 8.5-10.8 8.8-6 .3-10.9-2.9-10.7-7.4ZM12.1 14.5c.2-1.6 1.8-2.7 3.7-2.6 1.5.1 2.7 1 2.5 2.1-.1 1.4-1.6 2.4-3.3 2.5-1.8 0-3.1-.8-2.9-2Z" />
          <path className="nav-icon-detail" d="m10.2 18.1 3.1 1.9m2.6-1.8 3 1.8m1.5-4.3 2.8 1.5" />
          <path className="nav-icon-highlight" d="M8.5 14.2c1.3-2.4 3.7-4 6.6-4.6" />
        </>
      )}

      {name === "finance" && (
        <>
          <path className="nav-icon-warm" d="m7.2 22.8 5-5.1 4.3 2.5 8.3-10.3v12.9H7.2Z" />
          <path className="nav-icon-ink-line" d="M5.1 5.6v20.8h21.8M7.2 22.8l5-5.1 4.3 2.5 8.3-10.3" />
          <path className="nav-icon-accent" d="M9.1 22.8a1.9 1.9 0 1 1-3.8 0 1.9 1.9 0 0 1 3.8 0ZM14.1 17.7a1.9 1.9 0 1 1-3.8 0 1.9 1.9 0 0 1 3.8 0ZM18.4 20.2a1.9 1.9 0 1 1-3.8 0 1.9 1.9 0 0 1 3.8 0Z" />
          <path className="nav-icon-ink-line" d="M20.8 9.9h4v4" />
          <path className="nav-icon-highlight" d="m8.1 20.7 3.1-3.1" />
        </>
      )}

      {name === "journal" && (
        <>
          <path className="nav-icon-warm" d="M8.1 5.3h15.4l1.8 20.9H9.9L8.1 5.3Z" />
          <path className="nav-icon-paper" d="M5.6 6.6H21l1.7 20H7.3l-1.7-20Z" />
          <path className="nav-icon-accent" d="M16.5 6.6h3.1l.9 12-1.8-1.8-1.5 1.8-.7-12Z" />
          <path className="nav-icon-ink-line" d="M5.6 6.6H21l1.7 20H7.3l-1.7-20ZM8.1 5.3h15.4l1.8 20.9h-2.6M9.1 6.6l1.7 20" />
          <path className="nav-icon-detail" d="M12.2 11.4h3.5M12.5 14.9h3.5" />
          <path className="nav-icon-highlight" d="M7.4 8.5h1.2" />
        </>
      )}

      {name === "settings" && (
        <>
          <circle className="nav-icon-paper" cx="16" cy="16" r="10.8" />
          <circle className="nav-icon-warm" cx="16" cy="16" r="6.5" />
          <circle className="nav-icon-accent" cx="16" cy="16" r="3.2" />
          <path className="nav-icon-ink-line" d="M16 5.2a10.8 10.8 0 1 1 0 21.6 10.8 10.8 0 0 1 0-21.6Zm0 7.6a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Z" />
          <path className="nav-icon-detail" d="M16 5.2v2.7M16 24.1v2.7M5.2 16h2.7M24.1 16h2.7M8.4 8.4l1.9 1.9M21.7 21.7l1.9 1.9M23.6 8.4l-1.9 1.9M10.3 21.7l-1.9 1.9" />
          <path className="nav-icon-highlight" d="M10.2 9.6a8.4 8.4 0 0 1 7.8-1.5" />
        </>
      )}
    </svg>
  );
}
