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
        className="momentum-polyhedron-shell"
        d="m16 3 11 6.5v13L16 29 5 22.5v-13L16 3Z"
      />
      <path
        className="momentum-polyhedron-facet momentum-polyhedron-facet-strong"
        d="m16 3 1 5.5-12 1L16 3Z"
      />
      <path
        className="momentum-polyhedron-facet momentum-polyhedron-facet-soft"
        d="m16 3 11 6.5-10-1L16 3Z"
      />
      <path
        className="momentum-polyhedron-facet momentum-polyhedron-facet-soft"
        d="m5 9.5 12-1L10 21 5 9.5Z"
      />
      <path
        className="momentum-polyhedron-facet momentum-polyhedron-facet-medium"
        d="m17 8.5 10 1-5 11.5-5-12.5Z"
      />
      <path
        className="momentum-polyhedron-facet momentum-polyhedron-facet-strong"
        d="m10 21 12-.1L16 29l-6-8Z"
      />
      <path
        className="momentum-polyhedron-facet momentum-polyhedron-facet-faint"
        d="M5 22.5 10 21l6 8-11-6.5ZM22 21l5 1.5L16 29l6-8Z"
      />
      <path
        className="momentum-polyhedron-line"
        d="M16 3 5 9.5v13L16 29l11-6.5v-13L16 3Zm0 0 1 5.5M5 9.5l12-1 10 1M5 22.5l5-1.5h12l5 1.5M17 8.5 10 21l6 8M17 8.5 22 21l-6 8"
      />
      <g className="momentum-polyhedron-nodes">
        <circle cx="16" cy="3" r="1.5" />
        <circle cx="5" cy="9.5" r="1.5" />
        <circle cx="27" cy="9.5" r="1.5" />
        <circle cx="5" cy="22.5" r="1.5" />
        <circle cx="27" cy="22.5" r="1.5" />
        <circle cx="16" cy="29" r="1.5" />
        <circle cx="17" cy="8.5" r="1.2" />
        <circle cx="10" cy="21" r="1.2" />
        <circle cx="22" cy="21" r="1.2" />
      </g>
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
        <g className="nav-icon-line">
          <path d="m4.8 14.3 11.1-8.5 11.3 8.5" />
          <path d="M7.2 12.6v13.1h17.6V12.6M13 25.7v-8.4h6v8.4" />
          <path d="M21.6 9.9v-3h2.8V12" />
        </g>
      )}

      {name === "planner" && (
        <g className="nav-icon-line">
          <rect x="4.8" y="7.1" width="22.4" height="19.2" rx="3.2" />
          <path d="M10 4.8v4.5M22 4.8v4.5M4.8 12h22.4M10 16.4h3M18.8 16.4h3M10 21h3M18.8 21h3" />
        </g>
      )}

      {name === "chinese" && (
        <text className="nav-icon-glyph" x="2.6" y="20.6">
          中文
        </text>
      )}

      {name === "athletics" && (
        <g className="nav-icon-line nav-icon-line-athletics">
          <path d="M9.3 16h13.4M4.8 11.5v9M8 9.2v13.6M27.2 11.5v9M24 9.2v13.6" />
          <path d="M2.7 13.2v5.6M29.3 13.2v5.6" />
        </g>
      )}

      {name === "cooking" && (
        <g className="nav-icon-line nav-icon-line-cooking">
          <ellipse cx="13.4" cy="18.4" rx="8.7" ry="6.3" />
          <path d="m21.7 16.5 7.4-3.8 1.2 2.5-8.2 3.4M8.4 18c.3-3 2.9-5 5.8-4.7 2.5.2 4.2 1.7 3.8 3.8-.3 2.2-2.3 3.8-5 4-2.7.1-4.8-1.2-4.6-3.1ZM11 17l2.3 1.5m1.5-2.3 2 1.2M10.2 8.8c-1.1-1.6-.8-3 .7-4.2M15.6 9.2c-1.1-1.7-.7-3.2.8-4.4" />
        </g>
      )}

      {name === "finance" && (
        <g className="nav-icon-line nav-icon-line-finance">
          <path d="M5.5 6v20.5H27" />
          <path d="m8.5 22.5 5-5.5 4 2.4L26 9" />
          <path d="M21.8 9H26v4.2" />
        </g>
      )}

      {name === "journal" && (
        <g className="nav-icon-line">
          <path d="M4.5 7.2c4.4-.8 8.2.1 11.5 2.7v16.4c-3.7-2.3-7.5-3.2-11.5-2.3V7.2ZM27.5 7.2c-4.4-.8-8.2.1-11.5 2.7v16.4c3.7-2.3 7.5-3.2 11.5-2.3V7.2ZM16 9.9v16.4" />
          <path d="M8 13c1.7 0 3.2.4 4.6 1.2M19.4 14.2A11 11 0 0 1 24 13M8 17.4c1.7 0 3.2.4 4.6 1.2M19.4 18.6a11 11 0 0 1 4.6-1.2" />
        </g>
      )}

      {name === "settings" && (
        <g className="nav-icon-line nav-icon-line-settings">
          <path d="m13.3 3.8-.8 3.4a9.4 9.4 0 0 0-2.5 1.5L6.6 7.6 4 12l2.7 2.3a9.6 9.6 0 0 0 0 3.3L4 20l2.6 4.4 3.4-1.1a9.4 9.4 0 0 0 2.5 1.5l.8 3.4h5.4l.8-3.4a9.4 9.4 0 0 0 2.5-1.5l3.4 1.1L28 20l-2.7-2.4a9.6 9.6 0 0 0 0-3.3L28 12l-2.6-4.4L22 8.7a9.4 9.4 0 0 0-2.5-1.5l-.8-3.4h-5.4Z" />
          <circle cx="16" cy="16" r="3.5" />
        </g>
      )}
    </svg>
  );
}
