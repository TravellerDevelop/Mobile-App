import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serverLink } from "../../global/globalVariable";
import { ds } from "../../global/designSystem";
import { getData } from "../../shared/data/localdata";
import { apiSend } from "../../shared/data/apiClient";
import { cacheKeys } from "../../shared/data/offlineCache";
import PostCard from "./PostCard";
import { ComponentStyles } from "./componentStyle";

let percent: Record<string, number> = {};
let ausItem: any;
let totalVotes: number;
let username = "";

interface VoteProps {
  item: any;
  home: any;
  travel?: any;
  loadPosts?: any;
  username: any;
}

export default function Vote({ item, home, travel, loadPosts, username }: VoteProps) {
  let [checkDisabled, setCheckDisabled] = React.useState(false);
  let [numVote, setNumVote] = React.useState<Record<string, number>>({});

  useEffect(() => {
    const test = async () => {
      let aus = await getData("user");
      username = aus.username;
      ausItem = item;
      let i = 0;
      for (item of ausItem.votes || []) {
        for (aus of item || []) {
          if (aus == username) {
            setChecked(ausItem.content[i]);
            setCheckDisabled(true);
          }
        }
        i++;
      }
      let a: Record<string, number> = {};
      for (let i = 0; i < ausItem.content.length; i++) {
        a[ausItem.content[i]] = (ausItem.votes[i] || []).length;
      }
      setNumVote(a);
      return aus;
    };

    test().catch((err) => console.log("Vote init", err));
  }, []);

  let [checked, setChecked] = React.useState("");

  if (percent[item.content[0]] == undefined) {
    ausItem = item;

    totalVotes = 0;

    for (let aus of ausItem.votes || []) {
      totalVotes += (aus || []).length;
    }
    let i = 0;

    for (let aus of ausItem.votes || []) {
      percent[ausItem.content[i]] = (aus || []).length / totalVotes;
      if (isNaN(percent[ausItem.content[i]])) {
        percent[ausItem.content[i]] = 0;
      }
      i++;
    }
  }

  // Selezione di un'opzione: aggiorna le percentuali mostrate
  function selectOption(option: any) {
    if (checkDisabled) return;

    if (checked != "") {
      let i = 0;
      while (checked != ausItem.content[i]) i++;

      percent[ausItem.content[i]] = (ausItem.votes[i] || []).length / totalVotes;
      if (isNaN(percent[ausItem.content[i]])) percent[ausItem.content[i]] = 0;
    }

    setChecked(option);

    let i = 0;
    while (option != ausItem.content[i]) i++;
    percent[ausItem.content[i]] =
      ((ausItem.votes[i] || []).length + 1) / (totalVotes + 1);
  }

  // Invio del voto al server
  function sendVote() {
    if (checked == "" || checkDisabled) return;

    let aus = item.votes;
    let i = 0;
    while (checked != ausItem.content[i]) i++;
    aus[i].push(username);

    /* Il voto è già mostrato come dato (setChecked): offline la richiesta
       va in coda e viene inviata al ritorno della rete. */
    apiSend(
      serverLink + "api/post/updateVote",
      { id: item._id, vote: aus },
      {
        queue: {
          label: "Voto",
          invalidates: item.travel ? [cacheKeys.travelPosts(item.travel)] : [],
        },
      }
    )
      .then(() => setCheckDisabled(true))
      .catch((err) => console.log(err));
  }

  return (
    <PostCard
      item={item}
      home={home}
      travel={travel}
      loadPosts={loadPosts}
      username={username}
    >
      <Text style={ComponentStyles.questionText}>{item.question}</Text>

      <View style={styles.options}>
        {item.content.map((option: any) => {
          const pct = Math.round((percent[option] || 0) * 100);
          const isChecked = checked === option;

          return (
            <TouchableOpacity
              key={option}
              activeOpacity={checkDisabled ? 1 : 0.8}
              onPress={() => selectOption(option)}
            >
              <View style={styles.optionBar}>
                {/* Riempimento proporzionale ai voti */}
                <View style={[styles.optionFill, { width: `${pct}%` }]} />
                <View style={styles.optionRow}>
                  <View style={styles.optionLabelRow}>
                    {isChecked && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={12}
                        color={ds.colors.action}
                        style={{ marginRight: ds.space[2] }}
                      />
                    )}
                    <Text style={styles.optionLabel} numberOfLines={1}>
                      {option}
                    </Text>
                  </View>
                  <Text style={styles.optionPct}>
                    {pct}%
                    {numVote[option] != null ? ` · ${numVote[option]}` : ""}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {checkDisabled ? (
        <View style={[ComponentStyles.cardButton, styles.sentButton]}>
          <MaterialCommunityIcons
            name="check"
            size={14}
            color={ds.colors.successText}
            style={{ marginRight: ds.space[2] }}
          />
          <Text style={[ComponentStyles.cardButtonText, { color: ds.colors.successText }]}>
            Risposta inviata
          </Text>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.85} onPress={sendVote}>
          <View
            style={[
              ComponentStyles.cardButton,
              checked == "" && { backgroundColor: ds.colors.disabledBg },
            ]}
          >
            <Text style={ComponentStyles.cardButtonText}>Invia risposta</Text>
          </View>
        </TouchableOpacity>
      )}
    </PostCard>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: ds.space[3] - 1,
  },
  optionBar: {
    position: "relative",
    height: 32,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[2],
    overflow: "hidden",
  },
  optionFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.accent[4],
  },
  optionRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ds.space[4],
  },
  optionLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: ds.space[3],
  },
  optionLabel: {
    flex: 1,
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.text,
  },
  optionPct: {
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  sentButton: {
    backgroundColor: ds.colors.successSoft,
  },
});
