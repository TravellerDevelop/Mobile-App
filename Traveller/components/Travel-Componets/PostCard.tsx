import { Badge } from '@react-native-material/core';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import PostMenu from '../../screens/Modals/postMenu';
import { ComponentStyles } from './componentStyle';

const PostCard = ({ children, item, home, travel, loadPosts, username }: any) => {
    let [showMenu, setShowMenu] = React.useState(false);

    return (
        <View style={ComponentStyles.card}>
            <PostMenu
                item={item}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                type={item.type}
                loadPosts={loadPosts}
            />
            {item.creator == username && !home && (
                <View style={{ position: "absolute", top: 0, right: 0, zIndex: 99 }}>
                    <TouchableOpacity
                        style={{ position: "absolute", top: 5, right: 5, zIndex: 100 }}
                        onPress={() => {
                            setShowMenu(!showMenu);
                        }}
                    >
                        <Image
                            source={require("../../assets/image/icona-more-cerchio.png")}
                            style={{ width: 20, height: 20, tintColor: "lightgray" }}
                        />
                    </TouchableOpacity>
                </View>
            )}

            {item.pinned && !home && (
                <View style={ComponentStyles.pinned}>
                    <Image
                        source={require("../../assets/image/pin.png")}
                        style={{
                            width: 20,
                            height: 20,
                            marginRight: 5,
                            tintColor: "lightgray",
                        }}
                    />
                    <Text style={ComponentStyles.pinnedText}>Fissato in alto</Text>
                </View>
            )}

            {home && (
                <Badge
                    label={travel}
                    style={ComponentStyles.Badge}
                    labelStyle={ComponentStyles.BadgeText}
                />
            )}

            <View>
                <View style={ComponentStyles.nameContainer}>
                    <Text style={ComponentStyles.nameText}>@{item.creator}</Text>
                </View>
                <Text style={ComponentStyles.datetimeText}>
                    {item.dateTime.substring(0, item.dateTime.length - 3)}
                </Text>
            </View>
            {children}
        </View>
    )
};

export default PostCard;