/* =====================================================================
   presentation.js - controls for presentation.html
   What it does (top to bottom):
     1. Slide navigation, scaling and the timer
     2. Loads the REAL source files (live, or the copy in source-data.js)
     3. Fills the code slides with the actual functions from script.js
     4. Runs the program's own formulas for the result and validation slides
     5. Full source-code viewer (button or the S key)

   PDF ref: p.7, "Presentation requirements" items 2-3 (equations, source
            code, input values and units visible long enough to read;
            explain selected code in your own words) and the Phase 2 table,
            row "4 Physics and coding integration".
   ===================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const T = window.SrcTools;               // helpers from src-tools.js

  /* ------------------------------------------------------------------
     SECTION 1 - SLIDES, SCALING, TIMER
     ------------------------------------------------------------------ */

  // Part names and suggested times, from PDF p.7 (sample timing).
  const PARTS = {
    1: ["Part 1 · Introduction",                  "0:00 – 0:30"],
    2: ["Part 2 · Physics concepts",              "0:30 – 1:45"],
    3: ["Part 3 · Program demonstration",         "1:45 – 4:00"],
    4: ["Part 4 · Physics and coding integration", "4:00 – 5:30"],
    5: ["Part 5 · Conclusion and reflection",     "5:30 – 6:00"]
  };

  const stage = $("stage");
  const slides = Array.from(stage.querySelectorAll(".slide"));
  let cur = 0;

  /** Scales the fixed 1280x720 stage to fit the window. */
  function fit() {
    const area = $("area");
    const s = Math.min(area.clientWidth / 1280, area.clientHeight / 720);
    $("wrap").style.width = 1280 * s + "px";
    $("wrap").style.height = 720 * s + "px";
    stage.style.transform = "scale(" + s + ")";
  }

  /** Shows slide number i (0-based) and updates bars, notes and counter. */
  function show(i) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => s.classList.toggle("active", k === cur));

    const part = slides[cur].dataset.part;
    $("partName").textContent = PARTS[part][0];
    $("partTime").textContent = PARTS[part][1];
    $("counter").textContent = (cur + 1) + " / " + slides.length;
    $("progress").style.width = ((cur + 1) / slides.length * 100) + "%";

    const notes = slides[cur].querySelector("aside.notes");
    $("notesBody").innerHTML = notes ? notes.innerHTML : "<em>No notes for this slide.</em>";
    try { history.replaceState(null, "", "#" + (cur + 1)); } catch (e) {}
  }
  const next = () => show(cur + 1);
  const prev = () => show(cur - 1);

  /* Timer: starts/pauses with T. Green between 5:00 and 8:00 (target). */
  let timerRunning = false, timerBase = 0, timerStart = 0;
  function elapsedMs() { return timerBase + (timerRunning ? Date.now() - timerStart : 0); }
  function drawTimer() {
    const sec = Math.floor(elapsedMs() / 1000);
    const el = $("timer");
    el.textContent = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
    el.className = sec > 480 ? "over" : sec >= 300 ? "ok" : "";
  }
  function toggleTimer() {
    if (timerRunning) { timerBase = elapsedMs(); timerRunning = false; }
    else { timerStart = Date.now(); timerRunning = true; }
    drawTimer();
  }
  function resetTimer() { timerBase = 0; timerRunning = false; drawTimer(); }
  setInterval(drawTimer, 250);

  /* ------------------------------------------------------------------
     SECTION 2 - LOAD THE REAL SOURCE FILES
     First try the live files (works from a web server). When the page is
     opened by double-click the browser blocks that, so the copy made by
     make-source-data.js (source-data.js) is used instead.
     ------------------------------------------------------------------ */

  // The analyzer lives in the sibling folder "project".
  const PROJECT = "../project/";
  const FILES = ["script.js", "index.html", "style.css"];
  const SOURCES = {};
  let sourceMode = "";

  async function loadSources() {
    let live = 0;
    for (const f of FILES) {
      try {
        const r = await fetch(PROJECT + f, { cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        SOURCES[f] = await r.text();
        live++;
      } catch (e) {
        if (window.SOURCE_FILES && typeof window.SOURCE_FILES[f] === "string") SOURCES[f] = window.SOURCE_FILES[f];
        else SOURCES[f] = "/* " + f + " could not be loaded. Run:  node make-source-data.js */";
      }
    }
    sourceMode = live === FILES.length
      ? "Showing the live project files."
      : "Showing the copy saved in source-data.js. After changing code in the project folder, run: node make-source-data.js";
    document.querySelectorAll("[data-srcmode]").forEach(el => { el.textContent = sourceMode; });
  }

  /* ------------------------------------------------------------------
     SECTION 3 - CODE SNIPPETS ON THE SLIDES (actual functions)
     ------------------------------------------------------------------ */

  let showComments = false;

  function renderSnippets() {
    document.querySelectorAll("pre.code[data-fns]").forEach(pre => {
      const parts = pre.dataset.fns.split(",").map(name => {
        const f = T.findFunction(SOURCES["script.js"], name.trim());
        return f ? f.text : "// function " + name + " not found in script.js";
      });
      let code = parts.join("\n\n");
      if (!showComments) code = T.stripComments(code);
      // data-compact: also drop blank lines so a long function fits the slide
      if (!showComments && pre.hasAttribute("data-compact")) code = code.replace(/\n\s*\n/g, "\n");
      pre.innerHTML = T.highlightJs(code).join("\n");
    });
  }

  /* ------------------------------------------------------------------
     SECTION 4 - RESULTS AND VALIDATION FROM THE PROGRAM'S OWN FORMULAS
     The formulas are cut out of script.js and executed here, so these
     slides show what the real program calculates (not a second copy).
     ------------------------------------------------------------------ */

  /** Builds analyze() from the real script.js functions. */
  function buildProgram() {
    const names = ["angularVelocity", "tangentialSpeed", "centripetalAcceleration",
                   "period", "angularDisplacement", "arcLength", "analyze"];
    const code = names.map(n => {
      const f = T.findFunction(SOURCES["script.js"], n);
      if (!f) throw new Error("function " + n + " not found");
      return f.text;
    }).join("\n");
    return new Function(code + "\nreturn analyze;")();
  }

  // Used only if VALIDATION_CASES cannot be read from script.js.
  const DEFAULT_CASES = [
    { r: 0.12, rpm: 600,  manual: { omega: 62.832,  vt: 7.540,  ac: 473.741 } },
    { r: 0.25, rpm: 300,  manual: { omega: 31.416,  vt: 7.854,  ac: 246.740 } },
    { r: 0.10, rpm: 1200, manual: { omega: 125.664, vt: 12.566, ac: 1579.137 } }
  ];

  const f3 = (x) => x.toFixed(3);
  const agrees = (a, b) => Math.abs(a - b) < 0.0005 + 1e-9;

  function renderResults() {
    let analyze;
    try { analyze = buildProgram(); }
    catch (e) {
      const msg = "<p class='bad'>Could not read the formulas from script.js (" + e.message + ").</p>";
      ["demoTable", "valTable", "trendList"].forEach(id => { $(id).innerHTML = msg; });
      $("manualProgram").textContent = "unavailable";
      return;
    }
    const cases = T.readConstArray(SOURCES["script.js"], "VALIDATION_CASES") || DEFAULT_CASES;

    // Slide 8: results for the three input conditions
    $("demoTable").innerHTML =
      "<table class='data'><thead><tr><th>Case</th><th>r (m)</th><th>N (RPM)</th>" +
      "<th>ω (rad/s)</th><th>v<sub>t</sub> (m/s)</th><th>a<sub>c</sub> (m/s²)</th></tr></thead><tbody>" +
      cases.map((c, i) => {
        const p = analyze(c.r, c.rpm, 1);
        return "<tr><td>" + (i + 1) + "</td><td>" + c.r + "</td><td>" + c.rpm + "</td>" +
               "<td class='c'>" + f3(p.omega) + "</td><td class='g'>" + f3(p.vt) +
               "</td><td class='o'>" + f3(p.ac) + "</td></tr>";
      }).join("") + "</tbody></table>";

    // Slide 12: program output next to the written manual calculation
    const m = analyze(0.12, 600, 1);
    $("manualProgram").innerHTML =
      "ω = <span class='c'>" + f3(m.omega) + " rad/s</span>   " +
      "v<sub>t</sub> = <span class='g'>" + f3(m.vt) + " m/s</span>   " +
      "a<sub>c</sub> = <span class='o'>" + f3(m.ac) + " m/s²</span>";

    // Slide 13: manual vs program for the three cases
    let ok = 0;
    const cell = (man, prog) =>
      "<td>" + f3(man) + "</td><td class='" + (agrees(prog, man) ? "ok" : "bad") + "'>" + f3(prog) + "</td>";
    const rows = cases.map((c, i) => {
      const p = analyze(c.r, c.rpm, 1);
      const pass = agrees(p.omega, c.manual.omega) && agrees(p.vt, c.manual.vt) && agrees(p.ac, c.manual.ac);
      if (pass) ok++;
      return "<tr><td>" + (i + 1) + "</td><td>" + c.r + "</td><td>" + c.rpm + "</td>" +
             cell(c.manual.omega, p.omega) + cell(c.manual.vt, p.vt) + cell(c.manual.ac, p.ac) +
             "<td class='" + (pass ? "ok" : "bad") + "'>" + (pass ? "✔" : "✘") + "</td></tr>";
    }).join("");
    $("valTable").innerHTML =
      "<table class='data' style='font-size:21px'><thead><tr><th>Case</th><th>r (m)</th><th>N</th>" +
      "<th>ω manual</th><th>ω program</th><th>v<sub>t</sub> manual</th><th>v<sub>t</sub> program</th>" +
      "<th>a<sub>c</sub> manual</th><th>a<sub>c</sub> program</th><th></th></tr></thead><tbody>" +
      rows + "</tbody></table>" +
      "<p class='" + (ok === cases.length ? "ok" : "bad") + "' style='margin:12px 0 0'><strong>" +
      ok + " of " + cases.length + " input sets agree at 3 decimal places.</strong></p>";

    // Trend checks (PDF p.6, "Expected trends")
    const a = analyze(0.20, 60, 1), b = analyze(0.40, 60, 1), c2 = analyze(0.20, 120, 1);
    const trends = [
      ["Radius × 2: v<sub>t</sub> × 2",  2, b.vt / a.vt],
      ["Radius × 2: a<sub>c</sub> × 2",  2, b.ac / a.ac],
      ["RPM × 2: ω × 2",                 2, c2.omega / a.omega],
      ["RPM × 2: v<sub>t</sub> × 2",     2, c2.vt / a.vt],
      ["RPM × 2: a<sub>c</sub> × 4",     4, c2.ac / a.ac]
    ];
    $("trendList").innerHTML =
      "<p class='small' style='margin:0 0 6px'>Trend checks (r = 0.20 m, N = 60 RPM as reference):</p>" +
      "<div style='display:flex;flex-wrap:wrap;gap:8px 28px;font-size:21px'>" +
      trends.map(t => {
        const good = Math.abs(t[2] - t[1]) < 1e-9;
        return "<span>" + t[0] + " → <span class='" + (good ? "ok" : "bad") + "'>" +
               t[2].toFixed(2) + (good ? " ✔" : " ✘") + "</span></span>";
      }).join("") + "</div>";
  }

  /* ------------------------------------------------------------------
     SECTION 5 - FULL SOURCE VIEWER
     ------------------------------------------------------------------ */

  let viewerFile = "script.js";

  /** Builds the "jump to" list: SECTION headings and functions. */
  function jumpEntries(file) {
    const entries = [{ label: "Top of file", line: 1 }];
    if (file !== "script.js") return entries;
    const lines = SOURCES[file].split("\n");
    lines.forEach((ln, i) => {
      let m = /^\s+SECTION (\d+) — (.*?)\s*$/.exec(ln);
      if (m) entries.push({ label: "Section " + m[1] + " · " + m[2], line: i + 1 });
      m = /^function\s+(\w+)\s*\(/.exec(ln);
      if (m) entries.push({ label: "   function " + m[1] + "()", line: i + 1 });
    });
    return entries;
  }

  /** Scrolls to a line and flashes it. */
  function goToLine(n) {
    const el = $("vBody").children[n - 1];
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 2200);
  }

  function renderViewer(file) {
    viewerFile = file;
    document.querySelectorAll("#vHead .tab").forEach(b => b.classList.toggle("active", b.dataset.file === file));

    const text = SOURCES[file] || "";
    const html = file.endsWith(".js")
      ? T.highlightJs(text)
      : text.split("\n").map(T.escapeHtml);
    $("vBody").innerHTML = html.map((h, i) =>
      '<div class="ln"><span class="n">' + (i + 1) + '</span><span class="t">' + (h || " ") + "</span></div>").join("");

    const entries = jumpEntries(file);
    $("vJump").innerHTML = entries.map(e =>
      '<option value="' + e.line + '">' + T.escapeHtml(e.label) + "</option>").join("");
    $("vMode").textContent = file + " · " + text.split("\n").length + " lines · " + sourceMode;
    $("vBody").scrollTop = 0;
  }

  function openViewer(file, fnName) {
    $("viewer").classList.add("show");
    renderViewer(file || viewerFile);
    if (fnName) {
      const f = T.findFunction(SOURCES["script.js"], fnName);
      if (f) setTimeout(() => goToLine(f.line), 30);
    }
  }
  const closeViewer = () => $("viewer").classList.remove("show");
  const viewerOpen = () => $("viewer").classList.contains("show");

  /* ------------------------------------------------------------------
     SECTION 6 - WIRING (buttons, keys, fill-in text)
     ------------------------------------------------------------------ */

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch (e) {}
  }

  function toggleNotes() { $("notes").classList.toggle("show"); }

  $("btnPrev").addEventListener("click", prev);
  $("btnNext").addEventListener("click", next);
  $("btnSource").addEventListener("click", () => (viewerOpen() ? closeViewer() : openViewer()));
  $("btnNotes").addEventListener("click", toggleNotes);
  $("btnTimer").addEventListener("click", toggleTimer);
  $("btnFull").addEventListener("click", toggleFullscreen);
  $("vClose").addEventListener("click", closeViewer);
  $("vJump").addEventListener("change", (e) => goToLine(parseInt(e.target.value, 10)));
  document.querySelectorAll("#vHead .tab").forEach(b =>
    b.addEventListener("click", () => renderViewer(b.dataset.file)));

  // Buttons inside slides.
  stage.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.jump) openViewer("script.js", t.dataset.jump);
    else if (t.hasAttribute("data-toggle-comments")) { showComments = !showComments; renderSnippets(); }
    else if (t.dataset.demo) $("demoFrame").src = PROJECT + "index.html?" + t.dataset.demo + "&compact=1";
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.isContentEditable) { if (e.key === "Escape") e.target.blur(); return; }
    if (e.target.tagName === "SELECT") return;

    const k = e.key.toLowerCase();
    if (k === "escape") { closeViewer(); return; }
    if (k === "s") { viewerOpen() ? closeViewer() : openViewer(); return; }
    if (viewerOpen()) return;                       // arrows scroll the code instead
    if (k === "arrowright" || k === "pagedown" || k === " ") { e.preventDefault(); next(); }
    else if (k === "arrowleft" || k === "pageup") { e.preventDefault(); prev(); }
    else if (k === "home") show(0);
    else if (k === "end") show(slides.length - 1);
    else if (k === "n") toggleNotes();
    else if (k === "t") toggleTimer();
    else if (k === "r") resetTimer();
    else if (k === "c") { showComments = !showComments; renderSnippets(); }
    else if (k === "f") toggleFullscreen();
  });

  // Editable name / section / contribution: same text on every slide,
  // remembered in this browser (storage may be blocked, so try/catch).
  const FILL_KEY = "smartWheelPresentationFill";
  let fill = {};
  try { fill = JSON.parse(localStorage.getItem(FILL_KEY)) || {}; } catch (e) {}
  document.querySelectorAll(".fill[data-key]").forEach(el => {
    if (fill[el.dataset.key]) el.textContent = fill[el.dataset.key];
    el.addEventListener("input", () => {
      fill[el.dataset.key] = el.textContent;
      document.querySelectorAll('.fill[data-key="' + el.dataset.key + '"]').forEach(o => {
        if (o !== el) o.textContent = el.textContent;
      });
      try { localStorage.setItem(FILL_KEY, JSON.stringify(fill)); } catch (e) {}
    });
  });

  /* ------------------------------------------------------------------
     START
     ------------------------------------------------------------------ */
  window.addEventListener("resize", fit);
  fit();
  const startAt = parseInt((location.hash || "").replace("#", ""), 10);
  show(isNaN(startAt) ? 0 : startAt - 1);
  drawTimer();

  loadSources().then(() => {
    renderSnippets();
    renderResults();
  });
})();
