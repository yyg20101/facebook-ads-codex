import { ChevronLeft, ChevronRight, Waypoints } from "lucide-react";
import { NavLink } from "../../router";
import { navigationItems } from "./navigation";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden="true">
          <Waypoints size={24} />
        </span>
        <span className="sidebar__brand-label">广告运营台</span>
      </div>
      <nav aria-label="产品一级导航" className="sidebar__nav">
        {navigationItems.map(({ href, icon: Icon, label }) => (
          <NavLink
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
            key={href}
            to={href}
            title={collapsed ? label : undefined}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
        className="sidebar__collapse"
        onClick={onToggle}
        type="button"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        <span>{collapsed ? "展开" : "收起"}</span>
      </button>
    </aside>
  );
}
