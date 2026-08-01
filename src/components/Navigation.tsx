import { NavLink } from "react-router-dom";

const navigation = [
  {
    to: "/",
    label: "Home",
    icon: "⌂",
    end: true,
  },
  {
    to: "/planner",
    label: "Planner",
    icon: "☷",
  },
  {
    to: "/chinese",
    label: "Chinese",
    icon: "文",
    pillarClass: "pillar-chinese",
  },
  {
    to: "/athletics",
    label: "Athletics",
    icon: "●",
    pillarClass: "pillar-athletics",
  },
  {
    to: "/cooking",
    label: "Cooking",
    icon: "◉",
    pillarClass: "pillar-cooking",
  },
  {
    to: "/finance",
    label: "Finance",
    icon: "¥",
    pillarClass: "pillar-finance",
  },
  {
    to: "/journal",
    label: "Journal",
    icon: "✎",
    pillarClass: "pillar-journal",
  },
];

export default function Navigation() {
  return (
    <aside className="momentum-dock-shell">
      <div className="momentum-dock">
        <NavLink
          to="/"
          className="dock-wordmark"
          aria-label="Momentum Home"
        >
          <span
            className="dock-wordmark-ghost"
            aria-hidden="true"
          >
            Momentum
          </span>

          <span className="dock-wordmark-text">
            Momentum
          </span>

          <span className="dock-wordmark-compact">
            M
          </span>
        </NavLink>

        <nav
          className="dock-navigation"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              className={({ isActive }) =>
                [
                  "dock-item",
                  item.pillarClass ?? "",
                  isActive ? "dock-item-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <span
                className="dock-item-icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span className="dock-item-label">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="dock-footer">
          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              [
                "dock-item",
                isActive ? "dock-item-active" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span
              className="dock-item-icon"
              aria-hidden="true"
            >
              ⚙
            </span>

            <span className="dock-item-label">
              Settings
            </span>
          </NavLink>

          <span className="dock-status">
            <span className="dock-status-dot" />
            Local
          </span>
        </div>
      </div>
    </aside>
  );
}