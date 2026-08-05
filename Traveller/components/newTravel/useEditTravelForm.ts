import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { Alert } from "react-native";
import { apiSend, isOfflineError } from "../../shared/data/apiClient";
import { cacheKeys } from "../../shared/data/offlineCache";
import { isOnline } from "../../shared/data/netStatus";
import * as ImagePicker from "expo-image-picker";
import { serverLink } from "../../global/globalVariable";
import { getData } from "../../shared/data/localdata";
import { resolveImageUri } from "../../shared/imageUrl";
import type { EditableTravel, PickedCover, UpdateTravelPayload } from "./types";

interface UseEditTravelFormOptions {
  travel: EditableTravel;
  /** invocato dopo il salvataggio o l'eliminazione */
  onDone: () => void;
}

/* Stato e submit della schermata "Modifica viaggio". Ricalca i pattern di
   useCreateTravelForm (copertina, date, privacy) ma parte precompilato dal
   viaggio esistente e aggiorna invece di creare — vedi func/travels.ts
   updateTravel sul server per i campi effettivamente persistiti. */
export function useEditTravelForm({ travel, onDone }: UseEditTravelFormOptions) {
  const [cover, setCover] = useState<PickedCover | null>(null);
  const [name, setName] = useState(travel.name ?? "");
  const [destination, setDestination] = useState(travel.destination ?? "");
  const [startDate, setStartDate] = useState<Date | null>(
    travel.startDate ? new Date(travel.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    travel.endDate ? new Date(travel.endDate) : null
  );
  const [description, setDescription] = useState(travel.description ?? "");
  const [budget, setBudget] = useState(travel.budget == null ? "" : String(travel.budget));
  const [isPrivate, setIsPrivate] = useState(String(travel.visibility ?? "") === "3");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copertina esistente sul server, mostrata finché l'utente non ne sceglie una nuova.
  const existingCoverUri = resolveImageUri(travel.image, "userImage/") ?? null;
  const coverUri = cover?.uri ?? existingCoverUri;

  const pickCover = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 1,
    });

    if (result.canceled) return;

    const [asset] = result.assets;
    setCover({ uri: asset.uri, base64: asset.base64 });
  }, []);

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  /* Carica la nuova copertina (se scelta) e restituisce il nome file salvato dal server. */
  const uploadCover = useCallback(async (): Promise<string | undefined> => {
    if (!cover) return undefined;

    const { data } = await axios.post<string>(`${serverLink}api/travel/uploadImage`, {
      img: cover.base64,
      imgName: cover.uri.split("/").pop(),
    });

    return data;
  }, [cover]);

  const submit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    /* Con una nuova copertina serve la rete (l'upload passa dal server e
       il base64 non va messo in coda). Senza copertina la modifica può
       essere accodata: sono solo campi di testo. */
    if (cover && !isOnline()) {
      Alert.alert(
        "Sei offline",
        "La nuova copertina va caricata sul server: riprova quando torna la connessione."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const image = await uploadCover();

      // userid serve solo alle notifiche: senza, chi modifica il viaggio
      // riceve la push della propria modifica (vedi updateTravel lato server).
      const me = await getData("user");

      const payload: UpdateTravelPayload = {
        id: travel._id,
        userid: me?._id,
        param: {
          name: name.trim(),
          description: description.trim(),
          budget: budget.trim() === "" ? "" : Number(budget.replace(",", ".")),
          destination: destination.trim(),
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
          visibility: isPrivate ? "3" : "1",
          ...(image ? { image } : {}),
        },
      };

      const { queued } = await apiSend(`${serverLink}api/travel/update`, payload, {
        queue: {
          label: "Modifiche al viaggio",
          invalidates: me?._id ? [cacheKeys.joinedTravels(me._id)] : [],
        },
      });

      if (queued) {
        Alert.alert(
          "Modifiche in coda",
          "Sei offline: le modifiche verranno inviate appena torna la connessione."
        );
      }

      onDone();
    } catch (error) {
      console.log("Modifica viaggio", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit,
    isSubmitting,
    uploadCover,
    cover,
    travel._id,
    name,
    description,
    budget,
    destination,
    startDate,
    endDate,
    isPrivate,
    onDone,
  ]);

  const deleteTravel = useCallback(async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const me = await getData("user");
      /* L'eliminazione non va in coda: è irreversibile e riguarda anche gli
         altri partecipanti, quindi deve partire davanti agli occhi di chi
         la conferma, non ore dopo. */
      await apiSend(
        `${serverLink}api/travel/delete`,
        { id: travel._id, userid: me?._id },
        { invalidates: me?._id ? [cacheKeys.joinedTravels(me._id)] : [] }
      );
      onDone();
    } catch (error) {
      console.log("Eliminazione viaggio", error);
      if (isOfflineError(error)) {
        Alert.alert(
          "Sei offline",
          "Per eliminare un viaggio serve una connessione. Riprova più tardi."
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, travel._id, onDone]);

  return {
    coverUri,
    pickCover,
    name,
    setName,
    destination,
    setDestination,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    description,
    setDescription,
    budget,
    setBudget,
    isPrivate,
    togglePrivate: useCallback(() => setIsPrivate((prev) => !prev), []),
    canSubmit,
    isSubmitting,
    submit,
    isDeleting,
    deleteTravel,
  };
}

export type EditTravelForm = ReturnType<typeof useEditTravelForm>;
