// Render the showcase from manifest.json. No build step beyond build_manifest.py.

let MANIFEST = null;
let activeTask = null;
let activeVariant = null;

async function init() {
  const res = await fetch("manifest.json");
  MANIFEST = await res.json();

  document.title = MANIFEST.title || document.title;
  // Hero title/subtitle are authored (with markup) in index.html; not overridden here.

  renderTaskTabs(MANIFEST.tasks);
  if (MANIFEST.tasks.length) selectTask(MANIFEST.tasks[0]);

  initTools();
  initMethod();
}

// ---------- Method demo ----------

const METHOD_DEMOS = [
  { id: "t_block", name: "T-block", video: "data/run_eval/0706_dual_stack/fable/videos/seed1.mp4",
    highlights: [
      "0:00 — the agent figures out that the bottom blue block must be rotated 45 degrees so that there is enough contact area for the two green blocks to rest on top side by side.",
      "0:54 — a descent stalls when one finger clips the edge of the green block; the agent notices, lifts, re-centers, and re-grasps cleanly.",
      "1:31 — the agent orbits the camera to a near top-down view and hovers over the corners of the blue block to pinpoint the placement location for the held green block.",
    ] },
  { id: "libero_goal_0", name: "Open drawer", video: "data/run_eval/0704_min_fable/libero_goal_0/videos/seed1.mp4",
    highlights: [
      "0:00 — the agent orbits the camera to look towards the cabinet and better locate the middle drawer's handle.",
      "0:06 — the agent uses `gripper_show_rotation_gizmo` to help reason about the rotation axis and direction; it then tries `gripper_rotate` with small angles to disambiguate before settling on a full 90 degree rotation.",
    ] },
  { id: "libero_goal_7", name: "Turn on stove", video: "data/run_eval/0704_min_fable/libero_goal_7/videos/seed1.mp4",
    highlights: [
      "0:05 — the agent changes to a top-down view to better analyze the knob of the stove.",
      "0:27 — the agent calls `gripper_show_rotation_gizmo` to reason about the rotation axis and direction; its first twist reads back clockwise, so it corrects to a 45-degree counter-clockwise twist paired with a translation that keeps the grasp on the arc around the knob's pivot.",
    ] },
  { id: "libero_goal_8", name: "Put bowl on plate", video: "data/run_eval/0704_min_fable/libero_goal_8/videos/seed1.mp4",
    highlights: [
      "0:07 — the agent figures out to pick up the bowl by pinching its side wall.",
      "0:33 — the robot collides with the cabinet on the left, blocking its efforts to align the bowl with the center of the plate.",
      "1:11 — after many attempts, the agent realizes that it can rotate the gripper to avoid the collision.",
      "1:20 — final adjustment after rotating the gripper, to make sure that the bowl lands on the center of the plate.",
    ] },
  { id: "square", name: "Square", video: "data/run_eval/0914_min_fable5/square/videos/seed10.mp4",
    highlights: [
      "0:00 — the agent hovers over the nut and the peg from several viewpoints, zooming in and orbiting to a top-down view, to measure where they are and how the nut is oriented.",
      "0:08 — it brings up the rotation gizmo, rotates the target gripper in two steps to match the nut's handle, and teleports it onto the handle with a click.",
      "0:32 — after lifting the nut, it resets the camera, hovers on the peg top to localize it, and teleports the target gripper directly above the peg.",
      "0:39 — a series of millimetre-scale translations aligns the hole of the nut with the peg; the final descent at 0:55 seats it.",
    ] },
  { id: "rainbow", name: "Rainbow", video: "data/run_eval/0707_rainbow/fable/videos/seed1.mp4",
    highlights: [
      "0:00 — the agent observes and reasons about the scene, then decides to construct the rainbow arc from left to right so that red, green, and blue are already close to where they should be, reducing the number of block movements. It also decides the location of the rainbow so that the green block requires no movement at all.",
      "2:48 — the indigo block slips out of the gripper during transport; the agent notices, locates where it fell, and re-grasps it deeper this time.",
      "3:29 — although the blue block is already close to its slot, the agent still decides to move it so the final outcome looks better.",
    ] },
  { id: "lamp", name: "Lamp", real: true, video: "data/real/lamp/videos/episode1.mp4",
    highlights: [
      "0:00 — the lamp is out of view, so the agent rotates the base to search for it, spots it on the black cabinet, and drives toward it in two steps.",
      "0:42 — it hovers on the pull chain in the head view, coarsely teleports the end effector to the lamp head with a click, and adjust the target further to face the chain instead of the lamp head.",
      "1:04 — switching to the wrist camera, it hovers on the chain's handle and refines the alignment with small translations before advancing onto it.",
      "1:26 — it closes the gripper and pulls the chain down 4 cm; the lamp turns on, and it releases the chain and backs away.",
    ] },
  { id: "shelf", name: "Shelf", real: true, video: "data/real/shelf/videos/episode2.mp4",
    highlights: [
      "0:00 — the top drawer's handle is already in the wrist view; the agent hovers on it, nudges the gripper into place in two steps, closes on the handle at 0:14, and pulls the drawer out 30 cm.",
      "0:33 — it first lifts the gripper up and back, clear of the open drawer, then drives the base sideways along the bookshelf in two moves until the orange toy lion comes into view.",
      "1:03 — it hovers on the lion in both cameras, drives 40 cm closer, and teleports the gripper onto it with a click at 1:16; after a wrist-view check and a short advance it grasps the lion at 1:36.",
      "1:49 — with the cabinet out of view, it retraces its path in four base moves; it also moves backward along the way to avoid collision between the gripper and the side of the shelf.",
    ] },
  { id: "towel", name: "Towel", real: true, video: "data/real/towel/videos/episode4.mp4",
    highlights: [
      "0:00 — the agent hovers on the near and far corners of the towel in the head view, tilts the gripper to point down, and teleports it above the near corner with a click.",
      "0:15 — switching to the wrist camera, it hovers on the corner, descends onto it in two small steps, pinches it, and lifts it clear of the table.",
      "0:33 — it hovers on the opposite corner in the head view to measure the distance, carries the held corner across in two translations, and lowers it with a last wrist-guided adjustment at 0:51 so the corners meet.",
      "0:57 — it releases the corner, lifts the gripper away, and backs off so the diagonal fold is visible in both cameras.",
    ] },
  { id: "wipe", name: "Wipe", real: true, video: "data/real/wipe/videos/episode5.mp4",
    highlights: [
      "0:00 — the agent spots the open wipes can in the head view, hovers on the protruding wipe, and teleports the gripper to it with a click; two wrist-view hovers (0:11, 0:18) fine-tune the approach before it closes on the wipe and pulls it free.",
      "0:37 — holding the wipe, it tilts the gripper downward in two rotations and teleports it above the black mark with a click on the head view.",
      "0:53 — it hovers in the wrist view to gauge the height, presses the wipe onto the table, scrubs with sideways strokes (0:59, 1:06), then lifts at 1:14 to inspect the residue.",
      "1:21 — seeing a few remaining patches, it hovers on each one in the wrist view and returns for targeted passes, lifting to check in between, until the table is clean at 1:56.",
    ] },
  { id: "basket", name: "Basket", real: true, video: "data/real/basket/videos/episode3.mp4",
    highlights: [
      "0:00 — the agent hovers on the lid's raised front edge in the head view, composes a tilted and rolled gripper pose in several rotation steps (resetting once to start over) so the fingers can straddle the edge, and teleports it there with a click.",
      "0:18 — in the wrist view it hovers on the edge and advances the gripper onto the lid in two steps, then closes on it at 0:31.",
      "0:35 — it lifts the lid along the hinge's arc in three rotate-and-translate waypoints, re-tilting the gripper each time so it keeps following the curve as the lid rises.",
      "0:58 — once the lid is nearly upright it pushes it past the balance point in two more moves, releases at 1:12, and retracts the gripper.",
    ] },
];

function initMethod() {
  const tabs = document.getElementById("method-tabs");
  if (!tabs) return;
  tabs.innerHTML = "";
  // One row of simulation tasks, one of real-robot tasks.
  [["Simulation", false], ["Real world", true]].forEach(([title, real]) => {
    const demos = METHOD_DEMOS.filter((d) => Boolean(d.real) === real);
    if (!demos.length) return;
    const row = document.createElement("div");
    row.className = "method-row";
    const label = document.createElement("span");
    label.className = "method-row-label";
    label.textContent = title;
    row.appendChild(label);
    demos.forEach((demo) => {
      const tab = document.createElement("button");
      tab.className = "method-tab";
      tab.dataset.id = demo.id;
      tab.textContent = demo.name;
      tab.addEventListener("click", () => selectMethodDemo(demo));
      row.appendChild(tab);
    });
    tabs.appendChild(row);
  });
  if (METHOD_DEMOS.length) selectMethodDemo(METHOD_DEMOS[0]);
}

// Highlight text supports `backticks` for tool names, rendered as <code>.
function appendHighlightText(el, text) {
  text.split(/(`[^`]+`)/).forEach((part) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      const code = document.createElement("code");
      code.textContent = part.slice(1, -1);
      el.appendChild(code);
    } else if (part) {
      el.appendChild(document.createTextNode(part));
    }
  });
}

function selectMethodDemo(demo) {
  document.querySelectorAll(".method-tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.id === demo.id)
  );
  loadVideo("method-wrap", "method-video", demo.video);
  const video = document.getElementById("method-video"); // clips differ in shape (sim 26:9, real 4:1)
  video.onloadedmetadata = () => {
    document.getElementById("method-wrap").style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
  };
  const list = document.getElementById("method-highlights");
  if (list) {
    list.innerHTML = "";
    (demo.highlights || []).forEach((text) => {
      const li = document.createElement("li");
      const m = text.match(/^(\d+:\d{2}) — (.*)$/s);
      if (m) {
        const time = document.createElement("span");
        time.className = "hl-time";
        time.textContent = m[1];
        li.appendChild(time);
        li.appendChild(document.createTextNode(" — "));
        appendHighlightText(li, m[2]);
      } else {
        appendHighlightText(li, text);
      }
      list.appendChild(li);
    });
    list.hidden = !list.childElementCount;
    const label = document.getElementById("method-highlights-label");
    if (label) label.hidden = list.hidden;
  }
}

// ---------- MCP Tools ----------

let TOOLS = null;

async function initTools() {
  let data;
  try {
    const res = await fetch("tools.json");
    if (!res.ok) return; // section stays hidden if not yet built
    data = await res.json();
  } catch {
    return;
  }
  TOOLS = data.tools || [];
  if (!TOOLS.length) return;
  document.getElementById("tools-section").hidden = false;
  renderToolList(TOOLS);
  selectTool(TOOLS[0]);
}

function renderToolList(tools) {
  const list = document.getElementById("tool-list");
  list.innerHTML = "";
  tools.forEach((tool) => {
    const btn = document.createElement("button");
    btn.className = "tool-name";
    btn.dataset.name = tool.name;
    btn.textContent = tool.name;
    btn.addEventListener("click", () => selectTool(tool));
    list.appendChild(btn);
  });
}

function selectTool(tool) {
  document.querySelectorAll(".tool-name").forEach((b) =>
    b.classList.toggle("active", b.dataset.name === tool.name)
  );
  document.getElementById("tool-sig").textContent = tool.signature;
  document.getElementById("tool-doc").innerHTML = renderDoc(tool.description);
  renderToolMedia(tool);
}

// Wrap unambiguous code tokens (snake_case identifiers and the "(u, v)" pair) in mono.
// Single-word tool names like "screenshot"/"hover" double as prose, so they're left alone.
function renderDoc(text) {
  return escapeHtml(text || "").replace(
    /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b|\(u,\s*v\)/g,
    (m) => `<code class="tok">${m}</code>`
  );
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function renderToolMedia(tool) {
  const media = document.getElementById("tool-media");
  if (tool.no_video) {
    media.hidden = true;
    media.classList.remove("placeholder");
    media.innerHTML = "";
    return;
  }
  media.hidden = false;
  if (!tool.video) return showToolPlaceholder(media);
  media.classList.remove("placeholder");
  media.innerHTML = "";
  const v = document.createElement("video");
  Object.assign(v, { src: tool.video, controls: true, muted: true, loop: true, autoplay: true, playsInline: true });
  v.addEventListener("error", () => showToolPlaceholder(media));
  media.appendChild(v);
}

function showToolPlaceholder(media) {
  media.classList.add("placeholder");
  media.textContent = "Demo video coming soon";
}

function setText(id, value) {
  if (value) document.getElementById(id).textContent = value;
}

function renderTaskTabs(tasks) {
  const tabs = document.getElementById("task-tabs");
  tabs.innerHTML = "";
  let group = null;
  tasks.forEach((task) => {
    if (task.group && task.group !== group) { // label each run of tasks (Simulation, Real world)
      group = task.group;
      const label = document.createElement("span");
      label.className = "task-group";
      label.textContent = group;
      tabs.appendChild(label);
    }
    const tab = document.createElement("button");
    tab.className = "task-tab";
    tab.dataset.id = task.id;
    tab.textContent = task.name;
    tab.addEventListener("click", () => selectTask(task));
    tabs.appendChild(tab);
  });
}

function selectTask(task) {
  activeTask = task;
  document.querySelectorAll(".task-tab").forEach((c) =>
    c.classList.toggle("active", c.dataset.id === task.id)
  );

  setText("viewer-title", task.name);
  const viewer = document.getElementById("viewer");
  viewer.hidden = false;
  viewer.classList.toggle("real", task.group === "Real world"); // 3:2 players for the real-robot feeds

  renderVariantTabs(task);
  if (task.variants.length) selectVariant(task, task.variants[0]);
}

function renderVariantTabs(task) {
  const tabs = document.getElementById("variant-tabs");
  tabs.innerHTML = "";
  // Rows: CC, Codex, then detailed-prompt variants.
  const rows = [[], [], []];
  task.variants.forEach((variant) => {
    const row = variant.label.includes("detailed") ? 2 : variant.label.startsWith("Codex") ? 1 : 0;
    rows[row].push(variant);
  });
  rows.filter((row) => row.length).forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "variant-row";
    row.forEach((variant) => {
      const tab = document.createElement("button");
      tab.className = "variant-tab";
      tab.dataset.id = variant.id;
      const label = document.createElement("span");
      label.className = "variant-label";
      label.textContent = variant.label;
      const rate = document.createElement("span");
      rate.className = "variant-rate";
      rate.textContent = `${variant.n_success}/${variant.n_total}`;
      tab.append(label, rate);
      tab.addEventListener("click", () => selectVariant(task, variant));
      rowEl.appendChild(tab);
    });
    tabs.appendChild(rowEl);
  });
}

function selectVariant(task, variant) {
  activeVariant = variant;
  document.querySelectorAll(".variant-tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.id === variant.id)
  );

  renderSeedTabs(variant);
  const first = variant.seeds.find((s) => s.success) || variant.seeds[0];
  if (first) selectSeed(variant, first);
}

function renderSeedTabs(variant) {
  const tabs = document.getElementById("seed-tabs");
  tabs.innerHTML = "";
  variant.seeds.forEach((seed) => {
    const chip = document.createElement("button");
    chip.className = "seed-chip " + (seed.success ? "ok" : "fail");
    chip.dataset.seed = seed.seed;
    chip.textContent = `${activeTask.unit || "seed"} ${seed.seed}`;
    chip.addEventListener("click", () => selectSeed(variant, seed));
    tabs.appendChild(chip);
  });
}

function selectSeed(variant, seed) {
  document.querySelectorAll(".seed-chip").forEach((c) =>
    c.classList.toggle("active", Number(c.dataset.seed) === seed.seed)
  );

  loadVideo("web-wrap", "web-video", seed.web);
  loadVideo("cam-wrap", "cam-video", seed.cam);
  renderStats(seed);
  renderTranscript(seed);
}

// Collapsible, lazy-loaded transcript of the agent's reasoning + tool calls.
function renderTranscript(seed) {
  const host = document.getElementById("seed-transcript");
  host.innerHTML = "";
  if (!seed.transcript) return;

  const details = document.createElement("details");
  details.className = "transcript";
  const summary = document.createElement("summary");
  summary.textContent = "Transcript";
  const body = document.createElement("div");
  body.className = "transcript-body";
  body.textContent = "Loading…";
  details.append(summary, body);
  host.appendChild(details);

  let loaded = false;
  details.addEventListener("toggle", async () => {
    if (!details.open || loaded) return;
    loaded = true; // fetch once, on first expand
    try {
      const res = await fetch(seed.transcript);
      if (res.ok) body.innerHTML = formatTranscript(await res.text());
      else body.textContent = "Transcript unavailable.";
    } catch {
      body.textContent = "Transcript unavailable.";
    }
  });
}

// Parse "[HH:MM:SS] [say|tool] ..." entries (a say block may span lines) into
// colored rows: tool calls get the accent, say text stays neutral, times dim.
// Codex transcripts have no timestamps, so the time prefix is optional.
function formatTranscript(text) {
  const head = /^(?:\[(\d{2}:\d{2}:\d{2})\] )?\[(say|tool)\] ?([\s\S]*)$/;
  const entries = [];
  for (const line of text.split("\n")) {
    const m = line.match(head);
    if (m) entries.push({ time: m[1], type: m[2], body: m[3] });
    else if (entries.length) entries[entries.length - 1].body += "\n" + line;
  }
  return entries
    .map((e) => {
      const time = e.time ? `<span class="tr-time">${e.time}</span> ` : "";
      const tag = `<span class="tr-tag">[${e.type}]</span> `;
      const body = e.body.replace(/^ +/, ""); // drop the raw alignment spaces after the tag
      if (e.type === "tool") {
        const mm = body.match(/^(\S+)([\s\S]*)$/) || [null, body, ""];
        return `<div class="tr-entry tr-tool">${time}${tag}<span class="tr-tool-name">${escapeHtml(mm[1])}</span><span class="tr-args">${escapeHtml(mm[2])}</span></div>`;
      }
      return `<div class="tr-entry tr-say">${time}${tag}<span class="tr-text">${escapeHtml(body)}</span></div>`;
    })
    .join("");
}

function loadVideo(wrapId, videoId, src) {
  const wrap = document.getElementById(wrapId);
  const video = document.getElementById(videoId);
  if (src) {
    wrap.classList.remove("empty");
    if (video.dataset.src !== src) {
      video.src = src;
      video.dataset.src = src;
      video.load();
    }
    video.play().catch(() => {}); // autoplay may be blocked; harmless
  } else {
    wrap.classList.add("empty");
    video.removeAttribute("src");
    delete video.dataset.src;
    video.load();
  }
}

function renderStats(seed) {
  const el = document.getElementById("seed-stats");
  const parts = [];
  const verdict = seed.success
    ? `<span class="verdict-ok">SUCCESS</span>`
    : seed.timed_out
    ? `<span class="verdict-fail">FAIL · timed out</span>`
    : `<span class="verdict-fail">FAIL</span>`;
  parts.push(`<span>Verdict: ${verdict}</span>`);
  if (seed.sim_steps != null) {
    const budget = seed.budget != null ? ` / ${seed.budget}` : "";
    parts.push(`<span>Sim steps: <b>${seed.sim_steps}${budget}</b></span>`);
  }
  if (seed.elapsed != null) {
    parts.push(`<span>Wall time: <b>${Math.round(seed.elapsed)}s</b></span>`);
  }
  el.innerHTML = parts.join("");
}

init();
