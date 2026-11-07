// Pone el icono y la pantalla de inicio propios en el proyecto Android de Capacitor.
// IMPORTANTE: solo SUSTITUYE las imágenes que ya trae la plantilla, al mismo tamaño.
// No crea recursos nuevos (ni variantes noche/ldpi), porque algunos móviles rechazaban
// la APK como "paquete no válido" cuando se añadían.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const BG = "#12212B";
const RES = "android/app/src/main/res";

const render = (svg, size) => sharp(svg, { density: 600 }).resize(size, size).png().toBuffer();

async function iconFor(name, w, h) {
  if (name === "ic_launcher.png") return render("icon.svg", w);
  if (name === "ic_launcher_round.png") {
    const mask = Buffer.from(`<svg width="${w}" height="${w}"><circle cx="${w / 2}" cy="${w / 2}" r="${w / 2}"/></svg>`);
    const sq = await sharp({ create: { width: w, height: w, channels: 4, background: BG } })
      .composite([{ input: await render("res/icon-foreground.svg", w) }]).png().toBuffer();
    return sharp(sq).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  }
  if (name === "ic_launcher_foreground.png") return render("res/icon-foreground.svg", w);
  if (name === "splash.png") {
    const s = Math.round(Math.min(w, h) * 0.6);
    return sharp({ create: { width: w, height: h, channels: 4, background: BG } })
      .composite([{ input: await render("res/icon-foreground.svg", s), gravity: "center" }]).png().toBuffer();
  }
  return null;
}

(async () => {
  let n = 0;
  for (const dir of fs.readdirSync(RES)) {
    const full = path.join(RES, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full)) {
      if (!f.endsWith(".png")) continue;
      const file = path.join(full, f);
      const { width, height } = await sharp(file).metadata();
      const buf = await iconFor(f, width, height);
      if (!buf) continue;
      fs.writeFileSync(file, buf);
      n++;
      console.log(`sustituido ${dir}/${f} ${width}x${height}`);
    }
  }
  // color de fondo del icono adaptativo (recurso que ya existe en la plantilla)
  const colorFile = path.join(RES, "values", "ic_launcher_background.xml");
  if (fs.existsSync(colorFile)) {
    const xml = fs.readFileSync(colorFile, "utf8").replace(/#[0-9A-Fa-f]{6,8}/, BG);
    fs.writeFileSync(colorFile, xml);
    console.log("color de fondo del icono:", BG);
  }
  console.log(`${n} imágenes sustituidas`);
})();
