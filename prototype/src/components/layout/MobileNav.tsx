import { MoreHorizontal, Waypoints, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "../../router";
import { navigationItems } from "./navigation";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-header__brand">
          <Waypoints aria-hidden="true" size={23} />
          <span>广告运营台</span>
        </div>
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
          className="mobile-header__menu"
          onClick={() => setMenuOpen((value) => !value)}
          type="button"
        >
          {menuOpen ? <X size={22} /> : <MoreHorizontal size={24} />}
        </button>
      </header>
      {menuOpen ? (
        <nav aria-label="移动端完整导航" className="mobile-drawer">
          {navigationItems.map(({ href, icon: Icon, label }) => (
            <NavLink
              className={({ isActive }) =>
                `mobile-drawer__link ${isActive ? "mobile-drawer__link--active" : ""}`
              }
              key={href}
              onClick={() => setMenuOpen(false)}
              to={href}
            >
              <Icon aria-hidden="true" size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </>
  );
}

export function MobileNav() {
  const primaryItems = navigationItems.filter((item) =>
    ["/overview", "/assets", "/manage", "/analytics", "/governance"].includes(
      item.href,
    ),
  );

  return (
    <nav aria-label="移动端主导航" className="mobile-nav">
      {primaryItems.map(({ href, icon: Icon, shortLabel }) => (
        <NavLink
          className={({ isActive }) =>
            `mobile-nav__link ${isActive ? "mobile-nav__link--active" : ""}`
          }
          key={href}
          to={href}
        >
          <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
          <span>{shortLabel}</span>
        </NavLink>
      ))}
    </nav>
  );
}
