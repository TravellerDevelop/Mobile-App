import React from "react";
import { View, StyleSheet } from "react-native";
import SkeletonScreen from "../SkeletonScreen";
import { Dimensions } from "react-native";

export default function ParticipantsLoading() {
    return (
        <>
            <View style={styles.avatarContainer}>
                <View style={styles.borderAvatarContainer}>
                    <SkeletonScreen width={40} height={40} borderRadius={40} />
                </View>
                <View>
                    <SkeletonScreen width={200} height={20} borderRadius={5} />
                    <SkeletonScreen width={100} height={10} borderRadius={5} style={{marginTop: 10}} />
                </View>
            </View>
            <View style={styles.avatarContainer}>
                <View style={styles.borderAvatarContainer}>
                    <SkeletonScreen width={40} height={40} borderRadius={40} />
                </View>
                <View>
                    <SkeletonScreen width={200} height={20} borderRadius={5} />
                    <SkeletonScreen width={100} height={10} borderRadius={5} style={{marginTop: 10}} />
                </View>
            </View>
            <View style={styles.avatarContainer}>
                <View style={styles.borderAvatarContainer}>
                    <SkeletonScreen width={40} height={40} borderRadius={40} />
                </View>
                <View>
                    <SkeletonScreen width={200} height={20} borderRadius={5} />
                    <SkeletonScreen width={100} height={10} borderRadius={5} style={{marginTop: 10}} />
                </View>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    avatarContainer: {
        marginLeft: 20,
        marginRight: 20,
        paddingBottom: 10,
        paddingTop: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    borderAvatarContainer: {
        backgroundColor: "white",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        width: 40,
        marginRight: -15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginRight: 10,
    }
})