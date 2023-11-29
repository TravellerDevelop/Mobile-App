import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import {
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  Animated,
} from "react-native";
import { TextInput } from "react-native-paper";
import { globalStyleComponent } from "../../global/globalStyleComponent";
import { color, font, serverLink } from "../../global/globalVariable";
import { ScrollView } from "react-native-gesture-handler";

export default function EditTravel({ item, visible, setVisible }) {
  let [name, setName] = React.useState(item.name);
  let [description, setDescription] = React.useState(item.description);
  let [budget, setBudget] = React.useState(item.budget);

  // const [scrollY, setScrollY] = useState(0);
  const [scrollY] = useState(new Animated.Value(0));
  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollViewRef.current.scrollTo({ y: 100, animated: true });
  }, [])

  const handleScroll = (event) => {
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: false }
    );
  }
  const handleScrollEndDrag = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY < 100) {
      // Abilita lo scroll solo se la posizione è inferiore a 100px
      scrollViewRef.current.scrollTo({ y: 100, animated: true });
    }
  };
  return (
    <Modal animationType="slide" visible={visible}>
      <View style={{ height: 220, position: "absolute", zIndex: 0 }}>
        <ImageBackground
          style={{
            height: "100%",
            width: Dimensions.get("screen").width,
            backgroundColor: "#000",
          }}
          source={{ uri: serverLink + "userImage/" + item.image }}
          imageStyle={{ opacity: 0.85 }}
        ></ImageBackground>
      </View>
      <ScrollView
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollY._value >= 180 ? false : true}
        contentContainerStyle={{ marginTop: 160 }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            backgroundColor: "white",
            marginTop: 180,
            marginBottom: 20,
            height: Dimensions.get("screen").height - 0,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              height: 25,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 70,
                height: 5,
                backgroundColor: "gray",
                borderRadius: 5,
                marginTop: 15,
              }}
            ></View>
          </View>
          <Text
            style={{
              color: color.primary,
              fontSize: 24,
              fontFamily: font.text_bold,
              textAlign: "center",
              marginTop: 50,
            }}
          >
            Modifica viaggio
          </Text>

          <TouchableOpacity
            style={{ position: "absolute", top: 20, right: 20 }}
            onPress={() => {
              setVisible(false);
            }}
          >
            <Text
              style={{
                color: color.primary,
                fontSize: 18,
                fontFamily: font.text,
              }}
            >
              Annulla
            </Text>
          </TouchableOpacity>
          <TextInput
            underlineStyle={{
              borderColor: "white",
              backgroundColor: "transparent",
            }}
            label="Titolo"
            value={name}
            style={globalStyleComponent.input}
            onChangeText={setName}
          />
          <TextInput
            underlineStyle={{
              borderColor: "white",
              backgroundColor: "transparent",
            }}
            label="Descrizione"
            value={description}
            multiline
            style={globalStyleComponent.input}
            onChangeText={setDescription}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TextInput
              underlineStyle={{
                borderColor: "white",
                backgroundColor: "transparent",
              }}
              label="Budget"
              value={budget == null ? "" : budget.toString()}
              style={[
                globalStyleComponent.input,
                { width: Dimensions.get("window").width - 60, marginRight: 5 },
              ]}
              keyboardType="numeric"
              onChangeText={(value) => setBudget(parseInt(value))}
            />
            <Text
              style={{
                color: color.primary,
                fontSize: 18,
                fontFamily: font.text,
              }}
            >
              €
            </Text>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: color.primary,
              borderRadius: 10,
              padding: 10,
              marginTop: 20,
              width: "80%",
            }}
            onPress={() => {
              axios
                .post(serverLink + "api/travel/update", {
                  id: item._id,
                  param: {
                    name: name,
                    description: description,
                    budget: budget,
                  },
                })
                .then((res) => {
                  setVisible(false);
                })
                .catch((err) => {
                  console.log(err);
                });
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontFamily: font.text,
                textAlign: "center",
              }}
            >
              Salva
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "white",
              borderRadius: 10,
              padding: 10,
              marginTop: 20,
              width: "80%",
              borderColor: "red",
              borderWidth: 1,
            }}
            onPress={() => {
              axios
                .post(serverLink + "api/travel/close", { id: item._id })
                .then((res) => {
                  setVisible(false);
                })
                .catch((err) => {
                  console.log(err);
                });
            }}
          >
            <Text
              style={{
                color: "red",
                fontSize: 18,
                fontFamily: font.text,
                textAlign: "center",
              }}
            >
              Chiudi viaggio
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "red",
              borderRadius: 10,
              padding: 10,
              marginTop: 20,
              width: "80%",
            }}
            onPress={() => {
              axios
                .post(serverLink + "api/travel/delete", { id: item._id })
                .then((res) => {
                  setVisible(false);
                })
                .catch((err) => {
                  console.log(err);
                });
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontFamily: font.text,
                textAlign: "center",
              }}
            >
              Elimina viaggio
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}
