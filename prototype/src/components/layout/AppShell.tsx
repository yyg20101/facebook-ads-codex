import { type PropsWithChildren, useState } from "react";
import { ContextBar } from "./ContextBar";
import { MobileHeader, MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TrustBanner } from "./TrustBanner";

export function AppShell({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <MobileHeader />
      <div className="app-shell__workspace">
        <TrustBanner />
        <ContextBar />
        <main className="app-shell__main">{children}</main>
        <footer className="app-footer">
          <span>时区：Asia/Shanghai</span>
          <span>所有数据均为原型数据，仅供产品演示</span>
          <span>不会执行任何外部系统写入操作</span>
        </footer>
      </div>
      <MobileNav />
    </div>
  );
}
