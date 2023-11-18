import React, { useState } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    StyleSheet,
    Text,
    TextInput,
    TouchableNativeFeedback,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { font } from "../../global/globalVariable";

export default function BudgetIndicator({ budget, spent, creator, personalbudget }) {
    let [modalVisibility, setModalVisibility] = useState(false);
    const [selectedBudget, setselectedBudget] = useState("personal");
    const [translateY] = useState(new Animated.Value(-Dimensions.get("screen").height));
    let [heightModal, setheightmodal] = useState(0);

    let [percent, setPercent] = useState(0);
    let [personalPercent, setPersonalPercent] = useState(0);

    React.useEffect(() => {
        if (spent < budget) setPercent(spent / budget);
        else setPercent(1);

        if (spent < personalbudget) setPersonalPercent(spent / personalbudget);
        else setPersonalPercent(1);
    }, [spent, budget]);

    const ProgressBarWidth = (Dimensions.get("screen").width / 100) * 60;

    const closeModal = () => {
        setModalVisibility(false);
        Animated.timing(translateY, {
            toValue: -Dimensions.get("screen").height,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const openModal = () => {
        setModalVisibility(true);
        Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (event, gestureState) => {
            if (gestureState.dy > 0) {
                translateY.setValue(gestureState.dy);
            }
        },
        onPanResponderRelease: (event, gestureState) => {
            if (gestureState.dy > Dimensions.get("screen").height / 20) {
                closeModal();
            } else {
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            }
        },
    });

    const styles = StyleSheet.create({
        card: {
            backgroundColor: "#FFF",
            borderRadius: 10,
            margin: 10,
            marginTop: 20,
            marginBottom: 0,
            padding: 10,
            elevation: 5,
        },
        row: {
            display: "flex",
            flexDirection: "row",
            marginBottom: 20
        },
        sel: {
            height: 30,
            width: "50%",
            backgroundColor: "#FFF",
            borderBottomWidth: 2,
            borderBottomColor: "#FFF"
        },
        selText: {
            fontFamily: font.text,
            fontSize: 16,
            textAlign: "center"
        },
        modalBackground: {
            flex: 1,
            backgroundColor: "#00000060",
        },
        // modalContainer: {
        //     flex: 1,
        //     backgroundColor: "#00000060",
        //     justifyContent: "center",
        //     alignItems: "center"
        // },
        main: {
            backgroundColor: "white",
            borderRadius: 20,
            width: "100%",
            position: "absolute",
            bottom: 0,
            paddingTop: 10,
            paddingBottom: 10,
        },
        title: {
            fontFamily: font.text_bold,
            fontSize: 16,
            margin: 10
        },
        input: {
            fontFamily: font.text,
            height: 40,
            backgroundColor: "#F5F5F5",
            marginBottom: 20,
            borderRadius: 10,
            paddingLeft: 10,
            paddingRight: 10,
            marginLeft: 10,
            marginRight: 10,
        },
        btn: {
            backgroundColor: "#4900FF",
            padding: 10,
            margin: 10,
            borderRadius: 5,
            width: 100,
            borderWidth: 2,
            borderColor: "#4900FF"
        },
        btnText: {
            fontFamily: font.text,
            fontSize: 15,
            textAlign: "center",
            color: "white"
        },
        rowRight: {
            flexDirection: "row",
            justifyContent: "flex-end",
        }
    });
    

    return (
        <View style={styles.card}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisibility}
                onRequestClose={() => {
                    setModalVisibility(false);
                }}
            >
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={styles.modalBackground} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.main,
                        panResponder.panHandlers,
                        {
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    <View style={styles.main} onLayout={(event) => {
                        var { x, y, width, height } = event.nativeEvent.layout;
                        setheightmodal(y)
                    }}>
                        {/* Contenuto della modale */}
                        <Text style={styles.title}>Imposta budget personale</Text>
                        <Text style={{ color: "gray", fontSize: 13, textAlign: "left", fontFamily: font.text, marginBottom: 10, marginLeft: 10 }}>Imposta un budget unico per te</Text>
                        <TextInput style={styles.input} placeholder="Scrivi il budget" inputMode="decimal" />
                        <View style={styles.rowRight}>
                            <TouchableNativeFeedback>
                                <View style={[styles.btn, { backgroundColor: "white", marginTop: 0 }]}><Text style={[styles.btnText, { color: "black" }]}>Annulla</Text></View>
                            </TouchableNativeFeedback>
                            <TouchableNativeFeedback>
                                <View style={[styles.btn, { marginTop: 0 }]}><Text style={styles.btnText}>Conferma</Text></View>
                            </TouchableNativeFeedback>
                        </View>
                    </View>
                </Animated.View>
            </Modal>


            <Text style={{ color: "#000", fontSize: 16, textAlign: "left", fontFamily: font.text_bold, marginBottom: 10 }}>Budget:</Text>
            <View style={styles.row}>
                <TouchableNativeFeedback
                    onPress={
                        () => setselectedBudget("personal")
                    }
                >
                    <View
                        style={[styles.sel, (selectedBudget == "personal") ? { borderBottomColor: "#4900FF" } : { borderBottomColor: "#FFF" }]}
                    >
                        <Text style={styles.selText}>Personale</Text>
                    </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback
                    onPress={
                        () => setselectedBudget("travel")
                    }
                >
                    <View
                        style={[styles.sel, (selectedBudget == "travel") ? { borderBottomColor: "#4900FF" } : { borderBottomColor: "#FFF" }]}
                    >
                        <Text style={styles.selText}>Del viaggio</Text>
                    </View>
                </TouchableNativeFeedback>
            </View>

            {
                (selectedBudget == "travel") && (
                    (budget != "" && budget != null && !isNaN(budget)) ?
                        <>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ color: "#000", fontSize: 16, textAlign: "left", fontFamily: font.text }}>{spent.toFixed(2)}€</Text>
                                <ProgressBar progress={percent} color={(spent < budget) ? "green" : "red"} style={{ height: 10, borderRadius: 10, width: ProgressBarWidth }} />
                                <Text style={{ color: "#000", fontSize: 16, textAlign: "left", fontFamily: font.text }}>{budget.toFixed(2)}€</Text>
                            </View>
                            <Text style={{ color: "#000", fontSize: 16, textAlign: "center", fontFamily: font.text, margin: 10 }}>{(spent < budget) ? "Hai ancora " + (budget - spent).toFixed(2) + "€ a disposizione!" : "Hai sforato il budget di " + (spent - budget).toFixed(2) + "€ 😥"}</Text>
                        </>
                        :
                        <>
                            <Text style={{ color: "#000", fontSize: 18, textAlign: "left", fontFamily: font.text, marginBottom: 5 }}>Nessun budget impostato! 😥</Text>
                            {
                                (creator) ?
                                    <Text style={{ color: "gray", fontSize: 13, textAlign: "left", fontFamily: font.text, marginBottom: 10 }}>Accedi alle impostazioni del viaggio per impostarne uno</Text>
                                    :
                                    <Text style={{ color: "gray", fontSize: 13, textAlign: "left", fontFamily: font.text, marginBottom: 10 }}>Chiedi all'admin di impostarne uno</Text>
                            }
                        </>
                )
            }

            {
                (selectedBudget == "personal") && (
                    (personalbudget && !isNaN(personalbudget)) ?
                        <>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ color: "#000", fontSize: 16, textAlign: "left", fontFamily: font.text }}>{spent}€</Text>
                                <ProgressBar progress={personalPercent} color={(spent < personalbudget) ? "green" : "red"} style={{ height: 10, borderRadius: 10, width: ProgressBarWidth }} />
                                <Text style={{ color: "#000", fontSize: 16, textAlign: "left", fontFamily: font.text }}>{personalbudget}€</Text>
                            </View>
                            <Text style={{ color: "#000", fontSize: 16, textAlign: "center", fontFamily: font.text, margin: 10 }}>{(spent < personalbudget) ? "Hai ancora " + (personalbudget - spent).toFixed(2) + "€ a disposizione!" : "Hai sforato il budget di " + (spent - personalbudget).toFixed(2) + "€ 😥"}</Text>
                        </>
                        :
                        <>
                            <TouchableNativeFeedback
                                onPress={
                                    () => { openModal() }
                                }
                            >
                                <View style={{ width: "100%" }}>
                                    <Text style={{ color: "#000", fontSize: 18, textAlign: "left", fontFamily: font.text, marginBottom: 5 }}>Nessun budget impostato! 😥</Text>
                                    <Text style={{ color: "gray", fontSize: 13, textAlign: "left", fontFamily: font.text, marginBottom: 10 }}>Clicca qua per impostarne uno</Text>
                                </View>
                            </TouchableNativeFeedback>
                        </>
                )
            }
        </View>
    )
}