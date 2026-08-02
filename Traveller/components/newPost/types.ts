/* ============================================================
   Tipi del flusso "Nuovo post"
   Il server accetta un unico payload discriminato dal campo `type`
   su POST api/post/create ({ param: <payload> }).
   ============================================================ */

export type PostType = "text" | "vote" | "payments" | "images" | "todo";

export type RecipientMode = "all" | "custom" | "me";

export interface TravelParticipant {
  userid: string;
  username: string;
  creator?: boolean;
}

export interface Travel {
  _id: string;
  name: string;
  participants: TravelParticipant[];
}

interface BasePostPayload {
  pinned: boolean;
  /** id dell'utente che crea il post */
  creator: string;
  /** id del viaggio */
  travel: string;
}

export interface TextPostPayload extends BasePostPayload {
  type: "text";
  content: string;
}

export interface VotePostPayload extends BasePostPayload {
  type: "vote";
  question: string;
  /** opzioni di risposta */
  content: string[];
  /** username che hanno votato, un array per opzione */
  votes: string[][];
}

export interface PaymentDestinator {
  userid: string;
  payed: boolean;
  personal?: boolean;
}

export interface PaymentPostPayload extends BasePostPayload {
  type: "payments";
  amount: number;
  description: string;
  paymentType: "normal" | "personal";
  destinator: PaymentDestinator[];
}

export interface ImagesPostPayload extends BasePostPayload {
  type: "images";
  /** nomi file restituiti da api/post/addImage */
  source: string[];
  description: string;
}

export interface TodoItem {
  key: number;
  label: string;
  checked: boolean;
}

export interface TodoPostPayload extends BasePostPayload {
  type: "todo";
  description: string;
  items: TodoItem[];
}

export type NewPostPayload =
  | TextPostPayload
  | VotePostPayload
  | PaymentPostPayload
  | ImagesPostPayload
  | TodoPostPayload;

export interface VoteAnswer {
  key: number;
  label: string;
}

export interface PickedImage {
  uri: string;
  base64?: string | null;
  width: number;
  height: number;
}

/** Voce del selettore di tipo (bottom sheet e tab del form) */
export interface PostTypeOption {
  type: PostType;
  label: string;
  description: string;
  icon: string;
  color: string;
}
