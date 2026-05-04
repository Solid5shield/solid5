import { useEffect, useRef } from "react";

// ── Global CSS injected once ──────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp-root {
    --bg: #fdf8f2; --bg2: #f7f0e6; --bg3: #ede4d8; --card: #faf5ee; --card2: #f3ece2;
    --teal: #0a7c5c; --teal2: #0d9970; --teal3: rgba(10,124,92,0.09);
    --blue: #1d6fa4; --blue2: #155d8e;
    --white: #ffffff; --text: #1e1a14; --text2: #5a4f3f; --text3: #9c8e7a;
    --border: rgba(90,60,20,0.10); --border2: rgba(10,124,92,0.25);
    --font: 'Syne', sans-serif; --body: 'DM Sans', sans-serif; --mono: 'JetBrains Mono', monospace;
    font-family: var(--body); background: var(--bg); color: var(--text);
    overflow-x: hidden; line-height: 1.6;
  }

  .lp-root ::-webkit-scrollbar { width: 5px; }
  .lp-root ::-webkit-scrollbar-track { background: var(--bg); }
  .lp-root ::-webkit-scrollbar-thumb { background: var(--bg3); border-radius: 3px; }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    padding: 0 5%; height: 68px; display: flex; align-items: center;
    justify-content: space-between; transition: all 0.3s;
  }
  .lp-nav.scrolled {
    background: rgba(253,248,242,0.96); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border); box-shadow: 0 2px 16px rgba(90,60,20,0.06);
  }
  .lp-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .lp-nav-logo-text { font-family: var(--font); align-content: center; font-size: 16px; font-weight: 300; color: var(--text); letter-spacing: -0.3px; }
  .lp-nav-logo-text span { color: var(--teal); }
  .lp-nav-links { display: flex; align-items: center; gap: 32px; }
  .lp-nav-links a { color: var(--text2); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
  .lp-nav-links a:hover { color: var(--text); }
  .lp-nav-cta { display: flex; align-items: center; gap: 10px; }
  .lp-btn-ghost { padding: 9px 20px; border: 1px solid var(--border2); border-radius: 8px; color: var(--teal); background: none; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--body); transition: all 0.2s; text-decoration: none; }
  .lp-btn-ghost:hover { background: var(--teal3); }
  .lp-btn-primary { padding: 9px 22px; border: none; border-radius: 8px; background: linear-gradient(135deg,var(--teal),var(--blue)); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--body); transition: all 0.2s; text-decoration: none; white-space: nowrap; display: inline-block; }
  .lp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(10,124,92,0.28); }

  /* ── HERO ── */
  .lp-hero {
    position: relative; min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 100px 5% 80px;
    overflow: hidden; text-align: center;
    background: radial-gradient(ellipse 70% 60% at 50% 35%, rgba(10,124,92,0.07) 0%, transparent 70%), var(--bg);
  }
  .lp-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom,transparent 60%,var(--bg) 100%); z-index: 1; }
  .lp-hero-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
  .lp-hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; opacity: 0.12; }
  .lp-hero-content { position: relative; z-index: 2; max-width: 780px; }
  .lp-hero-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(10,124,92,0.07); border: 1px solid rgba(10,124,92,0.2); border-radius: 20px; padding: 6px 14px; margin-bottom: 28px; }
  .lp-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); animation: lp-pulse 1.8s infinite; }
  @keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)} }
  .lp-badge-text { font-family: var(--mono); font-size: 11px; font-weight: 600; color: var(--teal); letter-spacing: 0.08em; text-transform: uppercase; }
  .lp-hero h1 { font-family: var(--font); font-size: clamp(42px,6vw,76px); font-weight: 800; line-height: 1.05; color: var(--text); letter-spacing: -1.5px; margin-bottom: 22px; }
  .lp-hl { color: var(--teal); }
  .lp-hl2 { background: linear-gradient(90deg,var(--teal),var(--blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .lp-hero-sub { font-size: 18px; color: var(--text2); max-width: 560px; margin: 0 auto 40px; line-height: 1.7; font-weight: 400; }
  .lp-hero-cta-row { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 52px; flex-wrap: wrap; }
  .lp-btn-hero { display: flex; align-items: center; gap: 10px; padding: 15px 28px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: var(--body); transition: all 0.25s; text-decoration: none; border: none; }
  .lp-btn-google { background: #fff; color: #1a1a1a; border: 1px solid rgba(0,0,0,0.10); }
  .lp-btn-google:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.12); }
  .lp-btn-ms { background: #0078d4; color: #fff; }
  .lp-btn-ms:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,120,212,0.3); }
  .lp-btn-hero-primary { background: linear-gradient(135deg,var(--teal),#0a6fa0); color: #fff; }
  .lp-btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(10,124,92,0.3); }
  .lp-hero-trust { display: flex; align-items: center; justify-content: center; gap: 28px; flex-wrap: wrap; }
  .lp-trust-item { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--text3); }
  .lp-trust-icon { width: 16px; height: 16px; color: var(--teal); }
  .lp-hero-scroll { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--text3); font-size: 11px; font-family: var(--mono); letter-spacing: 0.1em; animation: lp-bounce 2s infinite; }
  @keyframes lp-bounce { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)} }
  .lp-scroll-arrow { width: 20px; height: 20px; }
  .lp-video-note { position: absolute; bottom: 10px; right: 16px; z-index: 3; font-family: var(--mono); font-size: 9px; color: rgba(90,60,20,0.25); letter-spacing: 0.06em; }

  /* ── STATS BAR ── */
  .lp-statsbar { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 32px 5%; }
  .lp-statsbar-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: var(--border); }
  .lp-statitem { background: var(--bg2); padding: 28px 32px; text-align: center; }
  .lp-statitem-val { font-family: var(--font); font-size: 42px; font-weight: 800; color: var(--teal); line-height: 1; margin-bottom: 6px; }
  .lp-statitem-label { font-size: 13px; color: var(--text2); font-weight: 400; }

  /* ── SECTIONS ── */
  .lp-section { padding: 100px 5%; }
  .lp-section-inner { max-width: 1100px; margin: 0 auto; }
  .lp-section-tag { display: inline-flex; align-items: center; gap: 6px; background: var(--teal3); border: 1px solid var(--border2); border-radius: 20px; padding: 5px 12px; font-family: var(--mono); font-size: 11px; font-weight: 600; color: var(--teal); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 18px; }
  .lp-section-title { font-family: var(--font); font-size: clamp(28px,3.5vw,46px); font-weight: 800; color: var(--text); letter-spacing: -0.8px; line-height: 1.1; margin-bottom: 16px; }
  .lp-section-sub { font-size: 17px; color: var(--text2); max-width: 580px; line-height: 1.7; }
  .lp-section-head-centered { text-align: center; margin-bottom: 60px; }
  .lp-section-head-centered .lp-section-sub { margin: 0 auto; }

  /* ── FEATURES ── */
  .lp-features { background: var(--bg); }
  .lp-features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .lp-feat-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; transition: all 0.3s; position: relative; overflow: hidden; }
  .lp-feat-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,transparent,var(--teal),transparent); opacity: 0; transition: opacity 0.3s; }
  .lp-feat-card:hover { border-color: rgba(10,124,92,0.22); transform: translateY(-3px); box-shadow: 0 16px 40px rgba(90,60,20,0.08); }
  .lp-feat-card:hover::before { opacity: 1; }
  .lp-feat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; flex-shrink: 0; }
  .lp-feat-card h3 { font-family: var(--font); font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 10px; letter-spacing: -0.2px; }
  .lp-feat-card p { font-size: 14px; color: var(--text2); line-height: 1.65; }
  .lp-feat-tag { display: inline-block; margin-top: 14px; font-family: var(--mono); font-size: 10px; font-weight: 600; color: var(--teal2); letter-spacing: 0.06em; text-transform: uppercase; }

  /* ── HOW IT WORKS ── */
  .lp-hiw { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .lp-hiw-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; position: relative; }
  .lp-hiw-grid::before { content: ""; position: absolute; top: 48px; left: calc(33.33%); right: calc(33.33%); height: 1px; background: linear-gradient(90deg,var(--teal),var(--blue)); opacity: 0.3; z-index: 0; }
  .lp-hiw-step { padding: 40px 32px; text-align: center; position: relative; z-index: 1; }
  .lp-step-number { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg,var(--teal),var(--blue)); display: flex; align-items: center; justify-content: center; margin: 0 auto 22px; font-family: var(--mono); font-size: 18px; font-weight: 700; color: #fff; position: relative; }
  .lp-step-number::after { content: ""; position: absolute; inset: -3px; border-radius: 50%; border: 1px solid rgba(10,124,92,0.3); animation: lp-ring 2.5s linear infinite; }
  @keyframes lp-ring { 0%{transform:scale(1);opacity:.5}100%{transform:scale(1.2);opacity:0} }
  .lp-hiw-step h3 { font-family: var(--font); font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
  .lp-hiw-step p { font-size: 14px; color: var(--text2); line-height: 1.65; max-width: 240px; margin: 0 auto; }
  .lp-hiw-step-icon { font-size: 13px; font-family: var(--mono); color: var(--teal); margin-bottom: 8px; letter-spacing: 0.06em; }

  /* ── DEMO ── */
  .lp-demo-section { background: var(--bg); }
  .lp-demo-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .lp-demo-text .lp-section-sub { margin-bottom: 28px; }
  .lp-demo-checks { display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px; }
  .lp-demo-check { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--text2); }
  .lp-check-dot { width: 20px; height: 20px; border-radius: 50%; background: var(--teal3); border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-check-dot svg { width: 10px; height: 10px; }
  .lp-demo-ui { background: var(--card); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; box-shadow: 0 24px 80px rgba(90,60,20,0.10); }
  .lp-demo-ui-header { background: var(--bg3); padding: 12px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border); }
  .lp-demo-dot { width: 10px; height: 10px; border-radius: 50%; }
  .lp-demo-ui-title { font-family: var(--mono); font-size: 11px; color: var(--text3); margin-left: 4px; letter-spacing: 0.06em; }
  .lp-demo-email-row { padding: 14px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; transition: background 0.2s; }
  .lp-demo-email-row:hover { background: rgba(10,124,92,0.03); }
  .lp-demo-risk-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .lp-r-high { background: #dc2626; box-shadow: 0 0 6px rgba(220,38,38,0.5); }
  .lp-r-med  { background: #d97706; box-shadow: 0 0 4px rgba(217,119,6,0.4); }
  .lp-r-low  { background: #059669; }
  .lp-demo-ei { flex: 1; min-width: 0; }
  .lp-demo-from { font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lp-demo-subj { font-size: 11px; color: var(--text3); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lp-demo-badge { font-family: var(--mono); font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 600; flex-shrink: 0; }
  .lp-db-high { background: rgba(220,38,38,0.08); color: #b91c1c; border: 1px solid rgba(220,38,38,0.22); }
  .lp-db-med  { background: rgba(217,119,6,0.08);  color: #b45309; border: 1px solid rgba(217,119,6,0.2); }
  .lp-db-low  { background: rgba(5,150,105,0.08);  color: #047857; border: 1px solid rgba(5,150,105,0.22); }
  .lp-demo-ai-box { padding: 16px; background: rgba(10,124,92,0.04); border-top: 1px solid var(--border); }
  .lp-ai-label { font-family: var(--mono); font-size: 10px; color: var(--teal); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
  .lp-ai-text { font-size: 12px; color: var(--text2); line-height: 1.6; font-family: var(--mono); }

  /* ── INTEGRATIONS ── */
  .lp-integrations { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 60px 5%; }
  .lp-integrations-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
  .lp-integrations h3 { font-family: var(--font); font-size: 18px; font-weight: 700; color: var(--text2); margin-bottom: 32px; letter-spacing: 0.02em; }
  .lp-int-logos { display: flex; align-items: center; justify-content: center; gap: 40px; flex-wrap: wrap; }
  .lp-int-logo { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--text3); opacity: 0.7; transition: opacity 0.2s; }
  .lp-int-logo:hover { opacity: 1; }
  .lp-int-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; }

  /* ── PRICING ── */
  .lp-pricing { background: var(--bg2); border-top: 1px solid var(--border); }
  .lp-pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .lp-price-card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 32px; position: relative; transition: all 0.3s; }
  .lp-price-card.featured { border-color: rgba(10,124,92,0.35); background: linear-gradient(160deg,rgba(10,124,92,0.05),var(--card)); box-shadow: 0 8px 32px rgba(10,124,92,0.08); }
  .lp-price-card.featured::after { content: "Most Popular"; position: absolute; top: -1px; left: 50%; transform: translateX(-50%); background: linear-gradient(90deg,var(--teal),var(--blue)); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 0 0 8px 8px; font-family: var(--mono); letter-spacing: 0.06em; white-space: nowrap; }
  .lp-price-tier { font-family: var(--mono); font-size: 11px; font-weight: 600; color: var(--teal); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; }
  .lp-price-name { font-family: var(--font); font-size: 22px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
  .lp-price-desc { font-size: 13px; color: var(--text2); margin-bottom: 24px; line-height: 1.5; }
  .lp-price-amount { display: flex; align-items: baseline; gap: 4px; margin-bottom: 28px; }
  .lp-price-currency { font-size: 18px; font-weight: 600; color: var(--text2); }
  .lp-price-num { font-family: var(--font); font-size: 48px; font-weight: 800; color: var(--text); line-height: 1; }
  .lp-price-period { font-size: 14px; color: var(--text3); }
  .lp-price-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .lp-price-feat { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text2); }
  .lp-price-feat svg { width: 15px; height: 15px; flex-shrink: 0; }
  .lp-price-feat.off { color: var(--text3); }
  .lp-btn-price { width: 100%; padding: 13px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: var(--body); transition: all 0.2s; text-align: center; display: block; text-decoration: none; border: none; }
  .lp-btn-price-outline { background: none; border: 1px solid var(--border2); color: var(--teal); }
  .lp-btn-price-outline:hover { background: var(--teal3); }
  .lp-btn-price-solid { background: linear-gradient(135deg,var(--teal),var(--blue)); color: #fff; }
  .lp-btn-price-solid:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(10,124,92,0.25); }

  /* ── TESTIMONIALS ── */
  .lp-testimonials { background: var(--bg); }
  .lp-testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .lp-testi-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; transition: all 0.3s; }
  .lp-testi-card:hover { border-color: rgba(10,124,92,0.18); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(90,60,20,0.06); }
  .lp-testi-stars { display: flex; gap: 3px; margin-bottom: 16px; color: var(--teal); font-size: 14px; }
  .lp-testi-text { font-size: 14px; color: var(--text2); line-height: 1.7; margin-bottom: 20px; font-style: italic; }
  .lp-testi-author { display: flex; align-items: center; gap: 12px; }
  .lp-testi-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; font-family: var(--font); flex-shrink: 0; }
  .lp-testi-name { font-size: 14px; font-weight: 600; color: var(--text); }
  .lp-testi-role { font-size: 12px; color: var(--text3); }

  /* ── FINAL CTA ── */
  .lp-final-cta { background: radial-gradient(ellipse 70% 80% at 50% 50%,rgba(10,124,92,0.07),transparent), var(--bg); padding: 120px 5%; text-align: center; border-top: 1px solid var(--border); }
  .lp-final-cta h2 { font-family: var(--font); font-size: clamp(32px,4vw,54px); font-weight: 800; color: var(--text); margin-bottom: 18px; letter-spacing: -1px; }
  .lp-final-cta h2 span { color: var(--teal); }
  .lp-final-cta p { font-size: 17px; color: var(--text2); max-width: 500px; margin: 0 auto 40px; line-height: 1.7; }
  .lp-final-cta-btns { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
  .lp-cta-note { margin-top: 18px; font-size: 12px; color: var(--text3); font-family: var(--mono); }

  /* ── FOOTER ── */
  .lp-footer { background: var(--bg2); border-top: 1px solid var(--border); padding: 60px 5% 36px; }
  .lp-footer-inner { max-width: 1100px; margin: 0 auto; }
  .lp-footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
  .lp-footer-brand p { font-size: 14px; color: var(--text2); line-height: 1.7; margin-top: 14px; max-width: 280px; }
  .lp-footer-col h4 { font-family: var(--font); font-size: 13px; font-weight: 700; color: var(--text); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
  .lp-footer-col a { display: block; font-size: 13px; color: var(--text2); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
  .lp-footer-col a:hover { color: var(--teal); }
  .lp-footer-bottom { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 24px; flex-wrap: wrap; gap: 14px; }
  .lp-footer-copy { font-size: 13px; color: var(--text3); }
  .lp-footer-badges { display: flex; gap: 8px; }
  .lp-footer-badge { font-family: var(--mono); font-size: 10px; padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border); color: var(--text3); font-weight: 600; letter-spacing: 0.06em; }

  /* ── ANIMATIONS ── */
  .lp-fade-up { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .lp-fade-up.visible { opacity: 1; transform: translateY(0); }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .lp-nav-links { display: none; }
    .lp-features-grid, .lp-pricing-grid, .lp-testi-grid { grid-template-columns: 1fr; }
    .lp-hiw-grid { grid-template-columns: 1fr; }
    .lp-hiw-grid::before { display: none; }
    .lp-demo-wrap { grid-template-columns: 1fr; }
    .lp-footer-top { grid-template-columns: 1fr 1fr; }
    .lp-statsbar-inner { grid-template-columns: repeat(2,1fr); }
  }
  @media (max-width: 600px) {
    .lp-hero-cta-row { flex-direction: column; align-items: stretch; }
    .lp-btn-hero { justify-content: center; }
    .lp-footer-top { grid-template-columns: 1fr; }
    .lp-statsbar-inner { grid-template-columns: 1fr; }
    .lp-final-cta-btns { flex-direction: column; align-items: stretch; }
  }
`;

function injectStyles() {
  if (document.getElementById("lp-styles")) return;
  const el = document.createElement("style");
  el.id = "lp-styles";
  el.textContent = CSS;
  document.head.appendChild(el);
}

// ── Canvas particle animation hook ───────────────────────────────────────────
function useParticleCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let nodes = [];
    let W, H;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    function makeNode() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI * 2,
        type: Math.random() > 0.85 ? "bright" : "dim",
      };
    }
    function init() {
      resize();
      nodes = [];
      const c = Math.floor((W * H) / 14000);
      for (let i = 0; i < c; i++) nodes.push(makeNode());
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(10,124,92,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x,
            dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            ctx.strokeStyle = `rgba(10,124,92,${(1 - d / 160) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      nodes.forEach((n) => {
        n.pulse += 0.025;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        const g = n.type === "bright" ? Math.sin(n.pulse) * 0.3 + 0.45 : 0.2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle =
          n.type === "bright"
            ? `rgba(10,124,92,${g})`
            : `rgba(29,111,164,${g * 0.5})`;
        ctx.fill();
        if (n.type === "bright") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(10,124,92,${g * 0.06})`;
          ctx.fill();
        }
      });
      animId = requestAnimationFrame(draw);
    }
    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", init);
    };
  }, [canvasRef]);
}

// ── Reusable SVG components ───────────────────────────────────────────────────
function GoogleSVG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
function MicrosoftSVG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 23 23">
      <rect x="1" y="1" width="10" height="10" fill="#f25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
      <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
      <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
    </svg>
  );
}
function CheckCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="#0a7c5c"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function XCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="#9c8e7a" strokeWidth="1.8" />
    </svg>
  );
}
function CheckMini() {
  return (
    <svg viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6l2.5 2.5 4.5-4.5"
        stroke="#0a7c5c"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage({ onLogin, onSignup }) {
  const navRef = useRef(null);
  const canvasRef = useRef(null);
  useParticleCanvas(canvasRef);

  useEffect(() => {
    injectStyles();

    const handleScroll = () => {
      navRef.current?.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);

    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".lp-fade-up").forEach((el) => obs.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      obs.disconnect();
    };
  }, []);

  return (
    <div className="lp-root">
      {/* ── NAV ── */}
      <nav className="lp-nav" ref={navRef}>
        <a className="lp-nav-logo" href="/">
          <div className="lp-nav-logo-text">
            <img
              src="solid-5.svg"
              style={{ width: "120px" }}
              alt="Solid5 Shield"
            />
          </div>
        </a>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="lp-nav-cta">
          <button onClick={onLogin} className="lp-btn-ghost">
            Sign in
          </button>
          <button onClick={onSignup} className="lp-btn-primary">
            Start Free →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <video className="lp-hero-video" autoPlay muted loop playsInline>
          <source src="/src/assets/videos/cyber.mp4" type="video/mp4" />
        </video>
        <canvas ref={canvasRef} className="lp-hero-canvas" />
        <div className="lp-hero-overlay" />

        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <div className="lp-badge-dot" />
            <span className="lp-badge-text">
              AI-Powered · 14 Detection Checks · Real-time
            </span>
          </div>
          <h1>
            Stop phishing before it <span className="lp-hl2">stops you</span>
          </h1>
          <p className="lp-hero-sub">
            Solid5 Shield uses AI to detect spoofed sender domains, homograph
            attacks, and brand impersonation — instantly, on every email you
            receive.
          </p>
          <div className="lp-hero-cta-row">
            <button onClick={onSignup} className="lp-btn-hero lp-btn-google">
              <GoogleSVG /> Connect Gmail
            </button>
            <button onClick={onSignup} className="lp-btn-hero lp-btn-ms">
              <MicrosoftSVG /> Connect Outlook
            </button>
            <button
              onClick={onSignup}
              className="lp-btn-hero lp-btn-hero-primary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Forward to scan
            </button>
          </div>
          <div className="lp-hero-trust">
            {[
              {
                icon: (
                  <path
                    d="M10 2L3 5v6c0 3.5 3 6 7 7 4-1 7-3.5 7-7V5L10 2z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="none"
                  />
                ),
                label: "Read-only access",
              },
              {
                icon: (
                  <path
                    d="M9 12l2 2 4-4M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                ),
                label: "POPIA compliant",
              },
              {
                icon: (
                  <path
                    d="M13 10a3 3 0 11-6 0 3 3 0 016 0zM2 10h2m12 0h2M10 2v2m0 12v2"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                ),
                label: "Never stores emails",
              },
              {
                icon: (
                  <>
                    <path
                      d="M10 2v10M6 6l4-4 4 4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                    <rect
                      x="3"
                      y="14"
                      width="14"
                      height="4"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </>
                ),
                label: "Free to get started",
              },
            ].map(({ icon, label }) => (
              <div key={label} className="lp-trust-item">
                <svg className="lp-trust-icon" viewBox="0 0 20 20" fill="none">
                  {icon}
                </svg>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="lp-hero-scroll">
          <span>SCROLL</span>
          <svg className="lp-scroll-arrow" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 10l5 5 5-5"
              stroke="rgba(90,60,20,0.4)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="lp-video-note">
          Animated background · Replace with video in production
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="lp-statsbar">
        <div className="lp-statsbar-inner">
          {[
            ["14", "Detection checks per email"],
            ["<2s", "Average analysis time"],
            ["98%", "Detection accuracy"],
            ["0", "Emails stored on our servers"],
          ].map(([v, l]) => (
            <div key={l} className="lp-statitem lp-fade-up">
              <div className="lp-statitem-val">{v}</div>
              <div className="lp-statitem-label">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="lp-section lp-features" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-head-centered lp-fade-up">
            <div className="lp-section-tag">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Features
            </div>
            <div className="lp-section-title">
              Everything watching your inbox
            </div>
            <p className="lp-section-sub">
              14 real-time checks run on every sender domain the moment an email
              arrives — before you even open it.
            </p>
          </div>
          <div className="lp-features-grid">
            {[
              {
                bg: "rgba(10,124,92,0.09)",
                icon: (
                  <>
                    <path
                      d="M12 2L4 6v7c0 4.5 3.5 7.5 8 9 4.5-1.5 8-4.5 8-9V6L12 2z"
                      stroke="#0a7c5c"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="#0a7c5c"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </>
                ),
                title: "Homograph Attack Detection",
                body: (
                  <>
                    Catches invisible character substitutions like paypa
                    <strong style={{ color: "#dc2626" }}>1</strong>.com vs
                    paypal.com. Unicode confusable analysis runs on every domain
                    automatically.
                  </>
                ),
                tag: "Unicode · Cyrillic · IDN",
              },
              {
                bg: "rgba(29,111,164,0.09)",
                icon: (
                  <>
                    <circle
                      cx="11"
                      cy="11"
                      r="8"
                      stroke="#1d6fa4"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M21 21l-4.35-4.35"
                      stroke="#1d6fa4"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M11 8v3l2 2"
                      stroke="#1d6fa4"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </>
                ),
                title: "Typosquatting Analysis",
                body: "Levenshtein distance algorithm compares sender domains to legitimate brands. A distance of 1–2 characters triggers instant investigation.",
                tag: "Edit Distance · Fuzzy Match",
              },
              {
                bg: "rgba(220,38,38,0.08)",
                icon: (
                  <>
                    <path
                      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      stroke="#dc2626"
                      strokeWidth="1.8"
                    />
                    <line
                      x1="12"
                      y1="9"
                      x2="12"
                      y2="13"
                      stroke="#dc2626"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12"
                      y1="17"
                      x2="12.01"
                      y2="17"
                      stroke="#dc2626"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </>
                ),
                title: "SPF / DKIM / DMARC Checks",
                body: "Email authentication checks verified on every message. Failures on SPF, DKIM, or DMARC are weighted heavily in the risk score calculation.",
                tag: "Email Auth · DNS Validation",
              },
              {
                bg: "rgba(217,119,6,0.09)",
                icon: (
                  <>
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      stroke="#d97706"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M7 11V7a5 5 0 0110 0v4"
                      stroke="#d97706"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </>
                ),
                title: "Brand Impersonation",
                body: "Detects keywords from major brands injected into fraudulent domains. microsoft-secure.net, paypal-billing.co — all caught instantly.",
                tag: "100+ Brand Patterns",
              },
              {
                bg: "rgba(124,58,237,0.09)",
                icon: (
                  <path
                    d="M22 12h-4l-3 9L9 3l-3 9H2"
                    stroke="#7c3aed"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
                title: "Live Threat Intelligence",
                body: "Every domain is checked against VirusTotal, PhishTank, and Spamhaus feeds in real-time. Known bad domains are flagged with source attribution.",
                tag: "VirusTotal · PhishTank · Spamhaus",
              },
              {
                bg: "rgba(10,124,92,0.09)",
                icon: (
                  <path
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                    stroke="#0a7c5c"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                ),
                title: "AI Plain-English Verdict",
                body: "Claude AI translates every technical finding into a simple explanation your whole team can understand — no security degree required.",
                tag: "Powered by Claude AI",
              },
            ].map(({ bg, icon, title, body, tag }) => (
              <div key={title} className="lp-feat-card lp-fade-up">
                <div className="lp-feat-icon" style={{ background: bg }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    {icon}
                  </svg>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="lp-feat-tag">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-hiw" id="how-it-works">
        <div className="lp-section-inner">
          <div className="lp-section-head-centered lp-fade-up">
            <div className="lp-section-tag">How it works</div>
            <div className="lp-section-title">Setup in 60 seconds</div>
            <p className="lp-section-sub">
              No technical knowledge needed. If you can tap a button, you can
              protect your inbox.
            </p>
          </div>
          <div className="lp-hiw-grid">
            {[
              [
                "STEP 01",
                "1",
                "Connect your inbox",
                'Tap "Connect Gmail" or "Connect Outlook" and authorise through the standard Google or Microsoft login screen — just like signing into any app.',
              ],
              [
                "STEP 02",
                "2",
                "AI scans every sender",
                "The moment an email arrives, Solid5 Shield runs 14 checks on the sender domain — authentication, lookalike analysis, threat intelligence, and AI assessment.",
              ],
              [
                "STEP 03",
                "3",
                "Get instant alerts",
                "High-risk senders get flagged in your dashboard with a risk level, attack type, and a plain-English explanation of exactly what's suspicious.",
              ],
            ].map(([step, num, title, body]) => (
              <div key={num} className="lp-hiw-step lp-fade-up">
                <div className="lp-hiw-step-icon">{step}</div>
                <div className="lp-step-number">{num}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO PREVIEW ── */}
      <section className="lp-section lp-demo-section">
        <div className="lp-section-inner">
          <div className="lp-demo-wrap">
            <div className="lp-demo-text lp-fade-up">
              <div className="lp-section-tag">Live analysis</div>
              <div className="lp-section-title">
                See threats the moment they arrive
              </div>
              <p className="lp-section-sub">
                The dashboard shows every email with a real-time risk score.
                Click any flagged sender for the full forensic breakdown.
              </p>
              <div className="lp-demo-checks">
                {[
                  "Risk badge on every email before you open it",
                  "Domain comparison: trusted vs sender side by side",
                  "One-tap block, report, or whitelist actions",
                  "AI explanation written for non-technical users",
                ].map((t) => (
                  <div key={t} className="lp-demo-check">
                    <div className="lp-check-dot">
                      <CheckMini />
                    </div>
                    {t}
                  </div>
                ))}
              </div>
              <button
                onClick={onSignup}
                className="lp-btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "13px 24px",
                  fontSize: "14px",
                  borderRadius: "10px",
                }}
              >
                Try it free — no credit card →
              </button>
            </div>
            <div className="lp-demo-ui lp-fade-up">
              <div className="lp-demo-ui-header">
                <div
                  className="lp-demo-dot"
                  style={{ background: "#ef4444" }}
                />
                <div
                  className="lp-demo-dot"
                  style={{ background: "#f59e0b" }}
                />
                <div
                  className="lp-demo-dot"
                  style={{ background: "#10b981" }}
                />
                <span className="lp-demo-ui-title">
                  SOLID5 SHIELD · INBOX MONITOR
                </span>
              </div>
              {[
                {
                  dot: "lp-r-high",
                  from: "billing@paypa1.com",
                  subj: "Account limited — verify now",
                  badge: "HIGH",
                  cls: "lp-db-high",
                },
                {
                  dot: "lp-r-high",
                  from: "hr@microsoft-corp.net",
                  subj: "Benefits enrollment closing today",
                  badge: "HIGH",
                  cls: "lp-db-high",
                },
                {
                  dot: "lp-r-med",
                  from: "support@netfIix.com",
                  subj: "Payment failed — update billing",
                  badge: "MEDIUM",
                  cls: "lp-db-med",
                },
                {
                  dot: "lp-r-low",
                  from: "invoices@amazon.com",
                  subj: "Invoice #INV-20240312 ready",
                  badge: "SAFE",
                  cls: "lp-db-low",
                },
              ].map(({ dot, from, subj, badge, cls }) => (
                <div key={from} className="lp-demo-email-row">
                  <div className={`lp-demo-risk-dot ${dot}`} />
                  <div className="lp-demo-ei">
                    <div className="lp-demo-from">{from}</div>
                    <div className="lp-demo-subj">{subj}</div>
                  </div>
                  <span className={`lp-demo-badge ${cls}`}>{badge}</span>
                </div>
              ))}
              <div className="lp-demo-ai-box">
                <div className="lp-ai-label">⚡ AI Assessment · paypa1.com</div>
                <div className="lp-ai-text">
                  Domain uses numeric homograph substitution (1→l). SPF FAIL,
                  domain registered 12 days ago. VirusTotal: 14/86 engines.
                  Recommend: Block immediately.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <div className="lp-integrations">
        <div className="lp-integrations-inner">
          <h3>Works alongside your existing tools</h3>
          <div className="lp-int-logos">
            <div className="lp-int-logo">
              <div
                className="lp-int-icon"
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: "5px",
                }}
              >
                <GoogleSVG size={16} />
              </div>
              Gmail
            </div>
            <div className="lp-int-logo">
              <div className="lp-int-icon" style={{ background: "#0078d4" }}>
                <MicrosoftSVG size={14} />
              </div>
              Outlook
            </div>
            <div className="lp-int-logo">
              <div
                className="lp-int-icon"
                style={{
                  background: "#e61c28",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              >
                Z
              </div>
              Zoho Mail
            </div>
            <div className="lp-int-logo">
              <div className="lp-int-icon" style={{ background: "#4a154b" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#e01e5a">
                  <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" />
                </svg>
              </div>
              Slack
            </div>
            <div className="lp-int-logo">
              <div
                className="lp-int-icon"
                style={{
                  background: "#00b4d8",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 10,
                }}
              >
                SN
              </div>
              ServiceNow
            </div>
            <div className="lp-int-logo">
              <div
                className="lp-int-icon"
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  color: "var(--teal)",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                API
              </div>
              REST API
            </div>
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <section className="lp-section lp-pricing" id="pricing">
        <div className="lp-section-inner">
          <div className="lp-section-head-centered lp-fade-up">
            <div className="lp-section-tag">Pricing</div>
            <div className="lp-section-title">Simple, transparent pricing</div>
            <p className="lp-section-sub">
              Start free. Upgrade when you need more. No contracts, cancel any
              time.
            </p>
          </div>
          <div className="lp-pricing-grid">
            {/* Free */}
            <div className="lp-price-card lp-fade-up">
              <div className="lp-price-tier">Free</div>
              <div className="lp-price-name">Shield Basic</div>
              <div className="lp-price-desc">
                For individuals who want essential email protection.
              </div>
              <div className="lp-price-amount">
                <span className="lp-price-currency">R</span>
                <span className="lp-price-num">0</span>
                <span className="lp-price-period">/month</span>
              </div>
              <div className="lp-price-features">
                {[
                  "1 inbox connected",
                  "100 emails scanned / month",
                  "14-point detection matrix",
                  "Mobile app access",
                ].map((f) => (
                  <div key={f} className="lp-price-feat">
                    <CheckCircle />
                    {f}
                  </div>
                ))}
                {[
                  "Threat intelligence feeds",
                  "Lookalike domain monitoring",
                ].map((f) => (
                  <div key={f} className="lp-price-feat off">
                    <XCircle />
                    {f}
                  </div>
                ))}
              </div>
              <button
                onClick={onSignup}
                className="lp-btn-price lp-btn-price-outline"
              >
                Get started free
              </button>
            </div>
            {/* Pro */}
            <div className="lp-price-card featured lp-fade-up">
              <div className="lp-price-tier">Personal</div>
              <div className="lp-price-name">Shield Pro</div>
              <div className="lp-price-desc">
                For professionals who need complete inbox protection.
              </div>
              <div className="lp-price-amount">
                <span className="lp-price-currency">R</span>
                <span className="lp-price-num">99</span>
                <span className="lp-price-period">/month</span>
              </div>
              <div className="lp-price-features">
                {[
                  "3 inboxes connected",
                  "Unlimited email scanning",
                  "Live threat intelligence",
                  "Lookalike domain alerts",
                  "Slack / email notifications",
                  "Forensic report exports",
                ].map((f) => (
                  <div key={f} className="lp-price-feat">
                    <CheckCircle />
                    {f}
                  </div>
                ))}
              </div>
              <button
                onClick={onSignup}
                className="lp-btn-price lp-btn-price-solid"
              >
                Start 14-day free trial
              </button>
            </div>
            {/* Enterprise */}
            <div className="lp-price-card lp-fade-up">
              <div className="lp-price-tier">Business</div>
              <div className="lp-price-name">Shield Enterprise</div>
              <div className="lp-price-desc">
                For teams and businesses requiring full SOC-grade protection.
              </div>
              <div className="lp-price-amount">
                <span
                  className="lp-price-currency"
                  style={{
                    fontSize: "14px",
                    color: "#9c8e7a",
                    alignSelf: "center",
                  }}
                >
                  From
                </span>
                &nbsp;
                <span className="lp-price-num" style={{ fontSize: "36px" }}>
                  R499
                </span>
                <span className="lp-price-period">/month</span>
              </div>
              <div className="lp-price-features">
                {[
                  "Unlimited inboxes & users",
                  "SIEM / Splunk integration",
                  "Chain-of-custody audit log",
                  "POPIA / GDPR / SOC 2 mode",
                  "Dedicated account manager",
                  "Custom integrations & API",
                ].map((f) => (
                  <div key={f} className="lp-price-feat">
                    <CheckCircle />
                    {f}
                  </div>
                ))}
              </div>
              <a
                href="mailto:enterprise@solid5.co.za"
                className="lp-btn-price lp-btn-price-outline"
              >
                Contact sales →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section lp-testimonials">
        <div className="lp-section-inner">
          <div className="lp-section-head-centered lp-fade-up">
            <div className="lp-section-tag">Testimonials</div>
            <div className="lp-section-title">Trusted by South Africans</div>
          </div>
          <div className="lp-testi-grid">
            {[
              {
                initials: "TM",
                color: "rgba(10,124,92,0.12)",
                fg: "#0a7c5c",
                name: "Thabo M.",
                role: "Freelance Designer · Johannesburg",
                quote:
                  "Caught a PayPal spoof that looked completely legitimate to me. The AI explanation made it clear exactly what the attacker did. Incredible tool.",
              },
              {
                initials: "LN",
                color: "rgba(29,111,164,0.12)",
                fg: "#1d6fa4",
                name: "Lungile N.",
                role: "IT Manager · Cape Town SME",
                quote:
                  "We roll it out to every employee on day one now. No more phishing training sessions — the tool just handles it. ROI was immediate.",
              },
              {
                initials: "SR",
                color: "rgba(124,58,237,0.12)",
                fg: "#7c3aed",
                name: "Sipho R.",
                role: "Software Developer · Pretoria",
                quote:
                  "The forward-to-scan feature is genius. My mom uses it. She forwards anything suspicious and gets back a plain-English explanation. No tech needed.",
              },
            ].map(({ initials, color, fg, name, role, quote }) => (
              <div key={name} className="lp-testi-card lp-fade-up">
                <div className="lp-testi-stars">★★★★★</div>
                <p className="lp-testi-text">"{quote}"</p>
                <div className="lp-testi-author">
                  <div
                    className="lp-testi-avatar"
                    style={{ background: color, color: fg }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="lp-testi-name">{name}</div>
                    <div className="lp-testi-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-final-cta" id="contact">
        <div className="lp-section-inner">
          <div className="lp-fade-up">
            <h2>
              Your inbox deserves a <span>shield</span>
            </h2>
            <p>
              Join thousands of South Africans protected by Solid5 Shield. Free
              to start — connected in under a minute.
            </p>
            <div className="lp-final-cta-btns">
              <button
                onClick={onSignup}
                className="lp-btn-hero lp-btn-google"
                style={{ justifyContent: "center" }}
              >
                <GoogleSVG /> Connect Gmail — Free
              </button>
              <button
                onClick={onSignup}
                className="lp-btn-hero lp-btn-ms"
                style={{ justifyContent: "center" }}
              >
                <MicrosoftSVG /> Connect Outlook — Free
              </button>
            </div>
            <p className="lp-cta-note">
              No credit card · Read-only access · Cancel any time · POPIA
              compliant
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <a className="lp-nav-logo" href="/">
                <div
                  className="lp-nav-logo-icon"
                  style={{
                    width: 36,
                    height: 36,
                    background: "linear-gradient(135deg,#0a7c5c,#1d6fa4)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path
                      d="M12 2L4 6v7c0 4.5 3.5 7.5 8 9 4.5-1.5 8-4.5 8-9V6L12 2z"
                      fill="rgba(255,255,255,0.2)"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="lp-nav-logo-text">
                  Solid<span>5</span> Shield
                </div>
              </a>
              <p>
                AI-powered email fraud protection for South Africans. Detect
                phishing, spoofing, and brand impersonation before it costs you.
              </p>
            </div>
            <div className="lp-footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Pricing</a>
              <a href="#">Enterprise</a>
              <a href="#">Mobile App</a>
            </div>
            <div className="lp-footer-col">
              <h4>Company</h4>
              <a href="#">About Solid5</a>
              <a href="#">Blog</a>
              <a href="#">Security</a>
              <a href="#">Careers</a>
              <a href="mailto:hello@solid5.co.za">Contact</a>
            </div>
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">POPIA Notice</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span className="lp-footer-copy">
              © 2025 Solid5 (Pty) Ltd · solid5.co.za · All rights reserved
            </span>
            <div className="lp-footer-badges">
              {["POPIA", "GDPR", "SOC 2", "SSL"].map((b) => (
                <span key={b} className="lp-footer-badge">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
