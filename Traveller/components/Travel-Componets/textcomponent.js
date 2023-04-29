import React from 'react';
import { View, Text, Image } from 'react-native';
import { ComponentStyles } from './componentStyle';

export default function TextComponent({ item }) {
    return (
        <View style={ComponentStyles.card}>
            {(item.pinned) ? 
                <View style={ComponentStyles.pinned}>
                    <Image source={require("../../assets/image/pin.png")} style={{width: 20, height: 20, marginRight: 5, tintColor:"lightgray"}} />
                    <Text style={ComponentStyles.pinnedText}>Fissato in alto</Text>
                </View>
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