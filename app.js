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
  { id: "dual_stack", name: "T-block", video: "data/run_eval/0706_dual_stack/fable/videos/seed1.mp4",
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
  { id: "rainbow", name: "Rainbow", video: "data/run_eval/0707_rainbow/fable/videos/seed1.mp4",
    highlights: [
      "0:00 — the agent observes and reasons about the scene, then decides to construct the rainbow arc from left to right so that red, green, and blue are already close to where they should be, reducing the number of block movements. It also decides the location of the rainbow so that the green block requires no movement at all.",
      "2:48 — the indigo block slips out of the gripper during transport; the agent notices, locates where it fell, and re-grasps it deeper this time.",
      "3:29 — although the blue block is already close to its slot, the agent still decides to move it so the final outcome looks better.",
    ] },
];

function initMethod() {
  const tabs = document.getElementById("method-tabs");
  if (!tabs) return;
  tabs.innerHTML = "";
  METHOD_DEMOS.forEach((demo) => {
    const tab = document.createElement("button");
    tab.className = "method-tab";
    tab.dataset.id = demo.id;
    tab.textContent = demo.name;
    tab.addEventListener("click", () => selectMethodDemo(demo));
    tabs.appendChild(tab);
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
  tasks.forEach((task) => {
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
  document.getElementById("viewer").hidden = false;

  renderVariantTabs(task);
  if (task.variants.length) selectVariant(task, task.variants[0]);
}

function renderVariantTabs(task) {
  const tabs = document.getElementById("variant-tabs");
  tabs.innerHTML = "";
  task.variants.forEach((variant) => {
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
    tabs.appendChild(tab);
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
    chip.textContent = `seed ${seed.seed}`;
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
