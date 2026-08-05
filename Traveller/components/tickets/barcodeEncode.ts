import { AztecCodeWriter, BarcodeFormat, DataMatrixWriter } from "@zxing/library";

/**
 * Rigenera il barcode di un biglietto nella stessa simbologia con cui è stato
 * scansionato (vedi components/tickets/decodeImage.ts e shared/Headers/ticketsHeaders.tsx,
 * che salvano il tipo rilevato dalla fotocamera in ApiTicket.qrtype). Mostrare
 * sempre un QR, indipendentemente dal formato originale, produce un'immagine
 * che non corrisponde più al vero boarding pass: un gate che si aspetta un
 * Aztec Code (Ryanair) o un Data Matrix non è detto legga correttamente un QR
 * con lo stesso testo.
 *
 * Usa @zxing/library, già una dipendenza del progetto per la decodifica
 * (decodeImage.ts): evita di aggiungere una libreria nuova solo per questo.
 * Non copre il PDF417: @zxing/library porta in JS solo il decoder per quel
 * formato, non un encoder, e non c'è già in repo un'alternativa. In quel
 * caso (e per "qr"/formati sconosciuti) il chiamante ricade sul QR code
 * "storico" via react-native-qrcode-svg.
 */

export interface BarcodeMatrix {
  width: number;
  height: number;
  /** Path SVG (attributo "d"): un quadrato unitario per ogni modulo scuro. Va disegnato dentro un <Svg viewBox="0 0 width height"> — 1 unità utente = 1 modulo. */
  path: string;
}

type EncodableType = "aztec" | "datamatrix";

function matrixToPath(matrix: { getWidth(): number; getHeight(): number; get(x: number, y: number): boolean }): BarcodeMatrix {
  const width = matrix.getWidth();
  const height = matrix.getHeight();
  let path = "";

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (matrix.get(x, y)) {
        path += `M${x},${y}h1v1h-1z`;
      }
    }
  }

  return { width, height, path };
}

/**
 * Ricodifica `text` nella simbologia `scanType` (il valore letto dalla fotocamera:
 * "qr" | "aztec" | "pdf417" | "datamatrix" | ...). Ritorna null se il formato non è
 * uno di quelli che sappiamo rigenerare (il chiamante mostra un QR al posto).
 * Non lancia mai: un testo che l'encoder non riesce a codificare (caso limite,
 * non osservato con barcode IATA-BCBP reali) si traduce anch'esso in null.
 */
export function encodeBarcodeMatrix(text: string, scanType?: string | null): BarcodeMatrix | null {
  if (!text) return null;

  const normalized = String(scanType || "").toLowerCase() as EncodableType | string;
  if (normalized !== "aztec" && normalized !== "datamatrix") return null;

  try {
    if (normalized === "aztec") {
      const matrix = new AztecCodeWriter().encode(text, BarcodeFormat.AZTEC, 0, 0);
      return matrixToPath(matrix);
    }

    const matrix = new DataMatrixWriter().encode(text, BarcodeFormat.DATA_MATRIX, 0, 0);
    return matrixToPath(matrix);
  } catch (error) {
    console.log(error);
    return null;
  }
}
