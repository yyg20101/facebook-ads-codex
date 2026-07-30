export const SHAPES = Object.freeze([
  {
    id: "PROTO-A",
    slug: "proto-a",
    name: "对话主导",
    description: "会话承担主要任务，右侧只显示对象状态和安全边界。"
  },
  {
    id: "PROTO-B",
    slug: "proto-b",
    name: "纯 Web 工作台",
    description: "导航、表格和卡片承担任务，解释以内联帮助呈现。"
  },
  {
    id: "PROTO-C",
    slug: "proto-c",
    name: "Web 工作台 + 内置助手",
    description: "工作台承载对象和状态，助手承载生成、解释、诊断和建议。"
  }
]);

export const SCENARIOS = Object.freeze([
  {
    id: "SC-01",
    slug: "sc-01",
    title: "从投放目标到可审核广告草稿",
    criteria: [
      { id: "SC01-K01", label: "识别并补充关键简报信息" },
      { id: "SC01-K02", label: "找到素材来源与版权状态" },
      { id: "SC01-K03", label: "理解引导和高级配置入口" },
      { id: "SC01-K04", label: "检查结构化广告草稿" },
      { id: "SC01-K05", label: "识别并处理 BLOCKER" },
      { id: "SC01-K06", label: "确认草稿未发布并导出发布清单" }
    ],
    stages: [
      {
        id: "start",
        title: "目标简报",
        prompt: "为夏季课程生成广告草稿",
        facts: ["目标：未选择", "受众：城市家长", "落地页：未填写"],
        assistant: "检测到 2 项关键缺失，不能生成可审核草稿。",
        action: "补充投放目标与落地页",
        boundary: "广告状态：未发布"
      },
      {
        id: "work",
        title: "素材与发布前检查",
        prompt: "比较两张图片和三组文案",
        facts: ["图片 A：已上传", "图片 B：来源未确认", "文案：3 个变体"],
        assistant: "图片 B 的商业使用权不明确。",
        action: "替换图片 B 或确认授权来源",
        boundary: "BLOCKER：版权状态未确认"
      },
      {
        id: "result",
        title: "广告草稿",
        prompt: "草稿已满足内部审核条件",
        facts: ["版本：v3", "BLOCKER：0", "WARNING：2"],
        assistant: "可以导出发布清单；产品不会执行 Meta 发布。",
        action: "导出发布清单",
        boundary: "未发布 · 需要用户前往 Meta 操作"
      }
    ]
  },
  {
    id: "SC-02",
    slug: "sc-02",
    title: "从只读投放数据到诊断与行动建议",
    criteria: [
      { id: "SC02-K01", label: "确认账户、对象、时间和比较基线" },
      { id: "SC02-K02", label: "识别数据更新时间、时区和归因口径" },
      { id: "SC02-K03", label: "找到异常时间、范围和严重度" },
      { id: "SC02-K04", label: "区分支持证据、反证和缺失数据" },
      { id: "SC02-K05", label: "理解建议风险、验证周期和停止条件" },
      { id: "SC02-K06", label: "确认建议未执行并保存诊断报告" }
    ],
    stages: [
      {
        id: "start",
        title: "数据范围",
        prompt: "解释过去 7 天转化下降",
        facts: ["对象：Campaign A", "比较：前 7 天", "数据延迟：3 小时"],
        assistant: "归因窗口尚未确认，结论只能保持低置信度。",
        action: "确认归因口径与时区",
        boundary: "只读数据 · 更新时间 10:00"
      },
      {
        id: "work",
        title: "异常与证据",
        prompt: "点击率稳定，但转化率下降",
        facts: ["CTR：稳定", "CVR：下降", "落地页事件：缺失 8%"],
        assistant: "追踪缺失支持测量异常假设；尚不能证明广告素材失效。",
        action: "查看支持证据与反证",
        boundary: "低置信度 · 不得表述为因果"
      },
      {
        id: "result",
        title: "诊断报告",
        prompt: "先修复追踪，再复查转化",
        facts: ["验证周期：24 小时", "停止条件：事件继续缺失", "风险：中"],
        assistant: "建议已保存，系统没有修改 Campaign A。",
        action: "保存并安排复查",
        boundary: "建议尚未执行"
      }
    ]
  },
  {
    id: "SC-03",
    slug: "sc-03",
    title: "从素材变体到测试结论",
    criteria: [
      { id: "SC03-K01", label: "识别测试假设" },
      { id: "SC03-K02", label: "识别主要变化变量" },
      { id: "SC03-K03", label: "确认主要指标和保护指标" },
      { id: "SC03-K04", label: "找到最小数据与复查条件" },
      { id: "SC03-K05", label: "识别曝光不均或追踪异常" },
      { id: "SC03-K06", label: "理解置信度和干扰因素" },
      { id: "SC03-K07", label: "在证据不足时选择 INCONCLUSIVE" }
    ],
    stages: [
      {
        id: "start",
        title: "测试假设",
        prompt: "比较图片 A 与图片 B",
        facts: ["主要变量：图片", "文案：相同", "受众：相同"],
        assistant: "当前只有一个主要变量，具备可比基础。",
        action: "确认指标和最小数据条件",
        boundary: "一次只测试一个主要变量"
      },
      {
        id: "work",
        title: "测试状态",
        prompt: "图片 B 暂时领先",
        facts: ["图片 A：1,200 展示", "图片 B：420 展示", "消耗不均：是"],
        assistant: "曝光不均且数据未成熟，不能宣布赢家。",
        action: "等待最小数据条件或修复投放不均",
        boundary: "数据不足"
      },
      {
        id: "result",
        title: "测试结论",
        prompt: "当前比较无法形成可靠结论",
        facts: ["置信度：低", "干扰因素：曝光不均", "下一次复查：24 小时"],
        assistant: "保留两个变体并修正投放条件后重新比较。",
        action: "创建下一轮测试计划",
        boundary: "INCONCLUSIVE · 未自动修改广告"
      }
    ]
  }
]);

export const CRITICAL_MISUNDERSTANDINGS = Object.freeze([
  "DATA_SCOPE_MISREAD",
  "PERMISSION_ESCALATION",
  "META_WRITE_ASSUMED",
  "CAUSALITY_OVERCLAIM",
  "RIGHTS_BYPASS"
]);

export function artifactId(shape, scenario, stage) {
  return `${shape.slug}-${scenario.slug}-${stage.id}`;
}
