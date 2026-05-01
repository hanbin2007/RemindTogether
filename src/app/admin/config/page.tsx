import { listConfig } from "@/services/admin/config";
import { setConfigAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const entries = await listConfig();

  return (
    <div data-testid="admin-config">
      <h1 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        配置
      </h1>
      <p className="mt-2 font-[family-name:var(--font-kalam)] text-rt-ink-soft">
        改完即时生效（运行时每次读 DB，10 秒内全节点都能看到新值）。
      </p>

      <div className="mt-6 space-y-3">
        {entries.map((e) => (
          <div
            key={e.key}
            className="rt-box p-4"
            data-testid={`config-${e.key}`}
            style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute">
              {e.key}
            </p>
            <p className="mt-1 font-[family-name:var(--font-kalam)] text-rt-ink-soft text-sm">
              {e.description}
            </p>
            <form
              action={setConfigAction}
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="key" value={e.key} />
              <span className="font-mono text-[11px] text-rt-ink-mute">
                当前：
                <span data-testid={`config-${e.key}-current`}>
                  {String(e.currentValue)}
                </span>
                {" "}· 默认：{String(e.defaultValue)}
              </span>
              {e.type === "boolean" ? (
                <select
                  name="value"
                  defaultValue={String(e.currentValue)}
                  data-testid={`config-${e.key}-input`}
                  className="rt-input w-32"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  type="number"
                  name="value"
                  defaultValue={String(e.currentValue)}
                  min="0"
                  max="10000"
                  data-testid={`config-${e.key}-input`}
                  className="rt-input w-32"
                />
              )}
              <button
                type="submit"
                data-testid={`config-${e.key}-save`}
                className="rt-btn rt-btn-primary"
              >
                保存
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
