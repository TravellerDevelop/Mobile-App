import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { serverLink } from "../../global/globalVariable";
import { getData } from "../../shared/data/localdata";
import { apiSend } from "../../shared/data/apiClient";
import { cacheKeys } from "../../shared/data/offlineCache";
import { isOnline } from "../../shared/data/netStatus";
import type {
  NewPostPayload,
  PickedImage,
  PostType,
  RecipientMode,
  TodoItem,
  Travel,
  TravelParticipant,
  VoteAnswer,
} from "./types";

interface UseNewPostFormOptions {
  travel: Travel;
  initialType: PostType;
  /** invocato dopo la creazione andata a buon fine */
  onCreated: (payload: NewPostPayload) => void;
}

/* Stato e regole del form "Nuovo post".
   Tutto lo stato vive qui: la schermata si limita a renderizzare. */
export function useNewPostForm({ travel, initialType, onCreated }: UseNewPostFormOptions) {
  const [type, setType] = useState<PostType>(initialType);
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Testo
  const [text, setText] = useState("");

  // Sondaggio
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<VoteAnswer[]>([
    { key: 1, label: "" },
    { key: 2, label: "" },
  ]);

  // Pagamento
  const [amount, setAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  // Immagini
  const [images, setImages] = useState<PickedImage[]>([]);
  const [imagesDescription, setImagesDescription] = useState("");

  // To Do
  const [todoDescription, setTodoDescription] = useState("");
  const [todoItems, setTodoItems] = useState<TodoItem[]>([
    { key: 1, label: "", checked: false },
  ]);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getData("user");
      setUserId(user?._id ?? "");
    };

    loadUser().catch((error) => console.log("Nuovo post — utente", error));
  }, []);

  /* Partecipanti diversi da me: sono i possibili destinatari di un pagamento */
  const otherParticipants = useMemo<TravelParticipant[]>(
    () => (travel.participants ?? []).filter((p) => p.userid !== userId),
    [travel.participants, userId]
  );

  /* ---- Sondaggio ------------------------------------------- */
  const addAnswer = useCallback(() => {
    setAnswers((prev) => [...prev, { key: (prev.at(-1)?.key ?? 0) + 1, label: "" }]);
  }, []);

  const updateAnswer = useCallback((key: number, label: string) => {
    setAnswers((prev) => prev.map((a) => (a.key === key ? { ...a, label } : a)));
  }, []);

  const removeAnswer = useCallback((key: number) => {
    setAnswers((prev) => (prev.length <= 2 ? prev : prev.filter((a) => a.key !== key)));
  }, []);

  /* ---- Pagamento ------------------------------------------- */
  const toggleRecipient = useCallback((userid: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(userid) ? prev.filter((id) => id !== userid) : [...prev, userid]
    );
  }, []);

  /* ---- Immagini -------------------------------------------- */
  const pickImages = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    setImages(
      result.assets.map(({ uri, base64, width, height }) => ({ uri, base64, width, height }))
    );
  }, []);

  const removeImage = useCallback((uri: string) => {
    setImages((prev) => prev.filter((image) => image.uri !== uri));
  }, []);

  /* ---- To Do ------------------------------------------------ */
  const addTodoItem = useCallback(() => {
    setTodoItems((prev) => [
      ...prev,
      { key: (prev.at(-1)?.key ?? 0) + 1, label: "", checked: false },
    ]);
  }, []);

  const updateTodoItem = useCallback((key: number, label: string) => {
    setTodoItems((prev) => prev.map((item) => (item.key === key ? { ...item, label } : item)));
  }, []);

  const removeTodoItem = useCallback((key: number) => {
    setTodoItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.key !== key)));
  }, []);

  /* ---- Validazione ------------------------------------------ */
  const parsedAmount = useMemo(() => Number(amount.replace(",", ".")), [amount]);

  const canSubmit = useMemo(() => {
    switch (type) {
      case "text":
        return text.trim().length > 0;
      case "vote":
        return (
          question.trim().length > 0 &&
          answers.filter((a) => a.label.trim().length > 0).length >= 2
        );
      case "payments":
        return (
          !Number.isNaN(parsedAmount) &&
          parsedAmount > 0 &&
          (recipientMode !== "custom" || selectedRecipients.length > 0)
        );
      case "images":
        return images.length > 0;
      case "todo":
        return todoItems.some((item) => item.label.trim().length > 0);
      default:
        return false;
    }
  }, [
    type,
    text,
    question,
    answers,
    parsedAmount,
    recipientMode,
    selectedRecipients,
    images,
    todoItems,
  ]);

  /* Carica le immagini sul server e restituisce i nomi file salvati */
  const uploadImages = useCallback(async (): Promise<string[]> => {
    const uploads = images.map(async (image) => {
      const { data } = await axios.post<string>(`${serverLink}api/post/addImage`, {
        img: image.base64,
        name: image.uri.split("/").pop(),
      });
      return data;
    });

    return Promise.all(uploads);
  }, [images]);

  /* Costruisce il payload richiesto dal server per il tipo corrente */
  const buildPayload = useCallback(async (): Promise<NewPostPayload> => {
    const base = { pinned, creator: userId, travel: travel._id };

    switch (type) {
      case "text":
        return { ...base, type, content: text.trim() };

      case "vote": {
        const options = answers
          .map((answer) => answer.label.trim())
          .filter((label) => label.length > 0);

        return {
          ...base,
          type,
          question: question.trim(),
          content: options,
          votes: options.map(() => []),
        };
      }

      case "payments": {
        const destinator =
          recipientMode === "me"
            ? [{ userid: userId, payed: false, personal: true }]
            : (recipientMode === "custom"
                ? otherParticipants.filter((p) => selectedRecipients.includes(p.userid))
                : otherParticipants
              ).map((p) => ({ userid: p.userid, payed: false }));

        return {
          ...base,
          type,
          amount: parsedAmount,
          description: paymentNote.trim(),
          paymentType: recipientMode === "me" ? "personal" : "normal",
          destinator,
        };
      }

      case "images":
        return {
          ...base,
          type,
          source: await uploadImages(),
          description: imagesDescription.trim(),
        };

      case "todo":
        return {
          ...base,
          type,
          description: todoDescription.trim(),
          items: todoItems.filter((item) => item.label.trim().length > 0),
        };
    }
  }, [
    pinned,
    userId,
    travel._id,
    type,
    text,
    answers,
    question,
    recipientMode,
    otherParticipants,
    selectedRecipients,
    parsedAmount,
    paymentNote,
    uploadImages,
    imagesDescription,
    todoDescription,
    todoItems,
  ]);

  const submit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    /* I post con immagini richiedono l'upload dei file prima della
       creazione: metterli in coda vorrebbe dire conservare i base64
       (spesso alcuni MB l'uno) dentro AsyncStorage, che non è pensato per
       quel volume. Sono l'unico tipo di post bloccato offline. */
    if (type === "images" && !isOnline()) {
      Alert.alert(
        "Sei offline",
        "Le foto vanno caricate sul server: riprova quando torna la connessione. Gli altri tipi di post si possono creare anche offline."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await buildPayload();
      const { queued } = await apiSend(
        `${serverLink}api/post/create`,
        { param: payload },
        {
          queue: {
            label: "Nuovo post",
            invalidates: [cacheKeys.travelPosts(travel._id)],
          },
        }
      );

      if (queued) {
        Alert.alert(
          "Post in coda",
          "Sei offline: il post verrà pubblicato automaticamente appena torna la connessione."
        );
      }

      onCreated(payload);
    } catch (error) {
      console.log("Creazione post", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, type, buildPayload, onCreated, travel._id]);

  return {
    type,
    setType,
    pinned,
    togglePinned: useCallback(() => setPinned((prev) => !prev), []),
    isSubmitting,
    canSubmit,
    submit,

    text,
    setText,

    question,
    setQuestion,
    answers,
    addAnswer,
    updateAnswer,
    removeAnswer,

    amount,
    setAmount,
    paymentNote,
    setPaymentNote,
    recipientMode,
    setRecipientMode,
    selectedRecipients,
    toggleRecipient,
    otherParticipants,

    images,
    pickImages,
    removeImage,
    imagesDescription,
    setImagesDescription,

    todoDescription,
    setTodoDescription,
    todoItems,
    addTodoItem,
    updateTodoItem,
    removeTodoItem,
  };
}

export type NewPostForm = ReturnType<typeof useNewPostForm>;
