import React, { useState, useEffect, useRef } from "react";
import {
	Alert,
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	Image,
	Linking,
	FlatList,
	TouchableWithoutFeedback,
	Keyboard,
	LogBox
} from "react-native";
import GlobalStyle from '../../assets/styles'
import { db } from "../../assets/database";
import { collection, doc, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function Login(props) {
	const [email, setEmail] = useState("")
	const [pass, setPass] = useState("")

	const auth = getAuth();
	const handleLogin = () => {
		signInWithEmailAndPassword(auth, email, pass)
			.then((userCredential) => {
				// Signed in 
				const user = userCredential.user;
				createSuccessAlert()
			})
			.catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				createFailAlert(errorCode)
			});
	}

	const createSuccessAlert = () =>
		Alert.alert(
			"成功",
			"登入成功！",
			[
				{ text: "好的" }
			]
		);

	const createFailAlert = (Mes) =>
		Alert.alert(
			"錯誤",
			"登入失敗！請檢查輸入的帳號密碼是否正確！",
			[
				{ text: "好的" }
			]
		);

	return (
		<TouchableWithoutFeedback
			onPress={Keyboard.dismiss}
			accessible={false}
		>
			<View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
				<View style={{ flex: 1 }}>
					<Image style={stylesheet.label} source={require('../../assets/Label_t.png')} />
					<View style={{ top: 50, paddingHorizontal: 40, paddingVertical: 20 }}>
						<Text style={GlobalStyle.TextL}>帳號</Text>
						<TextInput
							style={stylesheet.input}
							value={email}
							keyboardType="email-address"
							placeholder="請輸入您的E-mail"
							placeholderTextColor="rgba(135, 135, 135, 1)"
							onChangeText={(value) => setEmail(value)}
						/>
						<Text style={GlobalStyle.TextL}>密碼</Text>
						<TextInput
							style={stylesheet.input}
							value={pass}
							placeholder="請輸入密碼" secureTextEntry={true}
							placeholderTextColor="rgba(135, 135, 135, 1)"
							onChangeText={(value) => setPass(value)}
						/>
						<TouchableOpacity style={{ alignSelf: "flex-end" }} onPress={() => props.navigation.push('ForgetPassword')}>
							<Text style={[GlobalStyle.TextM, { color: "rgba(135, 135, 135, 1)" }]}>忘記密碼?</Text>
						</TouchableOpacity>
						<TouchableOpacity style={stylesheet.loginButton} onPress={() => handleLogin()}>
							<Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>登入</Text>
						</TouchableOpacity>
						<View style={{ width: "100%", flexDirection: "row", justifyContent: "center" }}>
							<Text style={[GlobalStyle.TextM, { color: "rgba(135, 135, 135, 1)" }]}>還沒有帳號嗎？立即</Text>
							<TouchableOpacity onPress={() => props.navigation.push('SignInScreen')}>
								<Text style={[GlobalStyle.TextM, { color: "#00afaa" }]}>註冊</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</View>
		</TouchableWithoutFeedback>
	)
};
const stylesheet = StyleSheet.create({
	input: {
		position: "relative",
		width: 300,
		height: 60,
		borderRadius: 10,
		bottom: "auto",
		paddingHorizontal: 15,
		backgroundColor: "rgba(59, 59, 59, 1)",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 14,
		color: "white",
		textAlign: "left",
		textAlignVertical: "center",
		margin: 20,
		alignSelf: "center"
	},
	loginButton: {
		width: 200,
		height: 40,
		top: 0,
		margin: 20,
		backgroundColor: "#00afaa",
		justifyContent: "center",
		borderRadius: 35,
		alignSelf: "center",
	},
	label: {
		top: 50,
		width: 200,
		height: 152,
		resizeMode: "stretch",
		alignSelf: "center"
	}
});

