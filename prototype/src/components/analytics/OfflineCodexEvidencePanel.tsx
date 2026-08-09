import { Braces, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  buildOfflineCodexEvidenceBundle,
  serializeOfflineCodexEvidenceBundle,
  type OfflineCodexEvidenceSource,
} from "../../data/offlineCodexEvidence";
import type { OfflineDataQualityAttestation } from "../../data/offlineDataQuality";
import { Status } from "../ui/Status";

interface OfflineCodexEvidencePanelProps {
  instanceId?: string;
  qualityAttestation: OfflineDataQualityAttestation | null;
  source: OfflineCodexEvidenceSource | null;
  stepLabel?: string;
}

interface EvidencePreview {
  analysisKind: string;
  serialized: string;
}

function createEvidencePreview(
  attestation: OfflineDataQualityAttestation | null,
  source: OfflineCodexEvidenceSource | null,
): EvidencePreview | null {
  if (attestation === null || source === null) {
    return null;
  }
  const bundle = buildOfflineCodexEvidenceBundle(attestation, source);
  return {
    analysisKind: bundle.analysis_kind,
    serialized: serializeOfflineCodexEvidenceBundle(bundle),
  };
}

export function OfflineCodexEvidencePanel({
  instanceId = "comparison",
  qualityAttestation,
  source,
  stepLabel = "步骤 7 · 手动交接",
}: OfflineCodexEvidencePanelProps) {
  let preview: EvidencePreview | null = null;
  let rejectionMessage: string | null = null;

  try {
    preview = createEvidencePreview(qualityAttestation, source);
  } catch (error) {
    rejectionMessage =
      error instanceof Error
        ? error.message
        : "当前结果无法形成可信的 Codex 分析上下文。";
  }

  const titleId = `offline-codex-evidence-title-${instanceId}`;
  const jsonId = `offline-codex-evidence-json-${instanceId}`;
  const noteId = `offline-codex-evidence-note-${instanceId}`;

  return (
    <section
      className="offline-codex-evidence"
      aria-labelledby={titleId}
    >
      <header>
        <div>
          <span>{stepLabel}</span>
          <h3 id={titleId}>Codex 手动上下文</h3>
          <p>
            将已通过 preflight 的当前结果整理为确定性 JSON，供
            <code>facebook-ads-analysis</code> 会话手动读取。
          </p>
        </div>
        <Status severity={preview === null ? "neutral" : "success"}>
          {preview === null ? "等待可信结果" : "上下文已就绪"}
        </Status>
      </header>

      {rejectionMessage !== null ? (
        <div className="offline-codex-evidence__rejection" role="alert">
          <LockKeyhole aria-hidden="true" size={18} />
          <div>
            <strong>已拒绝生成</strong>
            <p>{rejectionMessage}</p>
          </div>
        </div>
      ) : preview === null ? (
        <div className="offline-codex-evidence__empty">
          <Braces aria-hidden="true" size={20} />
          <div>
            <strong>先完成步骤 2 和步骤 4</strong>
            <p>只有当前 preflight 覆盖的成功分析结果可生成。</p>
          </div>
        </div>
      ) : (
        <div className="offline-codex-evidence__preview">
          <div className="offline-codex-evidence__facts" aria-label="Codex 上下文边界">
            <span>
              <CheckCircle2 aria-hidden="true" size={15} />
              preflight PASS
            </span>
            <span>类型：{preview.analysisKind}</span>
            <span>FACT / UNKNOWN 已分层</span>
            <span>
              <ShieldCheck aria-hidden="true" size={15} />
              外部写入：false
            </span>
          </div>

          <label htmlFor={jsonId}>
            Codex 分析输入 JSON
          </label>
          <textarea
            id={jsonId}
            aria-describedby={noteId}
            aria-label="Codex 分析上下文 JSON"
            readOnly
            rows={18}
            spellCheck={false}
            value={preview.serialized}
          />
          <p id={noteId} className="offline-codex-evidence__note">
            这只是 fixture 输入上下文，不是分析结论、真实账户证明或操作授权；页面不保存、
            不上传，也不生成建议。
          </p>
        </div>
      )}
    </section>
  );
}
