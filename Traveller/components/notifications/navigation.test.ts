/**
 * Test della whitelist di deep-link.
 *
 * `target.screen` arriva dal payload di una push: prima di questa modifica
 * finiva senza controlli dentro `rootNavigate`/`homeNavigate`. Qui si
 * verifica che una schermata nota passi (root e annidata) e che una
 * sconosciuta venga ignorata invece di essere passata al navigator.
 *
 * `createNavigationContainerRef` è sostituito da un doppio in memoria creato
 * DENTRO la factory di jest.mock (che viene issata sopra ogni import/const
 * del file, quindi non può riferire variabili esterne se non con nome
 * "mock..." — qui si evita del tutto il problema: i doppi si recuperano
 * dopo, importando `rootNavigationRef`/`homeNavigationRef` da ./navigation,
 * che li riesporta così come li ha ricevuti dalla factory).
 */

jest.mock("@react-navigation/native", () => ({
  createNavigationContainerRef: () => ({
    isReady: jest.fn(() => true),
    navigate: jest.fn(),
  }),
}));

jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../shared/data/localdata", () => ({ getData: jest.fn() }));

import { openTarget, rootNavigationRef, homeNavigationRef } from "./navigation";

const rootNavigate = rootNavigationRef.navigate as jest.Mock;
const homeNavigate = homeNavigationRef.navigate as jest.Mock;

beforeEach(() => {
  rootNavigate.mockClear();
  homeNavigate.mockClear();
});

describe("whitelist delle schermate di deep-link", () => {
  test("una root route nota (Money) naviga", async () => {
    await openTarget({ screen: "Money" });
    expect(rootNavigate).toHaveBeenCalledWith("Money", {});
  });

  test("una route annidata nota senza idratazione (Notifications) naviga", async () => {
    await openTarget({ screen: "Notifications" });
    // Prima passa dal tab Home, poi dallo stack annidato.
    expect(rootNavigate).toHaveBeenCalledWith("Home");
    expect(homeNavigate).toHaveBeenCalledWith("Notifications", {});
  });

  test("una schermata sconosciuta viene ignorata, nessuna navigazione", async () => {
    await openTarget({ screen: "EvilScreen", params: { anything: "qui" } });
    expect(rootNavigate).not.toHaveBeenCalled();
    expect(homeNavigate).not.toHaveBeenCalled();
  });

  test("root:true non basta ad aggirare la whitelist", async () => {
    await openTarget({ screen: "DeleteAccount", root: true });
    expect(rootNavigate).not.toHaveBeenCalled();
  });

  test("nessun target: nessuna navigazione", async () => {
    await openTarget(null);
    await openTarget({} as any);
    expect(rootNavigate).not.toHaveBeenCalled();
  });
});
