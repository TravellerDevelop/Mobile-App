/* ============================================================
   Traveller — Normalizzazione dei post per la UI

   Home e travelDetail rimodellavano la risposta del server con lo
   stesso ciclo copiato in due punti (data formattata, `source` delle
   immagini trasformato in `{id, source}[]`). Con la cache offline le
   copie diventavano quattro — una per il ramo "dal server" e una per
   il ramo "dalla cache" in ciascuna schermata — quindi la
   trasformazione vive qui e viene applicata una volta sola, prima di
   scrivere in cache: quello che si rilegge da locale è già pronto.

   NOTA: la funzione non muta l'array in ingresso (il vecchio codice
   sì), perché lo stesso oggetto finisce sia nello stato React sia in
   JSON su AsyncStorage.
   ============================================================ */

export function shapePost(post: any): any {
  const shaped: any = { ...post };

  shaped.dateTime = new Date(post.dateTime).toLocaleString("it-IT", {
    timeZone: "Europe/Andorra",
  });

  if (post.type === "images" && Array.isArray(post.source)) {
    shaped.source = post.source.map((image: any, index: number) => ({
      id: index,
      source: image,
    }));
  }

  return shaped;
}

export function shapePosts(posts: any[]): any[] {
  if (!Array.isArray(posts)) return [];
  return posts.map(shapePost);
}

/** Risposta di `api/post/takeLastsByUsername`: [post, mappa id viaggio → nome]. */
export function shapeFeed(
  data: [any[], Record<string, string>]
): [any[], Record<string, string>] {
  if (!Array.isArray(data)) return [[], {}];
  return [shapePosts(data[0] ?? []), data[1] ?? {}];
}
