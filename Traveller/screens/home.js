import React from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView } from 'react-native';
import Card from '../shared/card';
import MainHeader from '../components/mainHeader';
import BottomBar from '../components/bottombar';
import InteractiveCard from '../components/interactiveCard';
import { color } from '../global/globalVariable';

export default function Home( { navigation } ) {
    return (
        <View style={styles.container}>
            <ScrollView>
                <MainHeader navigation={navigation} />
                <View style={styles.blue}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Home</Text>

                        <Text style={styles.subtitle}>Horizontal FlatList</Text>
                        <FlatList
                            data={[
                                { key: 'Devin' },
                                { key: 'Dan' },
                                { key: 'Dominic' },
                                { key: 'Jackson' },
                                { key: 'James' },
                                { key: 'Joel' },
                                { key: 'John' },
                                { key: 'Jillian' },
                            ]}
                            horizontal
                            renderItem={({ item }) => <Card data={item} />}
                        />

                        <InteractiveCard />

                        <Text style={styles.subtitle}>Horizontal FlatList</Text>
                        <FlatList
                            data={[
                                { key: 'Devin' },
                                { key: 'Dan' },
                                { key: 'Dominic' },
                                { key: 'Jackson' },
                                { key: 'James' },
                                { key: 'Joel' },
                                { key: 'John' },
                                { key: 'Jillian' },
                            ]}
                            horizontal
                            renderItem={({ item }) => <Card data={item} />}
                        />
                    </View>
                    <View style={{ height: 75, backgroundColor: "#FFF", width: "100%" }} />
                </View>
            </ScrollView >
            <BottomBar />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: color.primary,
    },
    title: {
        fontSize: 30,
        fontWeight: 200,
        marginBottom: 20,
        fontFamily: "montserrat-regular",
        textAlign: "center"
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 200,
        marginBottom: 10,
        textAlign: "left",
        fontFamily: "montserrat-light",
        marginLeft: 10
    },
    blue: {
        backgroundColor: color.secondary,
        height: "100%",
        width: "100%",
    },
    content: {
        backgroundColor: "white",
        borderTopEndRadius: 20,
        borderTopStartRadius: 20,
        paddingTop: 20,
    }
});
