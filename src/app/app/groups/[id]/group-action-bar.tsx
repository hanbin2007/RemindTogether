import Link from "next/link";
import { Icon } from "@/components/sketch/icon";

/**
 * Sticky bottom action bar above the global tabbar — mirrors HfGroupDetail
 * lines 363-370. "+加给大家的事" anchors the form, "群拍" links to the
 * group's poke composer.
 */
export function GroupActionBar({ groupId }: { groupId: string }) {
  return (
    <div
      data-testid="group-action-bar"
      className="fixed inset-x-0 z-10"
      style={{
        bottom: 56,
        background: "var(--rt-paper)",
        borderTop: "1.3px dashed var(--rt-ink-faint)",
      }}
    >
      <div className="max-w-xl mx-auto px-3.5 py-2.5 flex gap-2">
        <Link
          href={`#group-add-${groupId}`}
          data-testid="group-add-cta"
          className="rt-btn rt-btn-primary flex-1"
          style={{ fontSize: 15 }}
        >
          <Icon name="plus" size={14} /> 加给大家的事
        </Link>
        <Link
          href={`/app/groups/${groupId}/poke`}
          data-testid="group-poke-cta"
          className="rt-btn rt-btn-poke"
          style={{ fontSize: 15 }}
        >
          群拍 <Icon name="boltFilled" size={14} />
        </Link>
      </div>
    </div>
  );
}
