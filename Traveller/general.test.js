import { ISDEBUG, color, serverLink, ISBETA, appVersion } from "./global/globalVariable";
import { verifyOnlyConnection, verifyAppVersion } from "./forTests";

describe("App configuration", () => {
  test("Is not debug", () => {
    expect(ISDEBUG).toBe(false);
  });
  test("Primary color", () => {
    expect(color.primary).toBe("#4960FF");
  });
  test("Secondary color", () => {
    expect(color.secondary).toBe("#4900FF");
  });
  test("Third color", () => {
    expect(color.third).toBe("#3582DB");
  });
  test("Server link match", () => {
    expect(serverLink).toBe("https://traveller-ttze.onrender.com/");
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