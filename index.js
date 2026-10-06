"use strict";
/* ============================================================
   GridPulse v2 — all logic lives here. Plain-English guide:
   - "state" holds everything (buildings, rooms, market...)
   - tick() runs every 2 seconds: moves the simulation forward
   - render*() functions redraw the screen from state
   Everything is simulated. No internet, no sensors.
   ============================================================ */

// ---------- tiny helpers ----------
function el(id){ return document.getElementById(id); }
function rnd(a,b){ return a + Math.random()*(b-a); }          // random number between a and b
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }  // keep v inside [a,b]
function fmt(n,d){ return Number(n).toFixed(d===undefined?1:d); }
function rs(n){ return "₹" + Math.round(n).toLocaleString("en-IN"); }  // rupees formatting
// ---------- inline SVG icon system: stroke icons, no emoji in UI ----------
var ICONS = {
  bolt: '<path d="M13 2 4.5 13.5H11L9.5 22 19 10.5h-6.5L13 2z"/>',
  buildings: '<rect x="4" y="9" width="7" height="12" rx="1.5"/><rect x="13" y="4" width="7" height="17" rx="1.5"/><path d="M2.5 21h19"/>',
  sliders: '<path d="M4 7.5h9M17.5 7.5H20M4 16.5h3M11.5 16.5H20"/><circle cx="15" cy="7.5" r="2.3"/><circle cx="9" cy="16.5" r="2.3"/>',
  exchange: '<path d="M4 8.5h12.5L13.5 5.5M20 15.5H7.5l3 3"/>',
  coin: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  alert: '<path d="M12 3.5L2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.8v.3"/>',
  pin: '<path d="M12 21.5s-7.5-6.6-7.5-11.5a7.5 7.5 0 0 1 15 0c0 4.9-7.5 11.5-7.5 11.5z"/><circle cx="12" cy="10" r="2.6"/>',
  chart: '<path d="M3.5 3.5V19a1.5 1.5 0 0 0 1.5 1.5h15.5"/><path d="M7 14.5l4-4.5 3 3 5-6.5"/>',
  battery: '<rect x="2.5" y="8" width="16" height="9" rx="2"/><path d="M21.5 11v3"/><path d="M7 11v3M11 11v3"/>',
  leaf: '<path d="M5 19.5C5 10 12.5 4.5 20 4.5c0 8-5 15-14 15"/><path d="M5 19.5c3-5.5 7-9.5 11.5-11.5"/>',
  trophy: '<path d="M8 4h8v4.5a4 4 0 0 1-8 0V4z"/><path d="M8 5H4.5A3.5 3.5 0 0 0 8 12M16 5h3.5A3.5 3.5 0 0 1 16 12"/><path d="M12 12.5V16M8.5 20.5h7M10 16h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  cloud: '<path d="M7 18.5a3.8 3.8 0 0 1-.6-7.5A5.8 5.8 0 0 1 17.7 9.7 3.9 3.9 0 0 1 17.2 18.5H7z"/>',
  book: '<path d="M5 3.5h10.5A3.5 3.5 0 0 1 19 7v13.5H8.5A3.5 3.5 0 0 1 5 17V3.5z"/><path d="M5 17a3.5 3.5 0 0 1 3.5-3.5H19"/><path d="M9 8h6"/>',
  moon: '<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2z"/>',
  check: '<path d="M4.5 12.5l5 5L19.5 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  arrow: '<path d="M4 12h15M13.5 6l6 6-6 6"/>',
  wallet: '<path d="M3.5 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7z"/><path d="M3.5 9.5h17"/><circle cx="16.5" cy="14.5" r="1.2"/>',
  ticket: '<path d="M4 8.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.8a2.2 2.2 0 0 0 0 4.4v1.8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.8a2.2 2.2 0 0 0 0-4.4V8.5z"/><path d="M13.5 7v2M13.5 11v2M13.5 15v2"/>',
  cup: '<path d="M5 9h11v5.5A4.5 4.5 0 0 1 11.5 19h-2A4.5 4.5 0 0 1 5 14.5V9z"/><path d="M16 10.5h1.8a2.7 2.7 0 0 1 0 5.4H16"/>',
  pen: '<path d="M4.5 19.5l1-3.8L16 5.2a2 2 0 0 1 2.8 2.8L8.3 18.5l-3.8 1z"/><path d="M14.5 6.7l2.8 2.8"/>',
  shield: '<path d="M12 3l7.5 3v6c0 4.6-3.2 7.6-7.5 9-4.3-1.4-7.5-4.4-7.5-9V6L12 3z"/><path d="M9 11.8l2.2 2.2 4-4.2"/>',
  bulb: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.7 10.7c.8.7 1.2 1.4 1.2 2.3h5c0-.9.4-1.6 1.2-2.3A6 6 0 0 0 12 3z"/>',
  plug: '<path d="M9.5 3v4.5M14.5 3v4.5M7 7.5h10V12a5 5 0 0 1-10 0V7.5zM12 17v4"/>',
  undo: '<path d="M8.5 5L4 9.5 8.5 14"/><path d="M4 9.5h9.5a6 6 0 0 1 0 12H11"/>',
  play: '<path d="M8 5l11 7-11 7V5z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  box: '<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16V8z"/><path d="M3.5 8L12 12.5 20.5 8M12 12.5V20"/>',
  droplet: '<path d="M12 3.5s6 6.6 6 10.8a6 6 0 0 1-12 0C6 10.1 12 3.5 12 3.5z"/>',
  server: '<rect x="4" y="4" width="16" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.5"/><path d="M7.5 7.2v.1M7.5 16.7v.1"/>',
  flask: '<path d="M9.5 3h5M10.5 3v5.5L5 18a2.4 2.4 0 0 0 2.1 3.5h9.8A2.4 2.4 0 0 0 19 18l-5.5-9.5V3"/>',
  cpu: '<rect x="8" y="8" width="8" height="8" rx="1.5"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.3"/><path d="M12 7.5V12l3.3 2"/>',
  info: '<circle cx="12" cy="12" r="8.3"/><path d="M12 11v5M12 7.8v.3"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.9M17.5 14.7A6 6 0 0 1 21 20"/>',
  door: '<path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h7A1.5 1.5 0 0 1 16 4.5V21"/><path d="M3.5 21h17"/><circle cx="12.8" cy="12" r=".9"/>',
  ff: '<path d="M4.5 5.5L12 12l-7.5 6.5v-13zM13 5.5L20.5 12 13 18.5v-13z"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
  list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12"/><path d="M4 6h.1M4 12h.1M4 18h.1"/>',
  target: '<circle cx="12" cy="12" r="8.3"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
};
function icon(n, cls){
  return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" '
    + 'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" '
    + 'aria-hidden="true">' + (ICONS[n] || ICONS.bolt) + '</svg>';
}
var VIEW_ICONS = { dashboard: 'bolt', optimizer: 'sliders', market: 'exchange', rewards: 'coin', emergency: 'alert', holo: 'box' };


// ---------- toast notifications: little popups bottom-right ----------
// Every important action calls toast() so the user SEES something happen.
function toast(msg, kind){
  var wrap = el("toast-wrap");
  var t = document.createElement("div");
  t.className = "toast" + (kind ? " " + kind : "");
  var tic = kind === "warn" ? "alert" : (kind === "bad" ? "alert" : "check");
  t.innerHTML = '<span class="t-ico">' + icon(tic) + "</span><span>" + msg + "</span>";
  wrap.appendChild(t);
  setTimeout(function(){ t.classList.add("out"); setTimeout(function(){ t.remove(); }, 320); }, 2600);
}

// ---------- the campus: 6 buildings ----------
// solarKW  = rooftop solar size. baseLoad = typical power draw in kW.
// batteryKWh = battery size. credits/rupees = market wallets.
function makeBuilding(name, solarKW, baseLoad, batteryKWh, roomNames){
  var rooms = roomNames.map(function(rn, i){
    return { name: rn, people: Math.floor(rnd(4, 26)), cap: 40,
             hvacOn: true, lightOn: true, auto: true };
  });
  return { name:name, solarKW:solarKW, baseLoad:baseLoad, batteryKWh:batteryKWh,
           battery: rnd(35, 65),          // battery charge % right now
           solarNow: 0, loadNow: baseLoad, // updated every tick
           rooms: rooms, credits: 100, rupees: 5000 };
}

var state = {
  tickN: 0,
  simMin: 9*60,                 // simulation clock starts at 09:00
  savedKWh: 0,                  // energy saved by auto-shutoff (the big counter)
  price: 7, prevPrice: 7,        // market price per credit in ₹
  history: [],                  // chart history: {gen, load}
  offers: [], buys: [], txs: [], // market order book + transaction log
  nextId: 1,
  co2: 2.4,                     // tonnes of CO2 avoided this month (carbon strip)
  scores: [],                   // leaderboard efficiency scores (filled in init)
  smartBatt: false,             // battery smart-schedule toggle
  rewards: {                    // student rewards: daily room budget game
    consumed: 1.2, budget: 5,   // kWh used today vs daily budget
    points: 120, streak: 4,     // GreenPoints balance + green-day streak
    redemptions: [],            // {name, cost, code}
    floor: [                    // floor leaderboard: rooms by weekly points
      { room: "B-312", pts: 214 },
      { room: "A-101 (you)", pts: 186, you: true },
      { room: "C-208", pts: 172 },
      { room: "A-215", pts: 158 },
      { room: "B-104", pts: 141 }
    ]
  },
  emergency: {                  // blackout island mode
    active: false,              // grid failed → campus on solar + batteries
    backupHrs: 0, maxHrs: 8.5,  // countdown of remaining backup power
    warned: false               // critical-reserve toast fired once
  },
  scen: { name: "normal", ac: 1, light: 1, solar: 1, exam: false },  // v6 scenario multipliers
  feed: [],                     // v6 explainable decision feed: {t, icon, text, kind}
  alerts: [],                   // v6 anomaly alerts: {id, text}
  anomCd: {},                   // v6 anomaly cooldowns: key -> simMin last fired
  lastShutoffLog: -999,         // v6 last simMin a room-shutoff was logged to the feed
  alertSeq: 1,                  // v6 alert id counter
  buildings: [
    makeBuilding("Hostel Block A", 40, 26, 120, ["Dorm Wing 1","Dorm Wing 2","Common Room","Study Hall"]),
    makeBuilding("Hostel Block B", 40, 30, 120, ["Dorm Wing 1","Dorm Wing 2","Common Room","Mess Hall"]),
    makeBuilding("CSE Academic Block", 60, 46, 150, ["Lab 1","Lab 2","Classroom 301","Seminar Hall"]),
    makeBuilding("Library", 25, 17, 80, ["Reading Hall","Stack Room","Digital Lab","Office"]),
    makeBuilding("Canteen", 15, 21, 60, ["Dining Hall","Kitchen","Store Room","Counter Area"]),
    makeBuilding("Admin Block", 20, 15, 60, ["Office 1","Office 2","Meeting Room","Records Room"])
  ]
};

// ---------- sun curve: solar output depends on time of day ----------
// Peaks around 1 PM, zero at night. This is why the chart has a nice hump.
function sunFactor(){
  var h = state.simMin / 60;
  if (h < 6 || h > 19) return 0;
  return Math.max(0, Math.sin(Math.PI * (h - 6) / 13));
}

// sim clock as "HH:MM" — shared by the topbar, decision feed and alerts
function simClock(){
  var h = Math.floor(state.simMin / 60), m = Math.floor(state.simMin % 60);
  return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
}

// ---------- v6: EXPLAINABLE DECISION FEED ----------
// Every autonomous action logs one line: what the system did and WHY.
// Newest on top, keep the last 10. kind "warn" renders amber.
function logDecision(icon, text, kind){
  state.feed.unshift({ t: simClock(), icon: icon, text: text, kind: kind || "" });
  if (state.feed.length > 10) state.feed.pop();
}
function renderFeed(){
  var feedEl = el("decision-feed");
  if (!feedEl) return;
  var html = "";
  state.feed.forEach(function(f){
    html += '<div class="feed-item' + (f.kind ? " " + f.kind : "") + '">'
      + '<span class="f-time">' + f.t + '</span><span class="f-ico">' + icon(f.icon) + '</span>'
      + '<span>' + f.text + '</span></div>';
  });
  feedEl.innerHTML = html || '<div style="color:var(--muted); font-size:13px;">No decisions yet — the system logs every action here.</div>';
}

// ---------- v6: ANOMALY ALERTS ----------
// Cheap checks each tick, with per-type cooldowns so they never spam.
function pushAlert(text){
  state.alerts.unshift({ id: state.alertSeq++, text: text });
  if (state.alerts.length > 5) state.alerts.pop();
  logDecision("alert", text, "warn");   // anomalies also appear in the decision feed
  toast(text, "warn");
}
function dismissAlert(id){
  state.alerts = state.alerts.filter(function(a){ return a.id !== id; });
  renderAll(true);
}
function renderAlerts(){
  var list = el("alert-list");
  if (!list) return;
  var html = "";
  state.alerts.forEach(function(a){
    html += '<div class="alert-card"><span class="a-ico">' + icon('alert') + '</span><span>' + a.text + '</span>'
      + '<button class="alert-x" data-dismiss="' + a.id + '" aria-label="dismiss alert">×</button></div>';
  });
  list.innerHTML = html || '<div style="color:var(--muted); font-size:13px;">All quiet — no anomalies detected.</div>';
}
function checkAnomalies(){
  var h = state.simMin / 60;
  var loads = state.buildings.map(function(b){ return b.loadNow; });
  var avg = loads.reduce(function(a, v){ return a + v; }, 0) / loads.length;
  state.buildings.forEach(function(b){
    var people = b.rooms.reduce(function(a, r){ return a + r.people; }, 0);
    var cdKey;
    // 1) night drain: 12–5 AM, significant load, nobody inside → forgotten AC?
    if (h >= 0 && h < 5 && b.loadNow > 10 && people === 0){
      cdKey = "night:" + b.name;
      if (!state.anomCd[cdKey] || state.simMin - state.anomCd[cdKey] >= 60){
        state.anomCd[cdKey] = state.simMin;
        pushAlert("<b>" + b.name + "</b> drawing <b>" + fmt(b.loadNow) + " kW</b> at " + simClock() + " with nobody inside — forgotten AC?");
      }
    }
    // 2) peer outlier: one building pulling >2× the campus average
    if (avg > 5 && b.loadNow > 2 * avg){
      cdKey = "peer:" + b.name;
      if (!state.anomCd[cdKey] || state.simMin - state.anomCd[cdKey] >= 60){
        state.anomCd[cdKey] = state.simMin;
        pushAlert("<b>" + b.name + "</b> load is <b>" + fmt(b.loadNow / avg, 1) + "×</b> the campus average — worth a check.");
      }
    }
  });
}

// ---------- v6: SCENARIO BUTTONS ----------
// Heatwave / Cloudy / Exam Week retune the sim multipliers live. Only one at a time.
var SCENARIOS = {
  normal:   { ac: 1,   light: 1,   solar: 1,    exam: false,
              toast: "↺ <b>Normal conditions.</b> Simulation back to baseline." },
  heatwave: { ac: 1.6, light: 1,   solar: 1.15, exam: false,
              toast: "<b>Heatwave!</b> AC load ×1.6, solar ×1.15 — watch the map react." },
  cloudy:   { ac: 1,   light: 1.2, solar: 0.3,  exam: false,
              toast: "<b>Cloudy day.</b> Solar ×0.3, lighting ×1.2 — batteries pick up the slack." },
  examweek: { ac: 1,   light: 1,   solar: 1,    exam: true,
              toast: "<b>Exam week.</b> Library packed — late-evening load bump after 6pm." }
};
var SCEN_ICON = { normal: "undo", heatwave: "sun", cloudy: "cloud", examweek: "book" };
function setScenario(name){
  if (!SCENARIOS[name]) return;
  var s = SCENARIOS[name];
  state.scen = { name: name, ac: s.ac, light: s.light, solar: s.solar, exam: s.exam };
  toast(s.toast);
  logDecision(SCEN_ICON[name], "Scenario: <b>" + name + "</b> — sim retuned live (AC ×" + s.ac + ", solar ×" + s.solar + (s.exam ? ", library packed" : "") + ")");
  renderAll(true);
}
function renderScenarios(){
  var bar = el("scenario-bar");
  if (!bar || !bar.querySelectorAll) return;
  var btns = bar.querySelectorAll("[data-scen]");
  for (var i = 0; i < btns.length; i++){
    var on = btns[i].getAttribute("data-scen") === state.scen.name;
    btns[i].className = "btn sm" + (on ? "" : " ghost");
  }
}

// ---------- v6: LIVE CAMPUS MAP ----------
// Stylized SVG: buildings glow green (surplus) / amber (deficit) each tick.
// Trade particles fly seller → buyer along a straight path (~1.2s).
var MAP_POS = [ {x:145,y:100}, {x:395,y:100}, {x:715,y:100},
                {x:970,y:100}, {x:230,y:280}, {x:810,y:280} ];
function renderMap(){
  if (!el("campus-map")) return;
  // TIME MACHINE: day/night ambience tint over the map
  var tint = el("map-daynight");
  if (tint && typeof dayTint === "function"){
    var dt = dayTint(state.simMin / 60);
    tint.setAttribute("fill", dt[0]);
    tint.setAttribute("opacity", dt[1]);
  }
  state.buildings.forEach(function(b, i){
    var g = el("map-b" + i);
    if (!g) return;
    var net = b.solarNow - b.loadNow;
    g.setAttribute("class", "map-b " + (net >= 0 ? "surplus" : "deficit"));
    var sub = el("map-sub-" + i);
    if (sub) sub.textContent = (net >= 0 ? "+" : "−") + fmt(Math.abs(net)) + " kW";
  });
}
function tradeParticle(sellerName, buyerName){
  var svg = el("campus-map");
  if (!svg || !document.createElementNS) return;
  var si = -1, bi = -1;
  state.buildings.forEach(function(b, i){
    if (b.name === sellerName) si = i;
    if (b.name === buyerName) bi = i;
  });
  if (si < 0 || bi < 0 || si === bi) return;
  var a = MAP_POS[si], c = MAP_POS[bi];
  var layer = el("map-particles") || svg;
  var circ = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circ.setAttribute("r", "10");
  circ.setAttribute("fill", "#f59e0b");
  circ.setAttribute("stroke", "#fff");
  circ.setAttribute("stroke-width", "3");
  var anim = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
  anim.setAttribute("dur", "1.2s");
  anim.setAttribute("repeatCount", "1");
  anim.setAttribute("fill", "freeze");
  anim.setAttribute("path", "M " + a.x + " " + a.y + " L " + c.x + " " + c.y);
  circ.appendChild(anim);
  layer.appendChild(circ);
  setTimeout(function(){ if (circ.parentNode) circ.parentNode.removeChild(circ); }, 1500);
}

// ---------- THE TICK: advances the whole simulation by 5 sim-minutes ----------
// Runs every 2 real seconds. Wrapped in try/catch by the caller so one
// bad tick can never freeze the demo.
function tick(skipAdvance){
  state.tickN++;
  // TIME MACHINE: while the clock is held (scrubbed or playing), the 2s loop
  // must NOT auto-advance it — it only jitters loads and re-renders.
  if (!skipAdvance && !tmEngaged){
    state.simMin += 5;
    if (state.simMin >= 24*60) state.simMin -= 24*60;   // wrap past midnight
  }

  var sun = sunFactor();
  var totalGen = 0, totalLoad = 0;
  var shutoffs = [];   // v6: rooms auto-powered-down this tick (for the decision feed)

  state.buildings.forEach(function(b){
    // solar for this building, with a little random wobble (clouds!) × scenario
    b.solarNow = b.solarKW * sun * rnd(0.85, 1.05) * state.scen.solar;

    // people drift in and out of rooms a little
    b.rooms.forEach(function(r){
      // v6 exam-week: the library stays packed
      if (state.scen.exam && b.name === "Library" && Math.random() < 0.5){
        r.people = Math.max(r.people, Math.floor(rnd(20, r.cap)));
      }
      if (Math.random() < 0.25){
        r.people = clamp(r.people + Math.floor(rnd(-4, 5)), 0, r.cap);
      }
      // AUTO-OPTIMIZER: empty room + auto mode → AC and lights OFF
      if (r.auto){
        var shouldBeOn = r.people > 0;
        if (r.hvacOn && !shouldBeOn){ r.hvacOn = false; shutoffs.push({ b: b.name, r: r.name }); }
        if (r.lightOn && !shouldBeOn){ r.lightOn = false; }
        if (!r.hvacOn && shouldBeOn){ r.hvacOn = true; }
        if (!r.lightOn && shouldBeOn){ r.lightOn = true; }
      }
      // SAVINGS: an empty powered-down room banks avoided energy every tick.
      // Room AC = 2.4 kW, lights = 0.5 kW. One tick = 5 sim-minutes = 1/12 hour.
      if (r.people === 0 && !r.hvacOn && !r.lightOn){
        state.savedKWh += (2.4 + 0.5) / 12;
      }
    });

    // building load = base + rooms actually consuming power (× scenario)
    var roomLoad = 0;
    b.rooms.forEach(function(r){
      if (r.hvacOn) roomLoad += 2.4 * state.scen.ac;
      if (r.lightOn) roomLoad += 0.5 * state.scen.light;
    });
    b.loadNow = b.baseLoad + roomLoad * rnd(0.9, 1.1);
    // v6 exam-week: late-evening study bump for the library
    if (state.scen.exam && b.name === "Library"){
      var hh = state.simMin / 60;
      if (hh >= 18 && hh <= 23) b.loadNow *= 1.35;
    }

    // battery: surplus solar charges it, deficit drains it
    var net = b.solarNow - b.loadNow;                 // + = surplus, − = deficit
    b.battery = clamp(b.battery + (net / b.batteryKWh) * 100 * (5/60) * 3, 8, 100);

    totalGen += b.solarNow; totalLoad += b.loadNow;
  });

  // chart history (keep last 60 points = 2 sim-hours)
  state.history.push({gen: totalGen, load: totalLoad});
  if (state.history.length > 60) state.history.shift();

  // market price drifts with supply vs demand
  var sellers = state.offers.length, buyers = state.buys.length;
  state.prevPrice = state.price;
  var target = 7 + (buyers - sellers) * 0.8 + rnd(-0.3, 0.3);
  state.price = clamp(state.price + (target - state.price) * 0.25, 4, 14);

  // the market "lives": buildings auto-post offers/requests now and then
  if (state.tickN % 4 === 0) autoMarket();

  // carbon counter creeps up as clean energy flows
  state.co2 += 0.0004 + Math.random() * 0.0003;

  // leaderboard scores drift a little each tick so the ranking feels alive
  state.scores.forEach(function(s){ s.score = clamp(s.score + rnd(-0.4, 0.45), 40, 99); });

  // student rewards: room consumption drifts; points awarded hourly when under pace
  tickRewards();
  if (state.tickN % 12 === 0) awardPoints();

  // blackout island mode: drain / solar-recharge the backup countdown
  tickEmergency();

  // v6: explain the auto-shutoffs (cooldown: max 1 log per 30 sim-minutes)
  // (skipped during time-lapse play so the feed doesn't flood)
  if (!tmPlaying && shutoffs.length && state.simMin - state.lastShutoffLog >= 30){
    state.lastShutoffLog = state.simMin;
    var s0 = shutoffs[0];
    logDecision("snow", "Shut off <b>" + s0.r + "</b> (" + s0.b + ") AC + lights — room empty"
      + (shutoffs.length > 1 ? " (+" + (shutoffs.length - 1) + " more rooms auto-powered-down)" : ""));
  }

  // v6: anomaly detection (night drain, peer outliers) with cooldowns
  // (skipped during time-lapse play — cooldowns expire too fast to be meaningful)
  if (!tmPlaying) checkAnomalies();

  renderAll(false);
}

// ---------- MARKET: the peer-to-peer energy credit exchange ----------
// 1 credit = 1 kWh. Buildings with full batteries sell; hungry ones buy.

// The market "breathes": every few ticks, buildings auto-post offers/requests
// based on their battery level, so the order book never looks dead.
function autoMarket(){
  // cap the book so it doesn't grow forever
  if (state.offers.length > 8 || state.buys.length > 8) return;
  var b = state.buildings[Math.floor(Math.random() * state.buildings.length)];
  if (b.battery > 75 && Math.random() < 0.7){
    var q = Math.floor(rnd(10, 40));
    state.offers.push({ id: state.nextId++, bldg: b.name, qty: q,
                        price: fmt(state.price + rnd(-0.5, 1), 2), auto: true });
  } else if (b.battery < 30 && Math.random() < 0.7){
    var q2 = Math.floor(rnd(10, 40));
    state.buys.push({ id: state.nextId++, bldg: b.name, qty: q2,
                      price: fmt(state.price + rnd(-1, 0.5), 2), auto: true });
  }
  // auto entries expire after a while so the book stays fresh
  if (state.offers.length > 10) state.offers.shift();
  if (state.buys.length > 10) state.buys.shift();
}

function findBldg(name){
  for (var i = 0; i < state.buildings.length; i++)
    if (state.buildings[i].name === name) return state.buildings[i];
  return null;
}

// One-click buy: the BUYER is "you" — we pick the hungriest building
// (lowest battery) as the buyer so the demo always makes sense.
function buyOffer(id){
  var idx = -1;
  for (var i = 0; i < state.offers.length; i++)
    if (state.offers[i].id === id){ idx = i; break; }
  if (idx < 0){ toast("That offer is gone — someone beat you to it!", "warn"); return; }
  var o = state.offers[idx];

  // buyer = building with the lowest battery (not the seller itself)
  var buyer = null;
  state.buildings.forEach(function(b){
    if (b.name === o.bldg) return;
    if (!buyer || b.battery < buyer.battery) buyer = b;
  });
  var cost = o.qty * parseFloat(o.price);
  if (buyer.rupees < cost){
    toast(buyer.name + " can't afford " + rs(cost) + "!", "bad"); return;
  }
  var seller = findBldg(o.bldg);
  buyer.rupees -= cost; buyer.credits += o.qty;
  seller.rupees += cost; seller.credits -= o.qty;
  state.offers.splice(idx, 1);
  logTx(buyer.name + " bought " + o.qty + " credits from " + seller.name, cost);
  logDecision("exchange", "Bought <b>" + o.qty + " credits</b> from " + seller.name + " — cheapest offer at ₹" + o.price);
  tradeParticle(seller.name, buyer.name);
  toast("Bought <b>" + o.qty + " credits</b> from " + seller.name + " for <b>" + rs(cost) + "</b>");
  renderAll(true);
}

// Post-your-own-offer form
function postOffer(){
  var bldg = el("f-bldg").value;
  var qty = parseInt(el("f-qty").value, 10);
  var price = parseFloat(el("f-price").value);
  var b = findBldg(bldg);
  if (!qty || qty < 1){ toast("Enter at least 1 credit.", "warn"); return; }
  if (!price || price < 1){ toast("Enter a sensible price (₹1–₹20).", "warn"); return; }
  if (b.credits < qty){ toast(bldg + " only has " + b.credits + " credits!", "bad"); return; }
  state.offers.unshift({ id: state.nextId++, bldg: bldg, qty: qty, price: fmt(price, 2), auto: false });
  toast("Offer posted: <b>" + qty + " credits</b> from " + bldg + " at ₹" + fmt(price, 2));
  renderAll(true);
}

// The scripted one-click demo trade: CSE Block → Library, 20 credits.
function demoTrade(){
  var seller = findBldg("CSE Academic Block"), buyer = findBldg("Library");
  var qty = 20, cost = qty * state.price;
  if (seller.credits < qty) seller.credits = qty;   // never let the demo fail
  if (buyer.rupees < cost) buyer.rupees = cost;
  seller.credits -= qty; seller.rupees += cost;
  buyer.credits += qty; buyer.rupees -= cost;
  logTx("DEMO: " + buyer.name + " bought " + qty + " credits from " + seller.name, cost);
  logDecision("exchange", "Demo trade: <b>" + buyer.name + "</b> bought " + qty + " credits from " + seller.name + " at ₹" + fmt(state.price, 2));
  tradeParticle(seller.name, buyer.name);
  toast("<b>Demo trade done!</b> CSE Block → Library · " + qty + " credits · " + rs(cost));
  renderAll(true);
}

function logTx(text, amount){
  var d = new Date();
  var t = d.toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false});
  state.txs.unshift({ time: t, text: text, amount: amount });
  if (state.txs.length > 30) state.txs.pop();
}

// ---------- OPTIMIZER DEMO BUTTONS ----------
function classChange(){
  // "Class change": shuffle everyone — some rooms empty out, others fill up.
  state.buildings.forEach(function(b){
    b.rooms.forEach(function(r){
      r.people = Math.random() < 0.4 ? 0 : Math.floor(rnd(5, r.cap));
    });
  });
  toast("<b>Class change!</b> Students shuffled — watch ACs react.");
  renderAll(true);
}
function emptyAll(){
  state.buildings.forEach(function(b){
    b.rooms.forEach(function(r){ r.people = 0; });
  });
  toast("<b>All rooms emptied.</b> Watch the savings counter climb!", "warn");
  renderAll(true);
}
function fillAll(){
  state.buildings.forEach(function(b){
    b.rooms.forEach(function(r){ r.people = Math.floor(rnd(10, r.cap)); });
  });
  toast("<b>All rooms filled.</b> ACs and lights kick back on.");
  renderAll(true);
}
function fastForward(){
  // run 12 ticks (1 sim-hour) instantly, WITHOUT redrawing each time
  var realRender = renderAll;
  renderAll = function(){};
  try {
    for (var i = 0; i < 12; i++){
      state.tickN++;
      state.simMin += 5;
      if (state.simMin >= 24*60) state.simMin -= 24*60;
      tickRewards();   // room consumption keeps drifting during fast-forward
      var sun = sunFactor();
      state.buildings.forEach(function(b){
        b.solarNow = b.solarKW * sun * state.scen.solar;
        b.rooms.forEach(function(r){
          if (r.auto){
            var on = r.people > 0;
            r.hvacOn = on; r.lightOn = on;
          }
          if (r.people === 0 && !r.hvacOn && !r.lightOn) state.savedKWh += 2.9/12;
        });
        var rl = 0;
        b.rooms.forEach(function(r){ if (r.hvacOn) rl += 2.4 * state.scen.ac; if (r.lightOn) rl += 0.5 * state.scen.light; });
        b.loadNow = b.baseLoad + rl;
        var net = b.solarNow - b.loadNow;
        b.battery = clamp(b.battery + (net / b.batteryKWh) * 100 * (5/60) * 3, 8, 100);
      });
    }
  } finally { renderAll = realRender; }
  toast("<b>Fast-forwarded 1 hour.</b> Savings banked: " + fmt(state.savedKWh) + " kWh");
  renderAll(true);
}

// ---------- room steppers + toggles (the "it actually works" controls) ----------
function stepPeople(bi, ri, delta, rowEl){
  var r = state.buildings[bi].rooms[ri];
  r.people = clamp(r.people + delta, 0, r.cap);
  if (rowEl){ rowEl.classList.remove("rowflash"); void rowEl.offsetWidth; rowEl.classList.add("rowflash"); }
  renderAll(true);
}
function toggleDevice(bi, ri, which){
  var r = state.buildings[bi].rooms[ri];
  if (which === "hvac") r.hvacOn = !r.hvacOn; else r.lightOn = !r.lightOn;
  r.auto = false;   // manual override turns auto mode off for this room
  toast((which === "hvac" ? "HVAC " : "Lights ") + (r.auto ? "" : "manually ") +
        ((which === "hvac" ? r.hvacOn : r.lightOn) ? "<b>ON</b>" : "<b>OFF</b>") +
        " in " + r.name + " (auto mode off)", "warn");
  renderAll(true);
}
function toggleAuto(bi, ri){
  var r = state.buildings[bi].rooms[ri];
  r.auto = !r.auto;
  toast("Auto mode <b>" + (r.auto ? "ON" : "OFF") + "</b> for " + r.name);
  renderAll(true);
}

// ---------- STUDENT REWARDS: the nudge app ----------
// Every room gets 5 kWh/day. Stay under → earn GreenPoints → redeem at campus shops.
var CATALOG = [
  { id: "chai",     name: "Masala Chai",  shop: "Canteen",    cost: 20, icon: "cup" },
  { id: "samosa",   name: "Samosa (2 pc)", shop: "Canteen",   cost: 30, icon: "box" },
  { id: "coffee",   name: "Cold Coffee",  shop: "Canteen",    cost: 50, icon: "cup" },
  { id: "penset",   name: "Pen Set",      shop: "Stationery", cost: 40, icon: "pen" },
  { id: "notebook", name: "Notebook",     shop: "Stationery", cost: 60, icon: "book" }
];
// fake redemption code, e.g. GP-8F3K2 — show it at the shop counter
function gpCode(){
  var c = "GP-", chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (var i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}
// room consumption drifts up through the day; floor rivals jostle for points
function tickRewards(){
  var r = state.rewards;
  r.consumed = Math.min(r.consumed + rnd(0.01, 0.05), 9.99);
  r.floor.forEach(function(f){ f.pts = Math.max(0, Math.round(f.pts + rnd(-2, 3))); });
}
// once per sim-hour: under the pro-rata budget pace → earn GreenPoints (streak multiplier!)
function awardPoints(){
  var r = state.rewards;
  var pace = r.budget * (state.simMin / 1440);   // where consumption "should" be by now
  if (r.consumed < pace){
    var pts = Math.round(rnd(8, 14) * 1.5);      // 1.5x streak multiplier
    r.points += pts;
    var pv = el("gp-points");
    if (pv){ pv.classList.remove("coinpop"); void pv.offsetWidth; pv.classList.add("coinpop"); }
    toast("<b>+" + pts + " GreenPoints!</b> Under budget — streak multiplier applied");
    logDecision("leaf", "<b>+" + pts + " GreenPoints</b> to Room A-101 — under the daily budget pace, streak multiplier applied");
  }
}
function redeem(id){
  var item = null;
  CATALOG.forEach(function(c){ if (c.id === id) item = c; });
  if (!item) return;
  var r = state.rewards;
  if (r.points < item.cost){
    toast("Not enough GreenPoints for " + item.name + " — keep saving!", "bad"); return;
  }
  r.points -= item.cost;
  var code = gpCode();
  r.redemptions.unshift({ name: item.name, cost: item.cost, code: code });
  toast("<b>" + item.name + " redeemed!</b> Code <b>" + code + "</b> — show it at the " + item.shop.toLowerCase() + " counter.");
  renderAll(true);
}
function renderRewards(){
  var r = state.rewards;
  tweenNum(el("rw-kwh"), r.consumed, function(v){ return fmt(v, 2) + " kWh"; });
  var bar = el("rw-bar");
  bar.className = "bar" + (r.consumed > r.budget ? " over" : "");
  el("rw-bar-fill").style.width = Math.round(Math.min(100, r.consumed / r.budget * 100)) + "%";
  var st = el("rw-status");
  if (r.consumed <= r.budget){ st.className = "badge surplus"; st.textContent = "UNDER BUDGET"; }
  else { st.className = "badge over"; st.textContent = "OVER BUDGET"; }
  tweenNum(el("gp-points"), r.points, function(v){ return Math.round(v).toLocaleString("en-IN"); });
  el("rw-streak").textContent = r.streak + "-day green streak · 1.5x multiplier";

  // catalog (rebuilt every tick — redeem uses event delegation)
  var html = "";
  CATALOG.forEach(function(c){
    var afford = r.points >= c.cost;
    html += '<div class="reward"><div class="rw-ico">' + icon(c.icon) + '</div>'
      + '<div class="o-main"><b>' + c.name + '</b><small>' + c.shop + ' · ' + c.cost + ' pts</small></div>'
      + '<button class="btn sm' + (afford ? "" : " ghost") + '" data-redeem="' + c.id + '"'
      + (afford ? "" : " disabled") + '>Redeem</button></div>';
  });
  el("reward-catalog").innerHTML = html;

  // my redemptions
  var rl = el("redemption-list");
  if (!r.redemptions.length){
    rl.innerHTML = '<div style="color:var(--muted); font-size:13.5px;">Nothing redeemed yet — save energy, earn points!</div>';
  } else {
    html = "";
    r.redemptions.forEach(function(x){
      html += '<div class="tx"><span>' + icon('ticket') + ' ' + x.name + '</span><span class="qr">' + x.code + '</span>'
        + '<span class="t-amt">−' + x.cost + ' pts</span></div>';
    });
    rl.innerHTML = html;
  }

  // floor leaderboard, sorted, your room highlighted
  var order = r.floor.slice().sort(function(a, b){ return b.pts - a.pts; });
  html = "";
  order.forEach(function(f, i){
    html += '<div class="lb-row"' + (f.you ? ' style="background:var(--emerald-soft); border-radius:10px;"' : '')
      + '><div class="lb-rank" style="font-size:18px; width:36px;">' + (i + 1) + '</div>'
      + '<div class="lb-main"><b>' + f.room + '</b></div>'
      + '<div class="lb-score" style="font-size:17px;">' + f.pts + ' pts</div></div>';
  });
  el("floor-lb").innerHTML = html;
}

// ---------- EMERGENCY: blackout island mode ----------
// The grid "fails" → campus islands onto solar + batteries. Critical loads stay
// on, empty rooms shed automatically (occupancy data), countdown shows backup left.
function gridFailure(){
  var e = state.emergency;
  e.active = true; e.warned = false;
  // backup hours scale with the average battery charge across buildings
  var avg = 0;
  state.buildings.forEach(function(b){ avg += b.battery; });
  avg /= state.buildings.length;
  e.maxHrs = 8.5;
  e.backupHrs = 4 + (avg / 100) * 4.5;   // 4h – 8.5h depending on charge
  toast("<b>GRID FAILURE!</b> Island mode active — critical loads protected.", "bad");
  logDecision("alert", "<b>Island mode engaged</b> — shed non-critical loads, critical systems protected, running on solar + batteries", "warn");
  renderAll(true);
}
function restoreGrid(){
  state.emergency.active = false;
  toast("<b>Grid restored.</b> All loads back to normal — island mode stood down.");
  logDecision("check", "Grid restored — all loads back to normal, island mode stood down");
  renderAll(true);
}
// drains (or solar-recharges) the backup countdown on every tick
function tickEmergency(){
  var e = state.emergency;
  if (!e.active) return;
  if (sunFactor() > 0.3){
    e.backupHrs = Math.min(e.maxHrs, e.backupHrs + (5/60) * 0.8);  // solar refilling
  } else {
    e.backupHrs = Math.max(0, e.backupHrs - (5/60) * 1.0);        // draining
  }
  if (e.backupHrs <= 0.5 && !e.warned){
    e.warned = true;
    toast("<b>Battery reserves critical!</b> Restore the grid or await sunrise.", "warn");
  }
}
function renderEmergency(){
  var e = state.emergency;
  el("emg-banner").classList.toggle("on", e.active);
  el("view-emergency").classList.toggle("emg-active", e.active);
  el("btn-gridfail").style.display = e.active ? "none" : "";
  el("btn-restore").style.display = e.active ? "" : "none";
  el("emg-status-card").style.display = e.active ? "" : "none";

  if (e.active){
    el("emg-countdown").textContent = e.backupHrs.toFixed(1) + "h";
    el("emg-battfill").style.width = Math.round((e.backupHrs / e.maxHrs) * 100) + "%";
    var sun = sunFactor(), msg;
    if (sun > 0.3){
      msg = icon("sun") + " Solar is <b>refilling the batteries right now</b> — backup time recovering.";
    } else {
      var until6 = (((24*60 - state.simMin) + 6*60) % (24*60)) / 60;
      msg = icon("sun") + " Solar resumes in ~<b>" + until6.toFixed(1) + "h</b> — then batteries recharge.";
    }
    el("emg-solar").innerHTML = msg;
  }

  // building status board: on backup + what got shed, or on-grid standby
  var html = "";
  state.buildings.forEach(function(b){
    var empty = b.rooms.filter(function(r){ return r.people === 0; }).length;
    if (e.active){
      html += '<div class="lb-row"><div class="lb-rank emg-ic">' + icon('battery') + '</div>'
        + '<div class="lb-main"><b>' + b.name + '</b>'
        + '<small style="display:block; color:var(--muted); font-size:12px;">'
        + empty + ' empty room' + (empty === 1 ? '' : 's') + ' auto-shed · decorative lighting off</small></div>'
        + '<div><span class="badge surplus">ON BACKUP</span></div></div>';
    } else {
      html += '<div class="lb-row"><div class="lb-rank emg-ic">' + icon('bolt') + '</div>'
        + '<div class="lb-main"><b>' + b.name + '</b>'
        + '<small style="display:block; color:var(--muted); font-size:12px;">grid-connected · island standby ready</small></div>'
        + '<div><span class="badge" style="background:#13503F; color:var(--muted);">ON GRID</span></div></div>';
    }
  });
  el("emg-buildings").innerHTML = html;
}

// ---------- view switching ----------
var TITLES = { dashboard: "Live Campus Energy", optimizer: "Smart Optimizer", market: "Energy Market",
  rewards: "Student Rewards", emergency: "Emergency — Blackout Survival",
  holo: "3D Campus Hologram" };

// ---------- v7: RIGHT INFO PANEL — contextual per tab ----------
// Reads existing state only; no new simulation logic.
function spDonut(pct, label){
  var C = 326.73, p = Math.max(0, Math.min(100, pct));
  var off = (C * (1 - p / 100)).toFixed(1);
  return '<svg viewBox="0 0 120 120" class="sp-donut" role="img" aria-label="' + label + ' ' + Math.round(p) + '%">'
    + '<circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="12"/>'
    + '<circle cx="60" cy="60" r="52" fill="none" stroke="#10B981" stroke-width="12" stroke-linecap="round"'
    + ' stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off + '" transform="rotate(-90 60 60)"/>'
    + '<text x="60" y="62" text-anchor="middle" class="sp-donut-num">' + Math.round(p) + '%</text>'
    + '<text x="60" y="80" text-anchor="middle" class="sp-donut-sub">' + label + '</text></svg>';
}
function spTotals(){
  var tg = 0, tl = 0, tb = 0, cr = 0, cash = 0;
  state.buildings.forEach(function(b){ tg += b.solarNow; tl += b.loadNow; tb += b.battery; cr += b.credits; cash += b.rupees; });
  return { solar: tg, load: tl, batt: tb / state.buildings.length, credits: cr, cash: cash };
}
function spDashboard(){
  var t = spTotals();
  var feed = state.feed.slice(0, 4).map(function(f){
    return '<li>' + icon(f.icon) + '<span><b>' + f.t + '</b> &nbsp;' + f.text + '</span></li>';
  }).join("");
  return ''
  + '<div class="sp-promo"><h4>' + icon("bolt") + 'Power Mode</h4>'
  + '<div class="sp-big">Smart Saver <small>active</small></div>'
  + '<p class="sp-note">Batteries charge on cheap off-peak power and discharge through the evening peak.</p>'
  + '<div class="sp-row"><span>' + icon("sun") + 'Solar now</span><b>' + fmt(t.solar) + ' kW</b></div>'
  + '<div class="sp-row"><span>' + icon("chart") + 'Campus load</span><b>' + fmt(t.load) + ' kW</b></div>'
  + '<button class="btn sm" data-sp="scen" style="width:100%;margin-top:10px;justify-content:center;">' + icon("sliders") + 'Run scenarios</button></div>'
  + '<div class="sp-card"><h4>' + icon("battery") + 'Energy Storage</h4>'
  + spDonut(t.batt, "battery")
  + '<div class="sp-row"><span><span class="dot" style="background:#10B981"></span>Solar now</span><b>' + fmt(t.solar) + ' kW</b></div>'
  + '<div class="sp-row"><span><span class="dot" style="background:#F59E0B"></span>Load now</span><b>' + fmt(t.load) + ' kW</b></div></div>'
  + '<div class="sp-card"><h4>' + icon("list") + 'Live activity</h4><ul class="sp-list">' + feed + '</ul></div>';
}
function spOptimizer(){
  var savedRs = Math.round(state.savedKWh * 7);
  return ''
  + '<div class="sp-card"><h4>' + icon("coin") + 'Today’s savings</h4>'
  + '<div class="sp-big">₹' + savedRs.toLocaleString("en-IN") + '</div>'
  + '<p class="sp-note">' + fmt(state.savedKWh) + ' kWh avoided by smart shutoff.</p></div>'
  + '<div class="sp-card"><h4>' + icon("cpu") + 'AI tips</h4><ul class="sp-list">'
  + '<li>' + icon("sun") + '<span>Pre-cool labs before the 2 PM heat peak.</span></li>'
  + '<li>' + icon("battery") + '<span>Charge batteries 10 AM – 2 PM on solar surplus.</span></li>'
  + '<li>' + icon("moon") + '<span>Keep rooms on AUTO — empty rooms power down themselves.</span></li>'
  + '</ul></div>';
}
function spMarket(){
  var t = spTotals();
  var trades = state.txs.slice(0, 4).map(function(x){
    return '<li>' + icon("exchange") + '<span><b>' + x.time + '</b> &nbsp;' + x.text + '</span></li>';
  }).join("");
  if (!trades) trades = '<li>' + icon("info") + '<span>No trades yet — buy your first credits above.</span></li>';
  return ''
  + '<div class="sp-card"><h4>' + icon("wallet") + 'My wallet</h4>'
  + '<div class="sp-big">' + t.credits + ' <small>credits</small></div>'
  + '<div class="sp-row"><span>' + icon("coin") + 'Cash balance</span><b>' + rs(t.cash) + '</b></div>'
  + '<div class="sp-row"><span>' + icon("chart") + 'Price / credit</span><b>' + rs(state.price) + '</b></div></div>'
  + '<div class="sp-card"><h4>' + icon("list") + 'Recent trades</h4><ul class="sp-list">' + trades + '</ul></div>';
}
function spRewards(){
  var r = state.rewards, next = null;
  CATALOG.forEach(function(c){ if (c.cost > r.points && (!next || c.cost < next.cost)) next = c; });
  var nxt = next
    ? '<div class="sp-row"><span>' + icon(next.icon) + next.name + '</span><b>' + next.cost + ' pts</b></div>'
      + '<div class="sp-bar"><i style="width:' + Math.min(100, Math.round(r.points / next.cost * 100)) + '%"></i></div>'
      + '<p class="sp-note">' + (next.cost - r.points) + ' points to go.</p>'
    : '<p class="sp-note">Every reward unlocked — save more to stay ahead.</p>';
  return ''
  + '<div class="sp-card"><h4>' + icon("coin") + 'GreenPoints</h4>'
  + '<div class="sp-big">' + r.points + ' <small>pts</small></div>'
  + '<div style="margin-top:8px;"><span class="sp-pill">' + r.streak + '-day streak · 1.5×</span></div></div>'
  + '<div class="sp-card"><h4>' + icon("target") + 'Next reward</h4>' + nxt + '</div>';
}
function spEmergency(){
  var e = state.emergency;
  var status = e.active
    ? '<div class="sp-big">' + fmt(e.backupHrs) + ' <small>h backup</small></div>'
      + '<div class="sp-bar"><i style="width:' + Math.min(100, Math.round(e.backupHrs / e.maxHrs * 100)) + '%;background:#EF4444"></i></div>'
      + '<p class="sp-note">Island mode active — critical loads protected.</p>'
    : '<div class="sp-big">Standby <small>ready</small></div>'
      + '<p class="sp-note">Grid healthy. Hit “Simulate grid failure” to test island mode.</p>';
  var loads = ["Research labs", "Server room", "Emergency lighting", "Water pumps"].map(function(l){
    return '<li>' + icon("check") + '<span>' + l + '</span></li>';
  }).join("");
  return ''
  + '<div class="sp-card"><h4>' + icon("alert") + 'Backup status</h4>' + status + '</div>'
  + '<div class="sp-card"><h4>' + icon("shield") + 'Protected loads</h4><ul class="sp-list">' + loads + '</ul></div>';
}
function renderSidePanel(){
  var body = el("sidepanel-body");
  if (!body) return;
  var v = state.view || "dashboard";
  var html = v === "optimizer" ? spOptimizer()
    : v === "market" ? spMarket()
    : v === "rewards" ? spRewards()
    : v === "emergency" ? spEmergency()
    : v === "holo" ? spHolo() : spDashboard();
  body.innerHTML = html;
  var sc = body.querySelector('[data-sp="scen"]');
  if (sc) sc.addEventListener("click", function(){
    var t = document.getElementById("scenario-bar");
    if (t && t.scrollIntoView) t.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  var hcb = body.querySelectorAll(".holo-cinebtn");
  for (var hi = 0; hi < hcb.length; hi++) hcb[hi].addEventListener("click", holoToggleCine);
  var k = el("sp-kicker");
  if (k) k.textContent = "Context · " + (TITLES[v] || v);
}

function switchView(name){
  state.view = name;   // v7: drives the contextual side panel
  document.querySelectorAll(".nav-btn").forEach(function(b){
    b.classList.toggle("active", b.getAttribute("data-view") === name);
  });
  document.querySelectorAll(".view").forEach(function(v){
    v.classList.toggle("active", v.id === "view-" + name);
  });
  el("view-title").innerHTML = '<span class="vt-ico">' + icon(VIEW_ICONS[name]) + "</span>" + TITLES[name];
  if (name === "dashboard"){ drawChart(); drawForecast(); }   // forecast strip lives on the dashboard now
  if (name === "optimizer") drawSoC();                        // battery scheduler lives in the optimizer now
  holoSetActive(name === "holo");   // hologram loop runs only on its tab
  renderAll(true);
}

// ---------- RENDERING: redraw the screen from state ----------
// renderAll(true)  = user clicked something → redraw + flash changed cards
// renderAll(false) = background tick → redraw quietly (still visibly ticking)

var lastKpi = { solar: -1, load: -1, batt: -1, save: -1 };

function renderAll(flash){
  renderTopbar();
  renderDashboard(flash);
  renderCarbon();
  renderMap();          // v6: campus map glow
  renderFeed();         // v6: decision feed
  renderAlerts();       // v6: anomaly alerts
  renderScenarios();    // v6: scenario button states
  renderOptimizer();
  renderMarket();
  renderLeaderboard();
  renderForecast();
  renderBattery();
  renderRewards();
  renderEmergency();
  if (el("view-dashboard").classList.contains("active")){ drawChart(); drawForecast(); }
  if (el("view-optimizer").classList.contains("active")) drawSoC();
  renderSidePanel();   // v7: contextual right panel (live numbers every tick)
  if (typeof tmUpdateUI === "function") tmUpdateUI();   // time machine readout tracks the clock
}

function renderTopbar(){
  var h = Math.floor(state.simMin / 60), m = Math.floor(state.simMin % 60);
  el("sim-clock").textContent =
    (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m) + " IST";
  try {
    el("real-clock").textContent = new Date().toLocaleString("en-IN",
      { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short",
        hour: "2-digit", minute: "2-digit", hour12: true });
  } catch(e){ el("real-clock").textContent = ""; }
}

// ---------- dashboard ----------
function renderDashboard(flash){
  var tg = 0, tl = 0, tb = 0;
  state.buildings.forEach(function(b){ tg += b.solarNow; tl += b.loadNow; tb += b.battery; });
  var avgBatt = tb / state.buildings.length;
  var bm = baselineMode ? 1.35 : 1;   // showcase: baseline shows the wasteful campus (display only — state untouched)
  var bb = el("baseline-banner"); if (bb) bb.hidden = !baselineMode;

  setKpi("kpi-solar", "k-solar", tg, "kW", "k-solar-sub",
         state.simMin/60 >= 6 && state.simMin/60 <= 19 ? "sun is up" : "night — panels idle",
         lastKpi.solar, flash);
  lastKpi.solar = tg;
  setKpi("kpi-load", "k-load", tl * bm, "kW", "k-load-sub",
         baselineMode ? "no optimization — pure waste"
           : (tl > tg ? "load exceeds solar — batteries draining" : "solar covering load"),
         lastKpi.load, flash);
  lastKpi.load = tl;
  setKpi("kpi-batt", "k-batt", avgBatt, "%", "k-batt-sub",
         avgBatt > 60 ? "healthy reserve" : avgBatt > 30 ? "moderate — trade wisely" : "low — buy credits!",
         lastKpi.batt, flash);
  lastKpi.batt = avgBatt;
  var savedRs = baselineMode ? 0 : state.savedKWh * 7;
  setKpi("kpi-save", "k-save", savedRs, "₹", "k-save-sub",
         baselineMode ? "₹0 saved — nothing is optimized" : "by smart shutoff", lastKpi.save, flash);
  lastKpi.save = savedRs;

  // building cards
  var g = el("bldg-grid"), html = "";
  state.buildings.forEach(function(b, i){
    var dl = b.loadNow * bm;              // baseline inflates the displayed load
    var net = b.solarNow - dl;
    var surplus = net >= 0;
    html += '<div class="card bldg" id="bldg-' + i + '">'
      + '<h3>' + b.name + ' <span class="badge ' + (surplus ? "surplus" : "deficit") + '">'
      + (surplus ? "SURPLUS +" : "DEFICIT ") + fmt(Math.abs(net)) + ' kW</span></h3>'
      + '<div class="row"><span>' + icon("sun") + ' Solar now</span><b>' + fmt(b.solarNow) + ' kW</b></div>'
      + '<div class="row"><span>' + icon("buildings") + ' Load</span><b>' + fmt(dl) + ' kW</b></div>'
      + '<div class="row"><span>' + icon("users") + ' People inside</span><b>' + b.rooms.reduce(function(a,r){return a+r.people;},0) + '</b></div>'
      + '<div class="row"><span>' + icon("battery") + ' Battery</span><b>' + Math.round(b.battery) + '%</b></div>'
      + '<div class="bar' + (b.battery < 30 ? " low" : "") + '"><div style="width:' + Math.round(b.battery) + '%"></div></div>'
      + '</div>';
  });
  g.innerHTML = html;
  if (flash){
    state.buildings.forEach(function(b, i){
      var c = el("bldg-" + i);
      if (c){ c.classList.remove("flash"); void c.offsetWidth; c.classList.add("flash"); }
    });
  }
}

// ---------- JUICE: tween numbers instead of jumping ----------
// In a real browser, values glide to their new reading over ~0.5s (easeOutCubic).
// In headless test envs (no requestAnimationFrame) we just set the final value.
var __hasRaf = (typeof requestAnimationFrame === "function");
function tweenNum(elm, to, fmtFn){
  if (!elm) return;
  if (!__hasRaf){ elm.textContent = fmtFn(to); return; }
  var from = parseFloat(String(elm.textContent).replace(/[^0-9.\-]/g, ""));
  if (!isFinite(from)) from = 0;
  if (Math.abs(to - from) < 0.0005){ elm.textContent = fmtFn(to); return; }
  if (elm._tween) cancelAnimationFrame(elm._tween);
  var t0 = null, dur = 550;
  function step(ts){
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    elm.textContent = fmtFn(from + (to - from) * e);
    elm._tween = (p < 1) ? requestAnimationFrame(step) : null;
  }
  elm._tween = requestAnimationFrame(step);
}

function setKpi(cardId, valId, newVal, unit, subId, subText, oldVal, flash){
  tweenNum(el(valId), newVal, function(v){
    return unit === "₹" ? rs(v) : unit === "%" ? Math.round(v) + "%" : fmt(v) + " " + unit;
  });
  el(subId).textContent = subText;
  if (flash && oldVal >= 0 && Math.abs(newVal - oldVal) > 0.001){
    var c = el(cardId);
    c.classList.remove("flash"); void c.offsetWidth; c.classList.add("flash");
  }
}

// ---------- hand-drawn live chart (no libraries) ----------
function drawChart(){
  var cv = el("chart");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var W = cv.width, H = cv.height, pad = 34;
  ctx.clearRect(0, 0, W, H);

  var data = state.history;
  if (data.length < 2){
    ctx.fillStyle = "#8FE6C2"; ctx.font = "15px Segoe UI";
    ctx.fillText("Collecting live data…", pad + 10, H/2);
    return;
  }
  var maxV = 1;
  data.forEach(function(p){ maxV = Math.max(maxV, p.gen, p.load); });
  maxV *= 1.15;

  function X(i){ return pad + (W - pad - 12) * i / 59; }       // 60 slots
  function Y(v){ return H - pad - (H - pad - 16) * v / maxV; }

  // gridlines + labels
  ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.fillStyle = "#8FE6C2"; ctx.font = "11px Segoe UI";
  ctx.lineWidth = 1;
  for (var gi = 0; gi <= 4; gi++){
    var v = maxV * gi / 4, y = Y(v);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 12, y); ctx.stroke();
    ctx.fillText(Math.round(v) + " kW", 4, y + 4);
  }
  // the two lines
  line(ctx, data, "gen", "#10b981", X, Y);
  line(ctx, data, "load", "#f59e0b", X, Y);
  // glowing dot on the newest point of each line
  dot(ctx, data, "gen", "#10b981", X, Y);
  dot(ctx, data, "load", "#f59e0b", X, Y);
  // TIME MACHINE: vertical "now" marker at the scrubbed hour
  if (typeof tmEngaged !== "undefined" && tmEngaged){
    var nx = X(59);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(nx, 14); ctx.lineTo(nx, H - pad); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 11px Segoe UI";
    ctx.fillText("now " + simClock(), Math.max(pad, nx - 64), 24);
    ctx.restore();
  }
}
function line(ctx, data, key, color, X, Y){
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
  var off = 60 - data.length;   // right-align short histories
  data.forEach(function(p, i){
    var x = X(off + i), y = Y(p[key]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}
function dot(ctx, data, key, color, X, Y){
  var p = data[data.length - 1];
  var x = X(59), y = Y(p[key]);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
  ctx.fillStyle = color + "44"; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill();
}

// ---------- FORECAST: the "brain" ----------
// Predicted solar: bell curve peaking ~1pm. Predicted load: morning + evening peaks.
// Pure simulation, labeled SIM MODE in the UI.
function forecastData(){
  var totalSolar = 0, totalBase = 0;
  state.buildings.forEach(function(b){ totalSolar += b.solarKW; totalBase += b.baseLoad; });
  var sol = [], load = [];
  for (var h = 0; h < 24; h++){
    var sf = (h < 6 || h > 19) ? 0 : Math.sin(Math.PI * (h - 6) / 13);
    var wmul = (WX.ok && WX.mul && WX.mul.length > h) ? WX.mul[h] : 1;  // showcase: live weather scales the solar curve
    sol.push(totalSolar * sf * 0.92 * wmul);
    var l = 0.45 + 0.35 * Math.exp(-Math.pow(h - 9, 2) / 6) + 0.55 * Math.exp(-Math.pow(h - 20, 2) / 8);
    load.push(totalBase * l * 1.9);
  }
  return { sol: sol, load: load };
}
function hr(h){ return h === 0 ? "12am" : h < 12 ? h + "am" : h === 12 ? "12pm" : (h - 12) + "pm"; }

function drawForecast(){
  var cv = el("forecast-chart");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var W = cv.width, H = cv.height, pad = 34;
  ctx.clearRect(0, 0, W, H);
  var d = forecastData();
  var maxV = 1;
  for (var i = 0; i < 24; i++) maxV = Math.max(maxV, d.sol[i], d.load[i]);
  maxV *= 1.15;
  function X(i){ return pad + (W - pad - 12) * i / 23; }
  function Y(v){ return H - pad - (H - pad - 16) * v / maxV; }
  ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.fillStyle = "#8FE6C2"; ctx.font = "11px Segoe UI"; ctx.lineWidth = 1;
  for (var gi = 0; gi <= 4; gi++){
    var v = maxV * gi / 4, y = Y(v);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 12, y); ctx.stroke();
    ctx.fillText(Math.round(v) + " kW", 4, y + 4);
  }
  for (var h = 0; h < 24; h += 3) ctx.fillText(hr(h), X(h) - 12, H - 10);
  // soft fill under the solar curve
  ctx.beginPath();
  for (var j = 0; j < 24; j++){ var x = X(j), y2 = Y(d.sol[j]); if (j === 0) ctx.moveTo(x, y2); else ctx.lineTo(x, y2); }
  ctx.lineTo(X(23), Y(0)); ctx.lineTo(X(0), Y(0)); ctx.closePath();
  ctx.fillStyle = "rgba(16,185,129,.12)"; ctx.fill();
  fline(ctx, d.sol, "#10b981", X, Y);
  fline(ctx, d.load, "#f59e0b", X, Y);
  ctx.fillStyle = "#34D399"; ctx.font = "bold 12px Segoe UI";
  ctx.fillText("solar peak ~1pm", X(13) - 110, Y(d.sol[13]) - 12);
  // TIME MACHINE: highlight the scrubbed hour on the 24h forecast
  if (typeof tmEngaged !== "undefined" && tmEngaged){
    var ch = clamp(Math.floor(state.simMin / 60), 0, 23);
    var fx = X(ch);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(fx, 10); ctx.lineTo(fx, H - pad); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 11px Segoe UI";
    ctx.fillText(simClock(), Math.max(pad, fx - 18), 20);
    ctx.restore();
  }
}
function fline(ctx, arr, color, X, Y){
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
  arr.forEach(function(v, i){ var x = X(i), y = Y(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();
}

function renderForecast(){
  var d = forecastData();
  var start = -1, end = -1;
  for (var h = 0; h < 24; h++){ if (d.sol[h] > d.load[h]){ if (start < 0) start = h; end = h; } }
  var hrs = end - start + 1;
  el("rec-grid").innerHTML =
    '<div class="card rec"><h4>' + icon("sun") + ' Charge batteries ' + hr(start) + '–' + hr(end) + ' during solar surplus</h4>'
    + '<p>Solar out-produces campus load for ~' + hrs + ' hours midday. Soak every spare kW into batteries instead of exporting it cheap.</p>'
    + '<div class="impact">≈ ' + rs(hrs * 14 * 7) + ' / day potential</div></div>'
    + '<div class="card rec"><h4>' + icon("snow") + ' Pre-cool before the 6–10pm tariff peak</h4>'
    + '<p>Drop building temps an extra 1°C during cheap solar hours, then coast through the ₹11/kWh evening peak with ACs throttled back.</p>'
    + '<div class="impact">≈ ' + rs(2600) + ' / month saved</div></div>';
}

// ---------- CARBON STRIP: the small emotional hook ----------
function renderCarbon(){
  var co2t = el("co2-text"), cot = el("co2-val"), trt = el("trees-val");
  if (baselineMode){
    // showcase: baseline shows the unoptimized footprint instead of savings
    if (cot) cot.textContent = fmt(state.co2 * 1.6, 2) + " t";
    if (trt) trt.textContent = "0";
    if (co2t) co2t.innerHTML = "<b>" + fmt(state.co2 * 1.6, 2) + " t</b> CO₂ emitted this month — no optimization &nbsp;·&nbsp; baseline";
    return;
  }
  if (cot) cot.textContent = fmt(state.co2, 2) + " t";
  if (trt) trt.textContent = Math.round(state.co2 * 46).toLocaleString("en-IN");
  if (co2t) co2t.innerHTML = "<b>" + fmt(state.co2, 2) + " t</b> CO₂ saved this month &nbsp;≈&nbsp; <b>" + Math.round(state.co2 * 46).toLocaleString("en-IN") + "</b> trees planted";
}

// ---------- LEADERBOARD: greenest building, weekly ----------
// Score = solar self-use + auto-shutoff savings + battery health (simulated drift).
function renderLeaderboard(){
  var order = state.scores.slice().sort(function(a, b){ return b.score - a.score; });
  var html = "";
  order.forEach(function(s, i){
    var note = i === 0 ? "leading the campus" : i === order.length - 1 ? "needs a boost" : "holding steady";
    html += '<div class="lb-row"><div class="lb-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</div>'
      + '<div class="lb-main"><b>' + s.name + '</b><small>' + note + '</small>'
      + '<div class="lb-bar"><div style="width:' + Math.round(s.score) + '%"></div></div></div>'
      + '<div class="lb-score">' + fmt(s.score, 1) + '</div></div>';
  });
  el("lb-list").innerHTML = html;
}

// ---------- BATTERY SCHEDULER: money intelligence ----------
// "c" = charge, "d" = discharge (peak shaving), "i" = idle. One entry per hour.
function buildSched(){
  var s = [];
  for (var h = 0; h < 24; h++){
    if (h <= 5 || h === 23) s.push("c");              // cheap night grid
    else if (h >= 10 && h <= 15) s.push("c");         // midday solar surplus
    else if (h >= 18 && h <= 22) s.push("d");         // evening tariff peak
    else s.push("i");
  }
  return s;
}
function buildSmartSched(){
  var s = [];
  for (var h = 0; h < 24; h++){
    if (h <= 5 || h === 23) s.push("c");
    else if (h >= 10 && h <= 15) s.push("c");
    else if ((h >= 8 && h <= 9) || (h >= 17 && h <= 22)) s.push("d");  // extra peak shaving
    else s.push("i");
  }
  return s;
}
function currentSched(){ return state.smartBatt ? buildSmartSched() : buildSched(); }
function socCurve(sched){
  var soc = [50], v;
  for (var h = 0; h < 24; h++){
    v = soc[h] + (sched[h] === "c" ? 9 : sched[h] === "d" ? -11 : -1.5);
    soc.push(clamp(v, 8, 100));
  }
  return soc;  // 25 points: midnight → midnight
}
function renderBattery(){
  var sched = currentSched();
  var cls = { c: "charge", d: "discharge", i: "idle" };
  var html = "";
  for (var h = 0; h < 24; h++) html += '<div class="h ' + cls[sched[h]] + '"></div>';
  el("sched24").innerHTML = html;
  var ax = "";
  for (var h2 = 0; h2 < 24; h2++) ax += '<div>' + (h2 % 3 === 0 ? h2 + "h" : "") + '</div>';
  el("sched-axis").innerHTML = ax;
  el("sched-tag").textContent = state.smartBatt ? "smart · optimized" : "standard";
  tweenNum(el("batt-save"), state.smartBatt ? 12600 : 8400, rs);
  el("batt-save-sub").textContent = state.smartBatt ? "smart schedule active" : "standard schedule";
  el("batt-peak").textContent = state.smartBatt ? "17%" : "38%";
}
function drawSoC(){
  var cv = el("soc-chart");
  if (!cv || !cv.getContext) return;
  var soc = socCurve(currentSched());
  var ctx = cv.getContext("2d"), W = cv.width, H = cv.height, pad = 34;
  ctx.clearRect(0, 0, W, H);
  function X(i){ return pad + (W - pad - 12) * i / 24; }
  function Y(v){ return H - pad - (H - pad - 16) * v / 100; }
  ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.fillStyle = "#8FE6C2"; ctx.font = "11px Segoe UI"; ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(function(v){
    var y = Y(v);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 12, y); ctx.stroke();
    ctx.fillText(v + "%", 6, y + 4);
  });
  ctx.beginPath();
  soc.forEach(function(v, i){ var x = X(i), y = Y(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.lineTo(X(24), Y(0)); ctx.lineTo(X(0), Y(0)); ctx.closePath();
  ctx.fillStyle = state.smartBatt ? "rgba(16,185,129,.14)" : "rgba(245,158,11,.14)"; ctx.fill();
  ctx.strokeStyle = state.smartBatt ? "#10b981" : "#f59e0b"; ctx.lineWidth = 2.5; ctx.beginPath();
  soc.forEach(function(v, i){ var x = X(i), y = Y(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();
}
function runSmartSchedule(){
  state.smartBatt = !state.smartBatt;
  el("btn-schedule").innerHTML = state.smartBatt ? icon("check") + " Smart schedule running — tap to revert" : icon("bolt") + " Run smart schedule";
  if (state.smartBatt){
    toast("<b>Smart schedule ON!</b> Extra peak-shaving 8–10am + from 5pm → <b>+₹4,200/month</b> projected.");
    logDecision("battery", "Charging batteries on the <b>smart schedule</b> — tariff peaks at 6 PM (₹11/kWh) and the forecast shows the evening dip coming");
  } else {
    toast("Back to the standard schedule.", "warn");
    logDecision("undo", "Battery scheduler back to the standard schedule");
  }
  renderAll(true);
}

// ---------- optimizer ----------
function renderOptimizer(){
  var sv = el("save-kwh"), sr = el("save-rs");
  var newKwh = fmt(state.savedKWh) + " kWh", newRs = rs(state.savedKWh * 7);
  if (sv.textContent !== newKwh){
    sv.textContent = newKwh;
    sv.classList.remove("bump"); void sv.offsetWidth; sv.classList.add("bump");  // visible "jump"
  }
  sr.textContent = newRs;

  var tb = el("room-tbody"), html = "";
  state.buildings.forEach(function(b, bi){
    html += '<tr><td colspan="5" style="background:#13503F; font-weight:800; font-size:13px; '
          + 'letter-spacing:.5px; color:#6ee7b7;">' + b.name.toUpperCase() + '</td></tr>';
    b.rooms.forEach(function(r, ri){
      var occ = r.people > 0;
      html += '<tr id="room-' + bi + '-' + ri + '">'
        + '<td><b>' + r.name + '</b></td>'
        + '<td><span class="stepper">'
        + '<button data-act="dec" data-bi="' + bi + '" data-ri="' + ri + '" aria-label="fewer people">−</button>'
        + '<span class="n">' + r.people + '</span>'
        + '<button data-act="inc" data-bi="' + bi + '" data-ri="' + ri + '" aria-label="more people">+</button>'
        + '</span> <span class="pill ' + (occ ? "occ" : "off") + '">' + (occ ? "OCCUPIED" : "EMPTY") + '</span></td>'
        + '<td><button class="toggle' + (r.hvacOn ? " on" : "") + '" data-act="hvac" data-bi="' + bi + '" data-ri="' + ri + '" aria-label="toggle AC"></button> '
        + '<span class="pill ' + (r.hvacOn ? "on" : "off") + '">' + (r.hvacOn ? "ON" : "OFF") + '</span></td>'
        + '<td><button class="toggle' + (r.lightOn ? " on" : "") + '" data-act="light" data-bi="' + bi + '" data-ri="' + ri + '" aria-label="toggle lights"></button> '
        + '<span class="pill ' + (r.lightOn ? "on" : "off") + '">' + (r.lightOn ? "ON" : "OFF") + '</span></td>'
        + '<td><button class="toggle' + (r.auto ? " on" : "") + '" data-act="auto" data-bi="' + bi + '" data-ri="' + ri + '" aria-label="toggle auto mode"></button></td>'
        + '</tr>';
    });
  });
  tb.innerHTML = html;
}

// ---------- market ----------
function renderMarket(){
  var dir = el("mk-dir");
  el("mk-price").textContent = "₹" + fmt(state.price, 2);
  if (state.price > state.prevPrice + 0.01){ dir.textContent = "▲ rising"; dir.className = "t-dir up"; }
  else if (state.price < state.prevPrice - 0.01){ dir.textContent = "▼ falling"; dir.className = "t-dir down"; }
  else { dir.textContent = "— steady"; dir.className = "t-dir"; }

  el("sell-count").textContent = state.offers.length;
  el("buy-count").textContent = state.buys.length;

  var sl = el("sell-list"), html = "";
  if (!state.offers.length) html = '<div style="color:var(--muted); font-size:13.5px;">No sell offers right now.</div>';
  state.offers.forEach(function(o){
    html += '<div class="offer" id="offer-' + o.id + '"><div class="o-main"><b>' + o.bldg + '</b>'
      + '<small>' + o.qty + ' credits' + (o.auto ? ' · auto-listed' : ' · you posted this') + '</small></div>'
      + '<span class="o-price">₹' + o.price + '</span>'
      + '<button class="btn sm" data-buy="' + o.id + '">Buy</button></div>';
  });
  sl.innerHTML = html;

  var bl = el("buy-list"); html = "";
  if (!state.buys.length) html = '<div style="color:var(--muted); font-size:13.5px;">No buy requests right now.</div>';
  state.buys.forEach(function(o){
    html += '<div class="offer"><div class="o-main"><b>' + o.bldg + '</b>'
      + '<small>wants ' + o.qty + ' credits · will pay up to ₹' + o.price + '</small></div>'
      + '<span class="o-price" style="color:var(--amber);">₹' + o.price + '</span></div>';
  });
  bl.innerHTML = html;

  var wg = el("wallet-grid"); html = "";
  state.buildings.forEach(function(b){
    html += '<div class="wallet"><b>' + b.name + '</b>'
      + '<div class="w-row"><span>' + icon("bolt") + ' Credits</span><span><b>' + b.credits + '</b></span></div>'
      + '<div class="w-row"><span>' + icon("coin") + ' Cash</span><span>' + rs(b.rupees) + '</span></div></div>';
  });
  wg.innerHTML = html;

  var tx = el("tx-log");
  if (state.txs.length){
    html = "";
    state.txs.forEach(function(t, i){
      html += '<div class="tx' + (i === 0 ? " new" : "") + '"><span class="t-time">' + t.time + '</span>'
        + '<span>' + t.text + '</span><span class="t-amt">' + rs(t.amount) + '</span></div>';
    });
    tx.innerHTML = html;
  }

  // offer form building dropdown (rebuild cheaply; keeps selection)
  var sel = el("f-bldg"), cur = sel.value;
  var sh = "";
  state.buildings.forEach(function(b){ sh += '<option' + (b.name === cur ? " selected" : "") + '>' + b.name + '</option>'; });
  sel.innerHTML = sh;
}

// ---------- click wiring: ONE delegated listener, everything clickable ----------
function wireEvents(){
  document.querySelectorAll(".nav-btn").forEach(function(b){
    b.addEventListener("click", function(){ switchView(b.getAttribute("data-view")); });
  });
  el("btn-class").addEventListener("click", classChange);
  el("btn-empty").addEventListener("click", emptyAll);
  el("btn-fill").addEventListener("click", fillAll);
  el("btn-ff").addEventListener("click", fastForward);
  el("btn-post").addEventListener("click", postOffer);
  el("btn-demotrade").addEventListener("click", demoTrade);

  // room table: steppers + toggles (event delegation — works after every re-render)
  el("room-tbody").addEventListener("click", function(e){
    var t = e.target.closest("[data-act]");
    if (!t) return;
    var bi = parseInt(t.getAttribute("data-bi"), 10);
    var ri = parseInt(t.getAttribute("data-ri"), 10);
    var act = t.getAttribute("data-act");
    var row = t.closest("tr");
    if (act === "inc") stepPeople(bi, ri, 1, row);
    else if (act === "dec") stepPeople(bi, ri, -1, row);
    else if (act === "hvac") toggleDevice(bi, ri, "hvac");
    else if (act === "light") toggleDevice(bi, ri, "light");
    else if (act === "auto") toggleAuto(bi, ri);
  });

  // market buy buttons (delegation too)
  el("sell-list").addEventListener("click", function(e){
    var t = e.target.closest("[data-buy]");
    if (t) buyOffer(parseInt(t.getAttribute("data-buy"), 10));
  });

  // battery smart-schedule button
  el("btn-schedule").addEventListener("click", runSmartSchedule);

  // v6: scenario buttons (delegation-free — buttons exist once in the DOM)
  document.querySelectorAll("#scenario-bar [data-scen]").forEach(function(b){
    b.addEventListener("click", function(){ setScenario(b.getAttribute("data-scen")); });
  });

  // v6: anomaly alert dismiss buttons (delegation — cards re-render every tick)
  el("alert-list").addEventListener("click", function(e){
    var t = e.target.closest("[data-dismiss]");
    if (t) dismissAlert(parseInt(t.getAttribute("data-dismiss"), 10));
  });

  // emergency: grid failure simulation + restore
  el("btn-gridfail").addEventListener("click", gridFailure);
  el("btn-restore").addEventListener("click", restoreGrid);

  // rewards catalog redeem buttons (delegation — catalog re-renders every tick)
  el("reward-catalog").addEventListener("click", function(e){
    var t = e.target.closest("[data-redeem]");
    if (t) redeem(t.getAttribute("data-redeem"));
  });

  // showcase: splash intro (dismiss on button, backdrop click, or any key)
  el("splash-enter").addEventListener("click", dismissSplash);
  el("splash").addEventListener("click", function(e){ if (e.target === el("splash")) dismissSplash(); });
  document.addEventListener("keydown", function(){ dismissSplash(); });

  // showcase: auto-demo mode
  el("btn-demo").addEventListener("click", startDemo);
  el("btn-demostop").addEventListener("click", stopDemo);

  // showcase: before/after baseline toggle
  document.querySelectorAll("#baseline-toggle .seg-btn").forEach(function(b){
    b.addEventListener("click", function(){ setBaseline(b.getAttribute("data-base") === "off"); });
  });

  // showcase: forecast city picker → refetch live weather
  el("wx-city").addEventListener("change", function(){
    var v = (el("wx-city").value || "28.61,77.20").split(",");
    WX.lat = parseFloat(v[0]); WX.lon = parseFloat(v[1]);
    fetchWeather();
  });

  // TIME MACHINE: scrubber + transport controls
  el("tm-slider").addEventListener("input", function(){
    tmScrub(parseFloat(el("tm-slider").value), true);
  });
  el("tm-slider").addEventListener("change", function(){
    tmScrub(parseFloat(el("tm-slider").value), false);
  });
  el("tm-play").addEventListener("click", function(){ tmPlaying ? tmPause() : tmPlay(); });
  el("tm-live").addEventListener("click", function(){ tmRelease(false); });
}

// ============================================================
// TIME MACHINE: 24-hour scrubber — drag through the day, watch the campus breathe.
// Additive only. Reuses sunFactor()/simClock()/tick()/renderAll() — no parallel sim logic.
// ============================================================
var tmEngaged = false;   // true while the user holds the clock (scrubbed or playing)
var tmPlaying = false;   // true during time-lapse playback
var tmTimer = null;

// contextual label for an hour of day
function tmDesc(h){
  if (h < 5)    return "Deep night · grid + batteries";
  if (h < 6.5)  return "Dawn · panels waking up";
  if (h < 10)   return "Morning ramp · demand rising";
  if (h < 16)   return "Midday · solar peak";
  if (h < 18.5) return "Afternoon · surplus hours";
  if (h < 21)   return "Evening peak · batteries discharging";
  return "Night · quiet campus";
}

// day/night ambience tint for the campus map: [fill, opacity]
function dayTint(h){
  if (h < 5 || h >= 21) return ["#0a1226", 0.50];  // deep night
  if (h < 6.5)          return ["#b45309", 0.14];  // dawn glow
  if (h < 10)           return ["#f59e0b", 0.05];  // morning
  if (h < 16)           return ["#0a1226", 0.00];  // midday, crystal clear
  if (h < 18.5)         return ["#f59e0b", 0.07];  // golden afternoon
  if (h < 21)           return ["#7c2d12", 0.22];  // dusk
  return ["#0a1226", 0.50];
}

// redraw the time machine bar from the sim clock (called by renderAll every tick)
function tmUpdateUI(){
  var h = state.simMin / 60;
  var slider = el("tm-slider");
  if (slider) slider.value = h.toFixed(2);
  var fill = el("tm-fill");
  if (fill) fill.style.width = (h / 24 * 100) + "%";
  var clk = el("tm-clock");
  if (clk) clk.textContent = simClock();
  var sky = el("tm-sky");
  if (sky) sky.innerHTML = icon(h >= 6 && h < 19 ? "sun" : "moon");
  var lab = el("tm-label");
  if (lab) lab.textContent = tmDesc(h);
  var st = el("tm-state");
  if (st){
    st.textContent = tmEngaged ? (tmPlaying ? "PLAYING" : "HELD") : "LIVE";
    st.className = "tm-state" + (tmEngaged ? " held" : "");
  }
  var live = el("tm-live");
  if (live) live.hidden = !tmEngaged;
  var play = el("tm-play");
  if (play){
    play.innerHTML = icon(tmPlaying ? "pause" : "play");
    play.setAttribute("aria-label", tmPlaying ? "Pause time-lapse" : "Play time-lapse");
  }
}

// user drags the slider: hold the clock at that hour and re-render everything.
// `live` = true while the thumb is moving (no feed spam); false on release → log once.
function tmScrub(h, live){
  if (tmPlaying) tmPause();
  if (!tmEngaged){
    tmEngaged = true;
    toast("Time held — drag to scrub the day, or press play for a time-lapse.");
  }
  state.simMin = Math.round(clamp(h, 0, 24) * 60) % (24 * 60);
  tick(true);          // recompute loads/solar/map from the new hour, no clock advance
  tmUpdateUI();
  if (!live) logDecision("clock", "Time scrubbed to <b>" + simClock() + "</b> — " + tmDesc(h).toLowerCase());
}

// one playback step: +15 sim-minutes. Called every 250ms → ~1 sim-hour per real second.
function tmStep(){
  var nm = state.simMin + 15;
  if (nm >= 24 * 60){
    tmPause();
    toast("Day complete — 24:00 reached. Scrub back or go live.");
    return;
  }
  state.simMin = nm;
  tick(true);
  tmUpdateUI();
}

function tmPlay(){
  if (tmPlaying) return;
  if (state.simMin >= 24 * 60 - 1) state.simMin = 0;   // finished a sweep? restart at midnight
  tmEngaged = true;
  tmPlaying = true;
  tmUpdateUI();
  toast("Time-lapse: sweeping 24 hours in ~24 seconds.");
  tmTimer = setInterval(function(){ try { if (tmPlaying) tmStep(); } catch(e){} }, 250);
}

function tmPause(){
  tmPlaying = false;
  if (tmTimer){ clearInterval(tmTimer); tmTimer = null; }
  tmUpdateUI();
}

// release the clock back to the normal 2s real-time advance
function tmRelease(silent){
  if (tmPlaying) tmPause();
  if (!tmEngaged) return;
  tmEngaged = false;
  if (!silent) toast("Back to live — clock running in real time.");
  tmUpdateUI();
  renderAll(false);
}

// ============================================================
// SHOWCASE: 4 demo-power features (additive only — existing logic untouched)
// 1. auto-demo mode · 2. before/after baseline toggle · 3. live weather feed · 4. splash intro
// ============================================================

// ---------- 2. BEFORE/AFTER TOGGLE ----------
var baselineMode = false;   // display-layer flag: true = show the wasteful campus without GridPulse
function setBaseline(on){
  if (baselineMode === on) return;
  baselineMode = on;
  document.querySelectorAll("#baseline-toggle .seg-btn").forEach(function(b){
    b.classList.toggle("active", (b.getAttribute("data-base") === "off") === on);
  });
  if (on){
    logDecision("info", "<b>Baseline mode</b> — showing the same campus <b>without</b> GridPulse (simulated waste)");
    toast("<b>Baseline:</b> this is the campus without GridPulse.", "warn");
  } else {
    toast("<b>GridPulse optimization restored.</b>");
  }
  renderAll(true);
}

// ---------- 1. AUTO-DEMO MODE ----------
var demoActive = false, demoTimers = [];
var DEMO_STEPS = [
  { t: 0,     view: "dashboard", kick: "01 · SEE",
    text: "Every building, live — watch the campus breathe." },
  { t: 8000,  view: "optimizer", kick: "02 · SAVE",
    text: "Empty rooms, AC off — savings climb on their own.",
    fn: function(){ emptyAll(); } },
  { t: 16000, view: "dashboard", kick: "02 · SAVE",
    text: "Heatwave hits — watch the whole system adapt.",
    fn: function(){ setScenario("heatwave"); } },
  { t: 26000, view: "market", kick: "03 · TRADE",
    text: "Surplus becomes credits — watch energy move across the map.",
    fn: function(){ demoTrade(); } },
  { t: 36000, view: "rewards", kick: "04 · EARN",
    text: "Students earn GreenPoints for beating their energy budget." },
  { t: 44000, view: "emergency", kick: "05 · SURVIVE",
    text: "Kill the grid — the campus runs on sun and batteries.",
    fn: function(){ gridFailure(); } },
  { t: 54000, kick: "05 · SURVIVE",
    text: "…and bring it back. Critical loads never blinked.",
    fn: function(){ restoreGrid(); } },
  { t: 60000, view: "dashboard", kick: "GRIDPULSE",
    text: "See, save, trade, earn, survive — campus energy, together." }
];
function demoCaption(i){
  var s = DEMO_STEPS[i];
  el("dc-kicker").textContent = s.kick;
  el("dc-text").textContent = s.text;
  var dots = "";
  for (var k = 0; k < DEMO_STEPS.length; k++) dots += '<i class="' + (k <= i ? "on" : "") + '"></i>';
  el("dc-dots").innerHTML = dots;
}
function runDemoStep(i){
  if (!demoActive) return;
  var s = DEMO_STEPS[i];
  try {
    if (s.view) switchView(s.view);
    if (s.fn) s.fn();
    demoCaption(i);
  } catch (err) { /* one bad step never kills the demo */ }
}
function startDemo(){
  if (demoActive) return;
  if (typeof tmRelease === "function") tmRelease(true);   // guided demo wants the live clock
  demoActive = true;
  el("demo-caption").classList.add("show");
  var b = el("btn-demo"); if (b) b.disabled = true;
  logDecision("play", "<b>Guided demo started</b> — five chapters, about a minute");
  DEMO_STEPS.forEach(function(s, i){
    demoTimers.push(setTimeout(function(){ runDemoStep(i); }, s.t));
  });
  demoTimers.push(setTimeout(stopDemo, DEMO_STEPS[DEMO_STEPS.length - 1].t + 7000));
}
function stopDemo(){
  if (!demoActive) return;
  demoActive = false;
  demoTimers.forEach(function(id){ try { clearTimeout(id); } catch(e){} });
  demoTimers = [];
  el("demo-caption").classList.remove("show");
  var b = el("btn-demo"); if (b) b.disabled = false;
  try {
    if (state.emergency.active) restoreGrid();
    if (state.scen.name !== "normal") setScenario("normal");
  } catch(e){}
}

// ---------- 3. REAL WEATHER FEED (Open-Meteo — optional, offline-safe) ----------
// The file must keep working via double-click with no network: fetch is guarded,
// failures fall back silently to the simulated solar curve, and the LIVE badge
// only appears after a real successful response.
var WX = { lat: 28.61, lon: 77.20, ok: false, mul: null, temp: null };
function renderWxBadge(){
  var b = el("wx-badge"); if (!b) return;
  if (WX.ok){
    b.textContent = "LIVE WEATHER";
    b.style.color = "#34D399"; b.style.borderColor = "rgba(52,211,153,.5)";
  } else {
    b.textContent = "predicted · sim";
    b.style.color = ""; b.style.borderColor = "";
  }
  var t = el("wx-temp");
  if (t) t.textContent = (WX.ok && WX.temp !== null) ? "· " + Math.round(WX.temp) + "°C now" : "";
}
function applyWeather(j){
  var h = j && j.hourly; if (!h) return;
  var cc = h.cloudcover, sw = h.shortwave_radiation, mul = [];
  for (var i = 0; i < 24; i++){
    var m = 1;
    if (sw && typeof sw[i] === "number") m = clamp(sw[i] / 850, 0, 1);
    else if (cc && typeof cc[i] === "number") m = clamp(1 - cc[i] / 100 * 0.95, 0.05, 1);
    mul.push(m);
  }
  WX.mul = mul; WX.ok = true;
  try { WX.temp = (j.current && typeof j.current.temperature_2m === "number") ? j.current.temperature_2m : null; }
  catch(e){ WX.temp = null; }
  renderWxBadge();
  try { drawForecast(); } catch(e){}
}
function fetchWeather(){
  WX.ok = false; WX.mul = null; WX.temp = null;
  renderWxBadge();
  if (typeof fetch === "undefined") return;   // offline double-click / restricted env: stay simulated
  var url = "https://api.open-meteo.com/v1/forecast?latitude=" + WX.lat + "&longitude=" + WX.lon
    + "&hourly=cloudcover,shortwave_radiation&current=temperature_2m&timezone=auto";
  try {
    var ctl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var done = false;
    var timer = setTimeout(function(){ if (!done && ctl){ try { ctl.abort(); } catch(e){} } }, 8000);
    fetch(url, ctl ? { signal: ctl.signal } : undefined).then(function(r){ return r.json(); }).then(function(j){
      done = true; clearTimeout(timer);
      try { applyWeather(j); } catch(e){}
    }).catch(function(){ done = true; clearTimeout(timer); /* silent fallback to simulated curve */ });
  } catch(e){ /* never let weather break the app */ }
}

// ---------- 4. SPLASH INTRO ----------
function dismissSplash(){
  var s = el("splash");
  if (!s || s.classList.contains("hide")) return;
  s.classList.add("hide");
}

// ---------- 6. HOLOGRAPHIC 3D CAMPUS ----------
// Hand-rolled mini 3D engine on a 2D canvas: yaw/pitch rotation, perspective
// projection, painter's-algorithm face sorting. Zero dependencies, offline-safe.
var HOLO = {
  yaw: 0.65, pitch: 0.60, dist: 96,
  layer: 'split', cine: true, lastDrag: 0,
  raf: 0, sweep: 0.0, scanY: 0, sel: -1, bound: false
};
var HOLO_MAXKW = 60;   // heat-scale normalization (largest baseLoad in the sim)
// Imaginary campus quad. sim = index into state.buildings, -1 = decorative.
var HOLO_LAYOUT = [
  { x: -22, z: -15, floors: 2, sim: -1, label: "Sports Complex" },
  { x:   0, z: -15, floors: 4, sim:  2, label: "CSE Academic Block" },
  { x:  22, z: -15, floors: 2, sim: -1, label: "Auditorium" },
  { x: -22, z:   0, floors: 5, sim:  0, label: "Hostel Block A" },
  { x:  22, z:   0, floors: 5, sim:  1, label: "Hostel Block B" },
  { x: -22, z:  15, floors: 3, sim:  3, label: "Library" },
  { x:   0, z:  15, floors: 2, sim:  4, label: "Canteen" },
  { x:  22, z:  15, floors: 3, sim:  5, label: "Admin Block" }
];
HOLO.blds = HOLO_LAYOUT.map(function(L, i){
  return { bi: i, x: L.x, z: L.z, w: 11, d: 11, h: L.floors * 3.4, sim: L.sim, label: L.label };
});

function holoRGB(t){
  t = clamp(t, 0, 1);
  var c1 = [0,229,160], c2 = [245,166,35], c3 = [255,90,60], c, k;
  if (t < 0.5){ k = t / 0.5;
    c = [c1[0]+(c2[0]-c1[0])*k, c1[1]+(c2[1]-c1[1])*k, c1[2]+(c2[2]-c1[2])*k];
  } else { k = (t - 0.5) / 0.5;
    c = [c2[0]+(c3[0]-c2[0])*k, c2[1]+(c3[1]-c2[1])*k, c2[2]+(c3[2]-c2[2])*k];
  }
  return [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])];
}
function holoHeat(t){ var c = holoRGB(t); return 'rgb('+c[0]+','+c[1]+','+c[2]+')'; }
function holoHeatA(t, a){ var c = holoRGB(t); return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'; }
function holoHash(s){
  var h = 0;
  for (var i = 0; i < s.length; i++){ h = ((h * 31) + s.charCodeAt(i)) | 0; }
  return (h >>> 0) / 4294967295;
}
// live values, read straight from the sim — no new simulation logic
function holoKW(bi){
  var L = HOLO.blds[bi];
  if (L.sim < 0) return 9 + 3 * Math.sin(state.simMin / 53 + bi * 1.7);  // decorative idle shimmer
  return state.buildings[L.sim].loadNow;
}
function holoOccFrac(bi){
  var L = HOLO.blds[bi];
  if (L.sim < 0) return 0.25;
  var b = state.buildings[L.sim], occ = 0, i;
  for (i = 0; i < b.rooms.length; i++) if (b.rooms[i].people > 0) occ++;
  return occ / b.rooms.length;
}
function holoRank(si){
  var order = state.buildings.map(function(b, i){ return i; })
    .sort(function(a, b){ return state.buildings[b].loadNow - state.buildings[a].loadNow; });
  return order.indexOf(si) + 1;
}

// camera: orbit around (0,7,0)
function holoCam(W, H){
  var cp = Math.cos(HOLO.pitch), sp = Math.sin(HOLO.pitch);
  var px = HOLO.dist*cp*Math.sin(HOLO.yaw), py = HOLO.dist*sp + 8, pz = HOLO.dist*cp*Math.cos(HOLO.yaw);
  var fx = 0-px, fy = 7-py, fz = 0-pz;
  var fl = Math.sqrt(fx*fx + fy*fy + fz*fz) || 1; fx/=fl; fy/=fl; fz/=fl;
  var rx = -fz, ry = 0, rz = fx;
  var rl = Math.sqrt(rx*rx + ry*ry + rz*rz) || 1; rx/=rl; ry/=rl; rz/=rl;
  var ux = ry*fz - rz*fy, uy = rz*fx - rx*fz, uz = rx*fy - ry*fx;
  return { px:px, py:py, pz:pz, fx:fx, fy:fy, fz:fz, rx:rx, ry:ry, rz:rz,
           ux:ux, uy:uy, uz:uz, f: (H*0.5)/Math.tan(25*Math.PI/180), cx: W/2, cy: H/2 };
}
function holoProject(p, cam){
  var vx = p[0]-cam.px, vy = p[1]-cam.py, vz = p[2]-cam.pz;
  var cx = vx*cam.rx + vy*cam.ry + vz*cam.rz;
  var cy = vx*cam.ux + vy*cam.uy + vz*cam.uz;
  var cz = vx*cam.fx + vy*cam.fy + vz*cam.fz;
  if (cz < 0.5) return null;
  var s = cam.f / cz;
  return [cam.cx + cx*s, cam.cy - cy*s, cz];
}
function holoLine(ctx, cam, a, b, style, width){
  var s1 = holoProject(a, cam), s2 = holoProject(b, cam);
  if (!s1 || !s2) return;
  ctx.strokeStyle = style; ctx.lineWidth = width || 1;
  ctx.beginPath(); ctx.moveTo(s1[0], s1[1]); ctx.lineTo(s2[0], s2[1]); ctx.stroke();
}
function holoBilerp(P, u, v){
  var x = (P[0][0]*(1-u) + P[1][0]*u)*(1-v) + (P[3][0]*(1-u) + P[2][0]*u)*v;
  var y = (P[0][1]*(1-u) + P[1][1]*u)*(1-v) + (P[3][1]*(1-u) + P[2][1]*u)*v;
  return [x, y];
}
// window quads on a building's side faces; lit state is stable per room+hour
function holoWindows(ctx, fc, L, hour, warm){
  var P = fc.sp, frac = holoOccFrac(L.bi), r, c;
  for (r = 0; r < 3; r++) for (c = 0; c < 4; c++){
    var lit = holoHash(L.label + ':' + fc.fi + ':' + r + ':' + c + ':' + Math.floor(hour)) < frac;
    var A = holoBilerp(P, (c+0.18)/4, (r+0.18)/3), B = holoBilerp(P, (c+0.82)/4, (r+0.18)/3);
    var C = holoBilerp(P, (c+0.82)/4, (r+0.82)/3), D = holoBilerp(P, (c+0.18)/4, (r+0.82)/3);
    ctx.beginPath();
    ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.lineTo(C[0],C[1]); ctx.lineTo(D[0],D[1]);
    ctx.closePath();
    ctx.fillStyle = lit ? (warm ? 'rgba(255,196,110,0.9)' : 'rgba(255,205,120,0.95)')
                        : 'rgba(0,229,160,0.10)';
    ctx.fill();
  }
}
function holoSweep(ctx, cam){
  var R = 42, N = 14, i, a0 = HOLO.sweep - 0.5;
  var c0 = holoProject([0, 0.1, 0], cam);
  if (!c0) return;
  ctx.beginPath(); ctx.moveTo(c0[0], c0[1]);
  for (i = 0; i <= N; i++){
    var a = a0 + 0.5 * i / N;
    var p = holoProject([R*Math.cos(a), 0.1, R*Math.sin(a)], cam);
    if (p) ctx.lineTo(p[0], p[1]);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,229,160,0.055)'; ctx.fill();
  var e1 = holoProject([R*Math.cos(a0+0.5), 0.1, R*Math.sin(a0+0.5)], cam);
  if (e1){ ctx.strokeStyle = 'rgba(0,229,160,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(e1[0], e1[1]); ctx.stroke(); }
}

function holoRender(){
  var cv = el('holo-canvas');
  if (!cv || !cv.parentElement) return;
  var W = cv.parentElement.clientWidth, H = cv.parentElement.clientHeight;
  if (!W || !H) return;
  var dpr = 1;
  try { dpr = Math.min(2, window.devicePixelRatio || 1); } catch(e){}
  var pw = Math.round(W*dpr), ph = Math.round(H*dpr);
  if (cv.width !== pw || cv.height !== ph){ cv.width = pw; cv.height = ph; }
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#04120D'; ctx.fillRect(0, 0, W, H);
  var cam = holoCam(W, H);
  var hour = state.simMin / 60, g, gx;
  // ---- floor grid
  for (g = -44; g <= 44; g += 8){
    holoLine(ctx, cam, [g,0,-44], [g,0,44], 'rgba(0,229,160,0.10)');
    holoLine(ctx, cam, [-44,0,g], [44,0,g], 'rgba(0,229,160,0.10)');
  }
  // central plaza ring
  ctx.beginPath();
  for (g = 0; g <= 40; g++){
    var pa = g/40 * Math.PI*2;
    var pp = holoProject([9*Math.cos(pa), 0.05, 9*Math.sin(pa)], cam);
    if (pp){ if (g === 0) ctx.moveTo(pp[0], pp[1]); else ctx.lineTo(pp[0], pp[1]); }
  }
  ctx.closePath(); ctx.strokeStyle = 'rgba(0,229,160,0.28)'; ctx.lineWidth = 1.2; ctx.stroke();
  // radar sweep + drifting scanline
  holoSweep(ctx, cam);
  HOLO.scanY = ((HOLO.scanY || 0) + 1.1) % (H + 80);
  ctx.fillStyle = 'rgba(0,229,160,0.05)';
  ctx.fillRect(0, HOLO.scanY - 40, W, 2);

  // ---- heat + edge colors per building
  var heatT = [], edgeCol = [], bi;
  for (bi = 0; bi < HOLO.blds.length; bi++){
    var t = clamp(holoKW(bi) / HOLO_MAXKW, 0, 1);
    heatT[bi] = t;
    edgeCol[bi] = (HOLO.layer === 'occupancy') ? 'rgba(0,229,160,0.85)' : holoHeat(t);
  }
  // under-glow ellipses on the ground (radial gradients = hologram light)
  for (bi = 0; bi < HOLO.blds.length; bi++){
    (function(L, t){
      var s = holoProject([L.x, 0.2, L.z], cam);
      var e = holoProject([L.x + L.w, 0.2, L.z], cam);
      if (!s || !e) return;
      var rad = Math.max(8, Math.hypot(e[0]-s[0], e[1]-s[1]) * 0.95);
      var gr = ctx.createRadialGradient(s[0], s[1], 0, s[0], s[1], rad);
      gr.addColorStop(0, holoHeatA(t, 0.30)); gr.addColorStop(1, holoHeatA(t, 0));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.ellipse(s[0], s[1], rad, rad*0.42, 0, 0, Math.PI*2); ctx.fill();
    })(HOLO.blds[bi], heatT[bi]);
  }
  // ---- collect + sort faces (painter's algorithm)
  var faces = [];
  HOLO.blds.forEach(function(L){
    var hw = L.w/2, hd = L.d/2, h = L.h, x = L.x, z = L.z;
    var c = [
      [x-hw,0,z-hd],[x+hw,0,z-hd],[x+hw,0,z+hd],[x-hw,0,z+hd],
      [x-hw,h,z-hd],[x+hw,h,z-hd],[x+hw,h,z+hd],[x-hw,h,z+hd]
    ];
    var F = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[1,2,6,5],[0,3,7,4]];
    F.forEach(function(f, fi){
      faces.push({ pts: [c[f[0]],c[f[1]],c[f[2]],c[f[3]]], bi: L.bi, fi: fi, side: fi >= 2 });
    });
  });
  faces.forEach(function(fc){
    fc.sp = fc.pts.map(function(p){ return holoProject(p, cam); });
    fc.ok = fc.sp[0] && fc.sp[1] && fc.sp[2] && fc.sp[3];
    if (fc.ok) fc.depth = (fc.sp[0][2] + fc.sp[1][2] + fc.sp[2][2] + fc.sp[3][2]) / 4;
  });
  faces.sort(function(a, b){ return (b.ok ? b.depth : -1e9) - (a.ok ? a.depth : -1e9); });
  var showWin = (HOLO.layer === 'occupancy' || HOLO.layer === 'split');
  faces.forEach(function(fc){
    if (!fc.ok) return;
    var L = HOLO.blds[fc.bi], P = fc.sp, col = edgeCol[fc.bi];
    ctx.beginPath();
    ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]);
    ctx.lineTo(P[2][0], P[2][1]); ctx.lineTo(P[3][0], P[3][1]); ctx.closePath();
    ctx.fillStyle = (fc.fi === 1) ? 'rgba(0,229,160,0.07)' : 'rgba(2,12,9,0.72)';
    ctx.fill();
    if (fc.side && showWin) holoWindows(ctx, fc, L, hour, HOLO.layer === 'split');
    ctx.strokeStyle = col;
    ctx.globalAlpha = (HOLO.sel === fc.bi) ? 1 : 0.8;
    ctx.lineWidth = (HOLO.sel === fc.bi) ? 2.4 : 1.2;
    ctx.stroke(); ctx.globalAlpha = 1;
  });
  // ---- floating labels
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  HOLO.blds.forEach(function(L, bi){
    var top = holoProject([L.x, L.h, L.z], cam);
    if (!top) return;
    var lx = top[0], ly = top[1] - 30;
    ctx.strokeStyle = 'rgba(0,229,160,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(top[0], top[1] - 3); ctx.lineTo(lx, ly + 14); ctx.stroke();
    ctx.fillStyle = 'rgba(215,239,228,0.92)';
    ctx.fillText(L.label.toUpperCase(), lx, ly);
    ctx.fillStyle = holoHeat(heatT[bi]);
    ctx.fillText(holoKW(bi).toFixed(1) + ' kW' + (L.sim < 0 ? ' · SIM' : ''), lx, ly + 14);
  });
}

// ---- interaction: orbit / zoom / pick ----
function holoBind(){
  var cv = el('holo-canvas');
  if (!cv || HOLO.bound) return;
  HOLO.bound = true;
  var drag = null, moved = 0, pointers = {};
  function pinchDist(){
    var ids = Object.keys(pointers);
    if (ids.length < 2) return 0;
    var a = pointers[ids[0]], b = pointers[ids[1]];
    return Math.hypot(a[0]-b[0], a[1]-b[1]);
  }
  cv.addEventListener('pointerdown', function(e){
    try { if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); } catch(err){}
    pointers[e.pointerId] = [e.clientX, e.clientY];
    drag = { x: e.clientX, y: e.clientY, pinch: pinchDist() };
    moved = 0;
    HOLO.lastDrag = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  });
  cv.addEventListener('pointermove', function(e){
    if (!pointers[e.pointerId] || !drag) return;
    pointers[e.pointerId] = [e.clientX, e.clientY];
    var ids = Object.keys(pointers);
    if (ids.length >= 2){
      var d = pinchDist();
      if (drag.pinch > 0 && d > 0) HOLO.dist = clamp(HOLO.dist * (drag.pinch / d), 34, 150);
      drag.pinch = d; moved += 4;
      HOLO.lastDrag = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      return;
    }
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    moved += Math.abs(dx) + Math.abs(dy);
    HOLO.yaw -= dx * 0.006;
    HOLO.pitch = clamp(HOLO.pitch + dy * 0.004, 0.15, 1.2);
    drag.x = e.clientX; drag.y = e.clientY;
    HOLO.lastDrag = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  });
  function up(e){
    delete pointers[e.pointerId];
    if (drag && moved < 6) holoPick(e);
    drag = null;
  }
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', function(e){
    e.preventDefault();
    HOLO.dist = clamp(HOLO.dist * (1 + e.deltaY * 0.001), 34, 150);
    HOLO.lastDrag = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }, { passive: false });
  // toolbar
  var seg = cv.parentElement.querySelectorAll('[data-hlayer]');
  for (var i = 0; i < seg.length; i++){
    (function(btn){
      btn.addEventListener('click', function(){
        HOLO.layer = btn.getAttribute('data-hlayer');
        for (var j = 0; j < seg.length; j++) seg[j].classList.toggle('active', seg[j] === btn);
      });
    })(seg[i]);
  }
  el('holo-cine').addEventListener('click', holoToggleCine);
  el('holo-zin').addEventListener('click', function(){ HOLO.dist = clamp(HOLO.dist - 12, 34, 150); });
  el('holo-zout').addEventListener('click', function(){ HOLO.dist = clamp(HOLO.dist + 12, 34, 150); });
  el('holo-cardx').addEventListener('click', holoHideCard);
}
function holoToggleCine(){
  HOLO.cine = !HOLO.cine;
  var t = 'Cinematic: ' + (HOLO.cine ? 'ON' : 'OFF');
  var a = el('holo-cine'); if (a) a.textContent = t;
  var btns = document.querySelectorAll('.holo-cinebtn');
  for (var i = 0; i < btns.length; i++) btns[i].textContent = t;
}
function holoPick(e){
  var cv = el('holo-canvas');
  if (!cv || !cv.parentElement) return;
  var r = cv.getBoundingClientRect ? cv.getBoundingClientRect() : { left: 0, top: 0 };
  var mx = e.clientX - r.left, my = e.clientY - r.top;
  var W = cv.parentElement.clientWidth, H = cv.parentElement.clientHeight;
  if (!W || !H) return;
  var cam = holoCam(W, H), best = -1, bd = 52, bi;
  for (bi = 0; bi < HOLO.blds.length; bi++){
    var L = HOLO.blds[bi];
    var s = holoProject([L.x, L.h * 0.6, L.z], cam);
    if (!s) continue;
    var d = Math.hypot(s[0] - mx, s[1] - my);
    if (d < bd){ bd = d; best = bi; }
  }
  HOLO.sel = best;
  if (best >= 0) holoShowCard(best); else holoHideCard();
}
function holoShowCard(bi){
  var L = HOLO.blds[bi], rows, kw = holoKW(bi);
  if (L.sim >= 0){
    var b = state.buildings[L.sim], occ = 0, i;
    for (i = 0; i < b.rooms.length; i++) if (b.rooms[i].people > 0) occ++;
    rows = '<div class="holo-kv"><span>Live load</span><b>' + kw.toFixed(1) + ' kW</b></div>'
      + '<div class="holo-kv"><span>Rooms occupied</span><b>' + occ + ' / ' + b.rooms.length + '</b></div>'
      + '<div class="holo-kv"><span>Energy rank</span><b>#' + holoRank(L.sim) + ' of 6</b></div>'
      + '<div class="holo-kv"><span>Battery</span><b>' + Math.round(b.battery) + '%</b></div>';
  } else {
    rows = '<div class="holo-kv"><span>Live load</span><b>' + kw.toFixed(1) + ' kW</b></div>'
      + '<div class="holo-kv"><span>Status</span><b>SIM decorative</b></div>';
  }
  el('holo-card-name').textContent = L.label;
  el('holo-card-rows').innerHTML = rows;
  el('holo-card').hidden = false;
}
function holoHideCard(){ var c = el('holo-card'); if (c) c.hidden = true; HOLO.sel = -1; }

// ---- animation loop: runs ONLY while the holo tab is active ----
function holoLoop(){
  if (state.view !== 'holo'){ HOLO.raf = 0; return; }
  try {
    var now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (HOLO.cine && now - HOLO.lastDrag > 10000) HOLO.yaw += 0.0028;
    HOLO.sweep += 0.012;
    holoRender();
    var ck = el('holo-clock'); if (ck) ck.textContent = simClock();
  } catch(e){}
  if (typeof requestAnimationFrame !== 'undefined') HOLO.raf = requestAnimationFrame(holoLoop);
  else HOLO.raf = 0;
}
function holoSetActive(on){
  holoBind();
  if (on){
    if (!HOLO.raf && typeof requestAnimationFrame !== 'undefined') HOLO.raf = requestAnimationFrame(holoLoop);
  } else if (HOLO.raf){
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(HOLO.raf);
    HOLO.raf = 0;
  }
}

// ---------- v7: 3D CAMPUS side panel (reads existing state only) ----------
function spHolo(){
  var top3 = state.buildings.map(function(b){ return { n: b.name, kw: b.loadNow }; })
    .sort(function(a, b){ return b.kw - a.kw; }).slice(0, 3).map(function(r){
      return '<li>' + icon('bolt') + '<span><b>' + r.n + '</b> &nbsp;' + r.kw.toFixed(1) + ' kW</span></li>';
    }).join('');
  return '<div class="sp-card"><h4>' + icon('box') + 'Holo legend</h4>'
    + '<div class="sp-row"><span><span class="dot" style="background:#00E5A0"></span>Low load</span><b>&lt; 20 kW</b></div>'
    + '<div class="sp-row"><span><span class="dot" style="background:#F5A623"></span>Medium</span><b>20&ndash;40 kW</b></div>'
    + '<div class="sp-row"><span><span class="dot" style="background:#FF5A3C"></span>High</span><b>&gt; 40 kW</b></div></div>'
    + '<div class="sp-card"><h4>' + icon('chart') + 'Top consumers</h4><ul class="sp-list">' + top3 + '</ul></div>'
    + '<div class="sp-card"><h4>' + icon('play') + 'Cinematic orbit</h4>'
    + '<button class="btn sm ghost holo-cinebtn" style="width:100%;justify-content:center;">Cinematic: ON</button>'
    + '<p class="sp-note">Slow auto-orbit. Dragging pauses it for 10 seconds.</p></div>';
}

// ---------- INIT ----------
function init(){
  // leaderboard starting scores, one per building
  state.scores = state.buildings.map(function(b){ return { name: b.name, score: rnd(68, 94) }; });
  wireEvents();
  // v6: seed the decision feed so it never looks empty on load
  logDecision("bolt", "GridPulse online — monitoring <b>6 buildings, 24 rooms</b>, ticking every 2 seconds");
  logDecision("cpu", "Auto-shutoff armed — empty rooms will power themselves down");
  renderAll(true);
  toast("<b>GridPulse is live.</b> Watch the numbers tick — everything is simulated.");
  // the heartbeat: every 2 real seconds. try/catch = demo-proof.
  setInterval(function(){
    try { tick(); } catch (err) { /* one bad tick never kills the demo */ }
  }, 2000);
  // showcase: live weather feed (offline-safe — silent fallback to simulated curve)
  fetchWeather();
  setInterval(fetchWeather, 600000);   // refresh every 10 minutes
}
init();
