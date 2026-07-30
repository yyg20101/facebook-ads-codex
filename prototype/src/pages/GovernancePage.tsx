import {
  Check,
  CircleOff,
  FileClock,
  KeyRound,
  LockKeyhole,
  RefreshCcw,
  Shield,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Status } from "../components/ui/Status";
import { useToast } from "../components/ui/Toast";
import { usePrototypeState } from "../state/PrototypeState";

export function GovernancePage() {
  const { auditEvents, resetPrototype } = usePrototypeState();
  const { notify } = useToast();

  const reset = () => {
    resetPrototype();
    notify("原型状态已恢复为初始虚构数据");
  };

  return (
    <div className="page governance-page">
      <PageHeader
        actions={
          <Button
            icon={<RefreshCcw aria-hidden="true" size={16} />}
            onClick={reset}
          >
            重置原型状态
          </Button>
        }
        description="查看连接、角色、审批、安全边界和原型审计记录。"
        title="设置与治理"
      />

      <div className="governance-grid">
        <section className="surface governance-section governance-section--wide">
          <header className="surface__header">
            <div>
              <h2>连接与能力</h2>
              <p>当前 Product Discovery 的外部边界</p>
            </div>
            <Status severity="warning">READ_ONLY</Status>
          </header>
          <div className="connection-list">
            <ConnectionRow
              description="没有 OAuth、Token、真实账户或同步任务。"
              icon={<CircleOff size={19} />}
              label="Meta 连接"
              status="未连接"
            />
            <ConnectionRow
              description="没有创建 Worker、D1、R2、Secret 或部署。"
              icon={<CircleOff size={19} />}
              label="Cloudflare 资源"
              status="未创建"
            />
            <ConnectionRow
              description="前期由独立 Codex 会话读取明确提供的上下文。"
              icon={<LockKeyhole size={19} />}
              label="Codex 工具"
              status="无实时工具"
            />
            <ConnectionRow
              description="所有发布、暂停和预算变化只更新浏览器内存。"
              icon={<ShieldCheck size={19} />}
              label="外部写操作"
              status="已阻止"
              success
            />
          </div>
        </section>

        <section className="surface governance-section">
          <header className="surface__header">
            <div>
              <h2>工作区</h2>
              <p>虚构内部试点上下文</p>
            </div>
            <Users aria-hidden="true" size={18} />
          </header>
          <dl className="detail-list">
            <div>
              <dt>名称</dt>
              <dd>星桥电商</dd>
            </div>
            <div>
              <dt>账户别名</dt>
              <dd>DEMO-001</dd>
            </div>
            <div>
              <dt>时区</dt>
              <dd>Asia/Shanghai</dd>
            </div>
            <div>
              <dt>币种</dt>
              <dd>CNY</dd>
            </div>
            <div>
              <dt>数据来源</dt>
              <dd>固定虚构 fixture</dd>
            </div>
          </dl>
        </section>

        <section className="surface governance-section">
          <header className="surface__header">
            <div>
              <h2>停止控制</h2>
              <p>任何未来写能力都必须受控</p>
            </div>
            <Shield aria-hidden="true" size={18} />
          </header>
          <div className="stop-control">
            <span className="stop-control__icon">
              <ShieldCheck size={22} />
            </span>
            <div>
              <strong>外部写操作已关闭</strong>
              <p>当前没有可绕过的开关或隐藏执行路径。</p>
            </div>
          </div>
          <Button disabled variant="danger">
            Emergency stop 已开启
          </Button>
        </section>

        <section className="surface governance-section governance-section--wide">
          <header className="surface__header">
            <div>
              <h2>角色和产品权限</h2>
              <p>页面可见性不能替代服务端授权</p>
            </div>
            <UserRoundCog aria-hidden="true" size={18} />
          </header>
          <div className="table-scroll">
            <table className="data-table permission-table">
              <thead>
                <tr>
                  <th>能力</th>
                  <th>Owner</th>
                  <th>Editor</th>
                  <th>Viewer</th>
                  <th>当前边界</th>
                </tr>
              </thead>
              <tbody>
                <PermissionRow
                  current="原型本地状态"
                  editor
                  label="查看与筛选"
                  owner
                  viewer
                />
                <PermissionRow
                  current="原型本地草稿"
                  editor
                  label="素材和广告草稿"
                  owner
                />
                <PermissionRow
                  current="原型待确认对象"
                  editor
                  label="诊断与测试结论"
                  owner
                />
                <PermissionRow
                  current="未实现"
                  label="成员与角色管理"
                  owner
                />
                <PermissionRow
                  current="未授权"
                  label="Meta 创建、发布和修改"
                />
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface governance-section">
          <header className="surface__header">
            <div>
              <h2>审批边界</h2>
              <p>建议、审批和执行互相独立</p>
            </div>
            <KeyRound aria-hidden="true" size={18} />
          </header>
          <ol className="governance-steps">
            <li>
              <span>1</span>
              <div>
                <strong>保存结构化草稿</strong>
                <p>保留范围、版本和来源。</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>发布前检查</strong>
                <p>BLOCKER 不能被静默绕过。</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>人工审批</strong>
                <p>自然语言确认不构成服务端授权。</p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>受控执行</strong>
                <p>当前阶段未实现且未授权。</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="surface governance-section">
          <header className="surface__header">
            <div>
              <h2>原型审计</h2>
              <p>区分负责人操作和系统状态</p>
            </div>
            <FileClock aria-hidden="true" size={18} />
          </header>
          <div className="audit-list audit-list--governance">
            {auditEvents.slice(0, 8).map((event) => (
              <article key={event.id}>
                <span>{event.at}</span>
                <div>
                  <strong>{event.action}</strong>
                  <small>
                    {event.actor} · {event.object}
                  </small>
                  <p>{event.result}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ConnectionRow({
  icon,
  label,
  description,
  status,
  success = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  status: string;
  success?: boolean;
}) {
  return (
    <article className="connection-row">
      <span className="connection-row__icon">{icon}</span>
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <Status severity={success ? "success" : "warning"}>{status}</Status>
    </article>
  );
}

function PermissionRow({
  label,
  current,
  owner = false,
  editor = false,
  viewer = false,
}: {
  label: string;
  current: string;
  owner?: boolean;
  editor?: boolean;
  viewer?: boolean;
}) {
  const Mark = ({ allowed }: { allowed: boolean }) =>
    allowed ? (
      <span className="permission-yes">
        <Check aria-label="允许" size={16} />
      </span>
    ) : (
      <span className="permission-no" aria-label="不允许">
        —
      </span>
    );

  return (
    <tr>
      <td>{label}</td>
      <td>
        <Mark allowed={owner} />
      </td>
      <td>
        <Mark allowed={editor} />
      </td>
      <td>
        <Mark allowed={viewer} />
      </td>
      <td>{current}</td>
    </tr>
  );
}
