import React from "react";
import { ds } from "../../global/designSystem";
import PostHeroScreen from "./PostHeroScreen";
import { ImagesForm, TextForm, TodoForm, VoteForm } from "./forms";
import type { NewPostForm } from "./useNewPostForm";

interface TypeScreenProps {
  form: NewPostForm;
  onClose: () => void;
}

/* Ogni tipo di post ha la propria schermata dedicata (hero a gradiente
   colorata secondo il tipo, come nel selettore di "Nuovo post"), sullo
   stesso schema di PaymentPostScreen. */

export function TextPostScreen({ form, onClose }: TypeScreenProps) {
  return (
    <PostHeroScreen
      form={form}
      onClose={onClose}
      icon="file-document"
      title="Nuovo testo"
      description="Scrivi un messaggio per il gruppo"
      gradientColors={[ds.colors.action, ds.colors.scale.accent[11]]}
    >
      <TextForm form={form} />
    </PostHeroScreen>
  );
}

export function VotePostScreen({ form, onClose }: TypeScreenProps) {
  return (
    <PostHeroScreen
      form={form}
      onClose={onClose}
      icon="poll"
      title="Nuovo sondaggio"
      description="Fai scegliere qualcosa al gruppo"
      gradientColors={[ds.colors.scale.primary[9], ds.colors.scale.primary[11]]}
    >
      <VoteForm form={form} />
    </PostHeroScreen>
  );
}

export function ImagesPostScreen({ form, onClose }: TypeScreenProps) {
  return (
    <PostHeroScreen
      form={form}
      onClose={onClose}
      icon="image"
      title="Nuove immagini"
      description="Condividi foto del viaggio"
      gradientColors={[ds.colors.scale.success[9], ds.colors.scale.success[11]]}
    >
      <ImagesForm form={form} />
    </PostHeroScreen>
  );
}

export function TodoPostScreen({ form, onClose }: TypeScreenProps) {
  return (
    <PostHeroScreen
      form={form}
      onClose={onClose}
      icon="format-list-checks"
      title="Nuova lista"
      description="Crea una lista di cose da fare"
      gradientColors={[ds.colors.scale.accent[11], ds.colors.scale.primary[10]]}
    >
      <TodoForm form={form} />
    </PostHeroScreen>
  );
}
