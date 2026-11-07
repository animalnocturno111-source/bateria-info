// Genera las imágenes base que @capacitor/assets convierte en iconos y pantalla de inicio de Android.
const sharp = require("sharp");
const fs = require("fs");

const BG = "#12212B";
fs.mkdirSync("assets", { recursive: true });

(async () => {
  const svg = f => sharp(f, { density: 600 }).resize(1024, 1024).png();
  await svg("icon.svg").toFile("assets/icon-only.png");                       // icono clásico
  await svg("res/icon-foreground.svg").toFile("assets/icon-foreground.png");  // icono adaptativo: figura
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BG } })
    .png().toFile("assets/icon-background.png");                              // icono adaptativo: fondo
  const fg = await sharp("res/icon-foreground.svg", { density: 600 }).resize(1400, 1400).png().toBuffer();
  for (const name of ["splash.png", "splash-dark.png"]) {                      // pantalla de inicio
    await sharp({ create: { width: 2732, height: 2732, channels: 4, background: BG } })
      .composite([{ input: fg, gravity: "center" }]).png().toFile(`assets/${name}`);
  }
  console.log("iconos ok");
})();
