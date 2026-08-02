import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PostMenu from '../../screens/Modals/postMenu';
import { InitialsAvatar } from '../ui';
import { ds } from '../../global/designSystem';

/* Icona a destra dell'intestazione, in base al tipo di post */
const typeIcon: any = {
    text: 'file-document-outline',
    vote: 'chart-bar',
    payments: 'wallet-outline',
    images: 'image-outline',
    todo: 'check-circle-outline',
    itinerary: 'map-marker-path',
};

const PostCard = ({ children, item, home, travel, loadPosts, username }: any) => {
    let [showMenu, setShowMenu] = React.useState(false);

    const dateTime = item.dateTime
        ? String(item.dateTime).substring(0, String(item.dateTime).length - 3)
        : '';

    return (
        <View style={styles.card}>
            <PostMenu
                item={item}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                type={item.type}
                loadPosts={loadPosts}
            />

            {/* Post fissato in alto */}
            {item.pinned && !home && (
                <View style={styles.pin}>
                    <MaterialCommunityIcons name="pin" size={11} color={ds.colors.action} />
                    <Text style={styles.pinText}>Fissato</Text>
                </View>
            )}

            <View style={styles.headerRow}>
                <InitialsAvatar
                    name={item.creatorData[0].username}
                    size={32}
                    style={styles.avatar}
                />
                <View style={styles.headerText}>
                    <Text style={styles.author} numberOfLines={1}>
                        @{item.creatorData[0].username}
                    </Text>
                    <View style={styles.metaRow}>
                        {home && travel ? (
                            <>
                                <Text style={styles.meta} numberOfLines={1}>
                                    {travel}
                                </Text>
                                <View style={styles.metaDot} />
                            </>
                        ) : null}
                        <Text style={styles.meta} numberOfLines={1}>
                            {dateTime}
                        </Text>
                    </View>
                </View>

                {item.creatorData[0].username == username && !home ? (
                    <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => setShowMenu(!showMenu)}
                    >
                        <View style={styles.iconChip}>
                            <MaterialCommunityIcons
                                name="dots-horizontal"
                                size={16}
                                color={ds.colors.textSecondary}
                            />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.iconChip, styles.typeChip]}>
                        <MaterialCommunityIcons
                            name={typeIcon[item.type] || 'file-document-outline'}
                            size={14}
                            color={ds.colors.action}
                        />
                    </View>
                )}
            </View>

            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: ds.radius.xl,
        backgroundColor: ds.colors.surface,
        padding: ds.space[5],
        marginBottom: ds.space[5],
        ...ds.shadow.md,
    },
    pin: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ds.colors.actionSubtle,
        borderRadius: ds.radius.full,
        paddingHorizontal: ds.space[3],
        paddingVertical: 3,
        marginBottom: ds.space[3],
    },
    pinText: {
        fontFamily: ds.fontFamily.metaSemibold,
        fontSize: 9,
        color: ds.colors.action,
        marginLeft: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: ds.space[4],
    },
    avatar: {
        ...ds.shadow.md,
    },
    headerText: {
        flex: 1,
        marginLeft: ds.space[3] + 2,
    },
    author: {
        fontFamily: ds.fontFamily.semibold,
        fontSize: 13,
        color: ds.colors.text,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 1,
    },
    meta: {
        fontFamily: ds.fontFamily.metaRegular,
        fontSize: 10,
        color: ds.colors.textSecondary,
    },
    metaDot: {
        width: 2.5,
        height: 2.5,
        borderRadius: 2,
        backgroundColor: ds.colors.textPlaceholder,
        marginHorizontal: ds.space[2],
    },
    iconChip: {
        width: 30,
        height: 30,
        borderRadius: ds.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ds.colors.scale.neutral[2],
    },
    typeChip: {
        backgroundColor: ds.colors.actionSubtle,
    },
});

export default PostCard;
