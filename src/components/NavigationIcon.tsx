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
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 17.5V6.5l7.5 7 7.5-7v11" />
      <path d="M8 10.1 12 6l4 4.1" />
    </svg>
  );
}

export default function NavigationIcon({ name }: NavigationIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === "home" && (
        <>
          <path d="m4.5 10.4 7.5-6 7.5 6" />
          <path d="M6.7 9.2v10h10.6v-10M10 19.2v-5.5h4v5.5" />
        </>
      )}

      {name === "planner" && (
        <>
          <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
          <path d="M8 3.8v3.4M16 3.8v3.4M4 9.5h16" />
          <path d="M8 13h2M14 13h2M8 16.5h2M14 16.5h2" />
        </>
      )}

      {name === "chinese" && (
        <>
          <path d="M5.2 7.2h13.6M12 4.3v15.4" />
          <path d="M7.4 10.1c.7 4 3 7 7.9 9.2M16.7 10.1c-.7 4-3 7-7.9 9.2" />
        </>
      )}

      {name === "athletics" && (
        <>
          <circle cx="12" cy="12" r="4.4" />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2" />
          <path d="m6 6 1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
        </>
      )}

      {name === "cooking" && (
        <>
          <path d="M4.5 11.2h15c-.4 4.8-2.8 7.2-7.5 7.2s-7.1-2.4-7.5-7.2Z" />
          <path d="M7.5 20h9M8.2 8.4 14.8 3M12 9.1l6.4-5.2" />
        </>
      )}

      {name === "finance" && (
        <>
          <path d="M5 19.5V5.2M5 19.5h14" />
          <path d="m7.8 15.7 3.1-3.3 2.6 1.8 4.1-5" />
          <path d="M14.8 9.2h2.8V12" />
        </>
      )}

      {name === "journal" && (
        <>
          <path d="m12 4.1 6.7 6.7-7.9 7.9-5.5.8.8-5.5L12 4.1Z" />
          <path d="m6.1 14 4.7 4.7M12 4.1l-1.2 8.2M18.7 10.8l-8.2 1.2" />
        </>
      )}

      {name === "settings" && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.8v2M12 18.2v2M3.8 12h2M18.2 12h2" />
          <path d="m6.2 6.2 1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4" />
        </>
      )}
    </svg>
  );
}
