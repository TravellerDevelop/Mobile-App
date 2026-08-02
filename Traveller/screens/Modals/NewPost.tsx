import React, { useCallback } from "react";
import PaymentPostScreen from "../../components/newPost/PaymentPostScreen";
import {
  ImagesPostScreen,
  TextPostScreen,
  TodoPostScreen,
  VotePostScreen,
} from "../../components/newPost/PostTypeScreens";
import { useNewPostForm } from "../../components/newPost/useNewPostForm";
import type { NewPostPayload, PostType, Travel } from "../../components/newPost/types";

interface NewPostRoute {
  params: {
    data: Travel;
    type: PostType;
    refresh: (payload: NewPostPayload) => void;
  };
}

interface NewPostProps {
  navigation: { goBack: () => void };
  route: NewPostRoute;
}

/* Punto di ingresso del flusso "Nuovo post": lo stato vive tutto in
   useNewPostForm, ogni tipo ha la propria schermata dedicata (hero a
   gradiente colorata per tipo) — cambiare tipo dalle tab in cima
   semplicemente cambia quale viene renderizzata, senza perdere lo stato. */
export default function NewPost({ navigation, route }: NewPostProps) {
  const { data: travel, type: initialType, refresh } = route.params;

  const onCreated = useCallback(
    (payload: NewPostPayload) => {
      refresh?.(payload);
      navigation.goBack();
    },
    [refresh, navigation]
  );

  const form = useNewPostForm({ travel, initialType, onCreated });

  switch (form.type) {
    case "text":
      return <TextPostScreen form={form} onClose={navigation.goBack} />;
    case "vote":
      return <VotePostScreen form={form} onClose={navigation.goBack} />;
    case "payments":
      return <PaymentPostScreen form={form} onClose={navigation.goBack} />;
    case "images":
      return <ImagesPostScreen form={form} onClose={navigation.goBack} />;
    case "todo":
      return <TodoPostScreen form={form} onClose={navigation.goBack} />;
  }
}
