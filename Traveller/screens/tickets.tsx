import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { serverLink } from "../global/globalVariable";
import { ds } from "../global/designSystem";
import { EmptyState, OverscrollBackdrop, SearchField, Sheet } from "../components/ui";
import TicketsHeader from "../shared/Headers/ticketsHeaders";
import TicketsPreview from "../components/tickets/ticketsPreview";
import axios from "axios";
import { getData } from "../shared/data/localdata";
import { FlatList } from "react-native-gesture-handler";
import { storeJsonData } from "../shared/data/localdata";
import TicketsLoading from "../components/loading/tiketsLoading";
import { ApiTicket } from "../shared/types/api";

export default function Tickets({ navigation }: { navigation: any }) {
    let [data, setData] = useState<ApiTicket[]>([]);
    let [ausTicket, setAusTicket] = useState<ApiTicket[]>([]);
    let [extraData, setExtraData] = useState(false);
    let [search, setSearch] = useState("");
    let [personalData, setPersonalData] = useState<any>(null);
    let [isLoading, setIsLoading] = useState(true);

    const extraDataToggle = () => {
        setExtraData(!extraData);
    }

    async function takeInfo() {
        setIsLoading(true);
        personalData = await getData("user");
        axios.get<ApiTicket[]>(serverLink + "api/tickets/take?userid=" + personalData._id)
            .then(res => {
                setData(res.data);
                setAusTicket(res.data);
                setIsLoading(false);
                storeJsonData("tickets", res.data);
            }).catch(err => {
                console.log(err);
                setIsLoading(false);
            })
    }

    useEffect(() => {
        takeInfo();
    }, []);

    return (
        <View style={styles.flex}>
            <OverscrollBackdrop topColor={ds.colors.brand} />
            <ScrollView
                style={styles.screen}
                contentContainerStyle={{ backgroundColor: ds.colors.brand, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={false} onRefresh={takeInfo} />}
            >
            <View style={styles.container}>
                <TicketsHeader update={takeInfo} />

                <Sheet style={styles.sheet}>
                    <SearchField
                        placeholder="Cerca biglietto"
                        style={styles.search}
                        onChangeText={(value: string) => {
                            setSearch(value);

                            if (value.length > 0) {
                                let aus = data.filter((item) => {
                                    return item.title.toLowerCase().includes(value.toLowerCase());
                                });
                                setAusTicket(aus);
                                extraDataToggle();
                            }
                            else {
                                setAusTicket(data);
                                extraDataToggle();
                            }
                        }}
                    />

                    {
                        (data.length > 0 && !isLoading) ?
                            <FlatList
                                scrollEnabled={false}
                                data={ausTicket}
                                extraData={extraData}
                                renderItem={({ item }) => (
                                    <TicketsPreview item={item} takeInfo={takeInfo} navigation={navigation} />
                                )}
                            />
                            :
                            (isLoading) ?
                                <>
                                    <TicketsLoading />
                                    <TicketsLoading />
                                </>
                                :
                                <EmptyState
                                    icon="ticket-confirmation-outline"
                                    title="Nessun biglietto"
                                    description="Aggiungi un biglietto per averlo sempre con te, anche offline."
                                />
                    }
                </Sheet>
            </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    screen: {
        backgroundColor: "transparent",
    },
    container: {
        flex: 1,
        backgroundColor: ds.colors.brand,
    },
    sheet: {
        paddingBottom: ds.layout.contentBottomPadding,
    },
    search: {
        marginBottom: ds.space[5] + 2,
    },
});
