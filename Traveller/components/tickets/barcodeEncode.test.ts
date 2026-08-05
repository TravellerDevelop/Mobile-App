import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import { encodeBarcodeMatrix } from "./barcodeEncode";

// Stesso esempio ufficiale IATA/Scandit usato in bcbp.test.ts.
const BCBP_SAMPLE = "M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 1";

/**
 * Estrae le coordinate dei moduli scuri dal path SVG prodotto da
 * encodeBarcodeMatrix ("M{x},{y}h1v1h-1z" ripetuto una volta per modulo).
 */
function darkCellsFromPath(path: string): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  const re = /M(\d+),(\d+)h1v1h-1z/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(path))) {
    cells.push([Number(match[1]), Number(match[2])]);
  }
  return cells;
}

/**
 * Ricostruisce un'immagine "pulita" (nessun rumore, come uno screenshot del
 * barcode generato) a partire dalla matrice di moduli, con un margine
 * chiaro e uno scale factor, e la fa decodificare dalla stessa pipeline usata
 * per leggere i barcode dal vivo/dalla galleria (vedi decodeImage.ts): è la
 * verifica più vicina possibile a "un lettore reale legge questo codice".
 */
function decodeRegeneratedBarcode(
  width: number,
  height: number,
  darkCells: Array<[number, number]>,
  possibleFormats: BarcodeFormat[]
) {
  const QUIET_ZONE = 4;
  const SCALE = 4;

  const imgWidth = (width + QUIET_ZONE * 2) * SCALE;
  const imgHeight = (height + QUIET_ZONE * 2) * SCALE;

  const dark = new Set(darkCells.map(([x, y]) => `${x},${y}`));
  const argb = new Int32Array(imgWidth * imgHeight);

  for (let py = 0; py < imgHeight; py++) {
    for (let px = 0; px < imgWidth; px++) {
      const moduleX = Math.floor(px / SCALE) - QUIET_ZONE;
      const moduleY = Math.floor(py / SCALE) - QUIET_ZONE;
      const isDark =
        moduleX >= 0 && moduleX < width && moduleY >= 0 && moduleY < height && dark.has(`${moduleX},${moduleY}`);
      const v = isDark ? 0 : 255;
      argb[py * imgWidth + px] = (0xff << 24) | (v << 16) | (v << 8) | v;
    }
  }

  const source = new RGBLuminanceSource(argb, imgWidth, imgHeight);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, possibleFormats);
  hints.set(DecodeHintType.TRY_HARDER, true);

  return new MultiFormatReader().decode(bitmap, hints);
}

describe("encodeBarcodeMatrix", () => {
  it("ritorna null per i formati senza encoder disponibile (qr, pdf417) o sconosciuti", () => {
    expect(encodeBarcodeMatrix(BCBP_SAMPLE, "qr")).toBeNull();
    expect(encodeBarcodeMatrix(BCBP_SAMPLE, "pdf417")).toBeNull();
    expect(encodeBarcodeMatrix(BCBP_SAMPLE, "unknown-type")).toBeNull();
    expect(encodeBarcodeMatrix(BCBP_SAMPLE, null)).toBeNull();
    expect(encodeBarcodeMatrix(BCBP_SAMPLE, undefined)).toBeNull();
  });

  it("ritorna null a testo vuoto invece di lanciare", () => {
    expect(encodeBarcodeMatrix("", "aztec")).toBeNull();
  });

  it("rigenera un Aztec Code che una lettura reale ridecodifica allo stesso identico testo BCBP", () => {
    const result = encodeBarcodeMatrix(BCBP_SAMPLE, "aztec");
    expect(result).not.toBeNull();
    const { width, height, path } = result!;
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);

    const darkCells = darkCellsFromPath(path);
    expect(darkCells.length).toBeGreaterThan(0);

    const decoded = decodeRegeneratedBarcode(width, height, darkCells, [BarcodeFormat.AZTEC]);
    expect(decoded.getBarcodeFormat()).toBe(BarcodeFormat.AZTEC);
    expect(decoded.getText()).toBe(BCBP_SAMPLE);
  });

  it("rigenera un Data Matrix che una lettura reale ridecodifica allo stesso identico testo BCBP", () => {
    const result = encodeBarcodeMatrix(BCBP_SAMPLE, "datamatrix");
    expect(result).not.toBeNull();
    const { width, height, path } = result!;

    const darkCells = darkCellsFromPath(path);
    const decoded = decodeRegeneratedBarcode(width, height, darkCells, [BarcodeFormat.DATA_MATRIX]);
    expect(decoded.getBarcodeFormat()).toBe(BarcodeFormat.DATA_MATRIX);
    expect(decoded.getText()).toBe(BCBP_SAMPLE);
  });

  it("il case è irrilevante per il tipo (\"AZTEC\" come \"aztec\")", () => {
    expect(encodeBarcodeMatrix(BCBP_SAMPLE, "AZTEC")).not.toBeNull();
  });
});
