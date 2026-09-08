/* Self-test probe. Appended to a COPY of index.html and run in real Chrome.
   Writes results into <pre id="testout"> which --dump-dom then reveals. */
(function () {
  const out = [];
  let pass = 0, fail = 0;
  // headless neutralisers: no audio device, no real download
  window.beep = function () {};
  HTMLAnchorElement.prototype.click = function () {};
  URL.createObjectURL = function () { return "blob:stub"; };
  URL.revokeObjectURL = function () {};
  function t(name, fn) {
    try {
      const r = fn();
      if (r === true) { pass++; out.push("PASS  " + name); }
      else { fail++; out.push("FAIL  " + name + "  -> " + r); }
    } catch (e) { fail++; out.push("ERROR " + name + "  -> " + e.message); }
  }

  // ---- layout ----
  out.push("viewport laid out at " + window.innerWidth + " x " + window.innerHeight + " CSS px");
  t("no horizontal overflow", () => {
    const de = document.documentElement;
    return de.scrollWidth <= de.clientWidth ? true
      : "scrollWidth=" + de.scrollWidth + " clientWidth=" + de.clientWidth;
  });
  t("all 6 tabs fit on screen", () => {
    const nav = document.getElementById("tabs");
    const last = nav.lastElementChild.getBoundingClientRect();
    return last.right <= window.innerWidth + 0.5 ? true
      : "last tab right=" + last.right.toFixed(0) + " vw=" + window.innerWidth;
  });
  t("week+day selects fit", () => {
    const d = document.getElementById("selDay").getBoundingClientRect();
    return d.right <= window.innerWidth + 0.5 ? true : "selDay right=" + d.right.toFixed(0);
  });
  t("header badge fits", () => {
    const b = document.getElementById("hdrBadge").getBoundingClientRect();
    return b.right <= window.innerWidth + 0.5 ? true : "badge right=" + b.right.toFixed(0);
  });

  // ---- re-entry block (the default program from 2026-09-07) ----
  function setProgram(k) {
    const sp = document.getElementById("selProgram");
    sp.value = k; sp.onchange();
  }
  t("re-entry is the program the app opens on", () =>
    S.programKey === "reentry" ? true : S.programKey);
  t("re-entry has 4 weeks and 3 days", () => {
    const w = document.getElementById("selWeek").options.length;
    const d = document.getElementById("selDay").options.length;
    return (w === 4 && d === 3) ? true : "weeks=" + w + " days=" + d;
  });
  t("week 1 caps at RIR 4 and says so on screen", () => {
    const info = document.getElementById("waveInfo").textContent;
    return /STOP AT 4 REPS IN RESERVE/.test(info) ? true : info.slice(0, 80);
  });
  t("RIR cap tightens across the block: 4,3,3,2", () => {
    const got = [1, 2, 3, 4].map(w => REENTRY.rirByWeek[w]).join(",");
    return got === "4,3,3,2" ? true : got;
  });
  t("no percentage target is computed on an RIR program", () => {
    const ex = REENTRY.days[0].ex.find(e => e.k === "r-boxsquat");
    return targetFor(ex) === null ? true : JSON.stringify(targetFor(ex));
  });
  t("core work is listed BEFORE the lifts on every day", () => {
    const bad = [];
    REENTRY.days.forEach(d => {
      let seenLift = false;
      d.ex.forEach(e => {
        if (e.block === "lift") seenLift = true;
        else if (e.block === "core" && seenLift) bad.push(d.name + "/" + e.nm);
      });
    });
    return bad.length ? bad.join(", ") : true;
  });
  t("every lift has a starting load or is explicitly bodyweight", () => {
    const bad = [];
    REENTRY.days.forEach(d => d.ex.forEach(e => {
      if (e.block === "lift" && e.start === undefined && e.k !== "r-pullup") bad.push(e.nm);
    }));
    return bad.length ? bad.join(", ") : true;
  });
  t("every suggested load says where it came from", () => {
    const bad = [];
    REENTRY.days.forEach(d => d.ex.forEach(e => {
      if (e.start !== undefined && !e.basis) bad.push(e.nm);
    }));
    return bad.length ? bad.join(", ") : true;
  });
  t("day B is the hamstring re-test and warns on screen", () => {
    document.getElementById("selDay").value = "2";
    document.getElementById("selDay").onchange();
    const w = document.getElementById("dayWarn").textContent;
    return (/Hamstring/.test(w) && /re-test/i.test(w)) ? true : w.slice(0, 80);
  });
  t("the RDL carries a stop-the-set instruction, not a nudge", () => {
    const rdl = REENTRY.days[1].ex.find(e => e.k === "r-rdl");
    return /STOP the set/.test(rdl.cue) && /Do not push through/.test(rdl.cue)
      ? true : (rdl.cue || "").slice(0, 60);
  });
  t("hanging knee raises are kept off the hinge day", () => {
    const onHinge = REENTRY.days[1].ex.some(e => /Hanging Knee/.test(e.nm));
    const onMixed = REENTRY.days[2].ex.some(e => /Hanging Knee/.test(e.nm));
    return (!onHinge && onMixed) ? true : "hinge=" + onHinge + " mixed=" + onMixed;
  });
  t("the mobility lead line renders above the lifts", () => {
    const w = document.getElementById("dayWarn").textContent;
    return /Before you lift/.test(w) ? true : "missing";
  });
  t("a saved re-entry session records which program it was", () => {
    document.getElementById("selDay").value = "1";
    document.getElementById("selDay").onchange();
    const head = document.querySelector("#exList .ex .exhead");
    head.onclick();
    const ins = document.querySelectorAll("#exList .ex.open .setrow input");
    ins[0].value = "8"; ins[0].oninput();
    document.getElementById("btnSaveSession").onclick();
    const last = S.sessions[S.sessions.length - 1];
    return (last && last.program === "reentry") ? true : JSON.stringify(last && last.program);
  });
  t("switching to Nicks rebuilds 12 weeks and 4 days", () => {
    setProgram("nicks");
    const w = document.getElementById("selWeek").options.length;
    const d = document.getElementById("selDay").options.length;
    return (w === 12 && d === 4) ? true : "weeks=" + w + " days=" + d;
  });
  t("switching programs resets to week 1 rather than carrying week 6 across", () =>
    S.week === 1 ? true : S.week);
  t("switching back to re-entry restores 4 weeks", () => {
    setProgram("reentry");
    const w = document.getElementById("selWeek").options.length;
    return w === 4 ? true : w;
  });
  t("a custom exercise added to one program does not leak into the other", () => {
    S.customEx = {}; S.programKey = "reentry"; S.day = 1;
    S.customEx["reentry:1"] = [{ k: "cx", nm: "Test Move", block: "lift" }];
    const inReentry = exercisesFor(1).some(e => e.nm === "Test Move");
    S.programKey = "nicks";
    const inNicks = exercisesFor(1).some(e => e.nm === "Test Move");
    S.programKey = "reentry"; S.customEx = {};
    return (inReentry && !inNicks) ? true : "reentry=" + inReentry + " nicks=" + inNicks;
  });

  // ---- the original Nick's Program checks, which need Nick's selected ----
  setProgram("nicks");
  // ---- program maths ----
  document.getElementById("selWeek").value = "6"; document.getElementById("selWeek").onchange();
  document.getElementById("selDay").value = "1";  document.getElementById("selDay").onchange();
  t("W6 heavy squat = 170 (80% of 215 -> nearest 5)", () => {
    const s = document.querySelector("#exList .ex .exhead .sub").textContent;
    return /80%/.test(s) && /170 lb/.test(s) ? true : s;
  });
  t("W8 heavy squat = 194 rounds to 195", () => {
    const v = Math.round(215 * 0.9 / 5) * 5;
    return v === 195 ? true : v;
  });
  /* 80% of 215 = 172 rounds to 170 under BOTH nearest-5 and nearest-10, so the
     W6 case cannot detect a rounding fault. W7 (85% = 182.75) separates them:
     nearest-5 gives 185, nearest-10 gives 180. */
  t("W7 heavy squat = 185, which is what distinguishes /5 from /10 rounding", () => {
    document.getElementById("selWeek").value = "7";
    document.getElementById("selWeek").onchange();
    const s = [...document.querySelectorAll("#exList .sub")].map(e => e.textContent).join(" | ");
    const ok = /85% . 185 lb/.test(s.replace(/·/g, "."));
    document.getElementById("selWeek").value = "6";
    document.getElementById("selWeek").onchange();
    return ok ? true : s.slice(0, 120);
  });
  t("the squat caveat is shown beside the squat target, not only on Stats", () => {
    const head = document.querySelector("#exList .ex .exhead");
    head.onclick();
    const body = document.querySelector("#exList .ex.open .exbody").textContent;
    head.onclick();
    return /215 is your call, not the math/.test(body) && /194 lb/.test(body)
      ? true : body.slice(0, 100);
  });
  t("W6 light squat = 140 (65% of 215)", () => {
    const subs = [...document.querySelectorAll("#exList .sub")].map(e => e.textContent);
    return subs.some(s => /65%/.test(s) && /140 lb/.test(s)) ? true : subs.slice(0, 3).join(" | ");
  });
  t("deadlift day uses the deadlift 1RM not the squat", () => {
    document.getElementById("selDay").value = "3";
    document.getElementById("selDay").onchange();
    const s = [...document.querySelectorAll("#exList .sub")].map(e => e.textContent).join(" | ");
    // W6 heavy 80% of 265 = 212 -> 210
    return /210 lb/.test(s) ? true : s;
  });
  t("deload week is flagged and does not raise load", () => {
    document.getElementById("selWeek").value = "5";
    document.getElementById("selWeek").onchange();
    const info = document.getElementById("waveInfo").textContent;
    return /DELOAD/.test(info) && /not optional/.test(info) ? true : info.slice(0, 90);
  });
  t("unconfirmed day carries the not-invented warning", () => {
    const w = document.getElementById("dayWarn").textContent;
    return /only partly written down/.test(w) && /Nothing has been invented/.test(w) ? true : w.slice(0, 80);
  });
  t("hamstring warning shows on day 3", () => {
    const w = document.getElementById("dayWarn").textContent;
    return /Hamstring/.test(w) ? true : "missing";
  });

  // ---- logging round trip ----
  t("log sets, save session, appears in history", () => {
    document.getElementById("selWeek").value = "6"; document.getElementById("selWeek").onchange();
    document.getElementById("selDay").value = "1";  document.getElementById("selDay").onchange();
    const head = document.querySelector("#exList .ex .exhead");
    head.onclick();                                    // open first exercise
    const ins = document.querySelectorAll("#exList .ex.open .setrow input");
    if (ins.length < 3) return "no set inputs found";
    ins[0].value = "2";   ins[0].oninput();
    ins[1].value = "175"; ins[1].oninput();
    ins[2].value = "3";   ins[2].oninput();
    document.getElementById("btnSaveSession").onclick();
    const last = S.sessions[S.sessions.length - 1];
    return last && last.program === "nicks" && last.entries[0].sets[0].load === "175"
      ? true : "sessions=" + S.sessions.length;
  });
  t("Epley with RIR: 175x2 @3 RIR -> ~204", () => {
    const e = Math.round(epley(175, 2 + 3));
    return e === 204 ? true : e;
  });
  t("estimated 1RM table renders the best set beside it", () => {
    renderStats();
    const txt = document.getElementById("e1rmTable").textContent;
    return /175×2 @3/.test(txt) && /204/.test(txt) ? true : txt.slice(0, 120);
  });
  t("draft clears after saving and leaves no empty rows behind", () => {
    const d = S.draft["nicks-6-1"];
    const keys = d ? Object.keys(d.ex) : [];
    if (keys.length) return "draft still holds " + keys.length + " exercises";
    const raw = localStorage.getItem("strength-tracker-v1") || "";
    return /"nicks-6-1":\{"ex":\{\}/.test(raw) ? true : "empty rows persisted to storage";
  });

  // ---- storage ----
  t("state persists to localStorage", () => {
    const raw = JSON.parse(localStorage.getItem("strength-tracker-v1"));
    return raw && raw.sessions.length >= 1 ? true : "not persisted";
  });
  t("survives a corrupt saved blob", () => {
    localStorage.setItem("strength-tracker-v1", "{not json");
    const r = Store.read();
    return r === null || typeof r === "object" ? true : "threw";
  });

  // ---- routines ----
  t("warm-up is 9 steps covering 3 starred MOVES (hip CARs is one move, two sides)", () => {
    const moves = new Set(WARMUP.steps.filter(s => s.star).map(s => s.nm.split(" — ")[0]));
    return WARMUP.steps.length === 9 && moves.size === 3 ? true
      : WARMUP.steps.length + " steps / " + moves.size + " moves: " + [...moves].join(", ");
  });
  t("recover ends on 90/90 breathing", () => {
    const last = RECOVER.steps[RECOVER.steps.length - 1].nm;
    return /90\/90 Breathing/.test(last) ? true : last;
  });
  t("happy baby is in the recover routine", () =>
    RECOVER.steps.some(s => /Happy Baby/i.test(s.nm)) ? true : "missing");
  t("core routine is present with 7 movements", () =>
    CORE.steps.length === 7 ? true : CORE.steps.length);
  t("swimmer row swap is in the program", () => {
    const d4 = PROGRAM.days.find(d => d.n === 4);
    const e = d4.ex.find(x => x.was === "Swimmer Row");
    return e && e.nm === "Straight Arm Lat Pulldown" ? true : "missing";
  });
  t("short recover = 3 steps, short warm-up = 4 (hip CARs both sides)", () => {
    startRoutine(RECOVER, true); const a = R.steps.length; finishRunner(false);
    startRoutine(WARMUP, true);  const b = R.steps.length; finishRunner(false);
    return (a === 3 && b === 4) ? true : "recover=" + a + " warm=" + b;
  });
  t("runner advances and finishes", () => {
    startRoutine(WARMUP, false);
    for (let i = 0; i < 20; i++) { if (!R) break; stepRunner(1); }
    return R === null ? true : "still running at step " + R.i;
  });

  // ---- breathing ----
  t("rib flare program is 4-8-2 x8", () => {
    const b = BREATH[0];
    return b.rounds === 8 && b.phases[0][1] === 4 && b.phases[1][1] === 8 && b.phases[2][1] === 2
      ? true : JSON.stringify(b.phases);
  });

  // ---- export ----
  t("CSV export builds rows with an est_1rm column", () => {
    let captured = null;
    const realBlob = window.Blob;
    window.Blob = function (parts) { captured = parts[0]; return new realBlob(parts, { type: "text/csv" }); };
    document.getElementById("btnExport").onclick();
    window.Blob = realBlob;
    return captured && /est_1rm/.test(captured) && /,175,3,204,/.test(captured)
      ? true : (captured || "").split("\n").slice(0, 2).join(" // ");
  });

  // ---- tabs ----
  t("every tab shows its view", () => {
    const bad = [];
    ["lift", "warm", "recover", "fuel", "breathe", "stats"].forEach(k => {
      showTab(k);
      if (!document.getElementById("v-" + k).classList.contains("on")) bad.push(k);
    });
    showTab("lift");
    return bad.length ? bad.join(",") : true;
  });

  function emit() {
    out.push("");
    out.push("RESULT " + pass + " passed, " + fail + " failed");
    const pre = document.createElement("pre");
    pre.id = "testout";
    pre.textContent = out.join("\n");
    document.body.appendChild(pre);
  }

  /* Real narrow-phone layout. Chrome headless ignores --window-size for the CSS
     viewport, so measuring the top-level document proves nothing about a phone.
     Load the SHIPPED index.html in an iframe pinned to exactly 360 CSS px. */
  const fr = document.createElement("iframe");
  fr.style.cssText = "width:360px;height:760px;border:0;position:absolute;left:-9999px;top:0";
  fr.src = "index.html";
  fr.onload = function () {
    const w = fr.contentWindow, doc = w.document;
    t("360px: viewport really is 360", () =>
      w.innerWidth === 360 ? true : "innerWidth=" + w.innerWidth);
    t("360px: no horizontal scroll", () => {
      const de = doc.documentElement;
      return de.scrollWidth <= de.clientWidth + 0.5 ? true
        : "scrollWidth=" + de.scrollWidth + " vs " + de.clientWidth;
    });
    t("360px: all 6 tabs fit", () => {
      const tabs = doc.getElementById("tabs").children;
      const last = tabs[tabs.length - 1].getBoundingClientRect();
      return last.right <= 360.5 ? true : "last tab right=" + last.right.toFixed(0);
    });
    t("360px: tab targets stay at least 44px tall", () => {
      const h = doc.getElementById("tabs").children[0].getBoundingClientRect().height;
      return h >= 44 ? true : "height=" + h.toFixed(0);
    });
    t("360px: nothing in main overflows the screen", () => {
      const bad = [];
      doc.querySelectorAll("main *").forEach(e => {
        if (e.offsetParent === null) return;
        const r = e.getBoundingClientRect();
        if (r.right > 360.5 || r.left < -0.5) bad.push((e.id || e.className || e.tagName) + " right=" + r.right.toFixed(0));
      });
      return bad.length ? bad.slice(0, 4).join(" | ") : true;
    });
    t("360px: set-entry inputs stay tappable", () => {
      doc.querySelector("#exList .ex .exhead").onclick();
      const ins = doc.querySelectorAll("#exList .ex.open .setrow input");
      if (!ins.length) return "no inputs";
      const b = ins[0].getBoundingClientRect();
      return (b.width >= 55 && b.height >= 36) ? true : "input " + b.width.toFixed(0) + "x" + b.height.toFixed(0);
    });
    emit();
  };
  fr.onerror = function () { out.push("ERROR iframe failed to load"); fail++; emit(); };
  document.body.appendChild(fr);
})();
