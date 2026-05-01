/* eslint-disable */
// hf-desktop-shell.jsx — Reusable desktop chrome: sidebar + topbar + context panel.

const { Av, AvStack, Icon } = window.HF;

window.HF.Sidebar = function Sidebar({ active = 'today' }) {
  const groups = [
    { id: 'g-bird', n: '早起鸟',  ic: 'bird',     poke: 1 },
    { id: 'g-book', n: '读书会',  ic: 'book',     poke: 0 },
    { id: 'g-word', n: '背词打卡', ic: 'letterA',  poke: 2 },
    { id: 'g-gym',  n: '健身搭子', ic: 'dumbbell', poke: 0 },
    { id: 'g-room', n: '室友烂账', ic: 'house',    poke: 0 },
  ];
  const views = [
    { id: 'today',    n: '今天',  ic: 'sun',       count: 4 },
    { id: 'inbox',    n: '收件箱', ic: 'inbox',     count: 2, hot: true },
    { id: 'upcoming', n: '即将到', ic: 'clock',     count: 12 },
    { id: 'private',  n: '私人',   ic: 'lock',      count: 17 },
    { id: 'owe',      n: '加油榜', ic: 'trendDown' },
  ];
  return (
    <div style={{
      width: 224, flex: 'none', borderRight: '1.5px solid var(--line)',
      background: 'var(--paper-2)', display: 'flex', flexDirection: 'column',
    }}>
      {/* logo */}
      <div style={{ padding: '14px 16px', borderBottom: '1.3px dashed var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="hf-box tight" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-4deg)', color: 'var(--poke)' }}>
          <window.HF.Icon name="boltFilled" size={16} />
        </div>
        <div className="h-h2" style={{ fontSize: 20 }}>Reminder</div>
      </div>

      {/* search */}
      <div style={{ padding: '10px 12px' }}>
        <div className="hf-box tight" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--paper)' }}>
          <window.HF.Icon name="search" size={13} />
          <span className="h-body" style={{ fontSize: 13, flex: 1, color: 'var(--ink-mute)' }}>搜事 / 人 / 群…</span>
          <span className="hf-chip dim" style={{ fontSize: 10, padding: '0 5px', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <window.HF.Icon name="cmd" size={9} /> K
          </span>
        </div>
      </div>

      {/* views */}
      <div style={{ padding: '4px 8px' }}>
        <div className="h-meta" style={{ padding: '4px 8px' }}>视图</div>
        {views.map((v) => (
          <NavRow key={v.id} active={v.id === active} hot={v.hot} count={v.count} icon={v.ic}>{v.n}</NavRow>
        ))}
      </div>

      {/* groups */}
      <div style={{ padding: '8px 8px', borderTop: '1.3px dashed var(--ink-faint)', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
          <span className="h-meta">群组</span>
          <span className="h-meta" style={{ marginLeft: 'auto', cursor: 'pointer', display: 'inline-flex' }}>
            <window.HF.Icon name="plus" size={12} />
          </span>
        </div>
        {groups.map((g) => (
          <NavRow key={g.id} active={g.id === active} icon={g.ic} poke={g.poke}>{g.n}</NavRow>
        ))}
      </div>

      {/* user */}
      <div style={{ padding: 10, borderTop: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Av name="夏" i={0} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h-row" style={{ fontSize: 14 }}>夏川</div>
          <div className="h-meta">连胜 23 天</div>
        </div>
        <span style={{ display: 'inline-flex' }}><window.HF.Icon name="gear" size={14} /></span>
      </div>
    </div>
  );
};

function NavRow({ active, icon, poke, count, hot, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', borderRadius: 8,
      background: active ? 'var(--paper)' : 'transparent',
      border: active ? '1.5px solid var(--line)' : '1.5px solid transparent',
      boxShadow: active ? '1.5px 2px 0 var(--line)' : 'none',
      margin: '2px 0', cursor: 'pointer',
    }}>
      <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center' }}>
        <window.HF.Icon name={icon} size={14} />
      </span>
      <span className="h-row" style={{ fontSize: 15, flex: 1, fontWeight: active ? 700 : 600 }}>{children}</span>
      {hot && <span style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--poke)' }} />}
      {poke > 0 && <span className="hf-chip poke" style={{ fontSize: 10, padding: '0 6px', lineHeight: 1.5 }}>{poke}</span>}
      {count > 0 && !poke && <span className="h-num" style={{ fontSize: 11 }}>{count}</span>}
    </div>
  );
}

window.HF.TopBar = function TopBar({ crumbs, title, sub, actions }) {
  return (
    <div style={{
      padding: '14px 28px 10px',
      borderBottom: '1.3px dashed var(--ink-faint)',
      display: 'flex', alignItems: 'flex-end', gap: 14,
    }}>
      <div style={{ flex: 1 }}>
        {crumbs && <div className="h-meta" style={{ marginBottom: 4 }}>{crumbs}</div>}
        <div className="h-display" style={{ fontSize: 32 }}>{title}</div>
        {sub && <div className="h-body" style={{ marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  );
};

window.HF.ContextPanel = function ContextPanel({ children }) {
  return (
    <div style={{
      width: 320, flex: 'none', borderLeft: '1.5px solid var(--line)',
      background: 'var(--paper-2)', overflowY: 'auto',
      padding: '20px 18px',
    }}>{children}</div>
  );
};

window.HF.DeskShell = function DeskShell({ children }) {
  return (
    <div className="hf" style={{
      width: '100%', height: '100%', background: 'var(--paper)',
      display: 'flex', overflow: 'hidden',
    }}>{children}</div>
  );
};
