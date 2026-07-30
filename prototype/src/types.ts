export type Severity = "critical" | "warning" | "info" | "success" | "neutral";

export type PublishState =
  | "DRAFT"
  | "PENDING_CONFIRMATION"
  | "PUBLISHING"
  | "PUBLISHED"
  | "REVIEW_FAILED";

export type TestConclusion =
  | "KEEP"
  | "STOP"
  | "ITERATE"
  | "INCONCLUSIVE";

export interface TrendPoint {
  date: string;
  spend: number;
  purchases: number;
  roas: number;
}

export interface CampaignRow {
  id: string;
  name: string;
  status: "投放中" | "审核失败" | "数据不足" | "草稿";
  objective: string;
  spend: number;
  purchases: number;
  cpa: number;
  roas: number;
  budget: string;
  severity: Severity;
}

export interface CreativeAsset {
  id: string;
  name: string;
  kind: "图片" | "视频";
  source: string;
  rights: "已确认" | "待确认";
  aiGenerated: boolean;
  dimensions: string;
  fileSize: string;
  image: string;
  spend: number;
  ctr: number;
  purchases: number;
  roas: number;
  linkedAds: number;
}

export interface TaskItem {
  id: string;
  title: string;
  detail: string;
  action: string;
  href: string;
  severity: Severity;
}

export interface DiagnosisEvidence {
  id: string;
  kind: "evidence" | "counter" | "missing";
  label: string;
  detail: string;
}

export interface TestPlan {
  id: string;
  name: string;
  status: "准备中" | "数据不足" | "可评估" | "已结束";
  variable: string;
  metric: string;
  period: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: "project_owner" | "prototype";
  action: string;
  object: string;
  result: string;
}
