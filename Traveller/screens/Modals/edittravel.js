import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import {
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  SafeAreaView,
} from "react-native";
// Animated,
import { TextInput } from "react-native-paper";
import { globalStyleComponent } from "../../global/globalStyleComponent";
import { color, font, serverLink } from "../../global/globalVariable";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { EasingNode } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export default function EditTravel({ navigation, route }) {
  let item = route.params;
  const grayBarWidth = useRef(new Animated.Value(0)).current;
  let [name, setName] = React.useState(item.name);
  let [description, setDescription] = React.useState(item.description);
  let [budget, setBudget] = React.useState(item.budget);

  // const [scrollY, setScrollY] = useState(0);
  const [scrollY] = useState(new Animated.Value(0));
  const scrollViewRef = useRef(null);
  const expand = () => {
    Animated.timing(grayBarWidth, {
      toValue: 100,
      duration: 300,
      easing: EasingNode.linear,
    }).start();
  };

  const reduce = () => {
    Animated.timing(grayBarWidth, {
      toValue: 70, // Cambia da 100 a 0 per restringere
      duration: 100,
      easing: EasingNode.linear,
    }).start();
  };

  useEffect(() => {
    scrollViewRef.current.scrollTo({ y: 100, animated: true });
  }, []);

  const handleScroll = (event) => {
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: false,
    });
    if (event.nativeEvent.contentOffset.y < 100) {
      expand();
    } else {
      reduce();
    }
  };
  const handleScrollEndDrag = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY < 100) {
      scrollViewRef.current.scrollTo({ y: 100, animated: true });
      expand();
    }
  };

  const buttonStyle = {
    borderRadius: 50,
    height: 50,
    padding: 10,
    marginTop: 20,
    width: Dimensions.get("screen").width - 40,
  };
  return (
    <SafeAreaView>
      <View style={{ height: 220, position: "absolute", zIndex: 0 }}>
        {typeof item.image === "string" ? (
          <ImageBackground
            style={{
              height: 450,
              width: Dimensions.get("screen").width,
              backgroundColor: "#000",
            }}
            source={{ uri: serverLink + "userImage/" + item.image }}
            imageStyle={{ opacity: 0.85 }}
          ></ImageBackground>
        ) : (
          <LinearGradient
            colors={["#4960FF", "#4900FF"]}
            style={{
              width: Dimensions.get("screen").width,
              height: Dimensions.get("screen").height,
            }}
          />
        )}
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
            <Animated.View
              style={{
                width: grayBarWidth,
                height: 5,
                backgroundColor: "gray",
                borderRadius: 5,
                marginTop: 15,
              }}
            ></Animated.View>
          </View>
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
            style={[buttonStyle, { backgroundColor: color.secondary }]}
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
                  navigation.goBack();
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
            style={[
              buttonStyle,
              {
                backgroundColor: "white",
                borderColor: "red",
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              axios
                .post(serverLink + "api/travel/close", { id: item._id })
                .then((res) => {
                  navigation.goBack();
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
            style={[
              buttonStyle,
              {
                backgroundColor: "red",
              },
            ]}
            onPress={() => {
              axios
                .post(serverLink + "api/travel/delete", { id: item._id })
                .then((res) => {
                  navigation.goBack();
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
    </SafeAreaView>
  );
}
