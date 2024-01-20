import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    color,
    font,
    paddingTopPage,
    serverLink,
} from "../global/globalVariable";
import Card from "../shared/card";

export default function Travels({ navigation }) {
  let [myTravel, setMyTravel] = useState([]);

  useEffect(() => {
    axios
      .get(serverLink + "api/travel/takeJoined?userid=" + userData._id)
      .then((res) => {
        if (res.status == 200) setMyTravel(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Cerca un viaggio, una persona..."
        style={styles.input}
      />
      <ScrollView>
        <Text style={styles.mainText}>Tutti i miei viaggi</Text>
        <FlatList
          horizontal={true}
          data={myTravel}
          renderItem={({ item }) => (
            <Card data={item} navigation={navigation} />
          )}
        />
        <Text style={styles.mainText}>Gli ultimi viaggi dei tuoi amici</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: paddingTopPage,
    flex: 1,
    backgroundColor: "#FFF",
    borderBottomColor: color.primary,
    borderBottomWidth: 1,
  },
  input: {
    marginLeft: "5%",
    fontFamily: font.montserrat,
    width: "90%",
    height: 40,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  mainText: {
    fontFamily: font.montserrat,
    fontSize: 18,
    marginLeft: "5%",
    marginTop: 20,
    marginBottom: 20,
  },
});
