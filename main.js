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
  const modeling = (site.modeling || []).filter((p) => p && p.image);
  const videos = (site.videos || []).filter((v) => v && (v.url || v.thumbnail || v.title));

  // Text fields
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const v = site[el.dataset.bind];
    if (v) el.textContent = v;
  });
  if (site.name) document.title = site.name + " · " + (site.tagline || "Portfolio");
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

  // About section can be switched off in the CMS while the bio is being written
  if (site.show_about === false) {
    $("about").hidden = true;
    document.querySelector('.bar nav a[href="#about"]').hidden = true;
  }

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

  // Captions: italic title, then small uppercase details
  function caption(el, title, details) {
    el.textContent = "";
    if (title) {
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = title;
      el.appendChild(t);
    }
    const m = details.filter(Boolean).join(" · ");
    if (m) {
      const s = document.createElement("span");
      s.className = "m";
      s.textContent = m;
      el.appendChild(s);
    }
  }
  const photoCap = (p) => [p.title, [p.location, p.year]];
  const modelCap = (p) => [p.title, [p.credit && "Photo: " + p.credit, p.year]];
  const videoCap = (v) => [v.title, [v.details, v.year]];
  const altFor = (p, fallback) => [p.title, p.location].filter(Boolean).join(", ") || fallback;

  // Video links: YouTube, Vimeo, or a direct video file
  function parseVideo(url) {
    if (!url) return null;
    let m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    if (m) return {
      kind: "iframe",
      src: "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1&rel=0",
      thumb: "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg",
    };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/);
    if (m) {
      const h = m[2] || (url.match(/[?&]h=([\da-f]+)/) || [])[1];
      return { kind: "iframe", src: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1" + (h ? "&h=" + h : "") };
    }
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: "file", src: url };
    return { kind: "link", src: url };
  }

  // Viewer items for each tab
  const fallbackAlt = "Photograph by " + (site.name || "the artist");
  const lists = {
    photography: photos.map((p) => ({ kind: "image", src: p.image, alt: altFor(p, fallbackAlt), cap: photoCap(p) })),
    modeling: modeling.map((p) => ({ kind: "image", src: p.image, alt: p.title || "Modeling photograph", cap: modelCap(p) })),
    video: videos.map((v) => ({ kind: "video", video: parseVideo(v.url), title: v.title, cap: videoCap(v) })),
  };

  function tile(item, onOpen) {
    const fig = document.createElement("figure");
    fig.className = "tile";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "Open " + item.alt);
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.alt;
    img.loading = "lazy";
    img.decoding = "async";
    btn.appendChild(img);
    btn.addEventListener("click", onOpen);
    const cap = document.createElement("figcaption");
    cap.className = "cap";
    caption(cap, ...item.cap);
    fig.append(btn, cap);
    return fig;
  }

  // Lead image: the first photograph, shown whole over a blurred copy of itself
  if (photos.length) {
    const lead = lists.photography[0];
    $("lead-img").src = lead.src;
    $("lead-img").alt = lead.alt;
    $("lead").querySelector("button").style.setProperty("--lead-bg", "url(" + JSON.stringify(encodeURI(lead.src)) + ")");
    caption($("lead-cap"), ...lead.cap);
    $("lead").hidden = false;
    $("lead").querySelector("button").addEventListener("click", () => openViewer("photography", 0));
  }

  // Photography wall skips the lead image, which is already shown large above
  lists.photography.slice(1).forEach((item, i) => {
    $("grid-photography").appendChild(tile(item, () => openViewer("photography", i + 1)));
  });
  lists.modeling.forEach((item, i) => {
    $("grid-modeling").appendChild(tile(item, () => openViewer("modeling", i)));
  });
  videos.forEach((v, i) => {
    const item = lists.video[i];
    const fig = document.createElement("figure");
    fig.className = "tile video-tile";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "Play " + (v.title || "video"));
    const thumb = v.thumbnail || (item.video && item.video.thumb);
    if (thumb) {
      const img = document.createElement("img");
      img.src = thumb;
      img.alt = "";
      img.loading = "lazy";
      btn.appendChild(img);
    } else {
      btn.classList.add("no-thumb");
    }
    const play = document.createElement("span");
    play.className = "play";
    play.setAttribute("aria-hidden", "true");
    btn.appendChild(play);
    btn.addEventListener("click", () => openViewer("video", i));
    const cap = document.createElement("figcaption");
    cap.className = "cap";
    caption(cap, ...item.cap);
    fig.append(btn, cap);
    $("grid-video").appendChild(fig);
  });

  // Tabs
  const tabNames = ["photography", "modeling", "video"];
  const available = tabNames.filter((t) => lists[t].length);
  tabNames.forEach((t) => {
    const tab = $("tab-" + t);
    tab.hidden = !lists[t].length;
    const n = lists[t].length;
    tab.querySelector(".n").textContent = String(n).padStart(2, "0");
    tab.addEventListener("click", () => selectTab(t, true));
  });
  if (!available.length) {
    $("empty").hidden = false;
    return;
  }
  if (available.length < 2) $("work").querySelector(".tabs").classList.add("single");

  function selectTab(name, updateHash) {
    if (!available.includes(name)) name = available[0];
    tabNames.forEach((t) => {
      const on = t === name;
      $("tab-" + t).setAttribute("aria-selected", on);
      $("tab-" + t).tabIndex = on ? 0 : -1;
      $("panel-" + t).hidden = !on;
    });
    if (updateHash) history.replaceState(null, "", "#" + name);
  }
  $("work").querySelector(".tabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const cur = available.indexOf(tabNames.find((t) => $("tab-" + t).getAttribute("aria-selected") === "true"));
    const next = available[(cur + (e.key === "ArrowRight" ? 1 : available.length - 1)) % available.length];
    selectTab(next, true);
    $("tab-" + next).focus();
  });
  function fromHash() {
    const h = location.hash.slice(1);
    if (tabNames.includes(h)) {
      selectTab(h, false);
      $("work").scrollIntoView();
    }
  }
  selectTab(available[0], false);
  fromHash();
  window.addEventListener("hashchange", fromHash);

  // Viewer
  const viewer = $("viewer");
  const stage = $("viewer-media");
  let list = [];
  let current = 0;
  function show(i) {
    current = (i + list.length) % list.length;
    const item = list[current];
    stage.textContent = "";
    if (item.kind === "image") {
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.alt;
      stage.appendChild(img);
    } else {
      const v = item.video;
      if (v && v.kind === "iframe") {
        const f = document.createElement("iframe");
        f.src = v.src;
        f.title = item.title || "Video";
        f.allow = "autoplay; fullscreen; picture-in-picture";
        f.allowFullscreen = true;
        stage.appendChild(f);
      } else if (v && v.kind === "file") {
        const el = document.createElement("video");
        el.src = v.src;
        el.controls = true;
        el.autoplay = true;
        el.playsInline = true;
        stage.appendChild(el);
      } else {
        const p = document.createElement("p");
        p.className = "viewer-note";
        if (v) {
          const a = document.createElement("a");
          a.href = v.src;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = "Watch this video";
          p.appendChild(a);
        } else {
          p.textContent = "This video has not been linked yet.";
        }
        stage.appendChild(p);
      }
    }
    caption($("viewer-cap"), ...item.cap);
    $("viewer-pos").textContent = String(current + 1).padStart(2, "0") + " / " + String(list.length).padStart(2, "0");
    $("viewer-prev").hidden = $("viewer-next").hidden = list.length < 2;
  }
  function openViewer(tab, i) {
    list = lists[tab];
    show(i);
    viewer.showModal();
  }
  viewer.addEventListener("close", () => (stage.textContent = "")); // stops any playing video
  $("viewer-close").addEventListener("click", () => viewer.close());
  $("viewer-prev").addEventListener("click", () => show(current - 1));
  $("viewer-next").addEventListener("click", () => show(current + 1));
  viewer.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  let touchX = null;
  viewer.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  viewer.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50 && list[current].kind === "image") show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
})();
