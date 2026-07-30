import test from "node:test";
import assert from "node:assert/strict";
import {
  SCENARIOS,
  SHAPES
} from "../docs/discovery/prototypes/src/model.mjs";
import {
  renderPrototypeSvg
} from "../docs/discovery/prototypes/src/render-svg.mjs";

test("renders all shape and scenario stages without external resources", () => {
  for (const shape of SHAPES) {
    for (const scenario of SCENARIOS) {
      for (const stage of scenario.stages) {
        const svg = renderPrototypeSvg({ shape, scenario, stage });
        assert.match(svg, /viewBox="0 0 1200 760"/);
        assert.match(svg, new RegExp(shape.id));
        assert.match(svg, new RegExp(scenario.id));
        assert.match(svg, /脱敏示例 · 无真实 Meta 连接 · 无写操作/);
        assert.doesNotMatch(svg, /\b(?:href|src)="https?:|<image/i);
      }
    }
  }
});

test("keeps the critical product boundaries visible", () => {
  const expected = new Map([
    ["SC-01", "未发布"],
    ["SC-02", "建议尚未执行"],
    ["SC-03", "INCONCLUSIVE"]
  ]);
  for (const scenario of SCENARIOS) {
    const resultStage = scenario.stages.at(-1);
    for (const shape of SHAPES) {
      const svg = renderPrototypeSvg({ shape, scenario, stage: resultStage });
      assert.match(svg, new RegExp(expected.get(scenario.id)));
    }
  }
});
