import React from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView } from 'react-native';
import Card from '../components/card';
import { Backdrop } from '@react-native-material/core';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainHeader from '../components/mainHeader';
import BottomBar from '../components/bottombar';
import InteractiveCard from '../components/interactiveCard';

export default function Home() {
    return (
        <View style={styles.container}>
            <ScrollView>
                <MainHeader />
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
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4960ff',
        // paddingBottom: 75,
        // width: "100%",
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
        backgroundColor: "#4900FF",
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
