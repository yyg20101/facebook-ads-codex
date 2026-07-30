import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { MemoryRouter } from "./router";

function renderApp(route = "/overview") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Meta Ads operations prototype", () => {
  it("shows the prototype trust boundary and full product navigation", () => {
    renderApp();

    expect(
      screen.getByText("原型数据 · 未连接 Meta · 不会执行外部写入"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "今日运营总览" })).toBeInTheDocument();
    expect(screen.getAllByText("素材中心").length).toBeGreaterThan(0);
    expect(screen.getAllByText("测试与优化").length).toBeGreaterThan(0);
  });

  it("blocks human confirmation until preflight blockers are resolved", () => {
    renderApp("/create");

    const confirmationButtons = screen.getAllByRole("button", {
      name: "进入人工确认",
    });
    expect(confirmationButtons.every((button) => button.hasAttribute("disabled"))).toBe(true);
    expect(screen.getAllByText("素材商业使用权待确认").length).toBeGreaterThan(0);
    expect(screen.getAllByText("落地页 Pixel 事件未选择").length).toBeGreaterThan(0);
  });

  it("saves a diagnosis without presenting it as an executed change", async () => {
    const user = userEvent.setup();
    renderApp("/analytics");

    await user.click(screen.getByRole("button", { name: "保存诊断" }));

    expect(screen.getByRole("button", { name: "诊断已保存" })).toBeInTheDocument();
    expect(screen.getByText("建议 · 未执行")).toBeInTheDocument();
  });

  it("navigates to a focused asset with the internal client router", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      screen.getByRole("link", {
        name: "1 个素材权利待确认 确认素材的商业使用权利 去确认",
      }),
    );

    expect(screen.getByRole("heading", { name: "素材中心" })).toBeInTheDocument();
    expect(screen.getAllByText("AST-001").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "核对并确认权利" }),
    ).toBeInTheDocument();
  });
});
