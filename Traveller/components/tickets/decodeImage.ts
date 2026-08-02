import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
// @ts-ignore — jpeg-js non pubblica tipi propri
import jpeg from "jpeg-js";

/**
 * Decoder di barcode da immagine, indipendente dal decoder nativo di
 * expo-camera (ML Kit su Android / AVFoundation-Vision su iOS).
 *
 * Perché serve: un boarding pass Ryanair reale (Aztec Code) scansionato dal
 * vivo con CameraView restituiva sistematicamente un payload troncato e
 * privo del prefisso "M1" ("BOSSOLASCO/PIETRO" invece della stringa BCBP
 * completa) — sempre lo stesso identico output, non un frame sfortunato:
 * un bug/limite del decoder nativo della piattaforma, non risolvibile lato
 * JS aggiustando il parser o ritentando la scansione live. Verificato
 * decodificando la stessa identica immagine con questa pipeline (jpeg-js +
 * @zxing/library, nessuna dipendenza nativa): il testo estratto è corretto
 * e completo. Usata per "importa dalla galleria" (shared/Headers/ticketsHeaders.tsx),
 * dove l'immagine viene normalizzata in JPEG da expo-image-manipulator prima
 * di arrivare qui, qualunque fosse il formato originale (screenshot PNG,
 * foto JPEG, HEIC su iOS…).
 */

export interface DecodedBarcode {
  /** In minuscolo, stesso vocabolario di expo-camera: "qr" | "aztec" | "pdf417" | "datamatrix" | ... */
  type: string;
  data: string;
}

const SUPPORTED_FORMATS = [
  BarcodeFormat.AZTEC,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.PDF_417,
  BarcodeFormat.DATA_MATRIX,
];

function formatToTypeString(format: BarcodeFormat): string {
  switch (format) {
    case BarcodeFormat.AZTEC: return "aztec";
    case BarcodeFormat.QR_CODE: return "qr";
    case BarcodeFormat.PDF_417: return "pdf417";
    case BarcodeFormat.DATA_MATRIX: return "datamatrix";
    default: return String(format).toLowerCase();
  }
}

/**
 * Decodifica un barcode (boarding pass) dai byte grezzi di un'immagine JPEG.
 * Pura: nessuna dipendenza da moduli nativi Expo, testabile in Jest. Ritorna
 * null se non viene trovato alcun barcode leggibile — non lancia mai per un
 * "not found", solo per byte JPEG realmente malformati.
 */
export function decodeBarcodeFromJpegBytes(bytes: Uint8Array): DecodedBarcode | null {
  // Un unico try/catch attorno a tutta la pipeline: dal punto di vista di chi
  // chiama (l'utente che ha scelto una foto dalla galleria), sia un JPEG
  // corrotto sia "nessun barcode leggibile in questa immagine" sono la stessa
  // cosa — null, mai un'eccezione che spacchi il flusso di importazione.
  try {
    const raw = jpeg.decode(bytes, { useTArray: true });
    const { width, height, data } = raw as { width: number; height: number; data: Uint8Array };

    const pixelCount = width * height;
    const argb = new Int32Array(pixelCount);
    for (let i = 0; i < pixelCount; i++) {
      const r = data[i * 4 + 0];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      argb[i] = (0xff << 24) | (r << 16) | (g << 8) | b;
    }

    const source = new RGBLuminanceSource(argb, width, height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    const result = reader.decode(bitmap, hints);
    return {
      type: formatToTypeString(result.getBarcodeFormat()),
      data: result.getText(),
    };
  } catch (error) {
    return null;
  }
}
