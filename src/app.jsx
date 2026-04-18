
const { useState, useRef, useCallback, useEffect, useMemo } = React;

/* ═══════════════════════════════════════════════════════
   SUPABASE CLIENT & AUTH
   ═══════════════════════════════════════════════════════ */
const SUPABASE_URL="https://whfdtdcplkneviumgrkz.supabase.co";
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZmR0ZGNwbGtuZXZpdW1ncmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Mzk0MzQsImV4cCI6MjA5MTIxNTQzNH0.xmk6ZPvxt9dmezmDESMI8w6AmL3zErcjWb0T7iNHQAE";
const supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

// Analytics: push events to GA4 via gtag + dataLayer
window.dataLayer=window.dataLayer||[];
const trackEvent=(name,params={})=>{if(typeof gtag==="function")gtag("event",name,params);else window.dataLayer.push({event:name,...params});};

const validateEmail=(e)=>typeof e==="string"&&e.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validatePassword=(p)=>typeof p==="string"&&p.length>=8&&/[A-Z]/.test(p)&&/[a-z]/.test(p)&&/[0-9]/.test(p);
const sanitizeText=(s)=>typeof s==="string"?s.replace(/[<>]/g,"").trim().slice(0,5000):"";


/* ═══════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════ */
const LOGO=(s=24,c="currentColor")=><svg width={s} height={s} viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke={c} strokeWidth="1.5" fill={c+"08"}/><path d="M12 24h6l3-6 4.5 12 3-6H35" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="24" r="1.8" fill={c}/><circle cx="35" cy="24" r="1.8" fill={c}/></svg>;

const I={
  bolt:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  seedling:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V10"/><path d="M6 13c0-3.5 2.7-6 6-6"/><path d="M18 5c0 3.5-2.7 6-6 6"/><path d="M6 13c-2.2 0-4-1.8-4-4 0-3 2.5-5 5-5 1.5 0 3 .6 4 2"/><path d="M18 5c2.2 0 4 1.8 4 4 0 3-2.5 5-5 5-1.5 0-3-.6-4-2"/></svg>,
  microscope:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>,
  pen:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  code:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  chart:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  lightbulb:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  fileText:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>,
  globe:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  palette:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10Z"/></svg>,
  theater:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v11a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V4z"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9.5 15a3.5 3.5 0 0 0 5 0"/></svg>,
  mail:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  book:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  target:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  cpu:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg>,
  sliders:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>,
  copy:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  check:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  speaker:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v4M6 6v12M10 3v18M14 8v8M18 5v14M22 10v4"/></svg>,
  ruler:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/></svg>,
  layout:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  brain:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>,
  users:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  shield:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>,
  plus:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  info:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  hash:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>,
  sparkle:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>,
  building:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M12 14h.01M8 14h.01M16 14h.01"/></svg>,
  file:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>,
  layers:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.58 4.08a2 2 0 0 1-1.66 0L2 12.5"/><path d="m22 17-8.58 4.08a2 2 0 0 1-1.66 0L2 17"/></svg>,
  checkList:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 18H3"/><path d="M11 12H3"/><path d="M15 6H3"/><path d="m16 18 2 2 4-4"/><path d="m16 12 2 2 4-4"/></svg>,
  lang:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>,
  download:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  clock:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trash:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  wand:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5"/></svg>,
  share:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>,
  gift:(s=18,c="currentColor")=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>,
};

const MM=({id,size=22})=>{const s=size;
  /* Claude — Anthropic's sunburst/starburst mark */
  if(id==="claude")return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#D4A574"/>{[0,45,90,135,180,225,270,315].map((a,i)=><line key={i} x1="16" y1="16" x2={16+8*Math.cos(a*Math.PI/180)} y2={16+8*Math.sin(a*Math.PI/180)} stroke="#fff" strokeWidth="2" strokeLinecap="round"/>)}<circle cx="16" cy="16" r="3.5" fill="#fff"/></svg>;
  /* ChatGPT — OpenAI hexagonal flower/knot */
  if(id==="chatgpt")return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#10A37F"/><path d="M16 7l7.8 4.5v9L16 25l-7.8-4.5v-9z" fill="none" stroke="#fff" strokeWidth="1.6"/><path d="M16 7v9m0 0l7.8-4.5M16 16l-7.8-4.5M16 16v9m0 0l7.8-4.5M16 25l-7.8-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/></svg>;
  /* o-series — OpenAI black circle variant (reasoning models) */
  if(id==="gpt4o")return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#0f0f0f"/><path d="M16 7l7.8 4.5v9L16 25l-7.8-4.5v-9z" fill="none" stroke="#fff" strokeWidth="1.4"/><path d="M16 7v9m0 0l7.8-4.5M16 16l-7.8-4.5M16 16v9m0 0l7.8-4.5M16 25l-7.8-4.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  /* Gemini — Google's 4-point sparkle */
  if(id==="gemini")return <svg width={s} height={s} viewBox="0 0 32 32"><defs><linearGradient id="gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4285F4"/><stop offset="50%" stopColor="#9B72CB"/><stop offset="100%" stopColor="#D96570"/></linearGradient></defs><path d="M16 4Q22 10 28 16Q22 22 16 28Q10 22 4 16Q10 10 16 4z" fill="url(#gm)"/></svg>;
  /* Grok — xAI angular mark */
  if(id==="grok")return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#0f0f0f"/><path d="M10 10l12 12M22 10l-6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>;
  /* Mistral — distinctive orange/black grid blocks */
  if(id==="mistral")return <svg width={s} height={s} viewBox="0 0 32 32"><rect x="5" y="6" width="5.5" height="5.5" fill="#F7D046"/><rect x="13.25" y="6" width="5.5" height="5.5" fill="#F7D046"/><rect x="21.5" y="6" width="5.5" height="5.5" fill="#000"/><rect x="5" y="13.25" width="5.5" height="5.5" fill="#F97316"/><rect x="13.25" y="13.25" width="5.5" height="5.5" fill="#000"/><rect x="21.5" y="13.25" width="5.5" height="5.5" fill="#F97316"/><rect x="5" y="20.5" width="5.5" height="5.5" fill="#000"/><rect x="13.25" y="20.5" width="5.5" height="5.5" fill="#EF4444"/><rect x="21.5" y="20.5" width="5.5" height="5.5" fill="#000"/></svg>;
  /* Llama — Meta's infinity-loop style */
  if(id==="llama")return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#0668E1"/><path d="M9 16c0-2.5 1.5-4.5 3.5-4.5S16 13 16 16s1 4.5 3.5 4.5S23 18.5 23 16s-1.5-4.5-3.5-4.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>;
  /* Perplexity — angular compass/search mark */
  if(id==="perplexity")return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#1CB0C4"/><path d="M16 6v20M8 12l8 4.5L24 12M8 20l8-4.5L24 20" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  /* Copilot — Microsoft stylized pilot visor */
  if(id==="copilot")return <svg width={s} height={s} viewBox="0 0 32 32"><defs><linearGradient id="cp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#26C6DA"/><stop offset="100%" stopColor="#7C4DFF"/></linearGradient></defs><circle cx="16" cy="16" r="14" fill="url(#cp)"/><ellipse cx="16" cy="16" rx="10" ry="6" fill="none" stroke="#fff" strokeWidth="1.8"/><path d="M6 16c0-2 4.5-6 10-6s10 4 10 6" fill="none" stroke="#fff" strokeWidth="1.8"/></svg>;
  /* Universal — generic AI target */
  return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#64748B"/><circle cx="16" cy="16" r="7" fill="none" stroke="#fff" strokeWidth="1.5"/><circle cx="16" cy="16" r="2.5" fill="#fff"/><path d="M16 6v4M16 22v4M6 16h4M22 16h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>;
};

/* ═══════════════════════════════════════════════════════
   DATA — Models, Tasks, Industries, Outputs, etc.
   ═══════════════════════════════════════════════════════ */
const MODELS={
  claude:{name:"Claude",col:"#0891B2",tips:"XML tags for structure, documents at top, detailed context windows, thinking blocks supported",fmt:"xml"},
  chatgpt:{name:"ChatGPT",col:"#10A37F",tips:"Markdown headers, strict JSON schemas, system + user message separation, chain-of-thought in steps. GPT-5 series flagship.",fmt:"md"},
  gpt4o:{name:"o-series",col:"#0EA5E9",tips:"Chain-of-thought reasoning models. Think before answering — best for math, logic, coding, and multi-step problems. Slower but more accurate.",fmt:"md"},
  gemini:{name:"Gemini",col:"#4285F4",tips:"PTCF framework (Persona-Task-Context-Format), bold section headers. Gemini 3.1 Pro flagship with 1M+ context. Strong at multimodal.",fmt:"bold"},
  grok:{name:"Grok",col:"#F97316",tips:"Direct and conversational, handles real-time context, multi-agent capable. Grok 4 series flagship. Concise instructions perform best.",fmt:"md"},
  mistral:{name:"Mistral",col:"#FF6F00",tips:"Instruction-tuned format, system/user/assistant roles, MoE architecture. Mistral Large 3 and Small 4 — strong at structured reasoning.",fmt:"md"},
  llama:{name:"Llama",col:"#8B5CF6",tips:"System prompt for role assignment, explicit constraints, shorter prompts with clear delimiters, supports tool use",fmt:"md"},
  perplexity:{name:"Perplexity",col:"#22D3EE",tips:"Search-augmented generation — ask specific questions, request source citations, great for research and fact-checking",fmt:"md"},
  copilot:{name:"Copilot",col:"#6366F1",tips:"Code-context aware, inline comment style, specify language/framework explicitly, file-level context helps",fmt:"md"},
  general:{name:"Universal",col:"#64748B",tips:"Cross-model best practices — clear structure, explicit constraints, works with any AI model",fmt:"md"}
};

/* Sub-models per parent model — tier: flagship / balanced / fast
   cost: relative token cost indicator ($$$ / $$ / $)
   desc: one-line usage guidance */
const SUB_MODELS={
  claude:[
    {id:"opus-4-6",name:"Opus 4.6",tier:"flagship",cost:"$$$",desc:"Most capable. Complex reasoning, long documents, research. ~$15/M input tokens.",badge:"Most capable"},
    {id:"sonnet-4-6",name:"Sonnet 4.6",tier:"balanced",cost:"$$",desc:"Best value. Fast and smart for most tasks. ~$3/M input tokens.",badge:"Best value"},
    {id:"haiku-4-5",name:"Haiku 4.5",tier:"fast",cost:"$",desc:"Fastest and cheapest. Quick edits, classification, summaries. ~$0.25/M input tokens.",badge:"Fastest"}
  ],
  chatgpt:[
    {id:"gpt-5.4",name:"GPT-5.4",tier:"flagship",cost:"$$$",desc:"OpenAI flagship. Best reasoning, coding, long documents, agent workflows. ~$2.50/M input tokens.",badge:"Most capable"},
    {id:"gpt-5-mini",name:"GPT-5 Mini",tier:"balanced",cost:"$$",desc:"Great balance of speed and quality. Everyday tasks. ~$0.25/M input tokens.",badge:"Best value"},
    {id:"gpt-4.1-nano",name:"GPT-4.1 Nano",tier:"fast",cost:"$",desc:"Ultra-fast, lowest cost. Simple queries and drafts. ~$0.10/M input tokens.",badge:"Fastest"}
  ],
  gpt4o:[
    {id:"o3",name:"o3",tier:"flagship",cost:"$$$",desc:"Strongest reasoning model. Math, logic, multi-step analysis, coding. ~$2/M input tokens.",badge:"Most capable"},
    {id:"o4-mini",name:"o4-mini",tier:"balanced",cost:"$$",desc:"Fast reasoning at lower cost. Outperforms o3-mini on most benchmarks. ~$1.10/M input tokens.",badge:"Best value"},
    {id:"gpt-5-mini",name:"GPT-5 Mini",tier:"fast",cost:"$",desc:"Lightweight multimodal. Quick tasks with image+text. ~$0.25/M input tokens.",badge:"Fast"}
  ],
  gemini:[
    {id:"gemini-3.1-pro",name:"Gemini 3.1 Pro",tier:"flagship",cost:"$$$",desc:"Google flagship. Complex tasks, data synthesis, 1M+ context window. ~$1.25/M input tokens.",badge:"Most capable"},
    {id:"gemini-3-flash",name:"Gemini 3 Flash",tier:"balanced",cost:"$$",desc:"Default Gemini model. Fast and capable for most tasks. ~$0.15/M input tokens.",badge:"Best value"},
    {id:"gemini-3.1-flash-lite",name:"Gemini 3.1 Flash Lite",tier:"fast",cost:"$",desc:"Fastest Gemini. Simple tasks, high volume. ~$0.075/M input tokens.",badge:"Fastest"}
  ],
  grok:[
    {id:"grok-4.20",name:"Grok 4.20",tier:"flagship",cost:"$$$",desc:"xAI flagship. Multi-agent capable, strong reasoning, real-time knowledge. SuperGrok / X Premium+.",badge:"Most capable"},
    {id:"grok-4.1-fast",name:"Grok 4.1 Fast",tier:"balanced",cost:"$$",desc:"High throughput, lower latency. Enterprise API. Good for everyday use.",badge:"Best value"},
    {id:"grok-3-mini",name:"Grok 3 Mini",tier:"fast",cost:"$",desc:"Lightweight reasoning. Cost-efficient logic tasks. Speed over depth.",badge:"Fastest"}
  ],
  mistral:[
    {id:"mistral-large-3",name:"Mistral Large 3",tier:"flagship",cost:"$$$",desc:"675B MoE (41B active). Complex reasoning, multilingual. ~$2/M input tokens.",badge:"Most capable"},
    {id:"mistral-small-4",name:"Mistral Small 4",tier:"balanced",cost:"$$",desc:"Unified instruct, reasoning, coding, and multimodal. 256K context. ~$0.40/M input tokens.",badge:"Best value"},
    {id:"mistral-small-3b",name:"Mistral 3B",tier:"fast",cost:"$",desc:"Dense 3B model. Edge-friendly, fast classification and drafts. ~$0.04/M input tokens.",badge:"Fastest"}
  ],
  llama:[
    {id:"llama-4-maverick",name:"Llama 4 Maverick",tier:"flagship",cost:"$$$",desc:"Meta flagship. 128 experts MoE, strong reasoning. Free/open-weight.",badge:"Most capable"},
    {id:"llama-4-scout",name:"Llama 4 Scout",tier:"balanced",cost:"$$",desc:"Efficient 17B active params. 10M token context. Free/open-weight.",badge:"Best value"},
    {id:"llama-3.3-70b",name:"Llama 3.3 70B",tier:"fast",cost:"$",desc:"Proven workhorse. Fast, widely deployed. Free/open-weight.",badge:"Popular"}
  ],
  perplexity:[
    {id:"sonar-reasoning-pro",name:"Sonar Reasoning Pro",tier:"flagship",cost:"$$$",desc:"Chain-of-thought search. Complex analytical research. ~$3/M input tokens.",badge:"Most capable"},
    {id:"sonar-pro",name:"Sonar Pro",tier:"balanced",cost:"$$",desc:"Deep context, broad retrieval. Research and synthesis. ~$3/M input tokens.",badge:"Best value"},
    {id:"sonar",name:"Sonar",tier:"fast",cost:"$",desc:"Lightweight search. Fast fact-checking, 1200 tok/s. ~$1/M input tokens.",badge:"Fastest"}
  ],
  copilot:[
    {id:"copilot-pro-plus",name:"Copilot Pro+",tier:"flagship",cost:"$$$",desc:"GPT-5.4 + Claude powered. Complex code gen, architecture, multi-model review.",badge:"Most capable"},
    {id:"copilot-pro",name:"Copilot Pro",tier:"balanced",cost:"$$",desc:"Standard Copilot with GPT-4o. Everyday code assistance.",badge:"Best value"},
    {id:"copilot-free",name:"Copilot Free",tier:"fast",cost:"$",desc:"Free tier. Basic code completion and chat. Limited monthly usage.",badge:"Free"}
  ],
  general:[
    {id:"flagship",name:"Flagship tier",tier:"flagship",cost:"$$$",desc:"Use the most capable model available. Best for complex, high-stakes tasks.",badge:"Most capable"},
    {id:"balanced",name:"Balanced tier",tier:"balanced",cost:"$$",desc:"Good balance of quality and cost. Suitable for most tasks.",badge:"Best value"},
    {id:"fast",name:"Fast / Light tier",tier:"fast",cost:"$",desc:"Fastest, cheapest option. Simple tasks, quick iterations.",badge:"Fastest"}
  ]
};

const TASKS={writing:{l:"Writing",i:"pen"},coding:{l:"Coding",i:"code"},analysis:{l:"Analysis",i:"chart"},brainstorm:{l:"Brainstorm",i:"lightbulb"},summarize:{l:"Summarize",i:"fileText"},translate:{l:"Translate",i:"globe"},image:{l:"Image Gen",i:"palette"},roleplay:{l:"Role / Persona",i:"theater"},email:{l:"Email / Comms",i:"mail"},learning:{l:"Learning",i:"book"},strategy:{l:"Strategy",i:"target"},debug:{l:"Debug / Troubleshoot",i:"microscope"},review:{l:"Review / Critique",i:"checkList"},decision:{l:"Decision Framework",i:"sliders"},persuade:{l:"Persuade / Negotiate",i:"bolt"}};

const INDUSTRIES={general:{l:"General",i:"target"},finance:{l:"Finance & Banking",i:"chart"},healthcare:{l:"Healthcare",i:"plus"},legal:{l:"Legal",i:"book"},marketing:{l:"Marketing & Ads",i:"speaker"},tech:{l:"Tech / SaaS",i:"code"},education:{l:"Education",i:"book"},ecommerce:{l:"E-commerce",i:"globe"},consulting:{l:"Consulting",i:"lightbulb"},realestate:{l:"Real Estate",i:"building"},media:{l:"Media & Content",i:"palette"},hr:{l:"HR & Recruiting",i:"users"},manufacturing:{l:"Manufacturing",i:"cpu"},government:{l:"Government",i:"building"},research:{l:"Research / R&D",i:"microscope"}};

const OUTPUTS={document:{l:"Document / Report",i:"fileText"},email:{l:"Email",i:"mail"},code:{l:"Code / Script",i:"code"},presentation:{l:"Presentation",i:"layout"},spreadsheet:{l:"Spreadsheet / Data",i:"chart"},social:{l:"Social Media Post",i:"speaker"},blog:{l:"Blog / Article",i:"pen"},proposal:{l:"Proposal / Pitch",i:"target"},brief:{l:"Brief / Summary",i:"fileText"},docs:{l:"Documentation",i:"book"},creative:{l:"Creative / Story",i:"palette"},checklist:{l:"Checklist / SOP",i:"checkList"}};

const STYLES={formal:{l:"Formal",i:"target"},conversational:{l:"Conversational",i:"speaker"},technical:{l:"Technical",i:"code"},persuasive:{l:"Persuasive",i:"bolt"},narrative:{l:"Narrative",i:"pen"},instructional:{l:"Instructional",i:"book"},analytical:{l:"Analytical",i:"chart"},minimalist:{l:"Minimalist",i:"ruler"}};

const TONES=[{v:"Professional",i:"target"},{v:"Casual",i:"speaker"},{v:"Academic",i:"book"},{v:"Creative",i:"palette"},{v:"Friendly",i:"seedling"},{v:"Authoritative",i:"bolt"},{v:"Empathetic",i:"users"}];
const LENGTHS=["Brief","Medium","Detailed","Comprehensive"];
const LEN_SUB={Brief:"200-400 words",Medium:"500-900 words",Detailed:"1000-1800 words",Comprehensive:"2000+ words"};
const LEN_BY_FILE={
  pdf:{Brief:"1 page",Medium:"2-3 pages",Detailed:"4-6 pages",Comprehensive:"8+ pages"},
  word:{Brief:"1 page",Medium:"2-3 pages",Detailed:"4-6 pages",Comprehensive:"8+ pages"},
  excel:{Brief:"1 sheet, 10-20 rows",Medium:"2-3 sheets, 30-50 rows",Detailed:"4-5 sheets, 50-100 rows",Comprehensive:"6+ sheets, 100+ rows"},
  ppt:{Brief:"5-8 slides",Medium:"10-15 slides",Detailed:"18-25 slides",Comprehensive:"30+ slides"},
  markdown:{Brief:"200-400 words",Medium:"500-900 words",Detailed:"1000-1800 words",Comprehensive:"2000+ words"},
  html:{Brief:"1 section, single view",Medium:"3-5 sections",Detailed:"6-10 sections with nav",Comprehensive:"Full multi-page site"},
  json:{Brief:"10-20 fields",Medium:"30-60 fields",Detailed:"80-150 fields",Comprehensive:"200+ fields, nested"},
  csv:{Brief:"10-20 rows",Medium:"30-50 rows",Detailed:"50-100 rows",Comprehensive:"100+ rows"},
  plaintext:{Brief:"200-400 words",Medium:"500-900 words",Detailed:"1000-1800 words",Comprehensive:"2000+ words"},
  codeFile:{Brief:"50-100 lines",Medium:"150-300 lines",Detailed:"400-700 lines",Comprehensive:"800+ lines"}
};
const getLenSub=(l,fo)=>(LEN_BY_FILE[fo]&&LEN_BY_FILE[fo][l])||LEN_SUB[l];
const FMTS={prose:{l:"Prose paragraphs",i:"pen"},bullets:{l:"Bullet points",i:"checkList"},numbered:{l:"Numbered steps",i:"ruler"},table:{l:"Tables / Matrices",i:"layout"},qa:{l:"Q&A format",i:"users"},headers:{l:"Sectioned with headers",i:"layers"},tldr:{l:"TL;DR + Detail",i:"fileText"},framework:{l:"Framework / Model",i:"brain"},flowchart:{l:"Flowchart / Decision tree",i:"sliders"},before_after:{l:"Before / After",i:"bolt"},pros_cons:{l:"Pros & Cons",i:"target"},scorecard:{l:"Scorecard / Rating",i:"chart"},annotated:{l:"Annotated examples",i:"lightbulb"}};

const FILE_OUTPUTS={none:{l:"No file (chat only)",i:"speaker"},pdf:{l:"PDF Document",i:"fileText"},word:{l:"Word / DOCX",i:"file"},excel:{l:"Excel / Spreadsheet",i:"chart"},ppt:{l:"PowerPoint / Slides",i:"layout"},markdown:{l:"Markdown (.md)",i:"hash"},html:{l:"HTML Page",i:"code"},json:{l:"JSON / Structured Data",i:"code"},csv:{l:"CSV / Data File",i:"chart"},plaintext:{l:"Plain Text",i:"fileText"},codeFile:{l:"Code File",i:"code"}};

const INCLUDES={exec_summary:{l:"Executive Summary",i:"fileText"},examples:{l:"Real-World Examples",i:"lightbulb"},sources:{l:"Source Citations",i:"book"},action_items:{l:"Action Items / Next Steps",i:"checkList"},risks:{l:"Risk Assessment",i:"target"},comparison:{l:"Comparison Table",i:"layout"},timeline:{l:"Timeline / Milestones",i:"ruler"},metrics:{l:"KPIs / Metrics",i:"chart"},glossary:{l:"Glossary / Definitions",i:"book"},visuals:{l:"Visual Descriptions",i:"palette"}};

const TECHS={cot:{l:"Chain of Thought",i:"brain"},fewshot:{l:"Few-Shot Examples",i:"layout"},constraints:{l:"Strict Constraints",i:"ruler"},selfcheck:{l:"Self-Verification",i:"target"},compare:{l:"Compare Options",i:"sliders"},iterative:{l:"Iterative Refine",i:"bolt"},roleplay:{l:"Role Assignment",i:"theater"},redteam:{l:"Red Team / Devil's Advocate",i:"microscope"},firstprinciples:{l:"First Principles Thinking",i:"lightbulb"},inversion:{l:"Inversion (Pre-mortem)",i:"chart"},multiagent:{l:"Multi-Perspective Panel",i:"users"},structured_debate:{l:"Structured Debate",i:"speaker"},systems:{l:"Systems Thinking",i:"sliders"},decompose:{l:"Task Decomposition",i:"layers"},meta:{l:"Meta-Reasoning",i:"brain"}};

const LANGS=["English","Spanish","French","German","Portuguese","Italian","Dutch","Norwegian","Swedish","Danish","Chinese","Japanese","Korean","Arabic","Hindi","Russian","Polish","Turkish"];

/* ═══════════════════════════════════════════════════════
   UI TRANSLATIONS — English (default) + Norwegian
   ═══════════════════════════════════════════════════════ */
const UI={
  // Nav & auth
  logIn:{en:"Log in",no:"Logg inn"},
  getStarted:{en:"Get started free",no:"Kom i gang gratis"},
  signOut:{en:"Sign out",no:"Logg ut"},
  proMember:{en:"Pro member",no:"Pro-medlem"},
  upgradePro:{en:"Upgrade to Pro",no:"Oppgrader til Pro"},
  referFriend:{en:"Refer a friend",no:"Inviter en venn"},
  manageSubscription:{en:"Manage subscription",no:"Administrer abonnement"},
  welcomeOffer:{en:"Use code WELCOME30 for 30% off your first month",no:"Bruk koden WELCOME30 for 30% avslag på første måned"},
  limitedOffer:{en:"Limited offer",no:"Begrenset tilbud"},
  promptHistory:{en:"Prompt History",no:"Prompthistorikk"},

  // Hero
  heroBadge:{en:"Smart Prompt Engineering",no:"Smart Prompt-utforming"},
  heroTitle1:{en:"Stop struggling with AI.",no:"Slutt å slite med AI."},
  heroTitle2:{en:"Start getting expert results.",no:"Få ekspertresultater."},
  heroSub:{en:"Your AI is only as smart as your prompt. Describe any goal and we inject strategy, structure, and domain expertise automatically -- so every AI interaction delivers.",no:"AI-en din er bare så smart som prompten din. Beskriv et mål, så legger vi til strategi, struktur og domenekunnskap automatisk -- slik at hver AI-interaksjon leverer."},
  trustedBy:{en:"Trusted by professionals",no:"Brukt av profesjonelle"},
  industryContexts:{en:"15 industry contexts",no:"15 bransjer"},
  modelsSupported:{en:"5 AI models supported",no:"5 AI-modeller"},

  // How it works
  step1t:{en:"Describe your goal",no:"Beskriv målet ditt"},
  step1s:{en:"Plain language, any topic",no:"Vanlig språk, hvilket som helst tema"},
  step2t:{en:"Get enhanced instantly",no:"Forbedres umiddelbart"},
  step2s:{en:"Strategy + expertise injected",no:"Strategi + ekspertise injisert"},
  step3t:{en:"Paste into any AI",no:"Lim inn i hvilken som helst AI"},
  step3s:{en:"ChatGPT, Claude, Gemini",no:"ChatGPT, Claude, Gemini"},

  // Value props
  vpTitle:{en:"Why professionals switch to Prompt Architect",no:"Hvorfor profesjonelle bytter til Prompt Architect"},
  vpSub:{en:"Stop wasting time on trial-and-error prompting. Get structured, expert-level results on the first try.",no:"Slutt å kaste bort tid på prøve-og-feile-prompting. Få strukturerte, ekspertnivå-resultater på første forsøk."},
  vp1t:{en:"Deep domain expertise",no:"Dyp domenekunnskap"},
  vp1d:{en:"15 industries with specialized context, terminology, and frameworks injected into every prompt.",no:"15 bransjer med spesialisert kontekst, terminologi og rammeverk i hver prompt."},
  vp2t:{en:"Smart enhancement engine",no:"Smart forbedringsmotor"},
  vp2d:{en:"Detects vague input and automatically adds audience targeting, scope, and reasoning strategies.",no:"Oppdager vag input og legger automatisk til målgruppe, omfang og resonnementstrategier."},
  vp3t:{en:"Multi-model optimization",no:"Multimodell-optimalisering"},
  vp3d:{en:"Prompts formatted specifically for Claude, ChatGPT, Gemini, Llama, or any model you use.",no:"Prompter formatert spesifikt for Claude, ChatGPT, Gemini, Llama eller hvilken som helst modell."},
  vp4t:{en:"Precision output control",no:"Presis utdatakontroll"},
  vp4d:{en:"Define tone, length, format, file type, and language. Get exactly what you need, not generic filler.",no:"Definer tone, lengde, format, filtype og språk. Få nøyaktig det du trenger."},
  vp5t:{en:"Firm & role context",no:"Firma- og rollekontekst"},
  vp5d:{en:"Expert mode injects real-world firm perspectives and role-specific expertise into your prompts.",no:"Ekspertmodus injiserer firmaperspektiver og rollespesifikk ekspertise i promptene dine."},
  vp6t:{en:"15 advanced techniques",no:"15 avanserte teknikker"},
  vp6d:{en:"Red teaming, first principles, systems thinking, and more. Built into your prompt with one click.",no:"Red teaming, førsteprinsipp-tenkning, systemtenkning og mer. Bygget inn med ett klikk."},

  // Comparison table
  compTitle:{en:"Manual prompting vs. Prompt Architect",no:"Manuell prompting vs. Prompt Architect"},
  compManual:{en:"Manual",no:"Manuell"},
  comp1:{en:["Domain expertise","Generic","15 industries deep"],no:["Domenekunnskap","Generisk","15 bransjer dyp"]},
  comp2:{en:["Audience targeting","Manual guess","Auto-detected"],no:["Målgruppe","Manuell gjetning","Automatisk"]},
  comp3:{en:["Model optimization","One-size-fits-all","Per-model formatting"],no:["Modelloptimalisering","En-størrelse-passer-alle","Per-modell formatering"]},
  comp4:{en:["Reasoning strategy","None","Auto-injected"],no:["Resonneringsstrategi","Ingen","Automatisk injisert"]},
  comp5:{en:["Output structure","Inconsistent","Precision control"],no:["Utdatastruktur","Inkonsekvent","Presisjonskontroll"]},
  comp6:{en:["Time per prompt","5-15 minutes","Under 30 seconds"],no:["Tid per prompt","5-15 minutter","Under 30 sekunder"]},

  // Use cases
  ucTitle:{en:"Built for how you actually work",no:"Bygget for måten du faktisk jobber"},
  ucSub:{en:"Professionals across industries use Prompt Architect to save hours every week.",no:"Profesjonelle på tvers av bransjer bruker Prompt Architect for å spare timer hver uke."},
  uc1r:{en:"Financial Analyst",no:"Finansanalytiker"},
  uc1t:{en:"Build DCF models and earnings analysis prompts with sector-specific frameworks",no:"Bygg DCF-modeller og inntektsanalyse-prompter med sektorspesifikke rammeverk"},
  uc2r:{en:"Software Engineer",no:"Programvareutvikler"},
  uc2t:{en:"Generate code review, debugging, and architecture prompts with best practices baked in",no:"Generer kodeanmeldelse, feilsøking og arkitektur-prompter med beste praksis innebygd"},
  uc3r:{en:"Marketing Lead",no:"Markedsansvarlig"},
  uc3t:{en:"Create campaign strategy and content briefs with audience targeting and channel insights",no:"Lag kampanjestrategi og innholdsbriefs med målgruppemålsetting og kanalinnsikt"},
  uc4r:{en:"Consultant",no:"Konsulent"},
  uc4t:{en:"Draft client deliverables, market analysis, and strategy decks with industry context",no:"Utkast til klientleveranser, markedsanalyse og strategidekker med bransjekontekst"},

  // Tool header & mode
  buildTitle:{en:"Build Your Prompt",no:"Bygg din prompt"},
  buildSub:{en:"Configure your settings. Get an expert-level prompt in seconds.",no:"Konfigurer innstillingene. Få en ekspertnivå-prompt på sekunder."},
  freeLeft:{en:"left",no:"igjen"},
  modeSimple:{en:"Simple",no:"Enkel"},
  modeExpert:{en:"Expert",no:"Ekspert"},
  modeSimpleDesc:{en:"15 task types, 15 industries, 10 AI models, smart enhancement",no:"15 oppgavetyper, 15 bransjer, 10 AI-modeller, smart forbedring"},
  modeExpertDesc:{en:"All of Simple + firm expertise, 15 reasoning techniques, file output",no:"Alt fra Enkel + firmaekspertise, 15 resonnementsteknikker, filutdata"},

  // History
  recentPrompts:{en:"Recent Prompts",no:"Nylige prompter"},

  // Step titles
  describeGoal:{en:"Describe your goal",no:"Beskriv målet ditt"},
  describeGoalSub:{en:"Be specific  -  but don't worry about being perfect. Smart enhancement fills the gaps.",no:"Vær spesifikk  -  men ikke bekymre deg for å være perfekt. Smart forbedring fyller hullene."},
  describeGoalPh:{en:"e.g. Analyze Apple's Q4 earnings and highlight key risks",no:"f.eks. Analyser Apples Q4-resultater og fremhev viktige risikoer"},
  taskType:{en:"Task type",no:"Oppgavetype"},
  industrySector:{en:"Industry / Sector",no:"Bransje / Sektor"},
  industrySectorSub:{en:"Injects domain-specific terminology, frameworks, and compliance requirements",no:"Injiserer domenespesifikk terminologi, rammeverk og krav"},
  outputType:{en:"Output type",no:"Utdatatype"},
  outputTypeSub:{en:"What deliverable format should the AI produce?",no:"Hvilket leveranseformat skal AI-en produsere?"},
  fileOutput:{en:"File output",no:"Filformat"},
  fileOutputSub:{en:"What file type should the AI format the response for?",no:"Hvilket filformat skal AI-en formatere svaret for?"},
  targetModel:{en:"Target AI model",no:"AI-modell"},
  subModelTitle:{en:"Model version",no:"Modellversjon"},
  subModelSub:{en:"Choose a specific model to optimize your prompt for. Higher-tier models handle more complexity but cost more tokens.",no:"Velg en spesifikk modell for å optimalisere prompten. Modeller på høyere nivå håndterer mer kompleksitet, men koster flere tokens."},
  tierFlagship:{en:"Flagship",no:"Flaggskip"},
  tierBalanced:{en:"Balanced",no:"Balansert"},
  tierFast:{en:"Fast",no:"Rask"},
  riskTitle:{en:"Risk level",no:"Risikoniva"},
  riskSub:{en:"How cautious and defensive should the output be",no:"Hvor forsiktig og defensiv bor outputen vare"},
  writingStyle:{en:"Writing style",no:"Skrivestil"},
  toneLabel:{en:"Tone",no:"Tone"},
  lengthLabel:{en:"Length",no:"Lengde"},
  responseFormat:{en:"Response format",no:"Responsformat"},
  responseFormatSub:{en:"Select one or more  -  they combine in the prompt",no:"Velg en eller flere  -  de kombineres i prompten"},
  languageLabel:{en:"Language",no:"Språk"},
  includeSections:{en:"Include sections",no:"Inkluder seksjoner"},
  includeSectionsSub:{en:"Select specific sections that must appear in the response",no:"Velg spesifikke seksjoner som må være med i svaret"},
  advTechniques:{en:"Advanced techniques",no:"Avanserte teknikker"},
  advTechniquesSub:{en:"Each adds a dedicated instruction block to the prompt",no:"Hver legger til en dedikert instruksjonsblokk i prompten"},
  targetAudience:{en:"Target audience",no:"Målgruppe"},
  targetAudienceSub:{en:"Override smart audience detection with a specific audience",no:"Overstyr smart målgruppesensing med en spesifikk målgruppe"},
  targetAudiencePh:{en:"e.g. Senior financial analysts with 5+ years experience",no:"f.eks. Seniore finansanalytikere med 5+ års erfaring"},
  addInstructions:{en:"Additional instructions",no:"Tilleggsinstruksjoner"},
  addInstructionsSub:{en:"Added verbatim as a final section",no:"Legges til ordrett som en siste seksjon"},
  addInstructionsPh:{en:"e.g. Use Cambria font with dark green (#003F2D) headers instead of the default palette",no:"f.eks. Bruk Cambria-font med morkegronne (#003F2D) overskrifter i stedet for standardpaletten"},
  specialReq:{en:"Special requests (optional)",no:"Spesielle ønsker (valgfritt)"},
  specialReqSub:{en:"Format, style, or content constraints",no:"Format-, stil- eller innholdsbegrensninger"},
  specialReqPh:{en:"e.g. Use bullet points, keep it under 500 words",no:"f.eks. Bruk punktlister, hold det under 500 ord"},

  // Quick-add chips
  chipRealExamples:{en:"Add real-world examples",no:"Legg til eksempler fra virkeligheten"},
  chipWalkthrough:{en:"Include a step-by-step walkthrough",no:"Inkluder en steg-for-steg gjennomgang"},
  chipCalc:{en:"Show calculations with formulas",no:"Vis beregninger med formler"},
  chipSWOT:{en:"Add a SWOT analysis",no:"Legg til en SWOT-analyse"},
  chipCompare:{en:"Compare 3+ options side by side",no:"Sammenlign 3+ alternativer side om side"},
  chipNoEmoji:{en:"No emojis",no:"Ingen emojis"},
  chipBullets:{en:"Bullet points only",no:"Kun punktlister"},
  chip500:{en:"Under 500 words",no:"Under 500 ord"},
  chipSources:{en:"Include sources",no:"Inkluder kilder"},
  chipTables:{en:"Use tables",no:"Bruk tabeller"},
  chipConcise:{en:"Be concise",no:"Vær kortfattet"},
  chipJargon:{en:"Avoid jargon",no:"Unngå fagspråk"},
  chipVisuals:{en:"Add visuals",no:"Legg til visualiseringer"},

  // Attachment checkbox
  attachTitle:{en:"I will attach files with this prompt",no:"Jeg vil legge ved filer med denne prompten"},
  attachOn:{en:"The prompt will instruct the AI to use your attached files as the primary data source. Recommended for best results with documents, spreadsheets, or datasets.",no:"Prompten vil instruere AI-en til å bruke vedlagte filer som primær datakilde. Anbefalt for beste resultater med dokumenter, regneark eller datasett."},
  attachOff:{en:"The prompt will focus entirely on generating content from the task description. Check this if you plan to upload files alongside the prompt in your AI tool.",no:"Prompten vil fokusere helt på å generere innhold fra oppgavebeskrivelsen. Kryss av her hvis du planlegger å laste opp filer sammen med prompten."},

  // Generate
  generateBtn:{en:"Generate Prompt",no:"Generer prompt"},
  upgradeGenerate:{en:"Upgrade to Generate",no:"Oppgrader for å generere"},
  freeSimple:{en:"free",no:"gratis"},
  createAccount:{en:"Create a free account to start generating",no:"Opprett en gratis konto for å begynne"},

  // Result
  smartBoost:{en:"smart boost",no:"smart forbedring"},
  smartBoosts:{en:"smart boosts",no:"smarte forbedringer"},
  shareBtn:{en:"Share",no:"Del"},
  copiedBtn:{en:"Copied",no:"Kopiert"},
  copyBtn:{en:"Copy",no:"Kopier"},
  newBtn:{en:"New",no:"Ny"},
  resultInfo:{en:"This prompt has been enhanced with smart audience targeting, reasoning strategies, and domain expertise based on your inputs. Copy it to Claude, ChatGPT, Gemini, or any AI model and paste it directly. The AI will understand the context and deliver better results than a generic prompt.",no:"Denne prompten er forbedret med smart målgruppemålsetting, resonnementstrategier og domenekunnskap basert på dine valg. Kopier den til Claude, ChatGPT, Gemini eller en hvilken som helst AI-modell. AI-en vil forstå konteksten og levere bedre resultater enn en generisk prompt."},
  watermarkNote:{en:"Copies include \"Generated with Prompt Architect\" attribution.",no:"Kopier inkluderer \"Generert med Prompt Architect\"-tilskrivning."},
  upgradeRemove:{en:"Upgrade to Pro",no:"Oppgrader til Pro"},
  removeIt:{en:"to remove it.",no:"for å fjerne den."},

  // Reset confirm
  resetTitle:{en:"Start a new prompt?",no:"Starte en ny prompt?"},
  resetMsg:{en:"This will clear all your current settings and start fresh.",no:"Dette vil slette alle dine nåværende innstillinger og starte på nytt."},
  resetYes:{en:"Yes, start fresh",no:"Ja, start på nytt"},
  resetNo:{en:"Cancel",no:"Avbryt"},

  // Auth modal
  signUp:{en:"Sign up",no:"Registrer deg"},
  loginTitle:{en:"Log in",no:"Logg inn"},
  signupTitle:{en:"Create your account",no:"Opprett din konto"},
  nameLabel:{en:"Name",no:"Navn"},
  emailLabel:{en:"Email",no:"E-post"},
  passwordLabel:{en:"Password",no:"Passord"},
  noAccount:{en:"Don't have an account?",no:"Har du ikke en konto?"},
  hasAccount:{en:"Already have an account?",no:"Har du allerede en konto?"},

  // Paywall
  unlockTitle:{en:"Unlock unlimited prompts",no:"Lås opp ubegrensede prompter"},
  monthly:{en:"Monthly",no:"Månedlig"},
  annual:{en:"Annual",no:"Årlig"},
  perMonth:{en:"/month",no:"/mnd"},
  perYear:{en:"/year",no:"/år"},
  saveBadge:{en:"Save 33%",no:"Spar 33%"},
  subscribe:{en:"Subscribe",no:"Abonner"},

  // Examples
  examplesTitle:{en:"Example prompts for inspiration",no:"Eksempelprompter for inspirasjon"},
  tryThis:{en:"Try this",no:"Prøv denne"},
  clear:{en:"Clear",no:"Fjern"},

  // Footer / newsletter
  nlTitle:{en:"Get smarter prompts in your inbox",no:"Få smartere prompter i innboksen"},
  nlSub:{en:"Weekly tips on AI prompt engineering. No spam.",no:"Ukentlige tips om AI-promptutforming. Ingen spam."},
  nlPlaceholder:{en:"Your email",no:"Din e-post"},
  nlButton:{en:"Subscribe",no:"Abonner"},
  nlSuccess:{en:"You're in! Check your inbox.",no:"Du er med! Sjekk innboksen."},
  nlExists:{en:"Already subscribed!",no:"Allerede abonnent!"},

  // Cookie banner
  cookieMsg:{en:"We use cookies for analytics to improve your experience. By continuing to use this site, you agree to our use of cookies.",no:"Vi bruker informasjonskapsler for analyse for å forbedre opplevelsen din. Ved å fortsette å bruke dette nettstedet, godtar du vår bruk av informasjonskapsler."},
  cookieAccept:{en:"Accept",no:"Godta"},
  cookieDecline:{en:"Decline",no:"Avvis"},

  // Firm/role selector
  selectFirm:{en:"Select a firm",no:"Velg et firma"},
  selectRole:{en:"Select a role",no:"Velg en rolle"},
  firmContext:{en:"Firm & role context",no:"Firma- og rollekontekst"},
  firmContextSub:{en:"Adopt a specific firm's methodology and role perspective",no:"Adopter et spesifikt firmas metodikk og rolleperspektiv"},

  // Lab
  labBtn:{en:"Lab",no:"Lab"},
  labTitle:{en:"Prompt Lab -- Finding Best Configuration",no:"Prompt Lab -- Finner beste konfigurasjon"},
  labLoading:{en:"Testing 3 strategies (~15-30s)...",no:"Tester 3 strategier (~15-30s)..."},
  labApply:{en:"Apply this config",no:"Bruk denne konfigurasjonen"},
  labWinner:{en:"Top scorer",no:"Beste resultat"},
  labStructured:{en:"Structured",no:"Strukturert"},
  labNarrative:{en:"Narrativ",no:"Narrativ"},
  labMeta:{en:"Meta-Reasoning",no:"Metaresonering"},
  labClarity:{en:"Clarity",no:"Klarhet"},
  labSpecificity:{en:"Specificity",no:"Spesifisitet"},
  labProfessionalism:{en:"Professionalism",no:"Profesjonalitet"},
  labActionability:{en:"Actionability",no:"Handlingsrettethet"},
  labStructure:{en:"Structure",no:"Struktur"},
  labTotal:{en:"Total",no:"Totalt"},
  labPreview:{en:"Preview",no:"Forhandsvisning"},
  labError:{en:"Something went wrong. Please try again.",no:"Noe gikk galt. Vennligst prov igjen."},
};

// Translated labels for data constants
const UI_TASKS={
  writing:{en:"Writing",no:"Skriving"},coding:{en:"Coding",no:"Koding"},analysis:{en:"Analysis",no:"Analyse"},brainstorm:{en:"Brainstorm",no:"Idedugnad"},summarize:{en:"Summarize",no:"Oppsummering"},translate:{en:"Translate",no:"Oversettelse"},image:{en:"Image Gen",no:"Bildegenerering"},roleplay:{en:"Role / Persona",no:"Rolle / Persona"},email:{en:"Email / Comms",no:"E-post / Komm."},learning:{en:"Learning",no:"Læring"},strategy:{en:"Strategy",no:"Strategi"},debug:{en:"Debug / Troubleshoot",no:"Feilsøking"},review:{en:"Review / Critique",no:"Vurdering / Kritikk"},decision:{en:"Decision Framework",no:"Beslutningsrammeverk"},persuade:{en:"Persuade / Negotiate",no:"Overtale / Forhandle"}
};
const UI_INDUSTRIES={
  general:{en:"General",no:"Generelt"},finance:{en:"Finance & Banking",no:"Finans og bank"},healthcare:{en:"Healthcare",no:"Helsevesen"},legal:{en:"Legal",no:"Juss"},marketing:{en:"Marketing & Ads",no:"Markedsføring og reklame"},tech:{en:"Tech / SaaS",no:"Teknologi / SaaS"},education:{en:"Education",no:"Utdanning"},ecommerce:{en:"E-commerce",no:"Netthandel"},consulting:{en:"Consulting",no:"Konsulentvirksomhet"},realestate:{en:"Real Estate",no:"Eiendom"},media:{en:"Media & Content",no:"Media og innhold"},hr:{en:"HR & Recruiting",no:"HR og rekruttering"},manufacturing:{en:"Manufacturing",no:"Produksjon"},government:{en:"Government",no:"Offentlig sektor"},research:{en:"Research / R&D",no:"Forskning / FoU"}
};
const UI_OUTPUTS={
  document:{en:"Document / Report",no:"Dokument / Rapport"},email:{en:"Email",no:"E-post"},code:{en:"Code / Script",no:"Kode / Skript"},presentation:{en:"Presentation",no:"Presentasjon"},spreadsheet:{en:"Spreadsheet / Data",no:"Regneark / Data"},social:{en:"Social Media Post",no:"Innlegg i sosiale medier"},blog:{en:"Blog / Article",no:"Blogg / Artikkel"},proposal:{en:"Proposal / Pitch",no:"Forslag / Pitch"},brief:{en:"Brief / Summary",no:"Brief / Sammendrag"},docs:{en:"Documentation",no:"Dokumentasjon"},creative:{en:"Creative / Story",no:"Kreativt / Fortelling"},checklist:{en:"Checklist / SOP",no:"Sjekkliste / SOP"}
};
const UI_STYLES={
  formal:{en:"Formal",no:"Formell"},conversational:{en:"Conversational",no:"Uformell"},technical:{en:"Technical",no:"Teknisk"},persuasive:{en:"Persuasive",no:"Overbevisende"},narrative:{en:"Narrative",no:"Fortellende"},instructional:{en:"Instructional",no:"Instruksjonell"},analytical:{en:"Analytical",no:"Analytisk"},minimalist:{en:"Minimalist",no:"Minimalistisk"}
};
const UI_TONES={
  Professional:{en:"Professional",no:"Profesjonell"},Casual:{en:"Casual",no:"Uformell"},Academic:{en:"Academic",no:"Akademisk"},Creative:{en:"Creative",no:"Kreativ"},Friendly:{en:"Friendly",no:"Vennlig"},Authoritative:{en:"Authoritative",no:"Autoritær"},Empathetic:{en:"Empathetic",no:"Empatisk"}
};
const UI_LENGTHS={
  Brief:{en:"Brief",no:"Kort"},Medium:{en:"Medium",no:"Middels"},Detailed:{en:"Detailed",no:"Detaljert"},Comprehensive:{en:"Comprehensive",no:"Omfattende"}
};
const RISK_LEVELS={low:"low",medium:"medium",high:"high"};
const UI_RISK={
  low:{en:"Low Risk",no:"Lav risiko"},medium:{en:"Medium Risk",no:"Middels risiko"},high:{en:"High Risk",no:"Kritisk"}
};
const UI_FMTS={
  prose:{en:"Prose paragraphs",no:"Prosaparagrafer"},bullets:{en:"Bullet points",no:"Punktlister"},numbered:{en:"Numbered steps",no:"Nummererte steg"},table:{en:"Tables / Matrices",no:"Tabeller / Matriser"},qa:{en:"Q&A format",no:"Spørsmål og svar"},headers:{en:"Sectioned with headers",no:"Seksjonert med overskrifter"},tldr:{en:"TL;DR + Detail",no:"TL;DR + Detalj"},framework:{en:"Framework / Model",no:"Rammeverk / Modell"},flowchart:{en:"Flowchart / Decision tree",no:"Flytskjema / Beslutningstre"},before_after:{en:"Before / After",no:"Før / Etter"},pros_cons:{en:"Pros & Cons",no:"Fordeler og ulemper"},scorecard:{en:"Scorecard / Rating",no:"Poengkort / Vurdering"},annotated:{en:"Annotated examples",no:"Annoterte eksempler"}
};
const UI_FILE_OUTPUTS={
  none:{en:"No file (chat only)",no:"Ingen fil (kun chat)"},pdf:{en:"PDF Document",no:"PDF-dokument"},word:{en:"Word / DOCX",no:"Word / DOCX"},excel:{en:"Excel / Spreadsheet",no:"Excel / Regneark"},ppt:{en:"PowerPoint / Slides",no:"PowerPoint / Lysbilder"},markdown:{en:"Markdown (.md)",no:"Markdown (.md)"},html:{en:"HTML Page",no:"HTML-side"},json:{en:"JSON / Structured Data",no:"JSON / Strukturerte data"},csv:{en:"CSV / Data File",no:"CSV / Datafil"},plaintext:{en:"Plain Text",no:"Ren tekst"},codeFile:{en:"Code File",no:"Kodefil"}
};
const UI_INCLUDES={
  exec_summary:{en:"Executive Summary",no:"Sammendrag"},examples:{en:"Real-World Examples",no:"Eksempler fra virkeligheten"},sources:{en:"Source Citations",no:"Kildehenvisninger"},action_items:{en:"Action Items / Next Steps",no:"Handlingspunkter / Neste steg"},risks:{en:"Risk Assessment",no:"Risikovurdering"},comparison:{en:"Comparison Table",no:"Sammenligningstabell"},timeline:{en:"Timeline / Milestones",no:"Tidslinje / Milepaler"},metrics:{en:"KPIs / Metrics",no:"KPI-er / Metrikker"},glossary:{en:"Glossary / Definitions",no:"Ordliste / Definisjoner"},visuals:{en:"Visual Descriptions",no:"Visuelle beskrivelser"}
};
const UI_TECHS={
  cot:{en:"Chain of Thought",no:"Tankerekke"},fewshot:{en:"Few-Shot Examples",no:"Få-skudd eksempler"},constraints:{en:"Strict Constraints",no:"Strenge begrensninger"},selfcheck:{en:"Self-Verification",no:"Selvverifisering"},compare:{en:"Compare Options",no:"Sammenlign alternativer"},iterative:{en:"Iterative Refine",no:"Iterativ forbedring"},roleplay:{en:"Role Assignment",no:"Rolletildeling"},redteam:{en:"Red Team / Devil's Advocate",no:"Rødt team / Djevelens advokat"},firstprinciples:{en:"First Principles Thinking",no:"Førsteprinsipp-tenkning"},inversion:{en:"Inversion (Pre-mortem)",no:"Inversjon (Pre-mortem)"},multiagent:{en:"Multi-Perspective Panel",no:"Multiperspektivpanel"},structured_debate:{en:"Structured Debate",no:"Strukturert debatt"},systems:{en:"Systems Thinking",no:"Systemtenkning"},decompose:{en:"Task Decomposition",no:"Oppgavenedbrytning"},meta:{en:"Meta-Reasoning",no:"Metaresonering"}
};

/* ═══════════════════════════════════════════════════════
   SECTOR FIRMS & ROLES — Expert mode company/role selection
   Format: Industry > Firm > Role
   ═══════════════════════════════════════════════════════ */
const SECTOR_FIRMS={
  finance:{
    firms:{
      goldman:{name:"Goldman Sachs",roles:["Investment Banking Analyst","Equity Research Associate","Quantitative Strategist","Risk Manager","Private Wealth Advisor"]},
      jpmorgan:{name:"JP Morgan",roles:["M&A Analyst","Credit Risk Analyst","Asset Management Associate","Payments Strategist","Chief Investment Officer"]},
      blackrock:{name:"BlackRock",roles:["Portfolio Manager","ETF Strategist","ESG Analyst","Factor Research Analyst","Multi-Asset Strategist"]},
      morganstanley:{name:"Morgan Stanley",roles:["Equity Analyst","Fixed Income Trader","Wealth Management Director","Capital Markets Associate","Institutional Sales"]},
      citadel:{name:"Citadel / Hedge Fund",roles:["Quantitative Researcher","Portfolio Manager","Risk Analyst","Macro Strategist","Systematic Trader"]}
    }
  },
  tech:{
    firms:{
      google:{name:"Google / Alphabet",roles:["Staff Software Engineer","Product Manager","ML Research Scientist","Site Reliability Engineer","UX Lead"]},
      apple:{name:"Apple",roles:["Senior iOS Engineer","Hardware Product Manager","Privacy Engineer","Design Lead","Platform Architect"]},
      microsoft:{name:"Microsoft",roles:["Cloud Solutions Architect","Principal Engineer","AI Product Manager","DevOps Lead","Enterprise Strategist"]},
      meta:{name:"Meta / Facebook",roles:["Infrastructure Engineer","Growth Product Manager","AI Research Scientist","Ads Platform Lead","VR/AR Strategist"]},
      amazon:{name:"Amazon / AWS",roles:["Principal Engineer","AWS Solutions Architect","Supply Chain Analyst","Marketplace Strategist","Data Scientist"]}
    }
  },
  healthcare:{
    firms:{
      mckinsey_health:{name:"McKinsey Health",roles:["Healthcare Consultant","Pharma Strategy Lead","Hospital Operations Analyst","Digital Health Advisor","Pricing & Market Access"]},
      pfizer:{name:"Pfizer",roles:["Clinical Research Director","Regulatory Affairs Manager","Medical Science Liaison","Drug Safety Officer","Commercial Strategy Lead"]},
      unitedhealth:{name:"UnitedHealth Group",roles:["Population Health Analyst","Benefits Strategist","Provider Relations Director","Claims Analytics Lead","Value-Based Care Designer"]},
      jnj:{name:"Johnson & Johnson",roles:["Medical Device Product Manager","Clinical Operations Lead","R&D Portfolio Manager","Quality Assurance Director","Global Marketing Manager"]},
      mayo:{name:"Mayo Clinic",roles:["Clinical Researcher","Department Chair","Quality Improvement Lead","Patient Experience Director","Health Informatics Specialist"]}
    }
  },
  legal:{
    firms:{
      sullivan:{name:"Sullivan & Cromwell",roles:["M&A Associate","Securities Litigator","Capital Markets Partner","Regulatory Compliance Counsel","Restructuring Advisor"]},
      skadden:{name:"Skadden Arps",roles:["Corporate Associate","Antitrust Counsel","Tax Planning Partner","FCPA Investigator","IPO Specialist"]},
      kirkland:{name:"Kirkland & Ellis",roles:["Private Equity Counsel","Restructuring Partner","IP Litigator","Fund Formation Associate","Trial Attorney"]},
      wachtell:{name:"Wachtell Lipton",roles:["M&A Partner","Corporate Governance Advisor","Hostile Defense Strategist","Executive Compensation Counsel","Activism Response Lead"]},
      latham:{name:"Latham & Watkins",roles:["Finance Associate","Environmental Counsel","Tech Transactions Partner","Healthcare Regulatory","Project Finance Lead"]}
    }
  },
  marketing:{
    firms:{
      wpp:{name:"WPP / Ogilvy",roles:["Creative Director","Brand Strategist","Media Planner","Digital Performance Lead","Consumer Insights Analyst"]},
      mckinsey_mktg:{name:"McKinsey Marketing",roles:["Growth Strategy Consultant","Customer Analytics Lead","Brand Equity Advisor","Pricing Strategist","Go-to-Market Designer"]},
      hubspot:{name:"HubSpot",roles:["Inbound Marketing Strategist","Content Marketing Lead","Marketing Automation Specialist","CRM Strategist","Growth Marketer"]},
      nike_mktg:{name:"Nike Marketing",roles:["Brand Campaign Director","Sports Marketing Manager","Digital Experience Lead","Influencer Strategy","Consumer Engagement Director"]},
      google_ads:{name:"Google Ads",roles:["Performance Marketing Lead","Search Strategy Analyst","Display & Video Planner","Analytics Consultant","Attribution Specialist"]}
    }
  },
  consulting:{
    firms:{
      mckinsey:{name:"McKinsey & Company",roles:["Engagement Manager","Associate Partner","Implementation Lead","Digital Transformation Advisor","Operations Consultant"]},
      bcg:{name:"Boston Consulting Group",roles:["Project Leader","Principal","Strategy Consultant","Digital Ventures Lead","Pricing Expert"]},
      bain:{name:"Bain & Company",roles:["Case Team Leader","Results Delivery Lead","Private Equity Advisor","Customer Strategy Consultant","Performance Improvement Expert"]},
      deloitte:{name:"Deloitte",roles:["Managing Director","Strategy & Analytics Lead","M&A Transaction Advisor","Risk Advisory Partner","Human Capital Consultant"]},
      accenture:{name:"Accenture",roles:["Technology Strategy Lead","Cloud Transformation Director","Industry X Lead","Change Management Partner","AI & Analytics Consultant"]}
    }
  },
  education:{
    firms:{
      harvard:{name:"Harvard University",roles:["Professor","Research Fellow","Curriculum Designer","Department Chair","Teaching Innovation Lead"]},
      coursera:{name:"Coursera / EdTech",roles:["Learning Designer","Content Strategist","Assessment Specialist","Platform Product Manager","Learner Success Lead"]},
      mckinsey_edu:{name:"McKinsey Education",roles:["Education Consultant","Policy Advisor","EdTech Strategist","Workforce Development Lead","Digital Learning Expert"]},
      pearson:{name:"Pearson",roles:["Editorial Director","Assessment Designer","Digital Learning Architect","Higher Ed Strategist","Content Development Lead"]},
      mit:{name:"MIT",roles:["Research Scientist","Lab Director","Open Learning Designer","Innovation Fellow","Technical Instructor"]}
    }
  },
  ecommerce:{
    firms:{
      amazon_ec:{name:"Amazon",roles:["Category Manager","Marketplace Strategist","Supply Chain Analyst","Advertising Specialist","Customer Experience Lead"]},
      shopify:{name:"Shopify",roles:["Merchant Success Lead","Platform Architect","Payments Strategist","App Ecosystem Manager","Growth Advisor"]},
      alibaba:{name:"Alibaba Group",roles:["Cross-Border Trade Specialist","Logistics Optimization Lead","Merchant Solutions Architect","Data Commerce Analyst","Global Expansion Strategist"]},
      nike_ec:{name:"Nike Direct",roles:["DTC Strategy Lead","Digital Merchandiser","CRM & Loyalty Manager","Omnichannel Director","Personalization Engineer"]},
      zalando:{name:"Zalando",roles:["Fashion Tech Lead","Marketplace Operations Manager","Sustainability Strategist","Fulfillment Optimization Lead","Partner Commerce Director"]}
    }
  },
  realestate:{
    firms:{
      cbre:{name:"CBRE Group",roles:["Investment Sales Broker","Valuation Analyst","Capital Markets Advisor","Property Manager","Research Director"]},
      brookfield:{name:"Brookfield Asset Mgmt",roles:["Acquisitions Associate","Asset Manager","Development Director","Fund Strategist","Portfolio Analyst"]},
      blackstone_re:{name:"Blackstone Real Estate",roles:["Senior Associate","Portfolio Operations","Debt Origination Lead","Value-Add Strategist","Investor Relations"]},
      jll:{name:"JLL",roles:["Tenant Rep Broker","Corporate Solutions Lead","Sustainability Advisor","Technology Consultant","Workplace Strategist"]},
      prologis:{name:"Prologis",roles:["Logistics Real Estate Analyst","Development Manager","Leasing Director","ESG Lead","Capital Deployment Strategist"]}
    }
  },
  media:{
    firms:{
      netflix:{name:"Netflix",roles:["Content Strategist","Programming Director","Data Science Lead","International Expansion Manager","Creator Relations"]},
      disney:{name:"Disney / ESPN",roles:["Franchise Strategy Lead","Streaming Product Manager","IP Licensing Director","Creative Development Executive","Audience Insights Analyst"]},
      nytimes:{name:"New York Times",roles:["Digital Strategy Editor","Subscription Growth Lead","Investigative Reporter","Audience Development Director","Product Innovation Manager"]},
      spotify:{name:"Spotify",roles:["Podcast Strategy Lead","Playlist Curator","Ad Platform Strategist","Creator Marketplace Manager","Audio ML Engineer"]},
      google_media:{name:"YouTube / Google Media",roles:["Creator Economy Analyst","Ad Revenue Strategist","Content Policy Lead","Platform Growth Manager","Shorts Strategy Lead"]}
    }
  },
  hr:{
    firms:{
      mckinsey_org:{name:"McKinsey Org Practice",roles:["Organizational Design Consultant","Talent Strategy Lead","Change Management Advisor","Leadership Development Expert","Culture Transformation Lead"]},
      workday:{name:"Workday",roles:["HCM Solution Architect","People Analytics Lead","Benefits Strategy Consultant","Talent Acquisition Technologist","Workforce Planning Analyst"]},
      mercer:{name:"Mercer",roles:["Total Rewards Consultant","Executive Compensation Advisor","Workforce Strategy Lead","M&A HR Due Diligence","Health & Benefits Actuary"]},
      linkedin_hr:{name:"LinkedIn Talent",roles:["Talent Insights Analyst","Employer Brand Strategist","Recruiting Innovation Lead","Skills Intelligence Manager","Labor Market Economist"]},
      google_hr:{name:"Google People Ops",roles:["People Analytics Lead","Culture & Engagement Manager","Diversity & Inclusion Strategist","Organizational Effectiveness Lead","Compensation Analyst"]}
    }
  },
  manufacturing:{
    firms:{
      toyota:{name:"Toyota (TPS)",roles:["Lean Manufacturing Expert","Quality Engineer","Production System Lead","Supply Chain Optimizer","Continuous Improvement Manager"]},
      siemens:{name:"Siemens",roles:["Digital Twin Engineer","Factory Automation Lead","Industry 4.0 Strategist","Process Optimization Analyst","Smart Manufacturing Consultant"]},
      ge:{name:"GE / General Electric",roles:["Industrial IoT Architect","Six Sigma Black Belt","Asset Performance Manager","Predictive Maintenance Lead","Supply Chain Director"]},
      tesla_mfg:{name:"Tesla Manufacturing",roles:["Gigafactory Engineer","Battery Production Lead","Automation Specialist","Manufacturing Process Designer","Vertical Integration Strategist"]},
      bosch:{name:"Bosch",roles:["Connected Industry Lead","Quality Systems Manager","R&D Project Manager","Sensor Technology Specialist","Production Excellence Coach"]}
    }
  },
  government:{
    firms:{
      mckinsey_gov:{name:"McKinsey Public Sector",roles:["Public Sector Consultant","Digital Government Advisor","Defense Strategy Analyst","Health Policy Expert","Infrastructure Planning Lead"]},
      deloitte_gov:{name:"Deloitte Government",roles:["Federal Strategy Consultant","Cybersecurity Advisor","Program Management Lead","Policy Analytics Specialist","Grant Management Expert"]},
      world_bank:{name:"World Bank",roles:["Development Economist","Infrastructure Finance Specialist","Governance Advisor","Climate Policy Analyst","Social Protection Expert"]},
      un:{name:"United Nations",roles:["Policy Analyst","Sustainable Development Advisor","Humanitarian Coordinator","Data & Statistics Officer","Peacekeeping Strategist"]},
      rand:{name:"RAND Corporation",roles:["Defense Analyst","Policy Researcher","National Security Strategist","Health Policy Researcher","Education Policy Analyst"]}
    }
  },
  research:{
    firms:{
      deepmind:{name:"DeepMind / Google AI",roles:["Research Scientist","ML Engineer","Safety Researcher","Principal Investigator","Research Program Manager"]},
      mit_research:{name:"MIT Labs",roles:["Principal Investigator","Postdoctoral Researcher","Lab Director","Research Engineer","Technology Transfer Lead"]},
      nature:{name:"Nature / Academic Publishing",roles:["Senior Editor","Peer Review Coordinator","Research Integrity Officer","Data Science Editor","Open Access Strategist"]},
      nih:{name:"NIH / National Institutes",roles:["Program Director","Grant Review Officer","Clinical Trial Manager","Biostatistician","Translational Research Lead"]},
      bell_labs:{name:"Bell Labs / Industrial R&D",roles:["Distinguished Researcher","Innovation Director","Applied Physics Lead","Systems Research Manager","Patent Strategy Advisor"]}
    }
  }
};

/* ═══════════════════════════════════════════════════════
   DEEP KNOWLEDGE — Industry, Role, Methodology, Quality
   ═══════════════════════════════════════════════════════ */
const IND_CONTEXT={
  general:"",
  finance:"You operate within the financial services industry. Use standard financial terminology (EBITDA, DCF, IRR, NPV, P/E, WACC, etc.). Reference recognized frameworks (GAAP/IFRS, Basel III, SEC guidelines). Be precise with numbers  -  always specify units, time periods, and currencies. Distinguish between audited figures and estimates. Flag any regulatory compliance considerations. Use industry-standard valuation and risk assessment methodologies.",
  healthcare:"You operate within healthcare. Use proper medical terminology (ICD codes, clinical nomenclature) while remaining accessible to the stated audience. Reference evidence-based practices, clinical guidelines (WHO, NIH, CDC), and peer-reviewed research. Be meticulous with HIPAA/data privacy considerations. Always note that clinical decisions should involve qualified professionals. Distinguish between clinical evidence levels (meta-analyses vs. case studies).",
  legal:"You operate within the legal profession. Use precise legal terminology and cite relevant statutes, regulations, or case law where applicable. Note jurisdictional variations. Structure arguments with clear legal reasoning (IRAC: Issue, Rule, Application, Conclusion). Flag areas where legal counsel should be consulted. Distinguish between settled law, emerging precedent, and legal opinion.",
  marketing:"You operate in marketing and advertising. Use current marketing terminology (CAC, LTV, ROAS, conversion funnel, attribution). Reference data-driven strategies and current platform best practices. Consider brand voice consistency, audience segmentation, and channel-specific optimization. Include measurable KPIs for every recommendation. Reference current consumer behavior trends and competitive positioning.",
  tech:"You operate in the technology / SaaS industry. Use current technical terminology accurately. Reference industry-standard architectures, protocols, and best practices. Consider scalability, security, maintainability, and performance implications. Cite official documentation where relevant. Distinguish between stable and emerging technologies. Address technical debt and migration considerations.",
  education:"You operate in education. Apply pedagogical best practices (Bloom's taxonomy, UDL, scaffolded learning). Consider diverse learning styles and accessibility needs. Reference current educational standards and research. Design for measurable learning outcomes. Include formative assessment checkpoints.",
  ecommerce:"You operate in e-commerce and digital retail. Use industry metrics (AOV, conversion rate, cart abandonment, CLV). Reference platform-specific best practices (Shopify, WooCommerce, headless commerce). Consider UX/UI, mobile-first design, payment flows, and logistics. Address SEO, merchandising, and personalization strategies.",
  consulting:"You operate as a management consultant. Use structured problem-solving frameworks (MECE, hypothesis-driven, issue trees). Present findings with the pyramid principle (conclusion first, supporting evidence below). Quantify impact wherever possible. Provide implementation roadmaps with clear ownership and timelines. Address stakeholder management.",
  realestate:"You operate in real estate. Use industry terminology (cap rate, NOI, GRM, comps, basis points). Reference market analysis methodologies, zoning regulations, and financing structures. Consider market cycles, demographic trends, and regulatory environment. Provide comparative market analyses where relevant.",
  media:"You operate in media and content production. Consider audience engagement metrics, platform algorithms, content lifecycle, and distribution strategies. Reference current content trends, SEO best practices, and multi-platform optimization. Address brand safety, editorial standards, and content governance.",
  hr:"You operate in human resources and talent management. Reference current employment law, DEI best practices, and organizational psychology. Use HR terminology (ATS, EVP, engagement scores, turnover rates). Consider compliance, employee experience, and labor market dynamics. Address both strategic HR and operational needs.",
  manufacturing:"You operate in manufacturing and industrial operations. Use industry terminology (OEE, Six Sigma, lean, kaizen, MTBF). Reference quality standards (ISO 9001, ISO 14001). Consider supply chain optimization, safety regulations (OSHA), and continuous improvement frameworks. Address Industry 4.0 and IoT considerations.",
  government:"You operate in the public sector / government. Reference relevant regulatory frameworks, compliance requirements, and public policy standards. Use clear, accessible language appropriate for public communication. Consider transparency, accountability, and stakeholder engagement. Address procurement, budgetary constraints, and inter-agency coordination.",
  research:"You operate in academic or R&D research. Use rigorous scientific methodology and appropriate statistical frameworks. Reference peer-reviewed literature and established research paradigms. Clearly distinguish between hypotheses, findings, and interpretations. Address reproducibility, limitations, and ethical considerations. Follow discipline-specific citation and reporting standards."
};

/* ═══════════════════════════════════════════════════════
   INDUSTRY TYPOGRAPHY & COLOR STANDARDS
   Based on actual deliverable standards at top-tier firms.
   Injected into file output formatting for sector-authentic docs.
   ═══════════════════════════════════════════════════════ */
const IND_STYLE={
  general:{
    label:"Professional Standard",
    fonts:{primary:"Arial",secondary:"Calibri",data:"Arial",mono:"Consolas"},
    colors:{primary:"#1B2A4A",secondary:"#4472C4",accent:"#0891B2",text:"#333333",muted:"#666666",headerBg:"#1B2A4A",headerText:"#FFFFFF",altRow:"#F8F9FA",border:"#D0D5DD",negative:"#CC0000",positive:"#006100"},
    ref:"General professional standard"
  },
  finance:{
    label:"Investment Banking Standard (Goldman Sachs / J.P. Morgan)",
    fonts:{primary:"Garamond",secondary:"Arial",data:"Arial",mono:"Consolas"},
    colors:{primary:"#00205B",secondary:"#003DA5",accent:"#B4975A",text:"#333333",muted:"#666666",headerBg:"#00205B",headerText:"#FFFFFF",altRow:"#F5F6F8",border:"#C4C8D0",negative:"#CC0000",positive:"#006100"},
    ref:"Goldman Sachs pitch books, J.P. Morgan equity research"
  },
  tech:{
    label:"Tech Industry Standard (Google / Microsoft)",
    fonts:{primary:"Segoe UI",secondary:"Roboto",data:"Roboto",mono:"Roboto Mono"},
    colors:{primary:"#1A73E8",secondary:"#4285F4",accent:"#0078D4",text:"#202124",muted:"#5F6368",headerBg:"#1A73E8",headerText:"#FFFFFF",altRow:"#F8F9FA",border:"#DADCE0",negative:"#D93025",positive:"#1E8E3E"},
    ref:"Google documentation, Microsoft corporate reports"
  },
  healthcare:{
    label:"Healthcare / Pharma Standard (Pfizer / Mayo Clinic)",
    fonts:{primary:"Noto Sans",secondary:"Arial",data:"Arial",mono:"Consolas"},
    colors:{primary:"#0058A3",secondary:"#00857C",accent:"#1B365D",text:"#333333",muted:"#666666",headerBg:"#0058A3",headerText:"#FFFFFF",altRow:"#F4F8FB",border:"#C8D6E0",negative:"#CC0000",positive:"#00857C"},
    ref:"Pfizer reports, Mayo Clinic publications, FDA submission style"
  },
  legal:{
    label:"Legal Standard (White-Shoe Law Firms)",
    fonts:{primary:"Times New Roman",secondary:"Book Antiqua",data:"Arial",mono:"Courier New"},
    colors:{primary:"#002855",secondary:"#1C2B39",accent:"#8B0000",text:"#000000",muted:"#555555",headerBg:"#002855",headerText:"#FFFFFF",altRow:"#F7F8F9",border:"#C0C5CC",negative:"#8B0000",positive:"#2E5A1E"},
    ref:"Sullivan & Cromwell, Skadden Arps, Kirkland & Ellis memo formatting"
  },
  marketing:{
    label:"Marketing / Advertising Standard (Ogilvy / Nike)",
    fonts:{primary:"Helvetica Neue",secondary:"Futura",data:"Arial",mono:"Consolas"},
    colors:{primary:"#000000",secondary:"#E60012",accent:"#FF6600",text:"#1A1A1A",muted:"#555555",headerBg:"#1A1A1A",headerText:"#FFFFFF",altRow:"#F5F5F5",border:"#D0D0D0",negative:"#CC0000",positive:"#2D8C3C"},
    ref:"WPP / Ogilvy strategy decks, Nike brand guidelines"
  },
  consulting:{
    label:"Strategy Consulting Standard (McKinsey / BCG / Bain)",
    fonts:{primary:"Helvetica Neue",secondary:"Georgia",data:"Arial",mono:"Consolas"},
    colors:{primary:"#003865",secondary:"#2FB551",accent:"#CC0000",text:"#000000",muted:"#666666",headerBg:"#003865",headerText:"#FFFFFF",altRow:"#F5F7F9",border:"#C8CDD4",negative:"#CC0000",positive:"#2FB551"},
    ref:"McKinsey slide decks, BCG strategy reports, Bain case presentations"
  },
  education:{
    label:"Academic Institution Standard (Harvard / MIT)",
    fonts:{primary:"EB Garamond",secondary:"Helvetica",data:"Arial",mono:"Courier New"},
    colors:{primary:"#A51C30",secondary:"#002147",accent:"#8C1515",text:"#333333",muted:"#666666",headerBg:"#A51C30",headerText:"#FFFFFF",altRow:"#FAF7F7",border:"#D4C5C7",negative:"#CC0000",positive:"#2E5A1E"},
    ref:"Harvard case studies, MIT course materials, university press standards"
  },
  ecommerce:{
    label:"E-Commerce Standard (Amazon / Shopify)",
    fonts:{primary:"Arial",secondary:"Calibri",data:"Arial",mono:"Consolas"},
    colors:{primary:"#232F3E",secondary:"#FF9900",accent:"#146EB4",text:"#0F1111",muted:"#565959",headerBg:"#232F3E",headerText:"#FFFFFF",altRow:"#F7F8F9",border:"#D5D9D9",negative:"#B12704",positive:"#007600"},
    ref:"Amazon shareholder letters, AWS whitepapers, Shopify reports"
  },
  realestate:{
    label:"Commercial Real Estate Standard (CBRE / JLL)",
    fonts:{primary:"Calibri",secondary:"Arial",data:"Arial",mono:"Consolas"},
    colors:{primary:"#003F2D",secondary:"#00A34E",accent:"#002A3A",text:"#333333",muted:"#666666",headerBg:"#003F2D",headerText:"#FFFFFF",altRow:"#F4F8F6",border:"#B8CABE",negative:"#CC0000",positive:"#00A34E"},
    ref:"CBRE market reports, JLL research, Brookfield investor materials"
  },
  media:{
    label:"Media / Entertainment Standard (Netflix / Disney)",
    fonts:{primary:"Gotham",secondary:"Avenir",data:"Arial",mono:"Consolas"},
    colors:{primary:"#E50914",secondary:"#003DA5",accent:"#1A1A2E",text:"#141414",muted:"#666666",headerBg:"#141414",headerText:"#FFFFFF",altRow:"#F5F5F5",border:"#D0D0D0",negative:"#E50914",positive:"#2D8C3C"},
    ref:"Netflix corporate reports, Disney investor presentations, NYT formatting"
  },
  hr:{
    label:"Human Capital Standard (Mercer / Workday)",
    fonts:{primary:"Helvetica Neue",secondary:"Calibri",data:"Calibri",mono:"Consolas"},
    colors:{primary:"#002C77",secondary:"#0062E3",accent:"#005EB8",text:"#333333",muted:"#666666",headerBg:"#002C77",headerText:"#FFFFFF",altRow:"#F2F6FC",border:"#B8C8E0",negative:"#D0271D",positive:"#006100"},
    ref:"Mercer compensation surveys, Workday reports, ADP benchmarking"
  },
  manufacturing:{
    label:"Industrial / Manufacturing Standard (Siemens / Bosch)",
    fonts:{primary:"Arial",secondary:"Calibri",data:"Arial",mono:"Consolas"},
    colors:{primary:"#009999",secondary:"#005691",accent:"#EA0016",text:"#333333",muted:"#666666",headerBg:"#009999",headerText:"#FFFFFF",altRow:"#F2FAFA",border:"#B0D4D4",negative:"#EA0016",positive:"#007000"},
    ref:"Siemens technical documentation, Bosch spec sheets, ISO document standards"
  },
  government:{
    label:"Public Sector Standard (World Bank / United Nations)",
    fonts:{primary:"Open Sans",secondary:"Roboto",data:"Arial",mono:"Consolas"},
    colors:{primary:"#002244",secondary:"#4B92DB",accent:"#F7941D",text:"#333333",muted:"#666666",headerBg:"#002244",headerText:"#FFFFFF",altRow:"#F4F7FB",border:"#B8C8D8",negative:"#CC0000",positive:"#006100"},
    ref:"World Bank publications, UN reports, RAND Corporation formatting"
  },
  research:{
    label:"Academic Research Standard (Nature / NIH / DeepMind)",
    fonts:{primary:"Times New Roman",secondary:"Helvetica",data:"Helvetica",mono:"Courier New"},
    colors:{primary:"#C2372E",secondary:"#20639B",accent:"#003366",text:"#333333",muted:"#666666",headerBg:"#003366",headerText:"#FFFFFF",altRow:"#F5F7FA",border:"#C0C8D4",negative:"#CC0000",positive:"#2E7D32"},
    ref:"Nature journal formatting, NIH grant standards, arXiv paper conventions"
  }
};

const ROLE_DEEP={
  writing:"a senior professional writer and content strategist with 15+ years crafting compelling narratives, persuasive copy, and audience-tailored content across industries",
  coding:"a principal software engineer and architect with deep expertise across languages, design patterns, testing, and production-grade systems",
  analysis:"a senior analyst and strategic consultant with expertise in quantitative/qualitative research, statistical reasoning, and structured decision frameworks",
  brainstorm:"a creative strategist and innovation consultant combining design thinking, lateral thinking, and structured ideation frameworks",
  summarize:"an expert editor and information architect specializing in distilling complex material into clear, accurate, well-structured summaries",
  translate:"a professional translator with native fluency, deep cultural understanding, and domain-specific terminology expertise",
  image:"an expert AI image prompt engineer with deep knowledge of composition, lighting, color theory, and model-specific syntax (Midjourney, DALL-E, SD, Flux)",
  roleplay:"a skilled domain expert capable of embodying specific personas with authentic voice and consistent character",
  email:"a professional communications specialist expert in business writing, persuasion psychology, and stakeholder management",
  learning:"an expert educator applying Bloom's taxonomy, scaffolded learning, and active recall techniques",
  strategy:"a senior strategy partner at a top-tier consulting firm (McKinsey/BCG/Bain caliber) with 20+ years advising C-suite executives on market entry, competitive positioning, M&A, and organizational transformation",
  debug:"a principal engineer and incident commander with deep expertise in root cause analysis, systematic debugging methodologies, and production system troubleshooting across distributed architectures",
  review:"a senior editorial director and quality assurance lead who has reviewed thousands of documents, codebases, and deliverables with a forensic eye for gaps, inconsistencies, and missed opportunities",
  decision:"a decision science expert combining behavioral economics, game theory, and structured decision analysis (multi-criteria, decision trees, scenario modeling) to help leaders make high-stakes choices under uncertainty",
  persuade:"a master negotiator and communications strategist trained in principled negotiation (Harvard PON), influence psychology (Cialdini), and stakeholder management across cultures and power dynamics"
};

const METHODOLOGY={
  writing:["Open with a compelling hook that immediately captures reader attention","Structure with a clear narrative arc: setup  >  development  >  resolution","Support every claim with concrete examples, data points, or anecdotes","Vary sentence length and structure for rhythm and readability","Use precise transitions that create logical flow between sections","Close with a memorable conclusion reinforcing the core message with a clear call-to-action"],
  coding:["PLAN FIRST: Before writing any code, analyze the full scope. List files affected, dependencies between them, risk level of each change (low/medium/high), and the safest execution order. Present this plan before proceeding.","Execute the plan in the order specified. Start with low-risk changes, then medium, then high-risk.","Write clean, idiomatic code following the language's official style guide","Include comprehensive inline comments explaining non-obvious decisions","Add proper error handling, input validation, and edge case coverage","Provide usage examples and integration guidance","Suggest testing strategies, note performance trade-offs and security considerations"],
  analysis:["Lead with an executive summary stating the key finding or recommendation","Define scope, methodology, data sources, assumptions, and limitations","Apply established frameworks appropriate to the domain","Support every claim with specific data points or cited reasoning","Address counterarguments, risks, and alternative interpretations","Present comparative analysis using structured formats","Conclude with prioritized, actionable recommendations and clear next steps","Distinguish between facts, estimates, and opinions throughout"],
  brainstorm:["Generate ideas across multiple categories without self-censoring","For each idea: clear title, 2-3 sentence description, why it could work","Organize by feasibility (low/med/high), impact (low/med/high), effort required","Include both safe/incremental and bold/unconventional ideas","Identify combinations or synergies between ideas","Highlight top 3 recommendations with detailed reasoning"],
  summarize:["Open with a single-sentence overview of the core message","Organize key points by importance, not source order","Preserve critical nuances, caveats, and conditions","Use direct, concrete language  -  zero filler","Include any action items, deadlines, or decisions","Note what was intentionally omitted and why"],
  translate:["Preserve meaning, tone, and intent  -  not just literal words","Adapt idioms to culturally equivalent expressions","Maintain consistent terminology for domain-specific terms","Flag ambiguous terms or untranslatable concepts","Preserve original formatting and structure"],
  image:["Specify subject with precise vivid detail","Define artistic style explicitly","Include lighting direction and quality","Specify camera angle and lens if photographic","Add color palette and mood descriptors","Include negative prompts to exclude unwanted elements"],
  roleplay:["Establish persona background, expertise, and communication style","Define knowledge boundaries","Maintain consistent voice throughout","React authentically based on persona domain expertise"],
  email:["Lead with a clear subject line that communicates purpose immediately","Put key ask or information first  -  don't bury it","Keep paragraphs short (2-3 sentences) for mobile readability","End with specific, time-bound call to action","Include relevant context needed to take action"],
  learning:["Assess starting knowledge and build from there","Scaffold from simple to complex","Use 2-3 real-world analogies per major concept","Include understanding checks with practice questions","Address common misconceptions explicitly","Summarize and suggest next steps for deeper learning"],
  strategy:["PLAN FIRST: Before developing strategy, map the full landscape. Identify key variables, stakeholders, dependencies, and risk areas. Outline your analytical approach before executing it.","Define the strategic question precisely - what decision must be made and by when","Map the competitive landscape: who are the players, what are their positions, what are the dynamics","Analyze internal capabilities vs. market requirements using structured frameworks (SWOT, Porter's Five Forces, Value Chain)","Develop 2-3 distinct strategic options with clear logic for each","Stress-test each option: What must be true for this to work? What could kill it?","Build an implementation roadmap with phases, milestones, resource requirements, and decision gates","Define success metrics and early warning indicators"],
  debug:["PLAN FIRST: Before debugging, map the system. List all components involved, their dependencies, recent changes, and risk areas. Classify each area as low/medium/high risk for the reported issue. Start investigation with the highest-probability cause.","Reproduce and isolate - define exact symptoms, when they started, what changed","Form hypotheses ranked by likelihood and ease of testing","Systematically eliminate causes using binary search / divide-and-conquer","Trace the full execution path from input to failure point","Identify root cause vs. symptoms - ask 'why' five times","Document the fix, the reasoning, and preventive measures","Define monitoring/alerting to catch recurrence early"],
  review:["PLAN FIRST: Before reviewing, define your evaluation framework. List what you will assess, in what order, and what constitutes pass/fail for each dimension. Present this framework before starting the review.","Do a structural review first: is the architecture/organization sound?","Then detail review: accuracy, completeness, consistency, edge cases","Identify what's missing - gaps are often more important than errors","Rate severity of each finding (critical / important / minor / nice-to-have)","Provide specific, actionable improvement suggestions for each finding","Summarize overall assessment with a clear recommendation (approve / revise / reject)"],
  decision:["Frame the decision precisely: what are we choosing between, and what are the constraints?","Identify all stakeholders and their priorities - who gains, who loses, who has veto power?","Define evaluation criteria and weight them by importance","Map each option against criteria with evidence-based scoring","Analyze risks, reversibility, and second-order consequences for each option","Apply relevant decision frameworks (expected value, regret minimization, optionality)","Make a clear recommendation with confidence level and conditions for revisiting"],
  persuade:["Understand the audience deeply: what do they care about, fear, and aspire to?","Lead with their interests, not yours - frame everything in terms of what they gain","Build credibility through evidence, social proof, and demonstrated expertise","Address objections before they raise them - steelmanning shows respect and confidence","Use concrete examples and stories - humans are persuaded by narrative, not just logic","Create urgency without manipulation - real consequences, real timelines","Close with a clear, specific ask and make it easy to say yes"]
};

const QUALITY={
  writing:"Every paragraph must have a clear purpose. No filler. Every claim needs evidence. Match readability to the audience level.",
  coding:"Code must be syntactically correct, follow DRY/SOLID principles, handle edge cases, and be production-ready.",
  analysis:"Every conclusion must trace to evidence. Separate correlation from causation. State confidence levels. Quantify impact.",
  brainstorm:"Ideas must be specific and actionable  -  not vague platitudes. Each should be distinct. Include at least one unconventional angle.",
  summarize:"Summary must stand alone. A reader who only reads it should understand all key points. Zero unnecessary words.",
  translate:"A native speaker should not detect it was translated. Preserve nuance, humor, and cultural context.",
  image:"Prompt should produce consistent, reproducible results. Zero ambiguity in composition and style.",
  roleplay:"Persona must feel authentic. Maintain consistency. Responses reflect genuine domain expertise.",
  email:"Must accomplish its goal in a single read. No ambiguity about expected action. Professional enough to forward to anyone.",
  learning:"Learner should be able to teach the concept to someone else after reading.",
  strategy:"Every recommendation must be defensible in a board-level presentation. Quantify impact. Name specific risks. No hand-waving.",
  debug:"Root cause must be identified, not just symptoms treated. Every hypothesis must be testable. Fix must be verified.",
  review:"Feedback must be specific and actionable - never vague. Every criticism must include a concrete improvement suggestion.",
  decision:"Decision framework must be transparent and reproducible. Someone else using the same framework should reach the same conclusion.",
  persuade:"Arguments must be logically sound AND emotionally resonant. Every claim backed by evidence. No manipulation or bad-faith tactics."
};

const TONE_INST={Professional:"Polished, business-appropriate language. Direct. Avoid slang. Project competence.",Casual:"Conversational  -  like explaining to a smart friend. Contractions OK. Still accurate.",Academic:"Precise scholarly language. Cite reasoning. Hedge when uncertain. Follow academic structure.",Creative:"Vivid, evocative. Metaphors, unexpected choices, varied rhythm. Prioritize engagement.",Friendly:"Warm, encouraging, inclusive. Use 'we/let's'. Reassure. Make reader feel supported.",Authoritative:"Confident, declarative statements. Back every assertion with evidence. Command of subject.",Empathetic:"Acknowledge perspective/emotions. Validate before solving. Gentle with difficult information."};

const STYLE_INST={formal:"Use formal register throughout. Complete sentences. No contractions. Structured paragraphs with topic sentences. Professional vocabulary.",conversational:"Write naturally as if speaking. Contractions encouraged. Short sentences mixed with longer ones. Rhetorical questions OK. Avoid stiff phrasing.",technical:"Precise technical vocabulary. Define terms on first use. Logical structure. Code examples where relevant. Cite specifications and documentation.",persuasive:"Lead with strongest argument. Use social proof, data, and emotional appeal strategically. Address objections proactively. Strong call to action.",narrative:"Tell a story. Use characters, scenes, tension, and resolution. Show don't tell. Vivid sensory details. Clear narrative arc.",instructional:"Step-by-step. Action verbs to start each instruction. Anticipate mistakes. Include tips and warnings. Test understanding at intervals.",analytical:"Data-driven. Present evidence before conclusions. Use frameworks and structured comparisons. Quantify wherever possible. Objective tone.",minimalist:"Maximum clarity, minimum words. Short sentences. No decoration. Every word must earn its place. White space between ideas."};

const OUTPUT_INST={document:"Structure as a professional document with title, sections, and clear hierarchy. Include table of contents for longer pieces.",email:"Format as a ready-to-send email with subject line, greeting, body, and sign-off. Optimize for mobile reading.",code:"Present as clean, runnable code with comments, imports, and usage examples. Specify language and dependencies.",presentation:"Structure as slide-ready content: title slide, key sections (3-5 bullets max per slide), speaker notes for each slide.",spreadsheet:"Structure as a multi-tab professional workbook. Each tab has a single analytical purpose. Include title blocks, clearly labeled sections, formula-driven calculations (never hardcoded values), and summary rows. Use consistent number formatting, input cell highlighting, and conditional formatting for status indicators. Design for auditability: every number must trace to a source or formula. NEVER display N/A or None in any cell; leave empty cells blank or remove the column if all values are unavailable. Zero values must show as blank, never as 0 or $0. Unit qualifiers (NOK '000, USD millions) go in a small subtitle cell below the title, never inline. Enforce strict uniform row heights (22px headers, 18px data) and consistent column padding throughout.",social:"Format for the target platform's constraints (character limits, hashtag conventions). Include hook, body, CTA.",blog:"Include headline, meta description, introduction, subheaded sections, conclusion, and suggested tags/categories.",proposal:"Executive summary, problem statement, proposed solution, timeline, budget/pricing, team, and terms.",brief:"One-page format: objective, background, key findings, recommendations. Use bullet points for scannability.",docs:"Technical documentation format: overview, prerequisites, step-by-step guide, API reference if applicable, troubleshooting.",creative:"Focus on narrative quality, voice, and emotional impact. Follow genre conventions while finding a fresh angle.",checklist:"Numbered or checkbox-style steps. Group by phase/category. Include responsible party and deadline columns if relevant."};

/* ═══════════════════════════════════════════════════════
   EXAMPLE PROMPTS — Creative, sector-specific inspiration
   ═══════════════════════════════════════════════════════ */
const EXAMPLES=[
  // FINANCE (5)
  {sector:"Finance",label:"DCF Valuation Model",topic:"Build a financial model comparing DCF valuations for a sustainable energy startup across bull/base/bear scenarios. Include sensitivities on capex, electricity prices, and battery cost learning curves. Target audience: equity research analysts.",task:"analysis",industry:"finance",output:"spreadsheet",model:"claude",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"excel",includes:["metrics","comparison","exec_summary"],techs:["cot","decompose","systems"]},
  {sector:"Finance",label:"Short Seller Thesis",topic:"Write a short seller research report on a high-multiple SaaS company showing signs of revenue quality deterioration. Analyze deferred revenue trends, customer churn signals, and insider selling patterns. Present as a hedge fund investment memo.",task:"writing",industry:"finance",output:"document",model:"claude",style:"formal",tone:"Professional",len:"Long",fileOutput:"pdf",includes:["examples","sources","action_items"],techs:["cot","constraints","selfcheck"]},
  {sector:"Finance",label:"Sector Rotation Strategy",topic:"Analyze which equity sectors are best positioned for a late-cycle environment with persistent inflation. Compare energy, financials, healthcare, and utilities using relative valuation, earnings momentum, and macro sensitivity. Include specific ETF and stock picks.",task:"strategy",industry:"finance",output:"document",model:"general",style:"formal",tone:"Professional",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","metrics","risks"],techs:["systems","firstprinciples","decompose"]},
  {sector:"Finance",label:"Earnings Call Analysis",topic:"Summarize and analyze the key takeaways from a major bank's Q4 earnings call. Focus on NII guidance, credit quality trends, capital return plans, and management tone vs. prior quarters. Highlight what the market might be missing.",task:"summarize",industry:"finance",output:"document",model:"chatgpt",style:"analytical",tone:"Professional",len:"Long",fileOutput:"pdf",includes:["exec_summary","examples","glossary"],techs:["cot","decompose","constraints"]},
  {sector:"Finance",label:"Risk Factor Decomposition",topic:"Build a multi-factor risk model for a Nordic equity portfolio. Decompose returns into market beta, size, value, momentum, and quality factors. Identify which factor exposures are intentional vs. accidental and recommend rebalancing actions.",task:"analysis",industry:"finance",output:"spreadsheet",model:"claude",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"excel",includes:["metrics","comparison","exec_summary"],techs:["cot","decompose","systems"]},

  // TECH (5)
  {sector:"Tech",label:"System Architecture",topic:"Design a distributed task queue system that handles 10M daily jobs, with priorities, retries, and guaranteed-once execution. Explain trade-offs between Redis-based and database-backed queues.",task:"coding",industry:"tech",output:"document",model:"claude",style:"technical",tone:"Professional",len:"Long",fileOutput:"pdf",includes:["examples","glossary","sources"],techs:["decompose","constraints","selfcheck"]},
  {sector:"Tech",label:"AI Product Roadmap",topic:"Propose a 6-month AI product roadmap for a B2B SaaS company: what early features unlock the most user value while being technically achievable? Include go-to-market angles and pricing strategy.",task:"strategy",industry:"tech",output:"proposal",model:"chatgpt",style:"formal",tone:"Authoritative",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","metrics","risks"],techs:["systems","firstprinciples","decompose"]},
  {sector:"Tech",label:"Technical Due Diligence",topic:"Conduct a technical due diligence assessment for acquiring a 50-person startup. Evaluate their codebase quality, infrastructure scalability, technical debt, team capabilities, and integration complexity. What are the dealbreakers?",task:"review",industry:"tech",output:"document",model:"claude",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"pdf",includes:["metrics","comparison","risks"],techs:["selfcheck","compare","redteam"]},
  {sector:"Tech",label:"API Rate Limiter",topic:"Implement a distributed rate limiter using Redis that supports sliding window, token bucket, and fixed window algorithms. Must handle 100K requests/sec across multiple nodes. Include monitoring and graceful degradation.",task:"coding",industry:"tech",output:"code",model:"claude",style:"technical",tone:"Professional",len:"Long",fileOutput:"codeFile",includes:["examples","glossary","sources"],techs:["decompose","constraints","selfcheck"]},
  {sector:"Tech",label:"Cloud Cost Optimization",topic:"Analyze a company spending $2M/year on AWS. Identify the top 10 cost optimization opportunities across compute, storage, data transfer, and reserved capacity. Quantify expected savings for each recommendation.",task:"analysis",industry:"tech",output:"spreadsheet",model:"general",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"excel",includes:["metrics","comparison","exec_summary"],techs:["cot","decompose","systems"]},

  // MARKETING (5)
  {sector:"Marketing",label:"Brand Positioning",topic:"Develop a positioning strategy for a D2C coffee brand competing against Nespresso and Blue Bottle. What's the emotional hook that justifies premium pricing? Include brand voice guidelines and messaging hierarchy.",task:"writing",industry:"marketing",output:"proposal",model:"chatgpt",style:"formal",tone:"Professional",len:"Long",fileOutput:"pdf",includes:["examples","sources","action_items"],techs:["cot","constraints","selfcheck"]},
  {sector:"Marketing",label:"Product Launch Tactics",topic:"Brainstorm 10 unconventional product launch tactics for a fintech app targeting Gen Z investors. Budget: $50K. The more creative and viral-worthy the better. Include expected CAC and reach estimates.",task:"brainstorm",industry:"marketing",output:"document",model:"general",style:"conversational",tone:"Creative",len:"Medium",fileOutput:"pdf",includes:["examples","comparison","risks"],techs:["multiagent","firstprinciples","compare"]},
  {sector:"Marketing",label:"Attribution Model",topic:"Design a multi-touch attribution model for an e-commerce company running paid search, social, email, and influencer campaigns. Compare last-click, linear, time-decay, and data-driven approaches. Recommend the best fit.",task:"analysis",industry:"marketing",output:"document",model:"claude",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"pdf",includes:["metrics","comparison","exec_summary"],techs:["cot","decompose","systems"]},
  {sector:"Marketing",label:"Content Strategy",topic:"Create a 90-day content marketing strategy for a B2B cybersecurity company targeting CISOs. Include content pillars, distribution channels, SEO keywords, and conversion funnel mapping. Define KPIs for each stage.",task:"strategy",industry:"marketing",output:"document",model:"chatgpt",style:"formal",tone:"Authoritative",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","metrics","risks"],techs:["systems","firstprinciples","decompose"]},
  {sector:"Marketing",label:"Competitive Teardown",topic:"Conduct a competitive marketing teardown of the top 3 stock trading apps (Robinhood, Webull, eToro). Analyze their positioning, messaging, ad creative, social presence, and app store optimization. What gaps can a new entrant exploit?",task:"analysis",industry:"marketing",output:"document",model:"claude",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"pdf",includes:["metrics","comparison","exec_summary"],techs:["cot","decompose","systems"]},

  // LEGAL (5)
  {sector:"Legal",label:"EU AI Act Compliance",topic:"Analyze what EU AI Act compliance means for a US-based company providing computer vision APIs to insurance companies in Europe. What changes are needed to product, documentation, and governance?",task:"analysis",industry:"legal",output:"document",model:"general",style:"analytical",tone:"Authoritative",len:"Comprehensive",fileOutput:"pdf",includes:["metrics","comparison","exec_summary"],techs:["cot","decompose","systems"]},
  {sector:"Legal",label:"M&A Contract Strategy",topic:"Outline a contract negotiation strategy for acquiring a competitor. What key terms protect the buyer if post-close integration fails? Cover earn-outs, reps & warranties, indemnification caps, and MAC clauses.",task:"writing",industry:"legal",output:"document",model:"claude",style:"formal",tone:"Authoritative",len:"Long",fileOutput:"pdf",includes:["examples","sources","action_items"],techs:["cot","constraints","selfcheck"]},
  {sector:"Legal",label:"IP Due Diligence",topic:"Create an IP due diligence checklist for a tech acquisition. Cover patents, trade secrets, open-source license compliance, employee invention assignments, and third-party IP risks. Flag the top 5 dealbreaker scenarios.",task:"review",industry:"legal",output:"checklist",model:"claude",style:"analytical",tone:"Authoritative",len:"Comprehensive",fileOutput:"pdf",includes:["metrics","comparison","risks"],techs:["selfcheck","compare","redteam"]},
  {sector:"Legal",label:"SEC Filing Analysis",topic:"Analyze the risk factors section of a major tech company's 10-K filing. Identify which risks are boilerplate vs. company-specific, which have materialized in the past year, and what new risks are conspicuously absent.",task:"analysis",industry:"legal",output:"document",model:"general",style:"analytical",tone:"Authoritative",len:"Comprehensive",fileOutput:"pdf",includes:["metrics","comparison","exec_summary"],techs:["cot","decompose","systems"]},
  {sector:"Legal",label:"Regulatory Strategy",topic:"Develop a regulatory strategy for a crypto exchange seeking licensing in the US, EU, and Singapore. Compare regulatory frameworks, compliance costs, timeline, and strategic sequencing. Which jurisdiction first and why?",task:"strategy",industry:"legal",output:"proposal",model:"claude",style:"formal",tone:"Authoritative",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","metrics","risks"],techs:["systems","firstprinciples","decompose"]},

  // HEALTHCARE (5)
  {sector:"Healthcare",label:"Clinical Trial Summary",topic:"Summarize the clinical trial data and real-world outcomes for GLP-1 receptor agonists in managing type 2 diabetes and obesity. Compare efficacy, safety profiles, and cost-effectiveness of semaglutide vs. tirzepatide.",task:"summarize",industry:"healthcare",output:"document",model:"general",style:"analytical",tone:"Professional",len:"Long",fileOutput:"pdf",includes:["exec_summary","examples","glossary"],techs:["cot","decompose","constraints"]},
  {sector:"Healthcare",label:"Hospital Ops Optimization",topic:"Design a patient flow optimization strategy for an emergency department experiencing 4+ hour wait times. Use lean methodology and queuing theory. Include staffing models, triage improvements, and technology recommendations.",task:"strategy",industry:"healthcare",output:"document",model:"claude",style:"formal",tone:"Professional",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","metrics","risks"],techs:["systems","firstprinciples","decompose"]},
  {sector:"Healthcare",label:"Pharma Market Access",topic:"Build a market access strategy for launching a novel gene therapy priced at $2.1M per treatment. Address payer negotiations, outcomes-based contracting, patient access programs, and the health economics argument.",task:"strategy",industry:"healthcare",output:"proposal",model:"claude",style:"formal",tone:"Professional",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","metrics","risks"],techs:["systems","firstprinciples","decompose"]},
  {sector:"Healthcare",label:"Digital Health ROI",topic:"Evaluate the ROI of implementing an AI-powered clinical decision support system across a 500-bed hospital network. Quantify impact on diagnostic accuracy, length of stay, readmission rates, and physician burnout.",task:"analysis",industry:"healthcare",output:"spreadsheet",model:"chatgpt",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"excel",includes:["metrics","comparison","exec_summary"],techs:["cot","decompose","systems"]},
  {sector:"Healthcare",label:"Biotech Pipeline Review",topic:"Review and rank a mid-cap biotech company's drug pipeline by probability-adjusted NPV. Consider phase of development, competitive landscape, patent cliff timing, and potential partnership value for each asset.",task:"review",industry:"healthcare",output:"document",model:"claude",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"pdf",includes:["metrics","comparison","risks"],techs:["selfcheck","compare","redteam"]},

  // EDUCATION (5)
  {sector:"Education",label:"Business Strategy Course",topic:"Create a semester-long course outline for teaching business strategy using real case studies from Netflix, Tesla, and LVMH. Move beyond theory to develop students' ability to diagnose competitive dynamics and make real decisions.",task:"learning",industry:"education",output:"document",model:"claude",style:"formal",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","timeline","action_items"],techs:["decompose","fewshot","cot"]},
  {sector:"Education",label:"Statistical Thinking",topic:"Design a lesson teaching statistical thinking to non-technical managers. They need to understand p-values, confidence intervals, sample size, and A/B testing without heavy math. Use business examples throughout.",task:"learning",industry:"education",output:"document",model:"chatgpt",style:"instructional",tone:"Friendly",len:"Medium",fileOutput:"pdf",includes:["examples","visuals","glossary"],techs:["fewshot","cot","decompose"]},
  {sector:"Education",label:"Financial Literacy Program",topic:"Design a 4-week financial literacy program for college seniors entering the workforce. Cover budgeting, investing basics, 401k optimization, tax planning, and avoiding common financial mistakes. Make it engaging, not preachy.",task:"learning",industry:"education",output:"document",model:"general",style:"conversational",tone:"Friendly",len:"Long",fileOutput:"pdf",includes:["examples","action_items","timeline"],techs:["fewshot","decompose","cot"]},
  {sector:"Education",label:"Case Method Workshop",topic:"Create a teaching guide for running Harvard-style case discussions in a graduate business program. Include how to write cold-call questions, manage airtime, handle wrong answers gracefully, and synthesize toward key takeaways.",task:"writing",industry:"education",output:"document",model:"claude",style:"instructional",tone:"Professional",len:"Long",fileOutput:"pdf",includes:["examples","action_items","glossary"],techs:["fewshot","roleplay","decompose"]},
  {sector:"Education",label:"Executive Education Design",topic:"Design a 3-day executive education program on AI strategy for C-suite leaders. They need to make investment decisions about AI without understanding the technical details. Focus on frameworks, not code.",task:"strategy",industry:"education",output:"proposal",model:"chatgpt",style:"formal",tone:"Authoritative",len:"Long",fileOutput:"pdf",includes:["examples","timeline","action_items"],techs:["decompose","firstprinciples","cot"]},

  // EDUCATION — Exam Prep & Study (12)
  {sector:"Education",label:"Behavioural Finance Summary",topic:"Create a comprehensive exam summary for a Behavioural Finance course. Cover prospect theory, mental accounting, overconfidence bias, herding behaviour, disposition effect, anchoring, market anomalies, and limits to arbitrage. Include key formulas, real-world examples for each bias, and exam-style practice questions with answers.",task:"summarize",industry:"finance",output:"document",model:"claude",style:"technical",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","glossary","comparison"],techs:["cot","fewshot","decompose"]},
  {sector:"Education",label:"Corporate Finance Formulas",topic:"Build a complete formula sheet and concept summary for a Corporate Finance exam. Cover NPV, IRR, WACC, CAPM, Modigliani-Miller propositions, dividend policy, capital structure, option pricing (Black-Scholes), and merger valuation. For each formula: definition, when to use it, common exam pitfalls, and a worked numerical example.",task:"summarize",industry:"finance",output:"document",model:"claude",style:"technical",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","glossary","visuals"],techs:["decompose","constraints","fewshot"]},
  {sector:"Education",label:"International Finance Review",topic:"Summarize all key topics for an International Financial Management exam. Cover interest rate parity, purchasing power parity, forward premiums, currency hedging (forwards, futures, options, swaps), cross-border capital budgeting, political risk, and the international Fisher effect. Include diagrams of parity relationships and practice calculations.",task:"summarize",industry:"finance",output:"document",model:"chatgpt",style:"technical",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","comparison","visuals"],techs:["cot","decompose","fewshot"]},
  {sector:"Education",label:"Financial Statement Analysis",topic:"Create a structured study guide for a Financial Statement Analysis exam. Cover ratio analysis (liquidity, profitability, leverage, efficiency), DuPont decomposition, cash flow analysis, earnings quality, off-balance-sheet items, and red flags for manipulation. Include a worked case study analyzing a real company's financial statements step by step.",task:"summarize",industry:"finance",output:"document",model:"claude",style:"analytical",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","metrics","comparison"],techs:["cot","fewshot","decompose"]},
  {sector:"Education",label:"Investments & Portfolio Theory",topic:"Build a comprehensive exam review for an Investments course. Cover Modern Portfolio Theory, efficient frontier, CAPM and its extensions (Fama-French 3-factor, Carhart 4-factor), APT, bond valuation and duration, yield curves, and performance attribution. Include derivations of key formulas and past exam-style problems with solutions.",task:"summarize",industry:"finance",output:"document",model:"chatgpt",style:"technical",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","visuals","glossary"],techs:["cot","decompose","firstprinciples"]},
  {sector:"Education",label:"Macroeconomics Exam Prep",topic:"Create an exam-ready summary for Macroeconomics. Cover GDP accounting, IS-LM model, AS-AD framework, Phillips curve, Solow growth model, monetary and fiscal policy transmission, open economy models (Mundell-Fleming), and business cycle theory. Include graphs for each model with clear axis labels and shift explanations.",task:"summarize",industry:"education",output:"document",model:"claude",style:"technical",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","visuals","comparison"],techs:["cot","decompose","systems"]},
  {sector:"Education",label:"Econometrics Cheat Sheet",topic:"Build a concise but complete cheat sheet for an Econometrics exam. Cover OLS assumptions, hypothesis testing, multicollinearity, heteroscedasticity, autocorrelation, instrumental variables, panel data models (fixed vs random effects), logit/probit, and time series (stationarity, cointegration). Include decision trees for choosing the right test and model specification.",task:"summarize",industry:"education",output:"document",model:"chatgpt",style:"minimalist",tone:"Academic",len:"Medium",fileOutput:"pdf",includes:["glossary","comparison","visuals"],techs:["decompose","constraints","cot"]},
  {sector:"Education",label:"Derivatives & Risk Management",topic:"Create a comprehensive study summary for a Derivatives course. Cover forward and futures pricing, put-call parity, Black-Scholes model, the Greeks (delta, gamma, theta, vega, rho), binomial option pricing, swaps (interest rate and currency), and Value at Risk. Include payoff diagrams for all major strategies (straddle, strangle, spread, collar).",task:"summarize",industry:"finance",output:"document",model:"claude",style:"technical",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","visuals","glossary"],techs:["cot","decompose","fewshot"]},
  {sector:"Education",label:"Lecture Slides Consolidation",topic:"I have 11 lecture slide decks (PDF and PowerPoint) for my finance course. Create a single comprehensive study document that consolidates all key concepts, theories, formulas, and examples across all lectures into one structured summary. Organize by topic (not by lecture number), cross-reference related concepts, highlight exam-relevant material, and flag areas where lectures overlap or build on each other.",task:"summarize",industry:"finance",output:"document",model:"claude",style:"analytical",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","glossary","examples"],techs:["decompose","cot","systems"]},
  {sector:"Education",label:"Accounting Fundamentals Review",topic:"Build an exam summary for Financial Accounting. Cover the accounting equation, double-entry bookkeeping, revenue recognition, accrual vs cash basis, inventory methods (FIFO, LIFO, weighted average), depreciation methods, journal entries for common transactions, bank reconciliation, and adjusting entries. Include T-account examples and a trial balance walkthrough.",task:"summarize",industry:"finance",output:"document",model:"chatgpt",style:"instructional",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","glossary","visuals"],techs:["fewshot","decompose","cot"]},
  {sector:"Education",label:"Statistics for Finance Exam",topic:"Create a statistics exam review tailored for finance students. Cover probability distributions (normal, lognormal, binomial), hypothesis testing, confidence intervals, regression analysis, correlation vs causation, time series basics, and Monte Carlo simulation. Use financial examples throughout (stock returns, portfolio risk, event studies). Include formula reference and interpretation guides.",task:"summarize",industry:"finance",output:"document",model:"claude",style:"technical",tone:"Academic",len:"Comprehensive",fileOutput:"pdf",includes:["examples","glossary","comparison"],techs:["cot","fewshot","decompose"]},
  {sector:"Education",label:"Business Law Key Concepts",topic:"Summarize key concepts for a Business Law exam relevant to finance students. Cover contract law essentials, securities regulation, corporate governance, fiduciary duties, insider trading rules, bankruptcy proceedings, and liability. Structure as issue-spotting guide with landmark cases for each topic and exam-style scenario questions.",task:"summarize",industry:"legal",output:"document",model:"chatgpt",style:"analytical",tone:"Academic",len:"Long",fileOutput:"pdf",includes:["examples","glossary","sources"],techs:["cot","fewshot","compare"]},

  // CONSULTING (5)
  {sector:"Consulting",label:"Market Entry Strategy",topic:"Develop a market entry strategy for a European SaaS company targeting the US mid-market. Address go-to-market differences, pricing localization, sales model (PLG vs. enterprise), and competitive positioning against US incumbents.",task:"strategy",industry:"consulting",output:"document",model:"claude",style:"formal",tone:"Authoritative",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","metrics","risks"],techs:["systems","firstprinciples","decompose"]},
  {sector:"Consulting",label:"Org Design at Scale",topic:"Propose a new org structure for a 200-person tech company scaling from $10M to $50M ARR. How do we avoid bureaucracy while maintaining coordination? Address reporting lines, decision rights, and meeting cadence.",task:"writing",industry:"consulting",output:"proposal",model:"general",style:"formal",tone:"Professional",len:"Long",fileOutput:"pdf",includes:["examples","sources","action_items"],techs:["cot","constraints","selfcheck"]},
  {sector:"Consulting",label:"Cost Transformation",topic:"Design a cost transformation program targeting 15% OpEx reduction for a mid-market manufacturer without cutting headcount. Identify quick wins (0-3 months), structural changes (3-12 months), and strategic shifts (12+ months).",task:"strategy",industry:"consulting",output:"presentation",model:"claude",style:"formal",tone:"Authoritative",len:"Comprehensive",fileOutput:"ppt",includes:["exec_summary","metrics","risks"],techs:["systems","firstprinciples","decompose"]},
  {sector:"Consulting",label:"Due Diligence Report",topic:"Conduct a commercial due diligence assessment for a PE firm acquiring a B2B software company. Evaluate market size, competitive moat, customer concentration, churn dynamics, and pricing power. Flag the top risks.",task:"analysis",industry:"consulting",output:"document",model:"claude",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"pdf",includes:["metrics","comparison","exec_summary"],techs:["cot","decompose","systems"]},
  {sector:"Consulting",label:"Digital Transformation",topic:"Create a digital transformation roadmap for a traditional insurance company. Prioritize initiatives by impact and feasibility. Address legacy system migration, customer experience, data strategy, and change management.",task:"strategy",industry:"consulting",output:"proposal",model:"chatgpt",style:"formal",tone:"Authoritative",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","metrics","risks"],techs:["systems","firstprinciples","decompose"]},

  // SPORTS BETTING (5)
  {sector:"Sports",label:"Tennis Match Edge Bets",topic:"Make a comprehensive analysis to find high edge bets for these tennis matches. Deep research the players, recent form, surface records, head-to-head, and serve/return stats. Find reasons why each bet is good. Handicap, over/under, and moneyline. Low and mid risk bets only.",task:"analysis",industry:"general",output:"brief",model:"claude",style:"analytical",tone:"Professional",len:"Brief",fileOutput:"none",includes:[],techs:["cot","constraints"]},
  {sector:"Sports",label:"Football Weekend Picks",topic:"Analyze this weekend's Premier League matches. Compare recent form, xG trends, injury lists, home/away splits, and head-to-head records. Give me 3-5 highest-conviction bets across moneyline, Asian handicap, and over/under markets. Include edge estimate and confidence level for each.",task:"analysis",industry:"general",output:"brief",model:"claude",style:"analytical",tone:"Casual",len:"Brief",fileOutput:"none",includes:[],techs:["cot","compare"]},
  {sector:"Sports",label:"Live Match Betting Guide",topic:"I need a quick pre-match betting cheat sheet for a Champions League match. Cover key stats (possession, shots on target, corners averages), recent form (last 5), tactical matchup analysis, and 3 specific bets with reasoning. Keep it tight and actionable.",task:"analysis",industry:"general",output:"brief",model:"chatgpt",style:"minimalist",tone:"Casual",len:"Brief",fileOutput:"none",includes:[],techs:["cot"]},
  {sector:"Sports",label:"Betting Model Spreadsheet",topic:"Build a statistical betting model for tennis matches. Include columns for player Elo ratings, surface-adjusted win %, serve hold rates, break point conversion, recent form index, fatigue factor, and implied vs. actual odds. Calculate edge and Kelly criterion stake sizing.",task:"analysis",industry:"general",output:"spreadsheet",model:"claude",style:"analytical",tone:"Professional",len:"Detailed",fileOutput:"excel",includes:["metrics","comparison"],techs:["cot","decompose","systems"]},
  {sector:"Sports",label:"Football Season Outlook",topic:"Write a comprehensive season preview and betting guide for the top 5 European football leagues. Cover title contenders, relegation risks, top scorer markets, and over/under season point totals. Include a value bets table with odds, edge estimate, and confidence rating.",task:"writing",industry:"general",output:"document",model:"claude",style:"analytical",tone:"Professional",len:"Comprehensive",fileOutput:"pdf",includes:["exec_summary","metrics","comparison"],techs:["cot","decompose","systems"]},

  // SHORT CHAT EXAMPLES (no file output, quick analysis across sectors)
  {sector:"Finance",label:"Quick Stock Screener",topic:"Screen for undervalued Nordic stocks with P/E below 15, dividend yield above 3%, and positive earnings revisions in the last 90 days. Give me the top 5 with a one-line thesis for each.",task:"analysis",industry:"finance",output:"brief",model:"claude",style:"analytical",tone:"Professional",len:"Brief",fileOutput:"none",includes:[],techs:["cot"]},
  {sector:"Finance",label:"Earnings Quick Take",topic:"Quick analysis of this earnings report. What surprised vs. consensus? Is the stock a buy, hold, or sell based on these numbers? Give me the 3 most important takeaways.",task:"summarize",industry:"finance",output:"brief",model:"claude",style:"analytical",tone:"Professional",len:"Brief",fileOutput:"none",includes:[],techs:["cot"]},
  {sector:"Tech",label:"Code Review Feedback",topic:"Review this pull request. Focus on bugs, security issues, and performance problems. Skip style nits. Give me a prioritized list of what must be fixed before merge vs. what can be a follow-up.",task:"review",industry:"tech",output:"brief",model:"claude",style:"technical",tone:"Professional",len:"Brief",fileOutput:"none",includes:[],techs:["constraints","selfcheck"]},
  {sector:"Tech",label:"Debug This Error",topic:"I am getting this error in production. Walk me through the most likely root causes in order of probability. What should I check first? Give me the diagnostic steps.",task:"debug",industry:"tech",output:"brief",model:"claude",style:"technical",tone:"Professional",len:"Brief",fileOutput:"none",includes:[],techs:["cot","decompose"]},
  {sector:"Marketing",label:"Ad Copy Variations",topic:"Write 5 variations of a Facebook ad headline and body for a SaaS product launch targeting startup founders. Each variation should use a different persuasion angle (social proof, urgency, curiosity, pain point, aspiration). Keep each under 125 characters.",task:"writing",industry:"marketing",output:"brief",model:"chatgpt",style:"persuasive",tone:"Creative",len:"Brief",fileOutput:"none",includes:[],techs:["compare"]},
  {sector:"Legal",label:"Contract Red Flags",topic:"Review this contract and flag the top 5 most dangerous clauses for the buyer. For each: what it says, why it is risky, and what to negotiate instead. Quick and actionable.",task:"review",industry:"legal",output:"brief",model:"claude",style:"analytical",tone:"Authoritative",len:"Brief",fileOutput:"none",includes:[],techs:["cot","constraints"]},
  {sector:"Healthcare",label:"Drug Interaction Check",topic:"Check for interactions between these medications. Flag any serious contraindications, dose adjustments needed, and monitoring requirements. Prioritize by severity.",task:"analysis",industry:"healthcare",output:"brief",model:"claude",style:"technical",tone:"Professional",len:"Brief",fileOutput:"none",includes:[],techs:["cot","constraints"]},
  {sector:"Consulting",label:"Quick SWOT Analysis",topic:"Do a rapid SWOT analysis for this company based on their latest annual report. Keep each quadrant to 3-4 bullet points. End with the single most important strategic implication.",task:"analysis",industry:"consulting",output:"brief",model:"claude",style:"analytical",tone:"Professional",len:"Brief",fileOutput:"none",includes:[],techs:["cot"]},
  {sector:"Education",label:"Explain This Concept",topic:"Explain this concept to me like I have a solid foundation but have never encountered this specific topic. Use an analogy, then the formal definition, then a worked example. Keep it under 300 words.",task:"learning",industry:"education",output:"brief",model:"chatgpt",style:"instructional",tone:"Friendly",len:"Brief",fileOutput:"none",includes:[],techs:["fewshot","cot"]},
];

/* ═══════════════════════════════════════════════════════
   SMART ENHANCEMENT ENGINE
   Analyzes raw user input and intelligently enriches it.
   This is the core intelligence — makes the output better
   than what the user could specify manually.
   ═══════════════════════════════════════════════════════ */
function analyzeInput(topic){
  const t=topic.toLowerCase();
  const words=t.split(/\s+/);
  const signals={vague:false,missingAudience:true,missingScope:true,missingDeliverable:true,hasNumbers:false,hasComparison:false,hasTimeframe:false,short:words.length<12,multiGoal:false};

  if(/\b(about|regarding|on the topic of|related to|something about)\b/.test(t)&&words.length<15)signals.vague=true;
  if(/\b(for|targeting|aimed at|audience|readers?|users?|students?|managers?|developers?|executives?|beginners?|seniors?|juniors?)\b/.test(t))signals.missingAudience=false;
  if(/\b(focus on|scope|specifically|covering|including|limited to|within|between|from .+ to)\b/.test(t))signals.missingScope=false;
  if(/\b(create|build|write|draft|produce|generate|design|develop|make|prepare|deliver|output|format)\b/.test(t))signals.missingDeliverable=false;
  if(/\d/.test(t))signals.hasNumbers=true;
  if(/\b(vs\.?|versus|compar|against|between|differ|better|worse|alternative)\b/.test(t))signals.hasComparison=true;
  if(/\b(q[1-4]|202[0-9]|timeline|deadline|by |until |before |after |this (week|month|quarter|year))\b/.test(t))signals.hasTimeframe=true;
  if(/\b(and also|plus also|additionally|as well as|on top of that|also need|also create|also write|also build)\b/.test(t)||(t.match(/\b(create|build|write|analyze|design|develop|make)\b/g)||[]).length>=3)signals.multiGoal=true;

  return signals;
}

function getSmartEnhancements(topic,taskType,industry,output){
  const signals=analyzeInput(topic);
  const enhancements=[];

  // Vague or too short — add specificity guidance
  if(signals.vague||signals.short){
    enhancements.push({type:"specificity",label:"Added specificity guidance",text:"Be specific and concrete. Where the request is broad, narrow the focus to the most high-impact aspects. Provide depth over breadth  -  a thorough treatment of fewer points is more valuable than a shallow overview of many."});
  }

  // Missing audience — smart infer from context
  if(signals.missingAudience){
    const audienceMap={
      finance:{analysis:"senior financial analysts and portfolio managers",writing:"CFOs, investors, and financial decision-makers",email:"C-suite executives and board members",learning:"finance professionals seeking to deepen expertise"},
      healthcare:{analysis:"clinical directors and healthcare administrators",writing:"medical professionals and healthcare policy makers",learning:"medical students and junior clinicians"},
      legal:{analysis:"senior partners and in-house counsel",writing:"attorneys and legal professionals",learning:"law students and junior associates"},
      marketing:{analysis:"CMOs and growth leads",writing:"brand managers and marketing directors",brainstorm:"creative directors and growth teams"},
      tech:{coding:"senior developers who will maintain this code",analysis:"CTOs and engineering managers",writing:"technical product managers and engineering leads",learning:"developers with 1-3 years experience"},
      education:{learning:"students (assume foundational knowledge in the subject area)",writing:"educators and curriculum designers"},
      consulting:{analysis:"C-suite clients expecting McKinsey-level deliverables",writing:"senior stakeholders who need to make decisions based on this"},
    };
    const fallback={analysis:"knowledgeable professionals who expect depth and precision",writing:"engaged professionals who value clarity and actionable insight",coding:"experienced developers who value clean, maintainable code",brainstorm:"cross-functional team members evaluating ideas for feasibility",summarize:"busy decision-makers who need the key points fast",email:"professional recipients who expect clear, action-oriented communication",learning:"motivated learners with foundational knowledge in the subject",translate:"native speakers of the target language",image:"users familiar with AI image generation tools",roleplay:"an audience that expects authentic, consistent persona responses"};
    const indMap=audienceMap[industry]||{};
    const inferred=indMap[taskType]||fallback[taskType]||"knowledgeable professionals who expect depth and precision";
    enhancements.push({type:"audience",label:"Smart audience targeting",text:"Target audience: "+inferred+". Calibrate vocabulary, assumed knowledge, and depth accordingly."});
  }

  // Missing scope — add intelligent scoping
  if(signals.missingScope&&!signals.short){
    enhancements.push({type:"scope",label:"Intelligent scoping",text:"Prioritize the most decision-relevant aspects. If the topic is broad, identify the 3-5 most critical dimensions and go deep on those rather than attempting exhaustive coverage."});
  }

  // Multi-goal detected — enforce task decomposition
  if(signals.multiGoal){
    enhancements.push({type:"decomposition",label:"Multi-goal decomposition",text:"This request contains multiple objectives. Address each one as a distinct numbered section with its own deliverable. Complete each section fully before moving to the next. Do not blend objectives together."});
  }

  // Comparison detected — add structured comparison framework
  if(signals.hasComparison){
    enhancements.push({type:"comparison",label:"Comparison framework added",text:"Structure any comparisons using consistent evaluation criteria. For each option: state the criterion, provide evidence, and give a clear assessment. Conclude with a recommendation and the conditions under which alternatives would be preferred."});
  }

  // Industry-specific auto-enhancements
  const industryBoosts={
    finance:!signals.hasNumbers?{type:"precision",label:"Financial precision added",text:"Quantify all claims with specific figures, percentages, or ranges. Specify time periods, currencies, and whether figures are actual or estimated. Use standard financial metrics appropriate to the analysis type."}:null,
    healthcare:{type:"safety",label:"Clinical safety note added",text:"Include appropriate disclaimers where clinical decisions are involved. Distinguish between evidence levels. Note when specialist consultation is recommended."},
    legal:{type:"jurisdiction",label:"Jurisdictional awareness added",text:"Note jurisdictional applicability and variations. Flag where local legal counsel should verify. Distinguish between established precedent and emerging law."},
    tech:taskType==="coding"?{type:"production",label:"Production readiness added",text:"Address error handling, edge cases, security implications, and performance characteristics. Include type annotations where applicable. Note any dependency version requirements."}:null,
  };
  const boost=industryBoosts[industry];
  if(boost)enhancements.push(boost);

  // Task-specific auto-techniques
  const autoTechniques={
    analysis:["Think through your reasoning step by step. Show your analytical framework explicitly.","Before finalizing, verify: Are conclusions supported by evidence? Are there counterarguments you haven't addressed? Are recommendations specific and actionable?"],
    coding:["Before writing code, briefly state your approach and any assumptions. After implementation, note testing strategies and potential edge cases."],
    brainstorm:["Push beyond the obvious. After generating initial ideas, deliberately explore unconventional angles and cross-domain inspiration."],
    email:["Before writing, identify: What is the single most important thing the recipient should do after reading this? Structure everything around that action."],
    strategy:["Start by framing the strategic question precisely. Map the competitive landscape before proposing solutions. Stress-test every recommendation: What must be true for this to work?"],
    debug:["Reproduce first, then hypothesize. Use systematic elimination. Always distinguish root cause from symptoms. Ask 'why' five times."],
    review:["Establish evaluation criteria before reviewing. Separate structural issues from detail issues. Every criticism must include a specific fix."],
    decision:["Frame the decision precisely. Identify all stakeholders. Weight criteria explicitly. Score options against criteria. Address reversibility and second-order effects."],
    persuade:["Understand the audience's motivations before crafting arguments. Lead with their interests. Address objections proactively. Close with a specific, easy-to-accept ask."],
  };
  const autoTech=autoTechniques[taskType];
  if(autoTech){
    enhancements.push({type:"technique",label:"Smart reasoning strategy",text:autoTech.join(" ")});
  }

  // Output-specific structural guidance
  if(output==="presentation"){
    enhancements.push({type:"structure",label:"Presentation structure optimized",text:"Each slide should make exactly one point. Use the assertion-evidence model: slide title states the conclusion, body provides the evidence. Maximum 3-5 bullets per slide. Include speaker notes with talking points and transition cues."});
  }
  if(output==="proposal"){
    enhancements.push({type:"structure",label:"Proposal persuasion framework",text:"Structure for maximum persuasive impact: lead with the problem (make the reader feel the pain), then the solution (make it feel inevitable), then evidence (make it feel safe). End with clear next steps and urgency."});
  }

  return enhancements;
}

/* ═══════════════════════════════════════════════════════
   ANTI-VAGUE PASS — Replace vague words with precise alternatives
   ═══════════════════════════════════════════════════════ */
const VAGUE_REPLACEMENTS=[
  [/\bgood\b/gi,"high-quality"],
  [/\bbad\b/gi,"substandard"],
  [/\bnice\b/gi,"well-structured"],
  [/\bprofessional\b/gi,"executive-grade"],
  [/\bdetailed\b/gi,"granular and specific"],
  [/\bbetter\b/gi,"measurably improved"],
  [/\bimprove\b/gi,"optimize"],
  [/\binteresting\b/gi,"analytically significant"],
  [/\bhelpful\b/gi,"actionable"],
  [/\bimportant\b/gi,"high-priority"],
  [/\ba lot\b/gi,"substantial"],
  [/\bvery\b/gi,"notably"],
  [/\breally\b/gi,"demonstrably"],
  [/\bsome\b/gi,"specific"],
  [/\bthings\b/gi,"components"],
  [/\bstuff\b/gi,"material"],
  [/\bdo something about\b/gi,"address and resolve"],
  [/\blook into\b/gi,"investigate and assess"],
  [/\bfigure out\b/gi,"diagnose and determine"],
  [/\bwork on\b/gi,"develop and implement"],
];
function sharpenTopic(text){
  let result=text;
  for(const [pattern,replacement] of VAGUE_REPLACEMENTS){
    result=result.replace(pattern,replacement);
  }
  return result;
}

/* ═══════════════════════════════════════════════════════
   PROMPT BUILD ENGINE
   ═══════════════════════════════════════════════════════ */
function buildPrompt(p){
  const {topic,taskType,model,subModel,subModelTier,tone,length,format,techniques,audience,extra,special,mode,industry,output,style,includes,language,fileOutput,selectedFirm,selectedRole,hasAttachment,riskLevel}=p;
  const mfmt=MODELS[model]?.fmt||"md";const isXml=mfmt==="xml";const isExp=mode==="expert";const tier=subModelTier||"flagship";const lines=[];
  const sec=(tag,content)=>{
    if(mfmt==="xml")lines.push("<"+tag+">\n"+content+"\n</"+tag+">");
    else if(mfmt==="bold")lines.push("**"+tag.toUpperCase().replace(/_/g," ")+"**\n"+content);
    else lines.push("## "+tag.charAt(0).toUpperCase()+tag.replace(/_/g," ").slice(1)+"\n"+content);
  };

  // ═══ BLOCK 1: SYSTEM ═══
  const sys=[];
  sys.push("You are "+(ROLE_DEEP[taskType]||"a helpful expert assistant")+".");
  if(industry!=="general"&&IND_CONTEXT[industry])sys.push(IND_CONTEXT[industry]);
  if(selectedFirm&&SECTOR_FIRMS[industry]?.firms[selectedFirm]){
    const firmData=SECTOR_FIRMS[industry].firms[selectedFirm];
    sys.push("Adopt the methodology and deliverable quality of "+firmData.name+".");
    if(selectedRole)sys.push("Role: "+selectedRole+" at "+firmData.name+".");
  }
  const audienceEnhancement=(getSmartEnhancements(topic,taskType,industry,output)).find(e=>e.type==="audience");
  if(audience)sys.push("Audience: "+audience+".");
  else if(audienceEnhancement)sys.push(audienceEnhancement.text);
  else sys.push("Audience: knowledgeable professionals who expect depth and precision.");
  sys.push("Tone: "+tone+(TONE_INST[tone]?". "+TONE_INST[tone]:"")+".");
  if(language&&language!=="English")sys.push("Respond entirely in "+language+".");
  sec("system",sys.join("\n"));

  // ═══ BLOCK 2: TASK ═══
  const enhancements=getSmartEnhancements(topic,taskType,industry,output);
  const smartContext=enhancements.filter(e=>e.type==="specificity"||e.type==="scope"||e.type==="decomposition").map(e=>e.text).join("\n\n");
  const taskParts=[];
  taskParts.push(sharpenTopic(topic));
  if(smartContext)taskParts.push(smartContext);
  // Source guidance — Claude gets structured document tags per Anthropic best practices
  if(hasAttachment){
    if(isXml){
      taskParts.push("Documents are attached below in <documents> tags. Use them as your primary data source. Extract and reference specific figures. State gaps where source data is missing or insufficient.\n\n<documents>\n  <document index=\"1\">\n    <source>[Attached file]</source>\n    <document_content>\n      [User's attached content will appear here]\n    </document_content>\n  </document>\n</documents>");
    }else{
      taskParts.push("Files attached. Use as primary data source. Reference specific figures. State gaps.");
    }
  }else{
    taskParts.push("No files attached. Use realistic figures, label estimates, note what source data would strengthen the analysis.");
  }
  // Risk level (inline)
  const risk=riskLevel||"medium";
  if(risk==="high")taskParts.push("HIGH RISK: Validate every assumption. Flag irreversible actions. Include rollback procedures.");
  else if(risk==="low")taskParts.push("LOW RISK: Optimize for speed. Be concise and action-oriented.");
  // Tier suffix
  if(tier==="flagship")taskParts.push("Deliver expert-level depth and genuine professional value.");
  else if(tier==="balanced")taskParts.push("Be thorough but efficient. Prioritize actionable insights.");
  else taskParts.push("Be concise and direct. Focus on the most important points.");
  sec("task",taskParts.join("\n\n"));

  // Includes (required sections) -- only if user selected any
  if(includes.length>0){
    const inc=[];
    if(includes.includes("exec_summary"))inc.push("Executive summary (3-5 sentences) upfront");
    if(includes.includes("examples"))inc.push("2-3 real-world examples with named companies");
    if(includes.includes("sources"))inc.push("Source citations for factual claims");
    if(includes.includes("action_items"))inc.push("Action items: numbered, specific, with owners and timelines");
    if(includes.includes("risks"))inc.push("Risk assessment: top 3-5 risks with likelihood, impact, mitigation");
    if(includes.includes("comparison"))inc.push("Comparison table evaluating options on same criteria");
    if(includes.includes("timeline"))inc.push("Timeline with phases, deliverables, dates");
    if(includes.includes("metrics"))inc.push("KPIs: baseline, target, measurement method");
    if(includes.includes("glossary"))inc.push("Glossary of technical terms and acronyms");
    if(includes.includes("visuals"))inc.push("Recommended visuals: chart type, data shown, purpose");
    sec("required_sections",inc.map(x=>"- "+x).join("\n"));
  }

  // Smart enhancements
  const smartTechniques=enhancements.filter(e=>e.type==="technique"||e.type==="comparison"||e.type==="precision"||e.type==="safety"||e.type==="jurisdiction"||e.type==="production"||e.type==="structure");
  if(smartTechniques.length>0){
    sec("guidance",smartTechniques.map(e=>"- "+e.text).join("\n"));
  }

  // Techniques (user-selected)
  if(techniques.includes("cot"))sec("reasoning","Think step by step. Show reasoning explicitly: walk through logic, evaluate alternatives, explain conclusions.");
  if(techniques.includes("fewshot"))sec("examples_format",isXml?"Model your response after the patterns below. Match the structure, depth, and tone of the ideal outputs.\n\n<examples>\n  <example>\n    <input>[Example input]</input>\n    <ideal_output>[Ideal output demonstrating expected quality]</ideal_output>\n  </example>\n  <example>\n    <input>[Different example showing edge case]</input>\n    <ideal_output>[Ideal output handling the edge case]</ideal_output>\n  </example>\n</examples>":"Model your response after this pattern:\n\n**Example Input:** [Example input]\n**Ideal Output:** [Ideal output]");
  if(techniques.includes("constraints"))sec("constraints","1. Never fabricate facts or sources\n2. State uncertainty with confidence level\n3. Stay focused; no tangential drift\n4. Distinguish facts from analysis from speculation\n5. Flag incorrect assumptions before proceeding");
  if(techniques.includes("selfcheck"))sec("self_check","Before submitting, verify: fully addresses task, clear structure, claims supported, tone consistent, no repetition.");
  if(techniques.includes("compare"))sec("comparative","Present each option with clear label. Evaluate on same criteria. State recommendation with reasoning.");
  if(techniques.includes("iterative"))sec("refinement","After initial draft: re-read as target audience, identify gaps, provide improved version.");
  if(techniques.includes("roleplay"))sec("persona","Embody this role fully. Use vocabulary and reasoning natural to it. Maintain consistent perspective.");
  if(techniques.includes("redteam"))sec("red_team","After your main response, attack your own work: weakest arguments, wrong assumptions, what a smart opponent would say. Then strengthen.");
  if(techniques.includes("firstprinciples"))sec("first_principles","Strip to fundamental truths. Question every assumption. Rebuild from foundations.");
  if(techniques.includes("inversion"))sec("inversion","Invert: imagine catastrophic failure 12 months out. Top 5 failure modes, early warning signs, prevention actions.");
  if(techniques.includes("multiagent"))sec("multi_perspective","Analyze from multiple expert perspectives (CFO, customer, regulator, engineer). Note conflicts. Synthesize.");
  if(techniques.includes("structured_debate"))sec("debate","Position A (FOR): strongest case. Position B (AGAINST): strongest countercase. Verdict: which is stronger and why.");
  if(techniques.includes("systems"))sec("systems","Map as a system: components, feedback loops, leverage points, time delays, unintended side effects.");
  if(techniques.includes("decompose"))sec("decompose","Break into sub-tasks. Identify dependencies. For each: approach, output, success criteria. Solve systematically.");
  if(techniques.includes("meta"))sec("meta","Before diving in: problem type, best frameworks, biggest risk, likely blind spots. Let this guide your approach.");

  // Extra & special
  if(extra)sec("additional_instructions",extra);
  if(special)sec("special_requests",special);

  // ═══ BLOCK 3: CONTRACT ═══
  const fmtArr=Array.isArray(format)?format:[format];
  const hasFileInst=fileOutput&&fileOutput!=="none";
  const FMT_INST={
    prose:"Flowing paragraphs with topic sentences and transitions. Subheadings for major sections.",
    bullets:"Concise bullet points under clear headers. Lead with most important info.",
    numbered:"Numbered steps with bold action verbs. Brief explanations under each.",
    table:hasFileInst?"Use tables per the file format spec below.":"Tables: max 6 columns, abbreviate headers. Numbers right-aligned, commas, 1 decimal %, negatives in (). Leave empty cells blank. Units as subtitle, not inline. Source line below every table.",
    qa:"Questions followed by thorough answers. Self-contained pairs.",
    headers:"Clear header hierarchy. Scannable sections. TOC for longer responses.",
    tldr:"TL;DR (3-5 sentences) first, then full detail.",
    framework:"Structure around a recognized framework. Name it, map analysis to its components.",
    flowchart:"Text-based decision trees with branching. Label each decision point and outcome.",
    before_after:"Before / After comparisons with concrete examples.",
    pros_cons:"Structured Pros & Cons. Specific and quantified where possible.",
    scorecard:"Scorecard matrix. Consistent scale (1-5 or H/M/L). Equal-width rating columns.",
    annotated:"Annotated examples with inline commentary."
  };
  const contractParts=[];

  // Output type -- skip if FILE_INST will provide more specific structure
  if(output&&OUTPUT_INST[output]&&!hasFileInst)contractParts.push(OUTPUT_INST[output]);

  // Writing style
  contractParts.push("Style: "+(STYLES[style]?.l||style)+(STYLE_INST[style]?". "+STYLE_INST[style]:""));

  // Formatting
  const activeFmts=fmtArr.filter(f=>FMT_INST[f]);
  if(activeFmts.length>0){
    contractParts.push("Format:\n"+activeFmts.map(f=>"- "+(FMTS[f]?.l||f)+": "+(FMT_INST[f]||"")).join("\n"));
  }

  // Length
  const fileLenSub=getLenSub(length,fileOutput);
  const lenG={Brief:"Highest-impact only.",Medium:"All major aspects with supporting detail.",Detailed:"Thorough with examples and nuance.",Comprehensive:"Exhaustive reference-grade depth."};
  const lenStrict=length==="Brief"||length==="Medium"
    ?"This is a HARD LIMIT, not a suggestion. Do NOT exceed it. If you have more to say, prioritize ruthlessly and cut the rest. Exceeding the specified length is a failure."
    :"Stay within this range. Prioritize depth on the most important dimensions.";
  contractParts.push("Length: "+fileLenSub+". "+(lenG[length]||lenG.Medium)+"\n"+lenStrict);

  // FILE OUTPUT FORMAT — strict professional specs
  // Shared table rules enforced across ALL file types that use tables
  const TABLE_RULES=`TABLE RULES (apply to every table in this document):
- Max 6 columns portrait, 10 landscape. Split wider tables.
- Numbers: right-aligned, commas for thousands, 1 decimal %, 2 decimal currency, negatives in parentheses ()
- Empty cells: leave blank or use a single dash. NEVER use N/A, None, null, or 0 for missing data. Do NOT scatter em dashes throughout tables or prose.
- Units (NOK '000, USD millions, %): 8pt italic subtitle below table title, never inline with data.
- Currency symbol ($, NOK): first row and total row only, not every cell.
- "Table N: [Title]" above every table. Source line 8pt italic below every table.
- Abbreviate headers aggressively (Rev., Gr., Mgn., FY25E, EV/EBITDA). Define all abbreviations in glossary.
COLUMN WIDTH AND CELL FIT (CRITICAL, follow strictly):
- Before writing any table, mentally calculate total available width (page width minus margins). Assign each column a % share proportional to its longest expected content. Short-value columns (percentages, dates, Yes/No, single numbers) get narrow widths. Text-heavy columns (descriptions, names, mitigations) get the remaining space.
- Every cell must contain COMPLETE, READABLE text. No text may overflow, bleed into, or overlap adjacent columns. If a cell's content does not fit, you MUST either: (a) shorten the text, (b) widen the column by narrowing others, (c) split the table, or (d) move to landscape orientation.
- Max 2 lines per cell. If content requires more, shorten it. Write telegraphically in table cells: fragments and keywords, not full sentences.
- Test every table mentally: read each cell in isolation. If any cell's text would collide with the next column's content when rendered, fix it before proceeding.`;

  // Shared formula / equation rules enforced across ALL document-style file types.
  // Purpose: never render math with ASCII hacks like x^alpha, v(x) = -lambda(-x)^beta,
  // or alpha approx 0.88. Always typeset with LaTeX so the PDF/DOCX/PPT renderer (or
  // the markdown pipeline via MathJax / KaTeX) produces clean, publication-quality math.
  const FORMULA_RULES=`FORMULA & EQUATION RULES (apply to every mathematical expression — MANDATORY, no exceptions):

SYNTAX:
- ALWAYS use LaTeX. NEVER ASCII fallbacks (x^alpha, >=, !=, approx, sum, lambda, beta, unicode soup).
- Inline math: single dollars, e.g. $v(x) = x^{\\alpha}$. Display math: double dollars on their OWN LINE, with a blank line before AND after so the renderer treats it as display, not inline.
- Primitives: \\alpha \\beta \\gamma \\lambda \\mu \\sigma \\Sigma \\Delta \\pi \\theta \\rho \\epsilon \\phi \\Phi \\psi \\Psi \\omega \\Omega; \\leq \\geq \\neq \\approx \\equiv \\pm \\times \\cdot \\div \\infty \\partial \\nabla; \\sum \\int \\prod \\lim \\frac{a}{b} \\sqrt{x} \\sqrt[n]{x}; subscripts x_{i}, superscripts x^{n}, multi-char indices x_{i,j}^{2}.

NO-OVERLAP RULES (this is the most common failure — follow strictly):
- ONE equation per $$...$$ block. NEVER put two formulas side-by-side with \\quad inside a single display block. If you have two related equations, give each its own $$...$$ block on its own line.
- NEVER combine an equation with its parameter values on the same line. Put parameters on a separate line below the block using a "where:" bullet list, or as a second display equation. "v(x) = ..., with alpha = 0.88, lambda = 2.25" in a single block causes right-margin overflow and \\tag{} collision.
- \\tag{} contents must be SHORT — a number or 1-3 character label ONLY: \\tag{1}, \\tag{2}, \\tag{PT}, \\tag{5a}. NEVER multi-word phrases like \\tag{value function} or \\tag{disposition effect}. Long labels belong in the surrounding prose ("equation (2), the value function"), not inside the tag.
- Wide expressions (piecewise, matrices, long sums, multi-term products) MUST be broken across lines using \\begin{aligned}...\\end{aligned} with \\\\ at natural break points and & anchors for alignment. Never let a single line run past the right margin — the tag will collide with the equation body.
- Leave a blank line before and after every $$...$$ block so the pipeline treats it as display math, not inline.

STRUCTURE:
- Align multi-step derivations with \\begin{aligned}...\\end{aligned}. Number only the KEY equation(s) with \\tag; intermediate steps stay untagged.
- Variable definitions: immediately after first use, define every symbol in a "where:" block — one bullet per symbol. Do NOT stuff definitions inside the equation.
- Units OUTSIDE the math: "$E = 42$ kWh", NOT "$E = 42\\,\\text{kWh}$". For unit-inside-math use \\text{} or \\mathrm{} sparingly.
- Percentages in math: \\% (e.g. $0.88 \\approx 88\\%$), never a bare % inside $$.
- Matrices: \\begin{bmatrix}...\\end{bmatrix}. Fractions: \\frac{num}{den}. Nested fractions: \\dfrac for display size so they don't shrink.
- Citations next to equations: put author-year AFTER the equation block in prose ("...(Tversky & Kahneman, 1992)."), NEVER inside the math or the tag.

RENDERING TARGET: MathJax v3 / KaTeX / pdflatex / Word Equation. Produce LaTeX that parses cleanly in all four. No custom macros, no \\newcommand, no \\usepackage — stick to amsmath primitives.

WORKED EXAMPLES (copy this pattern):

BAD (causes the overlap bug):
v^{PT}(x) = \\begin{cases} x^{\\alpha} & x \\geq 0 \\\\ -\\lambda(-x)^{\\beta} & x < 0 \\end{cases}, \\quad \\alpha \\approx \\beta \\approx 0.88, \\lambda \\approx 2.25 \\tag{value function}

GOOD (same content, no overlap):
The Prospect Theory value function is:

$$v(x) = \\begin{cases} x^{\\alpha} & x \\geq 0 \\\\ -\\lambda(-x)^{\\beta} & x < 0 \\end{cases} \\tag{2}$$

where Tversky & Kahneman (1992) estimate $\\alpha \\approx \\beta \\approx 0.88$ and $\\lambda \\approx 2.25$.

BAD (two formulas one block):
PGR = ..., \\quad PLR = ... \\tag{Odean}

GOOD (split, short tags, prose linking them):
Odean's (1998) realisation ratios:

$$PGR = \\frac{\\text{realised gains}}{\\text{realised gains} + \\text{paper gains}} \\tag{5a}$$

$$PLR = \\frac{\\text{realised losses}}{\\text{realised losses} + \\text{paper losses}} \\tag{5b}$$

The disposition effect holds when $PGR > PLR$.

FINAL CHECK before writing any equation: does it fit on one line without the tag? Is the tag ≤ 3 characters? Is there only ONE formula in this $$...$$ block? Are parameters in surrounding prose, not in the block? If any answer is no, split or rewrite. Formulas must look like a published textbook, not a chat transcript.`;

  const FILE_INST={
    pdf:`PDF, institutional quality (Goldman Sachs / J.P. Morgan standard).
STRUCTURE: Title page (title 28pt, subtitle 16pt, date Month DD YYYY, classification), then TOC, then body sections, then Glossary at end. DO NOT number section headers; use clean text headers only (e.g. "Executive Summary" not "1.0 Executive Summary").
TYPOGRAPHY: Arial throughout. Body 10.5pt #333333. H1 20pt bold #1B2A4A with 1pt rule below, 18pt space above, 8pt below. H2 14pt bold #1B2A4A, 14pt above, 6pt below. H3 11pt bold #333333, 10pt above, 4pt below. Margins 1in L/R, 0.75in T/B. 6pt paragraph spacing. Left-aligned (not justified). Callouts: #EBF5FB background, 1pt #1B2A4A left border, 8px padding.
ORPHAN/WIDOW PREVENTION (MANDATORY): A header (H1, H2, H3) must NEVER appear at the bottom of a page with fewer than 4 lines of body text following it before the page break. If a header would be stranded, move the entire header and its content to the next page. Similarly, never leave fewer than 2 lines of a paragraph at the top or bottom of a page.
SPACING: Consistent vertical rhythm throughout. 12pt space between body text and table/chart. 6pt between table title and table. 4pt between table and source line. No double blank lines.
TABLES: Header 10pt bold, white (#FFFFFF) on #1B2A4A, 10px padding. Data 9.5pt, 8px padding, alternating white/#F8F9FA rows. Borders 0.5pt #D0D5DD, 1pt navy under header. Row height: 22px headers, 18px data (uniform throughout document). Column padding: 10px minimum.
`+TABLE_RULES+`
CHARTS: Title as insight statement (not generic label). Navy/steel blue/teal palette, max 5 colors. 8pt axis labels. Data labels on bars. Source line below.
PAGE FLOW: Hard page break before each H1. Never split a table from its title. Min 2 rows per page side. If less than 30% page remaining, start table on next page. No page less than 40% filled. Last page must be more than 40% filled; extend glossary or add appendix if needed.
`+FORMULA_RULES,

    word:`DOCX, Big 4 consulting / top-tier law firm standard.
STRUCTURE: Title page (Calibri 26pt, date, version, confidentiality), then TOC via Heading styles, then body sections, then Glossary at end. DO NOT number section headers; use clean text headers only.
TYPOGRAPHY: Calibri throughout. Body 11pt #333333, 1.25 line spacing, 6pt after paragraph. H1 18pt bold #1B2A4A with bottom border, 18pt above, 8pt below. H2 14pt bold #1B2A4A, 14pt above, 6pt below. H3 11.5pt bold #333333, 10pt above, 4pt below. Callouts: #EBF5FB background, 1pt #1B2A4A left border.
ORPHAN/WIDOW PREVENTION (MANDATORY): A header must NEVER appear at the bottom of a page with fewer than 4 lines of body text following it before the page break. If stranded, move the header and its content to the next page. Never leave fewer than 2 lines of a paragraph at the top or bottom of a page.
SPACING: 12pt between body text and table/chart. 6pt between table title and table. 4pt between table and source line.
TABLES: Header 10pt bold, white on #1B2A4A, repeat header row on multi-page tables. Data 10pt, 6px padding, alternating white/#F8F9FA rows. Auto-fit columns, min 60px. Row height: 22px headers, 18px data. Landscape section break if table exceeds margins.
`+TABLE_RULES+`
CHARTS: Title as insight statement, never a generic label (e.g. "Revenue grew 23% driven by pricing" not "Revenue Overview"). Navy/steel blue/teal palette, max 5 colors. 8pt axis labels. Data labels on bars. Source line 8pt italic below chart.
PAGE FLOW: Table title + body on same page. Never split with fewer than 2 rows per side. Source on same page as table.
`+FORMULA_RULES,

    excel:`XLSX, investment-bank-grade (Goldman Sachs / J.P. Morgan standard).
STRUCTURE: Named tabs ("Summary", "Revenue Build", etc.). One analytical purpose per tab. Summary tab first with navigation links.
LAYOUT: Rows 1-3 title block (company, title, date). Row 5+ data. Freeze Row 5 + Col A. Hide gridlines.
- Headers: 10pt bold, white (#FFFFFF) on #1B2A4A, 22px row height
- Data: 9.5pt, 18px row height, alternating white/#F8F9FA rows
- Labels LEFT-aligned, numbers RIGHT-aligned. Auto-fit + 20px padding. Never allow ###.
NUMBERS: Millions 1 decimal, $ on first/total rows only. Percentages 1 decimal + %. Multiples 1 decimal + x. Per-share 2 decimal. Commas for thousands. Negatives: red (#CC0000) parentheses, no minus sign. Growth: + prefix. Empty cells: leave blank. NEVER N/A, None, null, or 0 for missing data. Units in 8pt italic gray subtitle cell, never inline.
CELLS: Input = blue background (#DCE6F1). Calculated = formula only, no background. Linked = green font (#006100). Override = orange (#E26B0A) + comment. ZERO hardcoded values in formulas. Named ranges for assumptions. IFERROR on all divisions. Scenario toggles via dropdown.
FORMATTING: Section totals: bold, 1pt navy top border, #E8EEF4 background. Grand totals: double border. KPI status: green/amber/red conditional formatting.
"Table N: [Title]" cell above every table. Source line in 8pt italic gray cell below every table. Define abbreviations in a glossary tab.
CHARTS: Insight statement titles (e.g. "Revenue grew 23% driven by pricing" not "Revenue Overview"). Navy/steel blue/teal palette, max 5 colors. 8pt labels. Data labels on bars. Source line below.`,

    ppt:`PPTX, pitchbook standard (Goldman Sachs / McKinsey quality), 16:9 aspect ratio.
STRUCTURE: Title slide (28pt white on navy, subtitle, date, confidentiality), then Agenda, then Section dividers (navy background), then Content slides, then Summary + Next Steps, then Appendix. DO NOT number slide titles.
SLIDE RULES:
- Assertion-Evidence format: slide title IS the conclusion, body proves it with data.
- Max 5 bullets per slide, max 2 lines per bullet. Telegraphic style (verb + metric + insight).
- ONE table OR ONE chart per slide, never both.
- Hero metrics: 36pt bold callout numbers with 11pt descriptor below.
TYPOGRAPHY: Title 20pt bold #1B2A4A, max 2 lines. Body 14pt #333333. Bullets 13pt. Sub-bullets 11pt. Min 8pt for sources/footnotes.
TABLES: Max 7 rows x 6 columns. Split or move to appendix if more. Header 10pt bold, white on #1B2A4A. Data 9.5pt, alternating rows. Horizontal borders only. Numbers right-aligned. Leave empty cells blank. NEVER use N/A, None, null, or 0 for missing data. Units (NOK '000, USD millions, %) in 8pt italic subtitle below table title, never inline with data. "Table N: [Title]" above every table. Source line 8pt italic below. Abbreviate aggressively. Size columns proportional to content. Center table on slide.
CHARTS: Fill content area. Insight title ("Revenue grew 23% driven by pricing" not "Revenue Overview"). Navy/steel blue/teal, max 5 colors. 8pt labels. Source line below.
SPEAKER NOTES: Key message, 3-4 supporting data points, anticipated pushback, transition to next slide.
NEVER: animations, transitions, clip art, font below 8pt, misaligned elements across slides, shrink-to-fit text.
`+FORMULA_RULES,

    markdown:`Markdown, Stripe/Vercel documentation standard. Renders in GitHub, Notion, Confluence.
STRUCTURE: H1 (#) title used exactly once. H2 (##) for sections, H3 (###) for subsections. TOC with linked headings for 4+ sections. Horizontal rules (---) between major sections. One blank line before/after headings, code blocks, tables, blockquotes.
TEXT: **Bold** for key terms and emphasis only; never bold entire sentences. *Italic* for citations, definitions, tool names. Inline backticks for filenames, functions, CLI commands, variables. Blockquotes (>) for callouts, prefix with "> **Note:**". Ordered lists for sequential steps only. Max 2-level nesting.
TABLES: | Header | separated by |---|. Alignment: :--- left, :---: center, ---: right. Numbers RIGHT-aligned (---:). Max 6 columns. Consistent decimal places within columns. Leave empty cells blank, never use N/A. Caption above as **bold text**. Negative values in parentheses.
CODE: Always specify language tag. Max 30 lines per block with explanatory text between. One concept per block.
STANDARDS: Descriptive link text (never raw URLs). No trailing whitespace, no tabs (spaces only). Every claim backed by data or reasoning.
`+FORMULA_RULES,

    html:`Semantic HTML5, Stripe/Linear documentation quality. Production-ready, responsive, WCAG AA compliant.
STRUCTURE: <header>, <nav>, <main>, <article>, <section>, <aside>, <footer>. Single <h1>, never skip heading levels. Meta: charset UTF-8, viewport (width=device-width, initial-scale=1), description, theme-color.
STYLING: BEM class names (.report__header, .data-table__cell--numeric). Font stack: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif. Mono: "JetBrains Mono", "Fira Code", monospace. Body: 16px, line-height 1.65, max-width 720px, color #333333. Headings: font-weight 700, color #1B2A4A. CSS custom properties: --color-primary: #1B2A4A; --color-accent: #4472C4; --color-text: #333; --color-border: #E2E8F0; --color-bg-subtle: #F8F9FA. Responsive: CSS Grid, stack below 768px.
TABLES: <table>/<caption>/<thead>/<tbody> with <th scope="col/row">. Wrapper <div> with overflow-x: auto for mobile. Header: font-weight 700, background var(--color-primary), color white, padding 10px 14px. Striped: nth-child(even) var(--color-bg-subtle). Numeric: text-align right, font-variant-numeric: tabular-nums. Leave empty cells blank.
ACCESSIBILITY: Descriptive alt text. Visible focus styles (outline 2px solid accent, offset 2px). 4.5:1 contrast for body, 3:1 for large text. ARIA labels on icon buttons. Logical tab order. Skip-to-content link. @media (prefers-reduced-motion: reduce).
STANDARDS: Zero inline styles. 2-space indent. No deprecated elements. Print stylesheet (@media print). Lazy-load images. Load MathJax v3 for LaTeX rendering via a script tag pointing to cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js (async attribute recommended).
`+FORMULA_RULES,

    json:`Production JSON, Stripe API / Bloomberg data feed quality. Parseable by JSON.parse() with zero errors.
STRUCTURE: Root object with "metadata" (schemaVersion, generatedAt ISO 8601 with timezone, source, description, recordCount), "data", "summary". Max 4 levels deep. Arrays for same-type collections (identical key shapes). Pagination-ready: include total, offset, limit.
NAMING: camelCase for all keys (totalRevenue, createdAt, riskScore). Descriptive, NEVER abbreviate (customerLifetimeValue not clv). Boolean: is/has/can prefix. Arrays: plural nouns. Enum values: lowercase_snake_case.
VALUES: Numbers raw numeric, never quoted. Missing: null (never 0, "", "N/A", "null"). Dates: ISO 8601 "2026-04-10T14:30:00Z". Currency: {"amount": 1234.56, "currency": "USD"}, never "$1,234.56". Percentages: decimal (0.153 not 15.3%). Booleans: true/false (never "true", 1). IDs: string type.
STANDARDS: 2-space indent, consistent throughout. No trailing commas, no comments. Every object in an array MUST have identical key sets (use null for absent values). Sorted keys for deterministic output. Include $schema or type field.`,

    csv:`Production CSV, RFC 4180 compliant. Direct import into Excel, pandas, R, or any BI tool.
STRUCTURE: Row 1 header with descriptive unique column names in snake_case (revenue_usd, growth_rate_pct, report_date). One record per row, identical column count across ALL rows. Sort by primary axis (date descending or primary key ascending). Column order: identifiers (id, name, ticker), then dimensions (date, region), then measures (revenue, margin, growth).
DATA: Double-quote fields containing commas, newlines, or quotes. Escape internal quotes with "". Numbers raw numeric only, no thousand separators (1234567.89). Dates ISO 8601 (YYYY-MM-DD). Timestamps with timezone. Currency numeric only, currency in column header (revenue_usd). Percentages decimal, noted in header (growth_rate_pct, 0.153 = 15.3%). Missing: empty field (adjacent commas). NEVER N/A, null, "-", or 0 for missing. Boolean: 1/0 or TRUE/FALSE, consistent throughout.
STANDARDS: UTF-8 no BOM. LF line endings. No trailing commas or whitespace. No blank rows. Comment header: # Source, Date range, Generated, Columns, Rows. Column definitions appendix.`,

    plaintext:`Professional plain text, top-tier firm memo standard. Readable in any editor, terminal, email, or print.
STRUCTURE: Centered CAPS title, date (Month DD, YYYY), author, separator (======). Section headers in CAPS or Title Case with underline (------). DO NOT number headers. Blank line before headers. "--- END OF DOCUMENT ---" at bottom.
LAYOUT: STRICT 80 character maximum per line. Body left-aligned, single-spaced, one blank line between paragraphs. Dash (-) for unordered lists, 2-space indent. Numbered steps: Arabic numerals with period (1. 2. 3.), 3-space indent continuation.
TABLES: Column-aligned using spaces. Header row with dashes below. Right-align all numeric columns. 4+ spaces between columns. Right-pad text columns to uniform width. NEVER let columns overlap or misalign.
EMPHASIS: CAPS for headers and critical warnings ONLY. *asterisks* for emphasis. 4-space indent for callouts. [NOTE], [IMPORTANT], [ACTION REQUIRED] inline labels.
STANDARDS: ASCII only (-- not em-dash, " not smart quotes, ... not ellipsis). Spaces only, no tabs. Cross-references: "see Section 3.2". Print-friendly at any monospaced font.`,

    codeFile:`Production-ready code file, Google/Stripe/Vercel open-source quality. Runs without modification.
STRUCTURE: File header (filename, description, author, date, license SPDX). Imports grouped: (1) stdlib, (2) third-party, (3) local, with a blank line between groups, alphabetical within. Order: Constants, then Type definitions, then Helper functions (private), then Public API, then Entry point.
QUALITY: Follow canonical style guide (PEP 8, Airbnb, rustfmt, Google Style). Type annotations on ALL function signatures (params + return). Docstrings/JSDoc on ALL public functions (@param, @returns, @throws, @example). Specific exception types with context messages. Input validation at public boundaries. Named constants, no magic numbers.
NAMING: Functions: verb_noun (calculate_revenue). Classes: PascalCase nouns (RevenueCalculator). Constants: UPPER_SNAKE_CASE. Variables: descriptive, no single-letter except loop counters. Booleans: is_/has_/can_ prefix.
STANDARDS: All imports resolvable, no placeholder code. Logging over print. No hardcoded credentials. Parameterized queries. Performance notes where relevant. Suggest test file name and key test cases.`
  };

  if(hasFileInst&&FILE_INST[fileOutput]){
    contractParts.push(FILE_INST[fileOutput]);

    // Industry design standard for styled file types
    const styledFileTypes=["pdf","word","ppt","excel"];
    const indStyle=IND_STYLE[industry]||IND_STYLE.general;
    if(styledFileTypes.includes(fileOutput)&&indStyle){
      const f=indStyle.fonts;const c=indStyle.colors;
      contractParts.push("DESIGN STANDARD: "+indStyle.label+" (ref: "+indStyle.ref+")\nFONTS: "+f.primary+" (headings), "+f.secondary+" (body), "+f.data+" (tables/numbers), "+f.mono+" (code/formulas).\nCOLORS: Primary "+c.primary+" (headers, dividers). Secondary "+c.secondary+" (charts). Accent "+c.accent+" (highlights, callouts). Text "+c.text+". Muted "+c.muted+" (captions). Table headers: "+c.headerBg+" bg / "+c.headerText+" text. Alt rows: "+c.altRow+". Borders: "+c.border+". Negative values: "+c.negative+". Positive: "+c.positive+".\nApply these fonts and colors consistently across ALL pages, slides, tabs, tables, and charts.");
    }
  }

  // Finalize CONTRACT
  if(contractParts.length>0){
    sec("contract",contractParts.join("\n\n"));
  }

  // ═══ BLOCK 4: QUALITY_GATE ═══
  if(tier!=="fast"&&hasFileInst){
    const docFileTypes=["pdf","word","ppt","excel"];
    const dataFileTypes=["json","csv","excel"];
    const qgParts=[];
    if(docFileTypes.includes(fileOutput)){
      qgParts.push("(1) Every table cell complete. No truncation, no word-breaking, no wrapping. Abbreviate or widen if needed.");
      qgParts.push("(2) No page/slide less than 40% filled. Merge sections or extend content.");
      qgParts.push("(3) Consistent number formatting within each column (decimals, units, alignment).");
      qgParts.push("(4) Every abbreviation defined in glossary or footnote.");
    }
    if(dataFileTypes.includes(fileOutput)){
      qgParts.push("("+((qgParts.length||0)+1)+") All data types consistent within columns. No missing keys. No mixed formats.");
    }
    if(fileOutput==="codeFile"){
      qgParts.push("(1) Code compiles/runs without errors. All imports resolve. No placeholder functions.");
      qgParts.push("(2) All public functions have type annotations and docstrings.");
    }
    if(fileOutput==="markdown"||fileOutput==="html"){
      qgParts.push("("+(qgParts.length+1)+") All tables render correctly with consistent alignment. All links valid. No raw URLs in body text.");
    }
    if(fileOutput==="plaintext"){
      qgParts.push("(1) Every line 80 characters or fewer. ASCII only: straight quotes, double-dash, three-dot ellipsis. No smart quotes, no em-dash characters, no ellipsis glyph.");
      qgParts.push("(2) Tables column-aligned with spaces, no overlap, right-aligned numerics.");
      qgParts.push("(3) Headers in CAPS or Title Case with underline, never numbered.");
    }
    if(qgParts.length>0){
      qgParts.push("Fix any failure before delivering.");
      sec("quality_gate",qgParts.join("\n"));
    }
  }

  // ═══ BLOCK 5: AVOID ═══
  if(isXml){
    // Claude best practice: tell the model what TO DO, not what NOT to do.
    // Positive framing per Anthropic prompting guide.
    if(tier==="fast"){
      sec("avoid","Start with substance immediately. Every sentence must contain a fact, figure, or actionable point. End with specifics.\nDo not overuse em dashes. Use periods, commas, colons, or semicolons instead. Limit em dashes to at most one per paragraph, and only where no other punctuation works.");
    }else{
      sec("avoid","Open with the most important finding or recommendation. Back every claim with evidence or reasoning. Write for an audience that already understands the domain; skip introductory background. Make each paragraph advance the argument; if a paragraph restates a prior point, cut it.\nDo not overuse em dashes. Use periods, commas, colons, or semicolons instead. Limit em dashes to at most one per paragraph, and only where no other punctuation works. Excessive em dashes make prose look rushed and informal.");
    }
  }else{
    if(tier==="fast"){
      sec("avoid","No filler, hedging, or preamble. Start with substance, end with specifics. No overuse of em dashes; use proper punctuation (periods, commas, colons, semicolons).");
    }else{
      sec("avoid","No filler openers. No vague hedging without specifics. No generic background the audience knows. No empty cliches. No restating the same point. No overuse of em dashes; limit to at most one per paragraph. Use periods, commas, colons, or semicolons instead.");
    }
  }

  // Token efficiency for non-flagship tiers
  if(tier==="balanced"){
    sec("efficiency","Balanced-tier model. Thorough but concise. Maximum insight per paragraph.");
  }else if(tier==="fast"){
    sec("efficiency","Fast-tier model. Extremely concise. Bullets over paragraphs. Keep response short.");
  }

  // ═══ BLOCK 6: CLAUDE-SPECIFIC BEST PRACTICES (Anthropic official guidance) ═══
  if(isXml){
    const claudeParts=[];

    // No-preamble rule (Anthropic: "Respond directly without preamble")
    claudeParts.push("Respond directly without preamble. Do not start with phrases like \"Here is...\", \"Based on...\", \"Certainly!\", or \"I'd be happy to...\". Begin with the deliverable itself.");

    // Self-verification (Anthropic: "Before you finish, verify your answer against [criteria]")
    if(tier==="flagship"||tier==="balanced"){
      const checkItems=[];
      checkItems.push("fully addresses every part of the task");
      checkItems.push("claims are supported by evidence or labeled as estimates");
      checkItems.push("structure is consistent (headers, numbering, formatting)");
      if(hasFileInst)checkItems.push("all file-format rules above are satisfied (table rules, typography, spacing)");
      if(industry==="finance")checkItems.push("every number has units, time period, and currency specified");
      if(industry==="legal")checkItems.push("jurisdictional applicability is noted");
      if(industry==="healthcare")checkItems.push("clinical disclaimers are present where needed");
      claudeParts.push("Before you finish, verify your response against these criteria:\n"+checkItems.map((c,i)=>"("+(i+1)+") "+c).join("\n"));
    }

    // Ground in quotes when attachments present (Anthropic: "Quote relevant parts first")
    if(hasAttachment){
      claudeParts.push("Before performing your analysis, extract and quote the most relevant data points from the attached documents inside <quotes> tags. Then base your analysis on these specific quotes.");
    }

    // Long-form prose guidance for document outputs (Anthropic: anti-markdown/bullet-list guidance)
    const docOutputs=["document","proposal","brief"];
    if(docOutputs.includes(output)&&hasFileInst&&["pdf","word","plaintext"].includes(fileOutput)){
      claudeParts.push("Write in clear, flowing prose using complete paragraphs. Reserve bullet points for genuinely discrete items. Incorporate supporting details naturally into sentences rather than fragmenting them into isolated bullet points.");
    }

    // Industry-specific Claude guidance — sector-specific tips beyond IND_CONTEXT
    const CLAUDE_SECTOR_TIPS={
      finance:"When presenting financial data: state the base case first, then sensitivities. Label every assumption explicitly. Use consistent valuation methodology throughout. Separate backward-looking actuals from forward estimates with clear notation (e.g. FY24A vs FY25E). Cross-reference figures across tables for consistency.",
      healthcare:"Structure clinical information using the PICO framework (Patient/Population, Intervention, Comparison, Outcome) where applicable. Cite evidence levels (Level I meta-analysis through Level V expert opinion). Flag off-label uses or emerging therapies distinctly from standard-of-care.",
      legal:"Structure legal analysis using IRAC (Issue, Rule, Application, Conclusion). Cite specific statutes, regulations, or case law with full citations. Distinguish between binding authority and persuasive authority. Flag areas of unsettled law explicitly.",
      consulting:"Follow the pyramid principle: lead every section with the conclusion, then provide supporting evidence. Structure arguments as MECE (Mutually Exclusive, Collectively Exhaustive). Quantify all impact estimates with specific figures and assumptions. Include an implementation roadmap with owners, timelines, and dependencies.",
      tech:"Include version numbers for all technologies referenced. Distinguish between stable/LTS and experimental features. Address backward compatibility, migration paths, and deprecation timelines. Provide complexity analysis (Big-O) for algorithmic recommendations.",
      marketing:"Tie every recommendation to a measurable KPI (CAC, ROAS, LTV, conversion rate). Include channel-specific benchmarks. Reference current platform algorithm behavior (not outdated patterns). Segment recommendations by funnel stage.",
      education:"Align content to Bloom's taxonomy levels. Include formative assessment checkpoints. Provide differentiation strategies for varied learning levels. Reference specific pedagogical frameworks (UDL, scaffolding, spaced repetition).",
      research:"Follow discipline-standard reporting (CONSORT for trials, PRISMA for reviews, STROBE for observational). State hypotheses before results. Distinguish correlation from causation. Include effect sizes and confidence intervals alongside p-values. Address limitations and generalizability."
    };
    if(CLAUDE_SECTOR_TIPS[industry]){
      claudeParts.push(CLAUDE_SECTOR_TIPS[industry]);
    }

    // File-output-specific Claude guidance — what Claude specifically needs to nail each format
    const CLAUDE_FILE_TIPS={
      pdf:"When producing PDF-formatted content: maintain strict vertical rhythm throughout. Every page must feel intentionally designed. No orphan headers, no half-empty pages. Use the exact typography and color specifications above as a binding contract, not suggestions.",
      word:"Maintain style consistency that enables TOC auto-generation from heading styles. Every table must repeat its header row specification for multi-page scenarios. Use landscape section breaks for wide tables rather than shrinking fonts.",
      excel:"Produce formulas, never hardcoded values. Every calculated cell must use a formula referencing source cells. Use named ranges for key assumptions. Include IFERROR wrappers on all division formulas. Structure the Summary tab as a dashboard with navigation links to detail tabs.",
      ppt:"Every slide title must be an assertion (a complete sentence stating a conclusion), never a topic label. The slide body must provide evidence supporting that assertion. Limit to 5 bullets maximum per slide. Include speaker notes with: key message, 3-4 supporting data points, anticipated questions, and transition to next slide.",
      json:"Produce valid JSON parseable by JSON.parse() with zero errors. Use consistent camelCase for all keys. Include a metadata block with schemaVersion, generatedAt (ISO 8601), and recordCount. Every array element must have identical key shapes.",
      csv:"Produce RFC 4180 compliant output. Use snake_case headers. Include a comment header row with source, date range, and column definitions. Numbers must be raw numeric (no formatting characters). Missing values must be empty fields (adjacent commas), never sentinel strings.",
      markdown:"Structure for rendering in GitHub, Notion, and Confluence simultaneously. Use a single H1, H2 for sections, H3 for subsections. Include a linked TOC for documents with 4+ sections. Use fenced code blocks with language tags.",
      html:"Produce semantic HTML5 with proper heading hierarchy (never skip levels). Include ARIA labels and skip-to-content links for accessibility. Use CSS custom properties for all colors and spacing. Ensure WCAG AA contrast ratios.",
      codeFile:"Include a file header with filename, description, and date. Group imports: stdlib, third-party, local. Add JSDoc/docstring with @param, @returns, @throws, @example on all public functions. Use strict type annotations throughout.",
      plaintext:"Enforce strict 80-character line limit. Use ASCII only: straight quotes, double-dash, three-dot ellipsis. Align table columns with spaces, right-align numerics. End with '--- END OF DOCUMENT ---'."
    };
    if(CLAUDE_FILE_TIPS[fileOutput]){
      claudeParts.push(CLAUDE_FILE_TIPS[fileOutput]);
    }

    if(claudeParts.length>0){
      sec("claude_guidance",claudeParts.join("\n\n"));
    }
  }

  // ═══ BLOCK 6b: CHATGPT / o-SERIES BEST PRACTICES (OpenAI official guidance) ═══
  if(model==="chatgpt"||model==="gpt4o"){
    const gptParts=[];

    // No preamble (GPT-5 series: literal instruction following)
    gptParts.push("Respond directly with the deliverable. Skip introductory phrasing such as \"Sure!\", \"Here is...\", or \"Based on your request...\".");

    // Instruction hierarchy (GPT-5: later instructions override earlier)
    if(tier==="flagship"||tier==="balanced"){
      const checkItems=["fully addresses every part of the task","claims supported by evidence or labeled as estimates","structure consistent (headers, numbering, formatting)"];
      if(hasFileInst)checkItems.push("all file-format rules above are satisfied");
      if(industry==="finance")checkItems.push("every number has units, time period, and currency");
      gptParts.push("Before finalizing, verify:\n"+checkItems.map((c,i)=>(i+1)+". "+c).join("\n"));
    }

    // Markdown formatting control (GPT-5 series: use markdown hierarchy)
    const docOutputs=["document","proposal","brief"];
    if(docOutputs.includes(output)&&hasFileInst&&["pdf","word","plaintext"].includes(fileOutput)){
      gptParts.push("Write in flowing prose paragraphs. Reserve bullet points for genuinely discrete items. Use markdown headings (H1-H3) for structure but minimize bold/italic emphasis.");
    }

    // Sector tips
    const GPT_SECTOR_TIPS={
      finance:"Present financial data with base case first, then sensitivities. Label assumptions explicitly. Use FY24A/FY25E notation to separate actuals from estimates. Ensure cross-table figure consistency.",
      healthcare:"Structure clinical information using PICO (Patient, Intervention, Comparison, Outcome). Cite evidence levels. Flag off-label uses distinctly from standard-of-care.",
      legal:"Use IRAC structure (Issue, Rule, Application, Conclusion). Cite statutes with full references. Distinguish binding from persuasive authority.",
      consulting:"Lead with conclusions (pyramid principle). Structure as MECE. Quantify impact estimates. Include implementation roadmap with owners and timelines.",
      tech:"Include version numbers. Address backward compatibility and deprecation timelines. Provide Big-O complexity for algorithms.",
      marketing:"Tie recommendations to KPIs (CAC, ROAS, LTV). Include channel benchmarks. Segment by funnel stage.",
      education:"Align to Bloom's taxonomy. Include formative assessments. Reference UDL and scaffolding frameworks.",
      research:"Follow discipline-standard reporting (CONSORT/PRISMA/STROBE). Include effect sizes and confidence intervals. Distinguish correlation from causation."
    };
    if(GPT_SECTOR_TIPS[industry])gptParts.push(GPT_SECTOR_TIPS[industry]);

    // File tips
    const GPT_FILE_TIPS={
      pdf:"Maintain strict vertical rhythm. No orphan headers or half-empty pages. Treat typography specs as binding requirements.",
      word:"Enable TOC auto-generation via consistent heading styles. Repeat header rows on multi-page tables. Use landscape section breaks for wide tables.",
      excel:"Use formulas, never hardcoded values. Named ranges for assumptions. IFERROR on all divisions. Summary tab with navigation links.",
      ppt:"Slide titles must be assertions (conclusions), not topic labels. Max 5 bullets per slide. Include speaker notes with key message, data points, and anticipated questions.",
      json:"Output valid JSON parseable by JSON.parse(). Use camelCase keys. Include metadata (schemaVersion, generatedAt, recordCount). Identical key shapes across array elements.",
      csv:"RFC 4180 compliant. snake_case headers. Raw numeric values only. Missing = empty field, never sentinel strings.",
      markdown:"Single H1. H2/H3 hierarchy. Linked TOC for 4+ sections. Fenced code blocks with language tags.",
      html:"Semantic HTML5. Never skip heading levels. ARIA labels. WCAG AA contrast. CSS custom properties.",
      codeFile:"File header with filename/description/date. Grouped imports. JSDoc on public functions. Type annotations throughout.",
      plaintext:"80-character max per line. ASCII only. Column-aligned tables. End with '--- END OF DOCUMENT ---'."
    };
    if(GPT_FILE_TIPS[fileOutput])gptParts.push(GPT_FILE_TIPS[fileOutput]);

    if(gptParts.length>0)sec("model_guidance",gptParts.join("\n\n"));
  }

  // ═══ BLOCK 6c: GEMINI BEST PRACTICES (Google official guidance) ═══
  if(model==="gemini"){
    const gemParts=[];

    // No preamble (Gemini 3: direct and efficient)
    gemParts.push("Respond directly with the deliverable. Gemini default: direct and efficient. Skip introductory or meta-commentary phrasing.");

    // Self-check (Gemini: plan before executing)
    if(tier==="flagship"||tier==="balanced"){
      const checkItems=["fully addresses every part of the task","claims supported by evidence or labeled as estimates","structure consistent throughout"];
      if(hasFileInst)checkItems.push("all file-format rules above are satisfied");
      if(industry==="finance")checkItems.push("every number has units, time period, and currency");
      gemParts.push("Before finalizing, verify:\n"+checkItems.map((c,i)=>(i+1)+". "+c).join("\n"));
    }

    // Prose guidance
    const docOutputs=["document","proposal","brief"];
    if(docOutputs.includes(output)&&hasFileInst&&["pdf","word","plaintext"].includes(fileOutput)){
      gemParts.push("Write in clear, flowing prose paragraphs. Reserve bullet points for genuinely discrete items. Use bold section headers for structure.");
    }

    // Sector tips
    const GEM_SECTOR_TIPS={
      finance:"Present base case then sensitivities. Label assumptions. Use FY24A/FY25E notation. Cross-reference tables for consistency.",
      healthcare:"Use PICO framework. Cite evidence levels (I-V). Flag off-label uses.",
      legal:"Use IRAC structure. Full statute citations. Distinguish binding vs persuasive authority.",
      consulting:"Pyramid principle (conclusion first). MECE structure. Quantified impact. Implementation roadmap.",
      tech:"Version numbers for all technologies. Backward compatibility. Big-O complexity analysis.",
      marketing:"Tie to KPIs (CAC, ROAS, LTV). Channel benchmarks. Funnel stage segmentation.",
      education:"Bloom's taxonomy alignment. Formative assessments. UDL/scaffolding frameworks.",
      research:"CONSORT/PRISMA/STROBE reporting. Effect sizes + CIs. Correlation vs causation."
    };
    if(GEM_SECTOR_TIPS[industry])gemParts.push(GEM_SECTOR_TIPS[industry]);

    // File tips
    const GEM_FILE_TIPS={
      pdf:"Strict vertical rhythm. No orphan headers. Typography specs are binding.",
      word:"Consistent heading styles for TOC. Repeat header rows. Landscape breaks for wide tables.",
      excel:"Formulas only, no hardcoded values. Named ranges. IFERROR wrappers. Summary dashboard.",
      ppt:"Assertion-evidence slide titles. Max 5 bullets. Speaker notes with key message and data.",
      json:"Valid JSON. camelCase keys. metadata block. Identical array element shapes.",
      csv:"RFC 4180. snake_case headers. Raw numerics. Empty fields for missing data.",
      markdown:"Single H1. H2/H3 hierarchy. Linked TOC. Fenced code blocks.",
      html:"Semantic HTML5. Proper heading hierarchy. ARIA labels. WCAG AA.",
      codeFile:"File header. Grouped imports. Docstrings on public functions. Type annotations.",
      plaintext:"80-char limit. ASCII only. Aligned tables. '--- END OF DOCUMENT ---'."
    };
    if(GEM_FILE_TIPS[fileOutput])gemParts.push(GEM_FILE_TIPS[fileOutput]);

    if(gemParts.length>0)sec("model_guidance",gemParts.join("\n\n"));
  }

  // ═══ BLOCK 6d: GROK BEST PRACTICES (xAI guidance) ═══
  if(model==="grok"){
    const grokParts=[];
    grokParts.push("Respond directly with the deliverable. Skip conversational preamble.");

    if(tier!=="fast"){
      const checkItems=["fully addresses the task","claims supported by evidence","consistent formatting throughout"];
      if(hasFileInst)checkItems.push("file-format rules satisfied");
      grokParts.push("Before finalizing, verify:\n"+checkItems.map((c,i)=>(i+1)+". "+c).join("\n"));
    }

    const docOutputs=["document","proposal","brief"];
    if(docOutputs.includes(output)&&hasFileInst&&["pdf","word","plaintext"].includes(fileOutput)){
      grokParts.push("Write in flowing prose. Reserve bullets for discrete items.");
    }

    // Sector + file tips (concise for Grok's direct style)
    const GROK_SECTOR={
      finance:"Base case then sensitivities. FY24A/FY25E notation. Cross-reference tables.",
      healthcare:"PICO framework. Evidence levels. Clinical disclaimers.",
      legal:"IRAC structure. Full citations. Binding vs persuasive authority.",
      consulting:"Pyramid principle. MECE. Quantified impact.",
      tech:"Version numbers. Backward compat. Complexity analysis.",
      research:"CONSORT/PRISMA reporting. Effect sizes + CIs."
    };
    if(GROK_SECTOR[industry])grokParts.push(GROK_SECTOR[industry]);

    const GROK_FILE={
      pdf:"Strict typography. No orphan headers. No half-empty pages.",
      word:"Heading styles for TOC. Repeat header rows. Landscape for wide tables.",
      excel:"Formulas only. Named ranges. IFERROR wrappers.",
      ppt:"Assertion titles. Max 5 bullets. Speaker notes.",
      json:"Valid JSON. camelCase. metadata block.",
      csv:"RFC 4180. snake_case headers. Raw numerics.",
      codeFile:"File header. Grouped imports. Type annotations."
    };
    if(GROK_FILE[fileOutput])grokParts.push(GROK_FILE[fileOutput]);

    if(grokParts.length>0)sec("model_guidance",grokParts.join("\n\n"));
  }

  // ═══ BLOCK 6e: MISTRAL BEST PRACTICES (Mistral official guidance) ═══
  if(model==="mistral"){
    const misParts=[];
    misParts.push("Respond directly with the deliverable. No preamble, no meta-commentary.");

    if(tier!=="fast"){
      const checkItems=["fully addresses the task","claims supported by evidence","formatting consistent"];
      if(hasFileInst)checkItems.push("file-format rules satisfied");
      misParts.push("Before finalizing, verify:\n"+checkItems.map((c,i)=>(i+1)+". "+c).join("\n"));
    }

    // Mistral-specific: worded scales, structured hierarchy
    const docOutputs=["document","proposal","brief"];
    if(docOutputs.includes(output)&&hasFileInst&&["pdf","word","plaintext"].includes(fileOutput)){
      misParts.push("Write in flowing prose. Reserve bullet points for genuinely discrete items. Use clear heading hierarchy.");
    }

    const MIS_SECTOR={
      finance:"Base case then sensitivities. Label assumptions. FY24A/FY25E notation.",
      healthcare:"PICO framework. Evidence levels. Clinical disclaimers.",
      legal:"IRAC structure. Full citations. Jurisdictional notes.",
      consulting:"Pyramid principle. MECE. Quantified impact. Roadmap.",
      tech:"Version numbers. Backward compat. Big-O complexity.",
      research:"CONSORT/PRISMA reporting. Effect sizes. Correlation vs causation."
    };
    if(MIS_SECTOR[industry])misParts.push(MIS_SECTOR[industry]);

    const MIS_FILE={
      pdf:"Strict typography. No orphan headers. Pages min 40% filled.",
      word:"Heading styles for TOC. Repeat header rows.",
      excel:"Formulas only. Named ranges. IFERROR wrappers.",
      ppt:"Assertion titles. Max 5 bullets. Speaker notes.",
      json:"Valid JSON. camelCase. metadata block.",
      csv:"RFC 4180. snake_case headers. Raw numerics.",
      codeFile:"File header. Grouped imports. Type annotations."
    };
    if(MIS_FILE[fileOutput])misParts.push(MIS_FILE[fileOutput]);

    if(misParts.length>0)sec("model_guidance",misParts.join("\n\n"));
  }

  // ═══ BLOCK 6f: LLAMA BEST PRACTICES (Meta guidance) ═══
  if(model==="llama"){
    const llamaParts=[];
    llamaParts.push("Respond directly with the deliverable. No conversational preamble or meta-commentary.");

    if(tier!=="fast"){
      const checkItems=["fully addresses the task","claims supported by evidence","consistent formatting"];
      if(hasFileInst)checkItems.push("file-format rules satisfied");
      llamaParts.push("Before finalizing, verify:\n"+checkItems.map((c,i)=>(i+1)+". "+c).join("\n"));
    }

    const docOutputs=["document","proposal","brief"];
    if(docOutputs.includes(output)&&hasFileInst&&["pdf","word","plaintext"].includes(fileOutput)){
      llamaParts.push("Write in flowing prose. Reserve bullet points for discrete items. Use clear headings.");
    }

    const LLAMA_SECTOR={
      finance:"Base case then sensitivities. Label assumptions. FY24A/FY25E notation.",
      healthcare:"PICO framework. Evidence levels. Clinical disclaimers.",
      legal:"IRAC structure. Full citations. Binding vs persuasive authority.",
      consulting:"Pyramid principle. MECE. Quantified impact.",
      tech:"Version numbers. Backward compatibility. Complexity analysis.",
      research:"CONSORT/PRISMA reporting. Effect sizes + CIs."
    };
    if(LLAMA_SECTOR[industry])llamaParts.push(LLAMA_SECTOR[industry]);

    const LLAMA_FILE={
      pdf:"Strict typography. No orphan headers. No half-empty pages.",
      word:"Heading styles for TOC. Repeat header rows.",
      excel:"Formulas only. Named ranges. IFERROR wrappers.",
      ppt:"Assertion titles. Max 5 bullets. Speaker notes.",
      json:"Valid JSON. camelCase. metadata block.",
      csv:"RFC 4180. snake_case headers. Raw numerics.",
      codeFile:"File header. Grouped imports. Type annotations."
    };
    if(LLAMA_FILE[fileOutput])llamaParts.push(LLAMA_FILE[fileOutput]);

    if(llamaParts.length>0)sec("model_guidance",llamaParts.join("\n\n"));
  }

  // ═══ BLOCK 6g: PERPLEXITY / COPILOT / GENERAL — universal guidance ═══
  if(model==="perplexity"||model==="copilot"||model==="general"){
    const uniParts=[];
    uniParts.push("Respond directly with the deliverable. No introductory preamble.");

    if(tier!=="fast"){
      const checkItems=["fully addresses the task","claims supported by evidence","formatting consistent"];
      if(hasFileInst)checkItems.push("file-format rules satisfied");
      uniParts.push("Before finalizing, verify:\n"+checkItems.map((c,i)=>(i+1)+". "+c).join("\n"));
    }

    const docOutputs=["document","proposal","brief"];
    if(docOutputs.includes(output)&&hasFileInst&&["pdf","word","plaintext"].includes(fileOutput)){
      uniParts.push("Write in flowing prose. Reserve bullets for discrete items.");
    }

    // Key sector tips for universal models
    const UNI_SECTOR={
      finance:"Base case then sensitivities. Label assumptions. Consistent valuation methodology.",
      healthcare:"PICO framework. Evidence levels. Clinical disclaimers.",
      legal:"IRAC structure. Full citations. Jurisdictional notes.",
      consulting:"Pyramid principle. MECE. Quantified impact.",
      tech:"Version numbers. Backward compatibility. Complexity analysis."
    };
    if(UNI_SECTOR[industry])uniParts.push(UNI_SECTOR[industry]);

    const UNI_FILE={
      pdf:"Strict typography. No orphan headers.",
      word:"Heading styles for TOC. Repeat header rows.",
      excel:"Formulas only. Named ranges.",
      ppt:"Assertion titles. Max 5 bullets. Speaker notes.",
      json:"Valid JSON. camelCase. metadata block.",
      csv:"RFC 4180. snake_case headers.",
      codeFile:"File header. Grouped imports. Type annotations."
    };
    if(UNI_FILE[fileOutput])uniParts.push(UNI_FILE[fileOutput]);

    if(uniParts.length>0)sec("model_guidance",uniParts.join("\n\n"));
  }

  return lines.join("\n\n");
}

/* ═══════════════════════════════════════════════════════
   HISTORY — Supabase persistence
   ═══════════════════════════════════════════════════════ */
async function loadHistoryFromDB(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return [];
  const {data,error}=await supabase.from("prompt_history").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20);
  if(error){console.error("History load error:",error);return [];}
  return (data||[]).map(r=>({id:r.id,topic:r.topic,task:r.task,industry:r.industry,output:r.output,model:r.model,fileOutput:r.file_output,config:r.config||null,timestamp:new Date(r.created_at).getTime()}));
}
async function saveHistoryToDB(entry){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return;
  const row={user_id:user.id,topic:entry.topic,task:entry.task,industry:entry.industry,output:entry.output,model:entry.model,file_output:entry.fileOutput||"pdf",prompt_text:entry.promptText||null};
  if(entry.config)row.config=entry.config;
  const {error}=await supabase.from("prompt_history").insert(row);
  if(error)console.error("History save error:",error);
}
async function clearHistoryFromDB(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return;
  const {error}=await supabase.from("prompt_history").delete().eq("user_id",user.id);
  if(error)console.error("History clear error:",error);
}
async function deleteHistoryRow(id){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user||!id)return;
  const {error}=await supabase.from("prompt_history").delete().eq("user_id",user.id).eq("id",id);
  if(error)console.error("History row delete error:",error);
}

/* ═══════════════════════════════════════════════════════
   UI COMPONENTS
   ═══════════════════════════════════════════════════════ */
const Chip=({active,onClick,children,accent,sx})=><button onClick={onClick} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:"1.5px solid "+(active?accent||"var(--ac)":"var(--bd)"),background:active?(accent||"var(--ac)")+"14":"var(--s2)",color:active?accent||"var(--ac)":"var(--t2)",cursor:"pointer",fontSize:"clamp(11px,2.8vw,12.5px)",fontWeight:active?600:450,fontFamily:"var(--f)",transition:"all .15s",whiteSpace:"nowrap",...sx}}>{children}</button>;

const Step=({ico,title,sub,children,collapsed,onToggle})=>(
  <div style={{marginBottom:26}}>
    <div onClick={onToggle} style={{display:"flex",alignItems:"center",gap:10,marginBottom:sub&&!collapsed?4:collapsed?0:10,cursor:onToggle?"pointer":"default"}}>
      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:30,height:30,borderRadius:8,background:"var(--ac)14",flexShrink:0}}>{I[ico]?.(14,"var(--ac)")}</span>
      <span style={{fontSize:14,fontWeight:650,color:"var(--t1)",fontFamily:"var(--f)",letterSpacing:"-.2px",flex:1}}>{title}</span>
      {onToggle&&<span style={{color:"var(--t3)",fontSize:12,transition:"transform .2s",transform:collapsed?"rotate(-90deg)":"rotate(0deg)"}}>&#9660;</span>}
    </div>
    {!collapsed&&sub&&<p style={{margin:"0 0 10px 40px",fontSize:12,color:"var(--t3)",fontFamily:"var(--f)"}}>{sub}</p>}
    {!collapsed&&<div style={{marginLeft:40}}>{children}</div>}
  </div>
);

const Wrap=({children})=><div style={{display:"flex",flexWrap:"wrap",gap:"clamp(4px,1vw,6px)"}}>{children}</div>;

/* ═══════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════ */
function App(){
  const [uiLang,setUiLang]=useState(()=>localStorage.getItem("pa_ui_lang")||"en");
  const t=(key)=>(UI[key]&&UI[key][uiLang])||UI[key]?.en||key;
  const tl=(map,key)=>(map[key]&&map[key][uiLang])||map[key]?.en||key;
  const [mode,setMode]=useState("amateur");
  const [topic,setTopic]=useState("");
  const [task,setTask]=useState("writing");
  const [model,setModel]=useState("claude");
  const [subModel,setSubModel]=useState("opus-4-6");
  const [industry,setIndustry]=useState("general");
  const [output,setOutput]=useState("document");
  const [style,setStyle]=useState("formal");
  const [tone,setTone]=useState("Professional");
  const [len,setLen]=useState("Medium");
  const [fmt,setFmt]=useState(["prose"]);
  const [includes,setIncludes]=useState([]);
  const [techs,setTechs]=useState([]);
  const [aud,setAud]=useState("");
  const [extra,setExtra]=useState("");
  const [special,setSpecial]=useState("");
  const [riskLevel,setRiskLevel]=useState("medium");
  const [hasAttachment,setHasAttachment]=useState(false);
  const [language,setLanguage]=useState("English");
  const [fileOutput,setFileOutput]=useState("none");
  const [selectedFirm,setSelectedFirm]=useState("");
  const [selectedRole,setSelectedRole]=useState("");
  const [copied,setCopied]=useState(false);
  const [show,setShow]=useState(false);
  const [history,setHistory]=useState([]);
  const [showHistory,setShowHistory]=useState(false);
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [usage,setUsage]=useState({simple_used:0,expert_used:0,is_paid:false,subscription_status:"free"});
  const [showPaywall,setShowPaywall]=useState(false);
  const [paywallPlan,setPaywallPlan]=useState("annual");
  const [checkoutLoading,setCheckoutLoading]=useState(false);
  const [promoCode,setPromoCode]=useState("");
  const [promoLoading,setPromoLoading]=useState(false);
  const [promoMsg,setPromoMsg]=useState("");
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState("login");
  const [authEmail,setAuthEmail]=useState("");
  const [authPassword,setAuthPassword]=useState("");
  const [authName,setAuthName]=useState("");
  const [authErr,setAuthErr]=useState("");
  const [promptGenerated,setPromptGenerated]=useState(false);
  const [exampleSector,setExampleSector]=useState("");
  const [showResetUndo,setShowResetUndo]=useState(false);
  const [showExamples,setShowExamples]=useState(false);
  const [showProfileDD,setShowProfileDD]=useState(false);
  const [nlEmail,setNlEmail]=useState("");
  const [nlStatus,setNlStatus]=useState("");
  const [showReferral,setShowReferral]=useState(false);
  const [showCookies,setShowCookies]=useState(()=>!localStorage.getItem("pa_cookies"));
  const [refCode]=useState(()=>{const p=new URLSearchParams(window.location.search).get("ref");if(p&&/^[a-f0-9]{8}$/i.test(p)){window.history.replaceState({},"",window.location.pathname);return p;}return null;});
  const [labOpen,setLabOpen]=useState(false);
  const [labLoading,setLabLoading]=useState(false);
  const [labResults,setLabResults]=useState([]);
  const [labError,setLabError]=useState("");
  const [showPalette,setShowPalette]=useState(false);
  const [paletteQuery,setPaletteQuery]=useState("");
  const [streamedText,setStreamedText]=useState("");
  const [isStreaming,setIsStreaming]=useState(false);
  const streamRef=useRef(null);
  const [showCopyToast,setShowCopyToast]=useState(false);
  const copyToastTimer=useRef(null);
  const paletteRef=useRef(null);
  const ref=useRef(null);
  const isExp=mode==="expert";
  const ac=MODELS[model].col;
  const acRgb={"#0891B2":"8,145,178","#D97706":"217,119,6","#10A37F":"16,163,127","#0EA5E9":"14,165,233","#4285F4":"66,133,244","#F97316":"249,115,22","#FF6F00":"255,111,0","#8B5CF6":"139,92,246","#22D3EE":"34,211,238","#6366F1":"99,102,241","#64748B":"100,116,139"}[ac];

  // Auto-select first sub-model when parent model changes
  useEffect(()=>{
    const subs=SUB_MODELS[model];
    if(subs&&subs.length>0&&!subs.find(s=>s.id===subModel)){
      setSubModel(subs[0].id);
    }
  },[model]);

  const activeSubModel=useMemo(()=>{
    const subs=SUB_MODELS[model]||[];
    return subs.find(s=>s.id===subModel)||subs[0]||null;
  },[model,subModel]);

  const prompt=buildPrompt({topic,taskType:task,model,subModel,subModelTier:activeSubModel?.tier||"flagship",tone,length:len,format:fmt,techniques:techs,audience:aud,extra,special,mode,industry,output,style,includes,language,fileOutput,selectedFirm,selectedRole,hasAttachment,riskLevel});
  const enhancements=useMemo(()=>topic.trim()?getSmartEnhancements(topic,task,industry,output):[], [topic,task,industry,output]);

  // Load usage status from Supabase
  const refreshUsage=useCallback(async()=>{
    const {data,error}=await supabase.rpc("get_usage_status");
    if(!error&&data&&!data.error)setUsage(data);
  },[]);

  // Toggle UI language and persist to localStorage + Supabase profile
  const toggleUiLang=useCallback(()=>{
    const next=uiLang==="en"?"no":"en";
    setUiLang(next);
    localStorage.setItem("pa_ui_lang",next);
    if(user?.id){supabase.from("profiles").update({ui_lang:next}).eq("id",user.id);}
  },[uiLang,user]);

  // Initialize Supabase auth session and listen for changes
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){
        const u=session.user;
        setUser({id:u.id,name:u.user_metadata?.name||u.email?.split("@")[0]||"User",email:u.email});
        loadHistoryFromDB().then(h=>setHistory(h));
        supabase.rpc("get_usage_status").then(({data})=>{if(data&&!data.error)setUsage(data);});
        // Load saved UI language preference — profile is authoritative, but sync up if user toggled before login
        supabase.from("profiles").select("ui_lang").eq("id",u.id).single().then(({data})=>{
          const profileLang=data?.ui_lang||"en";
          const localLang=localStorage.getItem("pa_ui_lang")||"en";
          if(profileLang!=="en"){setUiLang(profileLang);localStorage.setItem("pa_ui_lang",profileLang);}
          else if(localLang!=="en"){supabase.from("profiles").update({ui_lang:localLang}).eq("id",u.id);}
        });
      }
      setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_IN"&&session?.user){
        const u=session.user;
        setUser({id:u.id,name:u.user_metadata?.name||u.email?.split("@")[0]||"User",email:u.email});
        loadHistoryFromDB().then(h=>setHistory(h));
        supabase.rpc("get_usage_status").then(({data})=>{if(data&&!data.error)setUsage(data);});
        supabase.from("profiles").select("ui_lang").eq("id",u.id).single().then(({data})=>{
          const profileLang=data?.ui_lang||"en";
          const localLang=localStorage.getItem("pa_ui_lang")||"en";
          if(profileLang!=="en"){setUiLang(profileLang);localStorage.setItem("pa_ui_lang",profileLang);}
          else if(localLang!=="en"){supabase.from("profiles").update({ui_lang:localLang}).eq("id",u.id);}
        });
      }else if(event==="SIGNED_OUT"){
        setUser(null);
        setHistory([]);
        setUsage({simple_used:0,expert_used:0,is_paid:false,subscription_status:"free"});
      }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // Handle return from Stripe checkout
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("payment")==="success"){
      // Refresh usage after successful payment (webhook may take a moment)
      const poll=setInterval(()=>{
        supabase.rpc("get_usage_status").then(({data})=>{
          if(data&&data.is_paid){setUsage(data);clearInterval(poll);}
        });
      },2000);
      setTimeout(()=>clearInterval(poll),30000);
      // Clean URL
      window.history.replaceState({},"",window.location.pathname);
    }
  },[]);

  // Keep goRef pointing at the latest go() closure so timers and the global
  // Cmd+Enter listener never call a stale version with old topic/usage state.
  useEffect(()=>{goRef.current=go;},[go]);

  // Global keyboard shortcuts:
  //   Cmd/Ctrl+Enter — generate (skipped when auth/paywall modal is open)
  //   Cmd/Ctrl+K     — toggle command palette
  //   Escape         — close palette if open
  useEffect(()=>{
    const onKey=(e)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){
        if(showAuth||showPaywall||showPalette)return;
        e.preventDefault();
        if(goRef.current)goRef.current();
      }
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){
        e.preventDefault();
        setShowPalette(v=>{if(!v)setPaletteQuery("");return !v;});
      }
      if(e.key==="Escape"&&showPalette){
        e.preventDefault();
        setShowPalette(false);
      }
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[showAuth,showPaywall,showPalette]);

  // Scroll-triggered reveal animations
  useEffect(()=>{
    const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");obs.unobserve(e.target);}});},{threshold:0.12,rootMargin:"0px 0px -40px 0px"});
    document.querySelectorAll(".reveal").forEach(el=>obs.observe(el));
    return ()=>obs.disconnect();
  },[]);

  // Animated counter hook
  const useCounter=(target,duration=900)=>{
    const [val,setVal]=useState(0);
    const triggered=useRef(false);
    const elRef=useRef(null);
    useEffect(()=>{
      if(!elRef.current)return;
      const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting&&!triggered.current){triggered.current=true;obs.disconnect();const start=performance.now();const step=(now)=>{const p=Math.min((now-start)/duration,1);setVal(Math.round(p*target));if(p<1)requestAnimationFrame(step);};requestAnimationFrame(step);}},{threshold:0.3});
      obs.observe(elRef.current);
      return ()=>obs.disconnect();
    },[]);
    return [val,elRef];
  };

  const [countIndustries,countIndRef]=useCounter(15,800);
  const [countModels,countModRef]=useCounter(5,600);
  const [countTasks,countTaskRef]=useCounter(15,800);

  // FREE LIMITS: 2 simple prompts, 1 expert prompt
  const FREE_SIMPLE=2;
  const FREE_EXPERT=1;
  const canGenerate=usage.is_paid||usage.subscription_status==="active"||(isExp?usage.expert_used<FREE_EXPERT:usage.simple_used<FREE_SIMPLE);
  const remainingSimple=Math.max(0,FREE_SIMPLE-usage.simple_used);
  const remainingExpert=Math.max(0,FREE_EXPERT-usage.expert_used);

  const lastGenRef=useRef(0);
  // Stable handle to the current go() closure so timers and global listeners always call the freshest version.
  const goRef=useRef(null);
  // Snapshot of state taken right before resetAll(); used by the undo toast.
  const lastResetSnapshotRef=useRef(null);
  // Pending timer for the auto-dismiss of the undo toast.
  const resetUndoTimerRef=useRef(null);
  const go=useCallback(()=>{
    // Must have account
    if(!user){setAuthMode("signup");setShowAuth(true);setAuthErr("");return;}
    // Client-side rate limit: 1 generation per 3 seconds
    const now=Date.now();
    if(now-lastGenRef.current<3000){return;}
    lastGenRef.current=now;
    // Sanitize topic input
    const cleanTopic=sanitizeText(topic);
    if(!cleanTopic||cleanTopic.length<3){alert("Please describe your goal (at least 3 characters).");return;}
    // Check paywall
    if(!usage.is_paid&&usage.subscription_status!=="active"){
      if(isExp&&usage.expert_used>=FREE_EXPERT){trackEvent("paywall_shown",{mode:"expert"});setShowPaywall(true);return;}
      if(!isExp&&usage.simple_used>=FREE_SIMPLE){trackEvent("paywall_shown",{mode:"simple"});setShowPaywall(true);return;}
    }
    setShow(true);
    setPromptGenerated(true);
    trackEvent("prompt_built",{mode:isExp?"expert":"simple",task,industry,model});
    // Typewriter streaming effect
    if(streamRef.current)cancelAnimationFrame(streamRef.current);
    setStreamedText("");setIsStreaming(true);
    const fullText=prompt;const len2=fullText.length;const charsPerFrame=Math.max(4,Math.ceil(len2/180));
    let pos=0;
    const tick=()=>{pos=Math.min(pos+charsPerFrame,len2);setStreamedText(fullText.slice(0,pos));if(pos<len2){streamRef.current=requestAnimationFrame(tick);}else{setIsStreaming(false);streamRef.current=null;}};
    streamRef.current=requestAnimationFrame(tick);
    // Increment usage in DB
    supabase.rpc("increment_prompt_count",{mode:isExp?"expert":"simple"}).then(({data})=>{
      if(data)setUsage(data);
    });
    if(user){
      const config={mode,task,model,subModel,industry,output,style,tone,len,fmt,includes,techs,aud,extra,special,riskLevel,language,fileOutput,selectedFirm,selectedRole};
      const entry={topic,task,industry,output,model,fileOutput,promptText:prompt,config};
      saveHistoryToDB(entry).then(()=>loadHistoryFromDB().then(h=>setHistory(h)));
    }
    setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth",block:"start"}),120);
  },[topic,task,industry,output,model,subModel,fileOutput,prompt,user,isExp,usage,mode,style,tone,len,fmt,includes,techs,aud,extra,special,riskLevel,language,selectedFirm,selectedRole]);

  const isFree=!usage.is_paid&&usage.subscription_status!=="active";
  const watermark="\n\n---\nGenerated with Prompt Architect | proarch.tech";
  const copyText=isFree?prompt+watermark:prompt;

  const cp=useCallback(()=>{
    const done=()=>{setCopied(true);setShowCopyToast(true);trackEvent("prompt_copied",{mode:isExp?"expert":"simple",watermarked:isFree});if(copyToastTimer.current)clearTimeout(copyToastTimer.current);copyToastTimer.current=setTimeout(()=>{setCopied(false);setShowCopyToast(false);},2200);};
    try{navigator.clipboard.writeText(copyText).then(done);}catch(e){const ta=document.createElement("textarea");ta.value=copyText;ta.style.cssText="position:fixed;left:-9999px;top:-9999px";document.body.appendChild(ta);ta.focus();ta.select();document.execCommand("copy");document.body.removeChild(ta);done();}
  },[copyText,isExp,isFree]);

  const exportTxt=useCallback(()=>{const blob=new Blob([copyText],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="prompt-"+(task)+"-"+Date.now()+".txt";a.click();URL.revokeObjectURL(url);},[copyText,task]);

  const sharePrompt=useCallback(()=>{
    const shareText=`Check out this ${TASKS[task].l.toLowerCase()} prompt I built with Prompt Architect:\n\n${topic}\n\nhttps://www.proarch.tech`;
    if(navigator.share){navigator.share({title:"Prompt Architect",text:shareText,url:"https://www.proarch.tech"}).catch(()=>{});trackEvent("prompt_shared",{method:"native"});}
    else{navigator.clipboard.writeText(shareText).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2200);});trackEvent("prompt_shared",{method:"clipboard"});}
  },[task,topic]);

  const handleNewsletter=useCallback(async(e)=>{
    e.preventDefault();
    if(!nlEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nlEmail)){setNlStatus("error");return;}
    try{
      const {error}=await supabase.from("newsletter").insert({email:nlEmail.toLowerCase().trim()});
      if(error&&error.code==="23505"){setNlStatus("exists");return;}
      if(error)throw error;
      setNlStatus("success");trackEvent("newsletter_signup");setNlEmail("");
    }catch(err){setNlStatus("error");}
  },[nlEmail]);

  const referralLink=user?.id?`https://www.proarch.tech?ref=${user.id.slice(0,8)}`:"";
  const copyReferral=useCallback(()=>{
    navigator.clipboard.writeText(referralLink).then(()=>{trackEvent("referral_link_copied");setShowReferral(false);});
  },[referralLink]);

  const loadExample=useCallback((ex)=>{setTopic(ex.topic);setTask(ex.task);setIndustry(ex.industry);setOutput(ex.output);setModel(ex.model);if(ex.style)setStyle(ex.style);if(ex.tone)setTone(ex.tone);if(ex.len)setLen(ex.len);if(ex.fileOutput)setFileOutput(ex.fileOutput);if(ex.includes)setIncludes(ex.includes);if(ex.techs)setTechs(ex.techs);setSelectedFirm("");setSelectedRole("");setShow(false);},[]);

  const loadFromHistory=useCallback((h)=>{
    setTopic(h.topic);
    const c=h.config||{};
    setTask(c.task!==undefined?c.task:h.task);
    setIndustry(c.industry!==undefined?c.industry:h.industry);
    setOutput(c.output!==undefined?c.output:h.output);
    setModel(c.model!==undefined?c.model:h.model);
    if(c.mode!==undefined)setMode(c.mode);
    if(c.subModel!==undefined)setSubModel(c.subModel);
    if(c.style!==undefined)setStyle(c.style);
    if(c.tone!==undefined)setTone(c.tone);
    if(c.len!==undefined)setLen(c.len);
    if(Array.isArray(c.fmt))setFmt(c.fmt);
    if(Array.isArray(c.includes))setIncludes(c.includes);
    if(Array.isArray(c.techs))setTechs(c.techs);
    if(c.aud!==undefined)setAud(c.aud);
    if(c.extra!==undefined)setExtra(c.extra);
    if(c.special!==undefined)setSpecial(c.special);
    if(c.riskLevel!==undefined)setRiskLevel(c.riskLevel);
    if(c.language!==undefined)setLanguage(c.language);
    if(c.fileOutput!==undefined)setFileOutput(c.fileOutput);else if(h.fileOutput)setFileOutput(h.fileOutput);
    if(c.selectedFirm!==undefined)setSelectedFirm(c.selectedFirm);
    if(c.selectedRole!==undefined)setSelectedRole(c.selectedRole);
    setShowHistory(false);
    setShow(false);
  },[]);

  const clearHistory=useCallback(()=>{clearHistoryFromDB();setHistory([]);setShowHistory(false);},[]);

  const deleteFromHistory=useCallback((id,e)=>{if(e){e.stopPropagation();}deleteHistoryRow(id);setHistory(h=>h.filter(x=>x.id!==id));},[]);

  const ti=useCallback(v=>setIncludes(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]),[]);
  const tf=useCallback(v=>setFmt(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]),[]);
  const tt=useCallback(v=>setTechs(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]),[]);

  const inp=(sx={})=>({width:"100%",padding:12,borderRadius:9,border:"1.5px solid var(--bd)",background:"var(--bg)",color:"var(--t1)",fontSize:13.5,fontFamily:"var(--f)",outline:"none",transition:"border .2s",lineHeight:1.6,...sx});

  const [authSubmitting,setAuthSubmitting]=useState(false);
  const handleAuthSubmit=useCallback(async(e)=>{
    e.preventDefault();
    setAuthErr("");
    setAuthSubmitting(true);
    try{
      if(authMode==="signup"){
        const cleanName=sanitizeText(authName);
        if(!cleanName||cleanName.length<2||cleanName.length>100){setAuthErr("Name must be 2-100 characters");setAuthSubmitting(false);return;}
        if(!validateEmail(authEmail)){setAuthErr("Invalid email");setAuthSubmitting(false);return;}
        if(!validatePassword(authPassword)){setAuthErr("Password must be 8+ characters with uppercase, lowercase, and a number");setAuthSubmitting(false);return;}
        const meta={name:cleanName};if(refCode)meta.referred_by=refCode;
        const {data,error}=await supabase.auth.signUp({email:authEmail,password:authPassword,options:{data:meta}});
        if(error){setAuthErr(error.message);setAuthSubmitting(false);return;}
        if(data.user&&!data.session){setAuthErr("Check your email for a confirmation link");setAuthSubmitting(false);return;}
        trackEvent("account_created",{referred:!!refCode});
        setShowAuth(false);setAuthEmail("");setAuthPassword("");setAuthName("");
      }else{
        const {data,error}=await supabase.auth.signInWithPassword({email:authEmail,password:authPassword});
        if(error){setAuthErr(error.message);setAuthSubmitting(false);return;}
        setShowAuth(false);setAuthEmail("");setAuthPassword("");
      }
    }catch(err){setAuthErr("Something went wrong. Please try again.");}
    setAuthSubmitting(false);
  },[authMode,authName,authEmail,authPassword]);

  const handleOAuthLogin=useCallback(async(provider)=>{
    setAuthErr("");
    const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin}});
    if(error)setAuthErr(error.message);
  },[]);

  const handleLogout=useCallback(async()=>{await supabase.auth.signOut();setUser(null);setHistory([]);setShowAuth(false);},[]);

  const handleCheckout=useCallback(async()=>{
    if(!user)return;
    setCheckoutLoading(true);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch("/api/checkout",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({plan:paywallPlan,email:user.email,userId:session?.user?.id,promoCode:promoCode.trim()||undefined})
      });
      const data=await res.json();
      if(data.url){trackEvent("subscription_started",{plan:paywallPlan});window.location.href=data.url;}
      else{alert(data.error||"Something went wrong. Please try again.");}
    }catch(err){alert("Failed to start checkout. Please try again.");}
    setCheckoutLoading(false);
  },[user,paywallPlan,promoCode]);

  const handlePromoRedeem=useCallback(async()=>{
    if(!user||!promoCode.trim())return;
    setPromoLoading(true);
    setPromoMsg("");
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch("/api/redeem",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({code:promoCode.trim().toUpperCase(),userId:session?.user?.id})
      });
      const data=await res.json();
      if(data.success){
        setPromoMsg("Promo applied! You now have "+data.days+" days of Pro access.");
        supabase.rpc("get_usage_status").then(({data})=>{if(data&&!data.error)setUsage(data);});
        setTimeout(()=>{setShowPaywall(false);setPromoCode("");setPromoMsg("");},2500);
      }else{
        setPromoMsg(data.error||"Invalid code.");
      }
    }catch(err){setPromoMsg("Something went wrong. Please try again.");}
    setPromoLoading(false);
  },[user,promoCode]);


  const resetAll=useCallback(()=>{
    // Snapshot every field that resetAll() will overwrite so undoReset() can put it back.
    lastResetSnapshotRef.current={
      topic,task,industry,output,model,subModel,style,tone,len,fmt,includes,techs,
      aud,extra,special,language,fileOutput,selectedFirm,selectedRole,hasAttachment,
      show,promptGenerated,
    };
    setTopic("");setTask("writing");setIndustry("general");setOutput("document");setModel("claude");setSubModel("opus-4-6");
    setStyle("formal");setTone("Professional");setLen("Medium");setFmt(["prose"]);
    setIncludes([]);setTechs([]);setAud("");setExtra("");setSpecial("");setLanguage("English");
    setFileOutput("none");setSelectedFirm("");setSelectedRole("");setHasAttachment(false);
    setShow(false);setPromptGenerated(false);
    setStreamedText("");setIsStreaming(false);if(streamRef.current){cancelAnimationFrame(streamRef.current);streamRef.current=null;}
    // Show the undo toast for 5 seconds, then auto-dismiss and drop the snapshot.
    setShowResetUndo(true);
    if(resetUndoTimerRef.current)clearTimeout(resetUndoTimerRef.current);
    resetUndoTimerRef.current=setTimeout(()=>{
      setShowResetUndo(false);
      lastResetSnapshotRef.current=null;
      resetUndoTimerRef.current=null;
    },5000);
    window.scrollTo({top:0,behavior:"smooth"});
  },[topic,task,industry,output,model,subModel,style,tone,len,fmt,includes,techs,aud,extra,special,language,fileOutput,selectedFirm,selectedRole,hasAttachment,show,promptGenerated]);

  // Restore everything resetAll() cleared, if the user clicks Undo within 5s.
  const undoReset=useCallback(()=>{
    const s=lastResetSnapshotRef.current;
    if(!s)return;
    setTopic(s.topic);setTask(s.task);setIndustry(s.industry);setOutput(s.output);setModel(s.model);setSubModel(s.subModel);
    setStyle(s.style);setTone(s.tone);setLen(s.len);setFmt(s.fmt);
    setIncludes(s.includes);setTechs(s.techs);setAud(s.aud);setExtra(s.extra);setSpecial(s.special);setLanguage(s.language);
    setFileOutput(s.fileOutput);setSelectedFirm(s.selectedFirm);setSelectedRole(s.selectedRole);setHasAttachment(s.hasAttachment);
    setShow(s.show);setPromptGenerated(s.promptGenerated);
    setShowResetUndo(false);
    lastResetSnapshotRef.current=null;
    if(resetUndoTimerRef.current){clearTimeout(resetUndoTimerRef.current);resetUndoTimerRef.current=null;}
  },[]);

  /* ═══ PROMPT LAB ═══ */
  const generateLabVariants=useCallback(()=>{
    const base={topic,taskType:task,model,subModel,subModelTier:activeSubModel?.tier||"flagship",audience:aud,extra,special,mode,industry,output,style,includes,language,fileOutput,selectedFirm,selectedRole,hasAttachment,riskLevel};
    const variants=[
      {id:"structured",name:"Structured",config:{tone:"Authoritative",length:"Detailed",format:["bullets","headers"],techniques:["cot","constraints","selfcheck"]},tone:"Authoritative",length:"Detailed",format:["bullets","headers"],techniques:["cot","constraints","selfcheck"]},
      {id:"narrative",name:"Narrative",config:{tone:"Professional",length:"Comprehensive",format:["prose","headers"],techniques:[]},tone:"Professional",length:"Comprehensive",format:["prose","headers"],techniques:[]},
      {id:"meta",name:"Meta-Reasoning",config:{tone:"Academic",length:"Detailed",format:["headers","numbered"],techniques:["meta","firstprinciples"]},tone:"Academic",length:"Detailed",format:["headers","numbered"],techniques:["meta","firstprinciples"]},
    ];
    return variants.map(v=>({
      id:v.id,
      name:v.name,
      config:v.config,
      prompt:buildPrompt({...base,tone:v.tone,length:v.length,format:v.format,techniques:v.techniques}),
    }));
  },[topic,task,model,subModel,activeSubModel,aud,extra,special,mode,industry,output,style,includes,language,fileOutput,selectedFirm,selectedRole,hasAttachment,riskLevel]);

  const runLab=useCallback(async()=>{
    setLabLoading(true);setLabOpen(true);setLabResults([]);setLabError("");
    try{
      const variants=generateLabVariants();
      const res=await fetch("/api/evaluate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({variants,topic,task,industry}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Evaluation failed");
      setLabResults(data.results||[]);
    }catch(err){
      setLabError(err.message||"Something went wrong. Please try again.");
    }
    setLabLoading(false);
  },[generateLabVariants,topic,task,industry]);

  const applyLabConfig=useCallback((config)=>{
    if(config.tone)setTone(config.tone);
    if(config.length)setLen(config.length);
    if(config.format)setFmt(config.format);
    if(config.techniques)setTechs(config.techniques);
    setLabOpen(false);
    setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth",block:"start"}),120);
  },[]);

  return <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
      :root{--f:'Instrument Sans',-apple-system,sans-serif;--m:'IBM Plex Mono',monospace;--bg:#f8fafc;--s1:#ffffff;--s2:#f1f5f9;--bd:#e2e8f0;--t1:#0f172a;--t2:#475569;--t3:#94a3b8;--ac:${ac};--ac-rgb:${acRgb}}
      *{box-sizing:border-box}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}::-webkit-scrollbar-track{background:transparent}
      @keyframes up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
      @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
      .skeleton{background:linear-gradient(90deg,#e2e8f0 0px,#f1f5f9 40px,#e2e8f0 80px);background-size:200px 100%;animation:shimmer 1.5s infinite linear;border-radius:8px}
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      .reveal{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}.reveal.visible{opacity:1;transform:translateY(0)}
      .toast-up{animation:slideUp .25s ease}
      .strength-bar{height:6px;border-radius:3px;transition:width .4s ease,background .4s ease}
      body{background:#f8fafc;overflow-x:hidden}
      textarea:focus,input:focus{border-color:${ac}!important;box-shadow:0 0 0 3px ${ac}20}
      .main-grid{display:grid;grid-template-columns:1fr;gap:32px;align-items:start}
      @media(max-width:640px){
        .hero-grid{grid-template-columns:1fr!important}
        .hero-art{display:none!important}
        .chip-wrap{gap:5px!important}
        .chip-wrap button{font-size:11px!important;padding:6px 10px!important}
        .mobile-stack{flex-direction:column!important}
        .mobile-full{min-width:100%!important}
      }
      @media(max-width:480px){
        nav>div{padding:0 4px!important}
        nav span{font-size:14px!important}
      }
      .profile-dd{position:absolute;top:100%;right:0;margin-top:8px;background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:6px;min-width:200px;box-shadow:0 10px 40px rgba(0,0,0,.12);animation:slideDown .15s ease;z-index:1001}
      .profile-dd button{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:transparent;color:var(--t2);font-size:13px;font-family:var(--f);cursor:pointer;border-radius:8px;transition:background .15s}
      .profile-dd button:hover{background:var(--s2)}
    `}</style>
    {/* TOP OFFER BANNER */}
    {(!user||!usage.is_paid)&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:1001,background:ac,color:"#fff",textAlign:"center",padding:"6px 16px",fontSize:12,fontWeight:500,letterSpacing:.2}}>
      {t("welcomeOffer")}
    </div>}
    {/* STICKY NAV */}
    <nav style={{position:"fixed",top:(!user||!usage.is_paid)?28:0,left:0,right:0,background:"rgba(255,255,255,.85)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderBottom:"1px solid var(--bd)",zIndex:1000,padding:"0 24px",transition:"top .2s"}}>
      <div style={{maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",height:56}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="23" stroke={ac} strokeWidth="1.8" fill={ac+"08"}/>
            <path d="M12 24h6l3-6 4.5 12 3-6H35" stroke={ac} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="24" r="2" fill={ac}/>
            <circle cx="35" cy="24" r="2" fill={ac}/>
          </svg>
          <span style={{fontWeight:700,fontSize:17,color:"var(--t1)",letterSpacing:"-.3px"}}>Prompt Architect</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={toggleUiLang} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"1px solid var(--bd)",background:"var(--s2)",cursor:"pointer",fontFamily:"var(--f)",fontSize:11.5,fontWeight:600,color:"var(--t2)",transition:"all .15s"}} title={uiLang==="en"?"Bytt til norsk":"Switch to English"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {uiLang==="en"?"EN":"NO"}
          </button>
          {authLoading?(
            <div className="skeleton" style={{width:90,height:36}}/>
          ):user?(
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowProfileDD(!showProfileDD)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:10,border:"1px solid var(--bd)",background:"var(--s1)",cursor:"pointer",fontFamily:"var(--f)",transition:"all .15s"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg, ${ac}, #2563EB)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>{(user.name||"U")[0].toUpperCase()}</div>
                <span style={{fontSize:13,fontWeight:500,color:"var(--t1)",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {showProfileDD&&<>
                <div style={{position:"fixed",inset:0,zIndex:1000}} onClick={()=>setShowProfileDD(false)}/>
                <div className="profile-dd">
                  <div style={{padding:"12px 14px 10px",borderBottom:"1px solid var(--bd)",marginBottom:4}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{user.name}</div>
                    <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{user.email}</div>
                    {usage.is_paid&&<div style={{fontSize:10,fontWeight:600,color:"#10B981",marginTop:4,display:"flex",alignItems:"center",gap:4}}>{I.check(10,"#10B981")} {t("proMember")}</div>}
                  </div>
                  {user&&history.length>0&&(
                    <button onClick={()=>{const next=!showHistory;setShowHistory(next);setShowProfileDD(false);if(next)setTimeout(()=>{const el=document.getElementById("history-panel");if(el)el.scrollIntoView({behavior:"smooth",block:"start"});},100);}}>{I.clock(14,"var(--t2)")} {t("promptHistory")} ({history.length})</button>
                  )}
                  {usage.is_paid&&(
                    <button onClick={async()=>{setShowProfileDD(false);try{const res=await fetch("/api/portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:user.email})});const data=await res.json();if(data.url)window.location.href=data.url;else alert(data.error||"Could not open account portal.");}catch(e){alert("Something went wrong.");}}}>{I.sliders(14,"var(--t2)")} {t("manageSubscription")}</button>
                  )}
                  <button onClick={()=>{setShowReferral(true);setShowProfileDD(false);}}>{I.gift(14,"var(--t2)")} {t("referFriend")}</button>
                  {!usage.is_paid&&usage.subscription_status!=="active"&&(
                    <button onClick={()=>{setShowPaywall(true);setShowProfileDD(false);}} style={{color:ac+"!important"}}>{I.sparkle(14,ac)} {t("upgradePro")}</button>
                  )}
                  <button onClick={()=>{handleLogout();setShowProfileDD(false);}} style={{color:"#ef4444!important"}}>{I.trash(14,"#ef4444")} {t("signOut")}</button>
                </div>
              </>}
            </div>
          ):(
            <>
              <button onClick={()=>{setAuthMode("login");setShowAuth(true);setAuthErr("");}} style={{fontSize:13,padding:"8px 16px",border:"none",background:"transparent",color:"var(--t2)",cursor:"pointer",fontFamily:"var(--f)",fontWeight:500,transition:"all .15s"}}>{t("logIn")}</button>
              <button onClick={()=>{setAuthMode("signup");setShowAuth(true);setAuthErr("");}} style={{fontSize:13,padding:"8px 20px",border:"none",background:ac,color:"#fff",borderRadius:8,cursor:"pointer",fontFamily:"var(--f)",fontWeight:600,transition:"all .2s",boxShadow:"0 2px 8px "+ac+"30"}}>{t("getStarted")}</button>
            </>
          )}
        </div>
      </div>
    </nav>

    <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--t1)",fontFamily:"var(--f)",paddingTop:(!user||!usage.is_paid)?84:56}}>

      {/* COMPACT HERO + HOW IT WORKS — all one seamless section */}
      <section style={{background:"linear-gradient(180deg, #f0f9ff 0%, var(--bg) 100%)",padding:"clamp(20px,4vw,32px) clamp(12px,3vw,24px) 0",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-100,right:-80,width:350,height:350,borderRadius:"50%",background:`radial-gradient(circle, ${ac}06 0%, transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          {/* Hero copy — transformation-led */}
          <div style={{textAlign:"center",maxWidth:720,margin:"0 auto 28px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:20,background:ac+"10",marginBottom:16,fontSize:12,fontWeight:600,color:ac}}>{t("heroBadge")}</div>
            <h1 style={{fontSize:"clamp(26px, 3.5vw, 40px)",fontWeight:800,margin:"0 0 14px",lineHeight:1.15,color:"var(--t1)",letterSpacing:"-.4px"}}>{t("heroTitle1")} <span style={{color:ac}}>{t("heroTitle2")}</span></h1>
            <p style={{fontSize:"clamp(14px, 1.4vw, 17px)",color:"var(--t2)",margin:"0 auto",lineHeight:1.65,maxWidth:600}}>{t("heroSub")}</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginTop:16,fontSize:12,color:"var(--t3)"}}>
              <span ref={countTaskRef} style={{display:"flex",alignItems:"center",gap:4}}>{I.bolt(13,"var(--t3)")} <strong style={{fontVariantNumeric:"tabular-nums"}}>{countTasks}</strong> {uiLang==="no"?"oppgavetyper":"task types"}</span>
              <span style={{width:1,height:14,background:"var(--bd)"}}/>
              <span ref={countIndRef} style={{display:"flex",alignItems:"center",gap:4}}>{I.layers(13,"var(--t3)")} <strong style={{fontVariantNumeric:"tabular-nums"}}>{countIndustries}</strong> {uiLang==="no"?"bransjer":"industries"}</span>
              <span style={{width:1,height:14,background:"var(--bd)"}} className="hero-art"/>
              <span ref={countModRef} style={{display:"flex",alignItems:"center",gap:4}} className="hero-art">{I.sparkle(13,"var(--t3)")} <strong style={{fontVariantNumeric:"tabular-nums"}}>{countModels}</strong> {uiLang==="no"?"AI-modeller":"AI models"}</span>
            </div>
          </div>

          {/* HOW IT WORKS — horizontal, seamless, no box */}
          <div id="features" style={{display:"flex",justifyContent:"center",gap:"clamp(16px, 4vw, 56px)",flexWrap:"wrap",paddingBottom:28,borderBottom:"1px solid var(--bd)"}}>
            {[
              {ic:"pen",n:"1",tt:t("step1t"),s:t("step1s")},
              {ic:"wand",n:"2",tt:t("step2t"),s:t("step2s")},
              {ic:"copy",n:"3",tt:t("step3t"),s:t("step3s")},
            ].map(({ic,n,tt,s},i)=>(
              <React.Fragment key={i}>
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"4px 0"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:ac,fontSize:14,fontWeight:700}}>{n}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:620,color:"var(--t1)"}}>{tt}</div>
                    <div style={{fontSize:11.5,color:"var(--t3)",lineHeight:1.3}}>{s}</div>
                  </div>
                </div>
                {i<2&&<div style={{width:32,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--bd)"}} className="hero-art"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>}
              </React.Fragment>
            ))}
          </div>

        </div>
      </section>

      {/* WHY PROMPT ARCHITECT — value props */}
      <section className="reveal" style={{padding:"clamp(28px,5vw,48px) clamp(12px,3vw,24px)",background:"var(--bg)"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <h2 style={{fontSize:"clamp(20px,2.5vw,26px)",fontWeight:800,textAlign:"center",margin:"0 0 8px",color:"var(--t1)",letterSpacing:"-.3px"}}>{t("vpTitle")}</h2>
          <p style={{fontSize:13,color:"var(--t3)",textAlign:"center",margin:"0 auto 28px",maxWidth:520}}>{t("vpSub")}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:16}}>
            {[
              {ic:"brain",tt:t("vp1t"),d:t("vp1d")},
              {ic:"wand",tt:t("vp2t"),d:t("vp2d")},
              {ic:"layers",tt:t("vp3t"),d:t("vp3d")},
              {ic:"target",tt:t("vp4t"),d:t("vp4d")},
              {ic:"building",tt:t("vp5t"),d:t("vp5d")},
              {ic:"cpu",tt:t("vp6t"),d:t("vp6d")},
            ].map(({ic,tt,d},i)=>(
              <div key={i} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:12,padding:"20px 18px"}}>
                <div style={{width:34,height:34,borderRadius:9,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>{I[ic](17,ac)}</div>
                <div style={{fontSize:14,fontWeight:650,color:"var(--t1)",marginBottom:4}}>{tt}</div>
                <div style={{fontSize:12.5,color:"var(--t3)",lineHeight:1.55}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="reveal" style={{padding:"0 clamp(12px,3vw,24px) clamp(28px,5vw,48px)",background:"var(--bg)"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <h3 style={{fontSize:"clamp(17px,2vw,22px)",fontWeight:700,textAlign:"center",margin:"0 0 20px",color:"var(--t1)"}}>{t("compTitle")}</h3>
          <div style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:14,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:"1px solid var(--bd)"}}>
              <div style={{padding:"12px 16px",fontSize:12,fontWeight:700,color:"var(--t3)"}}></div>
              <div style={{padding:"12px 16px",fontSize:12,fontWeight:700,color:"var(--t3)",textAlign:"center",borderLeft:"1px solid var(--bd)"}}>{t("compManual")}</div>
              <div style={{padding:"12px 16px",fontSize:12,fontWeight:700,color:ac,textAlign:"center",borderLeft:"1px solid var(--bd)",background:ac+"06"}}>Prompt Architect</div>
            </div>
            {[t("comp1"),t("comp2"),t("comp3"),t("comp4"),t("comp5"),t("comp6")].map((row,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:i<5?"1px solid var(--bd)":"none"}}>
                <div style={{padding:"10px 16px",fontSize:12,fontWeight:600,color:"var(--t1)"}}>{row[0]}</div>
                <div style={{padding:"10px 16px",fontSize:12,color:"var(--t3)",textAlign:"center",borderLeft:"1px solid var(--bd)"}}>{row[1]}</div>
                <div style={{padding:"10px 16px",fontSize:12,color:ac,fontWeight:600,textAlign:"center",borderLeft:"1px solid var(--bd)",background:ac+"06"}}>{row[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="reveal" style={{padding:"clamp(28px,5vw,48px) clamp(12px,3vw,24px) 0",background:"var(--bg)"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <h2 style={{fontSize:"clamp(18px,2.2vw,24px)",fontWeight:800,textAlign:"center",margin:"0 0 6px",color:"var(--t1)",letterSpacing:"-.2px"}}>{t("ucTitle")}</h2>
          <p style={{fontSize:13,color:"var(--t3)",textAlign:"center",margin:"0 auto 24px",maxWidth:460}}>{t("ucSub")}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:14,maxWidth:720,margin:"0 auto"}}>
            {[
              {role:t("uc1r"),task:t("uc1t"),ic:"chart"},
              {role:t("uc2r"),task:t("uc2t"),ic:"code"},
              {role:t("uc3r"),task:t("uc3t"),ic:"target"},
              {role:t("uc4r"),task:t("uc4t"),ic:"building"},
            ].map(({role,task,ic},i)=>(
              <div key={i} style={{background:"var(--s1)",border:"1px solid var(--bd)",borderRadius:12,padding:"18px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:28,height:28,borderRadius:7,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center"}}>{I[ic](14,ac)}</div>
                  <span style={{fontSize:13,fontWeight:650,color:"var(--t1)"}}>{role}</span>
                </div>
                <p style={{fontSize:12,color:"var(--t3)",margin:0,lineHeight:1.55}}>{task}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"clamp(16px,4vw,28px) clamp(12px,3vw,24px) 60px"}}>

      {/* TOOL HEADER + MODE SWITCH */}
      <div id="tool" style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center"}}>{LOGO(18,ac)}</div>
          <div>
            <h2 style={{fontSize:20,fontWeight:700,margin:0,letterSpacing:"-.2px"}}>{t("buildTitle")}</h2>
            <p style={{color:"var(--t3)",fontSize:12.5,margin:"2px 0 0",fontWeight:450}}>{t("buildSub")}</p>
          </div>
        </div>
        {user&&!usage.is_paid&&usage.subscription_status!=="active"&&(
          <div style={{fontSize:12,color:"var(--t3)",display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontWeight:600,color:canGenerate?"var(--t2)":"#ef4444"}}>{isExp?remainingExpert:remainingSimple} {t("freeSimple")} {isExp?t("modeExpert").toLowerCase():t("modeSimple").toLowerCase()}</span> {t("freeLeft")}
          </div>
        )}
      </div>

      {/* MODE SWITCH + HINT */}
      <div className="mobile-stack" style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[["amateur","seedling",t("modeSimple"),t("modeSimpleDesc")],["expert","microscope",t("modeExpert"),t("modeExpertDesc")]].map(([m,ic,lb,desc])=>(
          <div key={m} onClick={()=>setMode(m)} style={{flex:1,minWidth:200,padding:"10px 14px",borderRadius:9,border:mode===m?"1.5px solid "+ac:"1px solid var(--bd)",background:mode===m?ac+"05":"var(--s1)",cursor:"pointer",transition:"all .15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
              {I[ic](13,mode===m?ac:"var(--t3)")}
              <span style={{fontSize:12.5,fontWeight:700,color:mode===m?ac:"var(--t1)"}}>{lb}</span>
              {m==="expert"&&mode!=="expert"&&<span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:5,background:ac,color:"#fff",marginLeft:2}}>PRO</span>}
            </div>
            <div style={{fontSize:11,color:"var(--t3)",lineHeight:1.5}}>{desc}</div>
          </div>
        ))}
      </div>

      {/* HISTORY PANEL */}
      {showHistory&&history.length>0&&(
        <div id="history-panel" style={{background:"var(--s1)",borderRadius:14,border:"1px solid var(--bd)",padding:"18px 20px 14px",marginBottom:24,animation:"fadeIn .2s ease",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:13,fontWeight:650,color:"var(--t1)",letterSpacing:"-.1px"}}>{t("recentPrompts")}</span>
              <span style={{fontSize:11,fontWeight:600,color:"var(--t3)",background:"var(--s2)",padding:"2px 7px",borderRadius:10}}>{history.length}</span>
            </div>
            <button onClick={clearHistory} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 11px",borderRadius:7,border:"1px solid rgba(239,68,68,.3)",background:"transparent",color:"#ef4444",cursor:"pointer",fontSize:11,fontFamily:"var(--f)",fontWeight:600,transition:"all .15s"}}>{I.trash(11,"#ef4444")} {t("clear")}</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {history.map((h,i)=>{
            const mc=(MODELS[h.model]&&MODELS[h.model].col)||"var(--ac)";
            const dt=new Date(h.timestamp);
            const now=Date.now();
            const diff=Math.floor((now-h.timestamp)/86400000);
            const when=diff===0?"Today":diff===1?"Yesterday":diff<7?diff+"d ago":dt.toLocaleDateString();
            const chip=(label,color,bg)=><span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:999,fontSize:10.5,fontWeight:600,color:color,background:bg,border:"1px solid "+color+"22",whiteSpace:"nowrap",letterSpacing:".1px"}}>{label}</span>;
            return (
              <div key={h.id||i} onClick={()=>loadFromHistory(h)} style={{position:"relative",padding:"12px 44px 12px 14px",borderRadius:10,border:"1px solid var(--bd)",background:"var(--s2)",cursor:"pointer",fontFamily:"var(--f)",transition:"all .15s",borderLeft:"3px solid "+mc}} onMouseEnter={e=>{e.currentTarget.style.background="var(--bg)";e.currentTarget.style.borderColor=mc+"55";}} onMouseLeave={e=>{e.currentTarget.style.background="var(--s2)";e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.borderLeftColor=mc;}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8}}>
                  <div style={{fontWeight:600,fontSize:13,color:"var(--t1)",lineHeight:1.35,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",flex:1}}>{h.topic}</div>
                  <span style={{fontSize:10.5,color:"var(--t3)",fontWeight:500,whiteSpace:"nowrap",flexShrink:0}}>{when}</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,alignItems:"center"}}>
                  {h.model&&chip(MODELS[h.model]?MODELS[h.model].name:h.model,mc,mc+"12")}
                  {h.task&&chip(tl(UI_TASKS,h.task),"var(--t2)","var(--s1)")}
                  {h.industry&&chip(tl(UI_INDUSTRIES,h.industry),"var(--t2)","var(--s1)")}
                  {h.output&&chip(tl(UI_OUTPUTS,h.output),"var(--t2)","var(--s1)")}
                  {h.fileOutput&&h.fileOutput!=="none"&&FILE_OUTPUTS[h.fileOutput]&&chip(FILE_OUTPUTS[h.fileOutput].l,"var(--t3)","var(--bg)")}
                </div>
                <button onClick={e=>deleteFromHistory(h.id,e)} title="Delete" style={{position:"absolute",top:10,right:10,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--t3)",cursor:"pointer",transition:"all .15s",padding:0}} onMouseEnter={e=>{e.currentTarget.style.background="#fee2e2";e.currentTarget.style.borderColor="#fca5a5";e.currentTarget.style.color="#dc2626";}} onMouseLeave={e=>{e.currentTarget.style.background="var(--s1)";e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="var(--t3)";}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* FORM */}
      <div style={{background:"var(--s1)",borderRadius:16,border:"1px solid var(--bd)",padding:"clamp(16px,4vw,32px) clamp(14px,3.5vw,28px)",marginBottom:24,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>

        {/* TOPIC */}
        <Step ico="pen" title={t("describeGoal")} sub={t("describeGoalSub")}>
          <div style={{marginBottom:12}}>
            {topic.trim()&&(
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
                <button onClick={()=>{setTopic("");setShow(false);}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #fca5a5",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:11,fontFamily:"var(--f)",fontWeight:600,transition:"all .2s",display:"flex",alignItems:"center",gap:4}}>{I.trash(11,"#dc2626")} {t("clear")}</button>
              </div>
            )}
            <textarea autoFocus value={topic} onChange={e=>{setTopic(e.target.value);setShow(false);}} placeholder={t("describeGoalPh")} rows={3} style={inp({resize:"vertical"})} />
          </div>

          {/* EXAMPLE PROMPTS */}
          {!topic.trim()&&(
            <div style={{marginTop:14}}>
              <div style={{fontSize:11.5,color:"var(--t3)",marginBottom:8,fontWeight:600}}>{t("examplesTitle")}:</div>
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {[...new Set(EXAMPLES.map(e=>e.sector))].map((sector,i)=>(
                  <button key={i} onClick={()=>setExampleSector(exampleSector===sector?"":sector)} style={{padding:"5px 10px",borderRadius:6,border:"1.5px solid "+(exampleSector===sector?ac:"var(--bd)"),background:exampleSector===sector?ac+"14":"var(--s2)",color:exampleSector===sector?ac:"var(--t2)",cursor:"pointer",fontSize:10.5,fontFamily:"var(--f)",fontWeight:600,transition:"all .15s"}}>{sector}</button>
                ))}
              </div>
              {exampleSector&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,animation:"fadeIn .2s ease"}}>
                {EXAMPLES.filter(ex=>ex.sector===exampleSector).map((ex,i)=>(
                  <button key={i} onClick={()=>{loadExample(ex);setExampleSector("");}} style={{padding:"10px 12px",borderRadius:9,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--t1)",cursor:"pointer",fontFamily:"var(--f)",transition:"all .15s",textAlign:"left",display:"flex",flexDirection:"column",gap:4}}>
                    <span style={{fontSize:12,fontWeight:620,lineHeight:1.3}}>{ex.label}</span>
                    <span style={{fontSize:10.5,color:"var(--t3)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{ex.topic.substring(0,90)}...</span>
                    <div style={{display:"flex",gap:4,marginTop:2}}>
                      <span style={{fontSize:9.5,padding:"2px 6px",borderRadius:4,background:ac+"10",color:ac,fontWeight:550}}>{tl(UI_TASKS,ex.task)}</span>
                      <span style={{fontSize:9.5,padding:"2px 6px",borderRadius:4,background:"var(--s2)",color:"var(--t3)",fontWeight:500}}>{MODELS[ex.model]?.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              )}
            </div>
          )}

          {/* SMART ENHANCEMENT BADGES */}
          {topic.trim()&&enhancements.length>0&&(
            <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,background:ac+"0A",border:"1px solid "+ac+"1A",animation:"fadeIn .3s ease"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                {I.wand(13,ac)}
                <span style={{fontSize:11.5,fontWeight:640,color:ac}}>Smart Enhancements Active</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {enhancements.map((e,i)=>(
                  <span key={i} style={{padding:"3px 9px",borderRadius:5,background:ac+"14",color:ac,fontSize:10.5,fontWeight:550}}>{e.label}</span>
                ))}
              </div>
            </div>
          )}
        </Step>

        {/* TASK + INDUSTRY */}
        <Step ico="layout" title={t("taskType")}>
          <Wrap>{Object.entries(TASKS).map(([k,v])=><Chip key={k} active={task===k} accent={ac} onClick={()=>setTask(k)}>{I[v.i]?.(12,task===k?ac:"var(--t3)")}{tl(UI_TASKS,k)}</Chip>)}</Wrap>
        </Step>

        <Step ico="building" title={t("industrySector")} sub={t("industrySectorSub")}>
          <Wrap>{Object.entries(INDUSTRIES).map(([k,v])=><Chip key={k} active={industry===k} accent={ac} onClick={()=>{setIndustry(k);setSelectedFirm("");setSelectedRole("");}}>{I[v.i]?.(12,industry===k?ac:"var(--t3)")}{tl(UI_INDUSTRIES,k)}</Chip>)}</Wrap>
          {isExp&&industry!=="general"&&SECTOR_FIRMS[industry]&&(
            <div style={{marginTop:14,padding:"14px 16px",borderRadius:10,background:ac+"08",border:"1px solid "+ac+"18",animation:"fadeIn .2s ease"}}>
              <div style={{fontSize:11.5,fontWeight:640,color:ac,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>{I.building(13,ac)} {t("firmContext")}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:selectedFirm?10:0}}>
                {Object.entries(SECTOR_FIRMS[industry].firms).map(([k,v])=>(
                  <button key={k} onClick={()=>{setSelectedFirm(selectedFirm===k?"":k);setSelectedRole("");}} style={{padding:"6px 12px",borderRadius:7,border:"1.5px solid "+(selectedFirm===k?ac:"var(--bd)"),background:selectedFirm===k?ac+"14":"var(--s1)",color:selectedFirm===k?ac:"var(--t2)",cursor:"pointer",fontSize:11.5,fontFamily:"var(--f)",fontWeight:selectedFirm===k?620:450,transition:"all .15s"}}>{v.name}</button>
                ))}
              </div>
              {selectedFirm&&SECTOR_FIRMS[industry].firms[selectedFirm]&&(
                <div style={{animation:"fadeIn .2s ease"}}>
                  <div style={{fontSize:10.5,color:"var(--t3)",marginBottom:6,fontWeight:550}}>Role at {SECTOR_FIRMS[industry].firms[selectedFirm].name}:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {SECTOR_FIRMS[industry].firms[selectedFirm].roles.map((role,i)=>(
                      <button key={i} onClick={()=>setSelectedRole(selectedRole===role?"":role)} style={{padding:"5px 10px",borderRadius:6,border:"1px solid "+(selectedRole===role?ac:"var(--bd)"),background:selectedRole===role?ac+"14":"var(--s1)",color:selectedRole===role?ac:"var(--t2)",cursor:"pointer",fontSize:11,fontFamily:"var(--f)",fontWeight:selectedRole===role?600:400,transition:"all .15s"}}>{role}</button>
                    ))}
                  </div>
                </div>
              )}
              {selectedFirm&&selectedRole&&(
                <div style={{marginTop:10,fontSize:11,color:ac,fontWeight:550,display:"flex",alignItems:"center",gap:4}}>{I.check(11,ac)} {tl(UI_INDUSTRIES,industry)} &rarr; {SECTOR_FIRMS[industry].firms[selectedFirm].name} &rarr; {selectedRole}</div>
              )}
            </div>
          )}
        </Step>

        {/* OUTPUT TYPE */}
        <Step ico="file" title={t("outputType")} sub={t("outputTypeSub")}>
          <Wrap>{Object.entries(OUTPUTS).map(([k,v])=><Chip key={k} active={output===k} accent={ac} onClick={()=>setOutput(k)}>{I[v.i]?.(12,output===k?ac:"var(--t3)")}{tl(UI_OUTPUTS,k)}</Chip>)}</Wrap>
        </Step>

        {/* FILE OUTPUT */}
        <Step ico="download" title={t("fileOutput")} sub={t("fileOutputSub")}>
          <Wrap>{Object.entries(FILE_OUTPUTS).map(([k,v])=><Chip key={k} active={fileOutput===k} accent={ac} onClick={()=>setFileOutput(k)}>{I[v.i]?.(12,fileOutput===k?ac:"var(--t3)")}{tl(UI_FILE_OUTPUTS,k)}</Chip>)}</Wrap>
        </Step>

        {/* AI MODEL */}
        <Step ico="cpu" title={t("targetModel")}>
          <Wrap>
            {Object.entries(MODELS).map(([k,v])=>(
              <button key={k} onClick={()=>setModel(k)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:9,border:"1.5px solid "+(model===k?v.col:"var(--bd)"),background:model===k?v.col+"14":"var(--s2)",color:model===k?v.col:"var(--t2)",cursor:"pointer",fontSize:12.5,fontWeight:model===k?620:450,fontFamily:"var(--f)",transition:"all .15s"}}><MM id={k} size={17}/>{v.name}</button>
            ))}
          </Wrap>
          <div style={{marginTop:9,padding:"8px 12px",borderRadius:8,background:ac+"0C",border:"1px solid "+ac+"1A",fontSize:11.5,color:"var(--t2)",lineHeight:1.5,display:"flex",gap:7,alignItems:"center"}}>{I.info(13,ac)}<span>{MODELS[model].tips}</span></div>

          {/* Sub-model selector */}
          {SUB_MODELS[model]&&<div style={{marginTop:14}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--t1)",marginBottom:4}}>{t("subModelTitle")}</div>
            <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>{t("subModelSub")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {SUB_MODELS[model].map(sm=>{
                const active=subModel===sm.id;
                const tierCol=sm.tier==="flagship"?ac:sm.tier==="balanced"?"#059669":"#64748B";
                return <div key={sm.id} onClick={()=>setSubModel(sm.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"1.5px solid "+(active?ac:"var(--bd)"),background:active?ac+"0A":"var(--s2)",cursor:"pointer",transition:"all .15s"}}>
                  <div style={{width:18,height:18,borderRadius:9,border:"2px solid "+(active?ac:"#CBD5E1"),background:active?ac:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                    {active&&<div style={{width:8,height:8,borderRadius:4,background:"#fff"}}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:active?640:500,color:active?ac:"var(--t1)"}}>{sm.name}</span>
                      <span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:6,background:tierCol+"18",color:tierCol}}>{sm.badge}</span>
                      <span style={{fontSize:10.5,color:"var(--t3)",fontFamily:"var(--fm)"}}>{sm.cost}</span>
                    </div>
                    <div style={{fontSize:11,color:"var(--t3)",marginTop:2,lineHeight:1.4}}>{sm.desc}</div>
                  </div>
                </div>;
              })}
            </div>
          </div>}
        </Step>

        {/* STYLE */}
        <Step ico="pen" title={t("writingStyle")}>
          <Wrap>{Object.entries(STYLES).map(([k,v])=><Chip key={k} active={style===k} accent={ac} onClick={()=>setStyle(k)}>{I[v.i]?.(12,style===k?ac:"var(--t3)")}{tl(UI_STYLES,k)}</Chip>)}</Wrap>
        </Step>

        {/* TONE */}
        <Step ico="speaker" title={t("toneLabel")}>
          <Wrap>{TONES.map(({v,i:ic})=><Chip key={v} active={tone===v} accent={ac} onClick={()=>setTone(v)}>{I[ic]?.(12,tone===v?ac:"var(--t3)")}{tl(UI_TONES,v)}</Chip>)}</Wrap>
        </Step>

        {/* RISK LEVEL */}
        <Step ico="shield" title={t("riskTitle")} sub={t("riskSub")}>
          <Wrap>{Object.keys(RISK_LEVELS).map(r=><Chip key={r} active={riskLevel===r} accent={ac} onClick={()=>setRiskLevel(r)}>{tl(UI_RISK,r)}</Chip>)}</Wrap>
        </Step>

        {/* LENGTH + FORMAT */}
        <Step ico="ruler" title={t("lengthLabel")}>
          <Wrap>{LENGTHS.map(l=><Chip key={l} active={len===l} accent={ac} onClick={()=>setLen(l)} sx={{flexDirection:"column",alignItems:"flex-start",gap:0,padding:"8px 14px"}}><span>{tl(UI_LENGTHS,l)}</span><span style={{fontSize:10.5,color:"var(--t3)",fontWeight:400}}>{getLenSub(l,fileOutput)}</span></Chip>)}</Wrap>
        </Step>

        <Step ico="layout" title={t("responseFormat")} sub={t("responseFormatSub")}>
          <Wrap>{Object.entries(FMTS).map(([k,v])=><Chip key={k} active={fmt.includes(k)} accent={ac} onClick={()=>tf(k)}>{I[v.i]?.(12,fmt.includes(k)?ac:"var(--t3)")}{tl(UI_FMTS,k)}</Chip>)}</Wrap>
        </Step>

        {/* LANGUAGE */}
        <Step ico="lang" title={t("languageLabel")}>
          <Wrap>{LANGS.map(l=><Chip key={l} active={language===l} accent={ac} onClick={()=>setLanguage(l)}>{l}</Chip>)}</Wrap>
        </Step>

        {/* INCLUDES */}
        <Step ico="checkList" title={t("includeSections")} sub={t("includeSectionsSub")}>
          <Wrap>{Object.entries(INCLUDES).map(([k,v])=><Chip key={k} active={includes.includes(k)} accent={ac} onClick={()=>ti(k)}>{I[v.i]?.(12,includes.includes(k)?ac:"var(--t3)")}{tl(UI_INCLUDES,k)}</Chip>)}</Wrap>
        </Step>

        {/* EXPERT SECTIONS */}
        {isExp&&<Step ico="brain" title={t("advTechniques")} sub={t("advTechniquesSub")}>
          <Wrap>{Object.entries(TECHS).map(([k,v])=><Chip key={k} active={techs.includes(k)} accent={ac} onClick={()=>tt(k)}>{I[v.i]?.(12,techs.includes(k)?ac:"var(--t3)")}{tl(UI_TECHS,k)}</Chip>)}</Wrap>
        </Step>}

        {isExp&&<Step ico="users" title={t("targetAudience")} sub={t("targetAudienceSub")}>
          <input value={aud} onChange={e=>setAud(e.target.value)} placeholder={t("targetAudiencePh")} style={inp()} />
        </Step>}

        {isExp&&<Step ico="plus" title={t("addInstructions")} sub={t("addInstructionsSub")}>
          <div style={{marginBottom:extra.trim()?0:8}}>
            {extra.trim()&&(
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
                <button onClick={()=>setExtra("")} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #fca5a5",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:11,fontFamily:"var(--f)",fontWeight:600,transition:"all .2s",display:"flex",alignItems:"center",gap:4}}>{I.trash(11,"#dc2626")} {t("clear")}</button>
              </div>
            )}
            <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder={t("addInstructionsPh")} rows={2} style={inp({resize:"vertical"})} />
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {[t("chipRealExamples"),t("chipWalkthrough"),t("chipCalc"),t("chipSWOT"),t("chipCompare")].map((s,i)=>(
              <button key={i} onClick={()=>setExtra(prev=>prev?prev+(prev.endsWith(s)?"":prev?", "+s:s):s)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid var(--bd)",background:"var(--s2)",color:"var(--t2)",cursor:"pointer",fontSize:10.5,fontFamily:"var(--f)",fontWeight:500,transition:"all .15s"}}>{s}</button>
            ))}
          </div>
        </Step>}

        <Step ico="info" title={t("specialReq")} sub={t("specialReqSub")}>
          <div style={{marginBottom:special.trim()?0:8}}>
            {special.trim()&&(
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
                <button onClick={()=>setSpecial("")} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #fca5a5",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:11,fontFamily:"var(--f)",fontWeight:600,transition:"all .2s",display:"flex",alignItems:"center",gap:4}}>{I.trash(11,"#dc2626")} {t("clear")}</button>
              </div>
            )}
            <textarea value={special} onChange={e=>setSpecial(e.target.value)} placeholder={t("specialReqPh")} rows={2} style={inp({resize:"vertical"})} />
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {[t("chipNoEmoji"),t("chipBullets"),t("chip500"),t("chipSources"),t("chipTables"),t("chipConcise"),t("chipJargon"),t("chipVisuals")].map((s,i)=>(
              <button key={i} onClick={()=>setSpecial(prev=>prev?prev+(prev.endsWith(s)?"":prev?", "+s:s):s)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid var(--bd)",background:"var(--s2)",color:"var(--t2)",cursor:"pointer",fontSize:10.5,fontFamily:"var(--f)",fontWeight:500,transition:"all .15s"}}>{s}</button>
            ))}
          </div>
        </Step>

        {/* ATTACHMENT CHECKBOX */}
        <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"14px 16px",marginTop:8,borderRadius:10,border:"1px solid "+(hasAttachment?ac+"40":"var(--bd)"),background:hasAttachment?ac+"08":"var(--s2)",cursor:"pointer",transition:"all .2s"}} onClick={()=>setHasAttachment(v=>!v)}>
          <div style={{width:18,height:18,borderRadius:5,border:"2px solid "+(hasAttachment?ac:"#CBD5E1"),background:hasAttachment?ac:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
            {hasAttachment&&<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L3.86 7.36L9.58 1.64" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:620,color:"var(--t1)",fontFamily:"var(--f)",lineHeight:1.3}}>{t("attachTitle")}</div>
            <div style={{fontSize:11,color:"var(--t3)",fontFamily:"var(--f)",lineHeight:1.5,marginTop:3}}>{hasAttachment?t("attachOn"):t("attachOff")}</div>
          </div>
        </div>

        {/* PROMPT STRENGTH */}
        {topic.trim()&&(()=>{
          const fields=[topic.length>20,task!=="writing",industry!=="general",output!=="document",isExp,techs.length>0,includes.length>0,aud.trim(),fileOutput!=="none",selectedFirm,extra.trim(),special.trim(),hasAttachment,language!=="English"];
          const filled=fields.filter(Boolean).length;
          const pct=Math.round((filled/fields.length)*100);
          const label=pct<30?(uiLang==="no"?"Grunnleggende":"Basic"):pct<55?(uiLang==="no"?"God":"Good"):pct<80?(uiLang==="no"?"Sterk":"Strong"):(uiLang==="no"?"Ekspert":"Expert");
          const barColor=pct<30?"#94a3b8":pct<55?"#F59E0B":pct<80?ac:"#10B981";
          return <div style={{marginTop:8,padding:"10px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <span style={{fontSize:11,fontWeight:600,color:"var(--t2)",fontFamily:"var(--f)"}}>{uiLang==="no"?"Promptstyrke":"Prompt Depth"}</span>
              <span style={{fontSize:11,fontWeight:700,color:barColor,fontFamily:"var(--f)"}}>{label}</span>
            </div>
            <div style={{height:6,borderRadius:3,background:"var(--s2)",overflow:"hidden"}}>
              <div className="strength-bar" style={{width:pct+"%",background:barColor}}/>
            </div>
          </div>;
        })()}

        {/* GENERATE + LAB */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,paddingTop:12,borderTop:"1px solid var(--bd)",marginTop:8}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={go} disabled={!topic.trim()} title="Tip: press Cmd/Ctrl + Enter to generate from anywhere" style={{display:"flex",alignItems:"center",gap:8,padding:"14px 44px",borderRadius:12,border:"none",background:topic.trim()?(canGenerate?`linear-gradient(135deg, ${ac}, #2563EB)`:"#94a3b8"):"var(--s2)",color:topic.trim()?"#fff":"var(--t3)",fontSize:15,fontWeight:660,fontFamily:"var(--f)",cursor:topic.trim()?"pointer":"not-allowed",transition:"all .2s",boxShadow:topic.trim()&&canGenerate?"0 6px 28px "+ac+"35":"none"}}>{I.sparkle(16,topic.trim()?"#fff":"var(--t3)")} {canGenerate?t("generateBtn"):t("upgradeGenerate")} {topic.trim()&&canGenerate&&<span style={{fontSize:10,fontWeight:600,opacity:.75,marginLeft:4,padding:"2px 6px",borderRadius:4,background:"rgba(255,255,255,.18)",fontFamily:"var(--m)"}}>⌘↵</span>}</button>
            <button onClick={runLab} disabled={!topic.trim()||labLoading} style={{display:"flex",alignItems:"center",gap:6,padding:"14px 22px",borderRadius:12,border:"2px solid "+(topic.trim()?ac:"var(--bd)"),background:topic.trim()?ac+"08":"var(--s2)",color:topic.trim()?ac:"var(--t3)",fontSize:14,fontWeight:640,fontFamily:"var(--f)",cursor:topic.trim()&&!labLoading?"pointer":"not-allowed",transition:"all .2s",opacity:labLoading?.6:1}}>{I.microscope(15,topic.trim()?ac:"var(--t3)")} {t("labBtn")}</button>
          </div>
          {user&&!usage.is_paid&&usage.subscription_status!=="active"&&(
            canGenerate?(
              <div style={{fontSize:12,color:"var(--t3)",display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontWeight:isExp?400:600,color:isExp?"var(--t3)":(!remainingSimple?"#ef4444":"var(--t2)")}}>Simple: {remainingSimple}/{FREE_SIMPLE}</span>
                <span style={{color:"var(--bd)"}}>|</span>
                <span style={{fontWeight:isExp?600:400,color:!isExp?"var(--t3)":(!remainingExpert?"#ef4444":"var(--t2)")}}>Expert: {remainingExpert}/{FREE_EXPERT}</span>
              </div>
            ):(
              <button onClick={()=>setShowPaywall(true)} style={{fontSize:12,fontWeight:600,padding:"6px 16px",borderRadius:7,border:"none",background:ac+"14",color:ac,cursor:"pointer",fontFamily:"var(--f)",transition:"all .2s"}}>0 free prompts left — Subscribe</button>
            )
          )}
          {!user&&<div style={{fontSize:12,color:"var(--t3)"}}>{t("createAccount")}</div>}
        </div>
      </div>

      {/* RESULT */}
      {show&&topic.trim()&&(
        <div ref={ref} style={{background:"var(--s1)",borderRadius:16,border:"1px solid var(--bd)",overflow:"hidden",animation:"up .35s ease",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 20px",borderBottom:"1px solid var(--bd)",flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <MM id={model} size={18}/>
              <span style={{fontWeight:640,fontSize:13}}>{MODELS[model].name}{activeSubModel?" / "+activeSubModel.name:""}</span>
              <span style={{fontSize:11,color:ac,background:ac+"14",padding:"2px 8px",borderRadius:5,fontWeight:600}}>{tl(UI_INDUSTRIES,industry)}</span>
              <span style={{fontSize:11,color:"var(--t3)",background:"var(--s2)",padding:"2px 8px",borderRadius:5}}>{isExp?"Expert":"Simple"}</span>
              {enhancements.length>0&&<span style={{fontSize:11,color:"#10B981",background:"#10B98114",padding:"2px 8px",borderRadius:5,fontWeight:600,display:"flex",alignItems:"center",gap:3}}>{I.wand(10,"#10B981")} {enhancements.length} {enhancements.length!==1?t("smartBoosts"):t("smartBoost")}</span>}
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={sharePrompt} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:7,border:"1px solid var(--bd)",background:"var(--s2)",color:"var(--t2)",fontWeight:600,fontSize:12,fontFamily:"var(--f)",cursor:"pointer",transition:"all .2s"}}>{I.share(12,"var(--t2)")} {t("shareBtn")}</button>
              <button onClick={exportTxt} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:7,border:"1px solid var(--bd)",background:"var(--s2)",color:"var(--t2)",fontWeight:600,fontSize:12,fontFamily:"var(--f)",cursor:"pointer",transition:"all .2s"}}>{I.download(12,"var(--t2)")} .txt</button>
              <button onClick={cp} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:7,border:"none",background:copied?"#10A37F":ac,color:"#fff",fontWeight:600,fontSize:12,fontFamily:"var(--f)",cursor:"pointer",transition:"all .2s"}}>{copied?I.check(12,"#fff"):I.copy(12,"#fff")}{copied?t("copiedBtn"):t("copyBtn")}</button>
              <button onClick={resetAll} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:7,border:"1px solid #fca5a5",background:"#fff5f5",color:"#dc2626",fontWeight:600,fontSize:12,fontFamily:"var(--f)",cursor:"pointer",transition:"all .2s"}}>{I.plus(12,"#dc2626")} {t("newBtn")}</button>
            </div>
          </div>
          <pre style={{padding:"20px 22px",margin:0,whiteSpace:"pre-wrap",wordWrap:"break-word",fontSize:12,lineHeight:1.8,fontFamily:"var(--m)",color:"var(--t2)",background:"var(--bg)",maxHeight:600,overflow:"auto"}}>{isStreaming?streamedText:prompt}{isStreaming&&<span style={{display:"inline-block",width:2,height:14,background:ac,marginLeft:1,animation:"pulse .8s infinite",verticalAlign:"text-bottom"}}/>}</pre>
          <div style={{padding:"10px 20px",borderTop:"1px solid var(--bd)",display:"flex",gap:14,flexWrap:"wrap",fontSize:11,color:"var(--t3)"}}>
            <span style={{display:"flex",alignItems:"center",gap:3}}>{I.hash(10,"var(--t3)")} {prompt.length} chars</span>
            <span style={{display:"flex",alignItems:"center",gap:3}}>{I.fileText(10,"var(--t3)")} ~{Math.ceil(prompt.split(/\s+/).length/0.75)} tokens</span>
            <span style={{display:"flex",alignItems:"center",gap:3}}>{I[TASKS[task].i]?.(10,"var(--t3)")} {tl(UI_TASKS,task)}</span>
            <span style={{display:"flex",alignItems:"center",gap:3}}>{I.target(10,"var(--t3)")} {tone}</span>
            <span style={{display:"flex",alignItems:"center",gap:3}}>{I.file(10,"var(--t3)")} {tl(UI_OUTPUTS,output)}</span>
            {fileOutput!=="none"&&<span style={{display:"flex",alignItems:"center",gap:3}}>{I.download(10,"var(--t3)")} {tl(UI_FILE_OUTPUTS,fileOutput)}</span>}
            {language!=="English"&&<span style={{display:"flex",alignItems:"center",gap:3}}>{I.lang(10,"var(--t3)")} {language}</span>}
          </div>
          <div style={{padding:"16px 20px",background:"var(--bg)",borderTop:"1px solid var(--bd)",fontSize:12,color:"var(--t3)",lineHeight:1.6}}>
            <p style={{margin:0}}>{t("resultInfo")}</p>
            {isFree&&<p style={{margin:"10px 0 0",fontSize:11,color:ac,fontWeight:500}}>Copies include "Generated with Prompt Architect" attribution. <span style={{textDecoration:"underline",cursor:"pointer"}} onClick={()=>setShowPaywall(true)}>Upgrade to Pro</span> to remove it.</p>}
          </div>
          {!user&&promptGenerated&&(
            <div style={{padding:"20px",background:"var(--s2)",borderTop:"1px solid var(--bd)",textAlign:"center"}}>
              <p style={{margin:"0 0 12px",fontSize:13,color:"var(--t2)",fontWeight:500}}>Save your prompt history and unlock advanced features</p>
              <button onClick={()=>{setAuthMode("signup");setShowAuth(true);setAuthErr("");}} style={{padding:"10px 20px",background:ac,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,fontFamily:"var(--f)",cursor:"pointer",transition:"all .2s"}}>Create account</button>
            </div>
          )}
        </div>
      )}

      </div>{/* end max-width content wrapper */}

      {/* CTA BANNER */}
      {!user&&(
        <section style={{background:`linear-gradient(135deg, #1B2A4A 0%, ${ac} 100%)`,padding:"48px 24px",textAlign:"center"}}>
          <div style={{maxWidth:560,margin:"0 auto"}}>
            <h2 style={{fontSize:"clamp(20px, 2.5vw, 28px)",fontWeight:800,color:"#fff",margin:"0 0 12px",letterSpacing:"-.3px"}}>Every prompt you write without this is leaving value on the table.</h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,.75)",margin:"0 0 24px",lineHeight:1.6}}>Join professionals who use Prompt Architect to get expert-level results from every AI interaction.</p>
            <button onClick={()=>{setAuthMode("signup");setShowAuth(true);setAuthErr("");}} style={{padding:"14px 36px",border:"none",borderRadius:10,background:"#fff",color:"#1B2A4A",fontSize:15,fontWeight:700,fontFamily:"var(--f)",cursor:"pointer",transition:"all .2s",boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>Build Your First Prompt</button>
          </div>
        </section>
      )}

      {/* PROMPTPERFECT ALTERNATIVE — SEO migration capture */}
      <section id="alternative" style={{background:"var(--bg)",borderTop:"1px solid var(--bd)",padding:"clamp(28px,5vw,48px) 24px"}}>
        <div style={{maxWidth:640,margin:"0 auto",textAlign:"center"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:20,background:"#F59E0B14",marginBottom:14,fontSize:12,fontWeight:600,color:"#D97706"}}>Switching from another tool?</div>
          <h2 style={{fontSize:"clamp(20px,2.5vw,28px)",fontWeight:800,margin:"0 0 12px",color:"var(--t1)",letterSpacing:"-.3px"}}>The best PromptPerfect alternative</h2>
          <p style={{fontSize:14,color:"var(--t2)",margin:"0 auto 24px",lineHeight:1.65,maxWidth:520}}>PromptPerfect is shutting down. Prompt Architect gives you everything it did and more -- deeper industry context, multi-model optimization, and expert-level prompt engineering that runs entirely in your browser.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:12,marginBottom:24,textAlign:"left"}}>
            {[
              "No API keys required",
              "Works offline in your browser",
              "15 industries with deep context",
              "5 AI model formats",
              "Free tier included",
              "Pro plan from $6/month",
            ].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:"var(--s1)",border:"1px solid var(--bd)",fontSize:12,color:"var(--t1)",fontWeight:500}}>{I.check(14,"#10B981")} {item}</div>
            ))}
          </div>
          <button onClick={()=>{document.getElementById("tool")?.scrollIntoView({behavior:"smooth"});trackEvent("promptperfect_cta_clicked");}} style={{padding:"12px 28px",border:"none",borderRadius:9,background:ac,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"var(--f)",cursor:"pointer",transition:"all .2s",boxShadow:"0 2px 10px "+ac+"30"}}>Try Prompt Architect free</button>
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <section className="reveal" style={{background:"var(--s1)",borderTop:"1px solid var(--bd)",padding:"40px 24px"}}>
        <div style={{maxWidth:480,margin:"0 auto",textAlign:"center"}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:40,height:40,borderRadius:10,background:ac+"10",marginBottom:12}}>{I.mail(20,ac)}</div>
          <h3 style={{fontSize:18,fontWeight:700,margin:"0 0 6px",color:"var(--t1)"}}>Get prompt engineering tips</h3>
          <p style={{fontSize:13,color:"var(--t3)",margin:"0 0 16px",lineHeight:1.5}}>Weekly insights on writing better AI prompts. No spam, unsubscribe anytime.</p>
          {nlStatus==="success"?(
            <div style={{padding:"12px 20px",borderRadius:10,background:"#10B98114",color:"#10B981",fontSize:13,fontWeight:600}}>{I.check(14,"#10B981")} You are on the list.</div>
          ):(
            <form onSubmit={handleNewsletter} style={{display:"flex",gap:8,maxWidth:400,margin:"0 auto"}}>
              <input type="email" value={nlEmail} onChange={e=>setNlEmail(e.target.value)} placeholder="Your email" style={{flex:1,padding:"11px 14px",borderRadius:9,border:"1.5px solid "+(nlStatus==="error"?"#ef4444":"var(--bd)"),background:"var(--bg)",color:"var(--t1)",fontSize:13,fontFamily:"var(--f)",outline:"none"}}/>
              <button type="submit" style={{padding:"11px 20px",borderRadius:9,border:"none",background:ac,color:"#fff",fontSize:13,fontWeight:600,fontFamily:"var(--f)",cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap"}}>Subscribe</button>
            </form>
          )}
          {nlStatus==="exists"&&<p style={{fontSize:11,color:ac,marginTop:8}}>This email is already subscribed.</p>}
          {nlStatus==="error"&&<p style={{fontSize:11,color:"#ef4444",marginTop:8}}>Please enter a valid email address.</p>}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid var(--bd)",background:"var(--s1)",padding:"36px 24px 32px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke={ac} strokeWidth="1.8" fill={ac+"08"}/>
              <path d="M12 24h6l3-6 4.5 12 3-6H35" stroke={ac} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="24" r="2" fill={ac}/>
              <circle cx="35" cy="24" r="2" fill={ac}/>
            </svg>
            <span style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>Prompt Architect</span>
          </div>
          <div style={{display:"flex",gap:"clamp(12px,3vw,24px)",alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:"clamp(10px,2.5vw,12px)",color:"var(--t3)"}}>Prompt generation runs entirely in your browser. Your data stays private.</span>
            <a href="https://github.com/DoomsdayTycoon/prompt-architect" target="_blank" rel="noopener" style={{fontSize:12,color:"var(--t3)",textDecoration:"none",display:"flex",alignItems:"center",gap:5,transition:"color .15s"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>
        <div style={{maxWidth:1200,margin:"12px auto 0",paddingTop:12,borderTop:"1px solid var(--bd)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <span style={{fontSize:11,color:"var(--t3)"}}>Built by OpenCraft Labs</span>
          <span style={{fontSize:11,color:"var(--t3)",opacity:.5}}>proarch.tech</span>
        </div>
      </footer>
    </div>{/* end outer page wrapper */}

    {/* AUTH MODAL */}
    {showAuth&&(
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20}} onClick={()=>setShowAuth(false)}>
        <div style={{background:"var(--s1)",borderRadius:18,padding:36,maxWidth:400,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.15)",animation:"slideDown .3s ease"}} onClick={(e)=>e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke={ac} strokeWidth="1.5" fill={ac+"08"}/>
              <path d="M12 24h6l3-6 4.5 12 3-6H35" stroke={ac} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="24" r="2" fill={ac}/>
              <circle cx="35" cy="24" r="2" fill={ac}/>
            </svg>
          </div>
          <h2 style={{fontSize:21,fontWeight:700,margin:"0 0 6px",color:"var(--t1)",textAlign:"center"}}>{authMode==="signup"?"Start getting better AI results":"Welcome back"}</h2>
          {authMode==="signup"&&<p style={{textAlign:"center",fontSize:12.5,color:"var(--t3)",margin:"0 0 22px",lineHeight:1.5}}>Free to start. No credit card required. Build your first prompt in seconds.</p>}
          {authMode!=="signup"&&<div style={{marginBottom:22}}/>}
          <button onClick={()=>handleOAuthLogin("google")} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:13,borderRadius:10,border:"1px solid var(--bd)",background:"var(--s1)",color:"var(--t1)",fontSize:14,fontWeight:600,fontFamily:"var(--f)",cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--s2)";}} onMouseLeave={e=>{e.currentTarget.style.background="var(--s1)";}}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          <div style={{display:"flex",alignItems:"center",gap:12,margin:"6px 0"}}>
            <div style={{flex:1,height:1,background:"var(--bd)"}}/>
            <span style={{fontSize:12,color:"var(--t3)",fontWeight:500}}>or</span>
            <div style={{flex:1,height:1,background:"var(--bd)"}}/>
          </div>
          <form onSubmit={handleAuthSubmit} style={{display:"flex",flexDirection:"column",gap:12}}>
            {authMode==="signup"&&(
              <input value={authName} onChange={(e)=>setAuthName(e.target.value)} placeholder="Your name" style={inp({fontSize:14,padding:14})} />
            )}
            <input value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} type="email" placeholder="Email address" style={inp({fontSize:14,padding:14})} />
            <input value={authPassword} onChange={(e)=>setAuthPassword(e.target.value)} type="password" placeholder="Password" style={inp({fontSize:14,padding:14})} />
            {authMode==="signup"&&<div style={{fontSize:11,color:"var(--t3)",marginTop:-4,paddingLeft:2}}>Min. 8 characters with uppercase, lowercase, and a number</div>}
            {authErr&&<div style={{padding:10,background:"#fee2e2",border:"1px solid #fecaca",borderRadius:8,fontSize:13,color:"#dc2626",fontFamily:"var(--f)"}}>{authErr}</div>}
            <button type="submit" disabled={authSubmitting} style={{padding:14,background:authSubmitting?ac+"80":ac,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,fontFamily:"var(--f)",cursor:authSubmitting?"not-allowed":"pointer",transition:"all .2s",marginTop:4}}>{authSubmitting?"Please wait...":(authMode==="signup"?"Create free account":"Sign in")}</button>
          </form>
          {authMode==="signup"&&(
            <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:16,paddingTop:14,borderTop:"1px solid var(--bd)"}}>
              {[{ic:"check",t:"Free prompts included"},{ic:"check",t:"No credit card"},{ic:"check",t:"Works in seconds"}].map(({ic,t},i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"var(--t3)",fontWeight:500}}>{I[ic](11,"#10B981")}{t}</div>
              ))}
            </div>
          )}
          <div style={{marginTop:authMode==="signup"?14:20,textAlign:"center",fontSize:13,color:"var(--t2)"}}>
            {authMode==="signup"?(<>Already have an account? <button onClick={()=>{setAuthMode("login");setAuthErr("");}} style={{border:"none",background:"none",color:ac,cursor:"pointer",fontWeight:700,fontFamily:"var(--f)"}}>Sign in</button></>):(<>Don't have an account? <button onClick={()=>{setAuthMode("signup");setAuthErr("");}} style={{border:"none",background:"none",color:ac,cursor:"pointer",fontWeight:700,fontFamily:"var(--f)"}}>Sign up free</button></>)}
          </div>
        </div>
      </div>
    )}

    {/* REFERRAL MODAL */}
    {showReferral&&(
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20}} onClick={()=>setShowReferral(false)}>
        <div style={{background:"var(--s1)",borderRadius:16,padding:32,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.15)",animation:"slideDown .25s ease"}} onClick={(e)=>e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
            <div style={{width:52,height:52,borderRadius:14,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center"}}>{I.gift(26,ac)}</div>
          </div>
          <h3 style={{fontSize:20,fontWeight:700,margin:"0 0 8px",textAlign:"center",color:"var(--t1)"}}>Give 30 days, get 30 days</h3>
          <p style={{fontSize:13,color:"var(--t2)",margin:"0 0 20px",textAlign:"center",lineHeight:1.6}}>Share your referral link. When someone signs up and subscribes, you both get 30 days of Pro for free.</p>
          <div style={{background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <code style={{flex:1,fontSize:12,color:"var(--t2)",fontFamily:"var(--m)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{referralLink}</code>
            <button onClick={copyReferral} style={{padding:"6px 14px",borderRadius:7,border:"none",background:ac,color:"#fff",fontSize:12,fontWeight:600,fontFamily:"var(--f)",cursor:"pointer",whiteSpace:"nowrap"}}>{I.copy(12,"#fff")} Copy</button>
          </div>
          <div style={{display:"flex",gap:8}}>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I use Prompt Architect to turn vague ideas into expert AI prompts. Try it free:")}&url=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:8,border:"1px solid var(--bd)",background:"var(--s2)",color:"var(--t2)",fontSize:12,fontWeight:600,fontFamily:"var(--f)",textDecoration:"none",cursor:"pointer"}}>Share on X</a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:8,border:"1px solid var(--bd)",background:"var(--s2)",color:"var(--t2)",fontSize:12,fontWeight:600,fontFamily:"var(--f)",textDecoration:"none",cursor:"pointer"}}>Share on LinkedIn</a>
          </div>
          <button onClick={()=>setShowReferral(false)} style={{width:"100%",marginTop:14,padding:"10px",borderRadius:8,border:"1px solid var(--bd)",background:"transparent",color:"var(--t3)",fontSize:12,fontWeight:500,fontFamily:"var(--f)",cursor:"pointer"}}>Close</button>
        </div>
      </div>
    )}

    {/* COMMAND PALETTE — Cmd+K quick-access to history, actions, mode toggle */}
    {showPalette&&(
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"min(20vh, 160px)",zIndex:2001}} onClick={()=>setShowPalette(false)}>
        <div style={{background:"var(--s1)",borderRadius:14,width:"100%",maxWidth:520,boxShadow:"0 20px 60px rgba(0,0,0,.2)",animation:"slideDown .15s ease",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid var(--bd)",display:"flex",alignItems:"center",gap:10}}>
            {I.search?I.search(16,"var(--t3)"):<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
            <input ref={paletteRef} autoFocus value={paletteQuery} onChange={e=>setPaletteQuery(e.target.value)} placeholder="Search prompts and actions..." style={{flex:1,border:"none",outline:"none",fontSize:14,fontFamily:"var(--f)",background:"transparent",color:"var(--t1)"}} onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();setShowPalette(false);}}}/>
            <span style={{fontSize:10,color:"var(--t3)",padding:"2px 6px",borderRadius:4,border:"1px solid var(--bd)",fontFamily:"var(--m)"}}>esc</span>
          </div>
          <div style={{maxHeight:340,overflowY:"auto",padding:"6px"}}>
            {(()=>{
              const q=paletteQuery.toLowerCase().trim();
              const actions=[
                {type:"action",label:"New prompt",sub:"Clear all fields and start fresh",icon:I.plus(14,ac),action:()=>{resetAll();setShowPalette(false);}},
                {type:"action",label:isExp?"Switch to Simple mode":"Switch to Expert mode",sub:"Toggle between Simple and Expert",icon:I.sliders?I.sliders(14,ac):I.bolt(14,ac),action:()=>{setMode(isExp?"amateur":"expert");setShowPalette(false);}},
              ];
              if(user){
                actions.push({type:"action",label:"Prompt history",sub:history.length+" saved prompts",icon:I.clock(14,ac),action:()=>{setShowHistory(true);setShowPalette(false);setTimeout(()=>{const el=document.getElementById("history-panel");if(el)el.scrollIntoView({behavior:"smooth",block:"start"});},100);}});
                actions.push({type:"action",label:"Sign out",sub:user.email,icon:I.trash(14,"#ef4444"),action:()=>{handleLogout();setShowPalette(false);}});
              }
              const filteredActions=q?actions.filter(a=>a.label.toLowerCase().includes(q)||a.sub.toLowerCase().includes(q)):actions;
              const filteredHistory=history.filter(h=>!q||h.topic.toLowerCase().includes(q)).slice(0,6);
              const hasResults=filteredActions.length>0||filteredHistory.length>0;
              if(!hasResults)return <div style={{padding:"24px 16px",textAlign:"center",color:"var(--t3)",fontSize:13}}>No results</div>;
              return <>
                {filteredActions.length>0&&<>
                  <div style={{padding:"6px 12px 4px",fontSize:10.5,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".5px"}}>Actions</div>
                  {filteredActions.map((a,i)=>(
                    <button key={"a"+i} onClick={a.action} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",border:"none",background:"transparent",cursor:"pointer",borderRadius:8,fontFamily:"var(--f)",transition:"background .1s",textAlign:"left"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--s2)";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                      <div style={{width:28,height:28,borderRadius:7,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{a.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{a.label}</div>
                        <div style={{fontSize:11,color:"var(--t3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.sub}</div>
                      </div>
                    </button>
                  ))}
                </>}
                {filteredHistory.length>0&&<>
                  <div style={{padding:"8px 12px 4px",fontSize:10.5,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".5px",borderTop:filteredActions.length?"1px solid var(--bd)":"none",marginTop:filteredActions.length?4:0}}>Recent prompts</div>
                  {filteredHistory.map((h,i)=>{
                    const mc=(MODELS[h.model]&&MODELS[h.model].col)||ac;
                    return (
                      <button key={"h"+i} onClick={()=>{loadFromHistory(h);setShowPalette(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",border:"none",background:"transparent",cursor:"pointer",borderRadius:8,fontFamily:"var(--f)",transition:"background .1s",textAlign:"left"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--s2)";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                        <div style={{width:28,height:28,borderRadius:7,background:mc+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,borderLeft:"3px solid "+mc}}><MM id={h.model} size={14}/></div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:"var(--t1)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.topic}</div>
                          <div style={{fontSize:11,color:"var(--t3)"}}>{tl(UI_TASKS,h.task)} / {tl(UI_INDUSTRIES,h.industry)}</div>
                        </div>
                      </button>
                    );
                  })}
                </>}
              </>;
            })()}
          </div>
        </div>
      </div>
    )}

    {/* RESET UNDO TOAST — replaces the old 2-click confirmation modal.
        New Prompt clears immediately; this toast lets the user undo for 5s. */}
    {showResetUndo&&(
      <div role="status" aria-live="polite" style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#0f172a",color:"#fff",padding:"12px 16px 12px 18px",borderRadius:10,boxShadow:"0 12px 40px rgba(0,0,0,.25)",display:"flex",alignItems:"center",gap:14,zIndex:2000,animation:"slideDown .2s ease",fontFamily:"var(--f)",fontSize:13}}>
        <span style={{display:"flex",alignItems:"center",gap:8}}>{I.check(14,"#10B981")} Prompt cleared</span>
        <button onClick={undoReset} style={{padding:"6px 14px",borderRadius:7,border:"none",background:"#fff",color:"#0f172a",fontSize:12,fontWeight:700,fontFamily:"var(--f)",cursor:"pointer",transition:"all .15s"}}>Undo</button>
        <button onClick={()=>{setShowResetUndo(false);lastResetSnapshotRef.current=null;if(resetUndoTimerRef.current){clearTimeout(resetUndoTimerRef.current);resetUndoTimerRef.current=null;}}} aria-label="Dismiss" style={{padding:"4px 6px",borderRadius:6,border:"none",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:16,lineHeight:1,fontFamily:"var(--f)"}}>×</button>
      </div>
    )}

    {/* PROMPT LAB MODAL */}
    {labOpen&&(
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16,overflow:"auto"}} onClick={()=>!labLoading&&setLabOpen(false)}>
        <div style={{background:"var(--s1)",borderRadius:18,maxWidth:920,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.2)",animation:"slideDown .3s ease",maxHeight:"90vh",overflow:"auto",position:"relative"}} onClick={(e)=>e.stopPropagation()}>
          {/* Header */}
          <div style={{padding:"22px 28px 18px",borderBottom:"1px solid var(--bd)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center"}}>{I.microscope(18,ac)}</div>
              <div>
                <h2 style={{fontSize:17,fontWeight:700,margin:0,color:"var(--t1)"}}>{t("labTitle")}</h2>
                {labLoading&&<p style={{fontSize:12,color:"var(--t3)",margin:"3px 0 0"}}>{t("labLoading")}</p>}
              </div>
            </div>
            <button onClick={()=>setLabOpen(false)} style={{width:32,height:32,borderRadius:8,border:"1px solid var(--bd)",background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--t3)",fontSize:18,fontFamily:"var(--f)",lineHeight:1}}>&times;</button>
          </div>

          {/* Loading state */}
          {labLoading&&(
            <div style={{padding:"60px 28px",textAlign:"center"}}>
              <div style={{width:48,height:48,borderRadius:"50%",border:"3px solid var(--bd)",borderTopColor:ac,animation:"spin 1s linear infinite",margin:"0 auto 20px"}}/>
              <p style={{fontSize:14,color:"var(--t2)",margin:0,fontWeight:500}}>{t("labLoading")}</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* Error state */}
          {labError&&!labLoading&&(
            <div style={{padding:"40px 28px",textAlign:"center"}}>
              <div style={{width:44,height:44,borderRadius:12,background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>{I.info(20,"#dc2626")}</div>
              <p style={{fontSize:14,color:"#dc2626",margin:"0 0 16px",fontWeight:500}}>{labError}</p>
              <button onClick={runLab} style={{padding:"10px 24px",borderRadius:8,border:"none",background:ac,color:"#fff",fontSize:13,fontWeight:600,fontFamily:"var(--f)",cursor:"pointer"}}>Try again</button>
            </div>
          )}

          {/* Results */}
          {!labLoading&&!labError&&labResults.length>0&&(
            <div style={{padding:"20px 24px 24px",display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",gap:16}}>
              {labResults.map((r,idx)=>{
                const isWinner=idx===0;
                const scoreKeys=[{k:"clarity",l:t("labClarity")},{k:"specificity",l:t("labSpecificity")},{k:"professionalism",l:t("labProfessionalism")},{k:"actionability",l:t("labActionability")},{k:"structure",l:t("labStructure")}];
                const nameMap={structured:t("labStructured"),narrative:t("labNarrative"),meta:t("labMeta")};
                return (
                  <div key={r.variantId} style={{border:"2px solid "+(isWinner?ac:"var(--bd)"),borderRadius:14,padding:0,overflow:"hidden",background:"var(--s1)",transition:"all .2s",position:"relative"}}>
                    {isWinner&&<div style={{background:ac,color:"#fff",fontSize:10,fontWeight:700,textAlign:"center",padding:"4px 0",letterSpacing:.5}}>{t("labWinner")}</div>}
                    <div style={{padding:"16px 18px"}}>
                      {/* Strategy name */}
                      <div style={{fontSize:15,fontWeight:700,color:"var(--t1)",marginBottom:8}}>{nameMap[r.variantId]||r.name}</div>

                      {/* Config tags */}
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:14}}>
                        {r.config&&r.config.tone&&<span style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"var(--s2)",color:"var(--t2)",fontWeight:500}}>{r.config.tone}</span>}
                        {r.config&&r.config.length&&<span style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"var(--s2)",color:"var(--t2)",fontWeight:500}}>{r.config.length}</span>}
                        {r.config&&r.config.techniques&&r.config.techniques.length>0&&r.config.techniques.map(tc=><span key={tc} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:ac+"10",color:ac,fontWeight:500}}>{TECHS[tc]?.l||tc}</span>)}
                      </div>

                      {/* Score bars */}
                      {scoreKeys.map(({k,l})=>{
                        const val=r.scores?.[k]||0;
                        const col=val>=8?"#10B981":val>=6?"#F59E0B":"#F97316";
                        return (
                          <div key={k} style={{marginBottom:6}}>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:2}}>
                              <span>{l}</span><span style={{fontWeight:600,color:col}}>{val}/10</span>
                            </div>
                            <div style={{height:6,borderRadius:3,background:"var(--s2)",overflow:"hidden"}}>
                              <div style={{height:"100%",borderRadius:3,background:col,width:(val*10)+"%",transition:"width .4s ease"}}/>
                            </div>
                          </div>
                        );
                      })}

                      {/* Total */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,paddingTop:10,borderTop:"1px solid var(--bd)"}}>
                        <span style={{fontSize:12,fontWeight:600,color:"var(--t2)"}}>{t("labTotal")}</span>
                        <span style={{fontSize:20,fontWeight:800,color:isWinner?ac:"var(--t1)"}}>{r.total}<span style={{fontSize:12,fontWeight:400,color:"var(--t3)"}}>/50</span></span>
                      </div>

                      {/* Preview */}
                      <div style={{marginTop:12,padding:"10px 12px",borderRadius:8,background:"var(--bg)",fontSize:11,color:"var(--t3)",lineHeight:1.5,maxHeight:80,overflow:"hidden",fontFamily:"var(--m)"}}>
                        {r.output?r.output.slice(0,260)+(r.output.length>260?"...":""):"No preview available"}
                      </div>

                      {/* Apply button */}
                      <button onClick={()=>applyLabConfig(r.config)} style={{width:"100%",marginTop:14,padding:"10px 0",borderRadius:8,border:isWinner?"none":"1px solid var(--bd)",background:isWinner?ac:"var(--s1)",color:isWinner?"#fff":"var(--t2)",fontSize:13,fontWeight:isWinner?700:600,fontFamily:"var(--f)",cursor:"pointer",transition:"all .2s"}}>{t("labApply")}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}

    {/* PAYWALL / PRICING MODAL */}
    {showPaywall&&(
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20}} onClick={()=>setShowPaywall(false)}>
        <div style={{background:"var(--s1)",borderRadius:16,padding:0,maxWidth:480,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.2)",animation:"slideDown .3s ease",overflow:"hidden"}} onClick={(e)=>e.stopPropagation()}>
          {/* Header */}
          <div style={{background:"linear-gradient(135deg, #1B2A4A 0%, #0891B2 100%)",padding:"28px 28px 24px",color:"#fff"}}>
            <h2 style={{fontSize:22,fontWeight:700,margin:"0 0 8px"}}>Unlock Unlimited Expert Prompts</h2>
            <p style={{fontSize:13,margin:0,opacity:.85,lineHeight:1.5}}>Every prompt you write without Prompt Architect is leaving value on the table. Upgrade to get unlimited access to expert-level prompts that make your AI deliver.</p>
          </div>
          {/* Usage summary */}
          <div style={{padding:"20px 28px",borderBottom:"1px solid var(--bd)"}}>
            <div style={{display:"flex",gap:16}}>
              <div style={{flex:1,padding:"12px 14px",borderRadius:8,background:"var(--s2)",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:700,color:"var(--t1)"}}>{usage.simple_used}/{FREE_SIMPLE}</div>
                <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>Simple prompts used</div>
              </div>
              <div style={{flex:1,padding:"12px 14px",borderRadius:8,background:"var(--s2)",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:700,color:"var(--t1)"}}>{usage.expert_used}/{FREE_EXPERT}</div>
                <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>Expert prompts used</div>
              </div>
            </div>
          </div>
          {/* Pricing options */}
          <div style={{padding:"20px 28px"}}>
            <div style={{display:"flex",gap:12,marginBottom:20}}>
              {/* Monthly */}
              <div onClick={()=>setPaywallPlan("monthly")} style={{flex:1,padding:"16px",borderRadius:10,border:"2px solid "+(paywallPlan==="monthly"?ac:"var(--bd)"),background:paywallPlan==="monthly"?ac+"08":"var(--s1)",textAlign:"center",cursor:"pointer",transition:"all .15s"}}>
                <div style={{fontSize:11,color:paywallPlan==="monthly"?ac:"var(--t3)",fontWeight:600,marginBottom:4}}>MONTHLY</div>
                <div style={{fontSize:28,fontWeight:800,color:"var(--t1)"}}><span style={{fontSize:16,fontWeight:500}}>$</span>9<span style={{fontSize:14,fontWeight:400,color:"var(--t3)"}}>/mo</span></div>
                <div style={{fontSize:11,color:"var(--t3)",marginTop:4}}>Cancel anytime</div>
              </div>
              {/* Annual */}
              <div onClick={()=>setPaywallPlan("annual")} style={{flex:1,padding:"16px",borderRadius:10,border:"2px solid "+(paywallPlan==="annual"?ac:"var(--bd)"),background:paywallPlan==="annual"?ac+"08":"var(--s1)",textAlign:"center",position:"relative",cursor:"pointer",transition:"all .15s"}}>
                <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:ac,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:10}}>SAVE 33%</div>
                <div style={{fontSize:11,color:paywallPlan==="annual"?ac:"var(--t3)",fontWeight:600,marginBottom:4}}>ANNUAL</div>
                <div style={{fontSize:28,fontWeight:800,color:"var(--t1)"}}><span style={{fontSize:16,fontWeight:500}}>$</span>6<span style={{fontSize:14,fontWeight:400,color:"var(--t3)"}}>/mo</span></div>
                <div style={{fontSize:11,color:"var(--t3)",marginTop:4}}>$72 billed yearly</div>
              </div>
            </div>
            {/* Features */}
            <div style={{marginBottom:20}}>
              {["Unlimited prompt generation (Simple + Expert)","15 industries with firm-specific expertise and roles","15 advanced reasoning techniques (red team, systems thinking)","Prompt history saved and searchable","Priority support and early access to new features"].map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",fontSize:12.5,color:"var(--t2)"}}>{I.check(14,"#10B981")}{f}</div>
              ))}
            </div>
            {/* Welcome offer nudge */}
            {!promoCode.trim()&&<div onClick={()=>setPromoCode("WELCOME30")} style={{margin:"0 0 12px",padding:"10px 14px",borderRadius:8,background:ac+"08",border:"1px dashed "+ac+"30",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"all .15s"}}>
              <div style={{fontSize:12,color:"var(--t2)"}}><span style={{fontWeight:700,color:ac}}>WELCOME30</span> -- {uiLang==="no"?"30% avslag på første betaling":"30% off your first payment"}</div>
              <div style={{fontSize:11,color:ac,fontWeight:600,whiteSpace:"nowrap"}}>{uiLang==="no"?"Bruk kode":"Apply"}</div>
            </div>}
            {/* CTA */}
            <button disabled={checkoutLoading} onClick={handleCheckout} style={{width:"100%",padding:14,borderRadius:10,border:"none",background:checkoutLoading?ac+"80":ac,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"var(--f)",cursor:checkoutLoading?"not-allowed":"pointer",transition:"all .2s",boxShadow:"0 4px 20px "+ac+"35"}}>{checkoutLoading?"Redirecting to checkout...":"Upgrade Now"}</button>
            {/* Promo / discount code */}
            <div style={{marginTop:16,padding:"14px 0 0",borderTop:"1px solid var(--bd)"}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={promoCode} onChange={(e)=>{setPromoCode(e.target.value.toUpperCase());}} placeholder={uiLang==="no"?"Rabattkode":"Discount code"} maxLength={20} style={{flex:1,padding:"10px 12px",borderRadius:8,border:"1.5px solid "+(promoCode.trim()?"#10B981":"var(--bd)"),background:promoCode.trim()?"#10B98108":"var(--bg)",color:"var(--t1)",fontSize:13,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:1,outline:"none",textTransform:"uppercase",transition:"all .15s"}} />
                {promoCode.trim()&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#10B981",fontWeight:600,whiteSpace:"nowrap"}}>{I.check(14,"#10B981")}{uiLang==="no"?"Brukes ved betaling":"Applied at checkout"}</div>}
              </div>
              <div style={{fontSize:11,color:"var(--t3)",marginTop:6}}>{uiLang==="no"?"Skriv inn en rabattkode for å få avslag på abonnementet. Koden brukes automatisk ved betaling.":"Enter a discount code to save on your subscription. The code is applied automatically at checkout."}</div>
            </div>
            <button onClick={()=>{setShowPaywall(false);setPromoCode("");setPromoMsg("");}} style={{width:"100%",padding:10,borderRadius:8,border:"none",background:"transparent",color:"var(--t3)",fontSize:12,fontFamily:"var(--f)",cursor:"pointer",marginTop:8}}>Maybe later</button>
          </div>
        </div>
      </div>
    )}

    {/* COOKIE CONSENT */}
    {/* COPY TOAST */}
    {showCopyToast&&(
      <div className="toast-up" style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:3001,display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:10,background:"#10B981",color:"#fff",fontSize:13,fontWeight:600,fontFamily:"var(--f)",boxShadow:"0 8px 32px rgba(16,185,129,.3)",pointerEvents:"none"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        {t("copiedBtn")}
      </div>
    )}

    {showCookies&&(
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"var(--s1)",borderTop:"1px solid var(--bd)",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"center",gap:16,flexWrap:"wrap",zIndex:3000,boxShadow:"0 -2px 12px rgba(0,0,0,.06)",animation:"up .3s ease"}}>
        <p style={{margin:0,fontSize:12,color:"var(--t2)",lineHeight:1.5,maxWidth:600}}>{t("cookieMsg")}</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{localStorage.setItem("pa_cookies","1");setShowCookies(false);}} style={{padding:"7px 18px",borderRadius:7,border:"none",background:ac,color:"#fff",fontSize:12,fontWeight:600,fontFamily:"var(--f)",cursor:"pointer",whiteSpace:"nowrap"}}>{t("cookieAccept")}</button>
          <button onClick={()=>{localStorage.setItem("pa_cookies","0");setShowCookies(false);window['ga-disable-G-TMC03JP6HJ']=true;}} style={{padding:"7px 18px",borderRadius:7,border:"1px solid var(--bd)",background:"var(--s2)",color:"var(--t2)",fontSize:12,fontWeight:600,fontFamily:"var(--f)",cursor:"pointer",whiteSpace:"nowrap"}}>{t("cookieDecline")}</button>
        </div>
      </div>
    )}
  </>;
}

const seoFallback=document.getElementById("seo-fallback");
if(seoFallback)seoFallback.style.display="none";
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
