import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { serverLink } from "../../global/globalVariable";
import { getData } from "../../shared/data/localdata";
import type {
  CreateTravelPayload,
  Friend,
  PickedCover,
  TravelParticipantPayload,
} from "./types";

const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const INVITE_CODE_LENGTH = 5;

/* Codice invito a 5 caratteri, stesso formato usato finora dall'app */
function generateCode(): string {
  return Array.from(
    { length: INVITE_CODE_LENGTH },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  ).join("");
}

interface UseCreateTravelFormOptions {
  /** invocato dopo la creazione, per aggiornare la home */
  onCreated: (username: string, userid: string) => void;
}

export function useCreateTravelForm({ onCreated }: UseCreateTravelFormOptions) {
  const [creator, setCreator] = useState<TravelParticipantPayload | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);

  const [cover, setCover] = useState<PickedCover | null>(null);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [invited, setInvited] = useState<Friend[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getData("user");
      if (!user?._id) return;

      setCreator({ userid: user._id, username: user.username, creator: true });

      const { data } = await axios.get<Friend[]>(
        `${serverLink}api/follow/takeFollowingsWithInfo?from=${user._id}`
      );
      setFriends(data ?? []);
    };

    loadUser().catch((error) => console.log("Nuovo viaggio — utente", error));
  }, []);

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

  const toggleFriend = useCallback((friend: Friend) => {
    setInvited((prev) =>
      prev.some((f) => f._id === friend._id)
        ? prev.filter((f) => f._id !== friend._id)
        : [...prev, friend]
    );
  }, []);

  const isInvited = useCallback(
    (friend: Friend) => invited.some((f) => f._id === friend._id),
    [invited]
  );

  const canSubmit = useMemo(
    () => name.trim().length > 0 && creator != null,
    [name, creator]
  );

  /* Carica la copertina e restituisce il nome file salvato dal server */
  const uploadCover = useCallback(async (): Promise<string | undefined> => {
    if (!cover) return undefined;

    const { data } = await axios.post<string>(`${serverLink}api/travel/uploadImage`, {
      img: cover.base64,
      imgName: cover.uri.split("/").pop(),
    });

    return data;
  }, [cover]);

  const submit = useCallback(async () => {
    if (!canSubmit || isSubmitting || !creator) return;

    setIsSubmitting(true);

    try {
      const image = await uploadCover();

      const participants: TravelParticipantPayload[] = [
        ...invited.map((friend) => ({
          userid: friend._id,
          username: friend.username,
          creator: false,
        })),
        creator,
      ];

      const payload: CreateTravelPayload = {
        name: name.trim(),
        description: description.trim(),
        budget: budget.trim() === "" ? "" : Number(budget.replace(",", ".")),
        participants,
        visibility: isPrivate ? "3" : "1",
        creation_date: new Date(),
        new_members_allowed: "1",
        code: generateCode(),
        closed: false,
        destination: destination.trim(),
        startDate: startDate ? startDate.toISOString() : "",
        endDate: endDate ? endDate.toISOString() : "",
        ...(image ? { image } : {}),
      };

      await axios.post(`${serverLink}api/travel/create`, payload);
      onCreated(creator.username, creator.userid);
    } catch (error) {
      console.log("Creazione viaggio", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit,
    isSubmitting,
    creator,
    uploadCover,
    invited,
    name,
    description,
    budget,
    isPrivate,
    destination,
    startDate,
    endDate,
    onCreated,
  ]);

  return {
    friends,
    cover,
    pickCover,
    name,
    setName,
    destination,
    setDestination,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    invited,
    toggleFriend,
    isInvited,
    isPrivate,
    togglePrivate: useCallback(() => setIsPrivate((prev) => !prev), []),
    description,
    setDescription,
    budget,
    setBudget,
    canSubmit,
    isSubmitting,
    submit,
  };
}

export type CreateTravelForm = ReturnType<typeof useCreateTravelForm>;
