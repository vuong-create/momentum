import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { NavLink, useLocation } from "react-router-dom";

import useExperience from "../experience/useExperience";
import NavigationIcon, {
  MomentumMark,
  type NavigationIconName,
} from "./NavigationIcon";

type NavigationItem = {
  to: string;
  label: string;
  icon: NavigationIconName;
  end?: boolean;
  pillarClass?: string;
  dividerBefore?: boolean;
};

const navigation: NavigationItem[] = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/planner", label: "Planner", icon: "planner" },
  {
    to: "/chinese",
    label: "Chinese",
    icon: "chinese",
    pillarClass: "pillar-chinese",
    dividerBefore: true,
  },
  {
    to: "/athletics",
    label: "Athletics",
    icon: "athletics",
    pillarClass: "pillar-athletics",
  },
  {
    to: "/cooking",
    label: "Cooking",
    icon: "cooking",
    pillarClass: "pillar-cooking",
  },
  {
    to: "/finance",
    label: "Finance",
    icon: "finance",
    pillarClass: "pillar-finance",
  },
  {
    to: "/journal",
    label: "Library",
    icon: "journal",
    pillarClass: "pillar-happiness",
  },
];

const itemPositions = [0, 53, 126, 179, 232, 285, 338];

function isItemActive(pathname: string, item: NavigationItem) {
  return item.end
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export default function Navigation() {
  const location = useLocation();
  const experience = useExperience();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const activeIndex = navigation.findIndex((item) =>
    isItemActive(location.pathname, item)
  );
  const activeItem = navigation[activeIndex];
  const hoveredItem = hoveredIndex === null ? null : navigation[hoveredIndex];
  const navigationStyle = {
    "--rail-active-y": `${itemPositions[Math.max(activeIndex, 0)]}px`,
    "--rail-hover-y": `${itemPositions[hoveredIndex ?? 0]}px`,
  } as CSSProperties;

  function resetMagneticItems() {
    itemRefs.current.forEach((item) => {
      item?.style.removeProperty("--magnetic-x");
      item?.style.removeProperty("--magnetic-scale");
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!experience.motionEnabled || event.pointerType === "touch") return;

    itemRefs.current.forEach((item) => {
      if (!item) return;
      const bounds = item.getBoundingClientRect();
      const distance = Math.abs(event.clientY - (bounds.top + bounds.height / 2));
      const influence = Math.max(0, 1 - distance / 84);

      item.style.setProperty("--magnetic-x", `${(influence * 4).toFixed(2)}px`);
      item.style.setProperty("--magnetic-scale", (1 + influence * 0.075).toFixed(3));
    });
  }

  function handleNavigationLeave() {
    setHoveredIndex(null);
    resetMagneticItems();
  }

  function playNavigationFeedback() {
    experience.playFeedback("navigation");
  }

  return (
    <aside className="momentum-dock-shell">
      <div className="momentum-dock">
        <NavLink
          to="/"
          className="dock-wordmark"
          aria-label="Momentum Home"
          onClick={playNavigationFeedback}
        >
          <MomentumMark />
          <span className="dock-wordmark-aura" aria-hidden="true" />
        </NavLink>

        <nav
          className="dock-navigation"
          aria-label="Main navigation"
          style={navigationStyle}
          onPointerMove={handlePointerMove}
          onPointerLeave={handleNavigationLeave}
        >
          {activeIndex >= 0 && (
            <span
              className={["dock-active-lens", activeItem?.pillarClass ?? ""]
                .filter(Boolean)
                .join(" ")}
              aria-hidden="true"
            />
          )}
          <span
            className={[
              "dock-hover-lens",
              hoveredIndex === null ? "" : "is-visible",
              hoveredItem?.pillarClass ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          />

          {navigation.map((item, index) => (
            <div
              className={`dock-item-slot${item.dividerBefore ? " has-divider" : ""}`}
              key={item.to}
            >
              {item.dividerBefore && <span className="dock-divider" aria-hidden="true" />}
              <NavLink
                ref={(node) => { itemRefs.current[index] = node; }}
                to={item.to}
                end={item.end}
                aria-label={item.label}
                onPointerEnter={() => setHoveredIndex(index)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                onClick={playNavigationFeedback}
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
                <span className="dock-item-icon-shell">
                  <NavigationIcon name={item.icon} />
                </span>
                <span className="dock-item-label">{item.label}</span>
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="dock-footer">
          <NavLink
            to="/settings"
            aria-label="Settings"
            onClick={playNavigationFeedback}
            className={({ isActive }) =>
              ["dock-item", "dock-settings", isActive ? "dock-item-active" : ""]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span className="dock-item-icon-shell">
              <NavigationIcon name="settings" />
            </span>
            <span className="dock-item-label">Settings</span>
          </NavLink>

          <span
            className={`dock-presence dock-presence-${experience.period}`}
            role="status"
            aria-label={`${experience.ambience.label} ambience`}
          >
            <span className="dock-presence-orb" />
            <span className="dock-presence-ring" aria-hidden="true" />
          </span>
        </div>
      </div>
    </aside>
  );
}
