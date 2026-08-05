import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TouchableWithoutFeedback, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import { BrandHeader, HeaderChip, InitialsAvatar } from "./ui";
import AnimatedLottieView from 'lottie-react-native';
import { getData } from '../shared/data/localdata';
import axios from 'axios';
import { ApiFollow, ApiUser } from '../shared/types/api';
import { useNotifications } from './notifications/NotificationsProvider';

interface MainHeaderProps {
    navigation: any;
    updateJoinTravels: any;
    refresh: any;
}

export default function MainHeader({ navigation, updateJoinTravels, refresh }: MainHeaderProps) {
    let [user, setUser] = useState<Partial<ApiUser> | null>(null);
    let [touch, setTouch] = useState(0);
    let [easterVisibility, setEasterVisibility] = useState(false);

    /* Il conteggio del badge arriva dal provider (notifiche non lette +
       richieste di follow ancora in sospeso). Prima l'header faceva una sua
       chiamata a takeFollowersRequest e mostrava solo quelle: le altre
       notifiche non comparivano da nessuna parte. */
    const notifications = useNotifications();
    const badge = notifications.badgeCount;

    setInterval(() => { setTouch(0) }, 5000)

    useEffect(() => {
        userData();
    }, []);

    async function userData() {
        let aus = await getData("user");
        setUser(aus);
    }

    if (refresh) {
        userData();
    }

    const hasUser = user != null && (user as any) != '[]' && (user as any) != false && (user as any) != '';
    const fullName = hasUser ? user!.name + " " + user!.surname : "";

    return (
        <>
            <BrandHeader paddingTop={72} paddingBottom={22}>
                <Modal visible={easterVisibility} animationType="slide">
                    <AnimatedLottieView source={require('../assets/animation/toucan-walk-cycle.json')} autoPlay loop />
                    <Text style={styles.easterText}>Hai clickato troppe volte, ora sei obbligato a guardare il tucano!</Text>
                </Modal>

                <View style={styles.rowHeader}>
                    <TouchableWithoutFeedback onPress={() => {
                        setTouch(touch++);
                        if (touch == 10) {
                            setEasterVisibility(true);
                            setTouch(0);
                        }
                    }}>
                        <View style={styles.logoRow}>
                            <Svg width={16} height={16} viewBox="0 0 16 16">
                                <Path d="M8 1L15 15H1L8 1Z" fill={ds.colors.scale.accent[9]} />
                            </Svg>
                            <Text style={styles.logo}>TRAVELLER</Text>
                        </View>
                    </TouchableWithoutFeedback>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("Notifications")}
                        >
                            <View>
                                <MaterialCommunityIcons name="bell-outline" size={20} color={ds.colors.white} />
                                {badge > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>
                                            {badge > 99 ? "99+" : badge}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={{ marginLeft: ds.space[5] - 2 }}>
                            <InitialsAvatar
                                name={fullName}
                                size={32}
                                color={ds.colors.scale.accent[9]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.headerTitle}>
                    Buongiorno{hasUser ? ", " + user!.name : ""}
                </Text>
                <Text style={styles.headerSubtitle}>Dove andiamo oggi?</Text>

                <HeaderChip
                    icon="plus"
                    label="Unisciti a un viaggio"
                    onPress={() =>
                        navigation.navigate("NewTravel", {
                            initialTab: "join",
                            updateTravels: updateJoinTravels,
                        })
                    }
                />
            </BrandHeader>
        </>
    )
}

const styles = StyleSheet.create({
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ds.space[7] - 2,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        color: ds.colors.white,
        fontSize: 16,
        letterSpacing: 0.5,
        marginLeft: ds.space[3] - 1,
        fontFamily: ds.fontFamily.bold,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 14,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: ds.radius.full,
        backgroundColor: ds.colors.scale.accent[9],
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadgeText: {
        color: ds.colors.white,
        fontFamily: ds.fontFamily.metaSemibold,
        fontSize: 10,
        textAlign: 'center',
    },
    headerTitle: {
        color: ds.colors.white,
        fontSize: 22,
        fontFamily: ds.fontFamily.bold,
        marginBottom: ds.space[1],
    },
    headerSubtitle: {
        color: ds.colors.onBrandMuted,
        fontSize: 13,
        fontFamily: ds.fontFamily.regular,
        marginBottom: ds.space[5] + 2,
    },
    easterText: {
        fontFamily: ds.fontFamily.regular,
        fontSize: 16,
        textAlign: "center",
        marginTop: 50,
    },
})
