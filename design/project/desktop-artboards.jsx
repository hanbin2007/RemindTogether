// desktop-artboards.jsx — desktop versions of every flow node
// Loaded after artboards.jsx; reuses the BrowserFrame helper from there.

const DBrowser = ({ children, label }) => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 14, background: 'var(--paper-warm)', boxSizing: 'border-box' }}>
    <div className="sk-browser" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="sk-browser-bar"><span className="dot" /></div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex' }}>{children}</div>
    </div>
    {label && <div className="sk-meta" style={{ marginTop: 8 }}>{label}</div>}
  </div>
);

// Shared sidebar — almost every desktop screen has it
const Sidebar = ({ active = '今天', activeGroup = null }) => {
  const groups = ['跑步小队', '室友 · 309', '读书会', '吃药打卡'];
  return (
    <div style={{ width: 170, borderRight: '1.5px solid var(--line)', padding: 12, background: 'var(--paper-warm)', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="sk-title" style={{ fontSize: 18 }}>提醒 ·</div>
      <div className="sk-meta" style={{ marginTop: 12 }}>视图</div>
      {['今天', '即将', '所有', '戳人', '通知'].map(v => (
        <div key={v} className="sk-hand" style={{ fontSize: 13, padding: '2px 6px', marginTop: 2, background: v === active ? 'var(--ink)' : 'transparent', color: v === active ? '#fff' : 'var(--ink)', borderRadius: 4 }}>· {v}</div>
      ))}
      <div className="sk-meta" style={{ marginTop: 12 }}>群组</div>
      {groups.map(g => (
        <div key={g} className="sk-hand" style={{ fontSize: 13, padding: '2px 6px', marginTop: 2, background: g === activeGroup ? 'var(--ink)' : 'transparent', color: g === activeGroup ? '#fff' : 'var(--ink)', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>· {g}</div>
      ))}
      <div className="sk-meta" style={{ marginTop: 6 }}>+ 新群组</div>
      <div style={{ flex: 1 }} />
      <div className="sk-divider" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="sk-avatar sm">我</div>
        <div className="sk-hand" style={{ fontSize: 12 }}>夏 · 我自己</div>
      </div>
    </div>
  );
};

// ① TODAY — three desktop variations
function DT_TodayThreeCol() {
  return (
    <DBrowser>
      <Sidebar active="今天" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sk-title" style={{ fontSize: 18 }}>今天</div>
          <div className="sk-meta">周三 · 4 件待办</div>
          <div style={{ flex: 1 }} />
          <span className="sk-chip">⌘K 搜索</span>
          <span className="sk-btn primary" style={{ padding: '2px 10px', fontSize: 13 }}>+ 提醒</span>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: 10, borderRight: '1.5px dashed var(--ink-faint)', overflow: 'hidden' }}>
            <div className="sk-meta">来自 · 跑步小队</div>
            <div className="sk sk-rough" style={{ padding: 8, marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="sk-check" />
                <div style={{ flex: 1 }}>
                  <div className="sk-hand" style={{ fontSize: 14, fontWeight: 600 }}>晨跑 5km · 7:00</div>
                  <div className="sk-meta">@我 @阿May</div>
                </div>
                <span className="sk-poke" style={{ fontSize: 11 }}>戳</span>
              </div>
            </div>

            <div className="sk-meta" style={{ marginTop: 10 }}>来自 · 室友 · 309</div>
            <div className="sk sk-rough" style={{ padding: 8, marginTop: 4, background: 'var(--highlight)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="sk-check" />
                <div style={{ flex: 1 }}>
                  <div className="sk-hand" style={{ fontSize: 14, fontWeight: 600 }}>倒垃圾 · 没人认领 ⚠</div>
                  <div className="sk-meta">截止 21:00</div>
                </div>
                <span className="sk-claim" style={{ fontSize: 11 }}>认领</span>
              </div>
            </div>
            <div className="sk sk-rough" style={{ padding: 8, marginTop: 4, opacity: 0.55 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="sk-check done" />
                <div className="sk-hand" style={{ fontSize: 14, textDecoration: 'line-through' }}>买洗衣液</div>
                <div className="sk-meta">M · 14:02</div>
              </div>
            </div>

            <div className="sk-meta" style={{ marginTop: 10 }}>来自 · 个人</div>
            <div className="sk sk-rough" style={{ padding: 8, marginTop: 4 }}>
              <span className="sk-check" /> <span className="sk-hand" style={{ fontSize: 14 }}>吃药 · 20:00</span>
            </div>
          </div>
          <div style={{ width: 240, padding: 10, overflow: 'hidden' }}>
            <div className="sk-meta">详情 · 倒垃圾</div>
            <div className="sk sk-rough" style={{ padding: 8, marginTop: 4 }}>
              <div className="sk-hand" style={{ fontSize: 13, fontWeight: 600 }}>今晚 · 谁先认谁做</div>
              <div className="sk-meta" style={{ marginTop: 6 }}>加油榜</div>
              <div className="sk-hand" style={{ fontSize: 11, marginTop: 2 }}>1. J · 4　2. M · 2　3. 我 · 0</div>
              <div className="sk-meta" style={{ marginTop: 6 }}>评论</div>
              <div className="sk-hand" style={{ fontSize: 11 }}>M: 上次是我 这次该 J</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <span className="sk-btn poke" style={{ padding: '2px 8px', fontSize: 12 }}>戳 J</span>
                <span className="sk-btn primary" style={{ padding: '2px 8px', fontSize: 12 }}>我来</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DBrowser>
  );
}

function DT_TodayDigest() {
  return (
    <DBrowser>
      <Sidebar active="今天" />
      <div style={{ flex: 1, padding: 18, overflow: 'hidden' }}>
        <div className="sk-meta">早安 · 周三 04 · 30</div>
        <div className="sk-title" style={{ fontSize: 32, lineHeight: 1.05, marginTop: 4 }}>
          今天还有 <span className="sk-hl">4 件</span> 没做<br/>
          其中 <span className="sk-squig">1 件</span> 没人认领
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
          <div className="sk sk-rough" style={{ padding: 10, background: 'var(--highlight)' }}>
            <div className="sk-meta">需要你出手</div>
            <div className="sk-hand" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>倒垃圾 🔥</div>
            <div className="sk-hand" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>室友 · 309 · 8 小时无人动</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span className="sk-claim">我来</span>
              <span className="sk-poke">戳 J</span>
            </div>
          </div>
          <div className="sk sk-rough" style={{ padding: 10 }}>
            <div className="sk-meta">即将</div>
            <div className="sk-hand" style={{ fontSize: 16, fontWeight: 700 }}>晨跑 5k · 7:00</div>
            <div className="sk-hand" style={{ fontSize: 12 }}>跑步小队 · @我 @M</div>
          </div>
          <div className="sk sk-rough" style={{ padding: 10 }}>
            <div className="sk-meta">已完成 · 1</div>
            <div className="sk-hand" style={{ fontSize: 14, textDecoration: 'line-through', opacity: 0.6 }}>买洗衣液 · M 14:02</div>
          </div>
          <div className="sk sk-rough" style={{ padding: 10 }}>
            <div className="sk-meta">个人</div>
            <div className="sk-hand" style={{ fontSize: 14 }}>吃药 · 20:00</div>
          </div>
        </div>

        <div className="sk-meta" style={{ marginTop: 14 }}>顺便 · 你能戳的人</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span className="sk-chip">阿J · 4 次没动</span>
          <span className="sk-chip">阿May · 还没出门</span>
        </div>
      </div>
    </DBrowser>
  );
}

function DT_TodayCommand() {
  return (
    <DBrowser>
      <Sidebar active="今天" />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* dim base */}
        <div style={{ padding: 14, opacity: 0.35 }}>
          <div className="sk-title" style={{ fontSize: 18 }}>今天 · 4 件</div>
          <div className="sk sk-rough" style={{ padding: 6, marginTop: 8 }}>· 晨跑 5k · 7:00</div>
          <div className="sk sk-rough" style={{ padding: 6, marginTop: 4 }}>· 倒垃圾 ⚠</div>
          <div className="sk sk-rough" style={{ padding: 6, marginTop: 4 }}>· 吃药 20:00</div>
        </div>
        {/* command palette */}
        <div style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', width: 380 }}>
          <div className="sk sk-rough" style={{ padding: 0, background: '#fff', boxShadow: '4px 6px 0 var(--line)' }}>
            <div style={{ padding: '8px 10px', borderBottom: '1.5px dashed var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="sk-mono">⌘</span>
              <span className="sk-hand" style={{ fontSize: 16, flex: 1 }}>戳 阿J 倒垃圾|</span>
              <span className="sk-meta">esc</span>
            </div>
            {[
              { ic: '👉', t: '戳 阿J · 倒垃圾', s: '发推送 + 上加油榜', sel: true },
              { ic: '+', t: '新建提醒「倒垃圾」', s: '到 · 室友 · 309' },
              { ic: '✓', t: '完成「倒垃圾」', s: '认领 + 标记完成' },
              { ic: '@', t: '指派 阿J', s: '把「倒垃圾」给 J' },
            ].map((o, i) => (
              <div key={i} style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, background: o.sel ? 'var(--highlight)' : 'transparent' }}>
                <span style={{ width: 18 }} className="sk-mono">{o.ic}</span>
                <div style={{ flex: 1 }}>
                  <div className="sk-hand" style={{ fontSize: 14, fontWeight: o.sel ? 700 : 500 }}>{o.t}</div>
                  <div className="sk-meta">{o.s}</div>
                </div>
                {o.sel && <span className="sk-meta">↵</span>}
              </div>
            ))}
          </div>
          <div className="sk-anno" style={{ marginTop: 6, textAlign: 'center' }}>键盘党：⌘K 一切操作 · 自然语言识别</div>
        </div>
      </div>
    </DBrowser>
  );
}

// ② GROUPS LIST — desktop
function DT_GroupsTwoPane() {
  const groups = [
    { n: '跑步小队', ppl: 3, count: 6, badge: 2 },
    { n: '室友 · 309', ppl: 3, count: 4, badge: '!' },
    { n: '读书会', ppl: 8, count: 3 },
    { n: '吃药打卡', ppl: 1, count: 1 },
  ];
  return (
    <DBrowser>
      <Sidebar active="" activeGroup="跑步小队" />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 220, borderRight: '1.5px dashed var(--ink-faint)', padding: 8, overflow: 'hidden' }}>
          <div className="sk-meta">所有群组</div>
          {groups.map((g, i) => (
            <div key={g.n} className="sk-row" style={{ background: i === 0 ? 'var(--highlight)' : 'transparent', borderRadius: 4 }}>
              <div className="sk-avatar sm">{g.n[0]}</div>
              <div style={{ flex: 1 }}>
                <div className="sk-hand" style={{ fontSize: 13, fontWeight: 600 }}>{g.n}</div>
                <div className="sk-meta">{g.ppl} 人 · {g.count} 项</div>
              </div>
              {g.badge && <span className="sk-chip" style={{ background: g.badge === '!' ? 'var(--accent-poke)' : 'var(--ink)', color: '#fff', fontSize: 10, padding: '0 5px' }}>{g.badge}</span>}
            </div>
          ))}
          <div className="sk-row sk-dashed" style={{ border: '1.2px dashed var(--ink-faint)', borderRadius: 4, marginTop: 6, justifyContent: 'center' }}>
            <span className="sk-hand" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>+ 建群</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: 14, overflow: 'hidden' }}>
          <div className="sk-title" style={{ fontSize: 22 }}>跑步小队</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div className="sk-avatar sm">我</div>
            <div className="sk-avatar sm" style={{ marginLeft: -8 }}>M</div>
            <div className="sk-avatar sm" style={{ marginLeft: -8 }}>J</div>
            <span className="sk-meta" style={{ marginLeft: 6 }}>3 人 · 邀请 ›</span>
          </div>
          <div className="sk-meta" style={{ marginTop: 12 }}>本周</div>
          <div className="sk sk-rough" style={{ padding: 8, marginTop: 4 }}><span className="sk-hand" style={{ fontSize: 14 }}>晨跑 5k · 一三五 7:00</span></div>
          <div className="sk sk-rough" style={{ padding: 8, marginTop: 4 }}><span className="sk-hand" style={{ fontSize: 14 }}>周日长跑 10k</span></div>
        </div>
      </div>
    </DBrowser>
  );
}

function DT_GroupsGrid() {
  return (
    <DBrowser>
      <Sidebar active="" activeGroup="" />
      <div style={{ flex: 1, padding: 18, overflow: 'hidden' }}>
        <div className="sk-title" style={{ fontSize: 22 }}>群组</div>
        <div className="sk-meta">4 个群 · 14 件提醒</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
          {[
            { n: '跑步小队', sub: '本周 6 项 · 3 人', t: 1 },
            { n: '室友 · 309', sub: '⚠ 1 件没人 · 4 项', t: 2, hot: true },
            { n: '读书会', sub: '本周 30 页 · 8 人', t: 3 },
            { n: '吃药打卡', sub: '只有我 · 1 项', t: 1 },
            { n: '+ 新建', sub: '建一个新群', dash: true },
          ].map(c => (
            <div key={c.n} className={`sk sk-rough ${c.t === 1 ? 'tilt-1' : c.t === 2 ? 'tilt-2' : c.t === 3 ? 'tilt-3' : ''} ${c.dash ? 'sk-dashed' : ''}`} style={{ padding: 10, background: c.hot ? 'var(--highlight)' : 'var(--paper)', textAlign: c.dash ? 'center' : 'left' }}>
              <div className="sk-hand" style={{ fontSize: 16, fontWeight: 700 }}>{c.n}</div>
              <div className="sk-meta" style={{ marginTop: 2 }}>{c.sub}</div>
              {!c.dash && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <div className="sk-avatar sm">A</div>
                  <div className="sk-avatar sm" style={{ marginLeft: -6 }}>B</div>
                  <div className="sk-avatar sm" style={{ marginLeft: -6 }}>C</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DBrowser>
  );
}

// ③ GROUP DETAIL — desktop kanban
function DT_GroupKanban() {
  const cols = [
    { n: '没人认领', accent: true, items: [{ t: '倒垃圾', sub: '今晚 21:00', poke: true }, { t: '清冰箱', sub: '本周内' }] },
    { n: '进行中', items: [{ t: '水电费', sub: '月底', who: 'M' }, { t: '换灯泡', sub: '客厅', who: 'J' }] },
    { n: '今天截止', items: [{ t: '买牛奶', sub: '20:00 前', who: '我' }] },
    { n: '完成', items: [{ t: '买洗衣液', sub: 'M · 14:02', done: true }] },
  ];
  return (
    <DBrowser>
      <Sidebar active="" activeGroup="室友 · 309" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sk-title" style={{ fontSize: 18 }}>室友 · 309</div>
          <div className="sk-meta">3 人</div>
          <div style={{ flex: 1 }} />
          <span className="sk-chip">看板</span>
          <span className="sk-chip" style={{ opacity: 0.5 }}>清单</span>
          <span className="sk-chip" style={{ opacity: 0.5 }}>日历</span>
          <span className="sk-btn primary" style={{ padding: '2px 8px', fontSize: 12 }}>+ 提醒</span>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 8, padding: 10, overflow: 'hidden' }}>
          {cols.map(c => (
            <div key={c.n} className="sk sk-rough" style={{ flex: 1, padding: 8, background: c.accent ? 'var(--highlight)' : 'var(--paper)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div className="sk-meta" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{c.n}</span><span>{c.items.length}</span>
              </div>
              {c.items.map((it, i) => (
                <div key={i} className="sk sk-rough" style={{ padding: 8, marginTop: 6, background: '#fff' }}>
                  <div className="sk-hand" style={{ fontSize: 13, fontWeight: 600, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.5 : 1 }}>{it.t}</div>
                  <div className="sk-meta" style={{ marginTop: 2 }}>{it.sub}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    {it.who && <div className="sk-avatar sm">{it.who}</div>}
                    {it.poke && <span className="sk-poke" style={{ fontSize: 10, padding: '0 6px' }}>戳</span>}
                    {!it.who && !it.poke && !it.done && <span className="sk-claim" style={{ fontSize: 10, padding: '0 6px' }}>认</span>}
                  </div>
                </div>
              ))}
              <div className="sk sk-rough sk-dashed" style={{ padding: 4, marginTop: 6, textAlign: 'center', fontFamily: 'var(--hand)', fontSize: 11, color: 'var(--ink-mute)' }}>+ 拖卡到此</div>
            </div>
          ))}
        </div>
      </div>
    </DBrowser>
  );
}

function DT_GroupCalendar() {
  const days = ['一', '二', '三', '四', '五', '六', '日'];
  return (
    <DBrowser>
      <Sidebar active="" activeGroup="室友 · 309" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sk-title" style={{ fontSize: 18 }}>室友 · 309 · 日历</div>
          <div style={{ flex: 1 }} />
          <span className="sk-chip" style={{ opacity: 0.5 }}>看板</span>
          <span className="sk-chip" style={{ opacity: 0.5 }}>清单</span>
          <span className="sk-chip">日历</span>
        </div>
        <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontFamily: 'var(--hand)' }}>
            {days.map(d => <div key={d} className="sk-meta" style={{ textAlign: 'center' }}>周{d}</div>)}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: 4, marginTop: 4 }}>
            {Array.from({ length: 28 }).map((_, i) => {
              const day = i - 1;
              const today = day === 14;
              const items = (
                day === 14 ? [{ t: '倒垃圾', poke: true }, { t: '吃药' }] :
                day === 12 ? [{ t: '倒垃圾', who: 'M' }] :
                day === 10 ? [{ t: '倒垃圾', who: 'J', late: true }] :
                day === 16 ? [{ t: '水电费', who: 'M' }] :
                day === 18 ? [{ t: '清冰箱' }] : []
              );
              return (
                <div key={i} className="sk" style={{ padding: 4, background: today ? 'var(--highlight)' : 'var(--paper)', overflow: 'hidden', borderRadius: 4 }}>
                  <div className="sk-meta" style={{ fontWeight: today ? 700 : 400 }}>{day > 0 ? day : ''}</div>
                  {items.map((it, j) => (
                    <div key={j} className="sk-hand" style={{ fontSize: 11, padding: '1px 4px', marginTop: 2, background: it.late ? 'var(--accent-poke)' : it.poke ? '#fff' : 'var(--ink)', color: it.late || !it.poke ? '#fff' : 'var(--ink)', border: it.poke ? '1px solid var(--line)' : 'none', borderRadius: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.who ? `${it.who}·` : it.poke ? '⚠ ' : ''}{it.t}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DBrowser>
  );
}

// ④ CREATE — desktop modal
function DT_CreateModal() {
  return (
    <DBrowser>
      <Sidebar active="今天" />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* dim base */}
        <div style={{ padding: 14, opacity: 0.3 }}>
          <div className="sk-title" style={{ fontSize: 18 }}>今天 · 4 件</div>
          <div className="sk sk-rough" style={{ padding: 6, marginTop: 8 }}>· 晨跑 5k</div>
          <div className="sk sk-rough" style={{ padding: 6, marginTop: 4 }}>· 倒垃圾</div>
        </div>
        {/* modal */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="sk sk-rough" style={{ width: 420, background: '#fff', boxShadow: '4px 6px 0 var(--line)', padding: 14 }}>
            <div className="sk-meta">新提醒</div>
            <div className="sk sk-rough" style={{ padding: 8, marginTop: 4, fontFamily: 'var(--hand)', fontSize: 18 }}>晨跑 5km|</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <div>
                <div className="sk-meta">何时</div>
                <div className="sk sk-rough" style={{ padding: 6, fontFamily: 'var(--hand)', fontSize: 14 }}>明早 7:00 · 一三五</div>
              </div>
              <div>
                <div className="sk-meta">分享给</div>
                <div className="sk sk-rough" style={{ padding: 6 }}>
                  <span className="sk-chip" style={{ background: 'var(--ink)', color: '#fff', fontSize: 11 }}># 跑步小队 ×</span>
                </div>
              </div>
              <div>
                <div className="sk-meta">指派给</div>
                <div className="sk sk-rough" style={{ padding: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span className="sk-chip" style={{ fontSize: 11 }}>我</span>
                  <span className="sk-chip" style={{ fontSize: 11 }}>阿May</span>
                  <span className="sk-chip" style={{ background: 'var(--highlight)', fontSize: 11 }}>抢着做</span>
                </div>
              </div>
              <div>
                <div className="sk-meta">附</div>
                <div className="sk sk-rough" style={{ padding: 6, display: 'flex', gap: 4 }}>
                  <span className="sk-chip" style={{ fontSize: 11 }}>📷</span>
                  <span className="sk-chip" style={{ fontSize: 11 }}>🎤</span>
                  <span className="sk-chip" style={{ fontSize: 11 }}>📍</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <span className="sk-btn">取消</span>
              <span className="sk-btn primary">放进 跑步小队 ↵</span>
            </div>
          </div>
        </div>
      </div>
    </DBrowser>
  );
}

// ⑤ INVITE — desktop
function DT_InvitePage() {
  return (
    <DBrowser>
      <Sidebar active="" activeGroup="室友 · 309" />
      <div style={{ flex: 1, padding: 18, display: 'flex', gap: 16, overflow: 'hidden' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sk-meta">← 室友 · 309</div>
          <div className="sk-title" style={{ fontSize: 24, marginTop: 2 }}>邀请加入</div>

          <div className="sk-meta" style={{ marginTop: 14 }}>方法 1 · 链接</div>
          <div className="sk sk-rough" style={{ padding: 10, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="sk-mono" style={{ fontSize: 12, flex: 1 }}>https://rmd.so/g/ROOM-309 · 24h 有效</span>
            <span className="sk-btn" style={{ padding: '2px 8px', fontSize: 12 }}>复制</span>
            <span className="sk-btn primary" style={{ padding: '2px 8px', fontSize: 12 }}>新链接</span>
          </div>

          <div className="sk-meta" style={{ marginTop: 14 }}>方法 2 · 找人</div>
          <div className="sk sk-rough" style={{ padding: 8, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="sk-mono">🔍</span>
            <span className="sk-hand" style={{ fontSize: 14, flex: 1 }}>阿M|</span>
          </div>
          {[{ n: '阿May', sub: '常一起跑步', sel: true }, { n: '阿明', sub: '跑步小队' }, { n: 'Mia', sub: '通讯录' }].map(p => (
            <div key={p.n} className="sk-row">
              <div className="sk-avatar sm">{p.n[0]}</div>
              <div style={{ flex: 1 }}>
                <div className="sk-hand" style={{ fontSize: 13 }}>{p.n}</div>
                <div className="sk-meta">{p.sub}</div>
              </div>
              <span className="sk-chip" style={{ background: p.sel ? 'var(--ink)' : 'transparent', color: p.sel ? '#fff' : 'var(--ink)' }}>{p.sel ? '✓ 已选' : '+ 选'}</span>
            </div>
          ))}
        </div>
        <div style={{ width: 220 }}>
          <div className="sk-meta">方法 3 · 二维码</div>
          <div className="sk sk-rough" style={{ padding: 10, marginTop: 4, textAlign: 'center' }}>
            <div className="sk-img" style={{ width: 120, height: 120, margin: '0 auto', backgroundImage: `repeating-conic-gradient(var(--line) 0 4%, transparent 4% 8%)` }}>QR</div>
            <div className="sk-mono" style={{ fontSize: 10, marginTop: 6 }}>ROOM-309</div>
            <div className="sk-meta" style={{ marginTop: 4 }}>对着手机扫</div>
          </div>
          <div className="sk-meta" style={{ marginTop: 12 }}>已在</div>
          <div className="sk-row"><div className="sk-avatar sm">我</div><div style={{ flex: 1 }} className="sk-hand">夏 · 我</div></div>
          <div className="sk-row"><div className="sk-avatar sm">M</div><div style={{ flex: 1 }} className="sk-hand">阿May</div></div>
          <div className="sk-row"><div className="sk-avatar sm">J</div><div style={{ flex: 1 }} className="sk-hand">阿J</div></div>
        </div>
      </div>
    </DBrowser>
  );
}

// ⑥ POKE — desktop
function DT_PokePanel() {
  return (
    <DBrowser>
      <Sidebar active="戳人" />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 240, borderRight: '1.5px dashed var(--ink-faint)', padding: 10, overflow: 'hidden' }}>
          <div className="sk-meta">最近戳过</div>
          {[{ n: '阿May', sub: '昨天 · 5 次' }, { n: '阿J', sub: '今早 · 7 次', sel: true }, { n: '老王', sub: '上周' }].map(p => (
            <div key={p.n} className="sk-row" style={{ background: p.sel ? 'var(--highlight)' : 'transparent', borderRadius: 4 }}>
              <div className="sk-avatar">{p.n[1]}</div>
              <div style={{ flex: 1 }}>
                <div className="sk-hand" style={{ fontSize: 14, fontWeight: 600 }}>{p.n}</div>
                <div className="sk-meta">{p.sub}</div>
              </div>
            </div>
          ))}
          <div className="sk-meta" style={{ marginTop: 10 }}>所有联系人 · 12</div>
        </div>
        <div style={{ flex: 1, padding: 18, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="sk-avatar lg" style={{ width: 56, height: 56, fontSize: 24 }}>J</div>
            <div>
              <div className="sk-title" style={{ fontSize: 22 }}>戳 · 阿J</div>
              <div className="sk-meta">在 室友 · 309 · 跑步小队</div>
            </div>
          </div>

          <div className="sk-meta" style={{ marginTop: 14 }}>戳什么事</div>
          <div className="sk sk-rough" style={{ padding: 8 }}>
            <div className="sk-hand" style={{ fontSize: 13 }}>近 7 天他没做</div>
            <div className="sk-row" style={{ padding: '4px 0' }}>
              <span className="sk-check" /><div style={{ flex: 1 }} className="sk-hand">倒垃圾 · 4 次没动</div>
              <span className="sk-chip" style={{ background: 'var(--highlight)' }}>选这条</span>
            </div>
            <div className="sk-row" style={{ padding: '4px 0' }}>
              <span className="sk-check" /><div style={{ flex: 1 }} className="sk-hand">水电费</div>
              <span className="sk-chip">选</span>
            </div>
          </div>

          <div className="sk-meta" style={{ marginTop: 12 }}>戳的内容</div>
          <div className="sk sk-rough" style={{ padding: 10, background: 'var(--accent-poke)', color: '#fff' }}>
            <div className="sk-hand" style={{ fontSize: 22, fontWeight: 700 }}>该 倒 垃 圾 啦 ⏰</div>
            <div className="sk-hand" style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>· 来自 我</div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {['该 X 啦', '别忘了 X', '到点 X', '你又拖了 ⏰', '🔥🔥🔥'].map(t => <span key={t} className="sk-chip">{t}</span>)}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <span className="sk-btn" style={{ flex: 1, justifyContent: 'center' }}>+ 附语音</span>
            <span className="sk-btn poke" style={{ flex: 2, justifyContent: 'center', fontSize: 16 }}>戳！(⌘↵)</span>
          </div>
          <Anno style={{ marginTop: 6 }}>她会收到一条不能静音的推送 · 自动上「加油榜」</Anno>
        </div>
      </div>
    </DBrowser>
  );
}

// ⑦ DETAIL — desktop
function DT_DetailFull() {
  return (
    <DBrowser>
      <Sidebar active="" activeGroup="室友 · 309" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1.5px solid var(--line)' }}>
          <div className="sk-meta">室友 · 309 ›</div>
          <div className="sk-title" style={{ fontSize: 22 }}>倒垃圾 · 今晚</div>
          <div className="sk-meta">每周一三五 · 轮流 · 截止 21:00</div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: 14, borderRight: '1.5px dashed var(--ink-faint)', overflow: 'hidden' }}>
            <div className="sk sk-rough" style={{ padding: 10, background: 'var(--highlight)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="sk-claim">认领</span>
              <span className="sk-hand" style={{ fontSize: 14 }}>谁先点谁做</span>
              <div style={{ flex: 1 }} />
              <span className="sk-poke">戳全员</span>
            </div>

            <div className="sk-meta" style={{ marginTop: 12 }}>历史热力 · 12 周</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
              {Array.from({ length: 36 }).map((_, i) => {
                const r = (i * 7) % 11;
                const c = r < 1 ? 'var(--ink-faint)' : r < 2 ? 'var(--accent-poke)' : r < 9 ? 'var(--ink)' : 'var(--accent-claim)';
                return <div key={i} style={{ width: 14, height: 14, border: '1px solid var(--line)', background: c, borderRadius: 2 }} />;
              })}
            </div>

            <div className="sk-meta" style={{ marginTop: 12 }}>评论</div>
            <div className="sk sk-rough" style={{ padding: 8 }}>
              <div className="sk-hand" style={{ fontSize: 13 }}><strong>M:</strong> 上次是我 这次该 J</div>
              <div className="sk-hand" style={{ fontSize: 13, marginTop: 4 }}><strong>J:</strong> ... 好</div>
            </div>
            <div className="sk sk-rough" style={{ padding: 6, marginTop: 6, fontFamily: 'var(--hand)', fontSize: 13, color: 'var(--ink-mute)' }}>说点啥...</div>
          </div>
          <div style={{ width: 240, padding: 14 }}>
            <div className="sk-meta">加油榜 · 这条</div>
            <div className="sk sk-rough" style={{ padding: 8 }}>
              <div className="sk-row" style={{ padding: '4px 0', borderBottom: '1.2px dashed var(--ink-faint)' }}>
                <span className="sk-mono" style={{ width: 14 }}>1</span><div className="sk-avatar sm">J</div>
                <div style={{ flex: 1 }} className="sk-hand">阿J</div><div className="sk-mono" style={{ fontSize: 11 }}>4</div>
              </div>
              <div className="sk-row" style={{ padding: '4px 0', borderBottom: '1.2px dashed var(--ink-faint)' }}>
                <span className="sk-mono" style={{ width: 14 }}>2</span><div className="sk-avatar sm">M</div>
                <div style={{ flex: 1 }} className="sk-hand">阿May</div><div className="sk-mono" style={{ fontSize: 11 }}>2</div>
              </div>
              <div className="sk-row" style={{ padding: '4px 0' }}>
                <span className="sk-mono" style={{ width: 14 }}>3</span><div className="sk-avatar sm">我</div>
                <div style={{ flex: 1 }} className="sk-hand">我 · 模范</div><div className="sk-mono" style={{ fontSize: 11 }}>0</div>
              </div>
            </div>
            <div className="sk-meta" style={{ marginTop: 10 }}>反应</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <span className="sk-chip">👍 2</span>
              <span className="sk-chip">🔥 1</span>
              <span className="sk-chip">+</span>
            </div>
          </div>
        </div>
      </div>
    </DBrowser>
  );
}

// ⑧ ME — desktop
function DT_MePage() {
  return (
    <DBrowser>
      <Sidebar active="通知" />
      <div style={{ flex: 1, padding: 18, display: 'flex', gap: 14, overflow: 'hidden' }}>
        <div style={{ flex: 1.4, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="sk-avatar lg" style={{ width: 48, height: 48 }}>我</div>
            <div>
              <div className="sk-title" style={{ fontSize: 22 }}>夏 · 我自己</div>
              <div className="sk-meta">4 个群 · 在线</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 14 }}>
            <div className="sk sk-rough" style={{ padding: 8, textAlign: 'center' }}>
              <div className="sk-title" style={{ fontSize: 22 }}>92%</div><div className="sk-meta">完成率</div>
            </div>
            <div className="sk sk-rough" style={{ padding: 8, textAlign: 'center' }}>
              <div className="sk-title" style={{ fontSize: 22 }}>0</div><div className="sk-meta">加油</div>
            </div>
            <div className="sk sk-rough" style={{ padding: 8, textAlign: 'center', background: 'var(--accent-poke)', color: '#fff' }}>
              <div className="sk-title" style={{ fontSize: 22 }}>17</div><div className="sk-meta" style={{ color: '#fff', opacity: 0.8 }}>戳出</div>
            </div>
          </div>

          <div className="sk-meta" style={{ marginTop: 14 }}>本周「能量卡」</div>
          <div className="sk sk-rough" style={{ padding: 12 }}>
            <div className="sk-title" style={{ fontSize: 22, lineHeight: 1.1 }}>
              你 <span className="sk-hl">救了</span> 室友 · 309 · 3 次
            </div>
            <div className="sk-hand" style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>没人认领时你出手 · 室友群已经爱你</div>
            <div className="sk-anno" style={{ marginTop: 6 }}>每周日生成 · 可分享</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sk-meta">通知 · 今天 6 条</div>
          {[
            { who: 'J', ic: '👉', t: '戳了你「倒垃圾」', tt: '5 分前', hot: true },
            { who: 'M', ic: '✓', t: '完成「买洗衣液」', tt: '14:02' },
            { who: '系统', ic: '✦', t: '本周加油榜更新', tt: '今早' },
            { who: 'J', ic: '+', t: '加你进 室友 · 309', tt: '昨天' },
          ].map((n, i) => (
            <div key={i} className="sk sk-rough" style={{ padding: 8, marginTop: 4, background: n.hot ? 'var(--highlight)' : 'var(--paper)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sk-mono" style={{ width: 16 }}>{n.ic}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sk-hand" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.who} · {n.t}</div>
                <div className="sk-meta">{n.tt}</div>
              </div>
              {n.hot && <span className="sk-claim" style={{ fontSize: 11 }}>我做</span>}
            </div>
          ))}
        </div>
      </div>
    </DBrowser>
  );
}

// 0 · navigation overview
function DT_Sitemap() {
  const nodes = [
    { x: 80, y: 60, w: 110, h: 36, t: '今天', sub: '①' },
    { x: 220, y: 60, w: 110, h: 36, t: '群组', sub: '②' },
    { x: 360, y: 60, w: 110, h: 36, t: '群详情', sub: '③' },
    { x: 500, y: 60, w: 110, h: 36, t: '提醒详情', sub: '⑦' },
    { x: 80, y: 150, w: 110, h: 36, t: '创建', sub: '④' },
    { x: 220, y: 150, w: 110, h: 36, t: '邀请', sub: '⑤' },
    { x: 360, y: 150, w: 110, h: 36, t: '戳人', sub: '⑥' },
    { x: 500, y: 150, w: 110, h: 36, t: '我 / 通知', sub: '⑧' },
  ];
  return (
    <DBrowser>
      <div style={{ flex: 1, padding: 18, position: 'relative', overflow: 'hidden' }}>
        <div className="sk-meta">站点 · 桌面端</div>
        <div className="sk-title" style={{ fontSize: 22 }}>9 个屏 · 10 个 desktop wireframes</div>
        <Anno style={{ marginTop: 4 }}>下方箭头 = 主要跳转 · ⌘K 可任意跳</Anno>

        <div style={{ position: 'relative', marginTop: 20, height: 220 }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)" />
              </marker>
            </defs>
            {[
              [135, 78, 220, 78],
              [275, 78, 360, 78],
              [415, 78, 500, 78],
              [135, 96, 135, 150],
              [275, 96, 275, 150],
              [415, 96, 415, 150],
              [555, 96, 555, 150],
            ].map((p, i) => (
              <path key={i} d={`M ${p[0]} ${p[1]} Q ${(p[0]+p[2])/2 + (i%2 ? 6 : -6)} ${(p[1]+p[3])/2} ${p[2]} ${p[3]}`} stroke="var(--ink)" strokeWidth="1.4" fill="none" markerEnd="url(#ar)" strokeDasharray={i > 2 ? '4 3' : '0'} />
            ))}
          </svg>
          {nodes.map(n => (
            <div key={n.t} className="sk sk-rough" style={{ position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h, padding: 6, background: 'var(--paper)', textAlign: 'center' }}>
              <span className="sk-mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{n.sub}</span>{' '}
              <span className="sk-hand" style={{ fontSize: 14, fontWeight: 600 }}>{n.t}</span>
            </div>
          ))}
        </div>
      </div>
    </DBrowser>
  );
}

Object.assign(window, {
  DT_TodayThreeCol, DT_TodayDigest, DT_TodayCommand,
  DT_GroupsTwoPane, DT_GroupsGrid,
  DT_GroupKanban, DT_GroupCalendar,
  DT_CreateModal,
  DT_InvitePage,
  DT_PokePanel,
  DT_DetailFull,
  DT_MePage,
  DT_Sitemap,
});
