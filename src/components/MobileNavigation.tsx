import { NavLink } from "react-router-dom";
import NavigationIcon, { MomentumMark } from "./NavigationIcon";
import type { NavigationIconName } from "./NavigationIcon";
import "./mobile-navigation.css";

const primary: { to: string; label: string; icon: NavigationIconName }[] = [
  { to: "/", label: "Today", icon: "home" },
  { to: "/finance", label: "Finance", icon: "finance" },
  { to: "/athletics", label: "Athletics", icon: "athletics" },
  { to: "/cooking", label: "Cooking", icon: "cooking" },
  { to: "/chinese", label: "Chinese", icon: "chinese" },
  { to: "/journal", label: "Library", icon: "journal" },
];

export default function MobileNavigation() {
  return <>
    <header className="mobile-header">
      <div><NavLink to="/" aria-label="Momentum Home"><MomentumMark /><span>Momentum</span></NavLink><small>On this device · not synced</small></div>
      <nav aria-label="Other pages">
        <NavLink to="/planner">Planner</NavLink>
        <NavLink to="/progress">Progress</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </header>
    <nav className="mobile-tabs" aria-label="Mobile navigation">
      {primary.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"}><NavigationIcon name={item.icon} /><span>{item.label}</span></NavLink>)}
    </nav>
  </>;
}
