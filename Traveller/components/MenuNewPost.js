import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { font, serverLink } from '../global/globalVariable';
import { IconButton, MD3Colors } from 'react-native-paper';
import Animated, { Easing, useSharedValue, withSpring, withTiming, useAnimatedStyle, useAnimatedGestureHandler, runOnJS } from 'react-native-reanimated';

export default function MenuNewPost({ data, navigation, onAddData }) {
    let [showPostsMenu, setShowPostsMenu] = useState(false);

    const PostType = [
        { label: "Testo", value: "text", icon: require('../assets/image/icona-documento.png') },
        { label: "Sondaggio", value: "vote", icon: require('../assets/image/icona-istogramma.png') },
        { label: "Pagamento", value: "payments", icon: require('../assets/image/icona-wallet.png') },
        { label: "Immagini", value: "images", icon: require('../assets/image/icona-immagine.png') },
        { label: "To Do", value: "todo", icon: require("../assets/image/Icone/icona-check.png") }
    ]

    const buttonPositions = PostType.map(() => ({
        x: useSharedValue(0),
        y: useSharedValue(0),
    }));

    const handleButtonPress = (index) => {
        navigation.navigate("NewPost", { data: data, refresh: onAddData, type: PostType[index].value })
    };

    const buttonStyles = PostType.map((buttonText, index) => {
        const animatedStyle = useAnimatedStyle(() => {
            return {
                transform: [
                    { translateX: withSpring(buttonPositions[index].x.value) },
                    { translateY: withSpring(buttonPositions[index].y.value) },
                ],
            };
        });

        return animatedStyle;
    });

    const toggleMenu = () => {
        const startPosX = 0; // Posizione iniziale X
        const startPosY = -50; // Posizione iniziale Y

        setShowPostsMenu(!showPostsMenu);

        if (!showPostsMenu) {
            PostType.forEach((_, index) => {
                buttonPositions[index].x.value = startPosX;
                buttonPositions[index].y.value = startPosY;

                buttonPositions[index].x.value = withTiming(index * 1, { duration: 500, easing: Easing.out(Easing.exp) });
                buttonPositions[index].y.value = withTiming(index * 2, { duration: 500, easing: Easing.out(Easing.exp) });
            });
        }
    };

    return (
        <>
            {
                (showPostsMenu) &&
                <View style={{ position: "absolute", right: 10, bottom: 150, zIndex: 100 }}>
                    {PostType.map((buttonData, index) => (
                        <Animated.View key={index} style={[buttonStyles[index]]}>
                            <TouchableOpacity onPress={() => runOnJS(handleButtonPress)(index)}>
                                <View style={[styles.menuChoise]}>
                                    <Image source={buttonData.icon} style={styles.menuChoiseImage} />
                                    <Text style={styles.menuChoiseText}>{buttonData.label}</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    )
                    )}
                </View>
            }

            <IconButton
                icon={(showPostsMenu) ? "close" : "plus"}
                iconColor="#FFF"
                containerColor="#4900FF"
                animated={true}
                size={40}
                style={{ position: "absolute", right: 10, bottom: 80, zIndex: 100 }}
                onPress={() => toggleMenu()}
                mode='contained'
            />
        </>
    )
}

const styles = StyleSheet.create({
    menuChoise: {
        width: 150,
        height: 30,
        borderRadius: 25,
        backgroundColor: "#FFF",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        display: "flex",
        flexDirection: "row",
    },
    menuChoiseImage: { width: 20, height: 20, marginTop: 5, marginLeft: 10, marginRight: 10 },
    menuChoiseText: { color: "#000", fontSize: 16, textAlign: "center", fontFamily: font.text, lineHeight: 30 },
});
