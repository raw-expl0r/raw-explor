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
    img.dataset.path = path;
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
  <button class="lb-btn lb-info" aria-label="Fiche technique de la photo">i</button>
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
  hideExif();
  index = (index + d + current.length) % current.length;
  show();
}

lb.querySelector(".lb-info").addEventListener("click", e => {
  e.stopPropagation();
  if (!exifBox.hidden) { hideExif(); return; }
  const r = e.currentTarget.getBoundingClientRect();
  const onTop = r.top < window.innerHeight / 2;
  showExif(current[index], r.left, onTop ? r.bottom + 8 : r.top - 190);
});
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

/* ----- Fiche technique de la photo (clic droit) : matériel et réglages lus dans l'EXIF ----- */
const exifBox = document.createElement("div");
exifBox.className = "exif-menu";
exifBox.hidden = true;
document.body.appendChild(exifBox);
const exifCache = {};

function fmtExposure(t) {
  if (!t) return "";
  return t >= 1 ? t + " s" : "1/" + Math.round(1 / t) + " s";
}
function addRow(label, value) {
  if (!value) return;
  const row = document.createElement("div");
  row.className = "exif-row";
  const l = document.createElement("span"); l.textContent = label;
  const v = document.createElement("b"); v.textContent = value;
  row.append(l, v);
  exifBox.appendChild(row);
}
async function readExif(path) {
  if (exifCache[path]) return exifCache[path];
  let d = null;
  try {
    d = await exifr.parse(url(path), ["Make", "Model", "LensModel", "FocalLength", "FNumber", "ExposureTime", "ISO"]);
  } catch (e) { d = null; }
  exifCache[path] = d || {};
  return exifCache[path];
}
async function showExif(path, x, y) {
  exifBox.innerHTML = "";
  const wait = document.createElement("div");
  wait.className = "exif-row"; wait.textContent = "Lecture…";
  exifBox.appendChild(wait);
  exifBox.hidden = false;
  place(x, y);
  const d = await readExif(path);
  exifBox.innerHTML = "";
  const title = document.createElement("div");
  title.className = "exif-title"; title.textContent = "Fiche technique";
  exifBox.appendChild(title);
  const model = d.Model ? (d.Make && !d.Model.startsWith(d.Make) ? d.Make + " " + d.Model : d.Model) : "";
  addRow("Boîtier", model);
  addRow("Objectif", d.LensModel);
  addRow("Focale", d.FocalLength ? Math.round(d.FocalLength) + " mm" : "");
  addRow("Ouverture", d.FNumber ? "f/" + d.FNumber : "");
  addRow("Vitesse", fmtExposure(d.ExposureTime));
  addRow("ISO", d.ISO ? String(d.ISO) : "");
  if (!exifBox.querySelector(".exif-row")) {
    const none = document.createElement("div");
    none.className = "exif-row"; none.textContent = "Informations non disponibles";
    exifBox.appendChild(none);
  }
  place(x, y);
}
function place(x, y) {
  const w = exifBox.offsetWidth, h = exifBox.offsetHeight;
  exifBox.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + "px";
  exifBox.style.top = Math.max(8, Math.min(y, window.innerHeight - h - 8)) + "px";
}
function hideExif() { exifBox.hidden = true; }

// chemin de la photo sous le pointeur (grille ou visionneuse)
function pathOf(img) {
  if (img.closest(".lightbox")) return current[index];
  return img.dataset.path || null;
}
document.addEventListener("click", hideExif);
document.addEventListener("scroll", hideExif, true);
document.addEventListener("keydown", e => { if (e.key === "Escape") hideExif(); });

/* ----- Dissuasion : pas de clic droit « Enregistrer l'image » ----- */
document.addEventListener("contextmenu", e => {
  if (e.target.tagName !== "IMG") return;
  e.preventDefault();
  const p = pathOf(e.target);
  if (p && typeof exifr !== "undefined") showExif(p, e.clientX, e.clientY);
});
document.addEventListener("dragstart", e => {
  if (e.target.tagName === "IMG") e.preventDefault();
});

/* ----- Démarrage : lit photos.json puis mélange ----- */
fetch("photos.json", { cache: "no-cache" })
  .then(r => { if (!r.ok) throw new Error("photos.json introuvable"); return r.json(); })
  .then(list => render(shuffle(list)))
  .catch(() => render([]));
