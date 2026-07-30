import {
  BarChart3,
  Beaker,
  Boxes,
  CircleGauge,
  FilePenLine,
  FolderKanban,
  Settings2,
} from "lucide-react";

export const navigationItems = [
  { label: "总览", shortLabel: "总览", href: "/overview", icon: CircleGauge },
  { label: "素材中心", shortLabel: "素材", href: "/assets", icon: Boxes },
  { label: "广告创建", shortLabel: "创建", href: "/create", icon: FilePenLine },
  { label: "广告管理", shortLabel: "广告", href: "/manage", icon: FolderKanban },
  { label: "数据分析", shortLabel: "分析", href: "/analytics", icon: BarChart3 },
  { label: "测试与优化", shortLabel: "测试", href: "/testing", icon: Beaker },
  {
    label: "设置与治理",
    shortLabel: "更多",
    href: "/governance",
    icon: Settings2,
  },
] as const;
