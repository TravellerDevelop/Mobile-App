import React from 'react';
import { View, Text, Image } from 'react-native';
import { ComponentStyles } from './componentStyle';
import { Badge } from '@react-native-material/core';

export default function TextComponent({ item, home, travel }) {
    return (
        <View style={ComponentStyles.card}>
            {(item.pinned && !home) ? 
                <View style={ComponentStyles.pinned}>
                    <Image source={require("../../assets/image/pin.png")} style={{width: 20, height: 20, marginRight: 5, tintColor:"lightgray"}} />
                    <Text style={ComponentStyles.pinnedText}>Fissato in alto</Text>
                </View>
                : null
            }

            {(home) ? 
                <Badge label={travel} style={ComponentStyles.Badge} labelStyle={ComponentStyles.BadgeText} />
                : null
            }

            <View style={ComponentStyles.headerContainer}>
                <View style={ComponentStyles.nameContainer}>
                    <Text style={ComponentStyles.nameText}>@{item.creator}</Text>
                </View>
                <Text style={ComponentStyles.datetimeText} >{item.dateTime}</Text>
            </View>
            <Text style={ComponentStyles.contentText} >{item.content}</Text>
        </View>
    )
}