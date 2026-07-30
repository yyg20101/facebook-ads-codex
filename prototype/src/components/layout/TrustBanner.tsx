import { Info } from "lucide-react";

export function TrustBanner() {
  return (
    <div className="trust-banner" role="note">
      <Info aria-hidden="true" size={16} />
      <span className="trust-banner__desktop">
        原型数据 · 未连接 Meta · 不会执行外部写入
      </span>
      <span className="trust-banner__mobile">原型数据 · 未连接 Meta</span>
    </div>
  );
}
