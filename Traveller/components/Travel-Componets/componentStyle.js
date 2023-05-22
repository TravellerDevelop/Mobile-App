
import { StyleSheet } from "react-native";
import { font } from "../../global/globalVariable";
export const ComponentStyles = StyleSheet.create({
    container: {
        backgroundColor: "white",
    },
    contentContainer: {
        backgroundColor: "#FFF",
        borderTopEndRadius: 20,
        borderTopLeftRadius: 20,
        minHeight: 100
    },
    card: {
        minWidth: 250,
        backgroundColor: "#FFF",
        borderRadius: 10,
        margin: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 1,
            height: 3,
        },
        shadowOpacity: 0.5,
        shadowRadius: 3.84,
        elevation: 5,
    },
    contentText: {
        color: "#000",
        fontSize: 16,
        textAlign: "left",
        fontFamily: font.montserrat,
    },
    nameContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: 5,
    },
    nameText: {
        color: "#000",
        fontSize: 16,
        textAlign: "left",
        fontFamily: font.montserrat,
        marginRight: 5,
    },
    datetimeText: {
        color: "#000",
        fontSize: 12,
        fontFamily: font.montserratLight,
        marginBottom: 10,
    },
    rowVote: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
    },
    cardButton: {
        backgroundColor: "#4900FF",
        borderRadius: 10,
        margin: 10,
        padding: 10,
        elevation: 5,
        alignItems: "center",
    },
    cardButtonText: {
        color: "#FFF",
        fontSize: 16,
        textAlign: "center",
        fontFamily: font.montserrat,
    },
    questionText: {
        color: "#000",
        fontSize: 18,
        textAlign: "left",
        fontFamily: font.montserrat,
        marginBottom: 10,
    },
    pinned: {
        marginBottom: 5,
        alignItems: "center",
        height: 20,
        flexDirection: "row",
    },
    pinnedText: {
        color: "gray",
        fontSize: 12,
        fontFamily: font.montserrat,
    },
    Badge: {
        backgroundColor: "#4900FF",
        borderRadius: 10,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        elevation: 5,
        color: "#FFF",
        position: "absolute",
        top: 10,
        right: 0,
        paddingLeft: 5,
        paddingRight: 5,
    },
    BadgeText: {
        color: "#FFF",
        fontSize: 13,
        fontFamily: font.montserrat,
        marginRight: 5,
        marginLeft: 5,
    },
    editContent: {
        position: "absolute",
        bottom: 0,
        backgroundColor: "white",
        width: "100%",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
    }
});