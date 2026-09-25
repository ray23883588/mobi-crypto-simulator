import React, { useState, useEffect } from 'react';
import {
	Alert,
	View,
	Text,
	Image,
	ScrollView,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	useWindowDimensions,
	Linking,
	RefreshControl,
	Switch,
	ActivityIndicator
} from "react-native";
import { useScrollToTop, useIsFocused } from '@react-navigation/native';
import GlobalStyle from '../assets/styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from "../assets/database";
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import Toast from 'react-native-toast-message';
import { coinData, coinStr } from '../assets/coinData';
import { timeConvertDateAlt } from '../assets/function';
import { map } from '@firebase/util';

export default function ProfileScreen(props) {
	const window = useWindowDimensions();
	const [refreshing, setRefreshing] = useState(false);
	const [loginStatus, setLoginStatus] = useState(false);
	const [admitCopy, setAdmitCopy] = useState(props.data.admitCopy);
	const profileRef = doc(db, "account", props.data.uid);
	const isFocused = useIsFocused();
	const ref = React.useRef(null);
	const [coinValue, setCoinValue] = useState(Number(0));
	const [processing, setProcessing] = useState(false);


	const auth = getAuth();

	const sendResetPassEmail = () => {
		sendPasswordResetEmail(auth, props.data.email)
			.then(() => {
				createSuccessAlert()
			})
			.catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				createFailAlert(error.code)
			});
	}

	const toggleSwitch = () => {
		admitCopy ? handleAdmitCopyPress(false) : handleAdmitCopyPress(true)
	}

	async function handleAdmitCopyPress(status) {
		if (status === true) {
			Alert.alert(
				"注意事項",
				"您即將開啟跟單功能\n請詳閱以下注意事項：\n" +
				"1. 其他使用者將能夠查看您的庫存與交易紀錄\n" +
				"2. 您的追蹤者將可以進行跟單，依照所設定比例同時掛單\n" +
				"3. 若被跟單時有交易獲益，您將可以獲得跟單者收益之10%\n" +
				"4. 在所有跟單者結束跟單之前，您無法關閉此選項\n" +
				"5. 在關閉接受跟單選項之前，您將無法進行跟單\n" +
				"6. 若您正在進行跟單，您無法接受跟單\n" +
				"\n" +
				"確定要開啟接受跟單選項嗎？",
				[
					{ text: "取消", style: "cancel" },
					{
						text: "確定", onPress: async () => {
							if (Object.keys(props.data.copyTrader.uid).length != 0) {
								Alert.alert(
									"錯誤",
									"請先解除跟單！",
									[
										{ text: "關閉", style: "cancel" }
									]
								);
							}
							else {
								setAdmitCopy(!admitCopy);
								var changeData = true
								await updateDoc(profileRef, {
									admitCopy: changeData
								});
								showToast("success", "已開始接受跟單！")
							}
						}
					}
				]
			);

		} else if (status === false) {
			Alert.alert(
				"注意",
				"確定要關閉接受跟單選項嗎？",
				[
					{ text: "取消", style: "cancel" },
					{
						text: "確定", onPress: async () => {
							var count = 0;
							(props.data.followers).forEach(function (value) {
								if (value.copyTrade == true) {
									count += 1
								}
							})
							if (count != 0) {
								Alert.alert(
									"錯誤",
									"尚有用戶在進行跟單！",
									[
										{ text: "關閉", style: "cancel" }
									]
								);
							}
							else {
								setAdmitCopy(!admitCopy);
								var changeData = false
								await updateDoc(profileRef, {
									admitCopy: changeData
								});
								showToast("success", "已停止接受跟單！")
							}
						}
					}
				]
			);

		}
	}

	const createResetConfirmAlert = () =>
		Alert.alert(
			"確定要修改密碼？",
			"",
			[
				{ text: "取消", style: "cancel" },
				{ text: "確定", onPress: () => sendResetPassEmail() }
			]
		);

	const createSuccessAlert = () =>
		Alert.alert(
			"成功",
			"忘記密碼信件已送出，請查看您的電子信箱！",
			[
				{ text: "好的", onPress: () => { } }
			]
		);

	const createFailAlert = (Mes) => {
		let errorMes = Mes
		if (Mes === "auth/invalid-email" || Mes === "auth/user-not-found") {
			errorMes = "電子信箱格式錯誤或用戶不存在！"
		}
		Alert.alert(
			"錯誤",
			errorMes,
			[
				{ text: "好的" }
			]
		)
	};

	const createCopyTraderAlert = () =>
		Alert.alert(
			"錯誤",
			"您尚未進行跟單！",
			[
				{ text: "關閉", style: "cancel" }
			]
		);

	const showToast = (type, title, message) => {
		if (type === "success") {
			Toast.show({
				type: type,
				text1: title,
				text2: message
			});
		} else if (type === "error") {
			Toast.show({
				type: type,
				text1: "錯誤",
				text2: message
			});
		} else {
			Toast.show({
				type: "info",
				text1: "訊息",
				text2: message
			});
		}
	}

	const createConfirmAlert = () =>
		Alert.alert(
			"確定要登出嗎？",
			"",
			[
				{ text: "取消", style: "cancel" },
				{ text: "確定", onPress: () => logout() }
			]
		);

	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			if (user) {
				const uid = user.uid;
				coinValueFunction(props.data.pocket, props.data.pocket_C);
				setLoginStatus(true)
			} else {
				setLoginStatus(false)
			}
		});

	}, [isFocused]);


	const logout = () => {
		signOut(auth).then(() => {

		}).catch((error) => {
			// 登出失敗
		});
	}

	const coinValueFunction = async (coins, coins_C) => {
		var coinList = ""
		var coinListArr = []
		var coinValueTemp = 0
		for (const [key, value] of Object.entries(coins)) {
			if (key != "twd" && coinListArr.indexOf(key) == -1) {
				coinList += key + ","
				coinListArr.push(key)
			}
		}
		for (const [key, value] of Object.entries(coins_C)) {
			if (key != "twd" && coinListArr.indexOf(key) == -1) {
				coinList += key + ","
				coinListArr.push(key)
			}
		}
		var fetchUrl = "https://api.coingecko.com/api/v3/simple/price?ids=" + coinList + "&vs_currencies=twd"
		const res = await fetch(
			fetchUrl
		);
		const dataGet = await res.json();
		for (const [key, value] of Object.entries(coins)) {
			if (key != "twd") {
				coinValueTemp += (value * dataGet[key]["twd"])
			}
			else {
				coinValueTemp += value
			}
		}
		for (const [key, value] of Object.entries(coins_C)) {
			if (key != "twd") {
				coinValueTemp += (value * dataGet[key]["twd"])
			}
			else {
				coinValueTemp += value
			}
		}
		setCoinValue(coinValueTemp)
	}


	async function subvention() {
		Alert.alert(
			"破產救援",
			"若滿足以下條件，可領取破產救援金50000NTD(MOBI)\n" +
			"1. 所有倉位新台幣與虛擬幣之價值總額小於NT$10000\n" +
			"2. 最近七日內交易次數達20次\n" +
			"\n" +
			"確定要領取破產救援金嗎？",
			[
				{ text: "取消", style: "cancel" },
				{
					text: "確定", onPress: async () => {
						if (coinValue < 10000) {
							setProcessing(true)
							try {
								fetch('https://api.mobicrypto.tw/subvention', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
										'Accept': 'application/json'
									},
									body: JSON.stringify({
										id_token: props.userInfo.accessToken,
										coin_value: coinValue
									})
								}).then(response => {
									if (!response.ok) {
										showToast("error", "錯誤", "伺服器錯誤，請再試一次！")
										setProcessing(false)
										throw Error(response.statusText);
									}
									return response.json();
								}).then(json => {
									if (json.status === "success") {
										showToast("success", "已領取救援金50000NTD(MOBI)！")
										setProcessing(false)
									} else {
										showToast("error", "錯誤", json.message)
										setProcessing(false)
									}
								});

							} catch (e) {
								console.log(e)
							}
						}
						else {
							showToast("error", "錯誤", "您所持資產總額大於NT$10000！")
						}
					}
				}])
	}

	return (
		<View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
			<View style={GlobalStyle.headerBar}>
				<Text style={GlobalStyle.title}>
					個人
				</Text>
			</View>
			<ScrollView
				style={{ width: window.width, backgroundColor: "rgba(21, 21, 21, 1)" }}
				showsVerticalScrollIndicator={false}
				ref={ref}
				bounces={false}
			>
				<View style={GlobalStyle.frame}>
					<View style={{
						left: 25, justifyContent: "flex-end", width: (Dimensions.get("window").width - 50), borderBottomWidth: 1,
						borderColor: "rgba(117, 117, 117, 1)",
					}}>
						<View key={props.data.email} style={stylesheet.profileView}>
							<Text style={[GlobalStyle.TextL, { marginVertical: 10 }]}>暱稱：{props.data.nickname}</Text>
							<Text style={[GlobalStyle.TextL, { marginVertical: 10 }]}>帳號：{props.data.email}</Text>
							<Text style={[GlobalStyle.TextL, { marginVertical: 10 }]}>生日：{props.data.birthday}</Text>
							<Text style={[GlobalStyle.TextL, { marginVertical: 10 }]}>性別：{(props.data.gender == "male") ? "男" : (props.data.gender == "female") ? "女" : "其他"}</Text>
							<Text style={[GlobalStyle.TextL, { marginVertical: 10 }]}>職業：{props.data.profession}</Text>
						</View>

						<View style={{ position: "absolute", bottom: 0, marginBottom: 10, flexDirection: "row" }}>
							{loginStatus === false ? <TouchableOpacity style={stylesheet.systemButton}
								onPress={() =>
									props.navigation.push('Login')
								}>
								<Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>登入</Text>
							</TouchableOpacity> :
								<TouchableOpacity style={stylesheet.systemButton} onPress={() => createConfirmAlert()}>
									<Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>登出</Text>
								</TouchableOpacity>

							}
							{/* <TouchableOpacity style={stylesheet.systemButton} onPress={() => test2()}>
								<Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>測試</Text>
							</TouchableOpacity> */}

							<TouchableOpacity style={stylesheet.systemButton} onPress={() => Linking.openURL("mailto:mobi.manage.acc@gmail.com")}>
								<Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>回報問題</Text>
							</TouchableOpacity>
							<TouchableOpacity style={stylesheet.systemButton} onPress={() => subvention()}>
								<Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>救援金</Text>
							</TouchableOpacity>

						</View>
						<TouchableOpacity
							style={stylesheet.editButton}
							onPress={() =>
								props.navigation.push('EditScreen')
							}>
							<Icon style={GlobalStyle.icon} name="pencil-outline" color={"white"} size={30} />
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={[GlobalStyle.subTitleView, { marginLeft: 20 }]}
						onPress={() =>
							props.navigation.push('FavoriteScreen')
						}>
						<Text style={[GlobalStyle.subTitle, { left: 20 }]}>
							最愛
						</Text>
						<View style={{ position: "absolute", right: 60, alignSelf: "center" }}>
							<Icon name="chevron-right" color={"rgba(117, 117, 117, 1)"} size={40} />
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						style={[GlobalStyle.subTitleView, { marginLeft: 20 }]}
						onPress={() =>
							props.navigation.push('NoteScreen')
						}>
						<Text style={[GlobalStyle.subTitle, { left: 20 }]}>
							筆記
						</Text>
						<View style={{ position: "absolute", right: 60, alignSelf: "center" }}>
							<Icon name="chevron-right" color={"rgba(117, 117, 117, 1)"} size={40} />
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						style={[GlobalStyle.subTitleView, { marginLeft: 20 }]}
						onPress={() => {
							if (Object.keys(props.data.copyTrader.uid).length != 0) {
								props.navigation.push('CopyTrade', { traderData: props.trader.find(value => value.uid == props.data.copyTrader.uid) })
							}
							else {
								createCopyTraderAlert()
							}
						}}>
						<Text style={[GlobalStyle.subTitle, { left: 20 }]}>
							跟單中交易員資料
						</Text>
						<View style={{ position: "absolute", right: 60, alignSelf: "center" }}>
							<Icon name="chevron-right" color={"rgba(117, 117, 117, 1)"} size={40} />
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						style={[GlobalStyle.subTitleView, { marginLeft: 20 }]}
						onPress={() => {
							createResetConfirmAlert();
						}
						}>
						<Text style={[GlobalStyle.subTitle, { left: 20 }]}>
							修改密碼
						</Text>
						<View style={{ position: "absolute", right: 60, alignSelf: "center" }}>
							<Icon name="chevron-right" color={"rgba(117, 117, 117, 1)"} size={40} />
						</View>
					</TouchableOpacity>
					<View style={[GlobalStyle.subTitleView, { marginLeft: 20 }]}>
						<Text style={[GlobalStyle.subTitle, { left: 20 }]}>
							接受跟單
						</Text>
						<View style={{ position: "absolute", right: 55, alignSelf: "center" }}>
							<Switch
								trackColor={{ false: "rgba(117, 117, 117, 1)", true: "#00afaa" }}
								thumbColor={admitCopy ? "white" : "white"}
								ios_backgroundColor="#3e3e3e"
								onValueChange={toggleSwitch}
								value={admitCopy}
							/>
						</View>
					</View>

				</View>
			</ScrollView >
		</View >
	);
}

const stylesheet = StyleSheet.create({
	editButton: {
		position: "relative",
		width: 60,
		height: 60,
		right: 0,
		marginVertical: 10,
		backgroundColor: "#00afaa",
		borderRadius: 60,
		justifyContent: "center",
		alignContent: "center",
		alignSelf: "flex-end"
	},
	systemButton: {
		height: 40,
		backgroundColor: "#00afaa",
		justifyContent: "center",
		borderRadius: 5,
		marginRight: 10,
		paddingHorizontal: 10
	},
	profileView: {
		top: 15,
		flexDirection: "column",
		alignItems: "flex-start",
	},
	noteDate: {
		position: "absolute",
		textAlignVertical: "bottom",
		alignSelf: "flex-end",
		paddingBottom: 0,
		right: 50
	},
	tradeButton: {
		height: 40,
		backgroundColor: "rgba(40, 40, 40, 1)",
		flex: 1,
		justifyContent: "center",
		borderRadius: 5
	}
});