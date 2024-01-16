import { Badge } from '@react-native-material/core';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import PostMenu from '../../screens/Modals/postMenu';
import { ComponentStyles } from './componentStyle';
import { font } from '../../global/globalVariable';
import { Avatar } from 'react-native-paper';
import { getUserInfo } from "../../controllers/userData";

const PostCard = ({ children, item, home, travel, loadPosts }: any) => {
    let [showMenu, setShowMenu] = React.useState(false);
    let username = (getUserInfo() as any).username;
    let user:any = getUserInfo();

    function stringToColor(string: string) {
        let hash = 0;
        let i;
        for (i = 0; i < string.length; i += 1) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (i = 0; i < 3; i += 1) {
            const value = (hash >> (i * 8)) & 0xff;
            color += `00${value.toString(16)}`.slice(-2);
        }
        return color;
    }

    return (
        <View style={ComponentStyles.card}>
            <PostMenu
                item={item}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                type={item.type}
                loadPosts={loadPosts}
            />
            {item.creatorData[0]._id == user._id && !home && (
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

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Avatar.Text style={{ backgroundColor: stringToColor(item.creatorData[0].name + " " + item.creatorData[0].surname), marginRight: 10 }} labelStyle={{fontFamily:font.text}} color='white' size={30} label={item.creatorData[0].name[0] + item.creatorData[0].surname[0]} />
                <View>
                    <View style={ComponentStyles.nameContainer}>
                        <Text style={ComponentStyles.nameText}>{(item.creatorData[0].username === username) ? "Tu" : item.creatorData[0].username}</Text>
                    </View>
                    <Text style={ComponentStyles.datetimeText}>
                        {item.dateTime.substring(0, item.dateTime.length - 3)}
                    </Text>
                </View>
            </View>
            {children}
        </View>
    )
};

export default PostCard;