// prototype_v28 — Money chart sortable by Balance and Children per woman. prototype_v27 — tag filters back in What matters most. prototype_v26 — Money table without category tags (not even rendered), cache-busting file names. prototype_v25 — dataset v27, highlight sentences continue the number, Two paths removed, Money tags only on the chart. prototype_v24 — opaque header, Two paths rule under the subtitle, highlight cards like the random card, round cursor frame. prototype_v23 — solid sticky bars, logo back, crosshair cursor + inertial scroll (after zrk.technology), no tag filters, tags back on highlight cards, Two paths heads with rule. prototype_v22 — CA logo, fixed header with tabs + sticky controls, Money chart first with clickable category tags, dataset source links, random card layout, motion (smooth scroll, reveals, custom cursor). prototype_v21 — sticky tabs, switch left / tags right, no captions in tabs, Two paths only in Highlights, random highlight spacing. prototype_v20 — 'Cash or Care?', centred layout, home correlation cards, Two paths finding, new copy, personal line, quiz redesign. prototype_v19 — full-width tabs (1/4 each), separate summary cards with aligned rows, rank as n/27 + mini dot strip. prototype_v18 — underlined pickers again, 4px corners, rank badge + position bar in summary cells. prototype_v17 — prominent tabs, pill country pickers, summary strips without captions, no source links on numbers (all sources listed on About), one value per dot row, radar hover data. prototype_v16 — one type scale, tabs as UI text, no footer, dots grouped in white cards per tag, profile with similarity heading, wider random highlight, two-column country card. prototype_v15 — custom dropdowns (small list type), ranks as 22/27, smaller intro and compare header. prototype_v14 — Compare header restyled after Katya's screenshots. prototype_v13 — Katya's review of v12 (2026-11-18): plain-language labels, impersonal inviting copy, no income selector
// (Medium income only), Highlights / About the data / Dataset as separate pages in the top menu, Compare = dots (vs all
// countries) or profile (vs one country) with highlight cards, map only in All indicators, country card as a centred pop-up
// listing every indicator with its tag, its value, its rank and the data it is built on.
// Earlier history: see prototype/README.md. Data: data.js (window.DATA) built by code/export_prototype_data_v03.py from dataset v26.
// Nothing is calculated here except ranks, medians and formatting: every value comes from the Data / Derived / Correlations sheets.
(function () {
  'use strict';
  const D = window.DATA;
  const LEVEL = 'Medium'; // v13: one model family only (mother 0.67×, partner 1× the average wage)
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byIso = Object.fromEntries(D.countries.map((c) => [c.iso, c]));
  const NC = D.countries.length;

  // ---------------------------------------------------------------- state
  const DEFAULT = { page: 'home', view: 'compare', cmp: 'CHE', cmp2: 'ALL', group: 'All', openInd: null, allMode: 'list', mapInd: 'F1', moneyMode: 'chart', moneyOff: [], sortKey: 'F1', dir: 'desc', hlMode: 'all', hlTag: 'All', focus: 'CHE' };
  let state = { ...DEFAULT };
  try { Object.assign(state, JSON.parse(localStorage.getItem('moc_v28') || '{}')); } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem('moc_v28', JSON.stringify(state)); } catch (e) { /* ignore */ } };

  // ---------------------------------------------------------------- formatting
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const fmtUSD = (v, signed = false) => (isNum(v) ? `${v < 0 ? '−' : signed && v > 0 ? '+' : ''}$${Math.round(Math.abs(v)).toLocaleString('en-US')}` : null);
  const fmtNum = (v, d = 1) => (isNum(v) ? v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : null);
  const fmtPct = (v, d = 0, signed = false) => (isNum(v) ? `${v < 0 ? '−' : signed && v > 0 ? '+' : ''}${Math.abs(v).toFixed(d)}%` : null);
  const fmtChg = (v) => (isNum(v) ? `${v < 0 ? '−' : v > 0 ? '+' : '±'}${Math.abs(v).toFixed(2)}` : null);
  const NODATA = '<span class="nodata">no data</span>';
  const firstUrl = (u) => String(u || '').split(' ; ').map((s) => s.trim()).find((s) => /^https?:\/\//.test(s)) || '';
  const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;

  function marker(status, note) {
    const kind = status === 'Estimate' ? 'est' : status === 'To verify' ? 'ver' : null;
    if (!kind) return '';
    const head = kind === 'est' ? 'Estimate' : 'To verify';
    const what = kind === 'est' ? 'Calculated from national rules, or measured a little differently.' : 'Sources disagree or confirmation is weak.';
    const n = String(note || '').trim();
    const tip = `<b>${head}</b><span>${esc(n || what)}</span>${n ? `<small>${esc(what)}</small>` : ''}`;
    return `<button type="button" class="mk-btn" data-tip="${esc(tip)}" aria-label="${esc(head)}${n ? `: ${esc(n)}` : ''}"><span class="mk mk-${kind}"></span>${n ? '<span class="ast" aria-hidden="true">*</span>' : ''}</button>`;
  }
  // A number with its provenance: link to the source + discreet status marker.
  function N(text, prov) {
    if (text == null || !prov) return NODATA;
    // v17: no source links on numbers; every source is listed on About the data
    return `<span class="n">${text}</span>${marker(prov.status, prov.note)}`;
  }

  // ---------------------------------------------------------------- accessors (Medium income)
  const der = (c, id) => c.levels[LEVEL].derived[id] || c.all[id] || null;
  const dv = (c, id) => { const d = der(c, id); return d && isNum(d.v) ? d.v : null; };
  const val = (c, id) => c.values[id] || null;
  const vv = (c, id) => { const x = val(c, id); return x && isNum(x.v) ? x.v : null; };
  const money = (c, id) => c.levels[LEVEL].money[id] || null;
  const s1Text = (c) => { const s = val(c, 'S1'); if (!s || s.v == null) return null; return isNum(s.v) ? (s.v >= 12 && s.v % 12 === 0 ? `age ${s.v / 12}` : `${s.v} months`) : 'not guaranteed'; };

  // ---------------------------------------------------------------- one catalogue of indicators: plain names, tags, values, formats
  const TAGS = ['Births', 'Money', 'Leave & daycare', 'Culture', 'State'];
  const TAG_CLASS = { Births: 'g-births', Money: 'g-money', 'Leave & daycare': 'g-leave', Culture: 'g-culture', State: 'g-state' };
  const tagChip = (t) => `<span class="gtag ${TAG_CLASS[t] || ''}">${esc(t)}</span>`;
  const fromVal = (id) => (c) => { const x = val(c, id); return x && isNum(x.v) ? { v: x.v, p: x } : null; };
  const fromDer = (id) => (c) => { const x = der(c, id); return x && isNum(x.v) ? { v: x.v, p: x } : null; };
  const fromMoney = (id) => (c) => { const x = money(c, id); return x && isNum(x.pct) ? { v: x.pct, usd: x.usd, p: { ...x, v: x.usd } } : null; };
  const pct = (d) => (v) => fmtPct(v, d);
  const usdPct = (per) => (v, x) => `${fmtUSD(x?.usd)}${per}<small> · ${fmtPct(v, 1)}</small>`;
  const IND = [
    { id: 'F1', tag: 'Births', name: 'Children per woman', s: 'Children', get: fromVal('F1'), f: (v) => fmtNum(v, 2) },
    { id: 'F3', tag: 'Births', name: 'Mother’s age at first baby', s: 'Age at 1st baby', get: fromVal('F3'), f: (v) => fmtNum(v, 1) },
    { id: 'D06', tag: 'Money', name: 'State support, % of family income', s: 'Support', get: fromDer('D06'), f: pct(1), inputs: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'] },
    { id: 'D09', tag: 'Money', name: 'Cost of a baby, % of family income', s: 'Costs', get: fromDer('D09'), f: pct(1), inputs: ['M7', 'M8', 'M9'] },
    { id: 'D12', tag: 'Money', name: 'What’s left after costs, % of family income', s: 'Balance', get: fromDer('D12'), f: (v) => fmtPct(v, 1, true), inputs: ['D06', 'D09'] },
    { id: 'D16', tag: 'Money', name: 'Mother’s workdays a month to pay daycare', s: 'Daycare days', get: fromDer('D16'), f: (v) => fmtNum(v, 1), inputs: ['M7'] },
    { id: 'D19', tag: 'Money', name: 'Mother’s pay left after daycare', s: 'Pay left', get: fromDer('D19'), f: pct(0), inputs: ['M7'] },
    { id: 'M1', tag: 'Money', name: 'One-off birth payment', get: fromMoney('M1'), f: usdPct('') },
    { id: 'M2', tag: 'Money', name: 'Child allowance a year', get: fromMoney('M2'), f: usdPct('') },
    { id: 'M3', tag: 'Money', name: 'Child tax break a year', get: fromMoney('M3'), f: usdPct('') },
    { id: 'M4', tag: 'Money', name: 'Baby bonus', get: fromMoney('M4'), f: usdPct('') },
    { id: 'M5', tag: 'Money', name: 'Mother’s pay during leave', get: fromMoney('M5'), f: usdPct('') },
    { id: 'M6', tag: 'Money', name: 'Father’s pay during leave', get: fromMoney('M6'), f: usdPct('') },
    { id: 'M7', tag: 'Money', name: 'Daycare fees a year', get: fromMoney('M7'), f: usdPct('') },
    { id: 'M8', tag: 'Money', name: 'Cost of giving birth', get: fromMoney('M8'), f: usdPct('') },
    { id: 'M9', tag: 'Money', name: 'Child health insurance a year', get: fromMoney('M9'), f: usdPct('') },
    { id: 'T1', tag: 'Leave & daycare', name: 'Maternity leave, weeks', get: fromVal('T1'), f: (v) => fmtNum(v, 0) },
    { id: 'T2', tag: 'Leave & daycare', name: 'Maternity pay, % of salary', get: fromVal('T2'), f: pct(0) },
    { id: 'T3', tag: 'Leave & daycare', name: 'Mother’s leave at full pay, weeks', s: 'Mother’s leave', get: fromVal('T3'), f: (v) => fmtNum(v, 0) },
    { id: 'T4', tag: 'Leave & daycare', name: 'Father’s leave at full pay, weeks', s: 'Father’s leave', get: fromVal('T4'), f: (v) => fmtNum(v, 1) },
    { id: 'S1', tag: 'Leave & daycare', name: 'Daycare place guaranteed from', get: fromVal('S1'), f: (v) => (v >= 12 && v % 12 === 0 ? `age ${v / 12}` : `${v} months`) },
    { id: 'S2', tag: 'Leave & daycare', name: 'Toddlers in daycare', s: 'In daycare', get: fromVal('S2'), f: pct(0) },
    { id: 'S3', tag: 'Leave & daycare', name: 'School starting age', get: fromVal('S3'), f: (v) => fmtNum(v, 0) },
    { id: 'X4', tag: 'Culture', name: 'Mothers of toddlers who work', s: 'Working mothers', get: fromVal('X4'), f: pct(0) },
    { id: 'D31', tag: 'Culture', name: 'Women’s housework and care compared with men', s: 'Housework gap', get: fromDer('D31'), f: (v) => `×${fmtNum(v, 1)}`, inputs: ['X2', 'X3'], sentence: (v) => `Women do ×${fmtNum(v, 1)} more housework and care than men` },
    { id: 'X2', tag: 'Culture', name: 'Women’s housework and care, min a day', hidden: true, get: fromVal('X2'), f: (v) => `${Math.round(v)} min` },
    { id: 'X3', tag: 'Culture', name: 'Men’s housework and care, min a day', hidden: true, get: fromVal('X3'), f: (v) => `${Math.round(v)} min` },
    { id: 'X6', tag: 'Culture', name: 'Agree “kids suffer if the mother works”', s: '“Kids suffer”', get: fromVal('X6'), f: pct(0) },
    { id: 'X7', tag: 'Culture', name: 'Toddlers looked after by grandparents', s: 'Grandparents', get: fromVal('X7'), f: pct(0) },
    { id: 'X8', tag: 'Culture', name: 'Babies born outside marriage', s: 'Outside marriage', get: fromVal('X8'), f: pct(0) },
    { id: 'C2', tag: 'State', name: 'State family benefits, % of GDP', s: 'State benefits', get: fromVal('C2'), f: (v) => `${fmtNum(v, 2)}%` },
  ];
  const FAMILY = 'For a family like this: two working parents, first baby, average wages.';
  const IN = Object.fromEntries(IND.map((i) => [i.id, i]));
  const corrOf = (id) => D.correlations.find((x) => x.id === id && (x.level === 'All' || x.level === LEVEL));
  const fmtR = (r) => (isNum(r) ? `${r < 0 ? '−' : '+'}${Math.abs(r).toFixed(2)}` : '—');
  const fmtI = (ind, x) => (x ? ind.f(x.v, x) : null);
  const valHtml = (ind, x) => (x ? N(fmtI(ind, x), x.p) : NODATA);
  // ranks: 1 = highest value
  const statsCache = {};
  function stats(id) {
    if (statsCache[id]) return statsCache[id];
    const ind = IN[id];
    const pts = D.countries.map((c) => ({ c, x: ind.get(c) })).filter((d) => d.x).sort((a, b) => b.x.v - a.x.v);
    const vs = pts.map((d) => d.x.v), n = vs.length;
    const median = n ? (n % 2 ? vs[(n - 1) / 2] : (vs[n / 2 - 1] + vs[n / 2]) / 2) : null;
    const rank = new Map(pts.map((d, i) => [d.c.iso, i + 1]));
    return (statsCache[id] = { ind, pts, n, median, rank, max: pts[0], min: pts[n - 1] });
  }
  const pctPos = (id, iso) => { const s = stats(id), r = s.rank.get(iso); return r == null ? null : s.n > 1 ? (s.n - r) / (s.n - 1) : 0.5; };

  // ---------------------------------------------------------------- gift at birth (K1): Yes / Some families / No
  const GIFT = { FIN: 'yes', KOR: 'yes', GBR: 'some', HUN: 'some', USA: 'some', RUS: 'some', JPN: 'some', POL: 'some', CHN: 'some' };
  const GIFT_LABEL = { yes: 'Yes', some: 'Some families', no: 'No' };
  const giftKind = (c) => (val(c, 'K1')?.v ? GIFT[c.iso] || 'no' : null);
  function giftCell(c) {
    const gift = val(c, 'K1'), k = giftKind(c);
    if (!k) return NODATA;
    const tip = `<b>${esc(k === 'no' ? 'No gift, but other help' : k === 'some' ? 'Only for some families' : 'What the family gets')}</b><span>${esc(gift.v)}</span>`;
    return `<button type="button" class="gift-yn g-${k}" data-tip="${esc(tip)}" aria-label="${esc(GIFT_LABEL[k])}: ${esc(gift.v)}">${GIFT_LABEL[k]}<span class="i" aria-hidden="true">i</span></button>${marker(gift.status, gift.note)}`;
  }

  // ---------------------------------------------------------------- v15 dropdown: own list instead of the native <select>
  // (the native pop-up copies the big serif size of the header on macOS; this list always uses 15px sans).
  // items: [{ value, label, group?, disabled? }]
  function dd(name, value, items, cls = '') {
    const cur = items.find((i) => i.value === value) || items[0];
    let lastG = null;
    const lis = items.map((i) => {
      const g = i.group && i.group !== lastG ? `<li class="dd-g" role="presentation">${esc(i.group)}</li>` : ''; lastG = i.group || lastG;
      return `${g}<li role="presentation"><button type="button" role="option" class="dd-o ${i.value === value ? 'on' : ''}" data-dd="${name}" data-ddval="${esc(i.value)}" aria-selected="${i.value === value}" ${i.disabled ? 'disabled' : ''}>${esc(i.label)}</button></li>`;
    }).join('');
    return `<div class="dd ${cls}" data-ddbox="${name}"><button type="button" class="dd-btn" aria-haspopup="listbox" aria-expanded="false">${esc(cur.label)}</button><ul class="dd-list" role="listbox" hidden>${lis}</ul></div>`;
  }
  const countryItems = () => [...D.countries].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.iso, label: c.name }));
  function closeDD(except) { document.querySelectorAll('.dd-list:not([hidden])').forEach((l) => { if (l.parentNode !== except) { l.hidden = true; l.previousElementSibling.setAttribute('aria-expanded', 'false'); } }); }
  function onPick(name, v) {
    if (name === 'cmp') state.cmp = v;
    if (name === 'cmp2') state.cmp2 = v;
    if (name === 'map') state.mapInd = v;
    save(); render();
  }

  // v20: two main correlations on the home screen
  function renderHomeCards() {
    const sup = corrOf('D06'), wm = corrOf('X4');
    const card = (tag, r, text) => `<article class="hc2 ${TAG_CLASS[tag]}">${tagChip(tag)}<span class="hc2-r">${fmtR(r?.rho)}</span><p>${esc(text)}</p></article>`;
    $('#homeCards').innerHTML = card('Money', sup, 'Countries that pay more have fewer babies — often because they started paying after births fell.') + card('Culture', wm, 'Where mothers can keep their jobs, more babies are born.');
  }

  // ================================================================ HOME · Compare a country
  const CMP = ['F1', 'F3', 'D06', 'D09', 'D12', 'D16', 'D19', 'T3', 'T4', 'S2', 'X4', 'D31', 'X6', 'X7', 'X8', 'C2'];
  const countryOpts = (sel, extra) => (extra || '') + [...D.countries].sort((a, b) => a.name.localeCompare(b.name)).map((c) => `<option value="${c.iso}" ${c.iso === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  function renderCompare() {
    if (!byIso[state.cmp]) state.cmp = 'CHE';
    if (state.cmp2 !== 'ALL' && (!byIso[state.cmp2] || state.cmp2 === state.cmp)) state.cmp2 = 'ALL';
    $('#cmpPick').innerHTML = dd('cmp', state.cmp, countryItems(), 'line a');
    $('#cmp2Pick').innerHTML = dd('cmp2', state.cmp2, [{ value: 'ALL', label: `the other ${NC - 1} countries` }, ...countryItems().map((i) => ({ ...i, disabled: i.value === state.cmp }))], `line b ${state.cmp2 === 'ALL' ? 'all' : ''}`);
    $('#cmpBody').innerHTML = state.cmp2 === 'ALL' ? cmpAll() : cmpPair();
  }
  // standout lists for a country: where it is closest to the top or bottom
  function standouts(iso) {
    return CMP.filter((id) => id !== 'F1').map((id) => {
      const s = stats(id), r = s.rank.get(iso); if (r == null) return null;
      const fromBot = s.n - r + 1, top = r <= fromBot, k = top ? r : fromBot;
      return { id, s, r, k, top, x: s.pts[r - 1].x };
    }).filter(Boolean).sort((a, b) => a.k - b.k || Math.abs(b.x.v - b.s.median) / (Math.abs(b.s.median) || 1) - Math.abs(a.x.v - a.s.median) / (Math.abs(a.s.median) || 1));
  }
  const posPhrase = (o) => (o.k === 1 ? (o.top ? 'Highest' : 'Lowest') : `${ord(o.k)} ${o.top ? 'highest' : 'lowest'}`);
  // v17: summary strip = one band with three cells (tag, number, one line), no captions
  // v19: rk = { id, iso } → rank 'n/27' top-right (serif, like the dots view) + a mini dot strip at the bottom:
  // every country as a small dot on the indicator's scale, this country in burgundy. Top 3 from either end get a word: Highest / Lowest / 2nd highest …
  function rankHtml(rk) {
    if (!rk) return { top: '', strip: '' };
    const s = stats(rk.id), r = s.rank.get(rk.iso); if (!r) return { top: '', strip: '' };
    const fromBot = s.n - r + 1, hi = r <= fromBot, k = hi ? r : fromBot;
    const word = k <= 3 ? (k === 1 ? (hi ? 'Highest' : 'Lowest') : `${ord(k)} ${hi ? 'highest' : 'lowest'}`) : '';
    const lo = s.min.x.v, span = (s.max.x.v - lo) || 1, X = (v) => 3 + ((v - lo) / span) * 94;
    const dots = s.pts.map((d) => `<i class="${d.c.iso === rk.iso ? 'me' : ''}" style="left:${X(d.x.v).toFixed(1)}%"></i>`).join('');
    return {
      top: `<span class="rk2">${word ? `<span class="rk2-w">${word}</span>` : ''}<span class="rk2-n">${r}/${s.n}</span></span>`,
      strip: `<span class="rk2-strip" aria-hidden="true"><span class="rk2-line"></span>${dots}</span>`,
    };
  }
  function hcard(cls, tag, big, head, rk) {
    const r = rankHtml(rk);
    return `<div class="sum-c ${cls}"><div class="sum-top">${tag ? tagChip(tag) : '<span></span>'}${r.top}</div><span class="sum-big">${big}</span><span class="sum-l">${head}</span>${r.strip}</div>`;
  }
  const strip = (cells) => `<div class="sum">${cells}</div>`;
  function cmpAll() {
    const me = byIso[state.cmp], f = stats('F1');
    const so = standouts(me.iso);
    const cards = [
      hcard('accent', 'Births', N(fmtNum(vv(me, 'F1'), 2), val(me, 'F1')), 'Children per woman', { id: 'F1', iso: me.iso }),
      ...so.slice(0, 2).map((o) => hcard('', o.s.ind.tag, valHtml(o.s.ind, o.x), esc(o.s.ind.name), { id: o.id, iso: me.iso })),
    ].join('');
    let last = null;
    const rows = CMP.map((id) => {
      const s = stats(id), ind = s.ind; if (!s.n) return '';
      const lo = s.min.x.v, hi = s.max.x.v, span = hi - lo || 1, X = (v) => 2 + ((v - lo) / span) * 96;
      const r = s.rank.get(me.iso), mine = r ? s.pts[r - 1] : null;
      // gentle stacking of close values so dots do not hide each other
      const lanes = {};
      const dots = s.pts.map((d) => {
        const b = Math.round(X(d.x.v) / 2.2), lane = (lanes[b] = (lanes[b] ?? -1) + 1);
        const off = lane === 0 ? 0 : (lane % 2 ? -1 : 1) * Math.ceil(lane / 2) * 9;
        return `<button class="cd ${d === mine ? 'me' : ''}" data-cmp="${d.c.iso}" style="left:${X(d.x.v).toFixed(2)}%;--off:${off}px" aria-label="${esc(d.c.name)}: ${esc(String(fmtI(ind, d.x)).replace(/<[^>]+>/g, ''))}"><i></i><span class="cd-tip">${esc(d.c.name)} <b>${fmtI(ind, d.x)}</b></span></button>`;
      }).join('');
      const head = ind.tag !== last ? `${last ? '</div></section>' : ''}<section class="cgroup"><div class="cg">${tagChip(ind.tag)}</div><div class="cbox">` : ''; last = ind.tag;
      return `${head}<div class="cr t${TAG_CLASS[ind.tag]}">
        <div class="cr-rank">${r ? `${r}/${s.n}` : '—'}</div>
        <div class="cr-l">${esc(ind.name)}</div>
        <div class="cr-s"><span class="cr-axis"></span><span class="cr-med" style="left:${X(s.median).toFixed(2)}%"></span>${dots}
          ${mine ? `<span class="cr-flag" style="left:${X(mine.x.v).toFixed(2)}%">${fmtI(ind, mine.x)}${marker(mine.x.p.status, mine.x.p.note)}</span>` : `<span class="cr-none">${NODATA}</span>`}
          <span class="cr-end l">${fmtI(ind, s.min.x)}</span><span class="cr-end r">${fmtI(ind, s.max.x)}</span></div>
      </div>`;
    }).join('');
    return `${strip(cards)}<div class="cdots">${rows}${last ? '</div></section>' : ''}</div>`;
  }
  function cmpPair() {
    const a = byIso[state.cmp], b = byIso[state.cmp2];
    const diffs = CMP.filter((id) => id !== 'F1').map((id) => ({ id, pa: pctPos(id, a.iso), pb: pctPos(id, b.iso) })).filter((d) => d.pa != null && d.pb != null).map((d) => ({ ...d, d: Math.abs(d.pa - d.pb) })).sort((x, y) => x.d - y.d);
    const sim = diffs.length ? 1 - diffs.reduce((t, d) => t + d.d, 0) / diffs.length : null;
    const alike = diffs[0], apart = diffs[diffs.length - 1];
    const two = (id) => { const ind = IN[id]; return `${fmtI(ind, ind.get(a)) ?? '—'}<small> vs </small>${fmtI(ind, ind.get(b)) ?? '—'}`; };
    const fa = vv(a, 'F1'), fb = vv(b, 'F1');
    const cards = [
      hcard('accent', 'Births', `${fmtNum(fa, 2)}<small> vs </small>${fmtNum(fb, 2)}`, 'children per woman'),
      alike ? hcard('', IN[alike.id].tag, two(alike.id), `Most alike: ${esc(IN[alike.id].name.toLowerCase())}`) : '',
      apart ? hcard('', IN[apart.id].tag, two(apart.id), `Most different: ${esc(IN[apart.id].name.toLowerCase())}`) : '',
    ].join('');
    const simH = sim != null ? `<h3 class="pair-h">${esc(a.name)} and ${esc(b.name)} are <b>${Math.round(sim * 100)}%</b> alike across all indicators</h3>` : '';
    return `${strip(cards)}${radar(a, b, simH)}`;
  }
  function radar(a, b, title = '') {
    const ids = CMP, n = ids.length, R0 = 200, C = 270;
    const ang = (i) => -Math.PI / 2 + (i / n) * Math.PI * 2;
    const P = (i, r) => [C + Math.cos(ang(i)) * r * R0, C + Math.sin(ang(i)) * r * R0];
    const rOf = (id, c) => { const p = pctPos(id, c.iso); return p == null ? null : 0.12 + p * 0.88; };
    const pts = (c) => ids.map((id, i) => { const r = rOf(id, c); return { i, r, xy: P(i, r ?? 0.12) }; });
    const smooth = (ps) => (window.d3 ? d3.line().curve(d3.curveCatmullRomClosed.alpha(0.5))(ps.map((p) => p.xy)) : `M${ps.map((p) => p.xy.join(',')).join('L')}Z`);
    const rings = [0.25, 0.5, 0.75, 1].map((r) => `<circle cx="${C}" cy="${C}" r="${(0.12 + r * 0.88) * R0}" class="rd-ring ${r === 0.5 ? 'mid' : ''}"/>`).join('');
    // coloured arcs on the outside = topic tags (same colours as the tags)
    const arcs = ids.map((id, i) => {
      const a0 = ang(i) - Math.PI / n, a1 = ang(i) + Math.PI / n, rr = R0 + 14;
      const p0 = [C + Math.cos(a0) * rr, C + Math.sin(a0) * rr], p1 = [C + Math.cos(a1) * rr, C + Math.sin(a1) * rr];
      return `<path d="M${p0[0].toFixed(1)},${p0[1].toFixed(1)}A${rr},${rr} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}" class="rd-arc t${TAG_CLASS[IN[id].tag]}"/>`;
    }).join('');
    const spokes = ids.map((_, i) => { const [x, y] = P(i, 1); return `<line x1="${C}" y1="${C}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rd-spoke"/>`; }).join('');
    const labels = ids.map((id, i) => { const [x, y] = P(i, 1.2), cx = Math.cos(ang(i)); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${cx > 0.3 ? 'start' : cx < -0.3 ? 'end' : 'middle'}" dominant-baseline="middle" class="rd-lab">${esc(IN[id].s || IN[id].name)}</text>`; }).join('');
    const dots = (c, ps, cls) => ps.map((p) => `<circle cx="${p.xy[0].toFixed(1)}" cy="${p.xy[1].toFixed(1)}" r="4.5" class="${cls}" data-rdi="${ids[p.i]}"/>`).join('');
    // invisible wide hit areas along each spoke: hover shows both countries' values for that indicator
    const hits = ids.map((id, i) => { const [x, y] = P(i, 1.12); return `<line x1="${C}" y1="${C}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rd-hit" data-rdi="${id}"/>`; }).join('');
    const pa = pts(a), pb = pts(b);
    return `<div class="rd">
      <div class="rd-top" data-a="${a.iso}" data-b="${b.iso}">${title}<div class="rd-legend"><span><i class="k-a"></i>${esc(a.name)}</span><span><i class="k-b"></i>${esc(b.name)}</span><span class="muted">Further out = higher among the ${NC} countries</span></div></div>
      <svg viewBox="-60 -10 660 560" class="rd-svg" role="img" aria-label="Profiles of ${esc(a.name)} and ${esc(b.name)}">
        <defs><radialGradient id="ga"><stop offset="0" stop-color="#642F41" stop-opacity=".05"/><stop offset="1" stop-color="#642F41" stop-opacity=".35"/></radialGradient>
        <radialGradient id="gb"><stop offset="0" stop-color="#173F35" stop-opacity=".03"/><stop offset="1" stop-color="#173F35" stop-opacity=".22"/></radialGradient></defs>
        ${rings}${spokes}${arcs}
        <path d="${smooth(pb)}" class="rd-b"/><path d="${smooth(pa)}" class="rd-a"/>
        ${dots(b, pb, 'rd-bd')}${dots(a, pa, 'rd-ad')}
        ${labels}${hits}
      </svg>
      <div class="rd-tip" hidden></div>
    </div>`;
  }

  // ================================================================ HOME · All indicators (list or map)
  const listIds = () => IND.filter((i) => !i.hidden && corrOf(i.id) && isNum(corrOf(i.id).rho));
  function renderAll() {
    $('#allMode').innerHTML = ['list', 'map'].map((m) => `<button data-allmode="${m}" aria-pressed="${state.allMode === m}">${m === 'list' ? 'List' : 'Map'}</button>`).join('');
    const filters = ['All', ...TAGS].filter((g) => g === 'All' || listIds().some((i) => i.tag === g)).map((g) =>
      `<button class="gchip ${g === 'All' ? 'g-all' : TAG_CLASS[g]} ${g === state.group ? 'on' : ''}" data-group="${esc(g)}" aria-pressed="${g === state.group}">${g === 'All' ? 'All' : esc(g)}</button>`).join('');
    // v27: tag filters back in What matters most (only here); hidden on the map
    $('#groupFilters').innerHTML = filters; $('#groupFilters').hidden = state.allMode === 'map';
    if (state.allMode === 'map') { $('#allBody').innerHTML = mapShell(); drawMap(); return; }
    const shown = listIds().filter((i) => state.group === 'All' || i.tag === state.group).map((i) => ({ i, r: corrOf(i.id) })).sort((a, b) => Math.abs(b.r.rho) - Math.abs(a.r.rho));
    $('#allBody').innerHTML = `<div class="ind-list"><div class="ind-head"><span>Topic</span><span>Indicator</span><span class="span2">Link with births</span><span>Strength</span><span></span></div>` +
      shown.map(({ i, r }) => {
        const open = state.openInd === i.id;
        return `<div class="ind ${open ? 'open' : ''}">
          <button class="ind-row" data-ind="${i.id}" aria-expanded="${open}">
            ${tagChip(i.tag)}
            <span class="f-name">${esc(i.name)}</span>
            <span class="f-r ${r.rho < 0 ? 'neg' : 'pos'}">${fmtR(r.rho)}</span>
            <span class="f-bar" aria-hidden="true"><i class="${r.rho < 0 ? 'neg' : 'pos'}" style="width:${Math.abs(r.rho) * 100}%"></i></span>
            <span class="f-str s-${esc(r.strength)}">${esc(r.strength)}</span>
            <span class="chev" aria-hidden="true">${open ? '−' : '+'}</span>
          </button>
          <div class="ind-panel" ${open ? '' : 'hidden'}>${open ? rankingHtml(i) : ''}</div>
        </div>`;
      }).join('') + '</div><p class="fert-note">Linked does not mean caused.</p>';
  }
  function rankingHtml(ind) {
    const s = stats(ind.id), tmax = Math.max(...D.countries.map((c) => vv(c, 'F1') || 0));
    const none = D.countries.filter((c) => !s.rank.has(c.iso)).sort((a, b) => a.name.localeCompare(b.name));
    const mins = ind.id === 'D31';
    const row = (c, x, i) => {
      const t = val(c, 'F1');
      const minCell = mins ? `<td class="r-min">${vv(c, 'X2') != null ? `${N(Math.round(vv(c, 'X2')), val(c, 'X2'))} <span class="muted">vs</span> ${N(Math.round(vv(c, 'X3')), val(c, 'X3'))}` : NODATA}</td>` : '';
      return `<tr data-card="${c.iso}" tabindex="0"><td class="r-rank">${i == null ? '' : i + 1}</td><td class="r-name">${esc(c.name)}</td><td class="r-val">${x ? valHtml(ind, x) : NODATA}</td>${minCell}
        <td class="r-tfr">${N(fmtNum(t.v, 2), t)}<span class="r-tbar" aria-hidden="true"><i style="width:${(t.v / tmax) * 100}%"></i></span></td></tr>`;
    };
    return `<table class="rank-table"><thead><tr><th></th><th>Country</th><th>${esc(ind.name)}</th>${mins ? '<th>Minutes a day, women vs men</th>' : ''}<th>Children per woman</th></tr></thead>
      <tbody>${s.pts.map((d, i) => row(d.c, d.x, i)).join('')}${none.length ? `<tr class="r-sep"><td colspan="${mins ? 5 : 4}">No data</td></tr>${none.map((c) => row(c, null, null)).join('')}` : ''}</tbody></table>`;
  }

  // ---------------------------------------------------------------- map (All indicators only), base map bundled in vendor/
  const ISO_N = { CHE: '756', DEU: '276', FRA: '250', ITA: '380', AUT: '040', ESP: '724', PRT: '620', NLD: '528', BEL: '056', GBR: '826', IRL: '372', SWE: '752', NOR: '578', FIN: '246', DNK: '208', POL: '616', CZE: '203', HUN: '348', EST: '233', GRC: '300', USA: '840', CHN: '156', RUS: '643', JPN: '392', KOR: '410', ISR: '376', KAZ: '398' };
  const N_ISO = Object.fromEntries(Object.entries(ISO_N).map(([a, b]) => [b, a]));
  let mapZoom = window.innerWidth < 600 ? 'europe' : 'world';
  function mapShell() {
    return `<div class="map-head">
        <div class="map-pick">${tagChip(IN[state.mapInd].tag)}${dd('map', state.mapInd, TAGS.flatMap((t) => listIds().filter((i) => i.tag === t).map((i) => ({ value: i.id, label: i.name, group: t }))), 'mid')}</div>
        <div class="segmented map-zoom" role="group" aria-label="Zoom"><button data-mapzoom="world" aria-pressed="${mapZoom === 'world'}">World</button><button data-mapzoom="europe" aria-pressed="${mapZoom === 'europe'}">Europe</button></div>
      </div>
      <div class="map-box" id="mapBox"><p class="map-msg">Loading the map…</p><div class="map-card" hidden></div></div>
      <div class="map-legend" id="mapLegend"></div>`;
  }
  function mapCardHtml(c) {
    const ind = IN[state.mapInd], x = ind.get(c), s = stats(ind.id), r = s.rank.get(c.iso);
    const t = IN.F1, tf = t.get(c), rf = stats('F1').rank.get(c.iso);
    const so = standouts(c.iso)[0];
    return `<div class="mc-h"><span class="mc-name">${esc(c.name)}</span></div>
      <div class="mc-big"><b>${x ? fmtI(ind, x) : '<span class="nodata">no data</span>'}</b><span>${esc(ind.name)}${r ? ` · ${r}/${s.n}` : ''}</span></div>
      ${ind.id !== 'F1' ? `<div class="mc-r"><span>Children per woman</span><b>${fmtI(t, tf)} · ${rf}/${NC}</b></div>` : ''}
      ${so ? `<div class="mc-r"><span>Stands out</span><b>${posPhrase(so)}: ${esc(so.s.ind.name.toLowerCase())}</b></div>` : ''}
      <p class="mc-foot">Click for the country card</p>`;
  }
  function drawMap() {
    const box = $('#mapBox');
    if (!box || !window.d3 || !window.topojson || !window.WORLD) { if (box) box.querySelector('.map-msg').textContent = 'The map could not load (vendor/ folder missing).'; return; }
    const d3 = window.d3, world = window.WORLD, ind = IN[state.mapInd], s = stats(ind.id);
    const feats = topojson.feature(world, world.objects.countries).features.filter((f) => f.id !== '010');
    const W = box.clientWidth || 900;
    const proj = d3.geoEqualEarth().rotate([-10, 0]).fitWidth(W - 16, { type: 'Sphere' }).translate([W / 2, (W - 16) / 2 / 1.95]);
    const path = d3.geoPath(proj);
    const ours = feats.filter((f) => N_ISO[f.id]).map((f) => path.bounds(f));
    const top = Math.min(...ours.map((b) => b[0][1])) - 14, bot = Math.max(...ours.map((b) => b[1][1])) + 14;
    const H = Math.max(bot - top, W * (W < 600 ? 0.8 : 0.38)), VY = (top + bot) / 2 - H / 2;
    const lo = s.min.x.v, hi = s.max.x.v, diverging = ind.id === 'D12';
    const color = diverging
      ? d3.scaleDiverging([Math.min(lo, -1), 0, Math.max(hi, 1)], d3.piecewise(d3.interpolateRgb, ['#642F41', '#F3F3EF', '#173F35']))
      : d3.scaleSequential([lo, hi], d3.piecewise(d3.interpolateRgb, ['#FBE9F0', '#F6D3E1', '#EBB3CB', '#A9567A', '#642F41']));
    box.querySelector('.map-msg')?.remove();
    const svg = d3.select(box).insert('svg', '.map-card').attr('viewBox', `0 ${VY} ${W} ${H}`).attr('class', 'map-svg').attr('role', 'img').attr('aria-label', `Map: ${ind.name}`);
    svg.append('defs').html('<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#ECECE7"/><line x1="0" y1="0" x2="0" y2="6" stroke="#C9CAC3" stroke-width="2"/></pattern>');
    const g = svg.append('g'), card = box.querySelector('.map-card');
    const cOf = (f) => byIso[N_ISO[f.id]];
    g.selectAll('path').data(feats).join('path').attr('d', path)
      .attr('class', (f) => (cOf(f) ? 'm-c' : 'm-o'))
      .attr('fill', (f) => { const c = cOf(f); if (!c) return null; const x = ind.get(c); return x ? color(x.v) : 'url(#hatch)'; })
      .attr('tabindex', (f) => (cOf(f) ? 0 : null)).attr('data-card', (f) => (cOf(f) ? cOf(f).iso : null))
      .attr('aria-label', (f) => { const c = cOf(f); if (!c) return null; const x = ind.get(c); return `${c.name}: ${x ? String(fmtI(ind, x)).replace(/<[^>]+>/g, '') : 'no data'}`; })
      .style('--d', (f, i) => (cOf(f) ? `${120 + (i % 27) * 18}ms` : null));
    const show = (ev, f) => {
      const c = cOf(f); if (!c) return;
      card.innerHTML = mapCardHtml(c); card.hidden = false;
      const r = box.getBoundingClientRect(), x = (ev.clientX ?? r.left + r.width / 2) - r.left, y = (ev.clientY ?? r.top + r.height / 2) - r.top;
      card.style.left = `${Math.max(8, Math.min(r.width - card.offsetWidth - 8, x + 18))}px`;
      card.style.top = `${Math.max(8, Math.min(r.height - card.offsetHeight - 8, y - card.offsetHeight / 2))}px`;
      g.selectAll('path.m-c').classed('hot', (q) => q === f);
    };
    const hide = () => { card.hidden = true; g.selectAll('path.m-c').classed('hot', false); };
    g.selectAll('path.m-c').on('mousemove', show).on('focus', (ev, f) => show({}, f)).on('mouseleave', hide).on('blur', hide);
    const zoom = d3.zoom().scaleExtent([1, 12]).extent([[0, VY], [W, VY + H]]).on('zoom', (ev) => { g.attr('transform', ev.transform); g.selectAll('path').attr('stroke-width', 0.6 / ev.transform.k); hide(); });
    svg.call(zoom).on('dblclick.zoom', null);
    const target = (mode) => {
      if (mode !== 'europe') return d3.zoomIdentity;
      const pts = [[-11, 34], [33, 34], [-11, 71], [33, 71], [11, 34], [11, 71]].map((p) => proj(p));
      const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
      const k = Math.min(12, 0.95 / Math.max((x1 - x0) / W, (y1 - y0) / H));
      return d3.zoomIdentity.translate(W / 2, VY + H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    };
    box._zoomTo = (mode, animate) => (animate ? svg.transition().duration(1100).ease(d3.easeCubicInOut).call(zoom.transform, target(mode)) : svg.call(zoom.transform, target(mode)));
    box._zoomTo(mapZoom, false);
    const a = diverging ? Math.min(lo, -1) : lo, b = diverging ? Math.max(hi, 1) : hi;
    const stops = d3.range(0, 1.0001, 0.1).map((t) => color(a + (b - a) * t));
    $('#mapLegend').innerHTML = `<span>${fmtI(ind, { v: a, usd: s.min.x.usd })}</span><span class="lg-bar" style="background:linear-gradient(90deg,${stops.join(',')})"></span><span>${fmtI(ind, { v: b, usd: s.max.x.usd })}</span><span class="lg-na"><i></i>no data</span>`;
  }

  // ================================================================ HOME · Money (table or chart) and Culture (table)
  const SORTV = (id) => (c) => { if (id === 'NET') return dv(c, 'D11'); if (id === 'GIFT') return ({ yes: 2, some: 1, no: 0 })[giftKind(c)] ?? null; const x = IN[id] ? IN[id].get(c) : null; return x ? x.v : null; };
  function ordered() {
    const g = SORTV(state.sortKey);
    return [...D.countries].sort((a, b) => {
      const x = g(a), y = g(b);
      if (x == null && y == null) return a.name.localeCompare(b.name);
      if (x == null) return 1; if (y == null) return -1;
      return state.dir === 'desc' ? y - x || a.name.localeCompare(b.name) : x - y || a.name.localeCompare(b.name);
    });
  }
  function th(key, label, cls) {
    const on = state.sortKey === key;
    return `<th class="${cls || ''}" aria-sort="${on ? (state.dir === 'desc' ? 'descending' : 'ascending') : 'none'}"><button class="sorth ${on ? 'on' : ''}" data-sort="${key}">${label}<span aria-hidden="true">${on ? (state.dir === 'desc' ? ' ↓' : ' ↑') : ''}</span></button></th>`;
  }
  const big = (h) => `<span class="val">${h}</span>`;
  const sub = (h) => `<span class="sub">${h}</span>`;
  const head = (c, i) => `<td class="t-rank">${String(i + 1).padStart(2, '0')}</td><td class="t-name">${esc(c.name)}</td><td class="t-tfr"><span class="big">${N(fmtNum(vv(c, 'F1'), 2), val(c, 'F1'))}</span></td>`;
  function moneyTable(list) {
    const rows = list.map((c, i) => {
      const d = (id) => der(c, id), netV = dv(c, 'D11');
      return `<tr data-iso="${c.iso}" tabindex="0">${head(c, i)}
        <td>${big(N(fmtUSD(dv(c, 'D05')), d('D05')))}${sub(N(fmtPct(dv(c, 'D06'), 1), d('D06')))}</td>
        <td>${big(dv(c, 'D08') == null ? NODATA : N(fmtUSD(dv(c, 'D08')), d('D08')))}${sub(N(fmtPct(dv(c, 'D09'), 1), d('D09')))}</td>
        <td class="${netV == null ? '' : netV >= 0 ? 'pos' : 'neg'}">${big(netV == null ? NODATA : N(fmtUSD(netV, true), d('D11')))}</td>
        <td>${big(dv(c, 'D16') == null ? NODATA : N(fmtNum(dv(c, 'D16'), 1), d('D16')))}</td>
        <td>${big(N(fmtPct(dv(c, 'D19')), d('D19')))}</td>
        <td>${big(`${N(fmtNum(vv(c, 'T3'), 0), val(c, 'T3'))} / ${N(fmtNum(vv(c, 'T4'), 0), val(c, 'T4'))}`)}</td>
        <td class="c-gift">${giftCell(c)}</td>
      </tr>`;
    }).join('');
    return `<div class="table-wrap"><table class="grid-table money-t"><thead><tr><th class="t-rank"></th><th class="t-name">Country</th>${th('F1', 'Children<br>per woman', 'c-tfr')}
      ${th('D06', 'State support<br>a month')}${th('D09', 'Baby costs<br>a month')}${th('D12', 'What’s left<br>after costs a month')}${th('D16', 'Mother’s workdays<br>for daycare')}${th('D19', 'Mother’s pay left<br>after daycare')}${th('T3', 'Paid leave weeks<br>mother / father')}${th('GIFT', 'Baby gift<br>from the state', 'c-gift')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  const PARTS = [
    { key: 'cash', label: 'Allowances & tax breaks', side: 'get', cls: 'p-cash', calc: (m) => m('M1') + 3 * m('M2') + 3 * m('M3') },
    { key: 'bonus', label: 'Baby bonus', side: 'get', cls: 'p-bonus', calc: (m, c) => (c.iso === 'HUN' ? 0 : m('M4')) },
    { key: 'leave', label: 'Pay during leave', side: 'get', cls: 'p-leave', calc: (m) => m('M5') + m('M6') },
    { key: 'creche', label: 'Daycare', side: 'pay', cls: 'p-creche', calc: (m) => 2 * m('M7') },
    { key: 'health', label: 'Birth & insurance', side: 'pay', cls: 'p-health', calc: (m) => m('M8') + 3 * m('M9') },
  ];
  function partsOf(c) {
    const m = (id) => { const x = money(c, id); if (!x || !isNum(x.usd)) throw new Error(id); return x.usd; };
    const out = {};
    for (const p of PARTS) { try { out[p.key] = p.calc(m, c) / 36; } catch (e) { out[p.key] = null; } }
    return out;
  }
  // v28: sortable column titles in the chart (same state as the table: click again to flip the order)
  const sbtn = (key, label) => { const on = state.sortKey === key; return `<button class="sorth ${on ? 'on' : ''}" data-sort="${key}" aria-label="Sort by ${label.replace(/<br>/g, ' ')}">${label}<span aria-hidden="true">${on ? (state.dir === 'desc' ? ' ↓' : ' ↑') : ''}</span></button>`; };
  function moneyChart(list) {
    const all = list.map((c) => ({ c, p: partsOf(c) }));
    const on = (x) => !(state.moneyOff || []).includes(x.key);
    const sum = (p, side) => PARTS.filter((x) => x.side === side && on(x)).reduce((s, x) => (s == null || p[x.key] == null ? null : s + p[x.key]), 0);
    const max = Math.max(1, ...all.flatMap(({ p }) => [sum(p, 'get') || 0, sum(p, 'pay') || 0]));
    const half = (c, p, side) => {
      const tot = sum(p, side);
      if (tot == null) return `<div class="mc-half mc-${side}">${NODATA}</div>`;
      if (!PARTS.some((x) => x.side === side && on(x))) return `<div class="mc-half mc-${side}"></div>`;
      const segs = PARTS.filter((x) => x.side === side && on(x) && p[x.key] > 0).map((x) => `<i class="${x.cls}" style="width:${(p[x.key] / max) * 100}%" title="${esc(c.name)} · ${x.label}: ${fmtUSD(p[x.key])} a month"></i>`).join('');
      return `<div class="mc-half mc-${side}"><div class="mc-bars">${segs}</div><span class="mc-tot">${side === 'pay' ? '−' : '+'}${fmtUSD(tot)}</span></div>`;
    };
    const rows = all.map(({ c, p }, i) => {
      const netV = dv(c, 'D11');
      return `<div class="mc-row" data-iso="${c.iso}" role="button" tabindex="0"><span class="t-rank">${String(i + 1).padStart(2, '0')}</span><span class="mc-name">${esc(c.name)}</span>
        ${half(c, p, 'pay')}${half(c, p, 'get')}
        <span class="mc-net ${netV == null ? '' : netV >= 0 ? 'pos' : 'neg'}">${netV == null ? NODATA : N(fmtUSD(netV, true), der(c, 'D11'))}</span>
        <span class="mc-tfr">${N(fmtNum(vv(c, 'F1'), 2), val(c, 'F1'))}</span></div>`;
    }).join('');
    return `<div class="mc">
      <div class="mc-row mc-head"><span></span><span class="mc-name">Country</span><span class="mc-half mc-pay">← family pays, a month</span><span class="mc-half mc-get">family gets, a month →</span><span class="mc-net">${sbtn('NET', 'Balance')}</span><span class="mc-tfr">${sbtn('F1', 'Children<br>per woman')}</span></div>${rows}</div>`;
  }
  function cultureTable(list) {
    const rows = list.map((c, i) => {
      const r = c.all.D31, x4 = val(c, 'X4');
      const pc = (id) => { const x = val(c, id); return isNum(x?.v) ? N(fmtPct(x.v), x) : NODATA; };
      return `<tr data-iso="${c.iso}" tabindex="0">${head(c, i)}
        <td>${big(r && isNum(r.v) ? N(`×${fmtNum(r.v, 1)}`, r) : NODATA)}${sub(vv(c, 'X2') != null ? `${N(Math.round(vv(c, 'X2')), val(c, 'X2'))} vs ${N(Math.round(vv(c, 'X3')), val(c, 'X3'))} min` : '')}</td>
        <td>${big(pc('X4'))}</td><td>${big(pc('X6'))}</td><td>${big(pc('X7'))}</td><td>${big(pc('X8'))}</td>
        <td>${big(N(fmtNum(vv(c, 'T4'), 1), val(c, 'T4')))}</td><td>${big(pc('S2'))}</td>
      </tr>`;
    }).join('');
    return `<div class="table-wrap"><table class="grid-table culture-t"><thead><tr><th class="t-rank"></th><th class="t-name">Country</th>${th('F1', 'Children<br>per woman', 'c-tfr')}
      ${th('D31', 'Women do × more<br>housework & care')}${th('X4', 'Mothers of toddlers<br>who work')}${th('X6', 'Agree “kids suffer<br>if the mother works”')}${th('X7', 'Toddlers with<br>grandparents')}${th('X8', 'Born outside<br>marriage')}${th('T4', 'Father’s leave at<br>full pay, weeks')}${th('S2', 'Toddlers<br>in daycare')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  // ================================================================ v20: "Two paths" finding (Culture view + Highlights)
  // Example countries checked against the data: TFR (F1), housework ratio (D31), working mothers (X4), "kids suffer" (X6).
  const PATHS = [
    { key: 'trad', title: 'Traditional', text: 'Big families are the norm', isos: ['ISR', 'KAZ'] },
    { key: 'equal', title: 'Equal', text: 'Mothers keep their jobs, fathers share the care', isos: ['NOR', 'DNK', 'SWE'] },
    { key: 'between', title: 'In between', text: 'Women work but still do most of the care at home', isos: ['KOR', 'JPN', 'POL'] },
  ];
  const PATHS_TEXT = 'Birth rates are higher in traditional societies, where big families are the norm, and in equal ones, where mothers keep their jobs and fathers share the care. They are lowest in between — where women work but still do most of the care at home.';
  function pathsHtml(compact) {
    const cell = (iso) => {
      const c = byIso[iso], f = (id) => { const x = IN[id].get(c); return x ? IN[id].f(x.v, x) : '—'; };
      return `<li data-card="${iso}" role="button" tabindex="0"><span class="pc-name">${esc(c.name)}</span><span class="pc-tfr">${f('F1')}</span>
        <span class="pc-facts"><span>Women ${f('D31')} housework</span><span>${f('X4')} mothers work</span><span>${f('X6')} “kids suffer”</span></span></li>`;
    };
    return `<section class="paths ${compact ? 'compact' : ''}">
      <h2 class="paths-h">Two paths to more children</h2>
      <p class="paths-p">${PATHS_TEXT}</p>
      <div class="paths-g">${PATHS.map((g) => `<div class="pg-col pg-${g.key}"><h3>${g.title}</h3><p>${g.text}</p><span class="pg-rule" aria-hidden="true"></span><ul>${g.isos.map(cell).join('')}</ul></div>`).join('')}</div>
    </section>`;
  }

  // ================================================================ HIGHLIGHTS page
  // Every highlight is computed from the data at render time (ranks of 27, correlations from the Correlations sheet).
  function buildHighlights() {
    const H = [];
    const link = (id, txtNeg, txtPos) => { const r = corrOf(id); if (!r || !isNum(r.rho)) return; H.push({ kind: 'link', tag: IN[id]?.tag || 'Money', big: fmtR(r.rho), head: `link with births: ${(r.rho < 0 ? txtNeg : txtPos).replace(/^./, (m) => m.toLowerCase())}`, foot: `Link with children per woman · ${r.strength} · ${r.n} countries`, id }); };
    link('X4', 'Where more mothers of toddlers work, fewer babies are born.', 'Where mothers can keep their jobs, more babies are born.');
    link('D06', 'Countries that pay more have fewer babies — often because they started paying after births fell.', 'The more support a state pays, the more babies.');
    link('X6', 'Where people say “kids suffer if the mother works”, fewer babies are born.', 'Where people say “kids suffer if the mother works”, more babies are born.');
    link('F3', 'The later the first baby, the fewer babies overall.', 'The later the first baby, the more babies overall.');
    link('D31', 'The bigger the housework gap between women and men, the fewer babies.', 'The bigger the housework gap, the more babies.');
    link('X8', 'More babies born outside marriage goes with fewer babies overall.', 'Where children don’t need to wait for a wedding, more children are born.');
    link('S2', 'More toddlers in daycare goes with fewer babies.', 'More toddlers in daycare goes with more babies.');
    { const r = corrOf('C2'); if (r && isNum(r.rho)) H.push({ kind: 'link', tag: 'State', big: fmtR(r.rho), head: 'link with births: how much a state spends on family benefits says nothing about how many babies are born.', foot: `Link with children per woman · ${r.strength} · ${r.n} countries`, id: 'C2' }); }
    const the = (n) => (/^(United|Netherlands)/.test(n) ? `the ${n}` : n);
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const ext = (id, top, text, q) => {
      const s = stats(id); const d = top ? s.max : s.min; if (!d) return;
      H.push({ kind: 'country', tag: s.ind.tag, big: fmtI(s.ind, d.x), head: text(the(d.c.name)), q, foot: `${top ? 'Highest' : 'Lowest'} of ${s.n} · middle ${fmtI(s.ind, { v: s.median, usd: null })}`, iso: d.c.iso, id, top });
    };
    // v25: the sentence continues the big number ("20% … of mothers of toddlers have a job in Czechia — the fewest of 27")
    ext('F1', true, (n) => `children per woman in ${n} — the most of all 27 countries.`, 'Where do women have the most children?');
    ext('F1', false, (n) => `children per woman in ${n} — the fewest of all 27 countries.`, 'Where do women have the fewest children?');
    ext('D06', true, (n) => `of family income comes back as state support in ${n} — more than anywhere else.`, 'Which state gives new families the most support?');
    ext('D09', true, (n) => `of family income goes on a baby in ${n} — more than anywhere else.`, 'Where does a baby cost families the most?');
    ext('D12', false, (n) => `is what’s left after costs in ${n}: a baby costs the family more than the state gives.`, 'Where does a baby cost more than the state gives, by the widest margin?');
    ext('D16', true, (n) => `workdays a month: that is how long mothers in ${n} work just to pay for daycare — the longest.`, 'Where do mothers work the most days just to pay for daycare?');
    ext('T3', true, (n) => `weeks of leave at full pay for mothers in ${n} — the longest.`, 'Which country gives mothers the longest leave at full pay?');
    ext('T4', true, (n) => `weeks of leave at full pay for fathers in ${n} — the longest.`, 'Which country gives fathers the longest leave at full pay?');
    ext('S2', true, (n) => `of toddlers go to daycare in ${n} — the most.`, 'Where do the most toddlers go to daycare?');
    ext('X4', true, (n) => `of mothers of toddlers have a job in ${n} — the most.`, 'Where do the most mothers of toddlers have a job?');
    ext('X4', false, (n) => `of mothers of toddlers have a job in ${n} — the fewest.`, 'Where do the fewest mothers of toddlers have a job?');
    ext('D31', true, (n) => `more housework and care is done by women than by men in ${n} — the biggest gap.`, 'Where do women do the most housework compared with men?');
    ext('D31', false, (n) => `more housework and care is done by women than by men in ${n} — the smallest gap.`, 'Where do women and men share housework most equally?');
    ext('X6', true, (n) => `of people in ${n} think kids suffer if the mother works — the most.`, 'Where do the most people think kids suffer if the mother works?');
    ext('X6', false, (n) => `of people in ${n} think kids suffer if the mother works — the fewest.`, 'Where do the fewest people think kids suffer if the mother works?');
    ext('X8', true, (n) => `of babies in ${n} are born outside marriage — the most.`, 'Where are the most babies born outside marriage?');
    ext('X8', false, (n) => `of babies in ${n} are born outside marriage — the fewest.`, 'Where are the fewest babies born outside marriage?');
    ext('X7', true, (n) => `of toddlers in ${n} are looked after by grandparents — the most.`, 'Where do grandparents look after the most toddlers?');
    ext('F3', true, (n) => `years: the average age of mothers at their first baby in ${n} — the oldest.`, 'Where do mothers have their first baby the latest?');
    // biggest fall in births since 1990
    const ch = D.countries.map((c) => ({ c, d: c.all.D32 })).filter((x) => x.d && isNum(x.d.v)).sort((a, b) => a.d.v - b.d.v);
    if (ch.length) { const x = ch[0]; H.push({ kind: 'country', tag: 'Births', big: fmtChg(x.d.v), head: `children per woman: how much ${x.c.name} has lost since 1990 — the biggest fall.`, foot: `${fmtNum(x.c.tfr_series?.[0], 2) ?? '—'} in 1990 → ${fmtNum(vv(x.c, 'F1'), 2)} today`, iso: x.c.iso }); }
    return H;
  }
  const stripT = (h) => String(h).replace(/<[^>]+>/g, '');
  const HL = () => (HLc ||= buildHighlights());
  let HLc = null, quiz = null, quizScore = { right: 0, total: 0 };
  function hlCardHtml(h, i, big) {
    return `<article class="hlx ${h.kind} ${big ? 'big' : ''}" style="--i:${i}" ${h.iso ? `data-card="${h.iso}" role="button" tabindex="0"` : ''}>
      ${tagChip(h.tag)}<div class="hlx-body"><span class="hlx-big">${h.big}</span><span class="hlx-head">${esc(h.head)}</span></div></article>`;
  }
  // v20 quiz: rounds of 5 different questions, progress dots, answer tiles that reveal values as bars, end screen.
  let round = null;
  function newRound() {
    const pool = HL().filter((h) => h.kind === 'country' && h.id && h.iso && h.q).sort(() => Math.random() - 0.5);
    const used = new Set(), qs = [];
    for (const h of pool) { if (used.has(h.id)) continue; used.add(h.id); qs.push(h); if (qs.length === 5) break; }
    round = { qs: qs.map((h) => { const s = stats(h.id); const others = s.pts.filter((d) => d.c.iso !== h.iso).sort(() => Math.random() - 0.5).slice(0, 2).map((d) => d.c.iso); return { h, opts: [h.iso, ...others].sort(() => Math.random() - 0.5), pick: null }; }), i: 0 };
  }
  function quizHtml() {
    if (!round) newRound();
    const n = round.qs.length, right = round.qs.filter((q) => q.pick && q.pick === q.h.iso).length;
    const dots = round.qs.map((q, i) => `<i class="${i === round.i && round.i < n ? 'cur' : ''} ${q.pick ? (q.pick === q.h.iso ? 'ok' : 'no') : ''}"></i>`).join('');
    if (round.i >= n) {
      const msg = right === n ? 'Perfect round.' : right >= 3 ? 'Sharp instinct.' : right >= 1 ? 'Some surprises there.' : 'The data had a few surprises for you.';
      return `<div class="qz"><div class="qz-top"><span class="qz-prog">${dots}</span></div>
        <div class="qz-end"><span class="qz-score">${right}<small>/${n}</small></span><p class="qz-msg">${msg}</p>
        <ol class="qz-recap">${round.qs.map((q) => `<li class="${q.pick === q.h.iso ? 'ok' : 'no'}"><span>${q.pick === q.h.iso ? '✓' : '✗'}</span>${esc(stripT(q.h.big))} ${esc(q.h.head)}</li>`).join('')}</ol>
        <button class="qz-btn" data-quizagain="1">Play another round</button></div></div>`;
    }
    const q = round.qs[round.i], ind = IN[q.h.id];
    const vals = q.opts.map((iso) => ind.get(byIso[iso])?.v ?? 0), mx = Math.max(...vals.map(Math.abs), 1e-9);
    const tiles = q.opts.map((iso, k) => {
      const c = byIso[iso], x = ind.get(c), state_ = q.pick ? (iso === q.h.iso ? 'right' : iso === q.pick ? 'wrong' : 'dim') : '';
      return `<button class="qz-o ${state_}" data-quiz="${iso}" ${q.pick ? 'disabled' : ''}>
        <span class="qz-k">${'ABC'[k]}</span><span class="qz-c">${esc(c.name)}</span>
        ${q.pick ? `<span class="qz-v">${x ? fmtI(ind, x) : '—'}</span><span class="qz-bar"><i style="width:${(Math.abs(x?.v ?? 0) / mx) * 100}%"></i></span>${iso === q.h.iso ? '<span class="qz-mark">✓</span>' : iso === q.pick ? '<span class="qz-mark">✗</span>' : ''}` : ''}
      </button>`;
    }).join('');
    return `<div class="qz">
      <div class="qz-top"><span class="qz-n">Question ${round.i + 1} of ${n}</span><span class="qz-prog">${dots}</span><span class="qz-n">Score ${right}</span></div>
      <div class="qz-card">
        ${tagChip(q.h.tag)}
        <h2 class="qz-q">${esc(q.h.q)}</h2>
        <div class="qz-opts">${tiles}</div>
        ${q.pick ? `<div class="qz-a ${q.pick === q.h.iso ? 'ok' : 'no'}"><b>${q.pick === q.h.iso ? 'Right.' : 'Not quite.'}</b> ${esc(stripT(q.h.big))} ${esc(q.h.head)}</div>
          <button class="qz-btn" data-quiznext="1">${round.i + 1 < n ? 'Next question →' : 'See your score →'}</button>` : '<p class="qz-hint">Pick one · or press A, B or C</p>'}
      </div>
    </div>`;
  }
  function renderHighlights() {
    $('#hlMode').innerHTML = [['all', 'All highlights'], ['dice', `<span class="dice-ic">${diceSvg(5)}</span>Random`], ['quiz', 'Quiz']].map(([m, l]) => `<button data-hlmode="${m}" aria-pressed="${state.hlMode === m}">${l}</button>`).join('');
    const H = HL();
    if (state.hlMode === 'dice') {
      if (state.hlIndex == null || state.hlIndex >= H.length) state.hlIndex = Math.floor(Math.random() * H.length);
      $('#hlBody').innerHTML = `<div class="dice-stage">${hlCardHtml(H[state.hlIndex], 0, true)}<button class="dice" data-roll="1" aria-label="Show another highlight">${diceSvg((state.hlIndex % 6) + 1)}<span>Roll again</span></button></div>`;
      return;
    }
    if (state.hlMode === 'quiz') {
      $('#hlBody').innerHTML = quizHtml();
      return;
    }
    if (false) {
      const ok = quiz.pick && quiz.pick === quiz.h.iso;
      $('#hlBody').innerHTML = `<div class="quiz">
        <p class="quiz-score">${quizScore.total ? `<b>${quizScore.right}</b> of ${quizScore.total} right` : 'Test your instinct'}</p>
        <h2 class="quiz-q">${tagChip(quiz.h.tag)} ${esc(quiz.q)}</h2>
        <div class="quiz-opts">${quiz.opts.map((iso) => `<button class="qo ${quiz.pick ? (iso === quiz.h.iso ? 'right' : iso === quiz.pick ? 'wrong' : 'dim') : ''}" data-quiz="${iso}" ${quiz.pick ? 'disabled' : ''}>${esc(byIso[iso].name)}${quiz.pick ? `<small>${fmtI(IN[quiz.h.id], IN[quiz.h.id].get(byIso[iso])) ?? '—'}</small>` : ''}</button>`).join('')}</div>
        ${quiz.pick ? `<p class="quiz-a ${ok ? 'ok' : 'no'}">${ok ? 'Right!' : 'Not quite.'} ${esc(quiz.h.head)}</p><button class="play-btn" data-quiznext="1">Next question</button>` : ''}
      </div>`;
      return;
    }
    const tags = ['All', ...TAGS].filter((t) => t === 'All' || H.some((h) => h.tag === t));
    $('#hlBody').innerHTML = `<div class="hlx-grid">${H.map((h, i) => hlCardHtml(h, i)).join('')}</div>`;
  }
  function diceSvg(n) {
    const P = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] }[n];
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="2" width="36" height="36" rx="8"/>${P.map(([x, y]) => `<circle cx="${x * 10}" cy="${y * 10}" r="3.4"/>`).join('')}</svg>`;
  }

  // ================================================================ DATASET page
  const DS = [
    { g: 'Births', cols: ['F1', 'F3'] },
    { g: 'Money', cols: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'] },
    { g: 'Leave & daycare', cols: ['T1', 'T2', 'T3', 'T4', 'S1', 'S2', 'S3'] },
    { g: 'Culture', cols: ['X2', 'X3', 'X4', 'X6', 'X7', 'X8', 'K1'] },
    { g: 'State', cols: ['C2'] },
  ];
  function dsCell(c, id) {
    if (id === 'K1') return giftCell(c);
    const ind = IN[id], x = ind.get(c);
    if (!x) return NODATA;
    // v22: the Dataset page is the only place where numbers link to their source
    const L = (text, p) => { const u = firstUrl(p.url); return (u ? `<a class="src-a" href="${esc(u)}" target="_blank" rel="noopener" title="${esc(p.source || '')}">${text}</a>` : `<span class="n">${text}</span>`) + marker(p.status, p.note); };
    if (id.startsWith('M')) return `${L(fmtUSD(x.usd), x.p)}<small>${fmtPct(x.v, 1)} of income</small>`;
    return L(fmtI(ind, x), x.p);
  }
  function renderDataset() {
    const list = [...D.countries].sort((a, b) => a.name.localeCompare(b.name));
    const h1 = DS.map((g) => `<th colspan="${g.cols.length}" class="ds-g">${tagChip(g.g)}</th>`).join('');
    const h2 = DS.flatMap((g) => g.cols.map((id) => `<th>${esc(id === 'K1' ? 'Baby gift from the state' : IN[id].name)}</th>`)).join('');
    const body = list.map((c) => `<tr><th class="ds-c" scope="row"><button class="ds-name" data-card="${c.iso}">${esc(c.name)}</button></th>${DS.flatMap((g) => g.cols.map((id) => `<td>${dsCell(c, id)}</td>`)).join('')}</tr>`).join('');
    $('#dsTable').innerHTML = `<thead><tr><th class="ds-c"></th>${h1}</tr><tr><th class="ds-c">Country</th>${h2}</tr></thead><tbody>${body}</tbody>`;
    $('#dsMeta').innerHTML = `${NC} countries · ${DS.reduce((n, g) => n + g.cols.length, 0)} indicators · money in US dollars for a two-earner couple on average wages · source file ${esc(D.meta.dataset)}`;
  }

  // ================================================================ v17: all sources in one list (About the data)
  function renderSources() {
    if ($('#srcList').dataset.done) return;
    const raw = ['F1', 'F3', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'T1', 'T2', 'T3', 'T4', 'S1', 'S2', 'S3', 'X2', 'X3', 'X4', 'X6', 'X7', 'X8', 'K1', 'C2', 'C5', 'C10'];
    const label = { K1: 'Baby gift from the state', C5: 'Average wage', C10: 'Exchange rate to US dollars' };
    const html = raw.map((id) => {
      const by = new Map();
      D.countries.forEach((c) => {
        const p = id.startsWith('M') ? money(c, id) : val(c, id);
        if (!p || (!p.source && !p.url)) return;
        const urls = String(p.url || '').split(' ; ').map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u));
        const key = `${p.source || ''}|${urls.join(' ')}`;
        if (!by.has(key)) by.set(key, { source: p.source || 'Source', urls, cs: [] });
        by.get(key).cs.push(c.name);
      });
      if (!by.size) return '';
      const items = [...by.values()].sort((x, y) => y.cs.length - x.cs.length).map((e) =>
        `<li><span class="src-t">${esc(e.source)}</span>${e.urls.map((u, i) => ` <a href="${esc(u)}" target="_blank" rel="noopener">${e.urls.length > 1 ? `link ${i + 1}` : 'link'} ↗</a>`).join('')}<span class="src-c">${e.cs.length === NC ? 'all countries' : esc(e.cs.join(', '))}</span></li>`).join('');
      const tag = IN[id]?.tag || (id === 'K1' ? 'Culture' : 'Money');
      return `<details class="src-g"><summary>${tagChip(tag)}<span>${esc(label[id] || IN[id]?.name || id)}</span><span class="src-n">${by.size}</span></summary><ul>${items}</ul></details>`;
    }).join('');
    $('#srcList').innerHTML = html;
    $('#srcList').dataset.done = '1';
  }

  // ================================================================ country card (centred pop-up)
  function sparkline(c) {
    const ys = D.meta.years, s = c.tfr_series || [];
    const pts = ys.map((y, i) => [y, s[i]]).filter(([, v]) => isNum(v));
    if (pts.length < 2) return '';
    const W = 420, H = 96, x0 = ys[0], x1 = ys[ys.length - 1], lo = 0.6, hi = 3.4;
    const X = (y) => 8 + ((y - x0) / (x1 - x0)) * (W - 40), Y = (v) => 6 + (1 - (v - lo) / (hi - lo)) * (H - 24);
    const d = pts.map(([y, v], i) => `${i ? 'L' : 'M'}${X(y).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    const last = pts[pts.length - 1], first = pts[0];
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Children per woman ${first[0]}–${last[0]}: from ${first[1].toFixed(2)} to ${last[1].toFixed(2)}">
      <line x1="8" x2="${W - 32}" y1="${Y(2.1)}" y2="${Y(2.1)}" stroke="var(--text-faint)" stroke-dasharray="3 3"/><text x="${W - 28}" y="${Y(2.1) + 3}" font-size="10" fill="var(--text-muted)">2.1</text>
      <path d="${d} L${X(last[0]).toFixed(1)},${H - 18} L${X(first[0]).toFixed(1)},${H - 18}Z" fill="var(--c-burgundy)" opacity=".08"/>
      <path d="${d}" fill="none" stroke="var(--c-burgundy)" stroke-width="2"/><circle cx="${X(last[0])}" cy="${Y(last[1])}" r="4" fill="var(--c-burgundy)"/>
      <text x="${X(first[0])}" y="${H - 4}" font-size="10" fill="var(--text-muted)">${first[0]} · ${first[1].toFixed(2)}</text><text x="${X(last[0])}" y="${H - 4}" font-size="10" fill="var(--text-muted)" text-anchor="end">${last[0]}</text>
    </svg>`;
  }
  function inputChips(c, ind) {
    if (!ind.inputs) return '';
    return `<span class="in-chips">${ind.inputs.map((id) => { const i2 = IN[id], x = i2.get(c); const t = x ? (id.startsWith('M') ? N(fmtUSD(x.usd), x.p) : N(fmtI(i2, x), x.p)) : NODATA; return `<span class="in-chip">${esc(i2.name.replace(', % of family income', '').replace(', min a day', ''))} ${t}</span>`; }).join('')}</span>`;
  }
  function cardHtml(c, list) {
    const idx = list.findIndex((x) => x.iso === c.iso);
    const prev = list[(idx - 1 + list.length) % list.length], next = list[(idx + 1) % list.length];
    const f1 = val(c, 'F1'), ch = c.all.D32, rf = stats('F1').rank.get(c.iso);
    const so = standouts(c.iso).slice(0, 3);
    const groups = TAGS.map((t) => {
      const rows = IND.filter((i) => i.tag === t && !i.hidden && i.id !== 'F1').map((i) => {
        const x = i.get(c), r = stats(i.id).rank.get(c.iso);
        return `<tr><td class="ci-name">${esc(i.sentence && x ? i.sentence(x.v) : i.name)}${inputChips(c, i)}</td><td class="ci-val">${x ? valHtml(i, x) : NODATA}</td><td class="ci-rank">${r ? `${r}/${stats(i.id).n}` : ''}</td></tr>`;
      }).join('');
      const extra = t === 'Culture' ? `<tr><td class="ci-name">Baby gift from the state</td><td class="ci-val">${giftCell(c)}</td><td class="ci-rank"></td></tr>` : '';
      return rows || extra ? `<section class="ci-group">${tagChip(t)}${t === 'Money' ? `<p class="family-line">${FAMILY}</p>` : ''}<table class="ci-table"><tbody>${rows}${extra}</tbody></table></section>` : '';
    }).join('');
    return `
      <div class="pop-top">
        <button class="btn btn-quiet" data-go="${prev.iso}" aria-label="Previous country">← ${esc(prev.name)}</button>
        <button class="btn btn-quiet" data-go="${next.iso}" aria-label="Next country">${esc(next.name)} →</button>
        <button class="pop-x" data-close aria-label="Close">✕</button>
      </div>
      <div class="pop-body">
        <header class="pop-head">
          <h2 id="cardTitle">${esc(c.name)}</h2>
          <div class="pop-tfr"><span class="big">${N(fmtNum(f1.v, 2), f1)}</span><span>children per woman · ${rf}/${NC}<br>${ch && isNum(ch.v) ? `${N(fmtChg(ch.v), ch)} since 1990` : ''}</span></div>
        </header>
        <div class="pop-spark">${sparkline(c)}</div>
        ${strip(so.map((o) => hcard('', o.s.ind.tag, valHtml(o.s.ind, o.x), esc(o.s.ind.name), { id: o.id, iso: c.iso })).join(''))}
        <div class="ci">${groups}</div>
      </div>`;
  }
  let lastFocus = null;
  function openCard(iso, push = true) {
    const c = byIso[iso]; if (!c) return;
    state.focus = iso; save();
    $('#sheet').innerHTML = cardHtml(c, [...D.countries].sort((a, b) => a.name.localeCompare(b.name)));
    $('#overlay').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#sheet').scrollTop = 0;
    if (!lastFocus) lastFocus = document.activeElement;
    $('#sheet').focus();
    if (push) history.replaceState(null, '', `#${iso}`);
  }
  function closeCard() {
    $('#overlay').hidden = true;
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search + (state.page !== 'home' ? `#${state.page}` : ''));
    if (lastFocus) { lastFocus.focus(); lastFocus = null; }
  }

  // ================================================================ render
  const PAGES = ['home', 'highlights', 'about', 'dataset'];
  const VIEWS = ['compare', 'all', 'money', 'culture'];
  function render() {
    if (!PAGES.includes(state.page)) state.page = 'home';
    if (!VIEWS.includes(state.view)) state.view = 'compare';
    document.querySelectorAll('[data-page]').forEach((b) => b.setAttribute('aria-current', b.dataset.page === state.page ? 'page' : 'false'));
    PAGES.forEach((p) => { $(`#page-${p}`).hidden = p !== state.page; });
    if (state.page !== 'home') document.body.classList.remove('tabs-in-hdr');
    document.body.dataset.pg = state.page;
    if (state.page === 'home') {
      renderHomeCards();
      document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === state.view));
      VIEWS.forEach((v) => { $(`#view-${v}`).hidden = v !== state.view; });
      const list = ordered();
      if (state.view === 'compare') renderCompare();
      if (state.view === 'all') renderAll();
      if (state.view === 'money') {
        $('#moneyParts').hidden = state.moneyMode !== 'chart';
        $('#moneyParts').innerHTML = state.moneyMode !== 'chart' ? '' : PARTS.map((x) => { const off = (state.moneyOff || []).includes(x.key); return `<button class="part-chip ${off ? 'off' : ''}" data-part="${x.key}" aria-pressed="${!off}"><i class="${x.cls}"></i>${x.label}</button>`; }).join('');
        $('#moneyMode').innerHTML = [['chart', 'Gets vs pays'], ['table', 'Table']].map(([m, l]) => `<button data-mmode="${m}" aria-pressed="${state.moneyMode === m}">${l}</button>`).join(''); $('#moneyBody').innerHTML = state.moneyMode === 'chart' ? moneyChart(list) : moneyTable(list); }
      if (state.view === 'culture') $('#cultureBody').innerHTML = cultureTable(list);
    }
    if (state.page === 'highlights') renderHighlights();
    if (state.page === 'dataset') renderDataset();
    if (state.page === 'about') renderSources();
    if (!$('#overlay').hidden && state.focus) openCard(state.focus, false);
  }

  // ================================================================ tooltips (status notes, gift details)
  const tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.hidden = true; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl);
  let tipFor = null, tipPinned = false;
  function showTip(btn, pin) {
    tipFor = btn; tipPinned = !!pin;
    const url = btn.dataset.tipUrl;
    tipEl.innerHTML = btn.dataset.tip + (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Source ↗</a>` : '');
    tipEl.hidden = false;
    const r = btn.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left))}px`;
    tipEl.style.top = `${r.bottom + 8 + h > window.innerHeight ? r.top - h - 8 : r.bottom + 8}px`;
  }
  function hideTip() { tipEl.hidden = true; tipFor = null; tipPinned = false; }
  document.addEventListener('mouseover', (e) => { const b = e.target.closest && e.target.closest('[data-tip]'); if (b && !tipPinned) showTip(b); });
  document.addEventListener('mouseout', (e) => {
    const b = e.target.closest && e.target.closest('[data-tip]'); if (!b || tipPinned) return;
    const to = e.relatedTarget; if (to && (b.contains(to) || tipEl.contains(to))) return;
    hideTip();
  });
  tipEl.addEventListener('mouseleave', () => { if (!tipPinned) hideTip(); });
  window.addEventListener('scroll', () => { if (!tipEl.hidden) hideTip(); }, true);
  // v17: radar hover = both countries' values for the indicator under the pointer
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest && e.target.closest('[data-rdi]'); const box = e.target.closest && e.target.closest('.rd');
    if (!box) return; const tip = box.querySelector('.rd-tip');
    if (!t) { tip.hidden = true; box.querySelectorAll('.hot').forEach((x) => x.classList.remove('hot')); return; }
    const id = t.dataset.rdi, ind = IN[id], top = box.querySelector('.rd-top'), s = stats(id);
    const row = (iso, k) => { const c = byIso[iso], x = ind.get(c), r = s.rank.get(iso); return `<div class="rt-r ${k}"><i></i><span>${esc(c.name)}</span><b>${x ? fmtI(ind, x) : 'no data'}</b><em>${r ? `${r}/${s.n}` : ''}</em></div>`; };
    tip.innerHTML = `<div class="rt-h">${tagChip(ind.tag)}${esc(ind.name)}</div>${row(top.dataset.a, 'a')}${row(top.dataset.b, 'b')}`;
    tip.hidden = false;
    const br = box.getBoundingClientRect();
    tip.style.left = `${Math.min(br.width - tip.offsetWidth - 12, Math.max(12, e.clientX - br.left + 16))}px`;
    tip.style.top = `${Math.max(12, e.clientY - br.top - tip.offsetHeight / 2)}px`;
    box.querySelectorAll('.hot').forEach((x) => x.classList.remove('hot'));
    box.querySelectorAll(`circle[data-rdi="${id}"]`).forEach((x) => x.classList.add('hot'));
  });

  // ================================================================ events
  const go = (page) => { state.page = page; save(); history.replaceState(null, '', page === 'home' ? location.pathname : `#${page}`); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  document.addEventListener('click', (e) => {
    if (tipEl.contains(e.target)) return;
    const ddBtn = e.target.closest('.dd-btn');
    if (ddBtn) { const box = ddBtn.parentNode, l = box.querySelector('.dd-list'); closeDD(box); l.hidden = !l.hidden; ddBtn.setAttribute('aria-expanded', String(!l.hidden)); if (!l.hidden) { const on = l.querySelector('.on') || l.querySelector('.dd-o'); on.scrollIntoView({ block: 'nearest' }); on.focus(); } return; }
    const ddO = e.target.closest('.dd-o');
    if (ddO) { closeDD(); return onPick(ddO.dataset.dd, ddO.dataset.ddval); }
    closeDD();
    const tb = e.target.closest('[data-tip]');
    if (tb) { e.preventDefault(); if (tipPinned && tipFor === tb) hideTip(); else showTip(tb, true); return; }
    if (tipPinned) hideTip();
    const t = (s) => e.target.closest(s);
    if (t('[data-page]')) { e.preventDefault(); return go(t('[data-page]').dataset.page); }
    if (e.target.closest('a')) return;
    if (t('[data-view]')) {
      state.view = t('[data-view]').dataset.view; save(); render();
      // v21: tabs are sticky; when switching further down the page, start the new view right under the tabs
      const intro = $('.intro'), anchor = intro.offsetTop + intro.offsetHeight + parseFloat(getComputedStyle($('.viewtabs')).marginTop || 0);
      if (window.scrollY > anchor) window.scrollTo({ top: anchor, behavior: 'smooth' });
      return;
    }
    if (t('[data-cmp]')) { state.cmp = t('[data-cmp]').dataset.cmp; save(); return render(); }
    if (t('[data-allmode]')) { state.allMode = t('[data-allmode]').dataset.allmode; save(); return render(); }
    if (t('[data-mapzoom]')) { const b = t('[data-mapzoom]'); mapZoom = b.dataset.mapzoom; b.parentNode.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); const box = $('#mapBox'); if (box && box._zoomTo) box._zoomTo(mapZoom, true); return; }
    if (t('[data-part]')) { const k = t('[data-part]').dataset.part, off = new Set(state.moneyOff || []); if (off.has(k)) off.delete(k); else off.add(k); state.moneyOff = [...off]; save(); return render(); }
    if (t('[data-mmode]')) { state.moneyMode = t('[data-mmode]').dataset.mmode; save(); return render(); }
    if (t('[data-group]')) { state.group = t('[data-group]').dataset.group; save(); return render(); }
    if (t('[data-hlmode]')) { state.hlMode = t('[data-hlmode]').dataset.hlmode; save(); return render(); }
    if (t('[data-hltag]')) { state.hlTag = t('[data-hltag]').dataset.hltag; save(); return render(); }
    if (t('[data-roll]')) {
      const n = HL().length; let k = state.hlIndex; while (n > 1 && k === state.hlIndex) k = Math.floor(Math.random() * n);
      state.hlIndex = k; save(); render(); const d = $('.dice'); if (d) d.classList.add('rolling'); return;
    }
    if (t('[data-quiz]')) { round.qs[round.i].pick = t('[data-quiz]').dataset.quiz; return render(); }
    if (t('[data-quiznext]')) { round.i += 1; return render(); }
    if (t('[data-quizagain]')) { newRound(); return render(); }
    if (t('[data-sort]')) { const k = t('[data-sort]').dataset.sort; if (state.sortKey === k) state.dir = state.dir === 'desc' ? 'asc' : 'desc'; else { state.sortKey = k; state.dir = 'desc'; } save(); return render(); }
    if (t('[data-ind]')) { const id = t('[data-ind]').dataset.ind; state.openInd = state.openInd === id ? null : id; save(); return renderAll(); }
    if (t('[data-close]')) return closeCard();
    if (t('[data-go]')) return openCard(t('[data-go]').dataset.go);
    if (t('[data-card]')) return openCard(t('[data-card]').dataset.card);
    if (t('[data-iso]')) return openCard(t('[data-iso]').dataset.iso);
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'cmpSel') { state.cmp = e.target.value; save(); render(); }
    if (e.target.id === 'cmp2Sel') { state.cmp2 = e.target.value; save(); render(); }
    if (e.target.id === 'mapSel') { state.mapInd = e.target.value; save(); render(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('.dd-list')) {
      const os = [...e.target.closest('.dd-list').querySelectorAll('.dd-o:not([disabled])')], i = os.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); os[Math.min(os.length - 1, i + 1)].focus(); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); os[Math.max(0, i - 1)].focus(); return; }
      if (e.key === 'Escape') { const b = e.target.closest('.dd').querySelector('.dd-btn'); closeDD(); b.focus(); return; }
      return;
    }
    if (state.page === 'highlights' && state.hlMode === 'quiz' && round && round.i < round.qs.length && $('#overlay').hidden) {
      const k = { a: 0, b: 1, c: 2 }[e.key.toLowerCase()], q = round.qs[round.i];
      if (k != null && !q.pick) { q.pick = q.opts[k]; render(); return; }
      if (e.key === 'Enter' && q.pick && !/BUTTON/.test(e.target.tagName)) { round.i += 1; render(); return; }
    }
    if (e.key === 'Escape' && !tipEl.hidden) { hideTip(); return; }
    if (!$('#overlay').hidden) {
      if (e.key === 'Escape') closeCard();
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const b = $(`#sheet [data-go]:${e.key === 'ArrowRight' ? 'last' : 'first'}-of-type`); if (b) openCard(b.dataset.go); }
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest && e.target.closest('[data-tip]')) return;
    const el = e.target.closest && e.target.closest('[data-iso][tabindex], [data-card][tabindex]');
    if (el && !/BUTTON|A/.test(el.tagName)) { e.preventDefault(); openCard(el.dataset.iso || el.dataset.card); }
  });

  const fromHash = () => {
    const h = location.hash.replace('#', '');
    if (PAGES.includes(h.toLowerCase())) { state.page = h.toLowerCase(); render(); return; }
    if (byIso[h.toUpperCase()]) openCard(h.toUpperCase(), false);
  };
  window.addEventListener('hashchange', fromHash);

  // ================================================================ v22: fixed header with tabs, sticky controls, motion
  const hdr = $('.topbar'), bigTabs = $('.viewtabs');
  const setHdr = () => document.documentElement.style.setProperty('--hdr', `${hdr.offsetHeight}px`);
  // the big tabs scroll away → a compact copy appears inside the fixed header
  const checkTabs = () => {
    const on = state.page === 'home' && bigTabs.getBoundingClientRect().bottom < 64;
    if (on !== document.body.classList.contains('tabs-in-hdr')) { document.body.classList.toggle('tabs-in-hdr', on); setTimeout(setHdr, 320); }
  };
  window.addEventListener('scroll', checkTabs, { passive: true });
  window.addEventListener('resize', setHdr); setHdr();
  // sliding underline under the active big tab
  function moveInk() { const on = bigTabs.querySelector('[aria-pressed="true"]'), ink = bigTabs.querySelector('.tab-ink'); if (on && ink) { ink.style.width = `${on.offsetWidth}px`; ink.style.transform = `translateX(${on.offsetLeft}px)`; } }
  // reveal on scroll
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px 0px' }) : null;
  const REVEAL = '.cgroup, .sum-c, .hc2, .hlx, .ind, .mc-row[data-iso], .grid-table tbody tr, .rd, .paths, .pg-col li, .src-g, .qz-card, .ci-group';
  function reveal() { if (!io) return; let k = 0; document.querySelectorAll(REVEAL).forEach((el) => { if (el.classList.contains('rv')) return; el.classList.add('rv'); el.style.setProperty('--rv', `${Math.min(k++, 10) * 35}ms`); io.observe(el); }); }
  new MutationObserver(() => { reveal(); moveInk(); }).observe(document.querySelector('main'), { childList: true, subtree: true });
  // v23 cursor (after zrk.technology): a thin crosshair that inverts what is under it (mix-blend-mode: difference),
  // follows the pointer exactly; over anything clickable it turns into a square frame.
  if (window.matchMedia('(pointer: fine)').matches && !reduce) {
    const cur = document.createElement('div'); cur.className = 'xh'; cur.innerHTML = '<i></i><i></i><b></b>';
    document.body.append(cur); document.body.classList.add('cc');
    window.addEventListener('mousemove', (e) => {
      cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const h = e.target.closest && e.target.closest('a, button, [data-card], [data-cmp], [role="button"], .cd, .m-c, summary, .dd-o, [data-rdi], select');
      cur.classList.toggle('hot', !!h);
    });
    window.addEventListener('mousedown', () => cur.classList.add('down')); window.addEventListener('mouseup', () => cur.classList.remove('down'));
    document.addEventListener('mouseleave', () => { cur.style.opacity = 0; }); document.addEventListener('mouseenter', () => { cur.style.opacity = 1; });
    // inertial wheel scrolling (Lenis-like): the page glides to the target instead of jumping
    let target = window.scrollY, cur_y = window.scrollY, running = false;
    const scroller = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 2) return true; } return false; };
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !$('#overlay').hidden || scroller(e.target)) return;
      e.preventDefault();
      if (!running) { target = cur_y = window.scrollY; }
      target = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, target + e.deltaY));
      if (!running) { running = true; const step = () => { cur_y += (target - cur_y) * 0.12; if (Math.abs(target - cur_y) < 0.5) { cur_y = target; running = false; } window.scrollTo(0, cur_y); if (running) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    }, { passive: false });
    window.addEventListener('scroll', () => { if (!running) target = cur_y = window.scrollY; }, { passive: true });
  }
  // count-up of the two home correlations
  function countUpHome() { document.querySelectorAll('.hc2-r').forEach((el) => { const t = el.textContent, v = parseFloat(t.replace('−', '-')); if (!isFinite(v) || reduce || el.dataset.done) return; el.dataset.done = 1; const t0 = performance.now(); const st = (n) => { const k = Math.min(1, (n - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = fmtR(v * e); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); }); }
  reveal(); moveInk(); countUpHome();
  render();
  fromHash();
})();
