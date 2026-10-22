/* =====================================================
   WIDGET INSTAGRAM (page À propos)
   -----------------------------------------------------
   1. Crée un compte gratuit sur behold.so, connecte @raw.expl0r
      et crée un flux de type « JSON feed ».
   2. Copie l'adresse du flux (https://feeds.behold.so/XXXX)
      et colle-la entre les guillemets ci-dessous.
   Tant que FEED_URL est vide, le widget affiche juste ta carte
   de profil avec le bouton « Voir sur Instagram ».
   ===================================================== */

const FEED_URL = "https://feeds.behold.so/8Oa13ybXDaGA0NXCwKOi";
const PROFILE_URL = "https://www.instagram.com/raw.expl0r/";
const VISIBLE = 3;                         // nombre de photos affichées à la fois

(function () {
  const root = document.getElementById("insta");
  if (!root) return;

  const strip = root.querySelector(".insta-strip");
  const prev = root.querySelector(".insta-prev");
  const next = root.querySelector(".insta-next");
  const avatar = root.querySelector(".insta-avatar");
  const stats = root.querySelector(".insta-stats");
  let posts = [];
  let start = 0;

  function fmt(n) {
    return n >= 10000 ? Math.round(n / 1000) + " k" : n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",") + " k" : String(n);
  }

  function draw() {
    strip.innerHTML = "";
    posts.slice(start, start + VISIBLE).forEach((p, i) => {
      const src = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.mediaUrl;
      if (!src) return;
      const a = document.createElement("a");
      a.href = p.permalink || PROFILE_URL;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "insta-post";
      a.setAttribute("aria-label", "Ouvrir le post sur Instagram");
      const img = document.createElement("img");
      img.src = src;
      img.alt = p.altText || p.prunedCaption || "Publication Instagram " + (start + i + 1);
      img.loading = "lazy";
      a.appendChild(img);
      if (p.mediaType === "VIDEO" || p.mediaType === "CAROUSEL_ALBUM") {
        const tag = document.createElement("span");
        tag.className = "insta-tag";
        tag.textContent = p.mediaType === "VIDEO" ? "▶" : "❐";
        a.appendChild(tag);
      }
      strip.appendChild(a);
    });
    prev.disabled = start === 0;
    next.disabled = start + VISIBLE >= posts.length;
    const multi = posts.length > VISIBLE;
    prev.hidden = next.hidden = !multi;
  }

  prev.addEventListener("click", () => { start = Math.max(0, start - VISIBLE); draw(); });
  next.addEventListener("click", () => { start = Math.min(posts.length - VISIBLE, start + VISIBLE); draw(); });

  if (!FEED_URL) { root.classList.add("insta-static"); return; }

  fetch(FEED_URL)
    .then(r => { if (!r.ok) throw new Error("flux Instagram indisponible"); return r.json(); })
    .then(data => {
      posts = (data.posts || []).filter(p => p.permalink);
      if (data.profilePictureUrl) { avatar.src = data.profilePictureUrl; avatar.hidden = false; }
      if (data.followersCount) stats.textContent = fmt(data.followersCount) + " abonnés";
      if (!posts.length) { root.classList.add("insta-static"); return; }
      draw();
    })
    .catch(() => root.classList.add("insta-static"));
})();
