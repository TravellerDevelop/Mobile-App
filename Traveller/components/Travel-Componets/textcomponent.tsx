import React from "react";
import { Text } from "react-native";
import PostCard from "./PostCard";
import { ComponentStyles } from "./componentStyle";

export default function TextComponent({
  item,
  home,
  travel,
  loadPosts,
  username
}:any) {
  return (
    <PostCard item={item} home={home} travel={travel} loadPosts={loadPosts} username={username}>
      <Text style={ComponentStyles.contentText}>{item.content}</Text>
    </PostCard>
  );
}
