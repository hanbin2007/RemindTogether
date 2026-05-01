/* eslint-disable */
// hf-shared.jsx — shared sketchy primitives for the hi-fi sketch screens

const AV_BG = ['#FFE9C9', '#D5E8D4', '#E5D5F2', '#FCD5CE', '#CDE7F0', '#F2E2A8', '#EAE2D0'];

window.HF = {};

window.HF.Av = function Av({ name, size = 32, i = 0, style }) {
  return (
    <div className="hf-av" style={{
      width: size, height: size, fontSize: size * 0.46,
      background: AV_BG[i % AV_BG.length], ...style,
    }}>{(name || '?').slice(0, 1)}</div>
  );
};

window.HF.AvStack = function AvStack({ people, max = 4, size = 26 }) {
  return (
    <div style={{ display: 'flex' }}>
      {people.slice(0, max).map((p, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -10 }}>
          <window.HF.Av name={p.n} i={p.i ?? i} size={size} style={{ outline: '2px solid var(--paper)' }} />
        </div>
      ))}
      {people.length > max && (
        <div className="hf-av" style={{
          width: size, height: size, fontSize: 11, marginLeft: -10,
          background: 'var(--paper)', color: 'var(--ink-soft)',
          outline: '2px solid var(--paper)',
        }}>+{people.length - max}</div>
      )}
    </div>
  );
};

window.HF.Phone = function Phone({ children, time = '9:41' }) {
  return (
    <div className="hf-phone">
      <div className="hf-status">
        <span>{time}</span>
        <span style={{ display: 'inline-flex', gap: 5, fontSize: 10 }}>•••  ◓  ▮▮▮</span>
      </div>
      <div className="hf-screen">{children}</div>
      <div className="hf-home-ind" />
    </div>
  );
};

window.HF.TabBar = function TabBar({ active = 0 }) {
  const items = ['今天', '群组', '拍拍', '私人', '我'];
  const icons = [
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9 L9 3 L15 9 V14.5 a1 1 0 01-1 1 H4 a1 1 0 01-1-1 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="6" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M2 15 c0-2.5 1.8-4 4-4 s4 1.5 4 4 M8 15 c0-2.5 1.8-4 4-4 s4 1.5 4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>,
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M13 2 L4 13 H10 L9 20 L18 9 H12 L13 2 Z" stroke="currentColor" strokeWidth="1.8" fill={active === 2 ? 'var(--poke)' : 'none'} strokeLinejoin="round"/></svg>,
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 4 H15 M3 9 H15 M3 14 H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M3 16 c0-3 2.5-5 6-5 s6 2 6 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>,
  ];
  return (
    <div className="hf-tabbar" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      {items.map((t, i) => (
        <div key={i} className={i === active ? 'active' : ''}>
          <span style={{ height: 18, display: 'inline-flex', alignItems: 'center' }}>{icons[i]}</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
};

// Mini reminder row
window.HF.RemRow = function RemRow({ title, sub, done, chip, time, last }) {
  return (
    <div className="hf-row" style={{ borderBottom: last ? 'none' : '1.3px dashed var(--ink-faint)' }}>
      <span className={`hf-check ${done ? 'done' : ''}`} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-row" style={{ textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--ink-mute)' : 'var(--ink)' }}>{title}</div>
        {sub && <div className="h-meta" style={{ marginTop: 1 }}>{sub}</div>}
      </div>
      {time && <div className="h-meta" style={{ alignSelf: 'flex-start', marginTop: 4 }}>{time}</div>}
      {chip}
    </div>
  );
};
