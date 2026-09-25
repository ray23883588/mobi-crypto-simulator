// app開啟畫面
import React from 'react';
import {
	View,
	Image,
	StyleSheet,
} from "react-native";

export default function SplashScreen(props) {


	return (
		<View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)", justifyContent: "center" }}>
			<Image style={stylesheet.label} source={require('../assets/Label_t.png')} />
		</View>
	);
}

const stylesheet = StyleSheet.create({
	label: {
		top: -5,
		width: 250,
		height: 190,
		resizeMode: "stretch",
		alignSelf: "center"
	}
});