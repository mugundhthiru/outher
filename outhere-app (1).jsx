// ╔══════════════════════════════════════════════════════════════╗
// ║  OutHere — paste this into StackBlitz as App.jsx            ║
// ║  StackBlitz URL: https://stackblitz.com/fork/react          ║
// ║  Replace contents of App.js with this file                  ║
// ║                                                              ║
// ║  For live multiplayer, add to package.json dependencies:    ║
// ║    "partykit": "^0.0.1"  (optional — simulated below)       ║
// ║  Sharing: just send the StackBlitz preview URL              ║
// ╚══════════════════════════════════════════════════════════════╝

import React, { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg:          "#09090F",
  bg2:         "#111118",
  bg3:         "#18181F",
  bg4:         "#22222C",
  border:      "rgba(255,255,255,0.07)",
  borderHi:    "rgba(255,255,255,0.14)",
  purple:      "#9B8FF5",
  purpleDim:   "#4A4580",
  purpleGlow:  "rgba(155,143,245,0.13)",
  teal:        "#2ECC9E",
  tealGlow:    "rgba(46,204,158,0.11)",
  red:         "#F26B6B",
  redGlow:     "rgba(242,107,107,0.11)",
  amber:       "#F0AC30",
  amberGlow:   "rgba(240,172,48,0.11)",
  pink:        "#E080B8",
  pinkGlow:    "rgba(224,128,184,0.11)",
  text:        "#EEEDF8",
  textMuted:   "#7A789A",
  textDim:     "#3C3A58",
  white:       "#FFFFFF",
};

const riskLabel = v => ["","very chill","easy","low-key","moderate","getting there","sketchy fun","wild but legal-ish","cops might notice","walk the line","full send"][Math.min(v,10)];
const riskColor = v => v<=3?C.teal:v<=6?C.amber:C.red;

// ─────────────────────────────────────────────
//  FAKE REAL-TIME STORE
//  In production swap this for PartyKit/Liveblocks.
//  This simulates shared state across "sessions" using
//  localStorage so multiple tabs can test together.
// ─────────────────────────────────────────────
const ROOM_KEY = "outher_room_v1";
function readRoom() {
  try { return JSON.parse(localStorage.getItem(ROOM_KEY)||"{}"); } catch { return {}; }
}
function writeRoom(patch) {
  const current = readRoom();
  const next = {...current,...patch};
  localStorage.setItem(ROOM_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("outher_update"));
  return next;
}
function useRoom() {
  const [room, setRoom] = useState(readRoom);
  useEffect(()=>{
    const handler = ()=>setRoom(readRoom());
    window.addEventListener("outher_update", handler);
    window.addEventListener("storage", handler);
    return ()=>{ window.removeEventListener("outher_update",handler); window.removeEventListener("storage",handler); };
  },[]);
  return [room, writeRoom];
}

// ─────────────────────────────────────────────
//  STATIC DATA
// ─────────────────────────────────────────────
const AVATAR_COLORS = [
  {bg:"#1E1840",tc:C.purple},{bg:"#0D2218",tc:C.teal},{bg:"#251A06",tc:C.amber},
  {bg:"#22092A",tc:C.pink},{bg:"#1A0D0D",tc:C.red},{bg:"#0D1A22",tc:"#60C8E8"},
];
function colorFor(name) {
  if(!name) return AVATAR_COLORS[0];
  let h=0; for(let c of name) h=(h*31+c.charCodeAt(0))%AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initials(name) {
  const parts = name.trim().split(" ");
  return parts.length>1 ? (parts[0][0]+parts[1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
}

const DEFAULT_ACTS = [
  { id:1, title:"Trash bag sledding", subtitle:"Century Park massive hill", distance:"0.8 mi", emoji:"🛷",
    tags:[{l:"free",c:C.teal},{l:"outdoor",c:C.teal},{l:"risky",c:C.red}], riskLevel:7,
    srcIcon:"ti ti-brand-reddit", srcQuote:'"The east hill goes insane when wet. Way faster than actual sleds" — r/VernonHills' },
  { id:2, title:"Hidden creek trail", subtitle:"Greenbelt path nobody knows about", distance:"1.2 mi", emoji:"🌿",
    tags:[{l:"explore",c:C.teal},{l:"free",c:C.teal},{l:"nature",c:C.teal}], riskLevel:2,
    srcIcon:"ti ti-brand-instagram", srcQuote:'"Random creek behind the subdivision leads to a whole forest. Nobody goes there" — local reel' },
  { id:3, title:"Midnight bike run", subtitle:"Every cul-de-sac, end at 7-eleven", distance:"your area", emoji:"🚴",
    tags:[{l:"free",c:C.teal},{l:"night",c:C.purple},{l:"wild",c:C.red}], riskLevel:8,
    srcIcon:"ti ti-brand-tiktok", srcQuote:'"We do this every weekend. Bring lights. Best nights ever" — TikTok' },
  { id:4, title:"Rooftop parking view", subtitle:"Old mall lot, top level at night", distance:"2.1 mi", emoji:"🏙️",
    tags:[{l:"urban",c:C.purple},{l:"free",c:C.teal},{l:"sketchy",c:C.red}], riskLevel:9,
    srcIcon:"ti ti-brand-reddit", srcQuote:'"Insane view of the whole town. Security never checks" — r/LakeCountyIL' },
];

// ─────────────────────────────────────────────
//  SHARED COMPONENTS
// ─────────────────────────────────────────────
const s = {
  screen:  { paddingBottom:96, minHeight:"100vh" },
  section: { fontSize:10, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:".1em", padding:"20px 16px 8px" },
  card:    { background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:16, margin:"0 16px 10px", overflow:"hidden" },
  btn:     { border:`0.5px solid ${C.border}`, borderRadius:10, background:"none", padding:"9px 16px", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:C.text },
  bigBtn:  { width:"100%", padding:15, background:C.purple, color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, letterSpacing:"-.01em" },
  input:   { width:"100%", padding:"13px 16px", border:`0.5px solid ${C.border}`, borderRadius:12, fontSize:15, background:C.bg3, color:C.text, outline:"none", boxSizing:"border-box" },
};

function Av({ name, size=34 }) {
  const col = colorFor(name);
  return (
    <div style={{width:size, height:size, borderRadius:"50%", background:col.bg, color:col.tc,
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.33, fontWeight:700, flexShrink:0}}>
      {initials(name)}
    </div>
  );
}

function Tag({ l, c }) {
  return <span style={{display:"inline-flex", fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, margin:"2px 2px 0", color:c, background:`${c}18`, border:`0.5px solid ${c}40`}}>{l}</span>;
}

function GlowBtn({ children, color=C.purple, glow, onClick, style={}, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{...s.bigBtn, background:color, boxShadow:`0 0 24px ${glow||color}40`, ...style}}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
//  SIGN IN SCREEN
// ─────────────────────────────────────────────
function SignInScreen({ onJoin }) {
  const [name, setName] = useState("");
  const [room] = useRoom();
  const members = Object.values(room.members||{});

  function join() {
    const trimmed = name.trim();
    if(!trimmed) return;
    const me = { name:trimmed, joinedAt:Date.now(), votes:{}, settings:{risk:7,adventure:8,distance:5,budget:0,outdoor:"outdoor",age:"16–18",interests:["outdoor exploring","biking"]} };
    const members = {...(readRoom().members||{}), [trimmed]: me };
    writeRoom({ members });
    onJoin(trimmed);
  }

  return (
    <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 24px"}}>
      <div style={{width:"100%", maxWidth:360}}>
        {/* Logo */}
        <div style={{textAlign:"center", marginBottom:40}}>
          <div style={{width:64, height:64, background:C.purpleGlow, border:`0.5px solid ${C.purple}60`, borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px"}}>
            <i className="ti ti-compass" style={{fontSize:30, color:C.purple}}/>
          </div>
          <div style={{fontSize:32, fontWeight:800, color:C.text, letterSpacing:"-.04em"}}>OutHere</div>
          <div style={{fontSize:14, color:C.textMuted, marginTop:6}}>find your people. find your plans.</div>
        </div>

        {/* Who's already in */}
        {members.length>0 && (
          <div style={{background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:14, padding:"12px 14px", marginBottom:20}}>
            <div style={{fontSize:11, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:".08em", marginBottom:10}}>Already joined</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
              {members.map(m=>(
                <div key={m.name} style={{display:"flex", alignItems:"center", gap:7}}>
                  <Av name={m.name} size={26}/>
                  <span style={{fontSize:13, color:C.textMuted}}>{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{marginBottom:12}}>
          <div style={{fontSize:13, fontWeight:600, color:C.textMuted, marginBottom:8}}>Your name</div>
          <input
            style={{...s.input, fontSize:18, fontWeight:600, padding:"15px 18px", borderRadius:14}}
            placeholder="e.g. Alex"
            value={name}
            onChange={e=>setName(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&join()}
            autoFocus
          />
        </div>

        <GlowBtn onClick={join} disabled={!name.trim()}>
          <i className="ti ti-arrow-right" style={{fontSize:18}}/> Join the crew
        </GlowBtn>

        <div style={{marginTop:20, textAlign:"center", fontSize:12, color:C.textDim, lineHeight:1.6}}>
          Beta version · no password needed right now<br/>
          Send this link to your friends so they can join too
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  EXPLORE SCREEN
// ─────────────────────────────────────────────
function ExploreScreen({ myName, settings, onAskAI }) {
  const [acts, setActs] = useState(DEFAULT_ACTS);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [room, updateRoom] = useRoom();
  const members = Object.values(room.members||{});

  const filtered = acts.filter(a=>(a.riskLevel||0)<=settings.risk);

  async function discover() {
    setLoading(true); setNotice(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:900,
          system:`You are OutHere's activity discovery AI. Return ONLY a JSON array of 3 activity objects, no markdown, no extra text. Each object must have: title (string), subtitle (string), distance (string), emoji (single emoji), riskLevel (number 1-10), srcQuote (string with quotes), srcIcon (one of: "ti ti-brand-reddit" OR "ti ti-brand-tiktok" OR "ti ti-brand-instagram"). Make activities genuinely fun and real for teens near Vernon Hills IL.`,
          messages:[{role:"user",content:`Find 3 fun hidden-gem activities near Vernon Hills IL. Risk up to ${settings.risk}/10. Budget $${settings.budget}. Setting: ${settings.outdoor}. Age: ${settings.age}. Interests: ${settings.interests?.join(", ")||"outdoor, exploring"}. Weather: rainy 58F. Make them actually interesting.`}]
        })
      });
      const data = await res.json();
      const raw = data.content?.map(c=>c.text||"").join("")||"[]";
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      const mapped = parsed.map((a,i)=>({
        id:Date.now()+i, title:a.title, subtitle:a.subtitle||"", distance:a.distance||"nearby",
        emoji:a.emoji||"📍", riskLevel:a.riskLevel||3,
        tags:[{l:"new find",c:C.purple}],
        srcIcon:a.srcIcon||"ti ti-brand-reddit", srcQuote:a.srcQuote||""
      }));
      setActs(p=>[...mapped,...p]);
      setNotice(`Found ${mapped.length} new spots near you ✓`);
    } catch(e){ setNotice("Couldn't reach AI — showing saved spots"); }
    setLoading(false);
  }

  function voteAct(actId, vote) {
    const members = readRoom().members||{};
    if(!members[myName]) return;
    members[myName].votes = {...(members[myName].votes||{}), [actId]:vote};
    updateRoom({members});
  }

  function getVoteCounts(actId) {
    const ms = Object.values(room.members||{});
    return { yes: ms.filter(m=>m.votes?.[actId]==="in").length, no: ms.filter(m=>m.votes?.[actId]==="skip").length };
  }

  return (
    <div style={s.screen}>
      <div style={{padding:"16px 16px 0", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <div style={{fontSize:26, fontWeight:800, color:C.text, letterSpacing:"-.03em"}}>Hey {myName} 👋</div>
          <div style={{fontSize:13, color:C.textMuted, marginTop:2}}>Vernon Hills, IL</div>
        </div>
        <Av name={myName} size={40}/>
      </div>

      {/* Weather */}
      <div style={{margin:"12px 16px 0", background:C.bg3, borderRadius:12, padding:"10px 14px", border:`0.5px solid ${C.border}`, display:"flex", alignItems:"center", gap:8}}>
        <i className="ti ti-cloud-rain" style={{fontSize:16, color:"#5B9BD4"}}/>
        <span style={{fontSize:13, color:C.textMuted}}>58°F · Rainy today — perfect for <span style={{color:C.text, fontWeight:600}}>wild outdoor ideas</span></span>
      </div>

      {/* Crew online */}
      {members.length>0&&(
        <div style={{margin:"10px 16px 0", background:C.bg2, borderRadius:12, padding:"12px 14px", border:`0.5px solid ${C.border}`}}>
          <div style={{fontSize:10, fontWeight:700, color:C.textDim, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8}}>Crew online</div>
          <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
            {members.map(m=>(
              <div key={m.name} style={{display:"flex", alignItems:"center", gap:6, background:C.bg3, borderRadius:20, padding:"4px 10px 4px 4px"}}>
                <Av name={m.name} size={22}/>
                <span style={{fontSize:12, fontWeight:500, color:m.name===myName?C.purple:C.textMuted}}>{m.name}{m.name===myName?" (you)":""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{padding:"12px 16px 0"}}>
        <GlowBtn onClick={discover} disabled={loading}>
          {loading?<><i className="ti ti-loader" style={{fontSize:17,animation:"spin 1s linear infinite"}}/> Searching...</>:<><i className="ti ti-sparkles" style={{fontSize:17}}/> AI discover hidden gems</>}
        </GlowBtn>
      </div>

      {notice&&<div style={{margin:"8px 16px 0",fontSize:13,color:C.teal,background:C.tealGlow,borderRadius:8,padding:"7px 12px",border:`0.5px solid ${C.teal}40`}}>{notice}</div>}

      <div style={s.section}>Top picks today</div>
      {filtered.map(a=>{
        const votes = getVoteCounts(a.id);
        const myVote = (room.members||{})[myName]?.votes?.[a.id];
        return (
          <div key={a.id} style={{...s.card, opacity:myVote==="skip"?.4:1, transition:"opacity .2s"}}>
            <div style={{padding:"14px 14px 10px"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:6}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:19, fontWeight:800, color:C.text, letterSpacing:"-.02em", lineHeight:1.1}}>{a.title}</div>
                  <div style={{fontSize:13, color:C.textMuted, marginTop:3}}>{a.subtitle}</div>
                </div>
                <div style={{fontSize:26, lineHeight:1}}>{a.emoji}</div>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:8}}>
                <span style={{fontSize:11, color:C.textMuted}}><i className="ti ti-map-pin" style={{fontSize:11,verticalAlign:-1}}/> {a.distance}</span>
                {a.tags.map(t=><Tag key={t.l} l={t.l} c={t.c}/>)}
                {a.riskLevel&&(
                  <span style={{fontSize:11,fontWeight:600,background:`${riskColor(a.riskLevel)}18`,color:riskColor(a.riskLevel),border:`0.5px solid ${riskColor(a.riskLevel)}40`,borderRadius:20,padding:"3px 9px"}}>
                    <i className="ti ti-flame" style={{fontSize:11,verticalAlign:-1}}/> {a.riskLevel}/10
                  </span>
                )}
              </div>
              <div style={{background:C.bg3,borderRadius:10,padding:"8px 10px",fontSize:12,color:C.textMuted,display:"flex",gap:8,alignItems:"flex-start"}}>
                <i className={a.srcIcon} style={{fontSize:13,marginTop:1,flexShrink:0}}/>
                <span style={{lineHeight:1.5}}>{a.srcQuote}</span>
              </div>
            </div>
            {/* Crew vote counts */}
            {(votes.yes>0||votes.no>0)&&(
              <div style={{padding:"6px 14px", display:"flex", gap:12, borderTop:`0.5px solid ${C.border}`}}>
                <span style={{fontSize:12,color:C.teal,fontWeight:600}}>{votes.yes} in</span>
                <span style={{fontSize:12,color:C.textDim}}>{votes.no} skip</span>
              </div>
            )}
            <div style={{display:"flex",borderTop:`0.5px solid ${C.border}`}}>
              {[
                {label:"I'm in",vote:"in",icon:"ti-check",activeColor:C.teal,activeGlow:C.tealGlow},
                {label:"Skip",vote:"skip",icon:"ti-x",activeColor:C.red,activeGlow:C.redGlow},
                {label:"Ask AI",vote:null,icon:"ti-sparkles",activeColor:C.purple,activeGlow:C.purpleGlow},
              ].map((b,i)=>(
                <button key={b.label}
                  onClick={()=>b.vote?voteAct(a.id,b.vote):onAskAI(a)}
                  style={{flex:1,padding:"11px 8px",border:"none",background:myVote===b.vote&&b.vote?b.activeGlow:"none",
                    borderRight:i<2?`0.5px solid ${C.border}`:"none",
                    cursor:"pointer",fontSize:13,fontWeight:600,
                    color:myVote===b.vote&&b.vote?b.activeColor:i===2?C.purple:C.textMuted,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  <i className={`ti ${b.icon}`} style={{fontSize:15}}/>{b.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
//  CREW SCREEN
// ─────────────────────────────────────────────
function CrewScreen({ myName }) {
  const [chatTarget, setChatTarget] = useState(null);
  const [msg, setMsg] = useState("");
  const [room, updateRoom] = useRoom();
  const members = Object.values(room.members||{});
  const endRef = useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[chatTarget,room.messages]);

  function sendMsg() {
    if(!msg.trim()) return;
    const key = chatTarget==="group"?"group":chatTarget;
    const msgs = room.messages||{};
    const thread = [...(msgs[key]||[]), {from:myName,text:msg.trim(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}];
    updateRoom({messages:{...msgs,[key]:thread}});
    setMsg("");
  }

  if(chatTarget) {
    const key = chatTarget==="group"?"group":chatTarget;
    const thread = (room.messages||{})[key]||[];
    const isGroup = chatTarget==="group";
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg}}>
        <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
          <button style={{...s.btn,padding:"6px 10px",border:"none"}} onClick={()=>setChatTarget(null)}>
            <i className="ti ti-arrow-left" style={{fontSize:18,color:C.text}}/>
          </button>
          {isGroup
            ? <div style={{display:"flex"}}>{members.slice(0,3).map((m,i)=><div key={m.name} style={{marginLeft:i?-8:0}}><Av name={m.name} size={28}/></div>)}</div>
            : <Av name={chatTarget} size={34}/>}
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>{isGroup?"The crew":chatTarget}</div>
            {isGroup&&<div style={{fontSize:11,color:C.textMuted}}>{members.length} people</div>}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
          {thread.length===0&&(
            <div style={{textAlign:"center",color:C.textDim,fontSize:13,marginTop:40}}>No messages yet. Say something!</div>
          )}
          {thread.map((m,i)=>{
            const mine = m.from===myName;
            return (
              <div key={i} style={{marginBottom:10}}>
                {!mine&&<div style={{fontSize:11,color:C.textMuted,marginBottom:3,marginLeft:2}}>{m.from}</div>}
                <div style={{background:mine?C.purple:C.bg3,color:C.white,borderRadius:mine?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"9px 13px",fontSize:14,maxWidth:"76%",marginLeft:mine?"auto":0,lineHeight:1.4}}>{m.text}</div>
                <div style={{fontSize:10,color:C.textDim,textAlign:mine?"right":"left",marginTop:3}}>{m.time}</div>
              </div>
            );
          })}
          <div ref={endRef}/>
        </div>
        <div style={{padding:"10px 16px 20px",borderTop:`0.5px solid ${C.border}`,display:"flex",gap:8}}>
          <input style={s.input} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Message..." onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
          <button style={{...s.btn,padding:"10px 14px",background:C.purple,border:"none",borderRadius:12,color:"#fff"}} onClick={sendMsg}>
            <i className="ti ti-send" style={{fontSize:15}}/>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.screen}>
      <div style={{padding:"16px 16px 0",fontSize:26,fontWeight:800,color:C.text,letterSpacing:"-.03em"}}>Crew</div>

      <div style={s.section}>Group chat</div>
      <div style={{...s.card,cursor:"pointer"}} onClick={()=>setChatTarget("group")}>
        <div style={{padding:"13px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex"}}>{members.slice(0,4).map((m,i)=><div key={m.name} style={{marginLeft:i?-8:0,zIndex:4-i,position:"relative"}}><Av name={m.name} size={32}/></div>)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>The crew</div>
            <div style={{fontSize:12,color:C.textMuted}}>{members.length} people joined</div>
          </div>
          <i className="ti ti-chevron-right" style={{fontSize:16,color:C.textDim}}/>
        </div>
      </div>

      <div style={s.section}>Members ({members.length})</div>
      {members.length===0&&(
        <div style={{padding:"24px 16px",textAlign:"center",color:C.textMuted,fontSize:13}}>Nobody's joined yet. Send them the link!</div>
      )}
      {members.map(m=>(
        <div key={m.name} style={{...s.card,cursor:"pointer",opacity:m.name===myName?.7:1}} onClick={()=>m.name!==myName&&setChatTarget(m.name)}>
          <div style={{padding:"13px 14px",display:"flex",alignItems:"center",gap:10}}>
            <Av name={m.name} size={38}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>{m.name}{m.name===myName?" (you)":""}</div>
              <div style={{fontSize:12,color:C.textMuted}}>Joined the crew</div>
            </div>
            {m.name!==myName&&<div style={{fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:20,background:C.tealGlow,color:C.teal,border:`0.5px solid ${C.teal}40`}}>free</div>}
          </div>
        </div>
      ))}

      <div style={{padding:"8px 16px 0"}}>
        <div style={{background:C.bg3,borderRadius:12,padding:"12px 14px",border:`0.5px solid ${C.border}`,marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:6}}>Invite more people</div>
          <div style={{fontSize:13,color:C.textDim,fontFamily:"monospace",wordBreak:"break-all",marginBottom:10}}>{window.location.href}</div>
          <button style={s.bigBtn} onClick={()=>{navigator.clipboard?.writeText(window.location.href);alert("Link copied! Paste it in your group chat.")}}>
            <i className="ti ti-copy" style={{fontSize:15}}/> Copy invite link
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  INVITE SCREEN
// ─────────────────────────────────────────────
function InviteScreen({ myName }) {
  const [copied, setCopied] = useState(false);
  const [room] = useRoom();
  const members = Object.values(room.members||{});
  const link = window.location.href;

  function copy(){ navigator.clipboard?.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2500); }
  function shareVia(p){
    const msg=`yo join OutHere with me — app finds actually fun hidden stuff to do with your crew. risk levels, AI recommendations, schedule sync. join here: ${link}`;
    const urls={messages:`sms:?body=${encodeURIComponent(msg)}`,snapchat:`https://www.snapchat.com/share?url=${encodeURIComponent(link)}`,instagram:`https://www.instagram.com/`};
    window.open(urls[p]||"#","_blank");
  }

  const REWARDS=[{count:1,label:"Early explorer badge",icon:"ti-medal"},{count:3,label:"Unlock legendary risk tier",icon:"ti-flame"},{count:5,label:"OutHere Pro — free forever",icon:"ti-star"},{count:10,label:"Your name in the credits",icon:"ti-crown"}];
  const sent = Math.max(0, members.length-1);
  const next = REWARDS.find(r=>r.count>sent);

  return (
    <div style={s.screen}>
      <div style={{padding:"16px 16px 0",fontSize:26,fontWeight:800,color:C.text,letterSpacing:"-.03em"}}>Invite</div>
      <div style={{padding:"4px 16px 0",fontSize:13,color:C.textMuted,lineHeight:1.6}}>OutHere is free forever. Invite your friends to unlock rewards and build your crew.</div>

      <div style={{margin:"14px 16px 0",background:C.purpleGlow,borderRadius:14,padding:"16px",border:`0.5px solid ${C.purple}40`}}>
        <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Your invite link</div>
        <div style={{fontSize:12,color:C.textMuted,background:C.bg3,borderRadius:8,padding:"9px 12px",marginBottom:10,fontFamily:"monospace",wordBreak:"break-all"}}>{link}</div>
        <GlowBtn onClick={copy} style={{background:copied?C.teal:C.purple}}>
          <i className={copied?"ti ti-check":"ti ti-copy"} style={{fontSize:15}}/>{copied?"Copied!":"Copy link"}
        </GlowBtn>
      </div>

      <div style={s.section}>Share via</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"0 16px"}}>
        {[{id:"messages",label:"iMessage",icon:"ti ti-message",c:C.teal,g:C.tealGlow},{id:"snapchat",label:"Snapchat",icon:"ti ti-ghost-2",c:C.amber,g:C.amberGlow},{id:"instagram",label:"Instagram",icon:"ti ti-brand-instagram",c:C.pink,g:C.pinkGlow}].map(p=>(
          <button key={p.id} onClick={()=>shareVia(p.id)} style={{background:p.g,border:`0.5px solid ${p.c}40`,borderRadius:14,padding:"18px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
            <i className={p.icon} style={{fontSize:26,color:p.c}}/>
            <span style={{fontSize:12,fontWeight:700,color:p.c}}>{p.label}</span>
          </button>
        ))}
      </div>

      <div style={s.section}>Who's joined ({members.length})</div>
      <div style={{...s.card,padding:"12px 14px"}}>
        {members.length===0
          ? <div style={{fontSize:13,color:C.textMuted}}>Nobody yet — send the link!</div>
          : <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              {members.map(m=>(
                <div key={m.name} style={{display:"flex",alignItems:"center",gap:7}}>
                  <Av name={m.name} size={28}/>
                  <span style={{fontSize:13,fontWeight:500,color:m.name===myName?C.purple:C.textMuted}}>{m.name}{m.name===myName?" ✓":""}</span>
                </div>
              ))}
            </div>}
      </div>

      <div style={s.section}>Rewards</div>
      {REWARDS.map(r=>(
        <div key={r.count} style={{...s.card,opacity:sent>=r.count?1:0.45}}>
          <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:sent>=r.count?C.purpleGlow:C.bg3,display:"flex",alignItems:"center",justifyContent:"center",border:`0.5px solid ${sent>=r.count?C.purple+"40":C.border}`}}>
              <i className={`ti ti-${r.icon}`} style={{fontSize:18,color:sent>=r.count?C.purple:C.textDim}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{r.label}</div>
              <div style={{fontSize:11,color:C.textMuted}}>{r.count} friend{r.count>1?"s":""} joined</div>
            </div>
            {sent>=r.count&&<i className="ti ti-circle-check" style={{fontSize:20,color:C.teal}}/>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  SETTINGS SCREEN
// ─────────────────────────────────────────────
function SettingsScreen({ myName, settings, setSettings }) {
  const interests = ["outdoor exploring","biking","urban exploring","gaming","cooking","night activities","nature","cliff jumping","skateboarding","photography"];
  function toggle(i){setSettings(s=>({...s,interests:s.interests?.includes(i)?s.interests.filter(x=>x!==i):[...(s.interests||[]),i]}));}
  return (
    <div style={s.screen}>
      <div style={{padding:"16px 16px 0",fontSize:26,fontWeight:800,color:C.text,letterSpacing:"-.03em"}}>Your vibe</div>

      <div style={s.section}>Age</div>
      <div style={{display:"flex",gap:6,padding:"0 16px",flexWrap:"wrap"}}>
        {["under 12","13–15","16–18","18+"].map(a=>(
          <button key={a} onClick={()=>setSettings(s=>({...s,age:a}))} style={{padding:"8px 16px",borderRadius:20,border:`0.5px solid ${settings.age===a?C.purple+"60":C.border}`,fontSize:13,fontWeight:settings.age===a?700:400,cursor:"pointer",background:settings.age===a?C.purpleGlow:"none",color:settings.age===a?C.purple:C.textMuted}}>{a}</button>
        ))}
      </div>

      <div style={s.section}>Interests</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"0 16px"}}>
        {interests.map(i=>{const sel=settings.interests?.includes(i);return(
          <button key={i} onClick={()=>toggle(i)} style={{padding:"7px 13px",borderRadius:20,border:`0.5px solid ${sel?C.teal+"60":C.border}`,fontSize:12,fontWeight:sel?700:400,cursor:"pointer",background:sel?C.tealGlow:"none",color:sel?C.teal:C.textMuted}}>{i}</button>
        );})}
      </div>

      <div style={{padding:"16px 16px 0"}}>
        {[
          {k:"risk",label:"Risk level",min:1,max:10,fmt:v=>`${v}/10 — ${riskLabel(v)}`,color:v=>riskColor(v)},
          {k:"adventure",label:"Adventure",min:1,max:10,fmt:v=>`${v}/10`},
          {k:"distance",label:"Max distance",min:1,max:50,fmt:v=>`${v} mi`},
          {k:"budget",label:"Budget",min:0,max:200,step:5,fmt:v=>`$${v}`},
        ].map(sl=>(
          <div key={sl.k} style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <span style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:".08em"}}>{sl.label}</span>
              <span style={{fontSize:15,fontWeight:800,color:sl.color?sl.color(settings[sl.k]):C.text}}>{sl.fmt(settings[sl.k])}</span>
            </div>
            <input type="range" min={sl.min} max={sl.max} step={sl.step||1} value={settings[sl.k]||sl.min} style={{width:"100%",accentColor:C.purple}} onChange={e=>setSettings(s=>({...s,[sl.k]:parseInt(e.target.value)}))}/>
          </div>
        ))}
      </div>

      <div style={s.section}>Setting type</div>
      <div style={{display:"flex",gap:8,padding:"0 16px 20px"}}>
        {[["outdoor","ti-trees"],["indoor","ti-building"],["both","ti-adjustments"]].map(([t,ic])=>(
          <button key={t} onClick={()=>setSettings(s=>({...s,outdoor:t}))} style={{flex:1,padding:"13px 8px",border:`0.5px solid ${settings.outdoor===t?C.purple+"60":C.border}`,borderRadius:12,fontSize:12,fontWeight:settings.outdoor===t?700:400,cursor:"pointer",background:settings.outdoor===t?C.purpleGlow:"none",color:settings.outdoor===t?C.purple:C.textMuted,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <i className={`ti ${ic}`} style={{fontSize:22}}/>{t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  ASK AI MODAL
// ─────────────────────────────────────────────
function AskAIModal({ act, onClose }) {
  const [q, setQ] = useState(""); const [ans, setAns] = useState(null); const [loading, setLoading] = useState(false);
  async function ask(question) {
    setLoading(true); setAns(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,system:"You are OutHere's activity guide for teens. Be real, honest, fun. Max 3 sentences.",messages:[{role:"user",content:`Activity: "${act.title}" near Vernon Hills IL, risk ${act.riskLevel}/10. Question: ${question}`}]})});
      const data = await res.json();
      setAns(data.content?.[0]?.text||"Couldn't get an answer right now.");
    } catch(e){setAns("Couldn't connect right now.");}
    setLoading(false);
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",zIndex:100}}>
      <div style={{background:C.bg2,borderRadius:"20px 20px 0 0",padding:"20px 16px 36px",width:"100%",maxWidth:430,margin:"0 auto",border:`0.5px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:17,fontWeight:800,color:C.text}}>Ask about this</div>
          <button style={{...s.btn,padding:6,border:"none"}} onClick={onClose}><i className="ti ti-x" style={{fontSize:18,color:C.textMuted}}/></button>
        </div>
        <div style={{fontSize:14,fontWeight:700,color:C.purple,background:C.purpleGlow,borderRadius:8,padding:"7px 12px",marginBottom:12,border:`0.5px solid ${C.purple}40`}}>{act.title}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
          {["Is this safe?","What to bring?","Best time to go?","Any dangers?","How risky really?"].map(p=>(
            <button key={p} onClick={()=>{setQ(p);ask(p);}} style={{padding:"6px 12px",borderRadius:20,fontSize:12,fontWeight:600,border:`0.5px solid ${C.purple}40`,background:C.purpleGlow,color:C.purple,cursor:"pointer"}}>{p}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input style={s.input} placeholder="Ask anything..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(q)}/>
          <button style={{...s.btn,padding:"10px 14px",background:C.purple,border:"none",borderRadius:12,color:"#fff"}} onClick={()=>ask(q)}><i className="ti ti-send" style={{fontSize:14}}/></button>
        </div>
        {loading&&<div style={{fontSize:13,color:C.textMuted}}>thinking...</div>}
        {ans&&<div style={{fontSize:14,color:C.text,lineHeight:1.65,background:C.bg3,borderRadius:10,padding:"12px 14px"}}>{ans}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  BOTTOM NAV
// ─────────────────────────────────────────────
const TABS=[{id:"explore",label:"Explore",icon:"ti-compass"},{id:"crew",label:"Crew",icon:"ti-users"},{id:"invite",label:"Invite",icon:"ti-user-plus"},{id:"vibe",label:"Vibe",icon:"ti-sliders"}];

function BottomNav({ tab, setTab }) {
  return (
    <div style={{position:"sticky",bottom:0,background:C.bg,borderTop:`0.5px solid ${C.border}`,display:"flex",padding:"6px 8px 10px",gap:4,zIndex:10}}>
      {TABS.map(t=>{
        const active = tab===t.id;
        return (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"6px 4px 2px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{width:44,height:36,borderRadius:10,background:active?C.purpleGlow:"none",border:`0.5px solid ${active?C.purple+"60":"transparent"}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
              <i className={`ti ${t.icon}`} style={{fontSize:22,color:active?C.purple:C.textDim}}/>
            </div>
            <span style={{fontSize:10,fontWeight:active?800:500,color:active?C.purple:C.textDim,letterSpacing:".02em"}}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [myName, setMyName] = useState(()=>{ try{const r=JSON.parse(localStorage.getItem("outher_me")||"{}"); return r.name||null;}catch{return null;} });
  const [tab, setTab] = useState("explore");
  const [askAIAct, setAskAIAct] = useState(null);
  const [settings, setSettings] = useState({age:"16–18",interests:["outdoor exploring","biking","urban exploring","night activities"],risk:7,adventure:8,distance:5,budget:0,outdoor:"outdoor"});

  function handleJoin(name) {
    localStorage.setItem("outher_me", JSON.stringify({name}));
    setMyName(name);
  }

  if(!myName) return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}body{margin:0;background:#09090F}`}</style>
      <SignInScreen onJoin={handleJoin}/>
    </>
  );

  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:C.bg,color:C.text,minHeight:"100vh",maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}body{margin:0;background:#09090F}input[type=range]{accent-color:${C.purple}}::-webkit-scrollbar{width:0}`}</style>
      <div style={{flex:1,overflowY:"auto"}}>
        {tab==="explore"&&<ExploreScreen myName={myName} settings={settings} onAskAI={setAskAIAct}/>}
        {tab==="crew"&&<CrewScreen myName={myName}/>}
        {tab==="invite"&&<InviteScreen myName={myName}/>}
        {tab==="vibe"&&<SettingsScreen myName={myName} settings={settings} setSettings={setSettings}/>}
      </div>
      <BottomNav tab={tab} setTab={setTab}/>
      {askAIAct&&<AskAIModal act={askAIAct} onClose={()=>setAskAIAct(null)}/>}
    </div>
  );
}
