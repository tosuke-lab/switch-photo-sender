import type { ProxyObject } from "dbus-next";
import * as dbus from "dbus-next";
const Variant = dbus.Variant;

const WPA_SUPPLICANT_NAMESPACE = "fi.w1.wpa_supplicant1";
const WPA_SUPPLICANT = "fi.w1.wpa_supplicant1";
const WPA_SUPPLICANT_PATH = "/fi/w1/wpa_supplicant1";
const WPA_INTERFACE = `${WPA_SUPPLICANT}.Interface`;

const bus = dbus.systemBus();

async function getWpaSupplicantObject(path: string): Promise<ProxyObject> {
  return await bus.getProxyObject(WPA_SUPPLICANT_NAMESPACE, path);
}

export async function connect(ssid: string, psk: string) {
  const wpaSupObj = await getWpaSupplicantObject(WPA_SUPPLICANT_PATH);
  const wpaSup = await wpaSupObj.getInterface(WPA_SUPPLICANT);

  const ifacePath = await (wpaSup.GetInterface(
    process.env.WLAN_INTERFACE
  ) as Promise<string>).catch(
    () =>
      wpaSup.CreateInterface({
        Ifname: new Variant("s", process.env.WLAN_INTERFACE),
      }) as Promise<string>
  );

  const ifaceObj = await getWpaSupplicantObject(ifacePath);
  const iface = await ifaceObj.getInterface(WPA_INTERFACE);
  // await iface.RemoveAllNetworks();

  console.log({
    ssid,
    psk,
  });
  const netPath: string = await iface.AddNetwork({
    ssid: new Variant("s", ssid),
    psk: new Variant("s", psk),
  });
  await iface.SelectNetwork(netPath);

  await new Promise((resolve, reject) => {
    const handle = (changed: { [k: string]: dbus.Variant }) => {
      if (changed.State?.value === "completed") {
        iface.off("PropertiesChanged", handle);
        resolve(void 0);
      }
    };
    iface.on("PropertiesChanged", handle);
    setTimeout(() => {
      iface.off("PropertiesChanged", handle);
      reject(new Error("Timeout"));
    }, 30 * 1000);
  });

  return netPath;
}

/*async function main() {
  try {
    const argv = process.argv;
    const ssid = argv[argv.length - 2];
    const psk = argv[argv.length - 1];
    await connect(ssid, psk);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();*/
