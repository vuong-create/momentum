import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { NavLink, useLocation } from "react-router-dom";

import useExperience from "../experience/useExperience";
import { moveNavigationItem, navigationOrderKey, readNavigationOrder } from "./navigationOrder";
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
  const [order, setOrder] = useState(readNavigationOrder);
  const [dragged, setDragged] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const orderedNavigation = order.map((path) => navigation.find((item) => item.to === path)!);
  const location = useLocation();
  const experience = useExperience();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const activeIndex = orderedNavigation.findIndex((item) =>
    isItemActive(location.pathname, item)
  );
  const activeItem = orderedNavigation[activeIndex];
  const hoveredItem = hoveredIndex === null ? null : orderedNavigation[hoveredIndex];
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
    if (dragged || !experience.motionEnabled || event.pointerType === "touch") return;

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

  function reorder(from: string, to: string) {
    const next = moveNavigationItem(order, from, to);
    setOrder(next);
    setHoveredIndex(null);
    resetMagneticItems();
    const label = navigation.find((item) => item.to === from)?.label;
    let message = `${label} moved to position ${next.indexOf(from) + 1}.`;
    try { localStorage.setItem(navigationOrderKey, JSON.stringify(next)); }
    catch { message += " Order could not be saved for next time."; }
    setAnnouncement(message);
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

          {orderedNavigation.map((item, index) => (
            <div
              className={`dock-item-slot${index === 2 ? " has-divider" : ""}${dropTarget === item.to ? " is-drop-target" : ""}${dragged === item.to ? " is-dragging" : ""}`}
              key={item.to}
              onDragOver={(event) => { if (dragged && dragged !== item.to) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(item.to); } }}
              onDrop={(event) => { if (!dragged) return; event.preventDefault(); reorder(dragged, item.to); setDragged(null); setDropTarget(null); }}
            >
              {index === 2 && <span className="dock-divider" aria-hidden="true" />}
              <NavLink
                ref={(node) => { itemRefs.current[index] = node; }}
                to={item.to}
                end={item.end}
                aria-label={item.label}
                title={`${item.label} — drag to reorder, or use Alt + Arrow Up / Down`}
                draggable
                onDragStart={(event) => { setDragged(item.to); setHoveredIndex(null); resetMagneticItems(); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", item.to); }}
                onDragEnd={() => { setDragged(null); setDropTarget(null); }}
                onKeyDown={(event) => {
                  if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
                  event.preventDefault();
                  const target = order[index + (event.key === "ArrowUp" ? -1 : 1)];
                  if (target) reorder(item.to, target);
                }}
                onPointerEnter={() => setHoveredIndex(index)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                onClick={(event) => { if (dragged) event.preventDefault(); else playNavigationFeedback(); }}
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
        <span className="dock-reorder-status" role="status">{announcement}</span>

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
