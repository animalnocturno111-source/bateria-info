// Prepara la carpeta www/ que se mete dentro de la APK:
// copia la app web y añade el puente Bluetooth nativo (native-ble.js).
import { build } from "esbuild";
import fs from "node:fs";

fs.rmSync("www", { recursive: true, force: true });
fs.mkdirSync("www/fonts", { recursive: true });
for (const f of ["manifest.json", "icon.svg"]) fs.copyFileSync(f, `www/${f}`);
for (const f of fs.readdirSync("fonts")) fs.copyFileSync(`fonts/${f}`, `www/fonts/${f}`);

let html = fs.readFileSync("index.html", "utf8");
if (html.split("<script>").length !== 2) throw new Error("index.html debe tener un solo <script> en línea");
html = html.replace("<script>", '<script src="native-ble.js"></script>\n<script>');
fs.writeFileSync("www/index.html", html);

await build({
  entryPoints: ["native/native-ble.js"],
  bundle: true,
  format: "iife",
  target: "es2020",
  minify: true,
  outfile: "www/native-ble.js",
});
console.log("www/ listo");
