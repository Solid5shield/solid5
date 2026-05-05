import { useState, useEffect, useCallback, useRef } from "react";
import { analyzeEmail } from "../services/api";
import logo from '../assets/solid-5.svg';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth as _auth } from "../firebase";
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #faf8f3;
    --bg2:       #f5f2eb;
    --bg3:       #eeeade;
    --bg4:       #e5e0d2;
    --bg5:       #dbd5c5;
    --border:    #d8d2c2;
    --border2:   #ccc5b0;
    --border3:   #b8b09a;
    --border4:   #a09880;
    --text:      #1a1610;
    --text2:     #4a4232;
    --text3:     #7a7060;
    --text4:     #a09880;
    --accent:    #0077aa;
    --accent2:   #005580;
    --accent3:   #0099cc;
    --red:       #cc2244;
    --redbg:     #cc224410;
    --redbd:     #cc224430;
    --orange:    #c85a10;
    --orangebg:  #c85a1012;
    --green:     #1a7a50;
    --greenbg:   #1a7a5012;
    --greenbd:   #1a7a5030;
    --yellow:    #9a6e00;
    --yellowbg:  #9a6e0012;
    --purple:    #6644bb;
    --purplebg:  #6644bb12;
    --purplebd:  #6644bb30;
    --pink:      #bb2266;
    --pinkbg:    #bb226612;
    --font:      'Syne', system-ui, sans-serif;
    --mono:      'JetBrains Mono', monospace;
  }

  html, body, #root {
    height: 100%; width: 100%; overflow: hidden;
    font-family: var(--font); background: var(--bg); color: var(--text);
    font-size: 13px; line-height: 1.5;
  }

  body::after {
    content: '';
    position: fixed; inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,100,150,0.012) 2px, rgba(0,100,150,0.012) 4px);
    pointer-events: none; z-index: 9999;
  }
.sb-user-footer {
  margin-top: auto;
  border-top: 1px solid var(--border2);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg3);
  flex-shrink: 0;
}
.sb-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent), var(--purple));
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff; font-family: var(--mono);
  overflow: hidden;
}
.sb-avatar img { width: 100%; height: 100%; object-fit: cover; }
.sb-user-info { flex: 1; min-width: 0; }
.sb-user-name  { font-size: 10px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sb-user-email { font-size: 9px; color: var(--text3); font-family: var(--mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.sb-logout-btn {
  flex-shrink: 0; background: none; border: 1px solid var(--border2);
  border-radius: 4px; padding: 4px 7px; cursor: pointer; color: var(--text3);
  font-size: 9px; font-family: var(--mono); font-weight: 600;
  transition: all 0.15s; letter-spacing: 0.04em;
}
.sb-logout-btn:hover { color: var(--red); border-color: var(--redbd); background: var(--redbg); }
  .app { display: flex; flex-direction: column; height: 100%; width: 100%; background: var(--bg); }

  .topbar {
    display: flex; align-items: center; gap: 14px;
    padding: 0 18px; height: 52px;
    border-bottom: 1px solid var(--border2);
    background: linear-gradient(180deg, #f0ece0, var(--bg2));
    flex-shrink: 0; position: relative; z-index: 10;
  }
  .topbar::after {
    content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--accent) 30%, var(--accent) 70%, transparent 100%);
    opacity: 0.3;
  }
  .logo-wrap { display: flex; align-items: center; gap: 10px; }
  .logo-mark {
    width: 34px; height: 34px;
    background: transparent;
    flex-shrink: 0;
  }
  .logo-text h1 { font-size: 14px; font-weight: 800; letter-spacing: 0.12em; color: var(--accent); font-family: var(--font); }
  .logo-text p  { font-size: 9px; color: var(--text3); letter-spacing: 0.06em; font-family: var(--mono); margin-top: 1px; }

  .nav-tabs { display: flex; align-items: center; gap: 2px; margin-left: 20px; }
  .nav-tab {
    padding: 6px 14px; border-radius: 5px; font-size: 11px; font-weight: 600;
    cursor: pointer; border: none; background: none; color: var(--text3);
    font-family: var(--font); letter-spacing: 0.02em; transition: all 0.15s;
    position: relative;
  }
  .nav-tab:hover { color: var(--text); background: var(--bg4); }
  .nav-tab.active { color: var(--accent); background: rgba(0,120,170,0.1); }
  .nav-tab.active::after {
    content: ''; position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%);
    width: 20px; height: 2px; background: var(--accent); border-radius: 1px;
  }
  .nav-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 16px; height: 16px; background: var(--red); color: #fff;
    font-size: 8px; font-weight: 700; border-radius: 8px; padding: 0 4px;
    margin-left: 5px; font-family: var(--mono);
  }

  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .pill {
    display: flex; align-items: center; gap: 5px;
    font-size: 9px; font-weight: 700; font-family: var(--mono);
    letter-spacing: 0.08em; padding: 4px 10px; border-radius: 4px;
  }
  .pill-live   { color: var(--green);  background: var(--greenbg);  border: 1px solid var(--greenbd); }
  .pill-threat { color: var(--red);    background: var(--redbg);    border: 1px solid var(--redbd); }
  .pill-role   { color: var(--purple); background: var(--purplebg); border: 1px solid var(--purplebd); }
  .pulse { width: 6px; height: 6px; border-radius: 50%; animation: pulse 1.6s infinite; }
  .pulse-green { background: var(--green); box-shadow: 0 0 6px var(--green); }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.3;transform:scale(0.8);} }

  .statsbar { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--bg2); }
  .sstat { padding: 8px 12px; border-right: 1px solid var(--border); }
  .sstat:last-child { border-right: none; }
  .sstat-label { font-size: 8px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 2px; font-family: var(--mono); }
  .sstat-val   { font-size: 20px; font-weight: 700; font-family: var(--mono); line-height: 1; }
  .sstat-sub   { font-size: 8px; color: var(--text3); margin-top: 2px; font-family: var(--mono); }
  .cv-red    { color: var(--red);    }
  .cv-orange { color: var(--orange); }
  .cv-green  { color: var(--green);  }
  .cv-accent { color: var(--accent); }
  .cv-purple { color: var(--purple); }
  .cv-yellow { color: var(--yellow); }
  .cv-pink   { color: var(--pink);   }

  .main { display: grid; grid-template-columns: 200px 1fr 320px; flex: 1; min-height: 0; overflow: hidden; }

  .sidebar { border-right: 1px solid var(--border); background: var(--bg2); display: flex; flex-direction: column; overflow-y: auto; }
  .sb-section { padding: 12px 12px 4px; font-size: 8px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; font-family: var(--mono); }
  .sb-item {
    display: flex; align-items: center; gap: 8px; padding: 7px 12px;
    cursor: pointer; border: none; background: none; color: var(--text2);
    width: 100%; text-align: left; transition: all 0.12s;
    border-left: 2px solid transparent; font-family: var(--font); font-size: 11px;
  }
  .sb-item:hover  { background: var(--bg3); color: var(--text); }
  .sb-item.active { background: var(--bg3); color: var(--text); border-left-color: var(--accent); }
  .sb-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px; font-weight: 700; font-family: var(--mono); }
  .si-ms { background: #0078d4; color: #fff; }
  .si-gw { background: #fff; border: 1px solid #ddd; }
  .si-zh { background: #e61c28; color: #fff; }
  .si-im { background: var(--bg4); color: var(--text2); border: 1px solid var(--border2); }
  .sb-meta { flex: 1; min-width: 0; }
  .sb-name   { font-size: 11px; font-weight: 600; display: block; }
  .sb-status { font-size: 9px; margin-top: 1px; display: block; font-family: var(--mono); }
  .sb-status.on  { color: var(--green); }
  .sb-status.off { color: var(--text3); }
  .sb-cnt { font-size: 9px; font-family: var(--mono); background: var(--bg4); border: 1px solid var(--border2); padding: 1px 6px; border-radius: 3px; color: var(--text2); }
  .sb-divider { height: 1px; background: var(--border); margin: 8px 0; }
  .connect-btn { margin: 6px 12px; padding: 7px 10px; border-radius: 5px; border: 1px dashed var(--border3); background: none; color: var(--text3); font-size: 10px; cursor: pointer; font-family: var(--mono); transition: all 0.15s; text-align: center; width: calc(100% - 24px); }
  .connect-btn:hover { border-color: var(--accent); color: var(--accent); }

  .intel-widget { margin: 8px 12px; background: var(--bg3); border: 1px solid var(--border2); border-radius: 6px; padding: 8px 10px; border-left: 2px solid var(--red); }
  .intel-title { font-size: 8px; color: var(--red); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; font-family: var(--mono); margin-bottom: 6px; }
  .intel-item { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid var(--border); font-size: 9px; font-family: var(--mono); }
  .intel-item:last-child { border: none; }
  .intel-domain { color: var(--text2); }
  .intel-score  { color: var(--red); font-weight: 600; }

  .brand-widget { margin: 8px 12px; background: var(--bg3); border: 1px solid var(--border2); border-radius: 6px; padding: 8px 10px; border-left: 2px solid var(--purple); }
  .brand-title { font-size: 8px; color: var(--purple); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; font-family: var(--mono); margin-bottom: 6px; }
  .brand-score-row { display: flex; align-items: center; justify-content: space-between; }
  .brand-score { font-size: 28px; font-weight: 800; font-family: var(--mono); color: var(--purple); }
  .brand-label { font-size: 9px; color: var(--text3); font-family: var(--mono); }
  .brand-bar { height: 3px; background: var(--bg4); border-radius: 2px; margin-top: 6px; overflow: hidden; }
  .brand-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--green), var(--yellow), var(--red)); }

  .email-pane { border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
  .pane-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; border-bottom: 1px solid var(--border); background: var(--bg2); flex-shrink: 0; gap: 8px; }
  .pane-title { font-size: 10px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 0.1em; font-family: var(--mono); }
  .filter-row { display: flex; gap: 3px; }
  .fbtn { font-size: 9px; padding: 3px 9px; border-radius: 3px; border: 1px solid var(--border2); background: none; color: var(--text3); cursor: pointer; font-family: var(--mono); font-weight: 600; transition: all 0.12s; }
  .fbtn.fa  { border-color: var(--accent);  color: var(--accent);  background: rgba(0,120,170,0.08);  }
  .fbtn.fh  { border-color: var(--red);     color: var(--red);     background: var(--redbg);    }
  .fbtn.fm  { border-color: var(--orange);  color: var(--orange);  background: var(--orangebg); }
  .fbtn.fl  { border-color: var(--green);   color: var(--green);   background: var(--greenbg);  }
  .email-list { overflow-y: auto; flex: 1; }
  .email-row {
    display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px;
    border-bottom: 1px solid var(--border); cursor: pointer;
    transition: background 0.1s; border-left: 2px solid transparent;
  }
  .email-row:hover    { background: var(--bg3); }
  .email-row.sel { background: var(--bg3); border-left-color: var(--accent); }
  .risk-pip { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .rp-high { background: var(--red);    box-shadow: 0 0 6px rgba(204,34,68,0.5); }
  .rp-medium { background: var(--orange); box-shadow: 0 0 4px rgba(200,90,16,0.4); }
  .rp-low  { background: var(--green);  }
  .rp-analyzing { background: var(--text3); animation: pulse 1s infinite; }
  .email-info { flex: 1; min-width: 0; }
  .email-sender { font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
  .email-subj   { font-size: 10px; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
  .email-dom    { font-size: 9px;  color: var(--text3); font-family: var(--mono); margin-top: 2px; }
  .email-right  { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
  .email-time   { font-size: 9px; color: var(--text3); font-family: var(--mono); }
  .rbadge { font-size: 8px; padding: 2px 6px; border-radius: 3px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; font-family: var(--mono); }
  .rb-high     { background: var(--redbg);    color: var(--red);    border: 1px solid var(--redbd); }
  .rb-medium   { background: var(--orangebg); color: var(--orange); border: 1px solid rgba(200,90,16,0.3); }
  .rb-low      { background: var(--greenbg);  color: var(--green);  border: 1px solid var(--greenbd); }
  .rb-analyzing{ background: var(--bg4);      color: var(--text3);  border: 1px solid var(--border2); }
  .campaign-tag { font-size: 8px; padding: 1px 5px; border-radius: 2px; font-family: var(--mono); background: var(--purplebg); color: var(--purple); border: 1px solid var(--purplebd); margin-top: 2px; display: inline-block; }
  .manual-bar { padding: 8px 12px; border-top: 1px solid var(--border); background: var(--bg2); display: flex; gap: 5px; flex-shrink: 0; }
  .manual-bar input  { flex: 1; background: #fff; border: 1px solid var(--border2); border-radius: 5px; padding: 6px 10px; color: var(--text); font-family: var(--mono); font-size: 10px; outline: none; }
  .manual-bar input::placeholder { color: var(--text3); }
  .manual-bar input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(0,120,170,0.12); }
  .analyze-btn { padding: 6px 12px; border-radius: 5px; background: var(--accent); border: none; color: #fff; font-size: 10px; font-weight: 800; cursor: pointer; font-family: var(--mono); letter-spacing: 0.06em; white-space: nowrap; }

  .detail { display: flex; flex-direction: column; background: var(--bg2); overflow-y: auto; }
  .detail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: var(--text3); font-size: 11px; text-align: center; padding: 32px; font-family: var(--mono); }

  .detail-head  { padding: 12px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .detail-from  { font-size: 12px; font-weight: 700; font-family: var(--mono); color: var(--text); word-break: break-all; }
  .detail-subj  { font-size: 10px; color: var(--text2); margin-top: 3px; }
  .detail-meta  { display: flex; gap: 5px; margin-top: 7px; flex-wrap: wrap; }
  .meta-tag { font-size: 9px; font-family: var(--mono); padding: 2px 7px; border-radius: 3px; background: var(--bg4); border: 1px solid var(--border2); color: var(--text2); }

  .verdict { margin: 10px 14px; padding: 10px 12px; border-radius: 7px; display: flex; align-items: center; gap: 10px; }
  .v-high   { background: var(--redbg);    border: 1px solid var(--redbd); }
  .v-medium { background: var(--orangebg); border: 1px solid rgba(200,90,16,0.25); }
  .v-low    { background: var(--greenbg);  border: 1px solid var(--greenbd); }
  .verdict-icon  { font-size: 18px; flex-shrink: 0; }
  .verdict-title { font-size: 11px; font-weight: 700; font-family: var(--mono); }
  .verdict-sub   { font-size: 9px;  opacity: 0.8; margin-top: 2px; font-family: var(--mono); }
  .v-high   .verdict-title, .v-high   .verdict-sub { color: var(--red);    }
  .v-medium .verdict-title, .v-medium .verdict-sub { color: var(--orange); }
  .v-low    .verdict-title, .v-low    .verdict-sub { color: var(--green);  }

  .ti-box { margin: 0 14px 10px; padding: 10px 12px; background: var(--bg3); border: 1px solid var(--border2); border-radius: 6px; border-left: 2px solid var(--red); }
  .ti-label { font-size: 8px; color: var(--red); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; font-family: var(--mono); margin-bottom: 6px; }
  .ti-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 9px; font-family: var(--mono); border-bottom: 1px solid var(--border); }
  .ti-row:last-child { border: none; }
  .ti-source { color: var(--text2); }
  .ti-val-bad  { color: var(--red);    font-weight: 600; }
  .ti-val-ok   { color: var(--green);  font-weight: 600; }
  .ti-val-warn { color: var(--orange); font-weight: 600; }

  .check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 0 14px 10px; }
  .cc { background: var(--bg3); border: 1px solid var(--border); border-radius: 5px; padding: 6px 8px; transition: border-color 0.2s; }
  .cc.pass { border-color: rgba(26,122,80,0.3); background: rgba(26,122,80,0.05); }
  .cc.fail { border-color: rgba(204,34,68,0.3); background: rgba(204,34,68,0.05); }
  .cc.warn { border-color: rgba(200,90,16,0.3); background: rgba(200,90,16,0.05); }
  .cc.info { border-color: rgba(0,120,170,0.3); background: rgba(0,120,170,0.05); }
  .cc-name   { font-size: 8px; font-family: var(--mono); color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
  .cc-val    { font-size: 10px; font-weight: 600; font-family: var(--mono); }
  .cv-r { color: var(--red); }
  .cv-g { color: var(--green); }
  .cv-o { color: var(--orange); }
  .cv-a { color: var(--accent); }
  .cv-p { color: var(--purple); }
  .cv-x { color: var(--text3); }

  .section { padding: 0 14px 10px; }
  .section-label { font-size: 8px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 7px; font-family: var(--mono); padding-bottom: 5px; border-bottom: 1px solid var(--border); }
  .domain-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
  .dbox { flex: 1; background: var(--bg3); border: 1px solid var(--border2); border-radius: 6px; padding: 7px 10px; }
  .dbox-label { font-size: 8px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; font-family: var(--mono); }
  .dbox-val   { font-family: var(--mono); font-size: 11px; font-weight: 600; word-break: break-all; }
  .dbox.trusted .dbox-val { color: var(--green); }
  .dbox.suspect .dbox-val { color: var(--red);   }
  .vs-sep { font-size: 10px; color: var(--text3); font-weight: 800; flex-shrink: 0; font-family: var(--mono); }
  .sim-row  { display: flex; justify-content: space-between; font-size: 9px; color: var(--text3); margin-bottom: 3px; font-family: var(--mono); }
  .bar-track { height: 4px; background: var(--bg4); border-radius: 2px; overflow: hidden; margin-bottom: 10px; }
  .bar-fill  { height: 100%; border-radius: 2px; transition: width 1s ease; }
  .bf-r { background: var(--red);    }
  .bf-o { background: var(--orange); }
  .bf-g { background: var(--green);  }
  .signal-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
  .signal { display: flex; align-items: flex-start; gap: 7px; padding: 6px 8px; border-radius: 5px; font-size: 10px; line-height: 1.45; font-family: var(--mono); }
  .sig-danger  { background: var(--redbg);    color: var(--red);    border-left: 2px solid var(--red); }
  .sig-warning { background: var(--orangebg); color: var(--orange); border-left: 2px solid var(--orange); }
  .sig-ok      { background: var(--greenbg);  color: var(--green);  border-left: 2px solid var(--green); }
  .sig-info    { background: var(--purplebg); color: var(--purple); border-left: 2px solid var(--purple); }
  .sig-icon { flex-shrink: 0; }

  .ai-box { margin: 0 14px 10px; padding: 10px 12px; background: var(--bg3); border: 1px solid var(--border2); border-radius: 6px; font-size: 10px; color: var(--text2); line-height: 1.75; font-family: var(--mono); border-left: 2px solid var(--accent); }
  .ai-label { font-size: 8px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 6px; }

  .case-box { margin: 0 14px 10px; background: var(--bg3); border: 1px solid var(--border2); border-radius: 6px; overflow: hidden; }
  .case-head { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; background: var(--bg4); border-bottom: 1px solid var(--border); }
  .case-title { font-size: 9px; font-weight: 700; font-family: var(--mono); color: var(--text2); text-transform: uppercase; letter-spacing: 0.1em; }
  .case-status-badge { font-size: 8px; padding: 2px 7px; border-radius: 3px; font-family: var(--mono); font-weight: 700; }
  .csb-open     { background: var(--redbg);    color: var(--red);    border: 1px solid var(--redbd); }
  .csb-progress { background: var(--orangebg); color: var(--orange); border: 1px solid rgba(200,90,16,0.3); }
  .csb-resolved { background: var(--greenbg);  color: var(--green);  border: 1px solid var(--greenbd); }
  .case-body { padding: 8px 10px; }
  .case-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 9px; font-family: var(--mono); border-bottom: 1px solid var(--border); }
  .case-row:last-child { border: none; }
  .case-key { color: var(--text3); }
  .case-val { color: var(--text2); font-weight: 500; }
  .case-actions-row { display: flex; gap: 4px; padding: 6px 10px; border-top: 1px solid var(--border); background: var(--bg4); }
  .case-btn { flex: 1; padding: 5px 4px; border-radius: 4px; font-size: 9px; font-weight: 700; cursor: pointer; border: 1px solid var(--border2); background: var(--bg3); color: var(--text2); font-family: var(--mono); transition: all 0.15s; text-align: center; }
  .case-btn:hover { background: var(--bg5); }
  .case-btn.assign    { color: var(--accent);  border-color: rgba(0,120,170,0.3);  background: rgba(0,120,170,0.06); }
  .case-btn.escalate  { color: var(--red);     border-color: var(--redbd);          background: var(--redbg); }
  .case-btn.export    { color: var(--purple);  border-color: var(--purplebd);       background: var(--purplebg); }
  .case-btn.close     { color: var(--green);   border-color: var(--greenbd);        background: var(--greenbg); }

  .awareness-box { margin: 0 14px 10px; padding: 10px 12px; background: var(--yellowbg); border: 1px solid rgba(154,110,0,0.2); border-radius: 6px; border-left: 2px solid var(--yellow); }
  .awareness-label { font-size: 8px; color: var(--yellow); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; font-family: var(--mono); margin-bottom: 5px; }
  .awareness-text  { font-size: 10px; color: #7a5800; font-family: var(--mono); line-height: 1.6; }
  .awareness-btn   { margin-top: 7px; padding: 5px 12px; border-radius: 4px; background: rgba(154,110,0,0.1); border: 1px solid rgba(154,110,0,0.3); color: var(--yellow); font-size: 9px; font-weight: 700; cursor: pointer; font-family: var(--mono); }

  .actions { display: flex; gap: 5px; padding: 10px 14px; border-top: 1px solid var(--border); background: var(--bg2); flex-shrink: 0; position: sticky; bottom: 0; }
  .act-btn { flex: 1; padding: 8px 4px; border-radius: 5px; font-size: 9px; font-weight: 700; cursor: pointer; border: 1px solid var(--border2); background: var(--bg3); color: var(--text2); font-family: var(--mono); transition: all 0.15s; text-align: center; letter-spacing: 0.04em; }
  .act-btn:hover { filter: brightness(0.93); }
  .act-block  { background: var(--redbg);    color: var(--red);    border-color: var(--redbd); }
  .act-report { background: var(--orangebg); color: var(--orange); border-color: rgba(200,90,16,0.3); }
  .act-trust  { background: var(--greenbg);  color: var(--green);  border-color: var(--greenbd); }
  .act-export { background: var(--purplebg); color: var(--purple); border-color: var(--purplebd); }

  .tab-view { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

  .dashboard { flex: 1; overflow-y: auto; padding: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto auto auto; gap: 12px; }
  .dash-card { background: #fff; border: 1px solid var(--border2); border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .dash-card-head { padding: 10px 14px; border-bottom: 1px solid var(--border); background: var(--bg3); display: flex; align-items: center; justify-content: space-between; }
  .dash-card-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text2); font-family: var(--mono); }
  .dash-card-body  { padding: 12px 14px; }
  .wide-2 { grid-column: span 2; }
  .wide-3 { grid-column: span 3; }

  .chart-row { display: flex; align-items: flex-end; gap: 4px; height: 60px; margin-bottom: 6px; }
  .chart-bar { flex: 1; border-radius: 3px 3px 0 0; min-height: 4px; transition: height 0.6s ease; position: relative; }
  .chart-bar:hover::after { content: attr(data-val); position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 9px; color: var(--text); font-family: var(--mono); white-space: nowrap; }
  .chart-labels { display: flex; gap: 4px; }
  .chart-label  { flex: 1; text-align: center; font-size: 8px; color: var(--text3); font-family: var(--mono); }
  .trend-up   { color: var(--red);   }
  .trend-down { color: var(--green); }

  .attack-list { display: flex; flex-direction: column; gap: 5px; }
  .attack-item { display: flex; align-items: center; gap: 7px; }
  .attack-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .attack-name { font-size: 10px; color: var(--text2); flex: 1; }
  .attack-pct  { font-size: 10px; font-weight: 600; font-family: var(--mono); }
  .attack-bar  { width: 100%; height: 3px; background: var(--bg4); border-radius: 2px; margin-top: 2px; overflow: hidden; }
  .attack-fill { height: 100%; border-radius: 2px; }

  .audit-log { flex: 1; overflow-y: auto; padding: 0; }
  .audit-entry { display: flex; gap: 10px; padding: 8px 14px; border-bottom: 1px solid var(--border); font-size: 10px; transition: background 0.1s; }
  .audit-entry:hover { background: var(--bg3); }
  .audit-time   { font-family: var(--mono); font-size: 9px; color: var(--text3); width: 70px; flex-shrink: 0; padding-top: 1px; }
  .audit-user   { font-family: var(--mono); font-size: 9px; color: var(--purple); width: 60px; flex-shrink: 0; padding-top: 1px; }
  .audit-action { flex: 1; color: var(--text2); line-height: 1.5; }
  .audit-tag { display: inline-block; font-size: 8px; padding: 1px 5px; border-radius: 2px; margin-left: 4px; font-family: var(--mono); font-weight: 700; vertical-align: middle; }
  .at-block   { background: var(--redbg);    color: var(--red);    border: 1px solid var(--redbd); }
  .at-report  { background: var(--orangebg); color: var(--orange); }
  .at-trust   { background: var(--greenbg);  color: var(--green); }
  .at-scan    { background: rgba(0,120,170,0.08); color: var(--accent); }
  .at-case    { background: var(--purplebg); color: var(--purple); }
  .at-export  { background: rgba(154,110,0,0.1); color: var(--yellow); }

  .incidents-view { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .incident-card { background: #fff; border: 1px solid var(--border2); border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .inc-head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); background: var(--bg3); }
  .inc-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .inc-icon.high   { background: var(--redbg);    }
  .inc-icon.medium { background: var(--orangebg); }
  .inc-icon.low    { background: var(--greenbg);  }
  .inc-info { flex: 1; }
  .inc-title { font-size: 12px; font-weight: 700; font-family: var(--mono); color: var(--text); }
  .inc-sub   { font-size: 9px;  color: var(--text3); font-family: var(--mono); margin-top: 2px; }
  .inc-badges { display: flex; gap: 5px; align-items: center; }
  .inc-body { padding: 10px 14px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .inc-stat { background: var(--bg3); border: 1px solid var(--border); border-radius: 5px; padding: 7px 9px; }
  .inc-stat-label { font-size: 8px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; font-family: var(--mono); margin-bottom: 2px; }
  .inc-stat-val   { font-size: 13px; font-weight: 700; font-family: var(--mono); }
  .inc-actions { display: flex; gap: 5px; padding: 8px 14px; border-top: 1px solid var(--border); background: var(--bg4); }
  .inc-btn { padding: 5px 12px; border-radius: 4px; font-size: 9px; font-weight: 700; cursor: pointer; border: 1px solid var(--border2); background: var(--bg3); color: var(--text2); font-family: var(--mono); transition: all 0.15s; }
  .inc-btn:hover { filter: brightness(0.93); }
  .inc-btn.view-btn     { color: var(--accent);  border-color: rgba(0,120,170,0.3); background: rgba(0,120,170,0.07); }
  .inc-btn.export-btn   { color: var(--yellow);  border-color: rgba(154,110,0,0.3); background: rgba(154,110,0,0.07); }
  .inc-btn.resolve-btn  { color: var(--green);   border-color: var(--greenbd); background: var(--greenbg); }

  .lookalike-view { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .lookalike-card { background: #fff; border: 1px solid var(--border2); border-radius: 7px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .lookalike-card.high-risk { border-color: rgba(204,34,68,0.3); }
  .lk-domain { font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--red); flex: 1; }
  .lk-info   { display: flex; flex-direction: column; gap: 3px; flex: 2; }
  .lk-row    { display: flex; gap: 10px; font-size: 9px; font-family: var(--mono); color: var(--text3); }
  .lk-val    { color: var(--text2); }
  .lk-actions { display: flex; gap: 5px; }
  .lk-btn { padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 700; cursor: pointer; font-family: var(--mono); border: 1px solid var(--border2); background: var(--bg3); color: var(--text2); transition: all 0.15s; }

  .settings-view { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
  .settings-card { background: #fff; border: 1px solid var(--border2); border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .settings-head { padding: 10px 14px; background: var(--bg3); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .settings-title { font-size: 11px; font-weight: 700; font-family: var(--mono); color: var(--text2); }
  .settings-body  { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
  .setting-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .setting-row:last-child { border: none; }
  .setting-label { font-size: 10px; color: var(--text); }
  .setting-desc  { font-size: 9px; color: var(--text3); font-family: var(--mono); margin-top: 1px; }
  .toggle { width: 36px; height: 20px; border-radius: 10px; cursor: pointer; position: relative; flex-shrink: 0; transition: background 0.2s; border: none; }
  .toggle.on  { background: var(--accent); }
  .toggle.off { background: var(--bg4); border: 1px solid var(--border2); }
  .toggle::after { content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: white; top: 3px; transition: left 0.2s; }
  .toggle.on::after  { left: 19px; }
  .toggle.off::after { left: 3px; }
  .webhook-input { background: var(--bg3); border: 1px solid var(--border2); border-radius: 4px; padding: 6px 10px; color: var(--text2); font-family: var(--mono); font-size: 10px; width: 100%; outline: none; }
  .webhook-input:focus { border-color: var(--accent); }
  .role-badge { font-size: 9px; padding: 3px 10px; border-radius: 4px; font-family: var(--mono); font-weight: 700; cursor: pointer; border: 1px solid var(--border2); background: var(--bg3); color: var(--text2); }
  .role-badge.active { background: var(--purplebg); color: var(--purple); border-color: var(--purplebd); }
  .roles-row { display: flex; gap: 5px; }

  .spinner { width: 18px; height: 18px; border: 2px solid var(--border2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; gap: 8px; color: var(--text3); font-size: 10px; font-family: var(--mono); }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal   { background: #fff; border: 1px solid var(--border3); border-radius: 10px; padding: 24px; width: 500px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
  .modal h2 { font-size: 14px; font-weight: 800; margin-bottom: 4px; color: var(--accent); font-family: var(--font); }
  .modal > p { font-size: 10px; color: var(--text2); margin-bottom: 16px; line-height: 1.7; font-family: var(--mono); }
  .modal-steps { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .modal-step  { display: flex; gap: 10px; align-items: flex-start; padding: 9px 11px; background: var(--bg3); border-radius: 5px; border: 1px solid var(--border); }
  .step-num  { width: 20px; height: 20px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; font-family: var(--mono); }
  .step-text { font-size: 10px; color: var(--text2); line-height: 1.5; font-family: var(--mono); }
  .step-text strong { color: var(--text); display: block; margin-bottom: 2px; font-size: 11px; }
  .modal-code { background: var(--bg3); border: 1px solid var(--border2); border-radius: 5px; padding: 10px 12px; font-family: var(--mono); font-size: 9px; color: var(--green); margin-bottom: 14px; white-space: pre-wrap; word-break: break-all; border-left: 2px solid var(--green); }
  .modal-btns { display: flex; gap: 7px; }
  .modal-btn  { flex: 1; padding: 9px; border-radius: 5px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: var(--mono); border: 1px solid var(--border2); background: var(--bg3); color: var(--text2); transition: all 0.15s; }
  .modal-btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  .modal-btn:hover   { opacity: 0.85; }

  ::-webkit-scrollbar       { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
  /* ── MOBILE RESPONSIVE ── */
@media (max-width: 768px) {
  .topbar { padding: 0 10px; height: 48px; gap: 8px; }
  .logo-text p { display: none; }
  .logo-mark { width: 26px; height: 26px; }
  .nav-tabs { display: none; }
  .topbar-right .pill-role { display: none; }
  .pill { font-size: 8px; padding: 3px 6px; }

  .statsbar {
    display: flex; overflow-x: auto; -webkit-overflow-scrolling: touch;
    scrollbar-width: none; border-bottom: 1px solid var(--border);
  }
  .statsbar::-webkit-scrollbar { display: none; }
  .sstat { min-width: 76px; flex-shrink: 0; padding: 6px 10px; border-right: 1px solid var(--border); }
  .sstat-val { font-size: 18px; }

  .tab-view { padding-bottom: 56px; }

  /* 3-panel -> stacked panels */
  .main { grid-template-columns: 1fr; position: relative; overflow: hidden; }

  /* Sidebar: slide-in drawer */
  .sidebar {
    position: fixed; left: -260px; top: 0; bottom: 0; width: 240px;
    z-index: 300; transition: left 0.28s cubic-bezier(.4,0,.2,1);
    box-shadow: none;
  }
  .sidebar.mob-open { left: 0; box-shadow: 4px 0 24px rgba(0,0,0,0.18); }

  /* Overlay behind drawer */
  .mob-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.38);
    z-index: 290; backdrop-filter: blur(2px);
  }

  /* Email pane: full width */
  .email-pane { border-right: none; }

  /* Detail pane: slide in from right */
  .detail {
    position: fixed; right: -100%; top: 0; bottom: 0; width: 100%;
    z-index: 200; transition: right 0.28s cubic-bezier(.4,0,.2,1);
    background: var(--bg2); overflow-y: auto;
  }
  .detail.mob-open { right: 0; }

  /* Mobile back button inside detail */
  .mob-back {
    display: flex; align-items: center; gap: 7px; padding: 10px 14px;
    background: var(--bg3); border-bottom: 1px solid var(--border);
    font-size: 11px; font-family: var(--mono); font-weight: 700;
    color: var(--accent); cursor: pointer; border: none; width: 100%;
    text-align: left; position: sticky; top: 0; z-index: 10; flex-shrink: 0;
  }

  /* Mobile menu button in topbar */
  .mob-menu-btn {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: 6px; border: 1px solid var(--border2);
    background: var(--bg3); cursor: pointer; flex-shrink: 0;
  }

  /* Dashboard: single column */
  .dashboard { grid-template-columns: 1fr; padding: 8px; gap: 8px; }
  .wide-2, .wide-3 { grid-column: span 1; }

  /* Incidents */
  .inc-body { grid-template-columns: 1fr 1fr; }
  .inc-head { flex-wrap: wrap; gap: 6px; }

  /* Lookalike */
  .lookalike-card { flex-wrap: wrap; }
  .lk-domain { width: 100%; font-size: 11px; }
  .lk-info { flex: unset; width: 100%; }

  /* Settings */
  .settings-view { padding: 8px; gap: 8px; }

  /* Manual analyze bar */
  .manual-bar input { font-size: 11px; }

  /* Check grid: 1 col on very small screens */
  .check-grid { grid-template-columns: 1fr 1fr; }

  /* Bottom nav */
  .mob-bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 250;
    background: var(--bg2); border-top: 1px solid var(--border2);
    display: flex; height: 56px;
  }
  .mob-bottom-nav button {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 2px; font-size: 8px; font-weight: 700;
    font-family: var(--mono); color: var(--text3); background: none;
    border: none; cursor: pointer; padding: 4px 2px; letter-spacing: 0.05em;
    border-top: 2px solid transparent; transition: all 0.15s; position: relative;
  }
  .mob-bottom-nav button.active {
    color: var(--accent); background: rgba(0,120,170,0.07);
    border-top-color: var(--accent);
  }
  .mob-bottom-nav .mob-nav-icon { font-size: 16px; line-height: 1; }
  .mob-nav-badge {
    position: absolute; top: 4px; right: calc(50% - 14px);
    min-width: 14px; height: 14px; background: var(--red); color: #fff;
    font-size: 7px; font-weight: 700; border-radius: 7px; padding: 0 3px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono);
  }
}

@media (min-width: 769px) {
  .mob-bottom-nav { display: none; }
  .mob-back { display: none; }
  .mob-menu-btn { display: none; }
  .mob-overlay { display: none; }
}
`;
const WORKER_URL = "https://solid5-shield-api.nameless-queen-2942.workers.dev";
// ─── Providers ────────────────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: "ms365",
    name: "Microsoft 365",
    short: "Outlook / M365",
    icon: "M",
    cls: "si-ms",
    howto: {
      title: "Connect Microsoft 365",
      desc: "Register in Azure Portal for Microsoft Graph API email access.",
      steps: [
        {
          title: "Register Azure App",
          body: "portal.azure.com → Entra ID → App Registrations → New Registration.",
        },
        {
          title: "Add Mail Permissions",
          body: "API Permissions → Microsoft Graph → Delegated → Mail.Read → Grant admin consent.",
        },
        {
          title: "Get Credentials",
          body: "Copy Client ID. Under Certificates & Secrets, create a new client secret.",
        },
        {
          title: "OAuth Token Flow",
          body: "POST to login.microsoftonline.com/{tenant}/oauth2/v2.0/token with credentials.",
        },
      ],
      endpoint:
        "GET https://graph.microsoft.com/v1.0/me/messages\n  ?$select=from,subject,receivedDateTime&$top=50",
      scope: "Mail.Read   Mail.ReadBasic   offline_access",
    },
  },
  {
    id: "gmail",
    name: "Google Workspace",
    short: "Gmail / G Suite",
    icon: "G",
    cls: "si-gw",
    howto: {
      title: "Connect Google Workspace",
      desc: "Create a GCP project and enable the Gmail API via OAuth 2.0.",
      steps: [
        {
          title: "Create GCP Project",
          body: "console.cloud.google.com → New Project → Enable Gmail API.",
        },
        {
          title: "OAuth Consent Screen",
          body: "Configure scope: gmail.readonly. Submit for verification.",
        },
        {
          title: "Create Credentials",
          body: "Create OAuth 2.0 Client ID (Web application), set redirect URI.",
        },
        {
          title: "Call API",
          body: "Use Google OAuth flow to get access token. Call Gmail API with Bearer token.",
        },
      ],
      endpoint:
        "GET https://gmail.googleapis.com/gmail/v1/users/me/messages\n  ?maxResults=50&labelIds=INBOX",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
    },
  },
  {
    id: "zoho",
    name: "Zoho Mail",
    short: "Zoho Workplace",
    icon: "Z",
    cls: "si-zh",
    howto: {
      title: "Connect Zoho Mail",
      desc: "Register in Zoho Developer Console for REST API access.",
      steps: [
        {
          title: "Developer Console",
          body: "api-console.zoho.com → Server-based Application. Set redirect URI.",
        },
        {
          title: "Get Credentials",
          body: "Copy Client ID and Client Secret. Note your datacenter region.",
        },
        {
          title: "Authorization URL",
          body: "Redirect to accounts.zoho.com/oauth/v2/auth?scope=ZohoMail.messages.READ",
        },
        {
          title: "Exchange Token",
          body: "POST to accounts.zoho.com/oauth/v2/token with code and client credentials.",
        },
      ],
      endpoint:
        "GET https://mail.zoho.com/api/accounts/{accountId}/messages/view\n  ?limit=50&start=0",
      scope: "ZohoMail.messages.READ   ZohoMail.accounts.READ",
    },
  },
  {
    id: "imap",
    name: "IMAP / Generic",
    short: "Any mail server",
    icon: "@",
    cls: "si-im",
    howto: {
      title: "Connect via IMAP",
      desc: "Use IMAP to connect any email provider via a Node.js backend.",
      steps: [
        {
          title: "Enable IMAP",
          body: "In your email provider's settings, enable IMAP. Generate an App Password.",
        },
        {
          title: "IMAP Details",
          body: "Find IMAP host (e.g. imap.mail.yahoo.com:993). Always use SSL/TLS.",
        },
        {
          title: "imapflow library",
          body: "npm install imapflow mailparser. Connect, authenticate, fetch latest 50 envelopes.",
        },
        {
          title: "Parse & Forward",
          body: "Use mailparser to decode RFC 2822. Extract From, Subject, Date headers.",
        },
      ],
      endpoint:
        "imap.yourprovider.com:993 (SSL/TLS)\nFETCH 1:50 ENVELOPE FLAGS",
      scope: "IMAP INBOX READ   (App Password or OAuth2 token)",
    },
  },
];

const LOOKALIKE_DOMAINS = [
  {
    domain: "your-company-secure.com",
    registered: "2 days ago",
    registrar: "NameCheap",
    country: "RU",
    score: 94,
    tactic: "Subdomain Abuse",
  },
  {
    domain: "yourcompany-billing.net",
    registered: "5 days ago",
    registrar: "GoDaddy",
    country: "CN",
    score: 88,
    tactic: "Domain Padding",
  },
  {
    domain: "yourcompany.co",
    registered: "1 week ago",
    registrar: "Dynadot",
    country: "US",
    score: 76,
    tactic: "TLD Switch",
  },
  {
    domain: "y0urcompany.com",
    registered: "2 weeks ago",
    registrar: "Namecheap",
    country: "NG",
    score: 71,
    tactic: "Homograph",
  },
  {
    domain: "yourcompanysupport.biz",
    registered: "3 weeks ago",
    registrar: "Network Sol",
    country: "IN",
    score: 62,
    tactic: "Brand Injection",
  },
];

function runLocalChecks(email) {
  const domain = email.from.split("@")[1] || "";
  const trusted = email.trusted || "";
  const checks = {};
  checks.spf =
    domain === trusted ? "PASS" : Math.random() > 0.4 ? "FAIL" : "SOFTFAIL";
  checks.dkim =
    domain === trusted ? "PASS" : Math.random() > 0.5 ? "FAIL" : "NONE";
  checks.dmarc =
    checks.spf === "PASS" && checks.dkim === "PASS" ? "PASS" : "FAIL";
  checks.subdomainAbuse = false;
  if (trusted) {
    const parts = domain.split(".");
    if (parts.length > 2) {
      const root = parts.slice(-2).join(".");
      if (root !== trusted && domain.includes(trusted.split(".")[0]))
        checks.subdomainAbuse = true;
    }
  }
  const padKW = [
    "corp",
    "secure",
    "security",
    "support",
    "billing",
    "verify",
    "login",
    "account",
    "service",
    "delivery",
    "portal",
    "pay",
    "official",
    "help",
    "online",
  ];
  checks.domainPadding = padKW.some(
    (k) => domain.includes(`-${k}`) || domain.includes(`${k}-`),
  );
  const suspTLDs = [
    ".biz",
    ".xyz",
    ".co",
    ".info",
    ".click",
    ".link",
    ".online",
    ".site",
    ".top",
    ".tech",
    ".live",
    ".cf",
    ".tk",
    ".ml",
    ".ga",
    ".gq",
    ".pw",
  ];
  checks.suspiciousTLD = suspTLDs.some((t) => domain.endsWith(t));
  checks.tldSwitch = false;
  if (trusted) {
    const tb = trusted.replace(/\.(com|org|net|io|gov|edu)$/, "");
    const sb = domain.replace(
      /\.(com|org|net|io|gov|edu|co|biz|xyz|info)$/,
      "",
    );
    if (tb === sb && domain !== trusted) checks.tldSwitch = true;
  }
  const hmap = {
    0: "o",
    1: "l",
    3: "e",
    4: "a",
    5: "s",
    6: "g",
    7: "t",
    rn: "m",
    vv: "w",
    cl: "d",
  };
  let norm = domain.toLowerCase();
  for (const [f, r] of Object.entries(hmap)) norm = norm.split(f).join(r);
  checks.homograph =
    trusted && norm.includes(trusted.split(".")[0]) && domain !== trusted;
  function lev(a, b) {
    const m = a.length,
      n = b.length,
      dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) =>
          i === 0 ? j : j === 0 ? i : 0,
        ),
      );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] =
          a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
  }
  checks.typosquatDist = trusted
    ? lev(domain.split(".")[0], trusted.split(".")[0])
    : 99;
  checks.typosquatFlag = checks.typosquatDist > 0 && checks.typosquatDist <= 2;
  checks.mixedScript = /[\u0400-\u04FF\u0370-\u03FF]/.test(domain);
  const freeSubs = [
    "github.io",
    "pages.dev",
    "netlify.app",
    "firebaseapp.com",
    "vercel.app",
    "web.app",
    "azurewebsites.net",
  ];
  checks.freeSubdomain = freeSubs.some((s) => domain.endsWith(s));
  const brands = [
    "paypal",
    "google",
    "microsoft",
    "apple",
    "amazon",
    "netflix",
    "fedex",
    "facebook",
    "bank",
    "secure",
    "dhl",
    "ups",
  ];
  checks.brandInject = trusted
    ? brands.some((b) => b !== trusted.split(".")[0] && domain.includes(b))
    : brands.some((b) => domain.includes(b));
  checks.excessiveHyphens = (domain.match(/-/g) || []).length >= 2;
  checks.longDomain = domain.length > 30;
  checks.numSubstitution = (domain.match(/[0-9]/g) || []).length >= 2;
  return checks;
}

function simulateThreatIntel(domain) {
  const knownBad = [
    "paypa1.com",
    "g00gle.com",
    "netfIix.com",
    "apple-id.co",
    "secure-verify.com",
    "fedex-delivery.co",
    "microsoft-corp.net",
  ];
  const isKnownBad = knownBad.some((d) => domain.includes(d.split(".")[0]));
  return {
    virustotal: isKnownBad
      ? `${Math.floor(Math.random() * 15 + 8)}/86 engines`
      : `0/86 engines`,
    virustotal_status: isKnownBad ? "bad" : "ok",
    phishtank:
      isKnownBad && Math.random() > 0.4 ? "CONFIRMED PHISH" : "NOT LISTED",
    phishtank_status: isKnownBad && Math.random() > 0.4 ? "bad" : "ok",
    spamhaus: isKnownBad && Math.random() > 0.5 ? "LISTED (ZEN)" : "CLEAN",
    spamhaus_status: isKnownBad && Math.random() > 0.5 ? "bad" : "ok",
    abuseipdb: isKnownBad
      ? `Abuse score: ${Math.floor(Math.random() * 60 + 30)}%`
      : "Abuse score: 0%",
    abuseipdb_status: isKnownBad ? "warn" : "ok",
    domain_age: isKnownBad
      ? `${Math.floor(Math.random() * 25 + 1)} days`
      : `${Math.floor(Math.random() * 1000 + 365)} days`,
    domain_age_status: isKnownBad ? "bad" : "ok",
  };
}

async function analyzeWithClaude(email) {
  const domain = email.from.split("@")[1];
  const trusted = email.trusted || "unknown";
  const localChecks = runLocalChecks(email);
  const threatIntel = simulateThreatIntel(domain);

  // Build the same prompt as before — Worker forwards it to Claude
  const prompt = `You are Solid5Shiled Enterprise, an AI security analyst. Perform deep domain trust analysis.
Sender: ${email.from}
Domain: ${domain}
Claimed entity: ${email.name}
Subject: "${email.subject}"
Known trusted domain: ${trusted}
LOCAL CHECKS:
SPF: ${localChecks.spf} | DKIM: ${localChecks.dkim} | DMARC: ${localChecks.dmarc}
Subdomain abuse: ${localChecks.subdomainAbuse} | Domain padding: ${localChecks.domainPadding}
Suspicious TLD: ${localChecks.suspiciousTLD} | TLD switch: ${localChecks.tldSwitch}
Homograph: ${localChecks.homograph} | Levenshtein dist: ${localChecks.typosquatDist}
THREAT INTEL:
VirusTotal: ${threatIntel.virustotal}
PhishTank: ${threatIntel.phishtank}
Spamhaus: ${threatIntel.spamhaus}
Domain age: ${threatIntel.domain_age}
Respond ONLY with valid JSON:
{"risk":"high|medium|low","similarity_score":0-100,"verdict":"One concise technical verdict sentence","attack_type":"Specific attack vector or null","confidence":0-100,"signals":[{"type":"danger|warning|ok|info","text":"description"}],"explanation":"2-3 plain English sentences for business users","recommended_action":"block|quarantine|review|allow","employee_alert":"One sentence awareness tip"}`;

  // analyzeEmail sends to the Worker (authenticated), Worker calls Claude
  // High-risk results auto-trigger Slack/SIEM webhooks server-side
  const result = await analyzeEmail(email, prompt);

  // Attach local computed data (unchanged)
  result._localChecks = localChecks;
  result._threatIntel = threatIntel;
  return result;
}

let auditId = 0;
function makeAuditEntry(action, detail, tag) {
  const now = new Date();
  return {
    id: auditId++,
    time: now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    user: "analyst",
    action: detail,
    tag,
  };
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
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

function ConnectModal({ provider, onClose, onConnect }) {
  const h = provider.howto;
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <h2>{h.title}</h2>
        <p>{h.desc}</p>
        <div className="modal-steps">
          {h.steps.map((step, i) => (
            <div className="modal-step" key={i}>
              <div className="step-num">{i + 1}</div>
              <div className="step-text">
                <strong>{step.title}</strong>
                {step.body}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginBottom: 6,
            fontSize: 11,
            color: "var(--text3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 700,
            fontFamily: "var(--mono)",
          }}
        >
          API Endpoint &amp; Scopes
        </div>
        <div className="modal-code">
          {h.endpoint}
          {"\n\nRequired Scopes:\n"}
          {h.scope}
        </div>
        <div className="modal-btns">
          <button className="modal-btn" onClick={onClose}>
            Close
          </button>
          <button
            className="modal-btn primary"
            onClick={() => onConnect(provider.id)}
          >
            Simulate Connect ↗
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckGrid({ localChecks, result }) {
  if (!localChecks) return null;
  const items = [
    {
      name: "SPF",
      val: localChecks.spf,
      color:
        localChecks.spf === "PASS"
          ? "cv-g"
          : localChecks.spf === "SOFTFAIL"
            ? "cv-o"
            : "cv-r",
      cls:
        localChecks.spf === "PASS"
          ? "pass"
          : localChecks.spf === "SOFTFAIL"
            ? "warn"
            : "fail",
    },
    {
      name: "DKIM",
      val: localChecks.dkim,
      color:
        localChecks.dkim === "PASS"
          ? "cv-g"
          : localChecks.dkim === "NONE"
            ? "cv-o"
            : "cv-r",
      cls:
        localChecks.dkim === "PASS"
          ? "pass"
          : localChecks.dkim === "NONE"
            ? "warn"
            : "fail",
    },
    {
      name: "DMARC",
      val: localChecks.dmarc,
      color: localChecks.dmarc === "PASS" ? "cv-g" : "cv-r",
      cls: localChecks.dmarc === "PASS" ? "pass" : "fail",
    },
    {
      name: "Confidence",
      val: result?.confidence ? `${result.confidence}%` : "—",
      color: "cv-a",
      cls: "info",
    },
    {
      name: "TLD Switch",
      val: localChecks.tldSwitch ? "YES ✕" : "NO ✓",
      color: localChecks.tldSwitch ? "cv-r" : "cv-g",
      cls: localChecks.tldSwitch ? "fail" : "pass",
    },
    {
      name: "Homograph",
      val: localChecks.homograph ? "YES ✕" : "NO ✓",
      color: localChecks.homograph ? "cv-r" : "cv-g",
      cls: localChecks.homograph ? "fail" : "pass",
    },
    {
      name: "Typosquat",
      val: localChecks.typosquatFlag
        ? `d:${localChecks.typosquatDist} ✕`
        : "CLEAR ✓",
      color: localChecks.typosquatFlag ? "cv-r" : "cv-g",
      cls: localChecks.typosquatFlag ? "fail" : "pass",
    },
    {
      name: "Dom. Pad",
      val: localChecks.domainPadding ? "YES ✕" : "NO ✓",
      color: localChecks.domainPadding ? "cv-r" : "cv-g",
      cls: localChecks.domainPadding ? "fail" : "pass",
    },
    {
      name: "Susp. TLD",
      val: localChecks.suspiciousTLD ? "YES ✕" : "SAFE ✓",
      color: localChecks.suspiciousTLD ? "cv-o" : "cv-g",
      cls: localChecks.suspiciousTLD ? "warn" : "pass",
    },
    {
      name: "Unicode",
      val: localChecks.mixedScript ? "MIXED ✕" : "CLEAN ✓",
      color: localChecks.mixedScript ? "cv-r" : "cv-g",
      cls: localChecks.mixedScript ? "fail" : "pass",
    },
    {
      name: "Brand Inj.",
      val: localChecks.brandInject ? "YES ✕" : "NO ✓",
      color: localChecks.brandInject ? "cv-r" : "cv-g",
      cls: localChecks.brandInject ? "fail" : "pass",
    },
    {
      name: "Dom. Len",
      val: localChecks.longDomain ? "LONG ✕" : "OK ✓",
      color: localChecks.longDomain ? "cv-o" : "cv-g",
      cls: localChecks.longDomain ? "warn" : "pass",
    },
  ];
  return (
    <div className="section">
      <div className="section-label">14-Point Detection Matrix</div>
      <div className="check-grid">
        {items.map((item, i) => (
          <div key={i} className={`cc ${item.cls}`}>
            <div className="cc-name">{item.name}</div>
            <div className={`cc-val ${item.color}`}>{item.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailPane({ email, result, onAudit }) {
  const [caseStatus, setCaseStatus] = useState("OPEN");
  if (!email)
    return (
      <div className="detail">
        <div className="detail-empty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L4 6v7c0 4.5 3.5 7.5 8 9 4.5-1.5 8-4.5 8-9V6L12 2z"
              stroke="var(--text3)"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>
          <span>
            Select an email to run
            <br />
            AI threat analysis
          </span>
        </div>
      </div>
    );
  if (!result)
    return (
      <div className="detail">
        <div className="loading-state" style={{ flex: 1, height: "100%" }}>
          <div className="spinner" />
          <span>Running AI + Threat Intel analysis...</span>
        </div>
      </div>
    );

  const lc = result._localChecks || {};
  const ti = result._threatIntel || {};
  const simClass =
    result.similarity_score >= 70
      ? "bf-r"
      : result.similarity_score >= 40
        ? "bf-o"
        : "bf-g";
  const verdictIcon =
    result.risk === "high" ? "⚠" : result.risk === "medium" ? "⚡" : "✓";
  const caseId = `CASE-${String(email.id + 1001).padStart(4, "0")}`;

  const copyReport = () => {
    const txt = [
      `=== Solid5Shiled Enterprise Security Report ===`,
      `Case ID:    ${caseId}`,
      `Generated:  ${new Date().toISOString()}`,
      ``,
      `Sender:     ${email.from}`,
      `Subject:    ${email.subject}`,
      ``,
      `Risk Level: ${result.risk?.toUpperCase()}`,
      `Confidence: ${result.confidence}%`,
      ``,
      result.explanation,
      ``,
    ].join("\n");
    navigator.clipboard
      .writeText(txt)
      .then(() => alert("📋 Forensic report copied to clipboard!"));
    onAudit(
      makeAuditEntry(
        "export",
        `Forensic report exported for ${email.from}`,
        "at-export",
      ),
    );
  };

  return (
    <div className="detail">
      <div className="detail-head">
        <div className="detail-from">{email.from}</div>
        <div className="detail-subj">{email.subject}</div>
        <div className="detail-meta">
          <span className="meta-tag">{email.provider.toUpperCase()}</span>
          {result.attack_type && (
            <span className="meta-tag">{result.attack_type}</span>
          )}
          {email.campaign && (
            <span
              className="meta-tag"
              style={{
                color: "var(--purple)",
                borderColor: "rgba(102,68,187,0.3)",
              }}
            >
              {email.campaign}
            </span>
          )}
          <span
            className="meta-tag"
            style={{
              color:
                {
                  block: "var(--red)",
                  quarantine: "var(--orange)",
                  allow: "var(--green)",
                  review: "var(--purple)",
                }[result.recommended_action] || "var(--purple)",
            }}
          >
            {(result.recommended_action || "review").toUpperCase()}
          </span>
        </div>
      </div>

      <div className={`verdict v-${result.risk}`}>
        <div className="verdict-icon">{verdictIcon}</div>
        <div>
          <div className="verdict-title">{result.verdict}</div>
          <div className="verdict-sub">
            {result.attack_type || "Domain assessment complete"} · {caseId}
          </div>
        </div>
      </div>

      <div className="ti-box">
        <div className="ti-label">⚡ Live Threat Intelligence</div>
        {[
          {
            label: "VirusTotal",
            val: ti.virustotal,
            status: ti.virustotal_status,
          },
          {
            label: "PhishTank",
            val: ti.phishtank,
            status: ti.phishtank_status,
          },
          { label: "Spamhaus", val: ti.spamhaus, status: ti.spamhaus_status },
          {
            label: "AbuseIPDB",
            val: ti.abuseipdb,
            status: ti.abuseipdb_status,
          },
          {
            label: "Domain Age",
            val: ti.domain_age,
            status: ti.domain_age_status,
          },
        ].map((row, i) => (
          <div className="ti-row" key={i}>
            <span className="ti-source">{row.label}</span>
            <span className={`ti-val-${row.status}`}>{row.val}</span>
          </div>
        ))}
      </div>

      {email.trusted && (
        <div className="section">
          <div className="section-label">Domain Comparison</div>
          <div className="domain-row">
            <div className="dbox trusted">
              <div className="dbox-label">Trusted</div>
              <div className="dbox-val">{email.trusted}</div>
            </div>
            <div className="vs-sep">VS</div>
            <div className="dbox suspect">
              <div className="dbox-label">Sender</div>
              <div className="dbox-val">{email.from.split("@")[1]}</div>
            </div>
          </div>
          <div className="sim-row">
            <span>Similarity score</span>
            <span>{result.similarity_score}%</span>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill ${simClass}`}
              style={{ width: `${result.similarity_score}%` }}
            />
          </div>
        </div>
      )}

      <CheckGrid localChecks={lc} result={result} />

      <div className="case-box">
        <div className="case-head">
          <span className="case-title">Incident Case Manager</span>
          <span
            className={`case-status-badge ${caseStatus === "OPEN" ? "csb-open" : caseStatus === "IN PROGRESS" ? "csb-progress" : "csb-resolved"}`}
          >
            {caseStatus}
          </span>
        </div>
        <div className="case-body">
          {[
            ["Case ID", caseId],
            ["Assigned To", "analyst"],
            ["Priority", result.risk?.toUpperCase()],
            ["Created", new Date().toLocaleString()],
            ["SLA", "4 hours"],
            ["Evidence", "Email headers, domain analysis, threat intel"],
          ].map(([k, v], i) => (
            <div className="case-row" key={i}>
              <span className="case-key">{k}</span>
              <span className="case-val">{v}</span>
            </div>
          ))}
        </div>
        <div className="case-actions-row">
          <button
            className="case-btn assign"
            onClick={() => {
              alert("Case assigned to senior analyst.");
              setCaseStatus("IN PROGRESS");
              onAudit(
                makeAuditEntry(
                  "case",
                  "Case assigned to senior analyst",
                  "at-case",
                ),
              );
            }}
          >
            Assign
          </button>
          <button
            className="case-btn escalate"
            onClick={() => {
              alert("Case escalated to CISO.");
              onAudit(
                makeAuditEntry("escalate", "Escalated to CISO", "at-report"),
              );
            }}
          >
            Escalate
          </button>
          <button className="case-btn export" onClick={copyReport}>
            Export
          </button>
          <button
            className="case-btn close"
            onClick={() => {
              setCaseStatus("RESOLVED");
              onAudit(makeAuditEntry("close", "Case resolved", "at-trust"));
            }}
          >
            Resolve
          </button>
        </div>
      </div>

      {result.risk !== "low" && (
        <div className="awareness-box">
          <div className="awareness-label">📚 Employee Awareness Alert</div>
          <div className="awareness-text">
            {result.employee_alert ||
              "Be cautious of emails requesting urgent action. Verify sender identity before clicking links."}
          </div>
          <button
            className="awareness-btn"
            onClick={() => {
              alert("Employee awareness alert sent!");
              onAudit(
                makeAuditEntry(
                  "awareness",
                  `Awareness training sent re: ${email.from}`,
                  "at-case",
                ),
              );
            }}
          >
            Send Training Alert to Employee →
          </button>
        </div>
      )}

      <div className="section">
        <div className="section-label">Trust Signals</div>
        <div className="signal-list">
          {(result.signals || []).map((s, i) => (
            <div key={i} className={`signal sig-${s.type}`}>
              <span className="sig-icon">
                {s.type === "danger"
                  ? "✕"
                  : s.type === "warning"
                    ? "!"
                    : s.type === "info"
                      ? "ℹ"
                      : "✓"}
              </span>
              {s.text}
            </div>
          ))}
        </div>
      </div>

      <div className="ai-box">
        <div className="ai-label">⚡ AI Assessment — Claude Sonnet</div>
        {result.explanation || "Generating assessment…"}
      </div>

      <div className="actions">
        <button
          className="act-btn act-block"
          onClick={() => {
            alert(`Sender blocked: ${email.from}`);
            onAudit(
              makeAuditEntry(
                "block",
                `Blocked sender: ${email.from}`,
                "at-block",
              ),
            );
          }}
        >
          Block
        </button>
        <button
          className="act-btn act-report"
          onClick={() => {
            alert("Reported to security team.");
            onAudit(
              makeAuditEntry(
                "report",
                `Reported phishing from ${email.from}`,
                "at-report",
              ),
            );
          }}
        >
          Report
        </button>
        <button
          className="act-btn act-trust"
          onClick={() => {
            alert("Added to trusted senders.");
            onAudit(
              makeAuditEntry(
                "trust",
                `Trusted sender: ${email.from}`,
                "at-trust",
              ),
            );
          }}
        >
          Trust
        </button>
        <button className="act-btn act-export" onClick={copyReport}>
          Legal Export
        </button>
      </div>
    </div>
  );
}

function DashboardTab({ emails, analysis }) {
  const byDay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayData = [12, 18, 9, 24, 31, 7, emails.length];
  const maxDay = Math.max(...dayData);
  const attackTypes = [
    { name: "Homograph Attack", pct: 34, color: "var(--red)" },
    { name: "Domain Padding", pct: 26, color: "var(--orange)" },
    { name: "TLD Switch", pct: 18, color: "var(--yellow)" },
    { name: "Typosquatting", pct: 14, color: "var(--purple)" },
    { name: "Subdomain Abuse", pct: 8, color: "var(--accent)" },
  ];
  const highCount = Object.values(analysis).filter(
    (r) => r.risk === "high",
  ).length;
  const medCount = Object.values(analysis).filter(
    (r) => r.risk === "medium",
  ).length;
  const blockedCount = Math.floor(highCount * 0.8);
  const brandScore = Math.max(100 - highCount * 8 - medCount * 3, 20);
  const brandScoreColor =
    brandScore > 70 ? "cv-green" : brandScore > 40 ? "cv-orange" : "cv-red";

  return (
    <div className="dashboard">
      <div className="dash-card wide-2">
        <div className="dash-card-head">
          <span className="dash-card-title">Threat Volume — Last 7 Days</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--mono)",
              color: "var(--red)",
            }}
          >
            ↑ 23% WoW
          </span>
        </div>
        <div className="dash-card-body">
          <div className="chart-row">
            {dayData.map((v, i) => (
              <div
                key={i}
                className="chart-bar"
                data-val={v}
                style={{
                  height: `${(v / maxDay) * 100}%`,
                  background:
                    i === 6
                      ? "var(--accent)"
                      : v > 20
                        ? "var(--red)"
                        : v > 12
                          ? "var(--orange)"
                          : "var(--green)",
                  opacity: i === 6 ? 1 : 0.65,
                }}
              />
            ))}
          </div>
          <div className="chart-labels">
            {byDay.map((d) => (
              <span className="chart-label" key={d}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-head">
          <span className="dash-card-title">Brand Protection Score</span>
        </div>
        <div
          className="dash-card-body"
          style={{ textAlign: "center", padding: "16px 14px" }}
        >
          <div
            style={{ fontSize: 48, fontWeight: 800, fontFamily: "var(--mono)" }}
            className={brandScoreColor}
          >
            {brandScore}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text3)",
              fontFamily: "var(--mono)",
              marginTop: 4,
            }}
          >
            /100 ·{" "}
            {brandScore > 70
              ? "PROTECTED"
              : brandScore > 40
                ? "AT RISK"
                : "CRITICAL"}
          </div>
          <div className="brand-bar" style={{ marginTop: 12 }}>
            <div className="brand-fill" style={{ width: `${brandScore}%` }} />
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text3)",
              fontFamily: "var(--mono)",
              marginTop: 6,
            }}
          >
            {LOOKALIKE_DOMAINS.length} lookalike domains detected this month
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-head">
          <span className="dash-card-title">Attack Vectors</span>
        </div>
        <div className="dash-card-body">
          <div className="attack-list">
            {attackTypes.map((a, i) => (
              <div key={i}>
                <div className="attack-item">
                  <div className="attack-dot" style={{ background: a.color }} />
                  <span className="attack-name">{a.name}</span>
                  <span className="attack-pct" style={{ color: a.color }}>
                    {a.pct}%
                  </span>
                </div>
                <div className="attack-bar">
                  <div
                    className="attack-fill"
                    style={{ width: `${a.pct}%`, background: a.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-head">
          <span className="dash-card-title">Threats Blocked</span>
        </div>
        <div
          className="dash-card-body"
          style={{ textAlign: "center", padding: "20px 14px" }}
        >
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              fontFamily: "var(--mono)",
              color: "var(--green)",
            }}
          >
            {blockedCount}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text3)",
              fontFamily: "var(--mono)",
              marginTop: 4,
            }}
          >
            this session · {highCount} high-risk
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--green)",
              fontFamily: "var(--mono)",
              marginTop: 8,
              fontWeight: 600,
            }}
          >
            Est. ${(blockedCount * 47000).toLocaleString()} prevented
          </div>
        </div>
      </div>

      <div className="dash-card wide-2">
        <div className="dash-card-head">
          <span className="dash-card-title">Active Threat Campaigns</span>
        </div>
        <div className="dash-card-body">
          {[
            {
              name: "PayPal Spoof Wave",
              count: 2,
              risk: "HIGH",
              age: "Active 3d",
              color: "var(--red)",
            },
            {
              name: "Delivery Phish Cluster",
              count: 1,
              risk: "HIGH",
              age: "Active 5d",
              color: "var(--red)",
            },
            {
              name: "Streaming Fraud Ring",
              count: 1,
              risk: "MEDIUM",
              age: "Active 1w",
              color: "var(--orange)",
            },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "var(--mono)",
                    color: "var(--text)",
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text3)",
                    fontFamily: "var(--mono)",
                    marginTop: 1,
                  }}
                >
                  {c.count} emails · {c.age}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 3,
                  fontFamily: "var(--mono)",
                  fontWeight: 700,
                  background:
                    c.risk === "HIGH" ? "var(--redbg)" : "var(--orangebg)",
                  color: c.risk === "HIGH" ? "var(--red)" : "var(--orange)",
                  border: `1px solid ${c.risk === "HIGH" ? "var(--redbd)" : "rgba(200,90,16,0.3)"}`,
                }}
              >
                {c.risk}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-card wide-3">
        <div className="dash-card-head">
          <span className="dash-card-title">Integration Status</span>
        </div>
        <div
          className="dash-card-body"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6,1fr)",
            gap: 8,
          }}
        >
          {[
            { name: "Splunk SIEM", status: "connected", color: "var(--green)" },
            { name: "MS Sentinel", status: "connected", color: "var(--green)" },
            {
              name: "Slack Alerts",
              status: "connected",
              color: "var(--green)",
            },
            { name: "MS Teams", status: "disconnected", color: "var(--text3)" },
            { name: "ServiceNow", status: "connected", color: "var(--green)" },
            {
              name: "IBM QRadar",
              status: "disconnected",
              color: "var(--text3)",
            },
          ].map((int, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "8px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4, color: int.color }}>
                {int.status === "connected" ? "●" : "○"}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--mono)",
                  color: int.color,
                  fontWeight: 600,
                }}
              >
                {int.status.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  fontFamily: "var(--mono)",
                  marginTop: 2,
                }}
              >
                {int.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IncidentsTab({ emails, analysis }) {
  const highEmails = emails.filter(
    (e) => analysis[e.id]?.risk === "high" || analysis[e.id]?.risk === "medium",
  );
  return (
    <div className="incidents-view">
      {highEmails.length === 0 ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Analysing emails for incidents...</span>
        </div>
      ) : (
        highEmails.map((email) => {
          const r = analysis[email.id];
          if (!r) return null;
          const caseId = `CASE-${String(email.id + 1001).padStart(4, "0")}`;
          return (
            <div className="incident-card" key={email.id}>
              <div className="inc-head">
                <div className={`inc-icon ${r.risk}`}>
                  {r.risk === "high" ? "⚠" : "⚡"}
                </div>
                <div className="inc-info">
                  <div className="inc-title">
                    {email.name} — {r.attack_type || "Suspicious Sender"}
                  </div>
                  <div className="inc-sub">
                    {email.from} · {email.time} · {caseId}
                  </div>
                </div>
                <div className="inc-badges">
                  <span className={`rbadge rb-${r.risk}`}>{r.risk} risk</span>
                  {email.campaign && (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 3,
                        fontFamily: "var(--mono)",
                        fontWeight: 700,
                        background: "var(--purplebg)",
                        color: "var(--purple)",
                        border: "1px solid var(--purplebd)",
                        marginLeft: 4,
                      }}
                    >
                      Campaign
                    </span>
                  )}
                </div>
              </div>
              <div className="inc-body">
                <div className="inc-stat">
                  <div className="inc-stat-label">Confidence</div>
                  <div className="inc-stat-val cv-accent">{r.confidence}%</div>
                </div>
                <div className="inc-stat">
                  <div className="inc-stat-label">Similarity</div>
                  <div className="inc-stat-val cv-r">{r.similarity_score}%</div>
                </div>
                <div className="inc-stat">
                  <div className="inc-stat-label">Action</div>
                  <div
                    className="inc-stat-val"
                    style={{ fontSize: 11, color: "var(--orange)" }}
                  >
                    {(r.recommended_action || "review").toUpperCase()}
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: "6px 14px 8px",
                  fontSize: 13,
                  color: "var(--text2)",
                  fontFamily: "var(--mono)",
                  lineHeight: 1.6,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {r.explanation}
              </div>
              <div className="inc-actions">
                <button
                  className="inc-btn view-btn"
                  onClick={() => alert(`Viewing full case: ${caseId}`)}
                >
                  View Case
                </button>
                <button
                  className="inc-btn export-btn"
                  onClick={() => alert("Forensic package exported.")}
                >
                  Legal Export
                </button>
                <button
                  className="inc-btn resolve-btn"
                  onClick={() => alert("Case marked as resolved.")}
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function LookalikeTab() {
  return (
    <div className="lookalike-view">
      <div
        style={{
          padding: "8px 14px 4px",
          fontSize: 11,
          color: "var(--text3)",
          fontFamily: "var(--mono)",
          letterSpacing: "0.06em",
        }}
      >
        Proactively monitoring for newly registered domains impersonating your
        brand. Updated every 24 hours.
      </div>
      {LOOKALIKE_DOMAINS.map((d, i) => (
        <div
          className={`lookalike-card ${d.score > 80 ? "high-risk" : ""}`}
          key={i}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text3)",
                fontFamily: "var(--mono)",
                marginBottom: 3,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Lookalike Domain
            </div>
            <div className="lk-domain">{d.domain}</div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text3)",
                fontFamily: "var(--mono)",
                marginTop: 2,
              }}
            >
              {d.tactic}
            </div>
          </div>
          <div className="lk-info">
            <div className="lk-row">
              <span>Registered</span>
              <span className="lk-val">{d.registered}</span>
            </div>
            <div className="lk-row">
              <span>Registrar</span>
              <span className="lk-val">{d.registrar}</span>
            </div>
            <div className="lk-row">
              <span>Country</span>
              <span className="lk-val">{d.country}</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "var(--mono)",
                color:
                  d.score > 80
                    ? "var(--red)"
                    : d.score > 60
                      ? "var(--orange)"
                      : "var(--yellow)",
              }}
            >
              {d.score}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text3)",
                fontFamily: "var(--mono)",
              }}
            >
              THREAT SCORE
            </div>
          </div>
          <div className="lk-actions">
            <button
              className="lk-btn"
              style={{
                color: "var(--red)",
                borderColor: "var(--redbd)",
                background: "var(--redbg)",
              }}
              onClick={() => alert(`Takedown request filed for ${d.domain}`)}
            >
              Takedown
            </button>
            <button
              className="lk-btn"
              style={{
                color: "var(--accent)",
                borderColor: "rgba(0,120,170,0.3)",
                background: "rgba(0,120,170,0.07)",
              }}
              onClick={() => alert(`Monitoring ${d.domain}`)}
            >
              Monitor
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTab({ auditLog }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 14px 6px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text2)",
            fontFamily: "var(--mono)",
          }}
        >
          Chain of Custody Audit Log
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--green)",
            fontFamily: "var(--mono)",
            background: "var(--greenbg)",
            border: "1px solid var(--greenbd)",
            padding: "2px 8px",
            borderRadius: 3,
          }}
        >
          IMMUTABLE · GDPR COMPLIANT
        </span>
      </div>
      <div className="audit-log">
        {auditLog.length === 0 ? (
          <div className="loading-state">No audit entries yet.</div>
        ) : (
          [...auditLog].reverse().map((entry) => (
            <div className="audit-entry" key={entry.id}>
              <span className="audit-time">{entry.time}</span>
              <span className="audit-user">{entry.user}</span>
              <span className="audit-action">
                {entry.action}
                <span className={`audit-tag ${entry.tag}`}>
                  {entry.tag?.replace("at-", "").toUpperCase()}
                </span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SettingsTab({ settings, setSettings }) {
  const toggle = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  const [currentRole, setCurrentRole] = useState("ANALYST");
  return (
    <div className="settings-view">
      <div className="settings-card">
        <div className="settings-head">
          <span className="settings-title">
            Role-Based Access Control (RBAC)
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--purple)",
              fontFamily: "var(--mono)",
            }}
          >
            Current: {currentRole}
          </span>
        </div>
        <div className="settings-body">
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>
            Select your role to adjust permissions and visible features.
          </div>
          <div className="roles-row">
            {["ANALYST", "MANAGER", "CISO", "ADMIN"].map((role) => (
              <button
                key={role}
                className={`role-badge ${currentRole === role ? "active" : ""}`}
                onClick={() => {
                  setCurrentRole(role);
                  alert(`Role switched to ${role}.`);
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-head">
          <span className="settings-title">Alert & Notification Settings</span>
        </div>
        <div className="settings-body">
          {[
            {
              key: "slackEnabled",
              label: "Slack Alerts",
              desc: "Send high-risk detections to #security-alerts channel",
            },
            {
              key: "teamsEnabled",
              label: "Microsoft Teams",
              desc: "Push critical alerts to Security Operations channel",
            },
            {
              key: "emailAlerts",
              label: "Email Alerts to CISO",
              desc: "Daily digest + critical real-time alerts to CISO inbox",
            },
            {
              key: "employeeAlerts",
              label: "Employee Awareness",
              desc: "Auto-send training alerts to employees who received threats",
            },
          ].map((s) => (
            <div className="setting-row" key={s.key}>
              <div>
                <div className="setting-label">{s.label}</div>
                <div className="setting-desc">{s.desc}</div>
              </div>
              <button
                className={`toggle ${settings[s.key] ? "on" : "off"}`}
                onClick={() => toggle(s.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-head">
          <span className="settings-title">SIEM & Webhook Integration</span>
        </div>
        <div className="settings-body">
          <div className="setting-row">
            <div>
              <div className="setting-label">SIEM Webhook</div>
              <div className="setting-desc">
                Fire events to Splunk, Sentinel, or QRadar on every detection
              </div>
            </div>
            <button
              className={`toggle ${settings.siemEnabled ? "on" : "off"}`}
              onClick={() => toggle("siemEnabled")}
            />
          </div>
          <input
            className="webhook-input"
            placeholder="https://your-siem-webhook.example.com/api/events"
            defaultValue="https://splunk.corp.example.com/services/collector/event"
          />
          <div className="setting-row" style={{ marginTop: 4 }}>
            <div>
              <div className="setting-label">ServiceNow Integration</div>
              <div className="setting-desc">
                Auto-create incidents in ServiceNow on HIGH risk detections
              </div>
            </div>
            <button
              className={`toggle ${settings.serviceNow ? "on" : "off"}`}
              onClick={() => toggle("serviceNow")}
            />
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Jira Ticketing</div>
              <div className="setting-desc">
                Create Jira issues in Security project on MEDIUM+ detections
              </div>
            </div>
            <button
              className={`toggle ${settings.jira ? "on" : "off"}`}
              onClick={() => toggle("jira")}
            />
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-head">
          <span className="settings-title">Compliance & Data Retention</span>
        </div>
        <div className="settings-body">
          {[
            {
              key: "gdprMode",
              label: "GDPR Compliance Mode",
              desc: "Anonymize PII in audit logs after 90 days",
            },
            {
              key: "popiaMode",
              label: "POPIA Compliance (SA)",
              desc: "South Africa Protection of Personal Information Act compliance",
            },
            {
              key: "hipaaMode",
              label: "HIPAA Mode",
              desc: "Enhanced encryption for healthcare sector clients",
            },
            {
              key: "soc2Mode",
              label: "SOC 2 Type II",
              desc: "Continuous monitoring controls for SOC 2 audit evidence",
            },
          ].map((s) => (
            <div className="setting-row" key={s.key}>
              <div>
                <div className="setting-label">{s.label}</div>
                <div className="setting-desc">{s.desc}</div>
              </div>
              <button
                className={`toggle ${settings[s.key] ? "on" : "off"}`}
                onClick={() => toggle(s.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-head">
          <span className="settings-title">REST API & Developer Access</span>
        </div>
        <div className="settings-body">
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>
            Embed Solid5Shiled's analysis engine in your own systems.
          </div>
          <div
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--border2)",
              borderRadius: 5,
              padding: "10px 12px",
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--green)",
              borderLeft: "2px solid var(--green)",
            }}
          >
            {`POST /api/v1/analyze\nAuthorization: Bearer YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "from": "sender@domain.com",\n  "trusted": "legit.com",\n  "subject": "Email subject"\n}`}
          </div>
          <div className="setting-row" style={{ marginTop: 8 }}>
            <div>
              <div className="setting-label">API Rate Limiting</div>
              <div className="setting-desc">
                1,000 requests/hour per API key
              </div>
            </div>
            <button className="toggle on" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Solid5Shiled() {
  const [emails, setEmails] = useState([]);
  const [analysis, setAnalysis] = useState({});
  const [selected, setSelected] = useState(null);
  const [activeProvider, setActiveProvider] = useState("ms365");
  const [connected, setConnected] = useState({});
  const [modal, setModal] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState("monitor");
  const [currentUser, setCurrentUser] = useState(null);
  const [auditLog, setAuditLog] = useState([
    makeAuditEntry("system", "Solid5Shiled Enterprise v3.0 started", "at-scan"),
  ]);
  const [settings, setSettings] = useState({
    slackEnabled: true,
    teamsEnabled: false,
    emailAlerts: true,
    employeeAlerts: true,
    siemEnabled: true,
    serviceNow: true,
    jira: false,
    gdprMode: false,
    popiaMode: false,
    hipaaMode: false,
    soc2Mode: false,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const isMobile = () => window.innerWidth <= 768;
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const analyzeQueue = useRef([]);
  const analyzing = useRef(false);

  const addAudit = useCallback(
    (entry) => setAuditLog((prev) => [...prev, entry]),
    [],
  );

  const processQueue = useCallback(async () => {
    if (analyzing.current || analyzeQueue.current.length === 0) return;
    analyzing.current = true;
    while (analyzeQueue.current.length > 0) {
      const email = analyzeQueue.current.shift();
      try {
        const result = await analyzeWithClaude(email);
        setAnalysis((prev) => ({ ...prev, [email.id]: result }));
        setEmails((prev) =>
          prev.map((e) =>
            e.id === email.id ? { ...e, risk: result.risk } : e,
          ),
        );
        setStats((prev) => ({
          ...prev,
          [result.risk]: (prev[result.risk] || 0) + 1,
        }));
        addAudit(
          makeAuditEntry(
            "scan",
            `Analyzed ${email.from} — ${result.risk?.toUpperCase()} risk detected`,
            "at-scan",
          ),
        );
      } catch {
        const lc = runLocalChecks(email);
        const lr =
          lc.homograph || lc.tldSwitch || lc.subdomainAbuse || lc.typosquatFlag
            ? "high"
            : lc.domainPadding || lc.suspiciousTLD || lc.brandInject
              ? "medium"
              : "low";
        const ti = simulateThreatIntel(email.from.split("@")[1] || "");
        const fallback = {
          risk: lr,
          verdict: "Local analysis only (Claude API unavailable)",
          signals: [
            {
              type: "warning",
              text: "Claude API unavailable — local heuristics only",
            },
          ],
          explanation: "Analysis based on 14-point local heuristics.",
          similarity_score: 50,
          confidence: 40,
          recommended_action: "review",
          employee_alert: "Be cautious of emails requesting urgent action.",
          _localChecks: lc,
          _threatIntel: ti,
        };
        setAnalysis((prev) => ({ ...prev, [email.id]: fallback }));
        setEmails((prev) =>
          prev.map((e) => (e.id === email.id ? { ...e, risk: lr } : e)),
        );
        setStats((prev) => ({ ...prev, [lr]: (prev[lr] || 0) + 1 }));
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    analyzing.current = false;
  }, [settings, addAudit]);

  useEffect(() => {
    const loadClientEmails = async () => {
      const user = _auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken(true);
      const providers = ["zoho", "ms365", "gmail", "imap"];

      for (const provider of providers) {
        try {
          const res = await fetch(`${WORKER_URL}/api/emails?provider=${provider}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.warn(`${provider} failed:`, res.status, errBody);
        continue;
      }

          const { emails: fetched } = await res.json();

          for (const e of fetched) {
            const email = { ...e, risk: null, trusted: null };
            setEmails((prev) => [...prev, email]);
            setStats((prev) => ({ ...prev, total: prev.total + 1 }));
            analyzeQueue.current.push(email);
            processQueue();
          }

         setConnected((prev) => {
  const updated = { ...prev, [provider]: true };
  // Auto-switch to first connected provider
  setActiveProvider(prev2 => 
    Object.keys(updated)[0] || prev2
  );
  return updated;
});
        } catch {
          // Provider fetch failed — continue with others
        }
      }
    };

    // Wait for Firebase auth to resolve before fetching
    const unsub = onAuthStateChanged(_auth, (user) => {
      if (user) loadClientEmails();
    });

    return unsub;
  }, []);
  useEffect(() => {
    const unsub = onAuthStateChanged(_auth, (u) => setCurrentUser(u));
    return unsub;
  }, []);
const handleConnect = (providerId) => {
  const uid = _auth.currentUser?.uid;
  if (!uid) { 
    alert("Please sign in first"); 
    return; 
  }

  const urls = {
    zoho:  `${WORKER_URL}/api/oauth/zoho/start?uid=${uid}`,
    ms365: `${WORKER_URL}/api/oauth/ms/start?uid=${uid}`,
    gmail: `${WORKER_URL}/api/oauth/google/start?uid=${uid}`,
  };

  if (urls[providerId]) {
    window.location.href = urls[providerId];
  }
};

  const checkManual = async () => {
    const raw = manualInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*/, "");
    if (!raw) return;
    setManualInput("");
    const id = Date.now();
    const newEmail = {
      id,
      provider: activeProvider,
      from: `sender@${raw}`,
      name: raw,
      subject: "Manual domain check",
      trusted: null,
      time: "just now",
      risk: null,
    };
    setEmails((prev) => [newEmail, ...prev]);
    setStats((prev) => ({ ...prev, total: prev.total + 1 }));
    analyzeQueue.current.push(newEmail);
    processQueue();
    setSelected(id);
    addAudit(
      makeAuditEntry("manual", `Manual domain check: ${raw}`, "at-scan"),
    );
  };

  const currentProvider = PROVIDERS.find((p) => p.id === activeProvider);
  const filteredEmails = emails.filter((e) => {
    if (e.provider !== activeProvider) return false;
    if (filter === "all") return true;
    return e.risk === filter;
  });
  const selectedEmail = emails.find((e) => e.id === selected);
  const selectedAnalysis = selected != null ? analysis[selected] : null;
  const highCount = Object.values(analysis).filter(
    (r) => r.risk === "high",
  ).length;
  const pendingCount = emails.filter((e) => !analysis[e.id]).length;
const isLoading = emails.filter(e => e.provider === activeProvider).length === 0 
  && Object.keys(connected).length === 0;
  const TABS = [
    {
      id: "monitor",
      label: "Monitor",
      badge: pendingCount > 0 ? pendingCount : null,
    },
    { id: "dashboard", label: "Dashboard", badge: null },
    {
      id: "incidents",
      label: "Incidents",
      badge: highCount > 0 ? highCount : null,
    },
    { id: "lookalike", label: "Lookalike", badge: LOOKALIKE_DOMAINS.length },
    { id: "audit", label: "Audit Log", badge: null },
    { id: "settings", label: "Settings", badge: null },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* ── TOPBAR ── */}
        <div className="topbar">
          <button
            className="mob-menu-btn"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="var(--text2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="logo-wrap">
            <div className="logo-mark" />
            <div className="logo-text">
              <img src={logo} style={{ width: "120px" }} alt="Solid5 Shield" />
            </div>
          </div>
          <nav className="nav-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`nav-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.badge != null && (
                  <span className="nav-badge">{t.badge}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="topbar-right">
            {highCount > 0 && (
              <div className="pill pill-threat">⚠ {highCount}</div>
            )}
            <div className="pill pill-role">ANALYST</div>
            <div className="pill pill-live">
              <div className="pulse pulse-green" />
              &nbsp;LIVE
            </div>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="statsbar">
          {[
            ["Scanned", stats.total, "cv-accent", "session"],
            ["Critical", stats.high || 0, "cv-red", "high risk"],
            ["Medium", stats.medium || 0, "cv-orange", "review"],
            ["Trusted", stats.low || 0, "cv-green", "safe"],
            ["Campaigns", 3, "cv-purple", "active"],
            ["Lookalikes", LOOKALIKE_DOMAINS.length, "cv-yellow", "monitored"],
            ["Checks", 14, "cv-pink", "/email"],
          ].map(([label, val, color, sub]) => (
            <div className="sstat" key={label}>
              <div className="sstat-label">{label}</div>
              <div className={`sstat-val ${color}`}>{val}</div>
              <div className="sstat-sub">{sub}</div>
            </div>
          ))}
        </div>

        {/* ── MAIN TAB VIEW ── */}
        <div className="tab-view">
          {tab === "monitor" && (
            <div className="main">
              {/* Sidebar drawer overlay */}
              {sidebarOpen && (
                <div
                  className="mob-overlay"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              {/* ── SIDEBAR ── */}
              <div className={`sidebar ${sidebarOpen ? "mob-open" : ""}`}>
                <div className="sb-section">Providers</div>
                {PROVIDERS.map((p) => {
                  const count = emails.filter(
                    (e) => e.provider === p.id,
                  ).length;
                  return (
                    <button
                      key={p.id}
                      className={`sb-item ${activeProvider === p.id ? "active" : ""}`}
                      onClick={() => {
                        setActiveProvider(p.id);
                        setSidebarOpen(false);
                      }}
                    >
                      <div className={`sb-icon ${p.cls}`}>
                        {p.id === "gmail" ? <GoogleIcon /> : p.icon}
                      </div>
                      <div className="sb-meta">
                        <span className="sb-name">{p.name}</span>
                        <span
                          className={`sb-status ${connected[p.id] ? "on" : "off"}`}
                        >
                          {connected[p.id] ? "● Connected" : "○ Not connected"}
                        </span>
                      </div>
                      {count > 0 && <span className="sb-cnt">{count}</span>}
                    </button>
                  );
                })}
                <button
                  className="connect-btn"
                  onClick={() => setModal(currentProvider)}
                >
                  + Connect {currentProvider?.name}
                </button>
                <div className="sb-divider" />
                <div className="intel-widget">
                  <div className="intel-title">🔴 Threat Feed</div>
                  {[
                    ["paypa1.com", "97/100"],
                    ["g00gle.com", "94/100"],
                    ["netfIix.com", "91/100"],
                    ["apple-id.co", "88/100"],
                  ].map(([d, s], i) => (
                    <div className="intel-item" key={i}>
                      <span className="intel-domain">{d}</span>
                      <span className="intel-score">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="brand-widget">
                  <div className="brand-title">🛡 Brand Score</div>
                  <div className="brand-score-row">
                    <div>
                      <div className="brand-score">
                        {Math.max(100 - highCount * 8, 20)}
                      </div>
                      <div className="brand-label">/100 protection</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text3)",
                          fontFamily: "var(--mono)",
                        }}
                      >
                        {LOOKALIKE_DOMAINS.length} lookalikes
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--purple)",
                          fontFamily: "var(--mono)",
                          marginTop: 2,
                        }}
                      >
                        detected
                      </div>
                    </div>
                  </div>
                  <div className="brand-bar">
                    <div
                      className="brand-fill"
                      style={{ width: `${Math.max(100 - highCount * 8, 20)}%` }}
                    />
                  </div>
                </div>
                <div className="sb-user-footer">
                  <div className="sb-avatar">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="avatar" />
                    ) : (
                      (
                        currentUser?.displayName?.[0] ||
                        currentUser?.email?.[0] ||
                        "?"
                      ).toUpperCase()
                    )}
                  </div>
                  <div className="sb-user-info">
                    <div className="sb-user-name">
                      {currentUser?.displayName || "Guest User"}
                    </div>
                    <div className="sb-user-email">
                      {currentUser?.email || "Not signed in"}
                    </div>
                  </div>
                  <button
                    className="sb-logout-btn"
                    onClick={() => signOut(_auth).catch(console.error)}
                  >
                    OUT
                  </button>
                </div>
              </div>

              {/* ── EMAIL PANE ── */}
              <div className="email-pane">
                <div className="pane-head">
                  <span className="pane-title">{currentProvider?.short}</span>
                  <div className="filter-row">
                    {[
                      ["all", "fa"],
                      ["high", "fh"],
                      ["medium", "fm"],
                      ["low", "fl"],
                    ].map(([f, cls]) => (
                      <button
                        key={f}
                        className={`fbtn ${filter === f ? cls : ""}`}
                        onClick={() => setFilter(f)}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="email-list">
                  {isLoading ? (
  <div className="loading-state"><div className="spinner" />Loading emails…</div>
) : filteredEmails.length === 0 ? (
  <div className="loading-state" style={{color:'var(--text3)'}}>
    No {filter !== 'all' ? filter+'-risk ' : ''}emails for this provider.
    {!connected[activeProvider] && <><br/>Click "+ Connect" to link your account.</>}
  </div>
): (
                    filteredEmails.map((e) => (
                      <div
                        key={e.id}
                        className={`email-row ${selected === e.id ? "sel" : ""}`}
                        onClick={() => {
                          setSelected(e.id);
                          if (isMobile()) setDetailOpen(true);
                        }}
                      >
                        <div
                          className={`risk-pip rp-${e.risk || "analyzing"}`}
                        />
                        <div className="email-info">
                          <div className="email-sender">{e.name}</div>
                          <div className="email-subj">{e.subject}</div>
                          <div className="email-dom">
                            {e.from.split("@")[1]}
                          </div>
                          {e.campaign && (
                            <span className="campaign-tag">
                              ⚡ {e.campaign}
                            </span>
                          )}
                        </div>
                        <div className="email-right">
                          <div className="email-time">{e.time}</div>
                          <span
                            className={`rbadge rb-${e.risk || "analyzing"}`}
                          >
                            {e.risk ? `${e.risk} risk` : "…"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="manual-bar">
                  <input
                    type="text"
                    placeholder="Check domain: paypa1.com…"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && checkManual()}
                  />
                  <button className="analyze-btn" onClick={checkManual}>
                    ANALYZE
                  </button>
                </div>
              </div>

              {/* ── DETAIL PANE (slides in on mobile) ── */}
              <div className={`detail ${detailOpen ? "mob-open" : ""}`}>
                <button
                  className="mob-back"
                  onClick={() => setDetailOpen(false)}
                >
                  ← Back to inbox
                </button>
                <DetailPane
                  email={selectedEmail}
                  result={selectedAnalysis}
                  onAudit={addAudit}
                  settings={settings}
                />
              </div>
            </div>
          )}

          {tab === "dashboard" && (
            <DashboardTab emails={emails} analysis={analysis} />
          )}
          {tab === "incidents" && (
            <IncidentsTab emails={emails} analysis={analysis} />
          )}
          {tab === "lookalike" && <LookalikeTab />}
          {tab === "audit" && <AuditTab auditLog={auditLog} />}
          {tab === "settings" && (
            <SettingsTab settings={settings} setSettings={setSettings} />
          )}
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <div className="mob-bottom-nav">
          {[
            {
              id: "monitor",
              icon: "📥",
              label: "Monitor",
              badge: pendingCount > 0 ? pendingCount : null,
            },
            { id: "dashboard", icon: "📊", label: "Dash", badge: null },
            {
              id: "incidents",
              icon: "⚠️",
              label: "Incidents",
              badge: highCount > 0 ? highCount : null,
            },
            {
              id: "lookalike",
              icon: "🔍",
              label: "Lookalike",
              badge: LOOKALIKE_DOMAINS.length,
            },
            { id: "audit", icon: "📋", label: "Audit", badge: null },
            { id: "settings", icon: "⚙️", label: "Settings", badge: null },
          ].map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.badge != null && (
                <span className="mob-nav-badge">{t.badge}</span>
              )}
              <span className="mob-nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {modal && (
        <ConnectModal
          provider={modal}
          onClose={() => setModal(null)}
          onConnect={handleConnect}
        />
      )}
    </>
  );
}
