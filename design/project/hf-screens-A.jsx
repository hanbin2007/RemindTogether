/* eslint-disable */
// hf-screens-A.jsx — Today, Private list, Groups list, Group detail
// 320×660 phone screens; refined sketch hi-fi.

const { Av, AvStack, Phone, TabBar, RemRow } = window.HF;

// ─── 1. 今天 ────────────────────────────────────────────────────────────────
window.HfToday = function HfToday() {
  return (
    <Phone>
      <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        {/* header */}
        <div style={{ padding: '14px 18px 4px' }}>
          <div className="h-meta">星期四 · 4 月 30 日</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 }}>
            <div className="h-display">今天</div>
            <Av name="夏" size={32} i={0} />
          </div>
          <div className="h-body" style={{ marginTop: 4 }}>
            <span style={{ color: 'var(--poke)' }}>2 个朋友想到你</span> · <b>3 件小赢已收下</b> · 4 件待办
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 70px' }}>
          {/* 今日小赢 — celebrating wins right at top */}
          <div className="hf-box thick" style={{
            padding: '8px 12px', background: 'var(--ok-soft)', borderColor: 'var(--ok)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ display: 'inline-flex', color: 'var(--ok)' }}>
              <window.HF.Icon name="confetti" size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-row" style={{ fontSize: 15, fontFamily: 'var(--hand-2)' }}>
                你今天已经搞定 <b>3 件</b> 啦
              </div>
              <div className="h-meta" style={{ color: 'var(--ok)' }}>连胜 5 天 · 还剩 2 张保护卡</div>
            </div>
            <span className="hf-chip" style={{ borderColor: 'var(--ok)', color: 'var(--ok)', fontSize: 12, gap: 3 }}>
              <window.HF.Icon name="shield" size={11} /> ×2
            </span>
          </div>

          {/* poke alert — softened, no red squig */}
          <div className="hf-box thick tilt-l" style={{ padding: '10px 12px 12px', background: 'var(--poke-soft)', marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', color: 'var(--poke)' }}><window.HF.Icon name="wave" size={16} /></span>
              <div className="h-meta" style={{ color: 'var(--poke)' }}>小满 想到你了 · 2 分前</div>
            </div>
            <div className="h-h3" style={{ marginTop: 0, paddingBottom: 2, lineHeight: 1.4, marginBottom: 2, fontFamily: 'var(--hand-2)' }}>
              「我也常忘 🫶 想起你的读书笔记啦」
            </div>
            <div className="h-body" style={{ fontSize: 13, marginTop: 4, color: 'var(--ink-faint)' }}>
              读书会 · 还可以补上
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="hf-btn primary" style={{ padding: '6px 12px', fontSize: 14 }}>收下，去做</button>
              <button className="hf-btn ghost" style={{ padding: '6px 12px', fontSize: 14 }}>晚点说</button>
              <button className="hf-btn ghost" style={{ padding: '6px 12px', fontSize: 14, marginLeft: 'auto' }}>跳过日</button>
            </div>
          </div>

          {/* morning group */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 18, gap: 8 }}>
            <span style={{ display: 'inline-flex' }}><window.HF.Icon name="sun" size={15} /></span>
            <div className="h-h3">早上</div>
            <div className="h-meta" style={{ marginLeft: 'auto' }}>3 件 · 1 完成</div>
          </div>
          <div className="hf-box" style={{ padding: '4px 14px', marginTop: 6 }}>
            <RemRow
              title="晨跑 5km"
              sub="6:30 · #早起鸟"
              done
              chip={<span className="hf-chip claim">3 认领</span>}
            />
            <RemRow
              title="背 30 个单词"
              sub="8:00 · #背词打卡"
              chip={<span className="hf-chip poke">2× 拍</span>}
            />
            <RemRow
              title="给妈妈打电话"
              sub="9:00 · 私人"
              time="还有 12m"
              last
            />
          </div>

          {/* evening */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 16, gap: 8 }}>
            <span style={{ display: 'inline-flex' }}><window.HF.Icon name="moon" size={15} /></span>
            <div className="h-h3">晚上</div>
            <div className="h-meta" style={{ marginLeft: 'auto' }}>1 件</div>
          </div>
          <div className="hf-box" style={{ padding: '4px 14px', marginTop: 6 }}>
            <RemRow
              title="读书会第 7 章 摘抄"
              sub="21:00 · #读书会"
              chip={<span className="hf-chip poke">1×</span>}
              last
            />
          </div>

          {/* finished peek — celebrate */}
          <div className="hf-box" style={{ marginTop: 18, padding: 10, borderStyle: 'dashed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', color: 'var(--ok)' }}><window.HF.Icon name="check" size={13} /></span>
              <div className="h-meta" style={{ color: 'var(--ok)' }}>今日已收下 3 件 · 真不错</div>
              <span className="h-meta" style={{ marginLeft: 'auto', color: 'var(--claim)' }}>查看</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              <span className="hf-chip dim" style={{ textDecoration: 'line-through' }}>晨跑 5km</span>
              <span className="hf-chip dim" style={{ textDecoration: 'line-through' }}>喝水 8 杯</span>
              <span className="hf-chip dim" style={{ textDecoration: 'line-through' }}>冥想 10 min</span>
            </div>
          </div>
        </div>

        <TabBar active={0} />
      </div>
    </Phone>
  );
};

// ─── 2. 私人清单 ────────────────────────────────────────────────────────────
window.HfPrivate = function HfPrivate() {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        <div style={{ padding: '14px 18px 4px' }}>
          <div className="h-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><window.HF.Icon name="lock" size={12} /> 只有你能看见</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div className="h-display">私人</div>
            <button className="hf-btn primary" style={{ padding: '6px 10px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><window.HF.Icon name="plus" size={12} /> 加</button>
          </div>
        </div>

        {/* segmented */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 14px 0' }}>
          {['全部', '今天', '本周', '没期限'].map((t, i) => (
            <div key={i} className={`hf-chip ${i === 0 ? 'fill' : ''}`} style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>{t}</div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 70px' }}>
          {/* list 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ width: 12, height: 12, background: 'var(--ink)', borderRadius: 3, transform: 'rotate(8deg)' }} />
            <div className="h-h2">日常</div>
            <div className="h-meta" style={{ marginLeft: 'auto' }}>5 件</div>
          </div>
          <div className="hf-box" style={{ padding: '4px 14px', marginTop: 6 }}>
            <RemRow title="预约洗牙" sub="牙科 · 本周内" />
            <RemRow title="续签健身房" sub="5 月 3 日" time="3 天" />
            <RemRow title="买猫粮" sub="今天 · 已下单" done />
            <RemRow title="退订 Substack" sub="想了 3 个月了…" last />
          </div>

          {/* list 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <span style={{ width: 12, height: 12, background: '#A87C5F', borderRadius: 3, transform: 'rotate(-6deg)' }} />
            <div className="h-h2">想读 / 想看</div>
            <div className="h-meta" style={{ marginLeft: 'auto' }}>12 件</div>
          </div>
          <div className="hf-box" style={{ padding: '4px 14px', marginTop: 6 }}>
            <RemRow title="《长日将尽》" sub="石黑一雄 · 没期限" />
            <RemRow title="纪录片：人生果实" sub="没期限" />
            <RemRow title="再看一遍 Before Sunset" sub="上次：2023" last />
          </div>

          {/* hint card */}
          <div className="hf-box dashed dim tilt-r" style={{ marginTop: 18, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ display: 'inline-flex', color: 'var(--claim)' }}><window.HF.Icon name="handshake" size={22} /></span>
            <div style={{ flex: 1 }}>
              <div className="h-row">这件事可以 <span className="hf-hl">让别人帮你记</span></div>
              <div className="h-body">长按一项 → 分享到群组 / @ 朋友</div>
            </div>
          </div>
        </div>

        <TabBar active={3} />
      </div>
    </Phone>
  );
};

// ─── 3. 群组列表 ───────────────────────────────────────────────────────────
window.HfGroups = function HfGroups() {
  const groups = [
    { name: '早起鸟', icon: 'bird', tint: '#FFE9C9', count: 8, today: 3, ribbon: '阿莫 老忘', poke: 1 },
    { name: '读书会', icon: 'book', tint: '#E5D5F2', count: 12, today: 1, ribbon: null, poke: 0 },
    { name: '背词打卡', icon: 'letterA', tint: '#CDE7F0', count: 5, today: 2, ribbon: '我老忘', poke: 2 },
    { name: '健身搭子', icon: 'dumbbell', tint: '#D5E8D4', count: 3, today: 0, ribbon: null, poke: 0 },
    { name: '室友的烂账', icon: 'house', tint: '#FCD5CE', count: 4, today: 1, ribbon: '小航 欠 ¥85', poke: 0 },
  ];
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        <div style={{ padding: '14px 18px 4px' }}>
          <div className="h-meta">5 个群 · 28 个朋友</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div className="h-display">群组</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="hf-btn ghost" style={{ padding: '6px 10px', fontSize: 13, display: 'inline-flex', alignItems: 'center' }}><window.HF.Icon name="search" size={14} /></button>
              <button className="hf-btn primary" style={{ padding: '6px 10px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><window.HF.Icon name="plus" size={12} /> 建群</button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 70px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map((g, i) => (
            <div key={i} className="hf-box" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 46, height: 46,
                border: '1.5px solid var(--line)', borderRadius: '14px 8px 12px 6px / 6px 12px 8px 14px',
                background: g.tint, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: i % 2 ? 'rotate(-2deg)' : 'rotate(2deg)',
              }}><window.HF.Icon name={g.icon} size={24} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="h-h3">{g.name}</div>
                  {g.poke > 0 && <span className="hf-chip poke" style={{ fontSize: 11, padding: '1px 7px' }}>{g.poke}</span>}
                </div>
                <div className="h-body" style={{ fontSize: 13, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {g.count} 人 · 今日 {g.today}
                  {g.ribbon && <> · <span style={{ color: 'var(--poke)' }}>{g.ribbon}</span></>}
                </div>
              </div>
              <div className="h-meta">›</div>
            </div>
          ))}

          {/* invite tile */}
          <div className="hf-box dashed" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--paper-2)' }}>
            <span style={{ display: 'inline-flex' }}><window.HF.Icon name="signpost" size={22} /></span>
            <div style={{ flex: 1 }}>
              <div className="h-h3">叫人加进来</div>
              <div className="h-body" style={{ fontSize: 13 }}>分享链接 / 二维码 / 通讯录</div>
            </div>
            <span className="hf-arrow" />
          </div>
        </div>

        <TabBar active={1} />
      </div>
    </Phone>
  );
};

// ─── 4. 群组详情 (含加油榜) ────────────────────────────────────────────────
window.HfGroupDetail = function HfGroupDetail() {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        {/* header */}
        <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="hf-btn ghost" style={{ padding: '4px 8px', fontSize: 14 }}>‹</button>
          <div style={{ flex: 1 }}>
            <div className="h-meta">第 23 天 · 8 人 · 公开</div>
          </div>
          <button className="hf-btn ghost" style={{ padding: '6px 10px', fontSize: 14, display: 'inline-flex', alignItems: 'center' }}><window.HF.Icon name="dots" size={14} /></button>
        </div>

        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 56, height: 56,
              border: '1.6px solid var(--line)', borderRadius: '16px 8px 14px 6px / 6px 14px 8px 16px',
              background: '#FFE9C9', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: 'rotate(-3deg)',
            }}><window.HF.Icon name="bird" size={28} /></div>
            <div style={{ flex: 1 }}>
              <div className="h-h1">早起鸟</div>
              <div className="h-body">每天 6:30 · 拍照打卡</div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AvStack people={[{ n: '我' }, { n: '满' }, { n: '莫' }, { n: '可' }, { n: '橘' }, { n: '九' }]} max={5} size={26} />
            <button className="hf-btn ghost" style={{ padding: '4px 10px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><window.HF.Icon name="plus" size={12} /> 邀请</button>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 16, padding: '14px 18px 6px', borderBottom: '1.3px dashed var(--ink-faint)', margin: '10px 14px 0' }}>
          {['清单', '加油榜', '历史', '设置'].map((t, i) => (
            <div key={i} className="h-row" style={{
              fontSize: 15, paddingBottom: 4,
              color: i === 0 ? 'var(--ink)' : 'var(--ink-mute)',
              borderBottom: i === 0 ? '2.4px solid var(--ink)' : '2.4px solid transparent',
            }}>{t}</div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 130px' }}>
          {/* shared list */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="h-meta">今天 · 4 月 30 日</div>
            <div className="h-meta" style={{ marginLeft: 'auto' }}>5/8 完成</div>
          </div>
          <div className="hf-bar" style={{ marginTop: 6 }}><i style={{ width: '62%' }} /></div>

          <div className="hf-box" style={{ padding: '4px 12px', marginTop: 12 }}>
            <RemRow
              title="6:30 起床打卡"
              sub="可乐 创建 · 拍床头 OK"
              done
              chip={<span className="hf-chip done">5✓</span>}
            />
            <RemRow
              title="晨跑 5km · 拍照"
              sub="我创建 · 7:00"
              chip={<span className="hf-chip claim">3 人接</span>}
            />
            <RemRow
              title="发一张早餐照片"
              sub="小满 创建 · 阿莫 接了"
              chip={<span className="hf-chip poke">2× 拍</span>}
            />
            <RemRow
              title="读 10 页书"
              sub="九 创建 · 22:00"
              last
            />
          </div>

          {/* mini cheer board — celebrate top, soft poke for last */}
          <div className="hf-box dim" style={{ marginTop: 14, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', color: 'var(--ok)' }}><window.HF.Icon name="confetti" size={14} /></span>
              <div className="h-h3" style={{ marginLeft: 6 }}>本周加油榜</div>
              <div className="h-meta" style={{ marginLeft: 'auto' }}>看全榜 ›</div>
            </div>
            {[
              { n: '我',   done: 6, total: 7, i: 0, badge: '🥇' },
              { n: '可乐', done: 5, total: 7, i: 3, badge: '🥈' },
              { n: '阿莫', done: 3, total: 7, i: 2, hint: '想搭把手' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <div className="h-h3" style={{ width: 18, color: i === 0 ? 'var(--ok)' : 'var(--ink-mute)' }}>
                  {p.badge || (i + 1)}
                </div>
                <Av name={p.n} i={p.i} size={28} />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 15 }}>{p.n}</div>
                  <div className="h-meta">{p.done}/{p.total} 件已收下</div>
                </div>
                {p.hint ? (
                  <button className="hf-btn ghost" style={{ padding: '4px 10px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, borderColor: 'var(--claim)', color: 'var(--claim)' }}>
                    <window.HF.Icon name="handshake" size={12} /> {p.hint}
                  </button>
                ) : (
                  <span className="h-num" style={{ color: 'var(--ok)' }}>{Math.round(p.done / p.total * 100)}%</span>
                )}
              </div>
            ))}
            <div className="h-meta" style={{ marginTop: 10, paddingTop: 8, borderTop: '1.3px dashed var(--ink-faint)', fontStyle: 'italic' }}>
              ※ 没有「赖账榜」，谁都有忘的时候
            </div>
          </div>
        </div>

        {/* bottom action bar */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 56,
          background: 'var(--paper)', borderTop: '1.3px dashed var(--ink-faint)',
          padding: '10px 14px', display: 'flex', gap: 8,
        }}>
          <button className="hf-btn primary" style={{ flex: 1, fontSize: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><window.HF.Icon name="plus" size={14} /> 加给大家的事</button>
          <button className="hf-btn poke" style={{ fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 6 }}>群拍 <window.HF.Icon name="boltFilled" size={14} /></button>
        </div>
        <TabBar active={1} />
      </div>
    </Phone>
  );
};
