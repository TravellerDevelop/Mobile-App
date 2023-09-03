import React from "react";
import { ComponentStyles } from "../Travel-Componets/componentStyle";
import { View } from "react-native";
import SkeletonScreen from "../SkeletonScreen";
import { Dimensions } from "react-native";

export default function PostLoading() {
    return (
        <>
            <View style={ComponentStyles.card}>
                <SkeletonScreen width={70} height={20} borderRadius={5} />
                <SkeletonScreen width={100} height={10} borderRadius={5} style={{marginTop: 5}} />
                <SkeletonScreen width={Dimensions.get("window").width - 40} height={20} borderRadius={5} style={{marginTop: 10}} />
                <SkeletonScreen width={Dimensions.get("window").width - 40} height={20} borderRadius={5} style={{marginTop: 5}}  />
                <SkeletonScreen width={Dimensions.get("window").width - 40} height={20} borderRadius={5} style={{marginTop: 5}}/>
            </View>

            <View style={ComponentStyles.card}>
                <SkeletonScreen width={70} height={20} borderRadius={5} />
                <SkeletonScreen width={100} height={10} borderRadius={5} style={{marginTop: 5}} />
                <SkeletonScreen width={(Dimensions.get("screen").width / 100) * 88} height={300} borderRadius={5} style={{marginTop: 10}} />
                <SkeletonScreen width={Dimensions.get("window").width - 40} height={20} borderRadius={5} style={{marginTop: 5}}/>
            </View>
            
            <View style={ComponentStyles.card}>
                <SkeletonScreen width={70} height={20} borderRadius={5} />
                <SkeletonScreen width={100} height={10} borderRadius={5} style={{marginTop: 5}} />
                <SkeletonScreen width={Dimensions.get("window").width - 40} height={20} borderRadius={5} style={{marginTop: 10}} />
                <SkeletonScreen width={Dimensions.get("window").width - 40} height={20} borderRadius={5} style={{marginTop: 5}}  />
                <SkeletonScreen width={Dimensions.get("window").width - 40} height={20} borderRadius={5} style={{marginTop: 5}}/>
            </View>
        </>
    )
}