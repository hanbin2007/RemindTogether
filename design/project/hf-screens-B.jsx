/* eslint-disable */
// hf-screens-B.jsx — Create, Invite, Poke, Reminder detail, Profile

const { Av, AvStack, Phone, TabBar, RemRow } = window.HF;

// ─── 5. 创建提醒（底部 sheet 浮在今天上） ──────────────────────────────────
window.HfCreate = function HfCreate() {
  return (
    <Phone>
      <div style={{ height: '100%', position: 'relative', background: 'var(--paper)' }}>
        {/* dimmed today behind */}
        <div style={{ position: 'absolute', inset: 0, padding: '16px 18px', opacity: 0.45 }}>
          <div className="h-meta">星期四 · 4 月 30 日</div>
          <div className="h-display">今天</div>
          <div className="hf-box" style={{ marginTop: 14, height: 76 }} />
          <div className="hf-box" style={{ marginTop: 10, height: 140 }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.18)' }} />

        {/* sheet */}
        <div className="hf-box thick" style={{
          position: 'absolute', left: 8, right: 8, bottom: 6,
          background: 'var(--paper)', padding: '10px 14px 14px',
          borderRadius: '20px 18px 22px 16px / 16px 22px 18px 20px',
          boxShadow: '0 -8px 0 rgba(0,0,0,0.04)',
        }}>
          <div style={{ width: 40, height: 4, background: 'var(--ink-faint)', borderRadius: 2, margin: '0 auto 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="h-h2">新提醒</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="hf-btn ghost" style={{ padding: '4px 10px', fontSize: 13 }}>取消</button>
              <button className="hf-btn primary" style={{ padding: '6px 12px', fontSize: 13 }}>创建</button>
            </div>
          </div>

          {/* big title input */}
          <div style={{ marginTop: 8, padding: '8px 0', borderBottom: '1.3px dashed var(--ink-faint)' }}>
            <div className="h-h1" style={{ fontSize: 24 }}>
              交读书笔记 <span style={{ color: 'var(--ink-faint)', borderLeft: '2px solid var(--ink)', marginLeft: 1 }}>&nbsp;</span>
            </div>
            <div className="h-meta" style={{ marginTop: 6 }}>
              试试一句话：<span style={{ color: 'var(--claim)' }}>明天 8 点 提醒 @阿莫 在 #读书会</span>
            </div>
          </div>

          {/* fields */}
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Field icon="calendar" label="时间" v="明天 早上 8:00" sub="每周一 重复" />
            <Field icon="handshake" label="分享到" v="#读书会" sub="12 人能看见" hl />
            <Field icon="point" label="指派给" v="@阿莫" sub="到点温柔提醒" hl />
            <Field icon="pin" label="位置" v="—" sub="到了再提醒" />
            <Field icon="paperclip" label="附件" v="封面.jpg · 0:12 语音" sub="点击添加" />
          </div>

          {/* visibility */}
          <div className="hf-box dim" style={{ marginTop: 10, padding: 8 }}>
            <div className="h-meta" style={{ marginBottom: 6 }}>谁能看到</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['lock', '只有我'], ['users', '共享', true], ['megaphone', '公开']].map(([ic, t, on], i) => (
                <div key={i} className="hf-chip" style={{
                  flex: 1, justifyContent: 'center', gap: 4,
                  background: on ? 'var(--ink)' : 'var(--paper)',
                  color: on ? 'white' : 'var(--ink)',
                  fontSize: 13,
                }}><window.HF.Icon name={ic} size={12} /> {t}</div>
              ))}
            </div>
          </div>

          <div className="h-meta" style={{ marginTop: 8, textAlign: 'center' }}>
            @ 选人 · # 选群 · / 时间 · ! 高优先
          </div>
        </div>
      </div>
    </Phone>
  );
};

function Field({ icon, label, v, sub, hl }) {
  return (
    <div className="hf-box" style={{
      padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 10,
      background: hl ? 'var(--claim-soft)' : 'var(--paper)',
      borderColor: hl ? 'var(--claim)' : 'var(--line)',
    }}>
      <div style={{
        width: 28, height: 28, fontSize: 14,
        border: '1.4px solid var(--line)', background: 'var(--paper)',
        borderRadius: '8px 5px 9px 4px / 4px 9px 5px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><window.HF.Icon name={icon} size={14} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-meta">{label}</div>
        <div className="h-row" style={{ fontSize: 16 }}>{v}</div>
      </div>
      {sub && <div className="h-meta" style={{ textAlign: 'right', maxWidth: 110 }}>{sub}</div>}
    </div>
  );
}

// ─── 6. 邀请加入 ───────────────────────────────────────────────────────────
window.HfInvite = function HfInvite() {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center' }}>
          <button className="hf-btn ghost" style={{ padding: '4px 8px', fontSize: 14 }}>‹</button>
          <div className="h-meta" style={{ marginLeft: 'auto' }}>早起鸟 · 8 人</div>
        </div>

        <div style={{ padding: '4px 18px 0' }}>
          <div className="h-display">叫上他们</div>
          <div className="h-body">加进来，今天起的提醒他们都看得见</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 30px' }}>
          {/* QR + link */}
          <div className="hf-box" style={{ padding: 12, display: 'flex', gap: 12 }}>
            <div className="hf-box tight" style={{
              width: 90, height: 90, padding: 6, background: 'var(--paper)',
            }}>
              <div style={{
                width: '100%', height: '100%',
                backgroundImage: 'radial-gradient(circle, var(--ink) 1.4px, transparent 1.4px)',
                backgroundSize: '6px 6px',
              }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="h-meta">邀请链接</div>
              <div className="hf-box dim tight" style={{ marginTop: 4, padding: 6, fontFamily: 'var(--mono)', fontSize: 11, wordBreak: 'break-all' }}>
                rmd.app/j/<b>早起鸟-K3F</b>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
                <button className="hf-btn primary" style={{ padding: '4px 10px', fontSize: 12 }}>复制</button>
                <button className="hf-btn ghost" style={{ padding: '4px 10px', fontSize: 12 }}>分享</button>
              </div>
            </div>
          </div>

          {/* via apps */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'space-between' }}>
            {[
              { l: '微信', ic: 'chat' },
              { l: '通讯录', ic: 'phone' },
              { l: 'AirDrop', ic: 'wifi' },
              { l: '邮件', ic: 'mail' },
            ].map((a, i) => (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div className="hf-box" style={{
                  width: 50, height: 50, margin: '0 auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: i % 2 ? 'rotate(-2deg)' : 'rotate(2deg)',
                }}><window.HF.Icon name={a.ic} size={22} /></div>
                <div className="h-meta" style={{ marginTop: 4 }}>{a.l}</div>
              </div>
            ))}
          </div>

          {/* people on app */}
          <div style={{ marginTop: 16 }} className="h-meta">通讯录里也用 Reminder 的</div>
          <div className="hf-box" style={{ padding: '4px 14px', marginTop: 6 }}>
            {[
              { n: '木心', sub: '昨天打卡 · 早睡党', i: 0, on: true },
              { n: '橙子', sub: '认识：你和小满', i: 4, on: true },
              { n: '夏夏', sub: '通讯录朋友', i: 5, on: false },
            ].map((p, i, a) => (
              <div key={i} className="hf-row" style={{ borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)' }}>
                <Av name={p.n} i={p.i} size={36} />
                <div style={{ flex: 1 }}>
                  <div className="h-row">{p.n}</div>
                  <div className="h-meta">{p.sub}</div>
                </div>
                <button className={`hf-btn ${p.on ? 'primary' : 'ghost'}`} style={{ padding: '4px 12px', fontSize: 13 }}>
                  {p.on ? '邀请' : '短信'}
                </button>
              </div>
            ))}
          </div>

          {/* nearby */}
          <div className="hf-box dashed" style={{ marginTop: 14, padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex' }}><window.HF.Icon name="wifi" size={22} /></span>
            <div style={{ flex: 1 }}>
              <div className="h-row">附近的人</div>
              <div className="h-meta">把手机靠近朋友自动加入</div>
            </div>
            <span className="hf-chip done">在找</span>
          </div>
        </div>
      </div>
    </Phone>
  );
};

// ─── 7. 拍拍详情（去羞耻，玩伴打气）─────────────────────────────────────
window.HfPoke = function HfPoke() {
  const phrases = [
    { t: '我也常忘 🫶', sel: true },
    { t: '差一点点！' },
    { t: '想到你了～' },
    { t: '一起搞定？' },
    { t: '不急，慢慢来' },
    { t: '今天能补上嘛' },
  ];
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center' }}>
          <button className="hf-btn ghost" style={{ padding: '4px 8px', fontSize: 14 }}>‹</button>
          <div className="h-meta" style={{ marginLeft: 'auto' }}>今日还能拍 <b style={{ color: 'var(--poke)' }}>3</b> 次</div>
        </div>

        <div style={{ padding: '4px 18px 0' }}>
          <div className="h-meta" style={{ color: 'var(--poke)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <window.HF.Icon name="wave" size={12} /> 想到 ta 了
          </div>
          <div className="h-display">拍拍阿莫</div>
          <div className="h-body" style={{ marginTop: 2 }}>不是催促，只是说一声「我在」</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 100px' }}>
          {/* big avatar w/ wave bubble (no shame) */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginTop: 4 }}>
            <div style={{ position: 'relative' }}>
              <Av name="莫" i={2} size={88} />
              <div className="hf-box thick tilt-r" style={{
                position: 'absolute', right: -22, top: -8,
                padding: '4px 8px', background: 'var(--paper)',
                fontFamily: 'var(--hand-2)', fontSize: 13,
              }}>嗨～👋</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <div className="h-h2">阿莫</div>
            <div className="h-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, background: 'var(--ok, #6aa67a)', borderRadius: '50%', display: 'inline-block' }} />
              在线 · 上次拍是 12 天前
            </div>
          </div>

          {/* pick reminder — softened copy */}
          <div className="h-meta" style={{ marginTop: 16, marginBottom: 4 }}>关于哪件事</div>
          <div className="hf-box" style={{ padding: '4px 12px' }}>
            {[
              { t: '发一张早餐照片', g: '早起鸟', late: '今早还差这个', sel: true },
              { t: '今日 30 词', g: '背词打卡', late: '今天还没开始' },
              { t: '读 10 页书', g: '读书会', late: '昨天没轮到' },
            ].map((r, i, a) => (
              <div key={i} className="hf-row" style={{
                borderBottom: i === a.length - 1 ? 'none' : '1.3px dashed var(--ink-faint)',
                background: r.sel ? 'var(--poke-soft)' : 'transparent',
                margin: r.sel ? '0 -10px' : 0, padding: r.sel ? '10px 10px' : undefined,
                borderRadius: r.sel ? 8 : 0,
              }}>
                <span className={`hf-radio ${r.sel ? 'on' : ''}`} />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 16 }}>{r.t}</div>
                  <div className="h-meta">#{r.g} · {r.late}</div>
                </div>
              </div>
            ))}
          </div>

          {/* phrase chips — all encouraging */}
          <div className="h-meta" style={{ marginTop: 14, marginBottom: 4 }}>说点啥</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {phrases.map((p, i) => (
              <span key={i} className={`hf-chip ${p.sel ? 'fill' : ''}`} style={{ fontSize: 14 }}>{p.t}</span>
            ))}
            <span className="hf-chip" style={{ fontSize: 14, gap: 4 }}>
              <window.HF.Icon name="mic" size={12} /> 语音
            </span>
          </div>

          {/* preview — friendly bubble */}
          <div className="h-meta" style={{ marginTop: 14 }}>阿莫会看到</div>
          <div className="hf-box" style={{ padding: 10, marginTop: 4, display: 'flex', gap: 10 }}>
            <Av name="夏" i={0} size={28} />
            <div className="hf-box tilt-l" style={{
              flex: 1, padding: 10, background: 'var(--poke-soft)',
              borderColor: 'var(--poke)',
            }}>
              <div className="h-meta" style={{ color: 'var(--poke)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <window.HF.Icon name="wave" size={11} /> 夏川 拍了拍你 · 早起鸟
              </div>
              <div className="h-row" style={{ fontSize: 15, marginTop: 4, fontFamily: 'var(--hand-2)' }}>
                「我也常忘 🫶」想到你的早餐照片啦
              </div>
            </div>
          </div>

          <div className="h-meta" style={{ marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>
            ※ 拍拍 ≠ 催促 · ta 看到时不会有红色提醒
          </div>
        </div>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'var(--paper)', borderTop: '1.3px dashed var(--ink-faint)',
          padding: '10px 14px', display: 'flex', gap: 8,
        }}>
          <button className="hf-btn ghost" style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <window.HF.Icon name="handshake" size={14} /> 我帮 ta 做
          </button>
          <button className="hf-btn poke" style={{ flex: 1, padding: '12px 0', fontSize: 17, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <window.HF.Icon name="wave" size={16} /> 拍一下
          </button>
        </div>
      </div>
    </Phone>
  );
};

// ─── 8. 提醒详情 (认领/反馈/加油) ──────────────────────────────────────────
window.HfReminderDetail = function HfReminderDetail() {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center' }}>
          <button className="hf-btn ghost" style={{ padding: '4px 8px', fontSize: 14 }}>‹</button>
          <span className="hf-chip dim" style={{ marginLeft: 'auto' }}>#早起鸟</span>
        </div>

        <div style={{ padding: '4px 18px 8px' }}>
          <div className="h-display" style={{ fontSize: 26 }}>发一张早餐照片</div>
          <div className="h-body" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Av name="满" i={1} size={20} />
            小满 创建 · 6:42 · 截止 8:30
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 14px 100px' }}>
          {/* assigned + claim */}
          <div className="hf-box" style={{ padding: 12 }}>
            <div className="h-meta">指派给</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <Av name="莫" i={2} size={36} />
              <div style={{ flex: 1 }}>
                <div className="h-row" style={{ fontSize: 16 }}>阿莫</div>
                <div className="h-meta">本周还在适应节奏</div>
              </div>
              <span className="hf-chip" style={{ background: 'var(--poke-soft)', color: 'var(--poke)', borderColor: 'var(--poke)' }}>2 人想到 ta</span>
            </div>
            <div className="hf-box dashed" style={{ marginTop: 10, padding: 8, background: 'var(--claim-soft)', borderColor: 'var(--claim)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', color: 'var(--claim)' }}><window.HF.Icon name="handshake" size={16} /></span>
              <div style={{ flex: 1, fontSize: 14, fontFamily: 'var(--hand-2)' }}>
                <b>3 人</b> 也想搭把手：可乐、橘子、九
              </div>
              <button className="hf-btn claim" style={{ padding: '4px 10px', fontSize: 13 }}>我也来</button>
            </div>
          </div>

          {/* 今日小赢 — celebrate completed wins */}
          <div className="hf-box thick tilt-r" style={{ marginTop: 14, padding: 12, background: 'var(--ok-soft, #f0f6ed)', borderColor: 'var(--ok, #6aa67a)' }}>
            <div className="h-meta" style={{ color: 'var(--ok, #6aa67a)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <window.HF.Icon name="check" size={12} /> 今日小赢
            </div>
            <div className="h-row" style={{ fontSize: 16, marginTop: 4, fontFamily: 'var(--hand-2)' }}>你今天已经搞定 <b>3 件</b> 啦 🎉</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {['吃药', '晨跑', '回邮件'].map((t, i) => (
                <span key={i} className="hf-chip" style={{ fontSize: 12, textDecoration: 'line-through', opacity: 0.7 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* timeline */}
          <div className="h-meta" style={{ marginTop: 14, marginBottom: 4 }}>朋友的话</div>
          <div className="hf-box" style={{ padding: '4px 12px' }}>
            <Comment n="可" name="可乐" time="7:42" text="我也常这样～" reacts={[['fire', 2]]} />
            <Comment n="莫" name="阿莫" time="7:55" text="别怕重做，我陪你" reacts={[['heart', 3]]} />
            <Comment n="九" name="九" time="8:01" image last />
          </div>

          {/* streak + protection — encouraging not punitive */}
          <div className="hf-box dim" style={{ marginTop: 14, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="h-meta">最近 14 天 · 连胜 <b style={{ color: 'var(--ink)' }}>5</b></div>
              <div className="h-meta" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <window.HF.Icon name="shield" size={11} /> 保护卡 ×2
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {['l3','l3','skip','l3','l3','l3','skip','l3','l3','l3','skip','skip','l3'].map((s, i) => (
                <div key={i} className={`hf-dot ${s === 'skip' ? '' : s}`} style={{
                  width: 16, height: 22, flex: 1,
                  background: s === 'skip' ? 'var(--paper)' : undefined,
                  borderStyle: s === 'skip' ? 'dashed' : undefined,
                }} />
              ))}
              <div className="hf-dot" style={{ width: 16, height: 22, flex: 1, borderStyle: 'dashed', background: 'var(--poke-soft)', borderColor: 'var(--poke)' }} />
            </div>
            <div className="h-meta" style={{ marginTop: 6 }}>■ 收下  ⌧ 跳过日（不算输）  ▢ 今天</div>
          </div>
        </div>

        {/* footer — encouraging primary, no shame */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'var(--paper)', borderTop: '1.3px dashed var(--ink-faint)',
          padding: '10px 14px', display: 'flex', gap: 6,
        }}>
          <button className="hf-btn primary" style={{ flex: 1, fontSize: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><window.HF.Icon name="check" size={14} /> 收下，发个图</button>
          <button className="hf-btn ghost" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>今天跳过</button>
          <button className="hf-btn ghost" style={{ fontSize: 15, display: 'inline-flex', alignItems: 'center' }}><window.HF.Icon name="chat" size={14} /></button>
        </div>
      </div>
    </Phone>
  );
};

function Comment({ n, name, time, text, reacts = [], image, last }) {
  return (
    <div className="hf-row" style={{ alignItems: 'flex-start', borderBottom: last ? 'none' : '1.3px dashed var(--ink-faint)' }}>
      <Av name={n} i={n.charCodeAt(0)} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div className="h-row" style={{ fontSize: 14 }}>{name}</div>
          <div className="h-meta">{time}</div>
        </div>
        {text && <div className="h-body" style={{ fontSize: 15, color: 'var(--ink)', marginTop: 1 }}>{text}</div>}
        {image && <div className="hf-img" style={{ marginTop: 6, height: 80 }}>[完成图：吐司 + 蛋]</div>}
        {reacts.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
            {reacts.map(([e, c], k) => (
              <span key={k} className="hf-chip dim" style={{ fontSize: 12, padding: '2px 7px', gap: 3 }}><window.HF.Icon name={e} size={11} /> {c}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 9. 我 / 通知 ──────────────────────────────────────────────────────────
window.HfProfile = function HfProfile() {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
        <div style={{ padding: '14px 18px 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Av name="夏" i={0} size={56} />
          <div style={{ flex: 1 }}>
            <div className="h-h1">夏川</div>
            <div className="h-meta">@xiachuan · 入伙 184 天</div>
          </div>
          <button className="hf-btn ghost" style={{ padding: '6px 10px', fontSize: 16, display: 'inline-flex', alignItems: 'center' }}><window.HF.Icon name="gear" size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 70px' }}>
          {/* energy card */}
          <div className="hf-box thick" style={{ padding: 14, background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <div className="h-meta" style={{ color: 'rgba(255,255,255,0.55)' }}>本周能量卡</div>
              <div className="h-meta" style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 'auto' }}>4/24 — 4/30</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 8 }}>
              <Stat v="86%" l="完成率" big />
              <Stat v="23 天" l="连胜" />
              <Stat v="4" l="拍朋友" />
              <Stat v="1" l="被想起" />
            </div>
            {/* dot heatmap */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4, marginTop: 12 }}>
              {Array.from({ length: 14 * 4 }).map((_, i) => {
                const v = (i * 7 + i % 5) % 5;
                const op = [0.08, 0.18, 0.38, 0.6, 0.9][v];
                return <div key={i} style={{ aspectRatio: '1', borderRadius: '4px 3px 5px 3px / 3px 5px 3px 4px', background: `rgba(255,255,255,${op})`, border: '1px solid rgba(255,255,255,0.2)' }} />;
              })}
            </div>
            <div className="h-meta" style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>横：天 · 纵：早午晚夜</div>
          </div>

          {/* notifications */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 18 }}>
            <div className="h-h3">最近</div>
            <div className="h-meta" style={{ marginLeft: 'auto', color: 'var(--claim)' }}>全部已读</div>
          </div>
          <div className="hf-box" style={{ padding: '4px 12px', marginTop: 6 }}>
            <Notif type="poke" who="小满" g="读书会" t="拍了拍你" sub="读书笔记到时间啦" time="2 分前" />
            <Notif type="claim" who="可乐" g="早起鸟" t="认领了" sub="晨跑 5km" time="今早 7:02" />
            <Notif type="done" who="阿莫" g="早起鸟" t="完成了" sub="早餐打卡 + 配图" time="今早 8:31" />
            <Notif type="invite" who="九" t="加入了你" sub="读书会" time="昨天" />
            <Notif type="owe" g="背词打卡" t="本周加油榜" sub="你已经收下 5 件啦" time="周一" last />
          </div>

          {/* quick settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
            {[
              { ic: 'moon', l: '勿扰', sub: '23:00 — 7:00' },
              { ic: 'wave', l: '允许被拍拍', sub: '5 个群' },
              { ic: 'bell', l: '通知声', sub: '微信式' },
              { ic: 'trendDown', l: '我的小赢', sub: '查看完成历史' },
            ].map((s, i) => (
              <div key={i} className="hf-box" style={{ padding: 10 }}>
                <div style={{ height: 22, display: 'flex', alignItems: 'center' }}><window.HF.Icon name={s.ic} size={18} /></div>
                <div className="h-row" style={{ fontSize: 14, marginTop: 2 }}>{s.l}</div>
                <div className="h-meta">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <TabBar active={4} />
      </div>
    </Phone>
  );
};

function Stat({ v, l, big }) {
  return (
    <div>
      <div className="h-display" style={{ fontSize: big ? 30 : 18, color: 'white' }}>{v}</div>
      <div className="h-meta" style={{ color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{l}</div>
    </div>
  );
}

function Notif({ type, who, g, t, sub, time, last }) {
  const cfg = {
    poke:   { ic: 'wave',      c: 'var(--poke)',     bg: 'var(--poke-soft)' },
    claim:  { ic: 'handshake', c: 'var(--claim)',    bg: 'var(--claim-soft)' },
    done:   { ic: 'check',     c: 'var(--done)',     bg: 'var(--done-soft)' },
    invite: { ic: 'plus',      c: 'var(--ink)',      bg: 'var(--paper-2)' },
    owe:    { ic: 'trendDown', c: 'var(--ink-soft)', bg: 'var(--paper-2)' },
  }[type];
  return (
    <div className="hf-row" style={{ borderBottom: last ? 'none' : '1.3px dashed var(--ink-faint)' }}>
      <div style={{
        width: 32, height: 32, fontSize: 14,
        borderRadius: '8px 5px 9px 4px / 4px 9px 5px 8px',
        border: `1.5px solid ${cfg.c}`, background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: cfg.c,
      }}><window.HF.Icon name={cfg.ic} size={14} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-row" style={{ fontSize: 14 }}>
          {who && <b>{who}</b>} <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>{t}</span>
          {g && <> · <span style={{ color: cfg.c }}>#{g}</span></>}
        </div>
        <div className="h-meta">{sub}</div>
      </div>
      <div className="h-meta" style={{ alignSelf: 'flex-start', marginTop: 4 }}>{time}</div>
    </div>
  );
}
