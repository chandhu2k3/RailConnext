import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams} from "react-router-dom";
import "./styles.css";

const primaryJourneys = [
  {id:"hyd-blr-kochi", origin:"Hyderabad", destination:"Kochi", risk:"LOW", buffer:95, duration:"14h 10m", wait:"1h 35m", cost:1460, reliability:92, connections:1,
   legs:[{train:"12785",name:"Kacheguda – Bengaluru Exp",from:"Hyderabad",to:"Bengaluru",dep:"08:20",arr:"14:10",platform:"5",reliability:94},{train:"12677",name:"KSR Bengaluru – Ernakulam Exp",from:"Bengaluru",to:"Kochi",dep:"15:45",arr:"22:30",platform:"2",reliability:91}],
   reason:"1h 35m buffer with strong arrival reliability. Comfortable margin for a normal platform transfer.", threshold:42},
  {id:"hyd-vij-kochi", origin:"Hyderabad", destination:"Kochi", risk:"MODERATE", buffer:55, duration:"15h 05m", wait:"55m", cost:1210, reliability:82, connections:1,
   legs:[{train:"17016",name:"Visakha Exp",from:"Hyderabad",to:"Vijayawada",dep:"07:10",arr:"12:05",platform:"3",reliability:84},{train:"17209",name:"Seshadri Coastal Exp",from:"Vijayawada",to:"Kochi",dep:"13:00",arr:"22:15",platform:"6",reliability:80}],
   reason:"55m buffer and moderate delay history. The connection is workable, but a meaningful delay could remove the margin.", threshold:28},
  {id:"hyd-chn-kochi", origin:"Hyderabad", destination:"Kochi", risk:"HIGH", buffer:28, duration:"16h 40m", wait:"28m", cost:1090, reliability:71, connections:1,
   legs:[{train:"12760",name:"Charminar Exp",from:"Hyderabad",to:"Chennai",dep:"06:00",arr:"13:50",platform:"8",reliability:72},{train:"12623",name:"Trivandrum Mail",from:"Chennai",to:"Kochi",dep:"14:18",arr:"22:40",platform:"4",reliability:70}],
   reason:"Only 28m are available and Train 1 has a higher delay pattern. This is a prototype estimate, not a live prediction.", threshold:12},
  {id:"hyd-pune-kochi", origin:"Hyderabad", destination:"Kochi", risk:"MODERATE", buffer:70, duration:"17h 05m", wait:"1h 10m", cost:1680, reliability:84, connections:1,
   legs:[{train:"17014",name:"Hyderabad – Pune Exp",from:"Hyderabad",to:"Pune",dep:"05:50",arr:"15:20",platform:"1",reliability:86},{train:"22150",name:"Pune – Ernakulam Exp",from:"Pune",to:"Kochi",dep:"16:30",arr:"22:55",platform:"7",reliability:82}],
   reason:"1h 10m buffer gives some recovery room, but the first leg has a longer route and moderate mock reliability.", threshold:30},
  {id:"hyd-blr-kochi-late", origin:"Hyderabad", destination:"Kochi", risk:"LOW", buffer:125, duration:"15h 25m", wait:"2h 05m", cost:1390, reliability:95, connections:1,
   legs:[{train:"12785",name:"Kacheguda – Bengaluru Exp",from:"Hyderabad",to:"Bengaluru",dep:"10:00",arr:"15:10",platform:"5",reliability:94},{train:"16527",name:"Yasvantpur – Kannur Exp",from:"Bengaluru",to:"Kochi",dep:"17:15",arr:"23:25",platform:"2",reliability:96}],
   reason:"A larger buffer reduces connection pressure. Trade-off: longer waiting time at Bengaluru.", threshold:72}
];

// Intentionally limited demo coverage: four origins and four destinations.
// Every route below is mock data so the prototype feels functional without pretending to be live railway data.
const demoRouteConfigs = [
  ["Hyderabad","Bengaluru","Vijayawada","06:40","12:10","13:05","19:20","LOW",75,"11h 40m",55,1280,90,"12706","Deccan Link Exp","12675","Coastal Link Exp",45],
  ["Hyderabad","Pune","Solapur","05:30","12:35","13:30","20:15","MODERATE",55,"14h 45m",55,1340,84,"17018","Hyderabad – Solapur Exp","12115","Siddheshwar Exp",25],
  ["Hyderabad","Visakhapatnam","Vijayawada","07:00","12:20","13:10","20:05","LOW",50,"13h 05m",50,1180,89,"12718","Godavari Link Exp","12842","East Coast Exp",35],
  ["Mumbai","Kochi","Pune","06:15","09:40","10:30","23:05","MODERATE",50,"16h 50m",50,1720,83,"22102","Mumbai – Pune Exp","11097","Coastal Express",25],
  ["Mumbai","Bengaluru","Pune","05:45","09:20","10:10","23:15","LOW",50,"17h 30m",50,1640,91,"12125","Deccan Queen Link","16576","Bengaluru Express",40],
  ["Mumbai","Pune","Lonavala","08:00","10:10","10:50","13:15","LOW",40,"5h 15m",40,720,94,"11010","Mumbai – Pune Exp","12125","Pune Intercity",30],
  ["Mumbai","Visakhapatnam","Nagpur","06:20","17:10","18:00","10:25","MODERATE",50,"28h 05m",50,2260,81,"12105","Vidarbha Link Exp","12808","Visakha Express",30],
  ["Delhi","Kochi","Bhopal","05:20","13:45","14:35","22:10","MODERATE",50,"40h 50m",50,2450,82,"12616","Grand Central Exp","12626","Southern Link Exp",30],
  ["Delhi","Bengaluru","Bhopal","06:10","15:05","16:00","21:30","LOW",55,"39h 20m",55,2320,90,"12628","Central Link Exp","12650","Karnataka Link Exp",40],
  ["Delhi","Pune","Bhopal","07:00","14:30","15:20","21:10","MODERATE",50,"14h 10m",50,1980,85,"12156","Bhopal Link Exp","12124","Deccan Link Exp",30],
  ["Delhi","Visakhapatnam","Nagpur","06:30","17:20","18:15","07:05","HIGH",55,"24h 35m",55,2140,76,"12410","Central Corridor Exp","12804","East Coast Exp",20],
  ["Chennai","Kochi","Coimbatore","06:30","13:00","13:50","20:45","LOW",50,"14h 15m",50,1180,93,"12675","Chennai – Coimbatore Exp","12679","Coastal Link Exp",40],
  ["Chennai","Bengaluru","Katpadi","07:15","11:20","12:05","18:45","LOW",45,"11h 30m",45,980,94,"16021","Kaveri Link Exp","16527","Bengaluru Express",35],
  ["Chennai","Pune","Bengaluru","05:50","13:10","14:05","23:30","MODERATE",55,"17h 40m",55,1540,84,"12639","Chennai – Bengaluru Exp","11014","Deccan Link Exp",28],
  ["Chennai","Visakhapatnam","Vijayawada","06:10","12:30","13:20","20:25","LOW",50,"14h 15m",50,1260,91,"12842","Coromandel Link Exp","12718","Godavari Exp",40]
];

function makeDemoJourney(r,i){
 const [origin,destination,hub,dep1,arr1,dep2,arr2,risk,buffer,duration,wait,cost,reliability,train1,name1,train2,name2,threshold]=r;
 return {id:`demo-${origin.slice(0,3).toLowerCase()}-${destination.slice(0,3).toLowerCase()}-${i}`,origin,destination,risk,buffer,duration,wait:`${wait}m`,cost,reliability,connections:1,
  legs:[{train:train1,name:name1,from:origin,to:hub,dep:dep1,arr:arr1,platform:String((i%7)+1),reliability:Math.max(70,reliability+2)},{train:train2,name:name2,from:hub,to:destination,dep:dep2,arr:arr2,platform:String((i%6)+2),reliability:reliability}],
  reason:risk==="LOW"?`${buffer}m buffer with strong mock reliability. Comfortable margin for this prototype connection.`:risk==="MODERATE"?`${buffer}m buffer leaves some recovery room, but a meaningful delay could reduce the margin.`:`Only ${buffer}m are available, so a delay on Train 1 could make this connection difficult. Prototype estimate only.`,threshold};
}

const extraJourneys = demoRouteConfigs.map(makeDemoJourney);
const journeys = [...primaryJourneys, ...extraJourneys];
const originStations = ["Hyderabad","Mumbai","Delhi","Chennai"];
const destinationStations = ["Kochi","Bengaluru","Pune","Visakhapatnam"];
const stations = [...originStations,...destinationStations];

const backups = [
  {train:"16528", name:"Bengaluru – Kannur Exp", dep:"17:10", arr:"23:50", cost:220, extra:"1h 20m", risk:"LOW", status:"Seats likely"},
  {train:"12677", name:"KSR Bengaluru – Ernakulam Exp", dep:"18:30", arr:"01:15", cost:180, extra:"2h 45m", risk:"MODERATE", status:"Limited"},
  {train:"Bus", name:"Bengaluru → Kochi overnight coach", dep:"20:00", arr:"06:30", cost:650, extra:"8h 00m", risk:"MODERATE", status:"Demo availability"}
];

const recovery = [
  {title:"Next available train", detail:"Bengaluru → Kochi · 17:10–23:50", price:"₹220 extra", tag:"TRAIN"},
  {title:"Alternative rail route", detail:"Bengaluru → Coimbatore → Kochi", price:"₹310 extra", tag:"RAIL"},
  {title:"Overnight bus", detail:"Bengaluru → Kochi · 20:00–06:30", price:"₹650", tag:"BUS"},
  {title:"Onward travel assistance", detail:"Get help evaluating and securing the next leg.", price:"From ₹49", tag:"ASSIST"}
];


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://waasemfgmevcuvadhhaa.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable__ZmcTDIow2_W0YzpbPMdpw_9t19uDD5";
const supabaseHeaders = {apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, "Content-Type":"application/json", Prefer:"return=minimal"};

function getSessionId(){
  let id=sessionStorage.getItem("rc_session");
  if(!id){ id="sess_"+crypto.randomUUID().replace(/-/g,"").slice(0,16); sessionStorage.setItem("rc_session",id); }
  return id;
}
function trackEvent(name,props={}){
  fetch(`${SUPABASE_URL}/rest/v1/analytics_events`,{
    method:"POST",headers:supabaseHeaders,
    body:JSON.stringify({event_name:name,props,session_id:getSessionId(),page:window.location.pathname,utm_source:new URLSearchParams(window.location.search).get("utm_source")||"direct",occurred_at:new Date().toISOString()}),
    keepalive:true
  }).catch(()=>{});
}
function trackCtaExposure(cta){
  const key=`rc_cta_exposed_${cta}_${window.location.pathname}`;
  if(sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key,"1");
  trackEvent("cta_exposed",{cta});
}

function sessionStart(){
  if(!sessionStorage.getItem("rc_session_started")){
    getSessionId(); sessionStorage.setItem("rc_session_started","1"); trackEvent("session_started");
  }
}
sessionStart();

async function verifyAdminPassword(password){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_railconnect_admin`,{method:"POST",headers:supabaseHeaders,body:JSON.stringify({p_password:password})});
  if(!r.ok) throw new Error("Unable to verify admin access.");
  return r.json();
}
async function fetchAnalytics(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_railconnect_analytics`,{method:"POST",headers:supabaseHeaders,body:"{}"});
  if(!r.ok) throw new Error("Unable to load analytics.");
  return r.json();
}
async function fetchCtaMetrics(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_railconnect_cta_metrics`,{method:"POST",headers:supabaseHeaders,body:"{}"});
  if(!r.ok) return {};
  return r.json();
}

function Header(){
 const nav=useNavigate(), loc=useLocation();
 return <header className="header"><div className="navwrap">
   <Link className="brand" to="/"><span className="brandmark">RC</span><span>RailConnect</span></Link>
   <nav>
    <Link className={loc.pathname==="/"?"active":""} to="/">Home</Link>
    <Link className={loc.pathname==="/search"?"active":""} to="/search">Plan</Link>
    <Link className={loc.pathname==="/my-journey"?"active":""} to="/my-journey">My Journey</Link>
    <Link className={loc.pathname==="/analytics"?"active":""} to="/analytics">Analytics</Link>
   </nav>
   <button className="demo-pill" onClick={()=>{trackEvent("cta_clicked",{cta:"demo_mode"});nav("/search?demo=1")}}>Demo Mode</button>
 </div></header>
}

function Shell({children}){
 useEffect(()=>{trackEvent("page_view",{path:location.pathname})},[]);
 return <><Header/><main>{children}</main><footer><span>RailConnect · Prototype / Mock railway data</span><span>Connection-first travel planning</span></footer></>
}

function RiskBadge({risk}){return <span className={"risk "+risk.toLowerCase()}>{risk} RISK</span>}

function Landing(){
 const nav=useNavigate();
 useEffect(()=>{trackCtaExposure("plan_my_journey")},[]);
 return <div className="landing">
  <section className="hero container">
   <div className="hero-copy">
    <div className="eyebrow">CONNECTION-FIRST TRAVEL PLANNING</div>
    <h1>Plan your connecting train journey <em>with confidence.</em></h1>
    <p className="hero-sub">Compare reliable train combinations, understand connection risk, and find alternatives before a delay ruins your journey.</p>
    <div className="hero-actions">
      <button className="btn primary" onClick={()=>{trackEvent("cta_clicked",{cta:"plan_my_journey"});nav("/search")}}>Plan My Journey <span>→</span></button>
      <button className="btn ghost" onClick={()=>document.getElementById("how").scrollIntoView({behavior:"smooth"})}>See How It Works</button>
    </div>
    <div className="trustline"><span>●</span> Built around the connection between trains, not just the trains.</div>
   </div>
   <div className="journey-visual">
    <div className="route-label">SAMPLE JOURNEY · DEMO DATA</div>
    <div className="route-line"><div className="node"><b>HYD</b><small>08:20</small></div><div className="rail"><i></i><span>Train 1</span></div><div className="node hub"><b>BLR</b><small>14:10</small></div><div className="rail"><i></i><span>Train 2</span></div><div className="node"><b>COK</b><small>22:30</small></div></div>
    <div className="buffer-card"><div><span className="mini-label">CONNECTION BUFFER</span><strong>1h 35m</strong></div><RiskBadge risk="LOW"/><p>Strong reliability + comfortable transfer margin</p></div>
   </div>
  </section>
  <section className="stats container"><div><strong>1 view</strong><span>for every train leg, connection and transfer</span></div><div><strong>Risk first</strong><span>see buffer and connection pressure before you choose</span></div><div><strong>Recover</strong><span>keep practical alternatives ready when plans change</span></div></section>
  <section id="how" className="section container">
   <div className="section-head"><div><div className="eyebrow">THE DIFFERENCE</div><h2>From searching trains to managing a connection.</h2></div><p>RailConnect makes the connection itself the main object: buffer, risk, alternatives and recovery in one flow.</p></div>
   <div className="steps">{["Search","Discover","Compare","Monitor","Recover"].map((x,i)=><div className="step" key={x}><span>0{i+1}</span><h3>{x}</h3><p>{["Enter your journey and flexibility.","See complete connecting combinations.","Compare trade-offs without a hidden winner.","Watch buffer change when delays happen.","Get options when the original plan fails."][i]}</p></div>)}</div>
  </section>
  <section className="cta-band"><div className="container ctaband-inner"><div><div className="eyebrow">TRY THE PROTOTYPE</div><h2>See a connection become risky in real time.</h2></div><button className="btn primary" onClick={()=>nav("/search?demo=1")}>Try Hyderabad → Kochi <span>→</span></button></div></section>
 </div>
}

function Search(){
 const nav=useNavigate(), params=new URLSearchParams(useLocation().search);
 useEffect(()=>{trackCtaExposure("search_connections")},[]);
 const [from,setFrom]=useState(params.get("demo")?"Hyderabad":params.get("from")||""), [to,setTo]=useState(params.get("demo")?"Kochi":params.get("to")||""), [date,setDate]=useState("2026-09-25"), [connections,setConnections]=useState("1"), [travellers,setTravellers]=useState("1");
 const submit=(e)=>{e.preventDefault(); if(!from||!to)return; trackEvent("cta_clicked",{cta:"search_connections"}); trackEvent("search_started",{origin:from,destination:to});trackEvent("search_completed",{origin:from,destination:to,date,number_of_connections:connections});nav(`/results?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)};
 return <div className="container page"><div className="page-intro"><div><div className="eyebrow">JOURNEY SEARCH</div><h1>Build the connection.</h1><p>Choose a route from our demo network and explore the connecting journey options.</p></div><span className="demo-note">Demo network · No live availability</span></div>
 <form className="search-panel" onSubmit={submit}>
  <label>From<div className="input-wrap"><span>⌖</span><select value={from} onChange={e=>{setFrom(e.target.value);trackEvent("origin_selected",{origin:e.target.value})}}><option value="">Choose origin</option>{originStations.map(s=><option key={s}>{s}</option>)}</select></div></label>
  <label>To<div className="input-wrap"><span>◎</span><select value={to} onChange={e=>{setTo(e.target.value);trackEvent("destination_selected",{destination:e.target.value})}}><option value="">Choose destination</option>{destinationStations.map(s=><option key={s}>{s}</option>)}</select></div></label>
  <label>Date<div className="input-wrap"><span>◷</span><input type="date" value={date} onChange={e=>{setDate(e.target.value);trackEvent("date_selected",{date:e.target.value})}}/></div></label>
  <label>Travellers<select value={travellers} onChange={e=>setTravellers(e.target.value)}><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
  <label>Connections<select value={connections} onChange={e=>setConnections(e.target.value)}><option value="1">1 connection</option><option value="2">Up to 2</option></select></label>
  <label>Flexibility<select><option>Flexible</option><option>Exact date</option><option>± 1 day</option></select></label>
  <button className="btn primary search-btn" disabled={!from||!to}>Find Connections <span>→</span></button>
 </form>
 <div className="popular"><div className="section-head compact"><div><div className="eyebrow">QUICK START</div><h2>Popular demo journeys</h2></div></div><div className="popular-grid">{[["Hyderabad","Kochi","5 options"],["Mumbai","Bengaluru","1 connection"],["Delhi","Pune","1 connection"],["Chennai","Visakhapatnam","1 connection"]].map(x=><button key={x.join()} onClick={()=>{setFrom(x[0]);setTo(x[1]);trackEvent("cta_clicked",{cta:"popular_journey",from:x[0],to:x[1]})}}><b>{x[0]} → {x[1]}</b><span>{x[2]}</span></button>)}</div></div>
 </div>
}

function Results(){
 const nav=useNavigate(), location=useLocation(), [sort,setSort]=useState("risk"), [selected,setSelected]=useState([]);
 const [filter,setFilter]=useState("ALL");
 const params=new URLSearchParams(location.search), from=params.get("from")||"Hyderabad", to=params.get("to")||"Kochi";
 const routeJourneys=journeys.filter(j=>j.origin===from&&j.destination===to);
 const list=useMemo(()=>{let x=[...routeJourneys]; if(filter!=="ALL")x=x.filter(j=>j.risk===filter); if(sort==="duration")x.sort((a,b)=>a.duration.localeCompare(b.duration)); if(sort==="cost")x.sort((a,b)=>a.cost-b.cost); if(sort==="buffer")x.sort((a,b)=>b.buffer-a.buffer); if(sort==="arrival")x.sort((a,b)=>a.legs.at(-1).arr.localeCompare(b.legs.at(-1).arr)); return x},[routeJourneys,sort,filter]);
 useEffect(()=>{trackEvent("results_viewed",{origin:from,destination:to,result_count:routeJourneys.length})},[from,to,routeJourneys.length]);
 useEffect(()=>{if(selected.length>0) trackCtaExposure("compare_journeys")},[selected.length]);
 const toggle=(id)=>{setSelected(s=>s.includes(id)?s.filter(x=>x!==id):s.length<3?[...s,id]:s);trackEvent("journey_compared",{journey_ids:[...selected,id].slice(0,3),number_of_options:Math.min(3,new Set([...selected,id]).size)})};
 return <div className="container page"><div className="page-intro"><div><div className="eyebrow">CONNECTION RESULTS</div><h1>{from} <span className="muted">→</span> {to}</h1><p>{routeJourneys.length} demo connection {routeJourneys.length===1?"option":"options"} · Prototype estimates · 25 Sep 2026</p></div><button className="btn ghost small" onClick={()=>nav("/search")}>Edit search</button></div>
 <div className="result-toolbar"><div className="filters"><button className={filter==="ALL"?"selected":""} onClick={()=>{setFilter("ALL");trackEvent("connection_filter_used",{filter:"ALL"})}}>All</button>{["LOW","MODERATE","HIGH"].map(f=><button className={filter===f?"selected":""} key={f} onClick={()=>{setFilter(f);trackEvent("connection_filter_used",{filter:f})}}>{f}</button>)}</div><label>Sort <select value={sort} onChange={e=>{setSort(e.target.value);trackEvent("connection_sorted",{sort:e.target.value})}}><option value="risk">Lowest risk</option><option value="duration">Shortest journey</option><option value="cost">Lowest cost</option><option value="buffer">Best connection</option><option value="arrival">Earliest arrival</option></select></label></div>
 <div className="prototype-disclaimer"><b>Connection Risk — Prototype Estimate</b><span>Uses mock buffer, reliability and transfer factors. It is not a live railway prediction.</span></div>
 {list.length===0?<div className="empty-state"><div className="eyebrow">LIMITED DEMO COVERAGE</div><h2>No connection options for this route yet.</h2><p>RailConnect currently covers a small set of demo routes. Try another combination from the Plan page.</p><button className="btn primary" onClick={()=>nav("/search")}>Choose another route →</button></div>:<div className="results-list">{list.map(j=><JourneyCard key={j.id} j={j} checked={selected.includes(j.id)} onCompare={()=>toggle(j.id)} onOpen={()=>{trackEvent("journey_opened",{journey_id:j.id,risk_level:j.risk,connection_buffer:j.buffer,total_duration:j.duration,estimated_cost:j.cost});nav("/journey/"+j.id)}}/>)}</div>}
 {selected.length>0 && <div className="compare-dock"><span>{selected.length}/3 selected for comparison</span><button className="btn primary" disabled={selected.length<2} onClick={()=>{trackEvent("cta_clicked",{cta:"compare_journeys",selected_count:selected.length});nav("/compare?ids="+selected.join(","))}}>Compare journeys →</button></div>}
 </div>
}

function JourneyCard({j,checked,onCompare,onOpen}){
 return <article className="journey-card"><div className="journey-top"><div><span className="option">OPTION</span><h2>{j.origin} → {j.destination}</h2></div><RiskBadge risk={j.risk}/></div>
 <div className="legs"><div className="leg"><div className="time"><b>{j.legs[0].dep}</b><span>{j.origin}</span></div><div className="legline"><i></i><span>{j.legs[0].train}</span></div><div className="time"><b>{j.legs[0].arr}</b><span>{j.legs[0].to}</span></div></div>
 <div className="connection"><span>CONNECTION</span><b>{j.buffer} min</b><small>{j.legs[0].to} · Platform {j.legs[0].platform} → {j.legs[1].platform}</small></div>
 <div className="leg"><div className="time"><b>{j.legs[1].dep}</b><span>{j.legs[1].from}</span></div><div className="legline"><i></i><span>{j.legs[1].train}</span></div><div className="time"><b>{j.legs[1].arr}</b><span>{j.destination}</span></div></div></div>
 <div className="journey-meta"><span><b>{j.duration}</b> total</span><span><b>{j.wait}</b> waiting</span><span><b>{j.reliability}%</b> reliability</span><span><b>₹{j.cost.toLocaleString()}</b> est. cost</span></div>
 <div className="journey-reason"><span>WHY {j.risk}?</span>{j.reason}</div>
 <div className="card-actions"><button className={"compare-check "+(checked?"checked":"")} onClick={onCompare}>{checked?"✓ Compared":"＋ Compare"}</button><button className="btn primary small" onClick={onOpen}>View Journey →</button></div>
 </article>
}

function JourneyDetails(){
 const {id}=useParams(), nav=useNavigate(), j=journeys.find(x=>x.id===id)||journeys[0];
 const [support,setSupport]=useState("basic"), [wtp,setWtp]=useState(null), [purchaseIntent,setPurchaseIntent]=useState(null), [bookingConfirmed,setBookingConfirmed]=useState(false), [riskAcknowledged,setRiskAcknowledged]=useState(false);
 useEffect(()=>{trackCtaExposure("backup_options")},[]);
 const supportOptions=[
  {id:"free",price:0,name:"Monitor + backup options",desc:"See delays, connection risk and alternative onward options at no cost.",best:"Free for every traveller — you choose what to do",features:["Delay status","Connection risk & buffer updates","Backup / alternative options","Journey monitoring"]},
  {id:"basic",price:49,name:"Secure my next leg",desc:"Get help securing an onward option before a connection becomes a problem.",best:"For travellers who want the next leg taken care of",features:["Everything in Free","Onward option selection help","Booking / reconfirmation guidance","Next-leg support"]},
  {id:"recovery",price:99,name:"Recovery support",desc:"If your connection becomes risky or is missed, get help securing a replacement onward journey.",best:"For trips where a missed connection would be costly",features:["Everything in Basic","Missed-connection recovery","Replacement journey support","Onward journey secured with assistance"]},
  {id:"priority",price:199,name:"Priority onward journey",desc:"Get higher-touch support focused on securing your onward journey when disruption happens.",best:"For travellers who want the most hands-on support",features:["Everything in Recovery","Priority assistance","Faster recovery coordination","Priority onward travel support"]}
 ];
 const selectedSupport=supportOptions.find(x=>x.id===support)||supportOptions[1];
 const save=()=>{localStorage.setItem("rc_saved",j.id);trackEvent("journey_saved",{journey_id:j.id});nav("/my-journey")};
 const chooseSupport=(id)=>{setSupport(id);const option=supportOptions.find(x=>x.id===id);trackEvent("assistance_option_selected",{journey_id:j.id,option:id,price:option.price});if(option.price>0)trackEvent("wtp_amount_selected",{journey_id:j.id,price_option:option.price,source:"booking_flow"})};
 const continueBooking=()=>{trackEvent("booking_started",{journey_id:j.id,support_option:support,assistance_price:selectedSupport.price});if(selectedSupport.price>0){trackEvent("payment_page_viewed",{journey_id:j.id,support_option:support,amount:selectedSupport.price});nav(`/payment/${j.id}?support=${support}`);}else{setBookingConfirmed(true);}};
 return <div className="container page"><div className="breadcrumb"><Link to="/results">← Results</Link><span>/</span><span>Journey details</span></div>
 <div className="detail-head"><div><div className="eyebrow">JOURNEY {j.id.toUpperCase()}</div><h1>{j.origin} → {j.destination}</h1><p>25 September 2026 · 1 connection · Demo schedule</p></div><RiskBadge risk={j.risk}/></div>
 <div className="detail-grid"><section className="timeline-card"><div className="card-heading"><div><span className="eyebrow">TIMELINE</span><h2>One journey, one view.</h2></div><span className="demo-note">Mock platforms</span></div>
 {j.legs.map((l,i)=><React.Fragment key={l.train}><div className="timeline-row"><div className="timeline-time"><b>{l.dep}</b><span>Departure</span></div><div className="timeline-dot"></div><div><span className="eyebrow">TRAIN {l.train}</span><h3>{l.name}</h3><p>{l.from} → {l.to} · Platform {l.platform}</p><span className="reliability">Mock reliability {l.reliability}%</span></div></div>
 {i===0&&<div className="timeline-row buffer"><div className="timeline-time"><b>{j.buffer}m</b><span>Buffer</span></div><div className="timeline-dot"></div><div><span className="eyebrow">CONNECTION WINDOW</span><h3>{j.legs[0].arr} → {j.legs[1].dep}</h3><p>Transfer at {j.legs[0].to}. Platform change {j.legs[0].platform} → {j.legs[1].platform}.</p><strong>If Train 1 is delayed by more than {j.threshold} minutes, this connection becomes high risk.</strong></div></div>}</React.Fragment>)}
 <div className="timeline-row"><div className="timeline-time"><b>{j.legs[1].arr}</b><span>Arrival</span></div><div className="timeline-dot"></div><div><span className="eyebrow">DESTINATION</span><h3>Arrive in {j.destination}</h3><p>Journey complete.</p></div></div></section>
 <aside className="side-stack"><div className="info-card"><span className="eyebrow">RISK EXPLANATION</span><h3>{j.risk} connection risk</h3><p>{j.reason}</p><div className="risk-meter"><i style={{width:(j.risk==="LOW"?88:j.risk==="MODERATE"?58:28)+"%"}}></i></div><small>Prototype estimate · not statistically validated</small></div>
 <div className="info-card"><span className="eyebrow">DELAY TOLERANCE</span><h3>{j.threshold} min</h3><p>Approximate delay margin before this connection moves into high-risk territory.</p></div>
 {!riskAcknowledged ? <button className="btn ghost wide" onClick={()=>{setRiskAcknowledged(true);trackEvent("risk_details_viewed",{journey_id:j.id,risk_level:j.risk});trackEvent("risk_understood",{journey_id:j.id,risk_level:j.risk});}}>Continue with this journey →</button> : <div className="risk-confirmed"><div><span>✓</span><div><b>Risk understood</b><p>{j.buffer} min connection buffer with about {j.threshold} min of delay tolerance before high risk.</p></div></div><button className="btn dark small" onClick={()=>document.getElementById("support-options")?.scrollIntoView({behavior:"smooth",block:"start"})}>Choose support →</button></div>}
 </aside></div>

 <section className="booking-panel" id="support-options">
  <div className="booking-head"><div><span className="eyebrow">BEFORE YOU BOOK</span><h2>Choose how much onward-journey support you want.</h2><p>Backup options are free for everyone. Paid plans add assistance to secure and recover your onward journey. This is a prototype; no payment is taken.</p></div><span className="booking-step">1 · SUPPORT</span></div>
  <div className="support-grid">{supportOptions.map(o=><button key={o.id} className={"support-option "+(support===o.id?"selected":"")} onClick={()=>chooseSupport(o.id)}><div className="support-top"><div><span className="support-label">{o.id==="free"?"INCLUDED":"OPTIONAL"}</span><h3>{o.name}</h3></div><strong>{o.price===0?"Free":"₹"+o.price}</strong></div><p>{o.desc}</p><div className="support-best">{o.best}</div><ul>{o.features.map(f=><li key={f}>✓ {f}</li>)}</ul></button>)}</div>
  <div className="booking-validation">
   <div><span className="eyebrow">QUICK VALIDATION</span><h3>Would you pay for this support?</h3><p>Your answer helps us test whether this feature is valuable. No payment is taken.</p></div>
   <div className="wtp-booking-row">{[49,99,199].map(p=><button className={wtp===p?"chosen":""} key={p} onClick={()=>{setWtp(p);setSupport(p===49?"basic":p===99?"recovery":"priority");trackEvent("wtp_amount_selected",{journey_id:j.id,price_option:p,source:"booking_validation"})}}>₹{p}<small>{p===49?"secure next leg":p===99?"recover onward journey":"priority support"}</small></button>)}<button className={wtp===0?"chosen":""} onClick={()=>{setWtp(0);trackEvent("wtp_amount_selected",{journey_id:j.id,price_option:0,source:"booking_validation"})}}>₹0<small>I'd use free only</small></button></div>
   <div className="purchase-intent-row"><span>Would you use it on a real trip?</span>{["YES","MAYBE","NO"].map(x=><button className={purchaseIntent===x?"selected":""} key={x} onClick={()=>{setPurchaseIntent(x);trackEvent("purchase_intent",{journey_id:j.id,response:x,source:"booking_flow"})}}>{x}</button>)}</div>
  </div>
  <div className="booking-summary"><div><span className="eyebrow">YOUR BOOKING</span><h3>{j.origin} → {j.destination}</h3><p>Estimated fare ₹{j.cost.toLocaleString()} · {j.duration} · {j.risk} connection risk</p><small>Support: <b>{selectedSupport.name}</b>{selectedSupport.price?` · ₹${selectedSupport.price}`:" · Included"}</small></div><button className="btn primary" onClick={continueBooking}>Continue to booking →</button></div>
  {bookingConfirmed&&<div className="booking-confirmed"><div><span>✓</span><div><b>Booking flow started</b><p>This prototype has recorded the journey, support choice and purchase-intent response. No payment or real ticket booking was made.</p></div></div><button className="btn dark small" onClick={save}>Save & Monitor Journey</button></div>}
 </section>

 <section className="backup-section"><div className="section-head compact"><div><div className="eyebrow">FREE FOR EVERYONE</div><h2>See backup options before you book.</h2></div><p>Explore alternative trains and routes now. If you want RailConnect to help secure the onward journey, choose a paid support tier above.</p></div><button className="btn dark" onClick={()=>{trackEvent("cta_clicked",{cta:"backup_options",journey_id:j.id});trackEvent("backup_options_clicked",{journey_id:j.id});nav("/my-journey?backup=1")}}>Show Free Backup Options →</button></section>
 </div>
}

function Compare(){
 const nav=useNavigate();
 const ids=new URLSearchParams(useLocation().search).get("ids")?.split(",")||journeys.slice(0,3).map(x=>x.id);
 const selected=ids.map(id=>journeys.find(j=>j.id===id)).filter(Boolean).slice(0,3);
 useEffect(()=>trackEvent("connection_results_viewed",{count:selected.length}),[]);
 return <div className="container page"><div className="breadcrumb"><Link to="/results">← Results</Link></div><div className="page-intro"><div><div className="eyebrow">COMPARE CONNECTIONS</div><h1>See the trade-offs clearly.</h1><p>No hidden “best” option. Compare the dimensions that matter to your journey.</p></div></div>
 <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>Journey</th>{selected.map(j=><th key={j.id}>{j.legs[0].to}<br/><small>via {j.legs[0].to}</small></th>)}</tr></thead><tbody>
 {[
 ["Departure",j=>j.legs[0].dep],["Arrival",j=>j.legs[1].arr],["Total duration",j=>j.duration],["Connection buffer",j=>j.buffer+" min"],["Waiting time",j=>j.wait],["Connections",j=>j.connections],["Estimated cost",j=>"₹"+j.cost.toLocaleString()],["Risk",j=><RiskBadge risk={j.risk}/>],["Reliability",j=>j.reliability+"%"]
 ].map(([label,get])=><tr key={label}><td><b>{label}</b></td>{selected.map(j=><td key={j.id}>{get(j)}</td>)}</tr>)}
 <tr className="compare-action-row"><td><b>Next step</b><small>Continue with a journey</small></td>{selected.map(j=><td key={j.id}><button className="btn primary small compare-book-btn" onClick={()=>{trackEvent("journey_opened_from_compare",{journey_id:j.id});nav("/journey/"+j.id)}}>View &amp; book this journey →</button></td>)}</tr>
 </tbody></table></div>
 <div className="compare-next"><div><span className="eyebrow">READY TO CONTINUE?</span><h3>Choose a connection to see booking and onward-support options.</h3><p>You'll be taken to the journey page where you can review the route, choose free monitoring or paid onward-journey assistance, and continue the booking flow.</p></div><button className="btn dark" onClick={()=>{const j=selected[0]; if(j){trackEvent("journey_opened_from_compare",{journey_id:j.id});nav("/journey/"+j.id)}}} disabled={!selected.length}>Continue with first option →</button></div>
 <div className="tradeoff-note"><b>What this view is for</b><span>There is no universal best journey. A lower-cost route may have less buffer; a safer connection may mean more waiting. This prototype keeps those trade-offs visible so the traveller chooses.</span></div>
 </div>
}

function MyJourney(){
 const [delay,setDelay]=useState(0), [missed,setMissed]=useState(false), nav=useNavigate();
 const j=journeys[0], currentBuffer=Math.max(0,j.buffer-delay), risk=missed?"MISSED":currentBuffer>70?"LOW":currentBuffer>35?"MODERATE":"HIGH";
 const simulate=(d)=>{setDelay(d);trackEvent("delay_simulation_started",{delay_minutes:d});trackEvent("delay_warning_viewed",{new_buffer:currentBuffer})};
 useEffect(()=>trackEvent("journey_monitoring_opened",{journey_id:j.id}),[]);
 return <div className="container page"><div className="detail-head"><div><div className="eyebrow">MY JOURNEY · ACTIVE</div><h1>Hyderabad → Kochi</h1><p>Saved journey · Kacheguda – Bengaluru Exp + Ernakulam Exp</p></div><span className="live-badge">● DEMO MONITOR</span></div>
 <div className="monitor-banner"><div><span className="eyebrow">CURRENT STATUS</span><h2>{missed?"Connection missed":delay===0?"Everything is on schedule":"Your connection is changing"}</h2><p>{missed?"Train 1 arrived 52 minutes late and Train 2 has departed.":delay===0?"Train 1 is ON TIME. Your connection is SAFE.":"Train 1 delayed by "+delay+" minutes. Buffer reduced from 1h 35m to "+Math.floor(currentBuffer/60)+"h "+(currentBuffer%60)+"m."}</p></div><RiskBadge risk={risk==="MISSED"?"HIGH":risk}/></div>
 <div className="monitor-grid"><section className="timeline-card compact-monitor"><div className="monitor-step"><span className="status-dot good"></span><div><b>Train 1 · 12785</b><p>Hyderabad 08:20 → Bengaluru 14:10</p></div><strong>{delay?`+${delay} min`:"ON TIME"}</strong></div><div className="monitor-connector"><span>{currentBuffer} min buffer</span><div className="buffer-bar"><i style={{width:Math.min(100,currentBuffer/95*100)+"%"}}></i></div></div><div className="monitor-step"><span className={"status-dot "+(risk==="HIGH"?"warn":"good")}></span><div><b>Connection</b><p>Bengaluru · Platform 5 → 2</p></div><strong>{risk==="LOW"?"SAFE":risk==="MODERATE"?"WATCH":"HIGH RISK"}</strong></div><div className="monitor-step"><span className="status-dot"></span><div><b>Train 2 · 12677</b><p>Bengaluru 15:45 → Kochi 22:30</p></div><strong>UPCOMING</strong></div></section>
 <aside className="side-stack"><div className="info-card simulator"><span className="eyebrow">DEMO CONTROLS</span><h3>Simulate disruption</h3><p>Use these controls during your presentation to show the risk model reacting to a delay.</p><div className="sim-buttons"><button onClick={()=>simulate(20)}>+20 min</button><button onClick={()=>simulate(40)}>+40 min</button><button onClick={()=>{setMissed(true);trackEvent("missed_connection_simulated",{delay_minutes:52})}}>Missed connection</button><button onClick={()=>{setDelay(0);setMissed(false)}}>Reset</button></div></div>
 {risk==="HIGH"&&!missed&&<div className="warning-card"><b>Your connection is now at high risk.</b><p>The remaining buffer is too small for comfortable recovery.</p><button className="btn primary wide" onClick={()=>{trackEvent("alternative_options_viewed",{source:"delay_warning"});nav("/recovery")}}>Find Alternatives →</button></div>}
 {missed&&<div className="warning-card"><b>Your connecting train has departed.</b><p>Let's move from monitoring to recovery.</p><button className="btn primary wide" onClick={()=>{trackEvent("recovery_options_viewed",{source:"missed_connection"});nav("/recovery")}}>Recover My Journey →</button></div>}
 </aside></div>
 </div>
}

function Recovery(){
 const nav=useNavigate(), [chosen,setChosen]=useState(null), [wtp,setWtp]=useState(null), [feedback,setFeedback]=useState(null);
 return <div className="container page"><div className="eyebrow">RECOVERY MODE</div><h1>Your original connection was missed.</h1><p className="lead">Train 1 arrived 52 minutes late. Train 2 has departed. Here are the next practical options.</p>
 <div className="recovery-alert"><span>!</span><div><b>Connection missed · 14:10 arrival → 15:45 departure</b><p>We're switching from monitoring to recovery. Options below use demo data.</p></div></div>
 <div className="recovery-grid">{recovery.map((r,i)=><button className={"recovery-card "+(chosen===i?"chosen":"")} key={r.title} onClick={()=>{setChosen(i);trackEvent("recovery_option_selected",{option:r.title});}}><span className="tag">{r.tag}</span><h3>{r.title}</h3><p>{r.detail}</p><strong>{r.price}</strong><span className="arrow">→</span></button>)}</div>
 {chosen!==null&&<div className="selected-recovery"><div><span className="eyebrow">SELECTED RECOVERY</span><h2>{recovery[chosen].title}</h2><p>{recovery[chosen].detail}</p></div><button className="btn dark" onClick={()=>nav("/recovery?wtp=1")}>Continue →</button></div>}
 <section className="wtp-card"><div><div className="eyebrow">VALIDATION EXPERIMENT</div><h2>Need help securing your onward journey?</h2><p>These are hypothetical assistance tiers. No payment is taken.</p></div><div className="price-row">{[49,99,199].map(p=><button className={wtp===p?"chosen":""} key={p} onClick={()=>{setWtp(p);trackEvent("wtp_option_selected",{price_option:p})}}>₹{p}<small>{p===49?"Basic assistance":p===99?"Alternative assistance":"Priority recovery"}</small></button>)}</div>
 <div className="validation-row"><span>Would you use this?</span>{["YES","MAYBE","NO"].map(x=><button className={feedback===x?"selected":""} key={x} onClick={()=>{setFeedback(x);trackEvent("validation_question_answered",{question:"Would you use this?",response:x})}}>{x}</button>)}</div>
 </section>
 <div className="feedback-mini"><span>Was the recovery flow useful?</span>{["Definitely","Maybe","Probably not"].map(x=><button key={x} onClick={()=>trackEvent("feedback_submitted",{question:"Was the recovery flow useful?",response:x})}>{x}</button>)}</div>
 </div>
}

function AdminLogin({onSuccess}){
 const [password,setPassword]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false);
 const submit=async e=>{e.preventDefault();setError("");setLoading(true);try{const ok=await verifyAdminPassword(password);if(ok===true){sessionStorage.setItem("rc_admin_verified","1");onSuccess()}else setError("Incorrect admin password.")}catch(e){setError(e.message||"Verification failed.")}finally{setLoading(false)}};
 return <div className="admin-gate container page"><div className="admin-gate-card"><div className="admin-lock">RC</div><div className="eyebrow">RESTRICTED AREA</div><h1>Analytics dashboard</h1><p>Enter the admin password to view centralized RailConnect product and marketing analytics.</p><form onSubmit={submit} className="admin-login-form"><label>Admin password<input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password"/></label>{error&&<div className="admin-error">{error}</div>}<button className="btn primary wide" disabled={loading}>{loading?"Verifying…":"Unlock Analytics →"}</button></form><small>Analytics data is stored centrally. Participant browsers do not store the analytics dataset.</small></div></div>
}

function MetricCard({label,value,sub,accent=false}){return <div className={"kpi "+(accent?"accent":"")}><span>{label}</span><strong>{value}</strong>{sub&&<small>{sub}</small>}</div>}

function FixedValidationCard({label,value,sub,detail}){
 return <div className="kpi accent"><span>{label}</span><strong>{value}</strong><small>{sub}<br/><b>{detail}</b></small></div>;
}

function AnalyticsDashboard(){
 const [data,setData]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const load=async()=>{try{setError("");const [analytics,ctaMetrics]=await Promise.all([fetchAnalytics(),fetchCtaMetrics()]);setData({...analytics,cta_metrics:ctaMetrics})}catch(e){setError(e.message||"Unable to load analytics.")}finally{setLoading(false)}};
 useEffect(()=>{load();const t=setInterval(load,15000);return()=>clearInterval(t)},[]);
 if(loading&&!data)return <div className="container page analytics-page"><div className="loading-card">Loading centralized analytics…</div></div>;
 if(error&&!data)return <div className="container page analytics-page"><div className="admin-error">{error}</div><button className="btn primary" onClick={load}>Retry</button></div>;
 const m=data.marketing||{},ev=data.events||{}, unique=n=>ev[n]?.unique_sessions||0;
 const funnel=[["Feature visibility",m.exposure_users||0],["Search started",m.search_starters||0],["Search completed",m.search_completers||0],["Results reached",m.results_reachers||0],["Journey viewed",unique("journey_opened")],["Compared",unique("journey_compared")],["Saved & monitored",unique("journey_saved")],["Recovery explored",unique("recovery_options_viewed")]];
 const max=Math.max(...funnel.map(x=>x[1]),1);
 const features=[["Compare",unique("journey_compared")],["Save & monitor",unique("journey_saved")],["Risk details",unique("risk_details_viewed")],["Backup options",unique("backup_options_clicked")],["Delay simulation",unique("delay_simulation_started")],["Recovery",unique("recovery_options_viewed")],["WTP",unique("wtp_amount_selected")||unique("willingness_to_pay")]];
 const wtpRows=data.wtp||[], wtpTotal=wtpRows.reduce((sum,x)=>sum+(Number(x.responses)||0),0), paidWtp=wtpRows.filter(x=>Number(x.price)>0).reduce((sum,x)=>sum+(Number(x.responses)||0),0);
 const compareUsers=unique("journey_compared"), paidRate=wtpTotal?((paidWtp/wtpTotal)*100):0;
 return <div className="container page analytics-page">
  <div className="analytics-top"><div><div className="eyebrow">ADMIN · PRODUCT ANALYTICS</div><h1>RailConnect validation dashboard.</h1><p>Centralized usage, marketing funnel and monetization signals from all prototype sessions.</p></div><div className="analytics-actions"><span className="live-badge">● LIVE DATA</span><button className="btn ghost small" onClick={load}>Refresh</button><button className="btn ghost small" onClick={()=>{sessionStorage.removeItem("rc_admin_verified");location.reload()}}>Lock</button></div></div>
  {error&&<div className="admin-error analytics-inline">{error}</div>}
  <section className="analytics-section"><div className="analytics-section-head"><div><div className="eyebrow">MARKETING SIGNALS</div><h2>Which key actions users actually used</h2><p className="card-description"><strong>Current validation snapshot from the collected prototype data.</strong> Rates are calculated from the 159-session funnel shown in our current analysis.</p></div><span className="updated">Updated {new Date(data.last_updated).toLocaleString()}</span></div>
   <div className="kpi-grid marketing-kpis">
    <FixedValidationCard label="Search started" value="27.0%" sub="Sessions that started a search." detail="43 of 159 total sessions"/>
    <FixedValidationCard label="Search completed" value="27.0%" sub="Sessions that completed a search." detail="43 of 159 total sessions · 100% of starts"/>
    <FixedValidationCard label="Results reached" value="24.5%" sub="Sessions that reached search results." detail="39 of 159 total sessions · 90.7% of completed searches"/>
    <FixedValidationCard label="Journey viewed" value="16.4%" sub="Sessions that opened a journey." detail="26 of 159 total sessions · 66.7% of results reached"/>
    <FixedValidationCard label="Compared" value="12.6%" sub="Sessions that compared journeys." detail="20 of 159 total sessions · 76.9% of journeys viewed"/>
    <FixedValidationCard label="Saved & monitored" value="4.4%" sub="Sessions that saved or monitored a journey." detail="7 of 159 total sessions · 35.0% of compared"/>
    <FixedValidationCard label="Recovery explored" value="3.8%" sub="Sessions that explored recovery." detail="6 of 159 total sessions · 30.0% of compared"/>
   </div>
  </section>
  <div className="analytics-grid">
   <section className="chart-card"><div className="card-heading"><div><span className="eyebrow">MARKETING FUNNEL</span><h2>How people move through the journey</h2></div></div><div className="funnel">{funnel.map(x=><div className="funnel-row" key={x[0]}><span>{x[0]}</span><div><i style={{width:(x[1]/max*100)+"%"}}></i></div><b>{x[1]}</b></div>)}</div></section>
   <section className="chart-card"><div className="card-heading"><div><span className="eyebrow">FEATURE ENGAGEMENT</span><h2>Which features people use</h2></div></div><div className="bars">{features.map(x=><div className="bar-row" key={x[0]}><span>{x[0]}</span><div><i style={{width:Math.max(0,Math.min(100,(x[1]/Math.max(...features.map(f=>f[1]),1))*100))+"%"}}></i></div><b>{x[1]}</b></div>)}</div></section>
  </div>
  <div className="analytics-grid">
   <section className="chart-card"><div className="card-heading"><div><span className="eyebrow">ACQUISITION</span><h2>Where visitors come from</h2></div><b>{data.sessions||0} sessions</b></div><div className="source-list">{(data.sources||[]).map(x=><div key={x.source}><span>{x.source}</span><b>{x.sessions}</b></div>)}</div></section>
   <section className="chart-card"><div className="card-heading"><div><span className="eyebrow">CORE USAGE</span><h2>How people use RailConnect</h2></div></div><div className="mini-metrics"><div><b>{unique("journey_opened")}</b><span>journeys viewed</span></div><div><b>{unique("journey_compared")}</b><span>comparison users</span></div><div><b>{unique("journey_saved")}</b><span>saved journeys</span></div><div><b>{unique("journey_monitoring_opened")}</b><span>monitoring users</span></div></div></section>
  </div>
  <div className="analytics-grid">
   <section className="chart-card"><div className="card-heading"><div><span className="eyebrow">WILLINGNESS TO PAY</span><h2>What people are willing to pay for</h2><p className="card-description"><strong>Shows how many WTP responses selected each price point.</strong> Paid selections are calculated dynamically from the WTP responses currently stored in Supabase.</p></div></div><div className="price-bars">{wtpRows.map(x=>{const r=Number(x.responses)||0;const pct=wtpTotal?(r/wtpTotal*100):0;return <div key={x.price}><b>₹{x.price}</b><i style={{height:Math.max(8,r*38)+"px"}}></i><span>{r} · {pct.toFixed(1)}%</span></div>})}</div><div className="wtp-summary"><strong>{paidWtp} paid-support selections</strong><span>{wtpTotal?`${paidWtp} of ${wtpTotal} WTP responses · ${paidRate.toFixed(1)}% selected a paid option`:"No WTP responses yet"}</span></div><p className="chart-note">Responses shown exactly as collected; all counts and percentages update from live analytics data.</p></section>
   <section className="chart-card"><div className="card-heading"><div><span className="eyebrow">VALIDATION</span><h2>Which journey features people explore</h2><p className="card-description"><strong>Shows unique sessions that interacted with key journey-support features.</strong> These are product engagement signals from the prototype, not population-level market estimates.</p></div></div><div className="mini-metrics engagement-metrics"><div><b>{unique("risk_details_viewed")}</b><span>Risk details viewed</span></div><div><b>{unique("backup_options_clicked")}</b><span>Backup options opened</span></div><div><b>{unique("delay_simulation_started")}</b><span>Delay simulations started</span></div><div><b>{unique("recovery_option_selected")}</b><span>Recovery options selected</span></div></div></section>
  </div>
  <section className="event-log"><div className="card-heading"><div><span className="eyebrow">CROSS-USER ACTIVITY</span><h2>Recent activity</h2></div><span className="updated">Centralized event stream</span></div>{(data.recent_events||[]).map((e,i)=><div className="event" key={i}><b>{e.event_name}</b><span>{new Date(e.occurred_at).toLocaleString()}</span><code>{e.page||"—"}</code></div>)}</section>
 </div>
}

function PaymentPage(){
 const {id}=useParams(), nav=useNavigate(), params=new URLSearchParams(useLocation().search), supportId=params.get("support")||"basic";
 const j=journeys.find(x=>x.id===id)||journeys[0];
 const options={
  basic:{name:"Secure my next leg",price:49,desc:"Help securing the next onward leg, with booking / reconfirmation guidance."},
  recovery:{name:"Recovery support",price:99,desc:"Help recovering and securing a replacement onward journey after disruption."},
  priority:{name:"Priority onward journey",price:199,desc:"Higher-touch assistance focused on securing your onward journey."}
 };
 const plan=options[supportId]||options.basic;
 const [method,setMethod]=useState("upi"),[paid,setPaid]=useState(false),[loading,setLoading]=useState(false);
 const completePayment=()=>{setLoading(true);setTimeout(()=>{setLoading(false);setPaid(true);trackEvent("dummy_payment_completed",{journey_id:j.id,support_option:supportId,amount:plan.price,method});},450)};
 if(paid)return <div className="container page payment-page"><div className="payment-success"><div className="success-icon">✓</div><span className="eyebrow">DEMO PAYMENT COMPLETE</span><h1>Your support is secured.</h1><p>The demo payment of <b>₹{plan.price}</b> was recorded successfully. No real payment was processed.</p><div className="payment-success-card"><div><span>JOURNEY</span><b>{j.origin} → {j.destination}</b></div><div><span>SUPPORT</span><b>{plan.name}</b></div><div><span>DEMO AMOUNT</span><b>₹{plan.price}</b></div></div><button className="btn primary" onClick={()=>nav(`/journey/${j.id}`)}>Continue to journey →</button></div></div>;
 return <div className="container page payment-page"><div className="breadcrumb"><button className="text-link" onClick={()=>nav(`/journey/${j.id}`)}>← Back to journey</button><span>/</span><span>Demo payment</span></div>
  <div className="payment-head"><div><span className="eyebrow">STEP 2 · DEMO CHECKOUT</span><h1>Secure your onward journey.</h1><p>This is a prototype payment page. No real payment or ticket purchase will happen.</p></div><span className="demo-pill">DEMO PAYMENT</span></div>
  <div className="payment-grid"><section className="payment-card"><div className="payment-section-head"><div><span className="eyebrow">PAYMENT METHOD</span><h2>Choose how to pay</h2></div><strong>₹{plan.price}</strong></div>
   <div className="payment-methods"><button className={method==="upi"?"selected":""} onClick={()=>setMethod("upi")}>UPI</button><button className={method==="card"?"selected":""} onClick={()=>setMethod("card")}>Card</button><button className={method==="netbanking"?"selected":""} onClick={()=>setMethod("netbanking")}>Net Banking</button></div>
   {method==="upi"&&<div className="fake-fields"><label>UPI ID<input placeholder="name@upi"/></label><small>Demo field — any value is accepted.</small></div>}
   {method==="card"&&<div className="fake-fields"><label>Card number<input placeholder="1234 5678 9012 3456" inputMode="numeric"/></label><div className="field-row"><label>Expiry<input placeholder="MM / YY"/></label><label>CVV<input placeholder="123"/></label></div><small>Demo field — no card details are sent anywhere.</small></div>}
   {method==="netbanking"&&<div className="fake-fields"><label>Select bank<select defaultValue="demo"><option value="demo">Demo Bank</option><option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option></select></label><small>Demo selection only.</small></div>}
   <button className="btn primary wide payment-button" onClick={completePayment} disabled={loading}>{loading?"Processing demo payment…":`Pay ₹${plan.price} (Demo) →`}</button>
   <div className="payment-note">🔒 <b>Demo only.</b> This prototype does not charge money, connect to a payment gateway, or book a real ticket.</div>
  </section>
  <aside className="payment-order"><span className="eyebrow">ORDER SUMMARY</span><h2>{plan.name}</h2><p>{plan.desc}</p><div className="order-route"><span>JOURNEY</span><b>{j.origin} → {j.destination}</b><small>{j.duration} · {j.risk} connection risk</small></div><div className="order-total"><span>Support</span><b>₹{plan.price}</b></div><div className="order-total grand"><span>Total</span><b>₹{plan.price}</b></div></aside></div>
 </div>;
}

function Analytics(){
 const [verified,setVerified]=useState(sessionStorage.getItem("rc_admin_verified")==="1");
 return verified?<AnalyticsDashboard/>:<AdminLogin onSuccess={()=>setVerified(true)}/>;
}

function App(){
 return <Routes>
  <Route path="/" element={<Shell><Landing/></Shell>}/>
  <Route path="/search" element={<Shell><Search/></Shell>}/>
  <Route path="/results" element={<Shell><Results/></Shell>}/>
  <Route path="/journey/:id" element={<Shell><JourneyDetails/></Shell>}/>
  <Route path="/payment/:id" element={<Shell><PaymentPage/></Shell>}/>
  <Route path="/compare" element={<Shell><Compare/></Shell>}/>
  <Route path="/my-journey" element={<Shell><MyJourney/></Shell>}/>
  <Route path="/recovery" element={<Shell><Recovery/></Shell>}/>
  <Route path="/analytics" element={<Shell><Analytics/></Shell>}/>
  <Route path="*" element={<Shell><Landing/></Shell>}/>
 </Routes>
}
createRoot(document.getElementById("root")).render(<BrowserRouter><App/></BrowserRouter>);
