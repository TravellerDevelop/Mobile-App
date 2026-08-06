import { color, ISBETA, appVersion, computeIsDebug, resolveServerLink } from "./global/globalVariable";
import { verifyOnlyConnection, verifyAppVersion } from "./forTests";

// ISDEBUG/serverLink non sono più valori scritti a mano: ISDEBUG deriva da
// __DEV__, che Metro imposta da sé (false solo nelle build di release vere).
// Jest gira su plain Node, senza passare dal bundler, quindi qui __DEV__ non
// esiste e i due valori già calcolati restano sempre nel loro default
// "debug" — non è più qualcosa che questa suite può forzare rileggendoli. Si
// testa invece la logica pura (computeIsDebug/resolveServerLink) passando
// esplicitamente true/false, stesso schema di Server/release.test.ts per
// computeIsDebug(NODE_ENV).
describe("computeIsDebug", () => {
  test("false in una build di release reale (__DEV__ === false)", () => {
    expect(computeIsDebug(false)).toBe(false);
  });
  test("true in sviluppo o fuori dal runtime RN (__DEV__ non è false)", () => {
    expect(computeIsDebug(true)).toBe(true);
    expect(computeIsDebug(undefined)).toBe(true);
  });
});

describe("resolveServerLink", () => {
  test("punta al server di produzione quando non è debug", () => {
    expect(resolveServerLink(false)).toBe("https://traveller-ttze.onrender.com/");
  });
  test("punta all'IP locale in debug", () => {
    expect(resolveServerLink(true)).toBe("http://192.168.1.13:1337/");
  });
});

describe("App configuration", () => {
  test("Primary color", () => {
    expect(color.primary).toBe("#4960FF");
  });
  test("Secondary color", () => {
    expect(color.secondary).toBe("#4900FF");
  });
  test("Third color", () => {
    expect(color.third).toBe("#3582DB");
  });
  test("Is not beta", () => {
    expect(ISBETA).toBe(false);
  });
});

describe("Server configuration", () => {
  test("Server reachable", async () => {
    const data = await verifyOnlyConnection();
    expect(data).toBe(true);
  });
  test("App version match", async () => {
    const data = await verifyAppVersion();
    expect(data).toBe(appVersion);
  })
});