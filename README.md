# Nadean · Photography portfolio

A plain HTML/CSS/JS site. All words and photos live in `content/site.json` and `images/`,
and Nadean edits them through **Pages CMS** (a free web admin with drag-and-drop uploads).
Every save commits to GitHub, and Netlify republishes the site in about a minute.

```
index.html, style.css, main.js   the site
content/site.json                name, bio, email, photo list
images/                          uploaded photos (sample-*.svg are placeholders to delete)
.pages.yml                       what the admin panel shows
netlify.toml                     hosting settings
```

## One-time setup (about 30 minutes)

1. **GitHub**: done. The site lives in the private repo `MaxmaxxamxaM/nadean-portfolio`.
2. **Netlify**: sign up at netlify.com with that GitHub account → *Add new site* →
   *Import an existing project* → pick the repository. No build command; publish directory is the root.
   The site goes live at `something.netlify.app`.
3. **Custom domain**: in Netlify → *Domain management* → *Add a domain*. Either buy it there,
   or point an existing domain's DNS at Netlify as instructed. HTTPS is set up automatically.
4. **Admin panel**: go to app.pagescms.org, sign in with GitHub, and install the Pages CMS
   app on this repository only. Then invite Nadean by email from the repo's
   Collaborators settings in Pages CMS, so she can edit without a GitHub account.

## Day-to-day (for Nadean)

1. Go to app.pagescms.org and open **Portfolio**.
2. Under **Photographs**, click *Add an entry*, then drag a photo onto the Photo box
   (or open **Media** to upload many at once). Add a title, location and year.
3. Drag entries to reorder. The first one is the big photo at the top.
4. Click **Save**. The live site updates within a minute or two.

The **Modeling tab** and **Video tab** lists work the same way. For a video, upload it to
YouTube or Vimeo (unlisted is fine) and paste the link. YouTube covers appear automatically,
and Vimeo videos need a cover image uploaded. A tab with no entries is hidden from the site.
Each tab has its own link: `yourdomain.com/#photography`, `#modeling`, `#video`.

Tips: export photos as JPG, about 2400px on the long side and under 1 MB each, so
the site stays fast. Delete the `sample-*` entries once real photos are in.
