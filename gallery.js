/* =====================================================
   GALERIE RAW EXPL0R
   -----------------------------------------------------
   Rien à modifier ici.
   Dépose tes photos dans le dossier "photos" : la liste
   (photos.json) est mise à jour automatiquement par GitHub,
   et l'ordre est mélangé à chaque visite.
   ===================================================== */

const gallery = document.getElementById("gallery");
let current = [];   // photos affichées (dans l'ordre mélangé)
let index = 0;      // photo ouverte dans la visionneuse

/* ----- Mélange aléatoire (Fisher-Yates) ----- */
function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ----- Adresse sûre pour tous les noms de fichiers (espaces, ', #, ?, accents...) ----- */
function url(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

/* ----- Affichage de la grille ----- */
function render(list) {
  current = list;
  gallery.innerHTML = "";
  if (!list.length) {
    gallery.innerHTML = '<p class="empty">Aucune photo pour le moment.</p>';
    return;
  }
  list.forEach((path, i) => {
    const fig = document.createElement("figure");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumb";
    btn.setAttribute("aria-label", "Agrandir la photo " + (i + 1));
    const img = document.createElement("img");
    img.alt = "Photographie RAW EXPL0R " + (i + 1);
    img.loading = "lazy";
    img.decoding = "async";
    // Si une image échoue : on réessaie une fois, sinon on la masque (et on l'indique dans la console)
    let retried = false;
    img.addEventListener("error", () => {
      if (!retried) {
        retried = true;
        setTimeout(() => { img.src = url(path) + "?r=" + Date.now(); }, 1500);
      } else {
        console.warn("Photo impossible à charger :", path);
        fig.remove();
      }
    });
    img.src = url(path);
    btn.appendChild(img);
    btn.addEventListener("click", () => openLightbox(i));
    fig.appendChild(btn);
    gallery.appendChild(fig);
  });
}

/* ----- Visionneuse plein écran ----- */
const lb = document.createElement("div");
lb.className = "lightbox";
lb.setAttribute("role", "dialog");
lb.setAttribute("aria-modal", "true");
lb.innerHTML = `
  <button class="lb-btn lb-close" aria-label="Fermer">&times;</button>
  <button class="lb-btn lb-prev" aria-label="Photo précédente">&#8249;</button>
  <img alt="">
  <button class="lb-btn lb-next" aria-label="Photo suivante">&#8250;</button>`;
document.body.appendChild(lb);

const lbImg = lb.querySelector("img");

function show() {
  lbImg.src = url(current[index]);
  lbImg.alt = "Photographie RAW EXPL0R " + (index + 1);
}
function openLightbox(i) {
  index = i;
  show();
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lb.classList.remove("open");
  document.body.style.overflow = "";
}
function step(d) {
  index = (index + d + current.length) % current.length;
  show();
}

lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
lb.querySelector(".lb-prev").addEventListener("click", () => step(-1));
lb.querySelector(".lb-next").addEventListener("click", () => step(1));
lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
document.addEventListener("keydown", e => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

/* ----- Démarrage : lit photos.json puis mélange ----- */
fetch("photos.json", { cache: "no-cache" })
  .then(r => { if (!r.ok) throw new Error("photos.json introuvable"); return r.json(); })
  .then(list => render(shuffle(list)))
  .catch(() => render([]));
