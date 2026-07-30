import type { PropsWithChildren } from "react";
import type { Severity } from "../../types";

interface StatusProps extends PropsWithChildren {
  severity?: Severity;
  compact?: boolean;
}

export function Status({
  severity = "neutral",
  compact = false,
  children,
}: StatusProps) {
  return (
    <span
      className={`status status--${severity} ${compact ? "status--compact" : ""}`}
    >
      <span className="status__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export function severityForStatus(status: string): Severity {
  if (
    status.includes("失败") ||
    status.includes("BLOCKER") ||
    status === "HIGH"
  ) {
    return "critical";
  }

  if (status.includes("警告") || status === "准备中") {
    return "warning";
  }

  if (
    status.includes("投放中") ||
    status.includes("已确认") ||
    status.includes("已发布") ||
    status === "可评估" ||
    status === "OK"
  ) {
    return "success";
  }

  if (
    status.includes("数据不足") ||
    status.includes("待确认") ||
    status.includes("未执行")
  ) {
    return "info";
  }

  return "neutral";
}
