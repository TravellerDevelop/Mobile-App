/* Test della pipeline di decodifica barcode-da-immagine (decodeImage.ts).
   Non possiamo incorporare nel repo una vera foto di boarding pass (dati
   personali, e appesantirebbe il repo con un blob base64 enorme): generiamo
   invece un JPEG sintetico al volo con lo stesso encoder/rasterizzatore
   (@zxing/library + jpeg-js) usato per validare manualmente questa pipeline
   contro lo screenshot reale del boarding pass Ryanair che il decoder nativo
   di expo-camera leggeva in modo troncato ("BOSSOLASCO/PIETRO" invece della
   stringa BCBP completa) — vedi il commento in cima a decodeImage.ts. */

import { BarcodeFormat, MultiFormatWriter } from "@zxing/library";
// @ts-ignore — jpeg-js non pubblica tipi propri
import jpeg from "jpeg-js";
import { decodeBarcodeFromJpegBytes } from "./decodeImage";

function makeSyntheticJpeg(text: string, format: BarcodeFormat, size = 300): Uint8Array {
  const writer = new MultiFormatWriter();
  const matrix = writer.encode(text, format, size, size, new Map());
  const width = matrix.getWidth();
  const height = matrix.getHeight();

  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBlack = matrix.get(x, y);
      const idx = (y * width + x) * 4;
      const v = isBlack ? 0 : 255;
      rgba[idx] = v;
      rgba[idx + 1] = v;
      rgba[idx + 2] = v;
      rgba[idx + 3] = 255;
    }
  }

  const encoded = jpeg.encode({ data: rgba, width, height }, 90);
  return new Uint8Array(encoded.data);
}

describe("decodeBarcodeFromJpegBytes", () => {
  test("legge un barcode QR generato al volo (round-trip encoder/decoder)", () => {
    const text = "M1TEST/PERSON EABC123 XXXYYYZZ 0001 100Y001A00010";
    const jpegBytes = makeSyntheticJpeg(text, BarcodeFormat.QR_CODE);

    const result = decodeBarcodeFromJpegBytes(jpegBytes);

    expect(result).not.toBeNull();
    expect(result?.data).toBe(text);
    expect(result?.type).toBe("qr");
  });

  test("ritorna null (non lancia) su byte non-JPEG", () => {
    const garbage = new Uint8Array([1, 2, 3, 4, 5]);
    expect(decodeBarcodeFromJpegBytes(garbage)).toBeNull();
  });

  test("ritorna null su un JPEG valido ma senza alcun barcode", () => {
    // JPEG bianco uniforme: nessun pattern da decodificare.
    const width = 50, height = 50;
    const rgba = new Uint8Array(width * height * 4).fill(255);
    const encoded = jpeg.encode({ data: rgba, width, height }, 90);
    expect(decodeBarcodeFromJpegBytes(new Uint8Array(encoded.data))).toBeNull();
  });
});
