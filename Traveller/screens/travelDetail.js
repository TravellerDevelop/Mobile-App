import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import HeaderTravelDetail from '../shared/headerTravelDetail';

export default function TravelDetail({ navigation, route }) {
    return (
        <View style={styles.container}>
            <ScrollView>
                <HeaderTravelDetail navigation={navigation} data={route.params}  />
                <View style={{ flex: 1, backgroundColor: "#4900FF" }}>
                    <View style={styles.contentContainer}>

                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    contentContainer: {
        flex: 1,
        backgroundColor: "#FFF",
        borderTopEndRadius: 20,
        borderTopLeftRadius: 20,
        minHeight: 100
    }
});