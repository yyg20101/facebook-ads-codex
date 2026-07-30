# 原型视觉一致性记录

## 验收方法

- 使用 Codex 应用内浏览器运行本地 Vite 原型。
- 桌面截图使用 `1536 × 1024` 视口；移动端验证使用 `430 × 932` 视口。
- 每次状态变化后读取可访问性 DOM，再使用角色和可访问名称执行交互。
- 移动端通过浏览器求值确认 `documentElement.scrollWidth === clientWidth`。
- 最终控制台检查结果：`error=0`、`warn=0`。

## 概念与实现

| 状态 | 已接受概念 | 浏览器实现截图 |
| --- | --- | --- |
| 桌面总览 | [dashboard-desktop.png](concepts/dashboard-desktop.png) | [dashboard-desktop-latest.png](../qa/dashboard-desktop-latest.png) |
| 广告创建 | [ad-builder-desktop.png](concepts/ad-builder-desktop.png) | [ad-builder-desktop-latest.png](../qa/ad-builder-desktop-latest.png) |
| 数据分析 | [analytics-desktop.png](concepts/analytics-desktop.png) | [analytics-desktop-latest.png](../qa/analytics-desktop-latest.png) |
| 测试与优化 | [testing-desktop.png](concepts/testing-desktop.png) | [testing-desktop-latest.png](../qa/testing-desktop-latest.png) |
| 下一轮测试草稿 | 测试概念的状态延伸 | [testing-created-desktop-latest.png](../qa/testing-created-desktop-latest.png) |
| 移动端总览 | [dashboard-mobile.png](concepts/dashboard-mobile.png) | [dashboard-mobile-latest.png](../qa/dashboard-mobile-latest.png) |
| 移动端广告创建 | 广告创建概念的响应式延伸 | [ad-builder-mobile-latest.png](../qa/ad-builder-mobile-latest.png) |

## 一致性检查

1. 桌面保持深蓝固定侧栏、顶部可信提示、全局上下文栏和浅灰蓝页面画布。
2. 总览保持指标带、趋势图、风险待办、广告表格和素材表现的同屏层级。
3. 广告创建保持结构树、配置表单、广告预览和发布前检查的四区布局。
4. 数据分析保持范围筛选、趋势、对象下钻表格和右侧证据化诊断。
5. 测试页保持计划列表、变体对比、指标表格和结论检查器。
6. 状态颜色保持蓝色主操作、绿色正常、橙色警告、红色阻断和紫色对比指标。
7. 桌面与移动端均持续表达“原型数据”“未连接 Meta”和“无外部写入”。
8. 移动端将侧栏转换为底部导航，复杂创建流纵向排列且页面不横向溢出。

## 文案差异

- 概念图使用 Meta 形状占位标识；实现改用通用网络节点图标，避免暗示官方产品身份。
- 广告创建概念展示初始 `2 BLOCKER`；实现截图取自素材权利和 Pixel 事件已修复后的
  `0 BLOCKER` 状态，用于证明人工确认前置条件。
- 测试概念只展示 `TP-007`；实现同时保留交互后生成的 `TP-008`“准备中”状态。
- 移动概念是完整长页；浏览器证据使用真实 `430 × 932` 可视窗口，因此只展示首个
  视口和固定底部导航。
- 实现把“未执行”“待确认”“模拟发布”和“模拟审核失败”写得更明确，以满足安全边界。

## 已修正偏差

- 统一了桌面四个页面的侧栏宽度、顶部栏高度、边框、圆角和密度。
- 将桌面复杂表格在移动端改为摘要内容，避免缩小到不可读。
- 为发布、待确认行动和下一轮测试增加显式确认框及无外部副作用说明。
- 审核失败增加返回问题素材和广告配置的路径。
- 分析建议增加证据、反证、缺失数据和置信度，测试结论增加数据有效性提示。

项目负责人已默认通过当前产品走查；本记录只说明实现相对视觉基线和技术验收的结果，
不证明真实用户可用性、效率或广告效果。
