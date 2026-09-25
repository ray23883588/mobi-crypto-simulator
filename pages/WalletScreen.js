// 錢包頁
import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Image,
	ScrollView,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	useWindowDimensions,
	RefreshControl,
	Platform,
	Alert
} from "react-native";
import { useScrollToTop } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PieChart } from 'react-native-svg-charts';
import GlobalStyle from '../assets/styles';
import { db } from "../assets/database";
import { addDoc, collection, doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, prodErrorMap, signOut } from "firebase/auth";
import { coinData } from '../assets/coinData';
import { roundDown } from '../assets/function';
import { AdMobRewarded } from 'expo-ads-admob';
import Toast from 'react-native-toast-message';


export default function WalletScreen(props) {
	const [coinValue, setCoinValue] = useState(Number(0));
	const [coinValue_C, setCoinValue_C] = useState(Number(0));
	const isFocused = useIsFocused();
	const twdValue = props.data.pocket.twd
	const twdValue_C = props.data.pocket_C.twd
	const data = [twdValue, twdValue_C, coinValue, coinValue_C]
	const colors = ["#2567f9", "#ff3c82", "#73bf00", "#ffd306"]
	const total = (twdValue + twdValue_C + coinValue + coinValue_C)

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
			"觀看廣告以獲得20,000NTD(MOBI)",
			"已觀看次數：(" + props.data.adCount + "/10)",
			[
				{ text: "取消", style: "cancel" },
				{ text: "確定", onPress: () => AdMobRewarded.showAdAsync() }
			]
		);

	const adCountCheck = () => {
		if (props.data.adCount < 10) {
			createConfirmAlert();
		}
		else {
			createErrorAlert()
		}
	}

	const createErrorAlert = () => {
		Alert.alert(
			"錯誤",
			"本日觀看次數已達上限！",
			[
				{ text: "關閉" }
			]
		);
	}

	async function getReward() {
		try {
			fetch('https://api.mobicrypto.tw/ad_reward', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({
					id_token: props.userInfo.accessToken,
				})
			}).then(response => {
				if (!response.ok) {
					showToast("error", "錯誤", "伺服器錯誤，請再試一次！")
					throw Error(response.statusText);
				}
				return response.json();
			}).then(json => {
				if (json.status === "success") {
					showToast("success", "已入帳20000NTD(MOBI)！")
				} else {
					showToast("error", "錯誤", "伺服器錯誤，請再試一次！")
				}
			});

		} catch (e) {
			console.log(e)
		}

	}

	const auth = getAuth();

	// 幣現貨總值計算
	const coinValueFunction = async (coins, coins_C) => {
		var coinList = ""
		var coinListArr = []
		var coinValueTemp = 0
		var coinValueTemp_C = 0
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
		}
		for (const [key, value] of Object.entries(coins_C)) {
			if (key != "twd") {
				coinValueTemp_C += (value * dataGet[key]["twd"])
			}
		}
		setCoinValue(coinValueTemp)
		setCoinValue_C(coinValueTemp_C)
	}

	// 圓餅圖資料
	const pieData = data
		.filter((value) => value > 0)
		.map((value, index) => ({
			value,
			svg: {
				fill: colors[index],
			},
			key: `pie-${index}`,
		}))


	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			if (user) {
				const uid = user.uid;
				coinValueFunction(props.data.pocket, props.data.pocket_C);
			}
		});
		AdMobRewarded.removeAllListeners();

		// 廣告相關
		let adUnitid = Platform.select({
			ios: "ca-app-pub-3940256099942544/1712485313",
			android: "ca-app-pub-3940256099942544/1712485313"
		});

		let loadAd = async () => {
			await AdMobRewarded.setAdUnitID(adUnitid);
			await AdMobRewarded.requestAdAsync();
		};

		loadAd();

		AdMobRewarded.addEventListener("rewardedVideoUserDidEarnReward", () => {
			getReward();
			loadAd();
		});

		AdMobRewarded.addEventListener("rewardedVideoDidFailToLoad", () => {
			loadAd();
		});

		AdMobRewarded.addEventListener("rewardedVideoDidDismiss", () => {
			loadAd();
		});
	}, [isFocused]);



	return (
		<View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
			<View style={GlobalStyle.headerBar}>
				<Text style={GlobalStyle.title}>
					錢包
				</Text>
			</View>
			<View style={GlobalStyle.frame}>
				<View style={[GlobalStyle.subTitleView, { marginLeft: 20 }]}>
					<Text style={GlobalStyle.subTitle}>
						總資產：
					</Text>
					<Text style={[GlobalStyle.subTitle, { letterSpacing: 2 }]}>
						{total > 1 ? roundDown(total, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
							: total > 0.01
								? total
								: roundDown(total, 6)} TWD
					</Text>
				</View>
				<View style={{ position: "absolute", top: 160, width: 160, alignSelf: "center", flexDirection: "row", justifyContent: "space-between" }}>
					<View>
						<Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>NTD(庫存)</Text>
						<Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>NTD(跟單)</Text>
						<Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>幣現貨(庫存)</Text>
						<Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>幣現貨(跟單)</Text>
					</View>
					<View>
						<Text style={GlobalStyle.TextM}>
							{twdValue > 1 ? roundDown(twdValue, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
								: twdValue > 0.01
									? twdValue
									: roundDown(twdValue, 6)}
						</Text>
						<Text style={GlobalStyle.TextM}>
							{twdValue_C > 1 ? roundDown(twdValue_C, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
								: twdValue_C > 0.01
									? twdValue_C
									: roundDown(twdValue_C, 6)}
						</Text>
						<Text style={GlobalStyle.TextM}>
							{coinValue > 1 ? roundDown(coinValue, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
								: coinValue > 0.01
									? coinValue
									: roundDown(coinValue, 6)}
						</Text>
						<Text style={GlobalStyle.TextM}>
							{coinValue_C > 1 ? roundDown(coinValue_C, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
								: coinValue_C > 0.01
									? coinValue_C
									: roundDown(coinValue_C, 6)}
						</Text>
					</View>
				</View>
				<PieChart
					style={{ height: 250 }}
					data={pieData}
					innerRadius="80%"
					padAngle={0}
				/>

				<View style={GlobalStyle.normalView}>
					<View style={{ flex: 1, paddingVertical: 15 }}>
						<View style={{ flexDirection: "row", width: "100%", paddingTop: 15 }}>
							<View style={{ flex: 1, justifyContent: "center" }}>
								<Icon style={GlobalStyle.icon} name="checkbox-blank-circle" color={"#2567f9"} size={10} />
							</View>
							<View style={{ flex: 5 }}>
								<Text style={GlobalStyle.TextL}>
									庫存倉新台幣(MOBI)
								</Text>
							</View>
							<View style={{ flex: 2, }}>
								<Text style={[GlobalStyle.TextL, { textAlign: "right" }]}>
									{roundDown(twdValue / (twdValue + twdValue_C + coinValue + coinValue_C) * 100, 2)}%
								</Text>
							</View>
						</View>
						<View style={{ flexDirection: "row", width: "100%", paddingTop: 15 }}>
							<View style={{ flex: 1, justifyContent: "center" }}>
								<Icon style={GlobalStyle.icon} name="checkbox-blank-circle" color={"#ff3c82"} size={10} />
							</View>
							<View style={{ flex: 5 }}>
								<Text style={GlobalStyle.TextL}>
									跟單倉新台幣(MOBI)
								</Text>
							</View>
							<View style={{ flex: 2, }}>
								<Text style={[GlobalStyle.TextL, { textAlign: "right" }]}>
									{roundDown(twdValue_C / (twdValue + twdValue_C + coinValue + coinValue_C) * 100, 2)}%
								</Text>
							</View>
						</View>
						<View style={{ flexDirection: "row", width: "100%", paddingTop: 15 }}>
							<View style={{ flex: 1, justifyContent: "center" }}>
								<Icon style={GlobalStyle.icon} name="checkbox-blank-circle" color={coinValue == 0 ? "#ffd306" : "#73bf00"} size={10} />
							</View>
							<View style={{ flex: 5 }}>
								<Text style={GlobalStyle.TextL}>
									庫存倉幣現貨
								</Text>
							</View>
							<View style={{ flex: 2, }}>
								<Text style={[GlobalStyle.TextL, { textAlign: "right" }]}>
									{roundDown(coinValue / (twdValue + twdValue_C + coinValue + coinValue_C) * 100, 2)}%
								</Text>
							</View>
						</View>
						<View style={{ flexDirection: "row", width: "100%", paddingTop: 15 }}>
							<View style={{ flex: 1, justifyContent: "center" }}>
								<Icon style={GlobalStyle.icon} name="checkbox-blank-circle" color={coinValue == 0 ? "#73bf00" : "#ffd306"} size={10} />
							</View>
							<View style={{ flex: 5 }}>
								<Text style={GlobalStyle.TextL}>
									跟單倉幣現貨
								</Text>
							</View>
							<View style={{ flex: 2 }}>
								<Text style={[GlobalStyle.TextL, { textAlign: "right" }]}>
									{roundDown(coinValue_C / (twdValue + twdValue_C + coinValue + coinValue_C) * 100, 2)}%
								</Text>
							</View>
						</View>

					</View>
				</View>
			</View>
			<View style={stylesheet.buttonView}>
				<TouchableOpacity
					style={[stylesheet.circleButton, { marginRight: 20 }]}
					onPress={() => {
						adCountCheck();
					}}
				>
					<Icon style={GlobalStyle.icon} name="video" color={"white"} size={30} />
					<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>看廣告</Text>
				</TouchableOpacity>

				<TouchableOpacity style={stylesheet.circleButton} onPress={() => props.navigation.push('ChargeScreen')}>
					<Icon style={GlobalStyle.icon} name="cash-plus" color={"white"} size={30} />
					<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>儲值</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const stylesheet = StyleSheet.create({
	buttonView: {
		position: "absolute",
		bottom: 0,
		right: 0,
		padding: 20,
		flexDirection: "row"
	},
	circleButton: {
		position: "relative",
		width: 75,
		height: 75,
		backgroundColor: "#00afaa",
		borderRadius: 75,
		justifyContent: "center",
		alignContent: "center",
	},
});