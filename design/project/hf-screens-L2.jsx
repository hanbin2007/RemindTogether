// hf-screens-L2.jsx — 二级交互界面（弹窗、sheet、空状态、推送页等）

const { Av, AvStack, Phone, TabBar, RemRow } = window.HF;

// 通用：sheet 上覆盖底层模糊主屏 — 简化为暗色蒙层 + 半屏 sheet
function SheetOverlay({ peek = '今天', children, height = 380 }) {
  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--paper)' }}>
      {/* faux background — paper bg with hint of content */}
      <div style={{ position: 'absolute', inset: 0, padding: '14px 18px', opacity: 0.35, pointerEvents: 'none' }}>
        <div className="h-meta">星期四 · 4 月 30 日</div>
        <div className="h-display">{peek}</div>
        <div className="hf-box thick" style={{ marginTop: 12, padding: 10, height: 80 }} />
        <div className="hf-box" style={{ marginTop: 10, padding: 10, height: 100 }} />
      </div>
      {/* dim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(40,28,20,0.32)' }} />
      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--paper)',
        borderTop: '2px solid var(--ink)',
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        boxShadow: '0 -4px 0 var(--line)',
        padding: '8px 0 14px',
        maxHeight: height,
        overflow: 'hidden',
      }}>
        <div style={{ width: 44, height: 4, background: 'var(--ink-faint)', borderRadius: 2, margin: '4px auto 8px' }} />
        {children}
      </div>
    </div>
  );
}

// ─── A1. 完成庆祝弹窗 ────────────────────────────────────────────────────
window.HfL2Celebrate = function HfL2Celebrate() {
  return (
    <Phone>
      <div style={{ height: '100%', position: 'relative', background: 'var(--paper)', overflow: 'hidden' }}>
        {/* dim faux bg */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(40,28,20,0.40)' }} />

        {/* sparkle scatter — SVG */}
        {[
          [12, 60, -20, 18], [260, 80, 15, 14], [50, 120, -10, 16],
          [240, 180, 8, 14], [30, 240, 0, 12], [250, 280, -15, 16],
          [180, 60, 12, 12], [90, 380, 6, 14],
        ].map(([x, y, r, sz], i) => (
          <span key={i} style={{
            position: 'absolute', left: x, top: y,
            transform: `rotate(${r}deg)`, opacity: 0.7,
            color: 'var(--poke)',
          }}>
            <window.HF.Icon name="sparkle" size={sz} />
          </span>
        ))}

        {/* center card */}
        <div style={{ position: 'absolute', left: 20, right: 20, top: '50%', transform: 'translateY(-55%)' }}>
          <div className="hf-box thick tilt-l" style={{
            padding: '22px 18px 18px',
            background: 'var(--ok-soft)',
            borderColor: 'var(--ok)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, lineHeight: 1, fontFamily: 'var(--hand-2)' }}>🎉</div>
            <div className="h-display" style={{ fontSize: 30, marginTop: 6 }}>收下！</div>
            <div className="h-body" style={{ fontFamily: 'var(--hand-2)', fontSize: 17, marginTop: 4 }}>
              你今天搞定了 <b style={{ color: 'var(--ok)' }}>4 件</b> 啦
            </div>

            {/* streak bump */}
            <div className="hf-box" style={{
              marginTop: 14, padding: '8px 12px',
              background: 'var(--paper)', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>🔥</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="h-meta">连胜</div>
                <div className="h-row" style={{ fontSize: 18, fontFamily: 'var(--hand-2)' }}>
                  5 → <b style={{ color: 'var(--poke)' }}>6 天</b>
                </div>
              </div>
              <span className="hf-chip" style={{ borderColor: 'var(--ok)', color: 'var(--ok)', gap: 3 }}>
                <window.HF.Icon name="shield" size={11} /> +0
              </span>
            </div>

            {/* sticker reward */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <div className="h-meta">解锁贴纸</div>
              <div className="hf-box thick" style={{
                width: 52, height: 52, padding: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--paper)', transform: 'rotate(-6deg)',
                fontSize: 30,
              }}>🍞</div>
              <div className="h-meta" style={{ fontFamily: 'var(--hand-2)' }}>早餐打卡 ×4</div>
            </div>

            {/* sound hint */}
            <div className="h-meta" style={{ marginTop: 10, fontStyle: 'italic' }}>
              ♪ ding~ · 朋友们也会看到
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'center' }}>
              <button className="hf-btn primary" style={{ padding: '8px 18px', fontSize: 15 }}>分享给群</button>
              <button className="hf-btn ghost" style={{ padding: '8px 14px', fontSize: 15 }}>关闭</button>
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
};

// ─── A2. 跳过日 sheet ────────────────────────────────────────────────────
window.HfL2SkipDay = function HfL2SkipDay() {
  return (
    <Phone>
      <SheetOverlay peek="今天" height={420}>
        <div style={{ padding: '0 18px' }}>
          <div className="h-meta" style={{ color: 'var(--ok)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <window.HF.Icon name="shield" size={12} /> 跳过日
          </div>
          <div className="h-h2" style={{ marginTop: 2 }}>今天先放过自己</div>
          <div className="h-body" style={{ fontFamily: 'var(--hand-2)', fontSize: 16, marginTop: 6, lineHeight: 1.5 }}>
            没事的，谁都有忘的一天。<br />
            跳过日<b>不算输</b>，你的连胜会保留。
          </div>

          <div className="hf-box dashed" style={{ marginTop: 14, padding: 12, background: 'var(--ok-soft)', borderColor: 'var(--ok)' }}>
            <div className="h-meta">本周保护卡</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="hf-box" style={{
                  width: 36, height: 44, padding: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: i <= 2 ? 'var(--paper)' : 'transparent',
                  borderStyle: i <= 2 ? 'solid' : 'dashed',
                  opacity: i === 3 ? 0.4 : 1,
                  transform: `rotate(${i % 2 ? -3 : 3}deg)`,
                }}>
                  <window.HF.Icon name="shield" size={18} color={i <= 2 ? 'var(--ok)' : 'var(--ink-faint)'} />
                </div>
              ))}
              <div style={{ flex: 1, marginLeft: 6 }}>
                <div className="h-row" style={{ fontSize: 14 }}>用掉 1 张</div>
                <div className="h-meta">下周一会再发 3 张</div>
              </div>
            </div>
          </div>

          {/* mood */}
          <div className="h-meta" style={{ marginTop: 14 }}>顺便说一句（可选）</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {['累了', '生病了', '在路上', '心情不好', '就是想跳'].map((t, i) => (
              <span key={i} className={`hf-chip ${i === 1 ? 'fill' : ''}`} style={{ fontSize: 13 }}>{t}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="hf-btn ghost" style={{ flex: 1, padding: '10px 0', fontSize: 15 }}>再想想</button>
            <button className="hf-btn primary" style={{ flex: 2, padding: '10px 0', fontSize: 15 }}>用 1 张保护卡</button>
          </div>
        </div>
      </SheetOverlay>
    </Phone>
  );
};

// ─── A3. 改约时间 sheet ──────────────────────────────────────────────────
window.HfL2Reschedule = function HfL2Reschedule() {
  return (
    <Phone>
      <SheetOverlay peek="读书笔记" height={460}>
        <div style={{ padding: '0 18px' }}>
          <div className="h-meta" style={{ color: 'var(--claim)' }}>改约一下</div>
          <div className="h-h2" style={{ marginTop: 2 }}>读书笔记 — 什么时候做？</div>
          <div className="h-body" style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>
            原定 21:00 · 已晚 28 分钟
          </div>

          {/* state estimator */}
          <div className="hf-box" style={{ marginTop: 12, padding: 10, background: 'var(--claim-soft)' }}>
            <div className="h-meta">现在状态？</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {[
                { t: '困', sub: '别勉强' },
                { t: '没劲', sub: '低能量' },
                { t: '一般', sub: '可以试', sel: true },
                { t: '想冲', sub: '现在做' },
              ].map((opt, i) => (
                <button key={i} className={`hf-chip ${opt.sel ? 'fill' : ''}`} style={{
                  flex: 1, justifyContent: 'center', flexDirection: 'column',
                  padding: '6px 0', gap: 1, fontSize: 13,
                }}>
                  <span style={{ fontFamily: 'var(--hand-2)' }}>{opt.t}</span>
                  <span className="h-meta" style={{ fontSize: 10, color: opt.sel ? 'rgba(255,255,255,0.75)' : 'var(--ink-mute)' }}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* suggestions */}
          <div className="h-meta" style={{ marginTop: 14, marginBottom: 4 }}>建议改到</div>
          <div className="hf-box" style={{ padding: '4px 12px' }}>
            {[
              { t: '半小时后', s: '21:58 · 你睡前常用', sel: true, hand: '✓ 60% 完成率' },
              { t: '明早 7:00', s: '比晚上更精神', hand: '↑ 78% 完成率' },
              { t: '本周末', s: '攒到周六一起', hand: '记得写' },
              { t: '自定义…', s: '挑个时间' },
            ].map((opt, i, a) => (
              <div key={i} className="hf-row" style={{
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
                background: opt.sel ? 'var(--claim-soft)' : 'transparent',
                margin: opt.sel ? '0 -10px' : 0, padding: opt.sel ? '8px 10px' : undefined,
                borderRadius: opt.sel ? 8 : 0,
              }}>
                <span className={`hf-radio ${opt.sel ? 'on' : ''}`} />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 15 }}>{opt.t}</div>
                  <div className="h-meta">{opt.s}</div>
                </div>
                {opt.hand && <span className="h-meta" style={{ color: 'var(--ok)', fontSize: 11 }}>{opt.hand}</span>}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="hf-btn ghost" style={{ flex: 1, padding: '10px 0', fontSize: 14 }}>取消</button>
            <button className="hf-btn primary" style={{ flex: 2, padding: '10px 0', fontSize: 14 }}>改到 21:58</button>
          </div>
        </div>
      </SheetOverlay>
    </Phone>
  );
};

// ─── A4. 长按提醒快捷菜单 ────────────────────────────────────────────────
window.HfL2LongPress = function HfL2LongPress() {
  return (
    <Phone>
      <div style={{ height: '100%', position: 'relative', background: 'var(--paper)', overflow: 'hidden' }}>
        {/* faux page bg */}
        <div style={{ padding: '14px 18px', opacity: 0.5 }}>
          <div className="h-meta">星期四 · 4 月 30 日</div>
          <div className="h-display">今天</div>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(40,28,20,0.55)' }} />

        {/* lifted reminder card */}
        <div style={{ position: 'absolute', left: 16, right: 16, top: 110 }}>
          <div className="hf-box thick" style={{
            padding: '10px 12px', background: 'var(--paper)',
            transform: 'scale(1.04) rotate(-1deg)',
            boxShadow: '4px 6px 0 var(--line), 0 0 0 3px var(--poke-soft)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="hf-check" />
              <div style={{ flex: 1 }}>
                <div className="h-row" style={{ fontSize: 16 }}>背 30 个单词</div>
                <div className="h-meta">8:00 · #背词打卡</div>
              </div>
              <span className="hf-chip poke" style={{ fontSize: 11 }}>2× 拍</span>
            </div>
          </div>
        </div>

        {/* context menu — appears below card */}
        <div style={{ position: 'absolute', left: 30, right: 30, top: 220 }}>
          <div className="hf-box thick" style={{ padding: 0, background: 'var(--paper)', overflow: 'hidden' }}>
            {[
              { ic: 'check', t: '收下，标完成', sub: '+1 连胜', tone: 'ok' },
              { ic: 'handshake', t: '我帮 ta 做', sub: '认领代办' },
              { ic: 'paperclip', t: '编辑提醒', sub: '改时间/内容' },
              { ic: 'pin', t: '置顶', sub: '钉在今天最上面' },
              { ic: 'shield', t: '今天跳过', sub: '用 1 张保护卡', tone: 'ok' },
              { ic: 'wave', t: '拍拍其他人', sub: '让朋友帮记' },
              { ic: 'x', t: '删除', sub: '不再提醒', tone: 'danger' },
            ].map((m, i, a) => (
              <div key={i} style={{
                padding: '11px 14px',
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
                display: 'flex', alignItems: 'center', gap: 10,
                color: m.tone === 'danger' ? 'var(--poke)' : (m.tone === 'ok' ? 'var(--ok)' : 'var(--ink)'),
              }}>
                <span style={{ display: 'inline-flex' }}><window.HF.Icon name={m.ic} size={16} /></span>
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 15, color: 'inherit' }}>{m.t}</div>
                  <div className="h-meta">{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="h-meta" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginTop: 10, fontStyle: 'italic' }}>
            点击空白取消
          </div>
        </div>
      </div>
    </Phone>
  );
};

Object.assign(window, {
  HfL2Celebrate: window.HfL2Celebrate,
  HfL2SkipDay: window.HfL2SkipDay,
  HfL2Reschedule: window.HfL2Reschedule,
  HfL2LongPress: window.HfL2LongPress,
});

// ═══════════════════════════════════════════════════════════════════════
// B. 拍拍接收
// ═══════════════════════════════════════════════════════════════════════

// ─── B1. 被拍全屏推送页 ─────────────────────────────────────────────────
window.HfL2Poked = function HfL2Poked() {
  return (
    <Phone time="14:23">
      <div style={{ height: '100%', position: 'relative', background: 'var(--poke-soft)', overflow: 'hidden' }}>
        <div style={{ padding: '28px 22px 0', position: 'relative' }}>
          <div className="h-meta">下午 2:23 · 来自小群</div>
          <div className="hf-chip poke" style={{ fontSize: 12, marginTop: 6 }}>
            <window.HF.Icon name="wave" size={11} /> 朋友拍了拍你
          </div>
        </div>

        {/* big poke card */}
        <div style={{ padding: '14px 18px' }}>
          <div className="hf-box thick tilt-r" style={{
            padding: '18px 16px', background: 'var(--paper)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <window.HF.Av name="阿May" size={42} i={2} />
              <div>
                <div className="h-row" style={{ fontSize: 16 }}>阿May 拍了拍你</div>
                <div className="h-meta">「读书笔记」还差你一个</div>
              </div>
            </div>

            {/* hand-written message */}
            <div className="hf-box" style={{
              marginTop: 14, padding: 12,
              background: 'var(--paper-2)', transform: 'rotate(-1deg)',
              fontFamily: 'var(--hand-2)', fontSize: 17, lineHeight: 1.5,
            }}>
              "今天就一页都行～ 一起加油呀 📖"
            </div>

            {/* the reminder being poked about */}
            <div className="hf-box dashed" style={{
              marginTop: 12, padding: '10px 12px',
              background: 'var(--paper)', borderColor: 'var(--ink-faint)',
            }}>
              <div className="h-meta">是这件 ↓</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span className="hf-check" />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 15 }}>读书笔记 · 一页就行</div>
                  <div className="h-meta">原定 21:00 · 现在 14:23</div>
                </div>
              </div>
            </div>
          </div>

          {/* what to do */}
          <div className="h-meta" style={{ textAlign: 'center', marginTop: 16, fontFamily: 'var(--hand-2)', fontSize: 14 }}>
            没压力 — 选一个就好
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <button className="hf-btn primary" style={{ padding: '12px 0', fontSize: 14 }}>
              <window.HF.Icon name="check" size={14} /> 我马上去
            </button>
            <button className="hf-btn" style={{ padding: '12px 0', fontSize: 14 }}>
              <window.HF.Icon name="clock" size={14} /> 改约时间
            </button>
            <button className="hf-btn ghost" style={{ padding: '10px 0', fontSize: 13 }}>
              <window.HF.Icon name="wave" size={13} /> 拍回去 一起做
            </button>
            <button className="hf-btn ghost" style={{ padding: '10px 0', fontSize: 13 }}>
              <window.HF.Icon name="shield" size={13} /> 今天先跳
            </button>
          </div>

          <div className="h-meta" style={{ textAlign: 'center', marginTop: 14, fontStyle: 'italic' }}>
            ← 滑掉就当没看见
          </div>
        </div>
      </div>
    </Phone>
  );
};

Object.assign(window, { HfL2Poked: window.HfL2Poked });

// ═══════════════════════════════════════════════════════════════════════
// C. 群组流
// ═══════════════════════════════════════════════════════════════════════

// ─── C1. 建群 sheet ─────────────────────────────────────────────────────
window.HfL2NewGroup = function HfL2NewGroup() {
  return (
    <Phone>
      <SheetOverlay peek="群组" height={520}>
        <div style={{ padding: '0 18px' }}>
          <div className="h-meta">新建小群</div>
          <div className="h-h2" style={{ marginTop: 2 }}>建一个一起打气的小窝</div>

          {/* cover picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <div className="hf-box thick" style={{
              width: 72, height: 72, padding: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--ok-soft)', fontSize: 38,
              transform: 'rotate(-3deg)',
            }}>📚</div>
            <div style={{ flex: 1 }}>
              <input className="hf-box" style={{
                width: '100%', padding: '8px 10px', fontFamily: 'var(--hand)',
                fontSize: 17, border: '1.6px solid var(--line)', background: 'var(--paper)',
                outline: 'none',
              }} defaultValue="读书一起冲" />
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {['📚', '🏃', '🍳', '🎨', '💪', '✏️', '🌱', '🎵'].map((e, i) => (
                  <span key={i} className="hf-chip" style={{ fontSize: 16, padding: '2px 6px' }}>{e}</span>
                ))}
              </div>
            </div>
          </div>

          {/* type */}
          <div className="h-meta" style={{ marginTop: 16 }}>这是个什么样的小群？</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
            {[
              { t: '一起打卡', s: '同一件事，每人各做', sel: true },
              { t: '共享清单', s: '一份事，谁有空谁做' },
              { t: '只是约', s: '约一件大事' },
              { t: '吐槽群', s: '没事拍拍互相提醒' },
            ].map((opt, i) => (
              <div key={i} className="hf-box" style={{
                padding: '8px 10px',
                background: opt.sel ? 'var(--ok-soft)' : 'var(--paper)',
                borderColor: opt.sel ? 'var(--ok)' : 'var(--line)',
                borderWidth: opt.sel ? 2 : 1.6,
              }}>
                <div className="h-row" style={{ fontSize: 14 }}>{opt.t}</div>
                <div className="h-meta" style={{ fontSize: 11 }}>{opt.s}</div>
              </div>
            ))}
          </div>

          {/* friend ground rule */}
          <div className="h-meta" style={{ marginTop: 14 }}>群规（默认 — 可以改）</div>
          <div className="hf-box dashed" style={{ marginTop: 6, padding: 10, background: 'var(--paper-2)' }}>
            <div className="hf-row" style={{ padding: '4px 0', borderBottom: '1.3px dashed var(--ink-faint)' }}>
              <span className="hf-check done" />
              <div className="h-row" style={{ fontSize: 14 }}>跳过日不算输</div>
            </div>
            <div className="hf-row" style={{ padding: '4px 0', borderBottom: '1.3px dashed var(--ink-faint)' }}>
              <span className="hf-check done" />
              <div className="h-row" style={{ fontSize: 14 }}>不显示连续没做几天</div>
            </div>
            <div className="hf-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
              <span className="hf-check" />
              <div className="h-row" style={{ fontSize: 14 }}>每周一起复盘</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="hf-btn ghost" style={{ flex: 1, padding: '10px 0' }}>取消</button>
            <button className="hf-btn primary" style={{ flex: 2, padding: '10px 0' }}>
              下一步：拉朋友进来
            </button>
          </div>
        </div>
      </SheetOverlay>
    </Phone>
  );
};

// ─── C2. 群设置页 ────────────────────────────────────────────────────────
window.HfL2GroupSettings = function HfL2GroupSettings() {
  return (
    <Phone>
      <div style={{ height: '100%', overflow: 'hidden', background: 'var(--paper)' }}>
        {/* nav bar */}
        <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1.5px solid var(--line)' }}>
          <span style={{ fontFamily: 'var(--hand-2)', fontSize: 18 }}>‹</span>
          <div style={{ flex: 1 }}>
            <div className="h-meta">小群</div>
            <div className="h-row" style={{ fontSize: 16 }}>读书一起冲</div>
          </div>
          <window.HF.Icon name="dots" size={18} />
        </div>

        <div style={{ padding: '12px 14px', overflow: 'hidden', height: 'calc(100% - 56px)' }}>
          {/* cover */}
          <div className="hf-box thick" style={{
            padding: '14px 12px', background: 'var(--ok-soft)',
            display: 'flex', alignItems: 'center', gap: 10,
            transform: 'rotate(-0.5deg)',
          }}>
            <div style={{ fontSize: 32, transform: 'rotate(-6deg)' }}>📚</div>
            <div style={{ flex: 1 }}>
              <div className="h-row" style={{ fontSize: 15 }}>读书一起冲</div>
              <div className="h-meta">5 人 · 共建 23 天</div>
            </div>
            <button className="hf-btn ghost" style={{ padding: '4px 10px', fontSize: 12 }}>改名</button>
          </div>

          {/* members */}
          <div className="h-meta" style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>成员 · 5</span>
            <span style={{ color: 'var(--claim)' }}>+ 邀请</span>
          </div>
          <div className="hf-box" style={{ marginTop: 4, padding: '4px 10px' }}>
            {[
              { n: '我', tag: '群主', i: 0 },
              { n: '阿May', tag: '管理', i: 2 },
              { n: 'Tom', tag: '成员', i: 1 },
              { n: '小鹿', tag: '成员', i: 3 },
              { n: 'Jin', tag: '成员', i: 4 },
            ].map((m, i, a) => (
              <div key={i} className="hf-row" style={{
                padding: '6px 0',
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
              }}>
                <window.HF.Av name={m.n} size={28} i={m.i} />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 14 }}>{m.n}</div>
                </div>
                <span className="hf-chip dim" style={{ fontSize: 11 }}>{m.tag}</span>
              </div>
            ))}
          </div>

          {/* rules */}
          <div className="h-meta" style={{ marginTop: 12 }}>群规则</div>
          <div className="hf-box" style={{ marginTop: 4, padding: '4px 12px' }}>
            {[
              { t: '跳过日不算输', on: true },
              { t: '隐藏连续没做几天', on: true },
              { t: '允许互相拍拍', on: true },
              { t: '每周日发复盘', on: false },
            ].map((r, i, a) => (
              <div key={i} className="hf-row" style={{
                padding: '8px 0',
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
              }}>
                <div className="h-row" style={{ flex: 1, fontSize: 14 }}>{r.t}</div>
                <div style={{
                  width: 32, height: 18, borderRadius: 10,
                  border: '1.5px solid var(--line)',
                  background: r.on ? 'var(--ok)' : 'var(--paper-2)',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: 1, left: r.on ? 15 : 1,
                    width: 14, height: 14, borderRadius: '50%',
                    border: '1.4px solid var(--line)', background: 'var(--paper)',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* danger */}
          <div className="hf-box dashed" style={{ marginTop: 12, padding: '8px 12px', borderColor: 'var(--poke)' }}>
            <div className="h-row" style={{ fontSize: 14, color: 'var(--poke)' }}>退出小群</div>
            <div className="h-meta">你的打卡记录会保留</div>
          </div>
        </div>
      </div>
    </Phone>
  );
};

// ─── C3. @某人选人 sheet ────────────────────────────────────────────────
window.HfL2AtPicker = function HfL2AtPicker() {
  return (
    <Phone>
      <SheetOverlay peek="新建提醒" height={460}>
        <div style={{ padding: '0 18px' }}>
          <div className="h-meta">@ 提一下</div>
          <div className="h-h2" style={{ marginTop: 2 }}>谁来记这个？</div>
          <div className="h-body" style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>
            可以多选 — ta 们都会收到
          </div>

          {/* search */}
          <div className="hf-box" style={{ marginTop: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <window.HF.Icon name="search" size={14} color="var(--ink-faint)" />
            <span className="h-meta" style={{ fontFamily: 'var(--hand-2)', fontSize: 14, color: 'var(--ink-faint)' }}>搜名字</span>
          </div>

          {/* recent */}
          <div className="h-meta" style={{ marginTop: 12 }}>最近一起做</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {[
              { n: '阿May', i: 2, sel: true },
              { n: 'Tom', i: 1, sel: true },
              { n: '小鹿', i: 3 },
            ].map((p, i) => (
              <div key={i} className="hf-chip" style={{
                padding: '4px 10px 4px 4px', gap: 6,
                background: p.sel ? 'var(--claim)' : 'var(--paper)',
                color: p.sel ? 'white' : 'var(--ink)',
                borderColor: p.sel ? 'var(--claim)' : 'var(--line)',
              }}>
                <window.HF.Av name={p.n} size={20} i={p.i} />
                {p.n}
                {p.sel && <window.HF.Icon name="check" size={11} />}
              </div>
            ))}
          </div>

          {/* group list */}
          <div className="h-meta" style={{ marginTop: 14 }}>「读书一起冲」群成员</div>
          <div className="hf-box" style={{ marginTop: 4, padding: '4px 10px' }}>
            {[
              { n: '阿May', sub: '在线 · 30 秒前', i: 2, sel: true },
              { n: 'Tom', sub: '今天打过卡', i: 1, sel: true },
              { n: '小鹿', sub: '昨天活跃', i: 3 },
              { n: 'Jin', sub: '4 天没动了', i: 4, dim: true },
            ].map((p, i, a) => (
              <div key={i} className="hf-row" style={{
                padding: '7px 0',
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
                opacity: p.dim ? 0.7 : 1,
              }}>
                <span className={`hf-check ${p.sel ? 'done' : ''}`} />
                <window.HF.Av name={p.n} size={28} i={p.i} />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 14 }}>{p.n}</div>
                  <div className="h-meta">{p.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* selected count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <div style={{ flex: 1 }}>
              <div className="h-meta">已选 2 人</div>
              <div style={{ display: 'flex', marginTop: 2 }}>
                <window.HF.Av name="阿May" size={22} i={2} style={{ outline: '2px solid var(--paper)' }} />
                <div style={{ marginLeft: -8 }}>
                  <window.HF.Av name="Tom" size={22} i={1} style={{ outline: '2px solid var(--paper)' }} />
                </div>
              </div>
            </div>
            <button className="hf-btn primary" style={{ padding: '8px 16px' }}>加上</button>
          </div>
        </div>
      </SheetOverlay>
    </Phone>
  );
};

// ─── C4. 群邀请进入页（陆设页） ─────────────────────────────────────────
window.HfL2GroupInvite = function HfL2GroupInvite() {
  return (
    <Phone>
      <div style={{ height: '100%', background: 'var(--paper)', overflow: 'hidden', position: 'relative' }}>
        {/* hero */}
        <div style={{ padding: '24px 22px 16px', background: 'var(--claim-soft)', borderBottom: '1.5px solid var(--line)' }}>
          <div className="h-meta">阿May 邀请你加入</div>
          <div className="h-display" style={{ fontSize: 28, marginTop: 4 }}>读书一起冲</div>
          <div className="hf-chip" style={{ marginTop: 6, fontSize: 12 }}>
            <window.HF.Icon name="users" size={11} /> 5 个朋友 · 已经 23 天
          </div>
        </div>

        <div style={{ padding: '14px 18px', overflowY: 'auto', height: 'calc(100% - 130px)' }}>
          {/* who's here */}
          <div className="h-meta">里面都有谁</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {[
              { n: '阿May', i: 2 }, { n: 'Tom', i: 1 },
              { n: '小鹿', i: 3 }, { n: 'Jin', i: 4 }, { n: 'Lia', i: 5 },
            ].map((p, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <window.HF.Av name={p.n} size={36} i={p.i} />
                <div className="h-meta" style={{ fontSize: 11, marginTop: 2 }}>{p.n}</div>
              </div>
            ))}
          </div>

          {/* rules at a glance */}
          <div className="h-meta" style={{ marginTop: 14 }}>这个群的脾气</div>
          <div className="hf-box dashed" style={{ marginTop: 4, padding: 12, background: 'var(--paper-2)' }}>
            <div style={{ fontFamily: 'var(--hand-2)', fontSize: 15, lineHeight: 1.6 }}>
              · 跳过日 <b style={{ color: 'var(--ok)' }}>不算输</b><br />
              · 不显示谁连续没做<br />
              · 拍拍是友好的，不是催<br />
              · 完成会一起庆祝 🎉
            </div>
          </div>

          {/* what they're doing */}
          <div className="h-meta" style={{ marginTop: 14 }}>本周大家在做</div>
          <div className="hf-box" style={{ marginTop: 4, padding: '6px 12px' }}>
            {[
              { t: '每天读 10 分钟', n: 4 },
              { t: '写一段笔记', n: 3 },
              { t: '推荐一本书', n: 5 },
            ].map((it, i, a) => (
              <div key={i} className="hf-row" style={{
                padding: '7px 0',
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
              }}>
                <span className="hf-check done" />
                <div className="h-row" style={{ flex: 1, fontSize: 14 }}>{it.t}</div>
                <span className="h-meta">{it.n} 人在做</span>
              </div>
            ))}
          </div>

          <div className="h-meta" style={{ textAlign: 'center', marginTop: 16, fontStyle: 'italic' }}>
            想清楚再点 — 你随时可以退
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="hf-btn ghost" style={{ flex: 1, padding: '10px 0' }}>再看看</button>
            <button className="hf-btn primary" style={{ flex: 2, padding: '10px 0' }}>加入小群</button>
          </div>
        </div>
      </div>
    </Phone>
  );
};

Object.assign(window, {
  HfL2NewGroup: window.HfL2NewGroup,
  HfL2GroupSettings: window.HfL2GroupSettings,
  HfL2AtPicker: window.HfL2AtPicker,
  HfL2GroupInvite: window.HfL2GroupInvite,
});

// ═══════════════════════════════════════════════════════════════════════
// D. 发现 / 管理
// ═══════════════════════════════════════════════════════════════════════

// ─── D1. 全局搜索页 ─────────────────────────────────────────────────────
window.HfL2Search = function HfL2Search() {
  return (
    <Phone>
      <div style={{ height: '100%', background: 'var(--paper)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--hand-2)', fontSize: 18 }}>‹</span>
          <div className="hf-box" style={{ flex: 1, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <window.HF.Icon name="search" size={14} />
            <input style={{
              border: 'none', outline: 'none', flex: 1, fontFamily: 'var(--hand)',
              fontSize: 16, background: 'transparent',
            }} defaultValue="读书" />
            <window.HF.Icon name="x" size={12} color="var(--ink-faint)" />
          </div>
        </div>

        <div style={{ padding: '12px 14px', overflowY: 'auto', height: 'calc(100% - 56px)' }}>
          {/* tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['全部 12', '提醒 5', '群组 2', '人 1', '历史 4'].map((t, i) => (
              <span key={i} className={`hf-chip ${i === 0 ? 'fill' : ''}`} style={{ fontSize: 12 }}>{t}</span>
            ))}
          </div>

          {/* group hits */}
          <div className="h-meta">群组</div>
          <div className="hf-box" style={{ marginTop: 4, padding: '4px 10px' }}>
            <div className="hf-row" style={{ borderBottom: '1.3px dashed var(--ink-faint)', padding: '7px 0' }}>
              <span style={{ fontSize: 22 }}>📚</span>
              <div style={{ flex: 1 }}>
                <div className="h-row" style={{ fontSize: 14 }}><span className="hf-hl">读书</span>一起冲</div>
                <div className="h-meta">5 人 · 你在</div>
              </div>
            </div>
            <div className="hf-row" style={{ padding: '7px 0', borderBottom: 'none' }}>
              <span style={{ fontSize: 22 }}>📖</span>
              <div style={{ flex: 1 }}>
                <div className="h-row" style={{ fontSize: 14 }}>晚安<span className="hf-hl">读书</span>会</div>
                <div className="h-meta">12 人 · 加入</div>
              </div>
            </div>
          </div>

          {/* reminders */}
          <div className="h-meta" style={{ marginTop: 14 }}>提醒</div>
          <div className="hf-box" style={{ marginTop: 4, padding: '4px 10px' }}>
            {[
              { t: '读书笔记', s: '今天 21:00', done: false },
              { t: '读 10 分钟书', s: '每天 22:00', done: true },
              { t: '推荐一本书', s: '本周末', done: false },
            ].map((r, i, a) => (
              <div key={i} className="hf-row" style={{
                padding: '7px 0',
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
              }}>
                <span className={`hf-check ${r.done ? 'done' : ''}`} />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 14, opacity: r.done ? 0.5 : 1 }}>
                    <span className="hf-hl">{r.t.includes('读书') ? '读书' : '读'}</span>
                    {r.t.replace('读书', '').replace('读', '')}
                  </div>
                  <div className="h-meta">{r.s}</div>
                </div>
              </div>
            ))}
          </div>

          {/* history small wins */}
          <div className="h-meta" style={{ marginTop: 14 }}>历史小赢</div>
          <div className="hf-box dashed" style={{ marginTop: 4, padding: '8px 12px', background: 'var(--ok-soft)' }}>
            <div style={{ fontFamily: 'var(--hand-2)', fontSize: 14 }}>
              过去 30 天，你"读书"相关的事完成了 <b>22 件</b> ✨
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
};

// ─── D2. 历史小赢清单 ───────────────────────────────────────────────────
window.HfL2WinsHistory = function HfL2WinsHistory() {
  return (
    <Phone>
      <div style={{ height: '100%', background: 'var(--paper)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px 8px', borderBottom: '1.5px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--hand-2)', fontSize: 18 }}>‹</span>
            <div style={{ flex: 1 }}>
              <div className="h-meta">小赢</div>
              <div className="h-row" style={{ fontSize: 18 }}>这周做完的事</div>
            </div>
            <span className="hf-chip" style={{ fontSize: 12 }}>本周 ▾</span>
          </div>

          {/* big number */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span className="h-display" style={{ fontSize: 44, color: 'var(--ok)' }}>23</span>
            <span className="h-meta">件 · 比上周 +5</span>
          </div>
        </div>

        <div style={{ padding: '10px 14px', overflowY: 'auto', height: 'calc(100% - 110px)' }}>
          {[
            {
              day: '今天', date: '4/30 周四', n: 4,
              items: [
                { t: '早餐', sub: '8:30 ✓' },
                { t: '背 30 个单词', sub: '9:15 ✓ 阿May 拍了' },
                { t: '5 公里', sub: '18:40 ✓' },
                { t: '读书 10 分钟', sub: '22:10 ✓' },
              ],
            },
            {
              day: '昨天', date: '4/29 周三', n: 3,
              items: [
                { t: '早餐', sub: '8:00 ✓' },
                { t: '读书笔记', sub: '21:30 ✓ 跨连胜' },
                { t: '推荐一本书', sub: '群里 ✓' },
              ],
            },
            {
              day: '周二', date: '4/28', n: 5, dim: true,
              items: [{ t: '+ 5 件', sub: '点开看看' }],
            },
          ].map((d, di) => (
            <div key={di} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="h-row" style={{ fontSize: 15 }}>{d.day}</span>
                <span className="h-meta">{d.date}</span>
                <span style={{ flex: 1 }} />
                <span className="hf-chip" style={{ fontSize: 11, background: 'var(--ok-soft)', borderColor: 'var(--ok)' }}>
                  {d.n} 件
                </span>
              </div>
              <div className="hf-box" style={{ marginTop: 4, padding: '4px 12px', opacity: d.dim ? 0.6 : 1 }}>
                {d.items.map((it, i, a) => (
                  <div key={i} className="hf-row" style={{
                    padding: '6px 0',
                    borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
                  }}>
                    <span className="hf-check done" />
                    <div style={{ flex: 1 }}>
                      <div className="h-row" style={{ fontSize: 14 }}>{it.t}</div>
                      <div className="h-meta">{it.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="h-meta" style={{ textAlign: 'center', fontStyle: 'italic', marginTop: 6 }}>
            ↓ 加载更早的小赢
          </div>
        </div>
      </div>
    </Phone>
  );
};

// ─── D3. 标签管理 ───────────────────────────────────────────────────────
window.HfL2Tags = function HfL2Tags() {
  return (
    <Phone>
      <div style={{ height: '100%', background: 'var(--paper)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--hand-2)', fontSize: 18 }}>‹</span>
          <div style={{ flex: 1 }}>
            <div className="h-meta">分类</div>
            <div className="h-row" style={{ fontSize: 16 }}>我的标签</div>
          </div>
          <button className="hf-btn ghost" style={{ padding: '4px 10px', fontSize: 12 }}>+ 新建</button>
        </div>

        <div style={{ padding: '12px 14px', overflowY: 'auto', height: 'calc(100% - 56px)' }}>
          <div className="h-meta">本周用过 · 7</div>
          <div className="hf-box" style={{ marginTop: 6, padding: '6px 10px' }}>
            {[
              { ic: 'coffee',   t: '#早餐打卡', n: 7, color: 'var(--ok-soft)' },
              { ic: 'book',     t: '#读书',       n: 5, color: 'var(--claim-soft)' },
              { ic: 'dumbbell', t: '#跑步',       n: 3, color: 'var(--poke-soft)' },
              { ic: 'letterA',  t: '#背词打卡', n: 6, color: 'var(--ok-soft)' },
              { ic: 'bird',     t: '#浇花',       n: 2, color: 'var(--ok-soft)' },
              { ic: 'sparkle',  t: '#画画',       n: 1, color: 'var(--paper-2)' },
              { ic: 'mic',      t: '#练琴',       n: 0, color: 'var(--paper-2)', dim: true },
            ].map((t, i, a) => (
              <div key={i} className="hf-row" style={{
                padding: '7px 0',
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
                opacity: t.dim ? 0.55 : 1,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '1.5px solid var(--line)', background: t.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <window.HF.Icon name={t.ic} size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 14 }}>{t.t}</div>
                  <div className="h-meta">{t.n > 0 ? `本周 ${t.n} 次` : '没用过'}</div>
                </div>
                <window.HF.Icon name="dots" size={14} color="var(--ink-faint)" />
              </div>
            ))}
          </div>

          <div className="h-meta" style={{ marginTop: 12 }}>朋友们也在用</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {['#早睡 12 人', '#冥想 4 人', '#日记 8 人', '#散步 5 人', '#拉伸 3 人'].map((t, i) => (
              <span key={i} className="hf-chip" style={{ fontSize: 12, borderStyle: 'dashed' }}>+ {t}</span>
            ))}
          </div>

          <div className="h-meta" style={{ marginTop: 14, fontStyle: 'italic', textAlign: 'center' }}>
            标签是给自己看的 — 朋友看不到细节
          </div>
        </div>
      </div>
    </Phone>
  );
};

Object.assign(window, {
  HfL2Search: window.HfL2Search,
  HfL2WinsHistory: window.HfL2WinsHistory,
  HfL2Tags: window.HfL2Tags,
});

// ═══════════════════════════════════════════════════════════════════════
// E. 设置 / 仪式
// ═══════════════════════════════════════════════════════════════════════

// ─── E1. 通知偏好 ───────────────────────────────────────────────────────
window.HfL2Notif = function HfL2Notif() {
  return (
    <Phone>
      <div style={{ height: '100%', background: 'var(--paper)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--hand-2)', fontSize: 18 }}>‹</span>
          <div style={{ flex: 1 }}>
            <div className="h-meta">设置</div>
            <div className="h-row" style={{ fontSize: 16 }}>提醒声音和勿扰</div>
          </div>
        </div>

        <div style={{ padding: '12px 14px', overflowY: 'auto', height: 'calc(100% - 56px)' }}>
          {/* dnd schedule */}
          <div className="h-meta">勿扰时段</div>
          <div className="hf-box thick" style={{ marginTop: 6, padding: 12, background: 'var(--paper-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <window.HF.Icon name="moon" size={20} />
              <div style={{ flex: 1 }}>
                <div className="h-row" style={{ fontSize: 14 }}>晚 22:30 — 早 7:30</div>
                <div className="h-meta">这段时间不响</div>
              </div>
              <span className="hf-chip" style={{ background: 'var(--ok)', color: 'white', fontSize: 11 }}>开</span>
            </div>

            {/* week dots */}
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
                <div key={i} style={{
                  flex: 1, height: 28, border: '1.4px solid var(--line)',
                  borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < 5 ? 'var(--ink)' : 'var(--paper)',
                  color: i < 5 ? 'white' : 'var(--ink)',
                  fontFamily: 'var(--hand-2)', fontSize: 12,
                }}>{d}</div>
              ))}
            </div>
            <div className="h-meta" style={{ marginTop: 6 }}>周末睡晚一点也行</div>
          </div>

          {/* sound */}
          <div className="h-meta" style={{ marginTop: 14 }}>提醒声音</div>
          <div className="hf-box" style={{ marginTop: 4, padding: '4px 12px' }}>
            {[
              { t: '小铃铛 ♪', s: '默认 · 温柔', sel: true },
              { t: '小鸟 ♬', s: '清晨' },
              { t: '木鱼 ♩', s: '稳' },
              { t: '震动而已', s: '静音' },
              { t: '什么都不响', s: '只看屏幕' },
            ].map((opt, i, a) => (
              <div key={i} className="hf-row" style={{
                padding: '8px 0',
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
              }}>
                <span className={`hf-radio ${opt.sel ? 'on' : ''}`} />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 14 }}>{opt.t}</div>
                  <div className="h-meta">{opt.s}</div>
                </div>
                <span className="h-meta" style={{ color: 'var(--claim)' }}>试听</span>
              </div>
            ))}
          </div>

          {/* poke */}
          <div className="h-meta" style={{ marginTop: 14 }}>朋友拍我</div>
          <div className="hf-box" style={{ marginTop: 4, padding: '4px 12px' }}>
            {[
              { t: '响一下 + 全屏', d: true },
              { t: '只震动' },
              { t: '勿扰时段不通知' },
              { t: '每天最多收 5 次拍拍' },
            ].map((r, i, a) => (
              <div key={i} className="hf-row" style={{
                padding: '8px 0',
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
              }}>
                <div className="h-row" style={{ flex: 1, fontSize: 14 }}>{r.t}</div>
                <div style={{
                  width: 32, height: 18, borderRadius: 10,
                  border: '1.5px solid var(--line)',
                  background: r.d ? 'var(--ok)' : 'var(--paper-2)',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: 1, left: r.d ? 15 : 1,
                    width: 14, height: 14, borderRadius: '50%',
                    border: '1.4px solid var(--line)', background: 'var(--paper)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Phone>
  );
};

// ─── E2. 保护卡确认 ─────────────────────────────────────────────────────
window.HfL2ShieldConfirm = function HfL2ShieldConfirm() {
  return (
    <Phone>
      <div style={{ height: '100%', position: 'relative', background: 'var(--paper)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', opacity: 0.4 }}>
          <div className="h-meta">本周</div>
          <div className="h-display">连胜 5 天</div>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(40,28,20,0.45)' }} />

        <div style={{ position: 'absolute', left: 24, right: 24, top: '50%', transform: 'translateY(-50%)' }}>
          <div className="hf-box thick" style={{ padding: '20px 18px', background: 'var(--paper)', textAlign: 'center' }}>
            <div className="hf-box thick" style={{
              width: 72, height: 88, padding: 0, margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--ok-soft)', borderColor: 'var(--ok)',
              transform: 'rotate(-4deg)',
            }}>
              <window.HF.Icon name="shield" size={42} color="var(--ok)" />
            </div>

            <div className="h-h2" style={{ marginTop: 14 }}>用 1 张保护卡？</div>
            <div className="h-body" style={{ fontFamily: 'var(--hand-2)', fontSize: 16, marginTop: 6, lineHeight: 1.5 }}>
              今天的事先放过 — <b style={{ color: 'var(--ok)' }}>连胜不会断</b>
            </div>

            <div className="hf-box dashed" style={{ marginTop: 14, padding: 10, background: 'var(--paper-2)' }}>
              <div className="h-meta">本周还有</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                {[1, 2, 3].map(i => (
                  <window.HF.Icon
                    key={i} name="shield" size={26}
                    color={i <= 2 ? 'var(--ok)' : 'var(--ink-faint)'}
                  />
                ))}
              </div>
              <div className="h-meta" style={{ marginTop: 4 }}>用掉后剩 2 张 · 周一补满</div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="hf-btn ghost" style={{ flex: 1, padding: '10px 0' }}>不用</button>
              <button className="hf-btn primary" style={{ flex: 1.5, padding: '10px 0', background: 'var(--ok)' }}>用 1 张</button>
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
};

// ─── E3. 连胜大庆祝 ─────────────────────────────────────────────────────
window.HfL2StreakBig = function HfL2StreakBig() {
  return (
    <Phone>
      <div style={{
        height: '100%', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--poke-soft) 0%, var(--paper) 60%)',
      }}>
        {/* sparkle scatter — SVG */}
        {[
          [24, 50, -15, 18], [270, 70, 12, 14], [60, 110, -8, 16],
          [250, 160, 10, 14], [30, 220, 0, 12], [260, 280, -12, 14],
          [200, 50, 8, 12], [90, 480, 6, 14], [240, 540, -6, 16],
        ].map(([x, y, r, sz], i) => (
          <span key={i} style={{
            position: 'absolute', left: x, top: y,
            transform: `rotate(${r}deg)`, color: 'var(--poke)', opacity: 0.7,
          }}>
            <window.HF.Icon name="sparkle" size={sz} />
          </span>
        ))}

        <div style={{ padding: '60px 22px 0', textAlign: 'center', position: 'relative' }}>
          <div className="h-meta" style={{ color: 'var(--poke)', letterSpacing: 2, fontSize: 13 }}>
            ★ 7 天 ★
          </div>
          <div className="h-display" style={{ fontSize: 48, marginTop: 6, lineHeight: 1.05 }}>
            一周连胜！
          </div>
          <div className="h-body" style={{ fontFamily: 'var(--hand-2)', fontSize: 17, marginTop: 8 }}>
            你坚持了一整周 — 真的不容易
          </div>

          {/* trophy sticker */}
          <div className="hf-box thick" style={{
            width: 140, height: 140, padding: 0, margin: '24px auto 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--paper)',
            transform: 'rotate(-3deg)',
            fontSize: 70,
            boxShadow: '4px 6px 0 var(--line)',
          }}>🏆</div>

          {/* streak grid */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
            {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 30, height: 36, border: '1.5px solid var(--line)',
                  borderRadius: '6px 4px 7px 5px / 5px 7px 4px 6px',
                  background: 'var(--ok)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontFamily: 'var(--hand-2)',
                  transform: `rotate(${(i % 2 ? 1 : -1) * 2}deg)`,
                }}>✓</div>
                <div className="h-meta" style={{ fontSize: 10, marginTop: 2 }}>{d}</div>
              </div>
            ))}
          </div>

          {/* next milestone */}
          <div className="hf-box dashed" style={{
            marginTop: 24, marginLeft: 12, marginRight: 12,
            padding: 10, background: 'var(--paper)', textAlign: 'left',
          }}>
            <div className="h-meta">下一个里程碑</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <window.HF.Icon name="moon" size={20} color="var(--claim)" />
              <div style={{ flex: 1 }}>
                <div className="h-row" style={{ fontSize: 14 }}>30 天 — 一个月连胜</div>
                <div className="h-meta">还差 23 天 · 不急</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'center' }}>
            <button className="hf-btn primary" style={{ padding: '10px 22px' }}>分享给小群</button>
            <button className="hf-btn ghost" style={{ padding: '10px 18px' }}>收下</button>
          </div>
        </div>
      </div>
    </Phone>
  );
};

Object.assign(window, {
  HfL2Notif: window.HfL2Notif,
  HfL2ShieldConfirm: window.HfL2ShieldConfirm,
  HfL2StreakBig: window.HfL2StreakBig,
});

// ═══════════════════════════════════════════════════════════════════════
// F. 空状态
// ═══════════════════════════════════════════════════════════════════════

// ─── F1. 首次打开 ───────────────────────────────────────────────────────
window.HfL2Onboard = function HfL2Onboard() {
  return (
    <Phone>
      <div style={{ height: '100%', background: 'var(--paper)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ padding: '60px 22px 0', textAlign: 'center' }}>
          <div className="hf-box thick" style={{
            width: 92, height: 92, padding: 0, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--paper)', fontSize: 48,
            transform: 'rotate(-4deg)',
          }}>👋</div>

          <div className="h-display" style={{ fontSize: 36, marginTop: 22, lineHeight: 1.1 }}>
            交给一个<br />会替你<br />惦记的人
          </div>
          <div className="h-body" style={{ fontFamily: 'var(--hand-2)', fontSize: 16, marginTop: 14, lineHeight: 1.5, color: 'var(--ink-mute)' }}>
            不是闹钟。<br />是朋友帮你记着，<br />忘了也没关系。
          </div>

          {/* small wins teaser */}
          <div className="hf-box dashed" style={{ marginTop: 26, padding: 12, background: 'var(--ok-soft)', textAlign: 'left' }}>
            <div className="h-meta">这里会发生</div>
            <div style={{ fontFamily: 'var(--hand-2)', fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>
              · 朋友帮你记<br />· 你也帮朋友记<br />· 完成了一起小庆祝<br />· 跳过了也没事 — 不算输
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 24, left: 22, right: 22 }}>
          <button className="hf-btn primary" style={{ width: '100%', padding: '14px 0', fontSize: 16 }}>
            先看看我能记什么
          </button>
          <div className="h-meta" style={{ textAlign: 'center', marginTop: 8 }}>
            已经有人邀请你？<span style={{ color: 'var(--claim)', textDecoration: 'underline' }}>填邀请码</span>
          </div>
        </div>
      </div>
    </Phone>
  );
};

// ─── F2. 无提醒 ─────────────────────────────────────────────────────────
window.HfL2Empty = function HfL2Empty() {
  return (
    <Phone>
      <div style={{ height: '100%', background: 'var(--paper)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px' }}>
          <div className="h-meta">星期四 · 4 月 30 日</div>
          <div className="h-display">今天</div>
        </div>

        <div style={{ padding: '20px 22px 0', textAlign: 'center' }}>
          <div className="hf-box thick tilt-l" style={{
            width: 100, height: 100, padding: 0, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--ok-soft)',
          }}>
            <window.HF.Icon name="sun" size={56} color="var(--ok)" />
          </div>

          <div className="h-h2" style={{ marginTop: 18 }}>今天没什么事</div>
          <div className="h-body" style={{ fontFamily: 'var(--hand-2)', fontSize: 16, marginTop: 6, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
            也挺好的 — 休息一下。<br />
            想加点什么吗？
          </div>

          {/* quick add chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 18 }}>
            {[
              { ic: 'coffee',   t: '早餐' },
              { ic: 'tea',      t: '喝水' },
              { ic: 'book',     t: '读 10 分钟' },
              { ic: 'wave',     t: '散个步' },
              { ic: 'sparkle',  t: '深呼吸 1 分钟' },
              { ic: 'phone',    t: '联系朋友' },
            ].map((c, i) => (
              <span key={i} className="hf-chip" style={{ fontSize: 13, padding: '4px 10px', gap: 5 }}>
                <window.HF.Icon name={c.ic} size={12} />
                {c.t}
              </span>
            ))}
          </div>

          <div className="h-meta" style={{ marginTop: 18, fontStyle: 'italic' }}>
            或者点 + 自己写一个
          </div>

          {/* friend hint */}
          <div className="hf-box dashed" style={{ marginTop: 26, padding: 10, background: 'var(--paper-2)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <window.HF.Av name="阿May" size={28} i={2} />
              <div style={{ flex: 1, fontFamily: 'var(--hand-2)', fontSize: 14 }}>
                阿May 今天读了 1 本书 ✓
              </div>
              <span className="hf-chip" style={{ fontSize: 11 }}>给个赞</span>
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
};

// ─── F3. 搜索无结果 ─────────────────────────────────────────────────────
window.HfL2SearchEmpty = function HfL2SearchEmpty() {
  return (
    <Phone>
      <div style={{ height: '100%', background: 'var(--paper)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--hand-2)', fontSize: 18 }}>‹</span>
          <div className="hf-box" style={{ flex: 1, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <window.HF.Icon name="search" size={14} />
            <span style={{ flex: 1, fontFamily: 'var(--hand)', fontSize: 16 }}>蜡笔小新</span>
            <window.HF.Icon name="x" size={12} color="var(--ink-faint)" />
          </div>
        </div>

        <div style={{ padding: '40px 22px 0', textAlign: 'center' }}>
          <div className="hf-box dashed" style={{
            width: 84, height: 84, padding: 0, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--paper-2)',
            transform: 'rotate(-3deg)',
          }}>
            <window.HF.Icon name="search" size={42} color="var(--ink-faint)" />
          </div>

          <div className="h-h2" style={{ marginTop: 16 }}>没有"蜡笔小新"</div>
          <div className="h-body" style={{ fontFamily: 'var(--hand-2)', fontSize: 15, marginTop: 6, color: 'var(--ink-mute)' }}>
            没找到你的提醒、群、朋友
          </div>

          <div className="h-meta" style={{ marginTop: 18 }}>试试看</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 6 }}>
            {['#看动画', '小新', '画画', '周日'].map((t, i) => (
              <span key={i} className="hf-chip" style={{ fontSize: 13 }}>{t}</span>
            ))}
          </div>

          {/* CTA */}
          <div className="hf-box thick" style={{ marginTop: 26, padding: 14, background: 'var(--ok-soft)' }}>
            <div className="h-row" style={{ fontSize: 14 }}>把"蜡笔小新"<br />变成新提醒？</div>
            <div className="h-meta" style={{ marginTop: 4 }}>朋友也可以来看</div>
            <button className="hf-btn primary" style={{ marginTop: 8, padding: '8px 16px', fontSize: 14 }}>
              + 新建
            </button>
          </div>
        </div>
      </div>
    </Phone>
  );
};

Object.assign(window, {
  HfL2Onboard: window.HfL2Onboard,
  HfL2Empty: window.HfL2Empty,
  HfL2SearchEmpty: window.HfL2SearchEmpty,
});
