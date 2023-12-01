import React from "react";
import { Text } from "react-native";
import PostCard from "./PostCard";
import { ComponentStyles } from "./componentStyle";

export default function TextComponent({
  item,
  home,
  travel,
  loadPosts,
}: any) {
  return (
    <PostCard item={item} home={home} travel={travel} loadPosts={loadPosts}>
      <Text style={ComponentStyles.contentText}>{item.content}</Text>
    </PostCard>
  );
}
