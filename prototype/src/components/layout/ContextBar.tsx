import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Globe2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { prototypeContext } from "../../data/demo";

function ContextItem({
  icon: Icon,
  children,
  compact = false,
}: {
  icon?: typeof CalendarDays;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      className={`context-item ${compact ? "context-item--compact" : ""}`}
      type="button"
    >
      {Icon ? <Icon aria-hidden="true" size={16} /> : null}
      <span>{children}</span>
      <ChevronDown aria-hidden="true" size={14} />
    </button>
  );
}

export function ContextBar() {
  return (
    <div className="context-bar" aria-label="当前数据和权限上下文">
      <div className="context-bar__primary">
        <ContextItem icon={WalletCards}>{prototypeContext.workspace}</ContextItem>
        <ContextItem compact>{prototypeContext.account}</ContextItem>
        <ContextItem icon={CalendarDays}>{prototypeContext.range}</ContextItem>
        <ContextItem icon={Globe2}>{prototypeContext.timezone}</ContextItem>
      </div>
      <div className="context-bar__secondary">
        <ContextItem>{prototypeContext.attribution}</ContextItem>
        <div className="context-freshness">
          <Clock3 aria-hidden="true" size={15} />
          {prototypeContext.freshness}
        </div>
        <ContextItem icon={UserRound}>{prototypeContext.role}</ContextItem>
      </div>
    </div>
  );
}
