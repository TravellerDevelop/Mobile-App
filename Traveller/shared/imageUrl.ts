import { serverLink } from "../global/globalVariable";

/**
 * Copertine viaggio, foto profilo e immagini dei post arrivano ora dal
 * server come URL S3 completi (vedi Server/util/s3.ts,
 * Server/func/travels.ts#uploadImage, Server/func/post.ts#addPostImage):
 * `travel.image`, `user.image` e ogni elemento di `post.source` sono
 * pronti da usare così come sono, senza anteporre `serverLink`.
 *
 * I documenti creati prima della migrazione a S3 possono però contenere
 * ancora il vecchio nome file "nudo", servito da `Server/static/<legacyPath>`
 * — finché non vengono riscritti da `migrateImagesToS3`
 * (`Server/func/utility.ts`, `GET /api/utility/migrateImagesToS3`), questo
 * helper li ricostruisce come prima. Usare sempre questa funzione invece di
 * concatenare `serverLink` a mano, così i due casi restano gestiti in un
 * solo punto.
 */
export function resolveImageUri(
    image: string | null | undefined,
    legacyPath: "userImage/" | "userImage/posts/"
): string | undefined {
    if (!image) return undefined;
    if (/^https?:\/\//i.test(image)) return image;
    return serverLink + legacyPath + image;
}

/**
 * Estrae solo il nome file da un riferimento immagine, che sia un URL S3
 * completo (`.../userImage/posts/xxx.jpeg`) o un vecchio nome file "nudo"
 * (`xxx.jpeg`, pre-migrazione). Serve per costruire path locali (cache in
 * FileSystem.documentDirectory, salvataggio in galleria): usare l'URL intero
 * lì creerebbe un path con `/` e `:` che FileSystem non sa risolvere (le
 * cartelle intermedie non esistono), da cui l'errore "Directory ... doesn't
 * exist" visto in ImagesComponent/fileSystem quando si passava `i.source`
 * o `url` grezzi invece del solo nome file.
 */
export function imageFileName(ref: string): string {
    const withoutQuery = ref.split("?")[0];
    const segments = withoutQuery.split("/");
    return segments[segments.length - 1];
}
