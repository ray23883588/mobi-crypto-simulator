import React, { useState, useEffect } from "react";
import {
	RefreshControl,
	View,
	Text,
	Image,
	ScrollView,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	useWindowDimensions,
	TextInput,
	Linking,
	FlatList,
	Modal,
	Alert
} from "react-native";
import { useIsFocused } from '@react-navigation/native';
import { useScrollToTop } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from "../assets/database";
import { collection, doc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { roundDown, timeConvertDate } from "../assets/function";
import GlobalStyle from '../assets/styles'
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';

const wait = (timeout) => {
	return new Promise(resolve => setTimeout(resolve, timeout));
}

export default function HomeScreen(props) {

	const window = useWindowDimensions();
	const [refreshing, setRefreshing] = useState(false);
	const [coins, setCoins] = useState([]);
	const [announce, setAnnounce] = useState([]);
	const [news, setNews] = useState([]);
	const [blog, setBlog] = useState([]);
	const [leaderBoard, setLeaderBoard] = useState([]);
	const [award, setAward] = useState([]);
	const isFocused = useIsFocused();
	const ref = React.useRef(null);
	const ref2 = React.useRef(null);
	const ref3 = React.useRef(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [announceVisible, setAnnounceVisible] = useState(true);
	const copyTrader = props.traderData ? props.traderData : [];

	const auth = getAuth();

	useScrollToTop(ref);
	useScrollToTop(ref2);
	useScrollToTop(ref3);

	const receiveAward = async () => {
		try {
			fetch('https://api.mobicrypto.tw/receive_award', {
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
					if (award.value > 0) showToast("success", "獎勵領取成功！")
				} else {
					showToast("error", "錯誤", "伺服器錯誤，請再試一次！")
				}
			});

		} catch (e) {
			console.log(e)
		}
	}


	const getCoins = async () => {
		const res = await fetch(
			"https://api.coingecko.com/api/v3/coins/markets?vs_currency=twd&order=market_cap_desc&per_page=5&page=1&sparkline=false"
		).then(response => {
			if (!response.ok) {
				console.log(response)
				console.log("首頁錯誤")
				throw Error(response.statusText);
			}
			return response;
		});
		const data = await res.json();
		setCoins(data);
	};
	const getAnnounce = async () => {
		const announceCol = query(collection(db, 'announce'), orderBy("serverTime", "desc"));
		const announceSnapshot = await getDocs(announceCol);
		setAnnounce(announceSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
	};
	const getNews = async () => {
		const newsCol = collection(db, 'news');
		const newsSnapshot = await getDocs(newsCol);
		setNews(newsSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
	};
	const getBlog = async () => {
		const blogCol = collection(db, 'blog');
		const blogSnapshot = await getDocs(blogCol);
		setBlog(blogSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
	};
	const getLeaderBoard = async () => {
		const LeaderBoardCol = query(collection(db, 'account'), orderBy("billing.lastMonthROI", "desc"), limit(3));
		const LeaderBoardSnapshot = await getDocs(LeaderBoardCol);
		setLeaderBoard(LeaderBoardSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
	};
	const getAward = async (uid) => {
		var length = 0
		var roi_temp = 0
		var value_temp = 0
		var start_date = 0
		var end_date = 0
		var awardTemp = {}
		const AwardCol = query(collection(db, 'account', uid, 'award'), where("status", "==", false), orderBy("startTime", "asc"));
		const AwardSnapshot = await getDocs(AwardCol);
		AwardSnapshot.docs.map((doc) => {
			length += 1
			roi_temp += doc.data().ROI
			value_temp += doc.data().value
			if (doc.data().startTime.seconds < start_date || start_date == 0) {
				start_date = doc.data().startTime.seconds
			}
			if (doc.data().endTime.seconds > end_date || end_date == 0) {
				end_date = doc.data().endTime.seconds
			}
		});
		awardTemp = {
			length: length,
			roi: roi_temp / AwardSnapshot.docs.length * 100,
			value: value_temp,
			start_date: timeConvertDate(start_date),
			end_date: timeConvertDate(end_date)
		}
		setAward(awardTemp)
	};

	const onRefresh = React.useCallback(async () => {
		setRefreshing(true);
		await getCoins();
		await getNews();
		await getBlog();
		await getLeaderBoard();
		setRefreshing(false);
	}, [refreshing]);

	const _handlePressButtonAsync = async (url) => {
		let result = await WebBrowser.openBrowserAsync(url);

	};

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

	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			if (user) {
				const uid = user.uid;
				getAward(uid);
				// getProfile(uid);
			}
		});
		getCoins();
		getAnnounce();
		getNews();
		getBlog();
		getLeaderBoard();
		const timer = setInterval(() => {
			getCoins();
		}, 15000)

		return () => {
			clearInterval(timer)
		}
	}, [isFocused]);

	// console.log(coins);

	return (
		<View style={{ backgroundColor: "rgba(21, 21, 21, 1)", flex: 1 }}>
			<Modal
				animationType="fade"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => {
					setModalVisible(!modalVisible);
				}}
				statusBarTranslucent={true}
			>
				<View style={{ backgroundColor: "#000000AA", justifyContent: "center", alignItems: "center", height: "100%" }}>
					<View style={{ width: "80%", height: "55%", backgroundColor: "rgba(21, 21, 21, 1)", borderRadius: 30, alignItems: "center" }}>
						<Image style={stylesheet.label} source={require('../assets/Label_H.png')} />
						<Text style={[GlobalStyle.TextL, { color: "rgba(117, 117, 117, 1)", textAlign: "center" }]}>績效結算</Text>
						<Text style={[GlobalStyle.TextL, { color: "rgba(117, 117, 117, 1)", textAlign: "center" }]}>
							20{award.start_date}～20{award.end_date}
						</Text>
						<View style={{ width: "80%", paddingTop: 25, borderBottomWidth: 1, borderColor: "rgba(117, 117, 117, 1)" }}>
							<Text style={[GlobalStyle.TextXL, { marginBottom: 25, textAlign: "center" }]}>總績效</Text>
							<Text style={award.roi >= 0
								? [GlobalStyle.TextXXL, { marginBottom: 25, textAlign: "center", fontWeight: "bold", color: "rgba(107, 255, 148, 1)" }]
								: [GlobalStyle.TextXXL, { marginBottom: 25, textAlign: "center", fontWeight: "bold", color: "rgba(255, 92, 92, 1)" }]}>
								{roundDown(award.roi, 2)}%
							</Text>
						</View>
						{award.value > 0
							? <View style={{ width: "80%", paddingTop: 25 }}>
								<Text style={[GlobalStyle.TextXL, { marginBottom: 25, textAlign: "center" }]}>累計獎勵</Text>
								<View style={{ height: 20, flexDirection: "row", marginBottom: 25, justifyContent: "center", alignItems: "flex-end" }}>
									<Text style={[GlobalStyle.TextXL, { textAlign: "center", fontWeight: "bold", color: "rgba(107, 255, 148, 1)" }]}>
										{award.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} NTD
									</Text>
									<Text style={5 >= 0
										? [GlobalStyle.TextM, { textAlign: "center", color: "rgba(107, 255, 148, 1)" }]
										: [GlobalStyle.TextM, { textAlign: "center", color: "rgba(255, 92, 92, 1)" }]}>
										(MOBI)
									</Text>
								</View>
							</View>
							: <View style={{ width: "80%", paddingTop: 25 }}>
								<Text style={[GlobalStyle.TextXL, { marginBottom: 25, textAlign: "center" }]}>幣圈一天，人間一年</Text>
								<View style={{ flexDirection: "row", marginBottom: 25, justifyContent: "center" }}>
									<Text style={[GlobalStyle.TextXL, { textAlign: "center", fontWeight: "bold", color: "#8afff4" }]}>
										～再接再厲～
									</Text>
								</View>
							</View>
						}
						<TouchableOpacity
							style={[stylesheet.tradeButton, { height: 50, alignSelf: "center" }]}
							onPress={() => {
								receiveAward()
								setModalVisible(!modalVisible)
							}}>
							<Text style={GlobalStyle.TextL}>
								{award.value > 0
									? "領取"
									: "確認"
								}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			<Modal
				animationType="fade"
				transparent={true}
				visible={announceVisible}
				onRequestClose={() => {
					setAnnounceVisible(!announceVisible);
				}}
				statusBarTranslucent={true}
			>
				<View style={{ backgroundColor: "#000000AA", justifyContent: "center", alignItems: "center", height: "100%" }}>
					<View style={stylesheet.announceModel}>
						<Text style={[GlobalStyle.TextXL, { textAlign: "center" }]}>公告</Text>
						<View style={stylesheet.announceView}>
							<ScrollView bounces={false} showsVerticalScrollIndicator={false}>
								{announce.map((item) => {
									return (
										<View key={item.serverTime} style={stylesheet.announceListView} onPress={() => { }}>
											<View style={{ display: "flex", flexDirection: "column", flex: 2, paddingLeft: 10 }}>
												<Text style={GlobalStyle.TextL}>
													{item.title}
												</Text>
												<Text style={[GlobalStyle.TextM, { textAlign: "left", marginTop: 10 }]}>
													{item.content}
												</Text>
												<Text style={[GlobalStyle.TextM, { color: "rgba(117, 117, 117, 1)" }]}>
													20{timeConvertDate(item.serverTime.seconds)}
												</Text>
											</View>
										</View>
									);
								})}
							</ScrollView>
						</View>

						<TouchableOpacity
							style={[stylesheet.tradeButton, { height: 50, }]}
							onPress={() => {
								setAnnounceVisible(!announceVisible)
								if (award.length > 0) setModalVisible(true)
							}
							}>
							<Text style={GlobalStyle.TextL}>
								關閉
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			<View style={GlobalStyle.headerBar}>
				<View style={stylesheet.LogoTitle}>
					<Image style={stylesheet.Logo} source={require("../assets/img/logo/LOGO.png")}></Image>
					<Text style={stylesheet.homeTitle}>
						MOBI
					</Text>
				</View>
				{/* <TouchableOpacity
					style={[stylesheet.tradeButton, { top: 50, height: 50, alignSelf: "center" }]}
					onPress={() => setModalVisible(!modalVisible)
					}>
					<Text style={GlobalStyle.TextL}>領取</Text>
				</TouchableOpacity> */}
			</View>
			<ScrollView
				style={{ width: window.width }}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}
				ref={ref}
			>
				<View style={GlobalStyle.frame}>
					<View style={GlobalStyle.subTitleView}>
						<Image style={stylesheet.blockImg} source={require("../assets/img/other/block.jpeg")}>
						</Image>
						<Text style={GlobalStyle.subTitle}>
							主幣交易
						</Text>
						<View style={{ position: "absolute", right: 20, bottom: 20, flexDirection: "row" }}>
							<Text style={[GlobalStyle.TextM, { color: "rgba(117, 117, 117, 1)" }]}>
								Data from
							</Text>
							<TouchableOpacity onPress={() => _handlePressButtonAsync("https://www.coingecko.com/zh-tw")}>
								<Text style={[GlobalStyle.TextM, { color: "#00afaa", marginLeft: 5 }]}>
									CoinGecko
								</Text>
							</TouchableOpacity>
						</View>
					</View>
					<View style={stylesheet.mainTrade}>
						<FlatList
							contentContainerStyle={{ paddingHorizontal: 20 }}
							horizontal={true}
							data={coins}
							showsVerticalScrollIndicator={false}
							ref={ref2}
							renderItem={({ item }) => (
								<View style={stylesheet.mainTradeView}>
									<TouchableOpacity
										style={stylesheet.mainTradeBlock}
										onPress={() =>
											props.navigation.push('TargetDetail', { coinId: item.id })}>
										<Image style={stylesheet.cryptoIcon} source={{ uri: item.image }} />
										<Text style={stylesheet.cryptoName}>
											{item.symbol.toUpperCase()}
										</Text>
										<Text style={stylesheet.mainTradePrice}>
											NT${item.current_price > 1 ? item.current_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
												: item.current_price < 0.01
													? roundDown(item.current_price, 6)
													: item.current_price}
										</Text>
										<Text style={stylesheet._24h}>
											24h
										</Text>
										<Text style={item.price_change_percentage_24h > 0 ? stylesheet.rateUp : stylesheet.rateDown}>
											{roundDown(item.price_change_percentage_24h, 2)}%
										</Text>
									</TouchableOpacity>
								</View>
							)}
						/>
					</View>

					<View style={GlobalStyle.subTitleView}>
						<Image style={stylesheet.blockImg} source={require("../assets/img/other/block.jpeg")}>
						</Image>
						<Text style={GlobalStyle.subTitle}>
							月風雲榜
						</Text>
					</View>
					<View style={GlobalStyle.normalList}>
						<View style={GlobalStyle.normalListView}>
							<View style={{ flex: 10 }}></View>
							<View style={{ flex: 9 }}>
								<Text style={GlobalStyle.TextM}>
									增值金額
								</Text>
							</View>
							<View style={{ flex: 5 }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "right" }]}>
									增值比率
								</Text>
							</View>
						</View>

						{leaderBoard.map((item, index) => {
							return (
								<View key={index} style={GlobalStyle.normalListView}>
									<View style={{ flex: 2 }}>
										<Text style={GlobalStyle.TextL}>
											{index + 1}
										</Text>
									</View>
									<View style={{ flex: 10, display: "flex", flexDirection: "row", }}>
										<Text numberOfLines={1} style={GlobalStyle.TextXL}>
											{item.nickname}
										</Text>
									</View>
									<View style={{ flex: 7 }}>
										<Text style={GlobalStyle.TextM}>
											{item.billing.lastMonthProfit >= 0 ? "+" : ""}
											{item.billing.lastMonthProfit > 1 ? roundDown(item.billing.lastMonthProfit, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
												: item.billing.lastMonthProfit > 0.01
													? item.billing.lastMonthProfit
													: roundDown(item.billing.lastMonthProfit, 6)}
										</Text>
									</View>
									<View style={{ flex: 5 }}>
										<Text style={GlobalStyle.TextM}>
											{roundDown(item.billing.lastMonthROI * 100, 2)}%
										</Text>
									</View>
								</View>
							)
						}
						)}
					</View>

					<View style={GlobalStyle.subTitleView}>
						<Image style={stylesheet.blockImg} source={require("../assets/img/other/block.jpeg")}>
						</Image>
						<Text style={GlobalStyle.subTitle}>
							投資組合跟單
						</Text>
					</View>
					<View style={stylesheet.mainTrade}>
						<FlatList
							contentContainerStyle={{ paddingHorizontal: 20 }}
							horizontal={true}
							data={copyTrader}
							showsVerticalScrollIndicator={false}
							ref={ref3}
							keyExtractor={item => item.nickname}
							renderItem={({ item }) => (
								<View style={stylesheet.mainTradeView}>
									<TouchableOpacity
										style={stylesheet.mainTradeBlock}
										onPress={() =>
											props.navigation.push('CopyTrade', { traderData: item })}>
										<Text style={stylesheet.userNickname}>
											{item.nickname}
										</Text>
										<Text style={item.billing.weeklyBenefit - item.billing.weeklyCost < 0
											? [stylesheet.userBenefit, { color: "rgba(255, 92, 92, 1)" }]
											: [stylesheet.userBenefit, { color: "rgba(107, 255, 148, 1)" }]
										}>
											{item.billing.weeklyBenefit - item.billing.weeklyCost >= 0 ? "+" : "-"}
											{Math.abs(item.billing.weeklyBenefit - item.billing.weeklyCost) > 1
												? Math.abs(item.billing.weeklyBenefit - item.billing.weeklyCost) > 100000
													? roundDown(Math.abs(item.billing.weeklyBenefit - item.billing.weeklyCost), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
													: roundDown(Math.abs(item.billing.weeklyBenefit - item.billing.weeklyCost), 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
												: Math.abs(item.billing.weeklyBenefit - item.billing.weeklyCost) < 0.1
													? roundDown(Math.abs(item.billing.weeklyBenefit - item.billing.weeklyCost), 6)
													: Math.abs(item.billing.weeklyBenefit - item.billing.weeklyCost)}
										</Text>
										<Text style={[stylesheet.copyTradeTextS, { top: 68 }]}>
											週投報率
										</Text>
										<Text style={[stylesheet.copyTradeTextS, { top: 105 }]}>
											週總收益
										</Text>
										<Text style={item.billing.weeklyROI >= 0 ? stylesheet.ROIplus : stylesheet.ROIminus}>
											{roundDown(item.billing.weeklyROI * 100, 2)}%
										</Text>
										<Text style={[GlobalStyle.TextL, stylesheet.followersText]}>追隨人數</Text>
										<Text style={[GlobalStyle.TextL, stylesheet.followersText, { left: 40, textAlign: "right" }]}>{item.followers.length}</Text>
									</TouchableOpacity>
								</View>
							)}
						/>
					</View>

					<View style={GlobalStyle.subTitleView}>
						<Image style={stylesheet.blockImg} source={require("../assets/img/other/block.jpeg")}>
						</Image>
						<Text style={GlobalStyle.subTitle}>
							相關新聞
						</Text>
						<TouchableOpacity style={{ position: "absolute", right: 20, bottom: 20 }} onPress={() => _handlePressButtonAsync("https://blockcast.it/")}>
							<Text style={[GlobalStyle.TextM, { color: "rgba(117, 117, 117, 1)" }]}>
								更多
							</Text>
						</TouchableOpacity>
					</View>

					<View style={GlobalStyle.normalBox}>
						{news.map((newsContent) => {
							return (
								<TouchableOpacity key={newsContent.order} style={GlobalStyle.normalView} onPress={() => _handlePressButtonAsync(newsContent.url)}>
									<Image style={{
										position: "relative",
										width: 120,
										height: 80,
										borderRadius: 0,
										opacity: 1,
										backgroundColor: "rgba(21, 21, 21, 1)",
									}} source={{ uri: newsContent.img }}>
									</Image>
									<View style={{ display: "flex", flexDirection: "column", flex: 2, paddingLeft: 10 }}>
										<Text style={GlobalStyle.TextL}>
											{newsContent.title}
										</Text>
										<Text style={[GlobalStyle.TextM, { color: "rgba(117, 117, 117, 1)" }]}>
											{newsContent.date}
										</Text>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>

					<View style={GlobalStyle.subTitleView}>
						<Image style={stylesheet.blockImg} source={require("../assets/img/other/block.jpeg")}>
						</Image>
						<Text style={GlobalStyle.subTitle}>
							論壇
						</Text>
						<TouchableOpacity style={{ position: "absolute", right: 20, bottom: 20 }} onPress={() => _handlePressButtonAsync("https://www.ptt.cc/bbs/DigiCurrency/index.html")}>
							<Text style={[GlobalStyle.TextM, { color: "rgba(117, 117, 117, 1)" }]}>
								更多
							</Text>
						</TouchableOpacity>
					</View>

					<View style={GlobalStyle.normalBox}>
						{blog.map((blogContent) => {
							return (
								<TouchableOpacity
									key={blogContent.order}
									style={[GlobalStyle.normalView, { flexDirection: "column" }]}
									onPress={() => _handlePressButtonAsync(blogContent.url)}>
									<Text style={[GlobalStyle.TextL, { alignSelf: "flex-start" }]}>
										{blogContent.title}
									</Text>
									<Text style={[GlobalStyle.TextM, { color: "rgba(117, 117, 117, 1)", alignSelf: "flex-end" }]}>
										{blogContent.date}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>

				</View>
			</ScrollView >
		</View >
	)
}

const stylesheet = StyleSheet.create({
	LogoTitle: {
		position: "absolute",
		width: 128,
		height: 50,
		top: 35,
		left: 20,
		overflow: "hidden",
		backgroundColor: "rgba(28, 28, 28, 1)",
	},
	Logo: {
		position: "absolute",
		width: 50,
		height: 50,
		borderRadius: 0,
		left: 0,
		right: "auto",
		top: 0,
		bottom: "auto",
	},
	homeTitle: {
		position: "relative",
		width: 82,
		height: 30,
		top: 11,
		left: 46,
		fontWeight: "700",
		textDecorationLine: "none",
		fontSize: 24,
		color: "#8afff4",
		textAlign: "center",
		letterSpacing: 0.7199997901916504,
	},
	search: {
		position: "absolute",
		width: 149,
		height: 30,
		borderRadius: 36,
		right: 20,
		top: 45,
		bottom: "auto",
		paddingLeft: 15,
		paddingRight: 15,
		backgroundColor: "rgba(59, 59, 59, 1)",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 11,
		color: "white",
		textAlign: "left",
		textAlignVertical: "center",
		letterSpacing: 1.7200000286102295,
	},
	searchIcon: {
		position: "absolute",
		right: 30,
		top: 50
	},
	blockImg: {
		position: "relative",
		width: 6,
		height: 25,
		left: "auto",
		right: "auto",
		top: 0,
		bottom: "auto",
		marginLeft: 20,
		marginRight: 15,
		backgroundColor: "rgba(21, 21, 21, 1)",
	},
	mainTrade: {
		position: "relative",
		width: Dimensions.get("window").width,
		height: 144,
		borderRadius: 0,
		left: 0,
		backgroundColor: "rgba(21, 21, 21, 1)",
		display: "flex",
		flexDirection: "row",
	},
	mainTradeView: {
		position: "relative",
		width: 144,
		height: 144,
		overflow: "hidden",
		minWidth: 0,
		flexShrink: 0,
		marginLeft: 20,
		overflow: "visible"
	},
	mainTradeBlock: {
		position: "absolute",
		width: 144,
		height: 144,
		borderRadius: 14,
		opacity: 1,
		left: 0,
		right: "auto",
		top: 0,
		bottom: "auto",
		backgroundColor: "rgba(69, 69, 69, 1)",
		overflow: "visible"
	},
	cryptoIcon: {
		position: "absolute",
		width: 39,
		height: 39,
		left: 10,
		right: "auto",
		top: 10,
		backgroundColor: "rgba(255, 255, 255, 0)",
	},
	cryptoName: {
		position: "absolute",
		left: 80,
		right: "auto",
		top: 15,
		bottom: 1,
		fontWeight: "500",
		textDecorationLine: "none",
		fontSize: 20,
		color: "white",
		textAlign: "center",
		textAlignVertical: "top",
		letterSpacing: 0.1,
		overflow: "visible"
	},
	mainTradePrice: {
		position: "absolute",
		width: 120,
		height: 22,
		left: 10,
		right: "auto",
		top: 60,
		bottom: "auto",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 18,
		color: "white",
		textAlign: "left",
		textAlignVertical: "top",
		letterSpacing: 0.1,
	},
	_24h: {
		position: "absolute",
		width: 40,
		height: 20,
		left: 10,
		right: "auto",
		top: 118,
		bottom: "auto",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 17,
		color: "rgba(159, 159, 159, 1)",
		textAlign: "left",
		textAlignVertical: "top",
		letterSpacing: 0.1,
	},
	rateDown: {
		position: "absolute",
		width: 90,
		height: 20,
		left: 45,
		right: "auto",
		top: 118,
		bottom: "auto",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 17,
		color: "rgba(255, 92, 92, 1)",
		textAlign: "right",
		textAlignVertical: "top",
		letterSpacing: 0.1,
	},
	rateUp: {
		position: "absolute",
		width: 90,
		height: 20,
		left: 45,
		right: "auto",
		top: 118,
		bottom: "auto",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 17,
		color: "rgba(107, 255, 148, 1)",
		textAlign: "right",
		textAlignVertical: "top",
		letterSpacing: 0.1,
	},
	newsImg: {
		position: "relative",
		width: 120,
		height: 80,
		borderRadius: 0,
		opacity: 1,
		backgroundColor: "rgba(21, 21, 21, 1)",
	},
	blogImg: {
		position: "relative",
		marginLeft: 20,
		width: 149,
		height: 42,
		borderRadius: 0,
		opacity: 1,
		backgroundColor: "rgba(21, 21, 21, 1)",
	},
	tradeButton: {
		height: "40%",
		width: "45%",
		backgroundColor: "#00afaa",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 35,
	},
	userNickname: {
		position: "absolute",
		width: 80,
		left: 10,
		right: "auto",
		top: 10,
		bottom: 1,
		fontWeight: "500",
		textDecorationLine: "none",
		fontSize: 15,
		color: "white",
		textAlignVertical: "top",
		letterSpacing: 0.1,
		overflow: "visible"
	},
	userBenefit: {
		position: "absolute",
		width: 144,
		height: 20,
		top: 85,
		bottom: "auto",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 18,
		color: "white",
		textAlign: "center",
		textAlignVertical: "top",
		letterSpacing: 0.1,
	},
	ROIplus: {
		position: "absolute",
		width: 144,
		height: 20,
		top: 50,
		bottom: "auto",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 17,
		color: "rgba(107, 255, 148, 1)",
		textAlign: "center",
		textAlignVertical: "top",
		letterSpacing: 0.1,
	},
	ROIminus: {
		position: "absolute",
		width: 144,
		height: 20,
		top: 50,
		bottom: "auto",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 17,
		color: "rgba(255, 92, 92, 1)",
		textAlign: "center",
		textAlignVertical: "top",
		letterSpacing: 0.1,
	},
	copyTradeTextS: {
		position: "absolute",
		width: 144,
		height: 20,
		top: 118,
		bottom: "auto",
		fontWeight: "400",
		textDecorationLine: "none",
		fontSize: 14,
		color: "rgba(159, 159, 159, 1)",
		textAlign: "center",
		textAlignVertical: "top",
		letterSpacing: 0.1,
	},
	followersText: {
		position: "absolute",
		width: 80,
		bottom: 0,
		left: 5,
		margin: 5,
		fontSize: 14
	},
	announceModel: {
		width: "80%",
		height: "80%",
		backgroundColor: "rgba(21, 21, 21, 1)",
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "space-between",
		padding: 15
	},
	announceView: {
		position: "relative",
		height: "85%",
		width: "100%",
		display: "flex",
		flexDirection: "row",
		paddingVertical: 10,
		marginHorizontal: 25,
	},
	announceListView: {
		position: "relative",
		height: "auto",
		width: "100%",
		display: "flex",
		flexDirection: "row",
		paddingVertical: 10,
		borderColor: "rgba(117, 117, 117, 1)",
		borderTopWidth: 1,
		borderBottomWidth: 1
	},
	label: {
		margin: 10,
		width: 179,
		height: 48,
		resizeMode: "stretch",
		alignSelf: "center"
	},
});
