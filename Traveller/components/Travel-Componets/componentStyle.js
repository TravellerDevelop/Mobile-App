
import { StyleSheet } from "react-native";
import { ds } from "../../global/designSystem";

export const ComponentStyles = StyleSheet.create({
    container: {
        backgroundColor: ds.colors.surface,
    },
    contentContainer: {
        backgroundColor: ds.colors.surface,
        borderTopEndRadius: ds.layout.sheetRadius,
        borderTopLeftRadius: ds.layout.sheetRadius,
        minHeight: 100,
    },
    /* Card generica dei post (l'intestazione la disegna PostCard) */
    card: {
        borderWidth: 1,
        borderColor: ds.colors.borderSubtle,
        borderRadius: ds.radius.l,
        backgroundColor: ds.colors.surface,
        padding: ds.space[5] - 2,
        marginBottom: ds.space[4],
    },
    contentText: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 13,
        lineHeight: 21,
        color: ds.colors.textBody,
        textAlign: "left",
    },
    nameContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
    },
    nameText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 12,
        color: ds.colors.text,
        marginRight: ds.space[2],
    },
    datetimeText: {
        fontFamily: ds.fontFamily.metaRegular,
        fontSize: 10,
        color: ds.colors.textSecondary,
        marginBottom: ds.space[2],
    },
    rowVote: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
    },
    voteContent: {
        marginBottom: ds.space[2],
    },
    cardButton: {
        backgroundColor: ds.colors.action,
        borderRadius: ds.radius.full,
        height: ds.control.sm + 2,
        marginTop: ds.space[4] + 2,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        ...ds.shadow.md,
    },
    cardButtonText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 12,
        color: ds.colors.white,
        textAlign: "center",
    },
    questionText: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.text,
        marginBottom: ds.space[3],
        textAlign: "left",
    },
    pinned: {
        marginBottom: ds.space[2],
        alignItems: "center",
        flexDirection: "row",
    },
    pinnedText: {
        fontFamily: ds.fontFamily.metaMedium,
        fontSize: 10,
        color: ds.colors.textSecondary,
    },
    Badge: {
        backgroundColor: ds.colors.infoSoft,
        borderRadius: ds.radius.s,
        position: "absolute",
        top: ds.space[4],
        right: ds.space[4],
        paddingHorizontal: ds.space[3],
        paddingVertical: ds.space[2],
    },
    BadgeText: {
        fontFamily: ds.fontFamily.metaSemibold,
        fontSize: 10,
        color: ds.colors.infoText,
        letterSpacing: 0.3,
    },
    editContent: {
        position: "absolute",
        bottom: 0,
        backgroundColor: ds.colors.surface,
        width: "100%",
        borderTopLeftRadius: ds.radius["2xl"],
        borderTopRightRadius: ds.radius["2xl"],
        padding: ds.space[6],
    },
});
