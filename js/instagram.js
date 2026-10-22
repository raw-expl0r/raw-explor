/* =====================================================
   WIDGET INSTAGRAM (page À propos)
   ===================================================== */

const FEED_URL = "https://feeds.behold.so/8Oa13ybXDaGA0NXCwKOi";   // flux Behold (abonnés + secours)
const PROFILE_URL = "https://www.instagram.com/raw.expl0r/";
const AVATAR = "images/avatar.jpg";        // ta photo de profil, à déposer dans le dossier images
const VISIBLE = 3;                         // nombre de photos affichées à la fois

/* ----- TES POSTS ÉPINGLÉS -----
   Instagram ne transmet pas l'ordre des posts épinglés. Pour afficher exactement
   ceux que tu veux, ajoute une ligne par post :
     - img  : l'image (dépose-la dans le dossier images/, ex : images/insta-1.jpg)
     - link : le lien du post (sur Instagram : ••• → Copier le lien)
   Si la liste est vide, le widget affiche les derniers posts du flux Behold. */
const PINNED = [
  // { img: "images/insta-1.jpg", link: "https://www.instagram.com/p/XXXXXXXX/" },
  // { img: "images/insta-2.jpg", link: "https://www.instagram.com/p/YYYYYYYY/" },
  // { img: "images/insta-3.jpg", link: "https://www.instagram.com/p/ZZZZZZZZ/" },
];

(function () {
  const root = document.getElementById("insta");
  if (!root) return;

  const strip = root.querySelector(".insta-strip");
  const prev = root.querySelector(".insta-prev");
  const next = root.querySelector(".insta-next");
  const avatar = root.querySelector(".insta-avatar");
  const stats = root.querySelector(".insta-stats");
  let posts = [];     // { href, src, alt, tag }
  let start = 0;
  let feedAvatar = "";

  function fmt(n) {
    return n >= 10000 ? Math.round(n / 1000) + " k" : n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",") + " k" : String(n);
  }

  /* Photo de profil : ton fichier local d'abord, puis celle d'Instagram, sinon rien */
  function setAvatar() {
    avatar.onerror = () => {
      if (feedAvatar && avatar.src.indexOf(feedAvatar) === -1) { avatar.src = feedAvatar; }
      else { avatar.hidden = true; avatar.onerror = null; }
    };
    avatar.hidden = false;
    avatar.src = AVATAR;
  }

  function draw() {
    strip.innerHTML = "";
    posts.slice(start, start + VISIBLE).forEach((p, i) => {
      const a = document.createElement("a");
      a.href = p.href;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "insta-post";
      a.setAttribute("aria-label", "Ouvrir le post sur Instagram");
      const img = document.createElement("img");
      img.src = p.src;
      img.alt = p.alt || "Publication Instagram " + (start + i + 1);
      img.loading = "lazy";
      a.appendChild(img);
      if (p.tag) {
        const tag = document.createElement("span");
        tag.className = "insta-tag";
        tag.textContent = p.tag;
        a.appendChild(tag);
      }
      strip.appendChild(a);
    });
    prev.disabled = start === 0;
    next.disabled = start + VISIBLE >= posts.length;
    prev.hidden = next.hidden = posts.length <= VISIBLE;
    root.classList.toggle("insta-static", !posts.length);
  }

  prev.addEventListener("click", () => { start = Math.max(0, start - VISIBLE); draw(); });
  next.addEventListener("click", () => { start = Math.min(posts.length - VISIBLE, start + VISIBLE); draw(); });

  setAvatar();

  // 1) Posts épinglés choisis à la main (prioritaires)
  const pinned = PINNED.filter(p => p.img && p.link).map(p => ({ href: p.link, src: p.img, alt: "Publication épinglée" }));
  if (pinned.length) { posts = pinned; draw(); } else { root.classList.add("insta-static"); }

  // 2) Flux Behold : abonnés, photo de secours, et derniers posts si rien n'est épinglé
  if (!FEED_URL) return;
  fetch(FEED_URL)
    .then(r => { if (!r.ok) throw new Error("flux Instagram indisponible"); return r.json(); })
    .then(data => {
      feedAvatar = data.profilePictureUrl || "";
      if (avatar.hidden && feedAvatar) { avatar.hidden = false; avatar.src = feedAvatar; }
      if (data.followersCount) stats.textContent = fmt(data.followersCount) + " abonnés";
      if (pinned.length) return;
      posts = (data.posts || []).filter(p => p.permalink).map(p => ({
        href: p.permalink,
        src: (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.mediaUrl,
        alt: p.altText || p.prunedCaption,
        tag: p.mediaType === "VIDEO" ? "▶" : p.mediaType === "CAROUSEL_ALBUM" ? "❐" : ""
      })).filter(p => p.src);
      draw();
    })
    .catch(() => {});
})();
