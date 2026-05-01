// artboards.jsx — All wireframe artboards for the Reminder app
// Each export is a small component drawn in low-fi sketch vibe.
// Loaded after design-canvas.jsx and used inside Reminder Wireframes.html.

// ───────────────────────────────────────────
// Tiny helpers (kept inline; no import system)
// ───────────────────────────────────────────
const A = ({ name, lg, sm, style }) => (
  <div className={`sk-avatar ${lg ? 'lg' : ''} ${sm ? 'sm' : ''}`} style={style}>{name}</div>
);
const Bell = () => <span className="sk-bell" />;
const Squig = ({ children }) => <span className="sk-squig">{children}</span>;
const Hl = ({ children }) => <span className="sk-hl">{children}</span>;
const Anno = ({ children, style }) => <div className="sk-anno" style={style}>{children}</div>;

const PhoneFrame = ({ children, label }) => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--paper-warm)' }}>
    <div className="sk-phone">
      <div className="sk-phone-screen">{children}</div>
    </div>
    {label && <div className="sk-meta" style={{ marginTop: 10 }}>{label}</div>}
  </div>
);

const BrowserFrame = ({ children, label }) => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 14, background: 'var(--paper-warm)', boxSizing: 'border-box' }}>
    <div className="sk-browser" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="sk-browser-bar"><span className="dot" /></div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
    </div>
    {label && <div className="sk-meta" style={{ marginTop: 8 }}>{label}</div>}
  </div>
);

// ─────────────────────────────────────
// HOMES (Today)
// ─────────────────────────────────────
function HomeFeed() {
  return (
    <PhoneFrame>
      <div style={{ padding: '14px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="sk-title" style={{ fontSize: 22 }}>今天</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Bell />
          <A name="我" sm />
        </div>
      </div>
      <div style={{ padding: '0 14px', fontFamily: 'var(--hand)', fontSize: 14, color: 'var(--ink-mute)' }}>周三 · 4 件待办</div>
      <div className="sk-divider" style={{ margin: '8px 14px' }} />

      <div style={{ padding: '0 14px' }}>
        <div className="sk-meta">来自 · 跑步小队</div>
        <div className="sk sk-rough" style={{ padding: 10, marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span className="sk-check" />
            <div style={{ flex: 1 }}>
              <div className="sk-hand" style={{ fontSize: 16, fontWeight: 600 }}>晨跑 5km</div>
              <div className="sk-hand" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>7:00 · @我 @阿May</div>
            </div>
            <span className="sk-poke">戳</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 14px 0' }}>
        <div className="sk-meta">来自 · 室友群</div>
        <div className="sk sk-rough" style={{ padding: 10, marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span className="sk-check" />
            <div style={{ flex: 1 }}>
              <div className="sk-hand" style={{ fontSize: 16, fontWeight: 600 }}>倒垃圾</div>
              <div className="sk-hand" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>晚上 · 没人认领</div>
            </div>
            <span className="sk-claim">认领</span>
          </div>
        </div>
        <div className="sk sk-rough" style={{ padding: 10, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span className="sk-check done" />
            <div style={{ flex: 1, opacity: 0.55 }}>
              <div className="sk-hand" style={{ fontSize: 16, textDecoration: 'line-through' }}>买洗衣液</div>
              <div className="sk-hand" style={{ fontSize: 13 }}>阿May 完成 · 14:02</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar">
          <div className="active">今天</div>
          <div>群组</div>
          <div>+</div>
          <div>戳人</div>
          <div>我</div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function HomeBoard() {
  return (
    <PhoneFrame>
      <div style={{ padding: '14px 14px 6px' }}>
        <div className="sk-meta">2026 · 04 · 30</div>
        <div className="sk-title" style={{ fontSize: 26, lineHeight: 1.05, marginTop: 2 }}>
          还有 <Squig>4 件</Squig> 没做
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        <div className="sk-meta" style={{ paddingLeft: 4 }}>认领看板</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          <div className="sk sk-rough" style={{ padding: 8 }}>
            <div className="sk-hand" style={{ fontSize: 13, fontWeight: 600 }}>晨跑 5k</div>
            <div className="sk-meta" style={{ marginTop: 2 }}>跑步小队</div>
            <div style={{ display: 'flex', gap: -4, marginTop: 6 }}>
              <A name="我" sm />
              <A name="M" sm style={{ marginLeft: -6 }} />
            </div>
          </div>
          <div className="sk sk-rough" style={{ padding: 8, background: 'var(--highlight)' }}>
            <div className="sk-hand" style={{ fontSize: 13, fontWeight: 600 }}>倒垃圾 ⚠</div>
            <div className="sk-meta" style={{ marginTop: 2 }}>室友群 · 没人</div>
            <div className="sk-hand" style={{ fontSize: 11, marginTop: 4 }}>谁先认?</div>
          </div>
          <div className="sk sk-rough" style={{ padding: 8 }}>
            <div className="sk-hand" style={{ fontSize: 13, fontWeight: 600 }}>读 30 页</div>
            <div className="sk-meta" style={{ marginTop: 2 }}>读书会</div>
            <A name="我" sm style={{ marginTop: 6 }} />
          </div>
          <div className="sk sk-rough" style={{ padding: 8 }}>
            <div className="sk-hand" style={{ fontSize: 13, fontWeight: 600 }}>吃药</div>
            <div className="sk-meta" style={{ marginTop: 2 }}>个人</div>
            <div className="sk-hand" style={{ fontSize: 11, marginTop: 4 }}>20:00</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 12px 0' }}>
        <div className="sk-meta">已完成 · 2</div>
        <div className="sk-row" style={{ opacity: 0.55 }}>
          <span className="sk-check done" />
          <div className="sk-hand" style={{ fontSize: 14, textDecoration: 'line-through', flex: 1 }}>买洗衣液</div>
          <A name="M" sm />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar">
          <div className="active">今天</div><div>群组</div><div>+</div><div>戳人</div><div>我</div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function HomeWild() {
  return (
    <PhoneFrame>
      <div style={{ padding: '12px 14px' }}>
        <div className="sk-meta">未完成的事，会自动「升温」</div>
      </div>

      {/* heat meter */}
      <div style={{ padding: '0 14px' }}>
        <div className="sk sk-rough" style={{ padding: 10, position: 'relative' }}>
          <div className="sk-hand" style={{ fontSize: 17, fontWeight: 700 }}>倒垃圾 🔥</div>
          <div className="sk-hand" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>已经 8 小时没人动</div>
          <div style={{ marginTop: 6, height: 8, border: '1.2px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '85%', height: '100%', background: 'var(--accent-poke)' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <span className="sk-claim">我来</span>
            <span className="sk-poke">戳室友</span>
            <span className="sk-chip" style={{ marginLeft: 'auto' }}>赖账榜 +1</span>
          </div>
        </div>

        <div className="sk sk-rough" style={{ padding: 10, marginTop: 8 }}>
          <div className="sk-hand" style={{ fontSize: 17, fontWeight: 700 }}>晨跑 5k</div>
          <div className="sk-hand" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>2 小时后 · 阿May 也去</div>
          <div style={{ marginTop: 6, height: 8, border: '1.2px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '20%', height: '100%', background: 'var(--ink-faint)' }} />
          </div>
        </div>

        <div className="sk sk-rough sk-dashed" style={{ padding: 10, marginTop: 8, textAlign: 'center' }}>
          <div className="sk-hand" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>都做完了 · 加点啥?</div>
          <div className="sk-arrow" style={{ display: 'block', margin: '4px auto 0', transform: 'rotate(8deg)' }} />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 80, right: 14 }}>
        <div className="sk-btn primary" style={{ borderRadius: 999, padding: '8px 14px', boxShadow: '2px 3px 0 var(--line)' }}>+ 提醒</div>
      </div>

      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar">
          <div className="active">今天</div><div>群组</div><div>+</div><div>戳人</div><div>我</div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─────────────────────────────────────
// GROUPS LIST
// ─────────────────────────────────────
function GroupsClassic() {
  const groups = [
    { n: '跑步小队', last: '阿May 完成了「晨跑 5k」', count: 6, badge: 2 },
    { n: '室友 · 309', last: '倒垃圾 还没人认领', count: 4, badge: '!' },
    { n: '读书会', last: '本周读 30 页', count: 3, badge: null },
    { n: '吃药打卡', last: '只有我自己', count: 1, badge: null },
  ];
  return (
    <PhoneFrame>
      <div style={{ padding: '14px 14px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="sk-title" style={{ fontSize: 22 }}>群组</div>
        <div className="sk-btn" style={{ padding: '3px 10px', fontSize: 14 }}>+ 新建</div>
      </div>
      <div className="sk-divider" style={{ margin: '4px 14px' }} />
      <div>
        {groups.map((g) => (
          <div key={g.n} className="sk-row" style={{ padding: '10px 14px' }}>
            <div className="sk-avatar lg" style={{ borderRadius: '14px 8px 12px 6px / 6px 12px 8px 14px' }}>{g.n[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sk-hand" style={{ fontSize: 16, fontWeight: 600 }}>{g.n}</div>
              <div className="sk-hand" style={{ fontSize: 12, color: 'var(--ink-mute)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.last}</div>
            </div>
            {g.badge && <div className="sk-chip" style={{ background: g.badge === '!' ? 'var(--accent-poke)' : 'var(--ink)', color: '#fff', minWidth: 22, justifyContent: 'center', padding: '2px 7px' }}>{g.badge}</div>}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar"><div>今天</div><div className="active">群组</div><div>+</div><div>戳人</div><div>我</div></div>
      </div>
    </PhoneFrame>
  );
}

function GroupsCards() {
  return (
    <PhoneFrame>
      <div style={{ padding: '14px' }}>
        <div className="sk-title" style={{ fontSize: 22 }}>我的群组</div>
        <div className="sk-meta" style={{ marginTop: 2 }}>4 个群 · 共 14 件提醒</div>
      </div>

      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="sk sk-rough tilt-1" style={{ padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="sk-hand" style={{ fontSize: 16, fontWeight: 700 }}>跑步小队</span>
            <span className="sk-meta">3 人</span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="sk-chip">晨跑 5k</span>
            <span className="sk-chip">周日长跑</span>
            <span className="sk-chip" style={{ background: 'var(--ink)', color: '#fff' }}>+4</span>
          </div>
          <div style={{ display: 'flex', gap: -4, marginTop: 8 }}>
            <A name="我" sm /><A name="M" sm style={{ marginLeft: -6 }} /><A name="J" sm style={{ marginLeft: -6 }} />
          </div>
        </div>

        <div className="sk sk-rough tilt-2" style={{ padding: 10, background: 'var(--highlight)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="sk-hand" style={{ fontSize: 16, fontWeight: 700 }}>室友 · 309</span>
            <span className="sk-poke">⚠ 1 件没人</span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="sk-chip">倒垃圾</span>
            <span className="sk-chip">水电费</span>
          </div>
        </div>

        <div className="sk sk-rough tilt-1" style={{ padding: 10 }}>
          <div className="sk-hand" style={{ fontSize: 16, fontWeight: 700 }}>读书会</div>
          <div className="sk-meta" style={{ marginTop: 2 }}>本周 · 30 页</div>
        </div>

        <div className="sk sk-rough sk-dashed" style={{ padding: 12, textAlign: 'center' }}>
          <div className="sk-hand" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>+ 建一个新群</div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar"><div>今天</div><div className="active">群组</div><div>+</div><div>戳人</div><div>我</div></div>
      </div>
    </PhoneFrame>
  );
}

function GroupsTimeline() {
  return (
    <PhoneFrame>
      <div style={{ padding: '14px 14px 4px' }}>
        <div className="sk-title" style={{ fontSize: 22 }}>动态</div>
        <div className="sk-meta">所有群最近发生</div>
      </div>

      <div style={{ padding: '6px 14px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 24, top: 14, bottom: 14, borderLeft: '1.5px dashed var(--ink-faint)' }} />
        {[
          { who: 'M', g: '跑步小队', what: '完成 晨跑 5k', tag: 'done', t: '14:02' },
          { who: 'J', g: '室友 · 309', what: '戳了 我「倒垃圾」', tag: 'poke', t: '13:40' },
          { who: '我', g: '读书会', what: '加了 本周 30 页', tag: 'add', t: '11:08' },
          { who: 'M', g: '室友 · 309', what: '认领 水电费', tag: 'claim', t: '昨天' },
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'flex-start', position: 'relative' }}>
            <A name={e.who} />
            <div style={{ flex: 1 }}>
              <div className="sk-hand" style={{ fontSize: 14 }}>
                <strong>{e.who}</strong> · <span style={{ color: 'var(--ink-mute)' }}>{e.g}</span>
              </div>
              <div className="sk-hand" style={{ fontSize: 14, marginTop: 1 }}>
                {e.tag === 'poke' && <span className="sk-poke" style={{ marginRight: 4, fontSize: 11 }}>戳</span>}
                {e.tag === 'claim' && <span className="sk-claim" style={{ marginRight: 4, fontSize: 11 }}>认</span>}
                {e.tag === 'done' && <span className="sk-check done" style={{ marginRight: 4, transform: 'translateY(3px)' }} />}
                {e.what}
              </div>
              <div className="sk-meta">{e.t}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar"><div>今天</div><div className="active">群组</div><div>+</div><div>戳人</div><div>我</div></div>
      </div>
    </PhoneFrame>
  );
}

// ─────────────────────────────────────
// GROUP DETAIL — shared list
// ─────────────────────────────────────
function GroupDetailList() {
  return (
    <PhoneFrame>
      <div style={{ padding: '14px 14px 8px' }}>
        <div className="sk-meta">← 群组</div>
        <div className="sk-title" style={{ fontSize: 22, marginTop: 2 }}>室友 · 309</div>
        <div style={{ display: 'flex', gap: -4, marginTop: 4, alignItems: 'center' }}>
          <A name="我" sm /><A name="M" sm style={{ marginLeft: -6 }} /><A name="J" sm style={{ marginLeft: -6 }} />
          <span className="sk-meta" style={{ marginLeft: 8 }}>3 人 · 邀请</span>
        </div>
      </div>
      <div className="sk-divider" style={{ margin: '4px 14px' }} />

      <div style={{ padding: '0 14px' }}>
        {[
          { t: '倒垃圾', sub: '今晚 · 没人认领', state: 'open', poke: true },
          { t: '水电费', sub: '月底 · @M', state: 'assigned', who: 'M' },
          { t: '买洗衣液', sub: '已完成 · @M · 14:02', state: 'done', who: 'M' },
          { t: '清冰箱', sub: '本周内', state: 'open' },
        ].map((r, i) => (
          <div key={i} className="sk-row" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <span className={`sk-check ${r.state === 'done' ? 'done' : ''}`} />
            <div style={{ flex: 1, opacity: r.state === 'done' ? 0.5 : 1 }}>
              <div className="sk-hand" style={{ fontSize: 15, fontWeight: 600, textDecoration: r.state === 'done' ? 'line-through' : 'none' }}>{r.t}</div>
              <div className="sk-hand" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{r.sub}</div>
            </div>
            {r.state === 'open' && !r.poke && <span className="sk-claim">认领</span>}
            {r.poke && <span className="sk-poke">戳</span>}
            {r.who && r.state !== 'done' && <A name={r.who} sm />}
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 60, right: 14 }}>
        <div className="sk-btn primary" style={{ borderRadius: 999, padding: '8px 14px', boxShadow: '2px 3px 0 var(--line)' }}>+ 加提醒</div>
      </div>
      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar"><div>今天</div><div className="active">群组</div><div>+</div><div>戳人</div><div>我</div></div>
      </div>
    </PhoneFrame>
  );
}

function GroupDetailColumns() {
  const cols = [
    { name: '没人认领', items: [{ t: '倒垃圾', poke: true }, { t: '清冰箱' }] },
    { name: '进行中', items: [{ t: '水电费', who: 'M' }, { t: '换灯泡', who: 'J' }] },
    { name: '完成', items: [{ t: '买洗衣液', who: 'M', done: true }] },
  ];
  return (
    <PhoneFrame>
      <div style={{ padding: '12px 14px 4px' }}>
        <div className="sk-meta">← 群组</div>
        <div className="sk-title" style={{ fontSize: 20 }}>室友 · 309 — 看板</div>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '6px 8px', overflowX: 'auto', height: 360 }}>
        {cols.map((c) => (
          <div key={c.name} className="sk sk-rough" style={{ minWidth: 120, padding: 6, background: c.name === '没人认领' ? 'var(--highlight)' : 'var(--paper)' }}>
            <div className="sk-meta" style={{ paddingLeft: 2 }}>{c.name}</div>
            {c.items.map((it, i) => (
              <div key={i} className="sk sk-rough" style={{ padding: 6, marginTop: 6, background: '#fff' }}>
                <div className="sk-hand" style={{ fontSize: 13, fontWeight: 600, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.5 : 1 }}>{it.t}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  {it.who && <A name={it.who} sm />}
                  {it.poke && <span className="sk-poke" style={{ fontSize: 11, padding: '1px 6px' }}>戳</span>}
                </div>
              </div>
            ))}
            <div className="sk sk-rough sk-dashed" style={{ padding: 4, marginTop: 6, textAlign: 'center', fontFamily: 'var(--hand)', fontSize: 11, color: 'var(--ink-mute)' }}>+</div>
          </div>
        ))}
      </div>
      <Anno style={{ padding: '0 14px' }}>左右滑动 · 拖动卡片可指派给某人</Anno>
      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar"><div>今天</div><div className="active">群组</div><div>+</div><div>戳人</div><div>我</div></div>
      </div>
    </PhoneFrame>
  );
}

function GroupDetailChat() {
  return (
    <PhoneFrame>
      <div style={{ padding: '12px 14px 4px' }}>
        <div className="sk-meta">← 室友 · 309</div>
        <div className="sk-title" style={{ fontSize: 18 }}>聊天 + 提醒</div>
      </div>
      <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
          <div className="sk-meta">M · 13:40</div>
          <div className="sk sk-rough" style={{ padding: 8 }}>
            <div className="sk-hand" style={{ fontSize: 13 }}>谁今晚倒垃圾？</div>
          </div>
        </div>

        {/* a "reminder" inline card in chat */}
        <div style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
          <div className="sk-meta">M 把消息变成了提醒</div>
          <div className="sk sk-rough" style={{ padding: 8, background: 'var(--highlight)' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="sk-check" />
              <div style={{ flex: 1 }}>
                <div className="sk-hand" style={{ fontSize: 14, fontWeight: 600 }}>倒垃圾 · 今晚</div>
                <div className="sk-meta">点 · 认领 / 戳人</div>
              </div>
              <span className="sk-claim" style={{ fontSize: 11 }}>我</span>
            </div>
          </div>
        </div>

        <div style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
          <div className="sk-meta" style={{ textAlign: 'right' }}>我 · 13:42</div>
          <div className="sk sk-rough" style={{ padding: 8, background: 'var(--ink)', color: '#fff' }}>
            <div className="sk-hand" style={{ fontSize: 13 }}>我来吧</div>
          </div>
        </div>
      </div>

      {/* composer */}
      <div style={{ position: 'absolute', bottom: 48, left: 8, right: 8 }}>
        <div className="sk sk-rough" style={{ padding: 6, display: 'flex', alignItems: 'center', gap: 6, background: '#fff' }}>
          <Bell />
          <div className="sk-hand" style={{ flex: 1, fontSize: 13, color: 'var(--ink-mute)' }}>说点什么 · 长按变提醒</div>
          <span className="sk-btn primary" style={{ padding: '2px 8px', fontSize: 13 }}>↑</span>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─────────────────────────────────────
// CREATE / EDIT REMINDER
// ─────────────────────────────────────
function CreateForm() {
  return (
    <PhoneFrame>
      <div style={{ padding: '12px 14px' }}>
        <div className="sk-meta">取消 · 新提醒 · 完成</div>
      </div>
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div className="sk-meta">内容</div>
          <div className="sk sk-rough" style={{ padding: 8, fontFamily: 'var(--hand)', fontSize: 18 }}>晨跑 5km|</div>
        </div>
        <div>
          <div className="sk-meta">时间</div>
          <div className="sk sk-rough" style={{ padding: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span className="sk-hand" style={{ fontSize: 15 }}>明早 7:00</span>
            <span className="sk-hand" style={{ fontSize: 15, color: 'var(--ink-mute)' }}>每周一三五 ›</span>
          </div>
        </div>
        <div>
          <div className="sk-meta">分享给</div>
          <div className="sk sk-rough" style={{ padding: 8 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <span className="sk-chip" style={{ background: 'var(--ink)', color: '#fff' }}>跑步小队 ×</span>
              <span className="sk-chip">+ 加群组 / 人</span>
            </div>
          </div>
        </div>
        <div>
          <div className="sk-meta">指派</div>
          <div className="sk sk-rough" style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="sk-hand" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>谁来做？</span>
            <span className="sk-chip">我</span>
            <span className="sk-chip">阿May</span>
            <span className="sk-chip" style={{ background: 'var(--highlight)' }}>谁先抢谁做</span>
          </div>
        </div>
        <div>
          <div className="sk-meta">附</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="sk sk-rough" style={{ width: 50, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
            <div className="sk sk-rough" style={{ width: 50, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎤</div>
            <div className="sk sk-rough" style={{ width: 50, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>😀</div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function CreateInline() {
  return (
    <PhoneFrame>
      <div style={{ padding: '12px 14px 6px' }}>
        <div className="sk-meta">新提醒</div>
        <div className="sk-title" style={{ fontSize: 22, marginTop: 2 }}>就这样写一句</div>
      </div>
      <div style={{ padding: '0 14px' }}>
        <div className="sk sk-rough" style={{ padding: 12, fontFamily: 'var(--hand)', fontSize: 18, lineHeight: 1.5 }}>
          <Hl>明早 7 点</Hl> 跟 <span className="sk-chip" style={{ background: 'var(--accent-claim)', color: '#fff', verticalAlign: '2px' }}>@阿May</span> 在 <Hl>东门</Hl> 一起跑 <Hl>5k</Hl> 发到 <span className="sk-chip" style={{ background: 'var(--ink)', color: '#fff', verticalAlign: '2px' }}># 跑步小队</span>
        </div>
        <Anno style={{ marginTop: 6 }}>自动识别：时间 · 人 · 地点 · 群</Anno>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span className="sk-chip">7:00 ›</span>
        <span className="sk-chip">@阿May ›</span>
        <span className="sk-chip">#跑步小队 ›</span>
        <span className="sk-chip" style={{ background: 'var(--highlight)' }}>+ 重复</span>
        <span className="sk-chip">+ 语音</span>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', gap: 8 }}>
        <div className="sk-btn" style={{ flex: 1, justifyContent: 'center' }}>取消</div>
        <div className="sk-btn primary" style={{ flex: 2, justifyContent: 'center' }}>放进 跑步小队</div>
      </div>
    </PhoneFrame>
  );
}

function CreateQuick() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-title" style={{ fontSize: 22 }}>快速 · 哒哒哒</div>
        <Anno>一行一条 · 用 / 给群 · 用 @ 给人</Anno>
      </div>
      <div style={{ padding: '6px 14px', fontFamily: 'var(--hand)', fontSize: 16, lineHeight: 1.7 }}>
        <div className="sk-row" style={{ padding: '4px 0', borderBottom: '1.2px dashed var(--ink-faint)' }}>
          <span className="sk-mono" style={{ color: 'var(--ink-mute)', fontSize: 12, width: 14 }}>1</span>
          <span style={{ flex: 1 }}>倒垃圾 今晚 <span style={{ color: 'var(--accent-claim)' }}>/室友309</span></span>
          <span className="sk-meta">✓</span>
        </div>
        <div className="sk-row" style={{ padding: '4px 0', borderBottom: '1.2px dashed var(--ink-faint)' }}>
          <span className="sk-mono" style={{ color: 'var(--ink-mute)', fontSize: 12, width: 14 }}>2</span>
          <span style={{ flex: 1 }}>买牛奶 周六 <span style={{ color: 'var(--accent-claim)' }}>/室友309</span> <span style={{ color: 'var(--accent-poke)' }}>@M</span></span>
          <span className="sk-meta">✓</span>
        </div>
        <div className="sk-row" style={{ padding: '4px 0', borderBottom: '1.2px dashed var(--ink-faint)' }}>
          <span className="sk-mono" style={{ color: 'var(--ink-mute)', fontSize: 12, width: 14 }}>3</span>
          <span style={{ flex: 1, color: 'var(--ink-mute)' }}>晨跑 7:00 重复 一三五 |</span>
        </div>
        <div className="sk-row" style={{ padding: '4px 0' }}>
          <span className="sk-mono" style={{ color: 'var(--ink-mute)', fontSize: 12, width: 14 }}>+</span>
          <span style={{ flex: 1, color: 'var(--ink-faint)' }}>...</span>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
        <div className="sk-btn primary" style={{ width: '100%', justifyContent: 'center' }}>全部入库 · 3 条</div>
      </div>
    </PhoneFrame>
  );
}

// ─────────────────────────────────────
// INVITE
// ─────────────────────────────────────
function InviteLink() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-meta">← 室友 · 309</div>
        <div className="sk-title" style={{ fontSize: 22, marginTop: 2 }}>邀请加入</div>
      </div>
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div className="sk sk-rough" style={{ width: 130, height: 130, padding: 8, position: 'relative' }}>
          <div className="sk-img" style={{ width: '100%', height: '100%', backgroundImage: `repeating-conic-gradient(var(--line) 0 4%, transparent 4% 8%)` }}>QR</div>
        </div>
        <div className="sk-hand" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>扫一扫加入</div>
        <div className="sk sk-rough" style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 12 }}>rmd.so/g/ROOM-309</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span className="sk-btn">复制</span>
          <span className="sk-btn">分享 ›</span>
          <span className="sk-btn primary">微信</span>
        </div>
      </div>
      <div style={{ padding: '14px' }}>
        <Anno>链接 24h 有效 · 进群默认「成员」</Anno>
      </div>
    </PhoneFrame>
  );
}

function InviteSearch() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-meta">← 室友 · 309</div>
        <div className="sk-title" style={{ fontSize: 22, marginTop: 2 }}>找人 · 加入</div>
      </div>
      <div style={{ padding: '0 14px' }}>
        <div className="sk sk-rough" style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="sk-mono" style={{ color: 'var(--ink-mute)' }}>🔍</span>
          <span className="sk-hand" style={{ fontSize: 15 }}>阿M|</span>
        </div>
        <div className="sk-meta" style={{ marginTop: 12 }}>建议</div>
        {[
          { n: '阿May', sub: '常一起跑步', add: '邀请', sel: true },
          { n: '阿明', sub: '跑步小队', add: '邀请' },
          { n: 'Mia', sub: '通讯录', add: '邀请' },
        ].map((p, i) => (
          <div key={i} className="sk-row">
            <A name={p.n[0]} />
            <div style={{ flex: 1 }}>
              <div className="sk-hand" style={{ fontSize: 15, fontWeight: 600 }}>{p.n}</div>
              <div className="sk-meta">{p.sub}</div>
            </div>
            <span className="sk-chip" style={{ background: p.sel ? 'var(--ink)' : 'transparent', color: p.sel ? '#fff' : 'var(--ink)' }}>{p.sel ? '✓ 已选' : '+ 选'}</span>
          </div>
        ))}
        <div className="sk-meta" style={{ marginTop: 8 }}>从其他群组</div>
        <div className="sk-row">
          <div className="sk-avatar lg">跑</div>
          <div style={{ flex: 1 }}>
            <div className="sk-hand" style={{ fontSize: 15 }}>跑步小队 · 全部</div>
            <div className="sk-meta">3 人</div>
          </div>
          <span className="sk-chip">+ 全选</span>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
        <div className="sk-btn primary" style={{ width: '100%', justifyContent: 'center' }}>邀请 1 人</div>
      </div>
    </PhoneFrame>
  );
}

function InvitePoster() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-meta">分享 · 海报</div>
      </div>
      <div style={{ padding: '0 14px' }}>
        <div className="sk sk-rough" style={{ padding: 14, background: 'var(--paper-warm)', textAlign: 'center', position: 'relative' }}>
          <div className="sk-meta">你被邀请加入</div>
          <div className="sk-title" style={{ fontSize: 26, marginTop: 4 }}>室友 · 309</div>
          <div className="sk-hand" style={{ fontSize: 14, marginTop: 6, color: 'var(--ink-soft)' }}>"轮流倒垃圾，谁忘了打榜"</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: -4, marginTop: 10 }}>
            <A name="我" /><A name="M" style={{ marginLeft: -8 }} /><A name="J" style={{ marginLeft: -8 }} />
          </div>
          <div className="sk-meta" style={{ marginTop: 8 }}>3 人已在</div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
            <div className="sk sk-rough" style={{ width: 70, height: 70, padding: 4, background: '#fff' }}>
              <div className="sk-img" style={{ width: '100%', height: '100%', backgroundImage: `repeating-conic-gradient(var(--line) 0 4%, transparent 4% 8%)`, fontSize: 9 }}>QR</div>
            </div>
          </div>
          <div className="sk-mono" style={{ fontSize: 10, marginTop: 6 }}>rmd.so/g/ROOM-309</div>

          <div className="sk-arrow" style={{ position: 'absolute', top: -10, right: -10, transform: 'rotate(40deg)' }} />
          <div className="sk-hand" style={{ position: 'absolute', top: -28, right: 4, fontSize: 12, transform: 'rotate(-8deg)' }}>截图发出去</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <span className="sk-btn" style={{ flex: 1, justifyContent: 'center' }}>保存图片</span>
          <span className="sk-btn primary" style={{ flex: 1, justifyContent: 'center' }}>发出去 ›</span>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─────────────────────────────────────
// POKE — single person
// ─────────────────────────────────────
function PokePicker() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-title" style={{ fontSize: 22 }}>戳一下 · 谁?</div>
      </div>
      <div style={{ padding: '0 14px' }}>
        <div className="sk sk-rough" style={{ padding: 8 }}>
          <div className="sk-hand" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>🔍 找人</div>
        </div>
        <div className="sk-meta" style={{ marginTop: 10 }}>最近戳过</div>
        <div style={{ display: 'flex', gap: 14, padding: '6px 0', overflowX: 'auto' }}>
          {['M', 'J', '爸', 'L', 'P'].map((n) => (
            <div key={n} style={{ textAlign: 'center', flexShrink: 0 }}>
              <A name={n} lg />
              <div className="sk-hand" style={{ fontSize: 12, marginTop: 4 }}>{n === 'M' ? '阿May' : n === 'J' ? '阿J' : n}</div>
            </div>
          ))}
        </div>
        <div className="sk-meta" style={{ marginTop: 8 }}>所有联系人</div>
        {[
          { n: '阿May', sub: '在 跑步小队' },
          { n: '阿J', sub: '在 室友 · 309' },
          { n: '老王', sub: '从未戳过' },
        ].map((p, i) => (
          <div key={i} className="sk-row">
            <A name={p.n[0]} />
            <div style={{ flex: 1 }}>
              <div className="sk-hand" style={{ fontSize: 14 }}>{p.n}</div>
              <div className="sk-meta">{p.sub}</div>
            </div>
            <span className="sk-poke">戳</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar"><div>今天</div><div>群组</div><div>+</div><div className="active">戳人</div><div>我</div></div>
      </div>
    </PhoneFrame>
  );
}

function PokeCompose() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <A name="M" lg />
        <div>
          <div className="sk-title" style={{ fontSize: 18 }}>戳 · 阿May</div>
          <div className="sk-meta">最近你们一起 · 跑步小队</div>
        </div>
      </div>
      <div style={{ padding: '0 14px' }}>
        <div className="sk sk-rough" style={{ padding: 12, background: 'var(--accent-poke)', color: '#fff' }}>
          <div className="sk-hand" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>该 倒 垃 圾 啦</div>
          <div className="sk-hand" style={{ fontSize: 13, marginTop: 6, opacity: 0.9 }}>· 来自 我</div>
        </div>
        <Anno style={{ marginTop: 6 }}>她会收到一条「戳」推送 · 不能静音</Anno>

        <div className="sk-meta" style={{ marginTop: 14 }}>常用模板</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {['该 X 啦', '别忘了 X', '到点 X', '你又拖了 ⏰', '快快快 🔥'].map((t) => (
            <span key={t} className="sk-chip">{t}</span>
          ))}
        </div>

        <div className="sk-meta" style={{ marginTop: 14 }}>顺便附</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="sk sk-rough" style={{ width: 44, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
          <div className="sk sk-rough" style={{ width: 44, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎤</div>
          <div className="sk sk-rough" style={{ width: 44, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📍</div>
          <div className="sk sk-rough" style={{ width: 44, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏰</div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
        <div className="sk-btn poke" style={{ width: '100%', justifyContent: 'center', fontSize: 18 }}>戳！</div>
      </div>
    </PhoneFrame>
  );
}

function PokeButton() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14, textAlign: 'center' }}>
        <div className="sk-meta">长按 · 录一段 · 松手发出</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, height: 380 }}>
        <A name="M" lg style={{ width: 80, height: 80, fontSize: 28 }} />
        <div className="sk-title" style={{ fontSize: 22, marginTop: 10 }}>阿 May</div>
        <div className="sk-hand" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>已经 8 小时没动 · 倒垃圾</div>

        {/* big poke button with concentric ripples */}
        <div style={{ marginTop: 24, position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="sk sk-rough sk-dashed" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
          <div className="sk sk-rough sk-dashed" style={{ position: 'absolute', inset: 14, borderRadius: '50%' }} />
          <div className="sk sk-rough" style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--accent-poke)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--hand)', fontSize: 30, fontWeight: 700, boxShadow: '3px 4px 0 var(--line)' }}>戳</div>
        </div>
        <div className="sk-hand" style={{ fontSize: 14, marginTop: 12 }}>已戳 7 次今天 · 她会火</div>
      </div>
    </PhoneFrame>
  );
}

// ─────────────────────────────────────
// REMINDER DETAIL
// ─────────────────────────────────────
function DetailFeed() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-meta">← 室友 · 309</div>
        <div className="sk-title" style={{ fontSize: 22, marginTop: 2 }}>倒垃圾 · 今晚</div>
        <div className="sk-meta">每周一三五 · 轮流</div>
      </div>
      <div style={{ padding: '0 14px' }}>
        <div className="sk sk-rough" style={{ padding: 10, display: 'flex', gap: 8, alignItems: 'center', background: 'var(--highlight)' }}>
          <span className="sk-claim" style={{ fontSize: 14 }}>认领</span>
          <span className="sk-hand" style={{ fontSize: 14 }}>谁先点谁做 · 截止 21:00</span>
        </div>

        <div className="sk-meta" style={{ marginTop: 12 }}>赖账榜 · 这条提醒</div>
        <div className="sk sk-rough" style={{ padding: 8 }}>
          <div className="sk-row" style={{ padding: '4px 0', borderBottom: '1.2px dashed var(--ink-faint)' }}>
            <span className="sk-mono" style={{ width: 14, fontSize: 12 }}>1</span>
            <A name="J" sm />
            <div style={{ flex: 1 }} className="sk-hand">阿 J</div>
            <div className="sk-mono" style={{ fontSize: 11 }}>4 次没做</div>
          </div>
          <div className="sk-row" style={{ padding: '4px 0', borderBottom: '1.2px dashed var(--ink-faint)' }}>
            <span className="sk-mono" style={{ width: 14, fontSize: 12 }}>2</span>
            <A name="M" sm />
            <div style={{ flex: 1 }} className="sk-hand">阿 May</div>
            <div className="sk-mono" style={{ fontSize: 11 }}>2</div>
          </div>
          <div className="sk-row" style={{ padding: '4px 0' }}>
            <span className="sk-mono" style={{ width: 14, fontSize: 12 }}>3</span>
            <A name="我" sm />
            <div style={{ flex: 1 }} className="sk-hand">我 · 模范</div>
            <div className="sk-mono" style={{ fontSize: 11 }}>0</div>
          </div>
        </div>

        <div className="sk-meta" style={{ marginTop: 12 }}>评论</div>
        <div className="sk sk-rough" style={{ padding: 8 }}>
          <div className="sk-hand" style={{ fontSize: 13 }}><strong>M:</strong> 上次是我 这次该 J</div>
          <div className="sk-hand" style={{ fontSize: 13, marginTop: 4 }}><strong>J:</strong> ... 好</div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', gap: 8 }}>
        <div className="sk-btn poke" style={{ flex: 1, justifyContent: 'center' }}>戳 J</div>
        <div className="sk-btn primary" style={{ flex: 2, justifyContent: 'center' }}>我来认领</div>
      </div>
    </PhoneFrame>
  );
}

function DetailReceipt() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-meta">已完成 · 14:02</div>
        <div className="sk-title" style={{ fontSize: 22, marginTop: 2 }}>买洗衣液 ✓</div>
      </div>
      <div style={{ padding: '0 14px' }}>
        <div className="sk sk-rough" style={{ padding: 10 }}>
          <div className="sk-hand" style={{ fontSize: 14 }}>谁做的</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <A name="M" lg />
            <div>
              <div className="sk-hand" style={{ fontSize: 16, fontWeight: 600 }}>阿 May</div>
              <div className="sk-meta">用时 18 分钟</div>
            </div>
          </div>
        </div>

        <div className="sk-meta" style={{ marginTop: 10 }}>她留了一张照片</div>
        <div className="sk-img tilt-2" style={{ height: 100 }}>洗衣液 · 收据 placeholder</div>

        <div className="sk-meta" style={{ marginTop: 10 }}>反应</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="sk-chip">👍 我 · J</span>
          <span className="sk-chip">🌟 我</span>
          <span className="sk-chip">🍻</span>
          <span className="sk-chip">+</span>
        </div>

        <div className="sk-meta" style={{ marginTop: 10 }}>记账（如有）</div>
        <div className="sk sk-rough" style={{ padding: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span className="sk-hand" style={{ fontSize: 14 }}>¥ 28.50 · AA</span>
          <span className="sk-chip">分账 ›</span>
        </div>
      </div>
    </PhoneFrame>
  );
}

function DetailHistory() {
  const rows = [
    { d: '本周三', who: '?', state: 'open' },
    { d: '上周一', who: 'M', state: 'done' },
    { d: '上周三', who: 'J', state: 'late', note: '迟了 4h' },
    { d: '上周五', who: '我', state: 'done' },
    { d: '上上周五', who: 'J', state: 'miss' },
  ];
  const c = (s) => s === 'done' ? 'var(--ink)' : s === 'late' ? 'var(--accent-poke)' : s === 'miss' ? 'var(--ink-faint)' : 'var(--accent-claim)';
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-meta">← 室友 · 309</div>
        <div className="sk-title" style={{ fontSize: 22, marginTop: 2 }}>倒垃圾 · 历史</div>
        <div className="sk-meta">12 周 · 28 次 · 4 次没人做</div>
      </div>
      <div style={{ padding: '0 14px' }}>
        {/* heatmap-ish row */}
        <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
          {Array.from({ length: 36 }).map((_, i) => {
            const r = (i * 7) % 11;
            const s = r < 1 ? 'miss' : r < 2 ? 'late' : r < 9 ? 'done' : 'open';
            return <div key={i} style={{ width: 14, height: 14, border: '1px solid var(--line)', background: c(s), borderRadius: 2 }} />;
          })}
        </div>
        <Anno style={{ marginTop: 4 }}>每格一次 · 红=迟到 · 灰=没做 · 黑=完成</Anno>

        <div className="sk-meta" style={{ marginTop: 14 }}>最近</div>
        {rows.map((r, i) => (
          <div key={i} className="sk-row" style={{ padding: '6px 0' }}>
            <div className="sk-meta" style={{ width: 56 }}>{r.d}</div>
            <A name={r.who} sm />
            <div style={{ flex: 1 }} className="sk-hand">
              {r.state === 'done' && '✓ 完成'}
              {r.state === 'late' && <>⚠ 迟到 · <span style={{ color: 'var(--ink-mute)' }}>{r.note}</span></>}
              {r.state === 'miss' && '✗ 没做'}
              {r.state === 'open' && '… 还没人做'}
            </div>
            {r.state === 'open' && <span className="sk-claim" style={{ fontSize: 12 }}>认</span>}
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

// ─────────────────────────────────────
// ME / NOTIFICATIONS
// ─────────────────────────────────────
function MeProfile() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <A name="我" lg style={{ width: 56, height: 56, fontSize: 24 }} />
        <div>
          <div className="sk-title" style={{ fontSize: 22 }}>夏 · 我自己</div>
          <div className="sk-meta">在 4 个群组</div>
        </div>
      </div>
      <div style={{ padding: '0 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          <div className="sk sk-rough" style={{ padding: 8, textAlign: 'center' }}>
            <div className="sk-title" style={{ fontSize: 22 }}>92%</div>
            <div className="sk-meta">完成率</div>
          </div>
          <div className="sk sk-rough" style={{ padding: 8, textAlign: 'center' }}>
            <div className="sk-title" style={{ fontSize: 22 }}>0</div>
            <div className="sk-meta">赖账</div>
          </div>
          <div className="sk sk-rough" style={{ padding: 8, textAlign: 'center', background: 'var(--accent-poke)', color: '#fff' }}>
            <div className="sk-title" style={{ fontSize: 22 }}>17</div>
            <div className="sk-meta" style={{ color: '#fff', opacity: 0.8 }}>戳出</div>
          </div>
        </div>

        <div className="sk-meta" style={{ marginTop: 12 }}>赖账榜 · 我的圈子</div>
        <div className="sk sk-rough" style={{ padding: 8 }}>
          {[
            { n: '阿J', x: 4 },
            { n: '阿May', x: 2 },
            { n: '我', x: 0, me: true },
          ].map((p, i) => (
            <div key={i} className="sk-row" style={{ padding: '5px 0' }}>
              <span className="sk-mono" style={{ width: 14, fontSize: 12 }}>{i + 1}</span>
              <A name={p.n[0]} sm />
              <div style={{ flex: 1, fontWeight: p.me ? 700 : 400 }} className="sk-hand">{p.n}</div>
              <div className="sk-mono" style={{ fontSize: 11 }}>{p.x}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10, gap: 0 }}>
          {['提醒方式', '免打扰', '群组管理', '退出'].map((s) => (
            <div key={s} className="sk-row"><div style={{ flex: 1 }} className="sk-hand">{s}</div><span className="sk-meta">›</span></div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar"><div>今天</div><div>群组</div><div>+</div><div>戳人</div><div className="active">我</div></div>
      </div>
    </PhoneFrame>
  );
}

function MeInbox() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-title" style={{ fontSize: 22 }}>通知</div>
        <div className="sk-meta">今天 · 6 条</div>
      </div>
      <div style={{ padding: '0 14px' }}>
        {[
          { who: 'J', type: 'poke', t: '戳了你「倒垃圾」', tt: '5 分钟前', hot: true },
          { who: 'M', type: 'done', t: '完成了「买洗衣液」', tt: '14:02' },
          { who: '系统', type: 'sys', t: '本周赖账榜更新 · 你是模范 ✦', tt: '今早' },
          { who: 'J', type: 'invite', t: '加你进 室友 · 309', tt: '昨天' },
          { who: 'M', type: 'react', t: '🌟 给了你「晨跑 5k」', tt: '昨天' },
        ].map((n, i) => (
          <div key={i} className="sk-row" style={{ padding: '8px 0', background: n.hot ? 'var(--highlight)' : 'transparent', margin: n.hot ? '4px -8px' : '0', paddingLeft: n.hot ? 8 : 0, paddingRight: n.hot ? 8 : 0, borderRadius: n.hot ? 6 : 0 }}>
            <A name={n.who[0]} />
            <div style={{ flex: 1 }}>
              <div className="sk-hand" style={{ fontSize: 14 }}>
                {n.type === 'poke' && <span className="sk-poke" style={{ fontSize: 11, marginRight: 4 }}>戳</span>}
                {n.type === 'done' && <span className="sk-check done" style={{ marginRight: 4, transform: 'translateY(3px)' }} />}
                {n.t}
              </div>
              <div className="sk-meta">{n.tt}</div>
            </div>
            {n.type === 'poke' && <span className="sk-claim">我做</span>}
            {n.type === 'invite' && <span className="sk-chip" style={{ background: 'var(--ink)', color: '#fff' }}>接受</span>}
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

function MeWild() {
  return (
    <PhoneFrame>
      <div style={{ padding: 14 }}>
        <div className="sk-meta">本周 · 你的「能量」</div>
      </div>
      <div style={{ padding: '0 14px' }}>
        <div className="sk sk-rough" style={{ padding: 14, position: 'relative' }}>
          <div className="sk-title" style={{ fontSize: 30, lineHeight: 1.05 }}>
            你 <Hl>救了</Hl> 这个群 3 次
          </div>
          <div className="sk-hand" style={{ fontSize: 13, marginTop: 6, color: 'var(--ink-soft)' }}>没人认领时你出手 · 室友 · 309 已经爱你</div>
          <div className="sk-arrow" style={{ position: 'absolute', bottom: 10, right: 10, transform: 'rotate(-12deg)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
          <div className="sk sk-rough" style={{ padding: 8 }}>
            <div className="sk-meta">最爱戳的人</div>
            <div className="sk-hand" style={{ fontSize: 17 }}>阿 J · 7 次</div>
          </div>
          <div className="sk sk-rough" style={{ padding: 8 }}>
            <div className="sk-meta">最爱戳你</div>
            <div className="sk-hand" style={{ fontSize: 17 }}>阿 May · 4 次</div>
          </div>
          <div className="sk sk-rough" style={{ padding: 8, gridColumn: '1 / -1', background: 'var(--accent-claim)', color: '#fff' }}>
            <div className="sk-meta" style={{ color: '#fff', opacity: 0.8 }}>勋章</div>
            <div className="sk-hand" style={{ fontSize: 17 }}>✦ 模范室友 · 4 周连续 0 赖账</div>
          </div>
        </div>

        <Anno style={{ marginTop: 8 }}>每周日生成一张「战报卡」 · 可分享</Anno>
      </div>
      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0 }}>
        <div className="sk-tabbar"><div>今天</div><div>群组</div><div>+</div><div>戳人</div><div className="active">我</div></div>
      </div>
    </PhoneFrame>
  );
}

// ─────────────────────────────────────
// DESKTOP — one wide view to hint at responsive plan
// ─────────────────────────────────────
function DesktopOverview() {
  return (
    <BrowserFrame>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* sidebar */}
        <div style={{ width: 140, borderRight: '1.5px solid var(--line)', padding: 10, background: 'var(--paper-warm)' }}>
          <div className="sk-title" style={{ fontSize: 16 }}>提醒</div>
          <div className="sk-meta" style={{ marginTop: 8 }}>视图</div>
          <div className="sk-hand" style={{ fontSize: 13, marginTop: 4 }}>· 今天</div>
          <div className="sk-hand" style={{ fontSize: 13 }}>· 戳人</div>
          <div className="sk-meta" style={{ marginTop: 10 }}>群组</div>
          {['跑步小队', '室友 · 309', '读书会', '吃药'].map((g, i) => (
            <div key={g} className="sk-hand" style={{ fontSize: 12, padding: '2px 4px', background: i === 1 ? 'var(--ink)' : 'transparent', color: i === 1 ? '#fff' : 'var(--ink)', borderRadius: 4, marginTop: 2 }}>· {g}</div>
          ))}
          <div className="sk-meta" style={{ marginTop: 10 }}>+ 新群组</div>
        </div>

        {/* main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="sk-title" style={{ fontSize: 16 }}>室友 · 309</div>
            <div className="sk-meta">3 人</div>
            <div style={{ flex: 1 }} />
            <span className="sk-chip">+ 邀请</span>
            <span className="sk-btn primary" style={{ padding: '2px 8px', fontSize: 13 }}>+ 提醒</span>
          </div>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* list */}
            <div style={{ flex: 1.2, padding: 8, borderRight: '1.5px dashed var(--ink-faint)', overflow: 'hidden' }}>
              <div className="sk-meta">没人认领</div>
              <div className="sk sk-rough" style={{ padding: 6, marginTop: 4, background: 'var(--highlight)' }}>
                <div className="sk-hand" style={{ fontSize: 13, fontWeight: 700 }}>倒垃圾</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}><span className="sk-claim" style={{ fontSize: 10, padding: '0 5px' }}>认</span><span className="sk-poke" style={{ fontSize: 10, padding: '0 5px' }}>戳人</span></div>
              </div>
              <div className="sk sk-rough" style={{ padding: 6, marginTop: 4 }}>
                <div className="sk-hand" style={{ fontSize: 13 }}>清冰箱</div>
                <div className="sk-meta">本周内</div>
              </div>
              <div className="sk-meta" style={{ marginTop: 8 }}>已指派</div>
              <div className="sk sk-rough" style={{ padding: 6, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="sk-check" />
                  <span className="sk-hand" style={{ fontSize: 13, flex: 1 }}>水电费</span>
                  <A name="M" sm />
                </div>
              </div>
            </div>
            {/* detail panel */}
            <div style={{ flex: 1, padding: 8 }}>
              <div className="sk-meta">详情 · 倒垃圾</div>
              <div className="sk sk-rough" style={{ padding: 8, marginTop: 4 }}>
                <div className="sk-hand" style={{ fontSize: 12, fontWeight: 600 }}>谁先认领谁做 · 21:00 截止</div>
                <div className="sk-meta" style={{ marginTop: 4 }}>赖账榜</div>
                <div className="sk-hand" style={{ fontSize: 11, marginTop: 2 }}>1. J · 4　2. M · 2　3. 我 · 0</div>
                <div className="sk-meta" style={{ marginTop: 6 }}>评论</div>
                <div className="sk-hand" style={{ fontSize: 11 }}>M: 这次该 J ...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

Object.assign(window, {
  HomeFeed, HomeBoard, HomeWild,
  GroupsClassic, GroupsCards, GroupsTimeline,
  GroupDetailList, GroupDetailColumns, GroupDetailChat,
  CreateForm, CreateInline, CreateQuick,
  InviteLink, InviteSearch, InvitePoster,
  PokePicker, PokeCompose, PokeButton,
  DetailFeed, DetailReceipt, DetailHistory,
  MeProfile, MeInbox, MeWild,
  DesktopOverview,
});
