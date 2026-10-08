// Renders the portfolio from content/site.json, which Nadean edits through Pages CMS.
(async function () {
  const $ = (id) => document.getElementById(id);
  let site;
  try {
    const res = await fetch("/content/site.json", { cache: "no-cache" });
    site = await res.json();
  } catch (err) {
    $("empty").hidden = false;
    $("empty").textContent = "The portfolio could not be loaded. Please refresh the page.";
    return;
  }

  const photos = (site.photos || []).filter((p) => p && p.image);

  // Text fields
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const v = site[el.dataset.bind];
    if (v) el.textContent = v;
  });
  if (site.name) document.title = site.name + " · " + (site.tagline || "Photography");
  const meta = document.querySelector('meta[name="description"]');
  if (meta && site.tagline) meta.content = site.tagline + " by " + site.name + ".";
  $("year").textContent = new Date().getFullYear();

  // Bio: blank lines separate paragraphs
  const bio = $("bio");
  String(site.bio || "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).forEach((para) => {
    const p = document.createElement("p");
    p.textContent = para;
    bio.appendChild(p);
  });

  if (site.portrait) {
    $("portrait").src = site.portrait;
    $("portrait-wrap").hidden = false;
  }

  // Contact
  const email = $("email");
  if (site.email) {
    email.textContent = site.email;
    email.href = "mailto:" + site.email;
  }
  $("copy").addEventListener("click", async () => {
    const btn = $("copy");
    try {
      await navigator.clipboard.writeText(site.email);
      btn.textContent = "Copied";
    } catch {
      const r = document.createRange();
      r.selectNodeContents(email);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      btn.textContent = "Selected, press Ctrl+C";
    }
    setTimeout(() => (btn.textContent = "Copy address"), 2200);
  });
  if (site.instagram) {
    const handle = site.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    const a = document.createElement("a");
    a.href = "https://instagram.com/" + handle;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Instagram @" + handle;
    $("social").appendChild(a);
    $("social").hidden = false;
  }

  // Captions
  function caption(el, p) {
    el.textContent = "";
    if (p.title) {
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = p.title;
      el.appendChild(t);
    }
    const meta = [p.location, p.year].filter(Boolean).join(" · ");
    if (meta) {
      const m = document.createElement("span");
      m.className = "m";
      m.textContent = meta;
      el.appendChild(m);
    }
  }
  const altFor = (p) => [p.title, p.location].filter(Boolean).join(", ") || "Photograph by " + (site.name || "the artist");

  if (!photos.length) {
    $("empty").hidden = false;
    return;
  }

  // Lead image is the first photo; the wall shows the rest
  const lead = photos[0];
  $("lead-img").src = lead.image;
  $("lead-img").alt = altFor(lead);
  caption($("lead-cap"), lead);
  $("lead").hidden = false;
  $("lead").querySelector("button").addEventListener("click", () => openViewer(0));

  const n = photos.length;
  $("count").textContent = n + (n === 1 ? " photograph" : " photographs");

  const grid = $("grid");
  photos.slice(1).forEach((p, i) => {
    const fig = document.createElement("figure");
    fig.className = "tile";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "Open " + altFor(p));
    const img = document.createElement("img");
    img.src = p.image;
    img.alt = altFor(p);
    img.loading = "lazy";
    img.decoding = "async";
    btn.appendChild(img);
    btn.addEventListener("click", () => openViewer(i + 1));
    const cap = document.createElement("figcaption");
    cap.className = "cap";
    caption(cap, p);
    fig.append(btn, cap);
    grid.appendChild(fig);
  });

  // Viewer
  const viewer = $("viewer");
  let current = 0;
  function show(i) {
    current = (i + n) % n;
    const p = photos[current];
    $("viewer-img").src = p.image;
    $("viewer-img").alt = altFor(p);
    caption($("viewer-cap"), p);
    $("viewer-pos").textContent = String(current + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
  }
  function openViewer(i) {
    show(i);
    viewer.showModal();
  }
  $("viewer-close").addEventListener("click", () => viewer.close());
  $("viewer-prev").addEventListener("click", () => show(current - 1));
  $("viewer-next").addEventListener("click", () => show(current + 1));
  $("viewer-prev").hidden = $("viewer-next").hidden = n < 2;
  viewer.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  let touchX = null;
  viewer.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  viewer.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
})();
