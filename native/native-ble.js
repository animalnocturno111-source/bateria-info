// Puente para la APK: imita la API Web Bluetooth del navegador (navigator.bluetooth)
// usando el Bluetooth nativo de Android, para que la app web funcione sin cambios.
// También: pide encender el Bluetooth al abrir y mantiene la pantalla encendida.
import { Capacitor } from "@capacitor/core";
import { BleClient, numberToUUID } from "@capacitor-community/bluetooth-le";
import { KeepAwake } from "@capacitor-community/keep-awake";

if (Capacitor.isNativePlatform()) {
  const norm = u => typeof u === "number" ? numberToUUID(u)
    : /^[0-9a-f]{4}$/i.test(u) ? numberToUUID(parseInt(u, 16)) : String(u).toLowerCase();
  const toDV = d => d instanceof DataView ? d
    : new DataView(d.buffer ? d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) : d);
  const IGNORE = [numberToUUID(0x1800), numberToUUID(0x1801)];

  // Al abrir: permisos (sin ubicación en Android 12+) y pedir encender el Bluetooth.
  const ready = (async () => {
    await BleClient.initialize({ androidNeverForLocation: true });
    try {
      if (!(await BleClient.isEnabled())) await BleClient.requestEnable();
    } catch (e) { console.warn("requestEnable", e); }
  })();

  class Char extends EventTarget {
    constructor(dev, svc, c) {
      super();
      this._d = dev; this._s = svc; this.uuid = c.uuid.toLowerCase();
      this.properties = c.properties; this.value = null;
    }
    async startNotifications() {
      await BleClient.startNotifications(this._d.id, this._s, this.uuid, v => {
        this.value = v;
        this.dispatchEvent(new Event("characteristicvaluechanged"));
      });
      return this;
    }
    async stopNotifications() {
      try { await BleClient.stopNotifications(this._d.id, this._s, this.uuid); } catch {}
      return this;
    }
    writeValueWithResponse(d) { return BleClient.write(this._d.id, this._s, this.uuid, toDV(d)); }
    writeValueWithoutResponse(d) { return BleClient.writeWithoutResponse(this._d.id, this._s, this.uuid, toDV(d)); }
    writeValue(d) { return this.writeValueWithResponse(d); }
  }

  class Dev extends EventTarget {
    constructor(id, name) {
      super();
      this.id = id; this.name = name;
      const dev = this;
      const lost = () => {
        if (!dev.gatt.connected) return;
        dev.gatt.connected = false;
        dev.dispatchEvent(new Event("gattserverdisconnected"));
      };
      this.gatt = {
        connected: false,
        device: dev,
        async connect() {
          await ready;
          await BleClient.connect(dev.id, lost, { timeout: 15000 });
          dev.gatt.connected = true;
          return dev.gatt;
        },
        disconnect() { BleClient.disconnect(dev.id).catch(() => {}).finally(lost); },
        async getPrimaryServices() {
          const svcs = await BleClient.getServices(dev.id);
          return svcs
            .filter(s => !IGNORE.includes(s.uuid.toLowerCase()))
            .map(s => ({
              uuid: s.uuid.toLowerCase(),
              getCharacteristics: async () => s.characteristics.map(c => new Char(dev, s.uuid.toLowerCase(), c)),
            }));
        },
      };
    }
  }

  const devices = new Map();
  const getDev = (id, name) => {
    if (!devices.has(id)) devices.set(id, new Dev(id, name));
    return devices.get(id);
  };

  const bluetooth = {
    ready,
    async requestDevice(opts = {}) {
      await ready;
      const d = await BleClient.requestDevice({ optionalServices: (opts.optionalServices || []).map(norm) });
      return getDev(d.deviceId, d.name);
    },
    // En Android se puede reconectar directamente con la dirección guardada.
    async getDevices() {
      await ready;
      try {
        const s = JSON.parse(localStorage.getItem("bi-device"));
        if (s && s.id) return [getDev(s.id, s.name)];
      } catch {}
      return [];
    },
  };

  const wakeLock = {
    async request() {
      await KeepAwake.keepAwake();
      const s = new EventTarget();
      s.release = async () => { await KeepAwake.allowSleep(); s.dispatchEvent(new Event("release")); };
      return s;
    },
  };

  Object.defineProperty(navigator, "bluetooth", { value: bluetooth, configurable: true });
  Object.defineProperty(navigator, "wakeLock", { value: wakeLock, configurable: true });
  window.BATERIA_NATIVE = true;
}
