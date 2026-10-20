/* =====================================================
   Lecteur EXIF minimal (JPEG) : boîtier, objectif, réglages.
   Aucune bibliothèque externe. Ne lit jamais la position GPS.
   ===================================================== */
(function (g) {
  function parseExif(buf) {
    const v = new DataView(buf);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return null;
    let p = 2, tiff = -1;
    while (p + 4 < v.byteLength) {
      if (v.getUint8(p) !== 0xFF) break;
      const marker = v.getUint8(p + 1);
      const len = v.getUint16(p + 2);
      if (marker === 0xE1 && v.getUint32(p + 4) === 0x45786966) { tiff = p + 10; break; } // "Exif"
      if (marker === 0xDA) break; // début des données image
      p += 2 + len;
    }
    if (tiff < 0) return null;

    const little = v.getUint16(tiff) === 0x4949;
    const u16 = o => v.getUint16(o, little);
    const u32 = o => v.getUint32(o, little);
    const out = {};

    function ascii(o, n) {
      let s = "";
      for (let i = 0; i < n; i++) {
        const c = v.getUint8(o + i);
        if (!c) break;
        s += String.fromCharCode(c);
      }
      return s.trim();
    }
    function readIfd(off, want) {
      let base = tiff + off;
      if (base + 2 > v.byteLength) return;
      const n = u16(base);
      for (let i = 0; i < n; i++) {
        const e = base + 2 + i * 12;
        if (e + 12 > v.byteLength) return;
        const tag = u16(e), type = u16(e + 2), count = u32(e + 4);
        if (!(tag in want)) continue;
        const size = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 }[type] || 1;
        const dataOff = size * count > 4 ? tiff + u32(e + 8) : e + 8;
        if (dataOff + size * count > v.byteLength) continue;
        let val;
        if (type === 2) val = ascii(dataOff, count);
        else if (type === 3) val = u16(dataOff);
        else if (type === 4) val = u32(dataOff);
        else if (type === 5) { const d = u32(dataOff + 4); val = d ? u32(dataOff) / d : 0; }
        else continue;
        out[want[tag]] = val;
      }
    }
    // IFD0 : boîtier + pointeur vers l'IFD Exif
    let exifPtr = 0;
    {
      const base = tiff + u32(tiff + 4);
      const n = u16(base);
      for (let i = 0; i < n; i++) {
        const e = base + 2 + i * 12;
        if (u16(e) === 0x8769) exifPtr = u32(e + 8);
      }
      readIfd(u32(tiff + 4), { 0x010F: "Make", 0x0110: "Model" });
    }
    if (exifPtr) {
      readIfd(exifPtr, {
        0x829A: "ExposureTime", 0x829D: "FNumber", 0x8827: "ISO",
        0x920A: "FocalLength", 0xA434: "LensModel"
      });
    }
    return Object.keys(out).length ? out : null;
  }

  // Lit seulement le début du fichier (les données EXIF sont au début)
  async function readExif(url) {
    try {
      const r = await fetch(url, { headers: { Range: "bytes=0-262143" } });
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      return parseExif(buf.byteLength > 262144 ? buf.slice(0, 262144) : buf);
    } catch (e) {
      console.warn("Lecture EXIF impossible :", url, e);
      return null;
    }
  }

  g.parseExif = parseExif;
  g.readExif = readExif;
})(typeof window !== "undefined" ? window : globalThis);
