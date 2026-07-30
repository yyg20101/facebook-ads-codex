const COLORS = {
  ink: "#172033",
  muted: "#5f6b7a",
  line: "#cfd7e3",
  panel: "#ffffff",
  canvas: "#f4f6f9",
  accent: "#315efb",
  assistant: "#eef3ff",
  warning: "#fff4dc"
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lines(value, max = 34) {
  const words = String(value).split(/\s+/u);
  const output = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (Array.from(next).length > max && current) {
      output.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) output.push(current);
  return output;
}

function textBlock(value, x, y, options = {}) {
  const {
    size = 20,
    fill = COLORS.ink,
    weight = 400,
    lineHeight = 30,
    max = 34
  } = options;
  return lines(value, max)
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" ` +
        `font-size="${size}" font-weight="${weight}" fill="${fill}">` +
        `${escapeXml(line)}</text>`
    )
    .join("");
}

function panel(x, y, width, height, title, body) {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="16" ` +
    `fill="${COLORS.panel}" stroke="${COLORS.line}"/>` +
    textBlock(title, x + 20, y + 34, { size: 18, weight: 700, max: 28 }) +
    body
  );
}

function factsList(stage, x, y, width) {
  return stage.facts
    .map((fact, index) => {
      const top = y + index * 58;
      return (
        `<rect x="${x}" y="${top}" width="${width}" height="44" rx="10" ` +
        `fill="${COLORS.canvas}"/>` +
        textBlock(fact, x + 14, top + 28, { size: 16, max: 38 })
      );
    })
    .join("");
}

function actionButton(stage, x, y, width) {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="54" rx="12" ` +
    `fill="${COLORS.accent}"/>` +
    textBlock(stage.action, x + 18, y + 34, {
      size: 17,
      fill: "#ffffff",
      weight: 700,
      max: 36
    })
  );
}

function conversationLayout(stage) {
  const conversation =
    textBlock(stage.prompt, 78, 220, { size: 21, weight: 700, max: 42 }) +
    `<rect x="70" y="255" width="700" height="110" rx="14" ` +
    `fill="${COLORS.assistant}"/>` +
    textBlock(stage.assistant, 92, 292, { size: 18, max: 54 }) +
    actionButton(stage, 70, 550, 700);
  const state =
    factsList(stage, 858, 220, 270) +
    `<rect x="850" y="455" width="286" height="100" rx="12" ` +
    `fill="${COLORS.warning}"/>` +
    textBlock(stage.boundary, 870, 492, { size: 17, weight: 700, max: 25 });
  return (
    panel(40, 160, 770, 480, "对话任务", conversation) +
    panel(830, 160, 330, 480, "对象状态", state)
  );
}

function workbenchLayout(stage) {
  const nav =
    textBlock("总览", 75, 230, { size: 18, weight: 700 }) +
    textBlock("素材", 75, 275, { size: 18 }) +
    textBlock("广告草稿", 75, 320, { size: 18 }) +
    textBlock("数据分析", 75, 365, { size: 18 }) +
    textBlock("素材测试", 75, 410, { size: 18 });
  const main =
    textBlock(stage.prompt, 300, 220, { size: 22, weight: 700, max: 45 }) +
    factsList(stage, 300, 260, 760) +
    `<rect x="300" y="455" width="760" height="80" rx="12" ` +
    `fill="${COLORS.assistant}"/>` +
    textBlock(stage.assistant, 320, 490, { size: 17, max: 62 }) +
    textBlock(stage.boundary, 320, 520, {
      size: 15,
      fill: COLORS.accent,
      weight: 700,
      max: 62
    }) +
    actionButton(stage, 300, 555, 760);
  return (
    panel(40, 160, 210, 480, "导航", nav) +
    panel(270, 160, 890, 480, stage.title, main)
  );
}

function hybridLayout(stage) {
  const nav =
    textBlock("总览", 68, 240, { size: 17, weight: 700 }) +
    textBlock("素材", 68, 285, { size: 17 }) +
    textBlock("草稿", 68, 330, { size: 17 }) +
    textBlock("分析", 68, 375, { size: 17 }) +
    textBlock("测试", 68, 420, { size: 17 });
  const main =
    textBlock(stage.prompt, 270, 220, { size: 21, weight: 700, max: 34 }) +
    factsList(stage, 270, 260, 500) +
    `<rect x="270" y="455" width="500" height="90" rx="12" ` +
    `fill="${COLORS.warning}"/>` +
    textBlock(stage.boundary, 290, 490, { size: 17, weight: 700, max: 40 }) +
    actionButton(stage, 270, 565, 500);
  const assistant =
    textBlock(stage.assistant, 835, 230, { size: 18, max: 26 }) +
    textBlock("来源与范围可见", 835, 445, {
      size: 16,
      fill: COLORS.muted,
      weight: 700
    }) +
    textBlock("结果保存为工作台对象", 835, 485, {
      size: 16,
      fill: COLORS.muted,
      weight: 700,
      max: 24
    });
  return (
    panel(40, 160, 170, 480, "导航", nav) +
    panel(230, 160, 580, 480, stage.title, main) +
    panel(830, 160, 330, 480, "上下文助手", assistant)
  );
}

export function renderPrototypeSvg({ shape, scenario, stage }) {
  const layout =
    shape.id === "PROTO-A"
      ? conversationLayout(stage)
      : shape.id === "PROTO-B"
        ? workbenchLayout(stage)
        : hybridLayout(stage);
  const stageIndex = scenario.stages.findIndex((item) => item.id === stage.id) + 1;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" ` +
    `role="img" aria-labelledby="title description">` +
    `<title id="title">${escapeXml(`${shape.id} ${scenario.id} ${stage.title}`)}</title>` +
    `<desc id="description">${escapeXml(shape.description)}</desc>` +
    `<rect width="1200" height="760" fill="${COLORS.canvas}"/>` +
    textBlock(`${shape.id} · ${shape.name}`, 40, 58, { size: 28, weight: 700 }) +
    textBlock(`${scenario.id} · ${scenario.title}`, 40, 100, {
      size: 22,
      fill: COLORS.muted,
      weight: 700
    }) +
    `<rect x="40" y="118" width="1120" height="30" rx="8" fill="#e8eefc"/>` +
    textBlock("脱敏示例 · 无真实 Meta 连接 · 无写操作", 58, 140, {
      size: 15,
      fill: COLORS.accent,
      weight: 700
    }) +
    layout +
    textBlock(`阶段 ${stageIndex}/3`, 40, 710, {
      size: 16,
      fill: COLORS.muted,
      weight: 700
    }) +
    textBlock(shape.description, 150, 710, {
      size: 16,
      fill: COLORS.muted,
      max: 80
    }) +
    `</svg>`
  );
}
