import React, { useState, useEffect } from "react";
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
	FlatList,
	Alert,
	Modal,
	ActivityIndicator
} from "react-native";
import { useScrollToTop } from '@react-navigation/native';
import GlobalStyle from '../assets/styles'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import SwitchSelector from "react-native-switch-selector";
import { PieChart } from 'react-native-svg-charts';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { roundDown } from "../assets/function";
import { coinSymbolColor, coinIdSymbolList } from "../assets/coinData";
import Toast from 'react-native-toast-message';


export default function BillingScreen(props) {

	const window = useWindowDimensions();
	const [entrustStyle, setEntrustStyle] = useState("flex")
	const [inventoryStyle, setInventoryStyle] = useState("none")
	const [copyTradeStyle, setCopyTradeStyle] = useState("none")
	const [price, setPrice] = useState([]);
	const [coinValueList, setCoinValueList] = useState([])
	const [coinValueList_C, setCoinValueList_C] = useState([])
	const [inventoryData, setInventoryData] = useState([])
	const [copyTradeData, setCopyTradeData] = useState([])
	const [coinValue, setCoinValue] = useState(Number(0));
	const [coinValue_C, setCoinValue_C] = useState(Number(0));
	const [inventoryRate, setInventoryRate] = useState([])
	const [copyTradeRate, setCopyTradeRate] = useState([])
	const [unrealized, setUnrealized] = useState(Number(0))
	const [refreshing, setRefreshing] = useState(false);
	const entrusts = props.entrusts;
	const tradeRecord = props.tradeRecord;
	const isFocused = useIsFocused();
	const ref = React.useRef(null);
	const date = Date.now() / 1000;
	const [processing, setProcessing] = useState(false);

	const auth = getAuth();

	const randomColor = () => ('#' + ((Math.random() * 0xffffff) << 0).toString(16) + '000000').slice(0, 7)

	const pieData = coinValueList
		.filter((value) => value[1] > 0)
		.map((value, index) => ({
			value: value[1],
			svg: {
				fill: coinSymbolColor[value[0]] ? coinSymbolColor[value[0]].color : randomColor(),
			},
			key: value[0],
		}))

	const pieData2 = coinValueList_C
		.filter((value) => value[1] > 0)
		.map((value, index) => ({
			value: value[1],
			svg: {
				fill: coinSymbolColor[value[0]] ? coinSymbolColor[value[0]].color : randomColor(),
			},
			key: value[0],
		}))

	const coinValueFunction = async (coins, coins_C) => {

		var coinValueTemp = 0
		var coinValueTemp_C = 0
		var individualCoinValue = []
		var individualCoinValue_C = []
		var data = []
		var data_C = []
		var rate = []
		var rate_C = []


		const res = await fetch(
			"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,usd-coin,solana,terra-luna,ripple,cardano,avalanche-2,polkadot,dogecoin,binance-usd,terrausd,shiba-inu,wrapped-bitcoin,crypto-com-chain,matic-network,near,staked-ether,cosmos,dai,litecoin,chainlink,tron,bitcoin-cash,ftx-token,ethereum-classic,algorand,stellar,leo-token,okb,uniswap,vechain,axie-infinity,internet-computer,hedera-hashgraph,filecoin,waves,elrond-erd-2,decentraland,the-sandbox,fantom,theta-token,monero,compound-ether,tezos,the-graph,apecoin,thorchain,aave,klay-token,osmosis,eos,pancakeswap-token,magic-internet-money,helium,frax,flow,iota,defichain,frax-share,zcash,zilliqa,ecash,convex-finance,maker,bittorrent,harmony,arweave,gala,neo,cdai,theta-fuel,bitcoin-cash-sv,huobi-btc,compound-usd-coin,quant-network,kusama,celo,enjincoin,kucoin-shares,havven,blockstack,chiliz,huobi-token,radix,loopring,nexo,lido-dao,stepn,dash,amp-token,basic-attention-token,true-usd,celsius-degree-token,mina-protocol,humans-ai,kadena,juno-network,holotoken,bitdao,curve-dao-token,moonbeam,compound-governance-token,smooth-love-potion,nem,oasis-network,gatechain-token,secret,link,paxos-standard,xido-finance,iotex,pocket-network,neutrino,msol,skale,decred,iostoken,qtum,sushi,yearn-finance,audius,omisego,1inch,ecomi,nxm,gnosis,swipe,anchor-protocol,icon,ankr,kava,defi-kingdoms,wax,bitkub-coin,xdce-crowd-sale,bitcoin-gold,ravencoin,0x,livepeer,bancor,render-token,radio-caca,compound-usdt,siacoin,dydx,safemoon-2,pax-gold,rocket-pool,zencash,acala,immutable-x,woo-network,oec-token,renbtc,sapphire,e-radix,synapse-2,ontology,dogelon-mars,looksrare,songbird,rally-2,fei-usd,golem,convex-crv,spell-token,just,uma,telcoin,olympus,digibyte,apenft,baby-doge-coin,velas,mobox,bitclout,liquity-usd,tether-gold,ethereum-name-service,polymath,republic-protocol,swissborg,everdome,trust-wallet-token,lido-staked-sol,constellation-labs,nucypher,casper-network,zelcash,hive,astar,serum,illuvium,syscoin,playdapp,pirate-chain,metis-token,nervos-network,vulcan-forged,nano,tomb,tenset,keep-network,astroport,celer-network,lisk,persistence,chromaway,constitutiondao,wink,ultra,dent,perpetual-protocol,coin98,vvs-finance,raydium,tokemak,fetch-ai,kyber-network-crystal,ichi-farm,mmfinance,wazirx,floki-inu,moonriver,coti,injective-protocol,xsushi,dopex,xyo-network,flex-coin,ufo-gaming,aurora-near,husd,fx-coin,status,merit-circle,medibloc,joe,gmx,mimatic,conflux-token,origin-protocol,gemini-dollar,api3,ocean-protocol,mask-network,yield-guild-games&vs_currencies=twd"
		);
		const dataGet = await res.json();
		for (const [key, value] of Object.entries(coins)) {
			if (key != "twd") {
				individualCoinValue.push(
					[key, value * dataGet[key]["twd"]]
				)
				coinValueTemp += (value * dataGet[key]["twd"])
				data.push(
					{
						id: key,
						symbol: coinSymbolColor[key] ? coinSymbolColor[key].symbol : coinIdSymbolList[key] ? coinIdSymbolList[key].symbol.toUpperCase() : key,
						price: dataGet[key]["twd"],
						averagePrice: props.data.averagePrice[key] ? props.data.averagePrice[key] : 0,
						volume: value,
						onTradeValue: props.data.averagePrice[key] ? value * props.data.averagePrice[key] : value * 0,
						onTimeValue: dataGet[key]["twd"] * value
					}
				)
			}
		}
		for (const [key, value] of Object.entries(coins)) {
			if (key != "twd") {
				rate.push(
					{
						symbol: coinSymbolColor[key] ? coinSymbolColor[key].symbol : coinIdSymbolList[key] ? coinIdSymbolList[key].symbol.toUpperCase() : key,
						rate: dataGet[key]["twd"] * value / coinValueTemp,
						color: coinSymbolColor[key] ? coinSymbolColor[key].color : randomColor()
					}
				)
			}
		}

		setPrice(dataGet);

		setCoinValue(coinValueTemp)
		setCoinValueList(individualCoinValue)
		setInventoryData(data)
		setInventoryRate(rate)

		for (const [key, value] of Object.entries(coins_C)) {
			if (key != "twd") {
				individualCoinValue_C.push(
					[key, value * dataGet[key]["twd"]]
				)
				coinValueTemp_C += (value * dataGet[key]["twd"])
				data_C.push(
					{
						id: key,
						symbol: coinSymbolColor[key] ? coinSymbolColor[key].symbol : coinIdSymbolList[key] ? coinIdSymbolList[key].symbol.toUpperCase() : key,
						price: dataGet[key]["twd"],
						averagePrice: props.data.averagePrice_C[key] ? props.data.averagePrice_C[key] : 0,
						volume: value,
						onTradeValue: props.data.averagePrice_C[key] ? value * props.data.averagePrice_C[key] : value * 0,
						onTimeValue: dataGet[key]["twd"] * value
					}
				)
			}
		}
		for (const [key, value] of Object.entries(coins_C)) {
			if (key != "twd") {
				rate_C.push(
					{
						symbol: coinSymbolColor[key] ? coinSymbolColor[key].symbol : coinIdSymbolList[key] ? coinIdSymbolList[key].symbol.toUpperCase() : key,
						rate: dataGet[key]["twd"] * value / coinValueTemp_C,
						color: coinSymbolColor[key] ? coinSymbolColor[key].color : randomColor()
					}
				)
			}
		}
		setCoinValue_C(coinValueTemp_C)
		setCoinValueList_C(individualCoinValue_C)
		setCopyTradeData(data_C)
		setCopyTradeRate(rate_C)

		SumDataMapReduce(data, data_C)
	}

	async function handleDelTranPress(id) {
		Alert.alert(
			"注意",
			"確定要撤銷交易嗎？",
			[
				{ text: "取消", style: "cancel" },
				{
					text: "確定", onPress: async () => {
						setProcessing(true)
						try {
							fetch('https://api.mobicrypto.tw/del_tran', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'Accept': 'application/json'
								},
								body: JSON.stringify({
									id_token: props.userInfo.accessToken,
									target_id: id
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
									showToast("success", "撤銷成功！")
									setProcessing(false)
								} else {
									showToast("error", "錯誤", "伺服器錯誤，請再試一次！")
									setProcessing(false)
								}
							});
							setProcessing(false)
						} catch (e) {
							console.log(e)
							setProcessing(false)
						}
						return
					}
				}
			]
		);
	}

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

	useScrollToTop(ref);

	function SumDataMapReduce(arr, arr_C) {
		if (arr.length > 0 && arr_C.length > 0) {
			setUnrealized(
				arr.map(data => (
					data.onTimeValue - data.onTradeValue)).reduce((a, b) => a + b)
				+
				arr_C.map(data => (
					data.onTimeValue - data.onTradeValue)).reduce((a, b) => a + b)
			)
		}
		else if (arr.length > 0 && arr_C.length <= 0) {
			setUnrealized(
				arr.map(data => (
					data.onTimeValue - data.onTradeValue)).reduce((a, b) => a + b)
			)
		}
		else if (arr.length <= 0 && arr_C.length > 0) {
			setUnrealized(
				arr_C.map(data => (
					data.onTimeValue - data.onTradeValue)).reduce((a, b) => a + b)
			)
		}
	}

	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			if (user) {
				const uid = user.uid;
				coinValueFunction(props.data.pocket, props.data.pocket_C);
			}
		});
	}, [isFocused, props]);



	return (
		<View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
			<Modal
				animationType="fade"
				transparent={true}
				visible={processing}
				statusBarTranslucent={true}
			>
				<View style={stylesheet.loading}>
					<ActivityIndicator size='large' />
				</View>
			</Modal>
			<View style={GlobalStyle.headerBar}>
				<Text style={GlobalStyle.title}>
					帳務
				</Text>
			</View>
			<ScrollView
				style={{
					width: window.width,
					backgroundColor: "rgba(21, 21, 21, 1)"
				}}
				showsVerticalScrollIndicator={false}
				ref={ref}
				bounces={false}
			>
				<View style={GlobalStyle.frame}>
					<View style={stylesheet.userId}>
						<Text style={props.data.nickname.length <= 8
							? GlobalStyle.TextXXL : GlobalStyle.TextXL}>
							{props.data.nickname}
						</Text>
						<TouchableOpacity style={stylesheet.systemButton} onPress={() => props.navigation.push('TransferScreen')}>
							<Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>劃轉</Text>
						</TouchableOpacity>
					</View>


					<View style={GlobalStyle.normalView}>
						<View style={[stylesheet.blockL, { borderColor: "rgba(117, 117, 117, 1)", borderRightWidth: 0.5 }]}>
							<Text style={GlobalStyle.TextL}>
								未實現損益
							</Text>
							<Text style={unrealized >= 0
								? [GlobalStyle.TextXL, { color: "rgba(107, 255, 148, 1)" }]
								: [GlobalStyle.TextXL, { color: "rgba(255, 92, 92, 1)" }]
							}>

								{unrealized >= 0 ? "+" : "-"}
								{Math.abs(unrealized) > 1
									? Math.abs(unrealized) > 100000
										? roundDown(Math.abs(unrealized), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
										: roundDown(Math.abs(unrealized), 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
									: Math.abs(unrealized) < 0.1
										? roundDown(Math.abs(unrealized), 6)
										: Math.abs(unrealized)}
							</Text>
						</View>
						<View style={stylesheet.blockL}>
							<TouchableOpacity
								onPress={() => props.navigation.push('BillingRecord')}
							>
								<Text style={GlobalStyle.TextXL}>
									交易紀錄
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					<View style={GlobalStyle.normalView}>
						<SwitchSelector
							style={{ marginHorizontal: 20 }}
							initial={0}
							onPress={value => {
								if (value === "entrust") {
									setEntrustStyle("flex")
									setInventoryStyle("none")
									setCopyTradeStyle("none")
								}
								else if (value === "inventory") {
									setEntrustStyle("none")
									setInventoryStyle("flex")
									setCopyTradeStyle("none")
								}
								else if (value === "copyTrade") {
									setEntrustStyle("none")
									setInventoryStyle("none")
									setCopyTradeStyle("flex")
								}
							}}
							fontSize={20}
							textColor="white"
							selectedColor="white"
							buttonColor="#00afaa"
							borderColor="rgba(69, 69, 69, 1)"
							backgroundColor="rgba(69, 69, 69, 1)"
							borderRadius={5}
							options={[
								{ label: "委託", value: "entrust" },
								{ label: "庫存", value: "inventory" },
								{ label: "跟單", value: "copyTrade" },
							]}
						/>
					</View>

					<View style={[GlobalStyle.normalList, { display: entrustStyle }]}>
						<View style={[GlobalStyle.normalView, { paddingHorizontal: 5 }]}>
							<Icon style={[GlobalStyle.icon, { marginRight: 5 }]} name="triangle-outline" color={"#00afaa"} size={15} />
							<Text style={[GlobalStyle.TextM, { textAlign: "center", marginRight: 5 }]}>待成交</Text>
							<Icon style={[GlobalStyle.icon, { marginRight: 5 }]} name="check" color={"#00afaa"} size={15} />
							<Text style={[GlobalStyle.TextM, { textAlign: "center", marginRight: 5 }]}>成交</Text>
							<Icon style={[GlobalStyle.icon, { marginRight: 5 }]} name="close-circle-outline" color={"#00afaa"} size={15} />
							<Text style={[GlobalStyle.TextM, { textAlign: "center", marginRight: 5 }]}>刪單</Text>
						</View>
						<View style={{ position: "relative", display: "flex", width: (Dimensions.get("window").width - 25) }}>
							<View style={{ flex: 1, alignItems: "flex-end" }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center", color: "red" }]}>
									*以新台幣計算
								</Text>
							</View>
						</View>

						<View style={GlobalStyle.normalListView}>
							<View style={{ flex: 2 }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
									狀況
								</Text>
							</View>
							<View style={{ flex: 1 }}></View>
							<View style={{ flex: 2 }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
									幣名
								</Text>
							</View>
							<View style={{ flex: 2 }}></View>
							<View style={{ flex: 4 }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
									數量
								</Text>
							</View>
							<View style={{ flex: 4 }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
									委託均價
								</Text>
							</View>
							<View style={{ flex: 4 }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
									現價
								</Text>
							</View>
						</View>

						{entrusts.map((item) => (
							<View style={GlobalStyle.normalListView}>
								<View style={{ flex: 2 }}>
									<Icon style={GlobalStyle.icon} name="triangle-outline" color={"#00afaa"} size={20} />
								</View>
								{item[1].isCopyTrade != true
									? <TouchableOpacity
										style={[stylesheet.editButton, { flex: 1, }]}
										onPress={() => { handleDelTranPress(item[0]) }}>
										<Text style={[GlobalStyle.TextM, { textAlign: "center", }]}>
											撤{"\n"}銷
										</Text>
									</TouchableOpacity>
									: <TouchableOpacity
										style={[stylesheet.editButton, { flex: 1, backgroundColor: "#444444" }]}
										disabled={true}
									>
										<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
											撤{"\n"}銷
										</Text>
									</TouchableOpacity>
								}

								<View style={{ flex: 2 }}>
									<Text style={[GlobalStyle.TextM, { textAlign: "center", fontSize: 11 }]}>
										{item[1].currency_symbol.toUpperCase()}
									</Text>
								</View>
								<View style={[stylesheet.blockS, { flex: 2 }]}>
									<Text style={item.direction == "買入"
										? [GlobalStyle.TextS, GlobalStyle.billingText, { paddingHorizontal: 1, color: "rgba(107, 255, 148, 1)" }]
										: [GlobalStyle.TextS, GlobalStyle.billingText, { paddingHorizontal: 1, color: "rgba(255, 92, 92, 1)" }]
									}>
										{item[1].direction == "買入"
											? item[1].isCopyTrade != true
												? "現貨\n買進" : "跟單\n買進"
											: item[1].isCopyTrade != true
												? "現貨\n賣出" : "跟單\n賣出"}
									</Text>
								</View>
								<View style={{ flex: 4 }}>
									<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
										{item[1].quantity > 100000
											? roundDown(item[1].quantity, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
											: item[1].quantity > 1 ? roundDown(item[1].quantity, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
												: roundDown(item[1].quantity, 6)}
									</Text>
								</View>
								<View style={{ flex: 4 }}>
									<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
										{item[1].order_price > 100000
											? roundDown(item[1].order_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
											: item[1].order_price > 1 ? roundDown(item[1].order_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
												: item[1].order_price > 0.01
													? item[1].order_price
													: roundDown(item[1].order_price, 6)}
									</Text>
								</View>
								<View style={{ flex: 4 }}>
									<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
										{price[item[1].currency_id]
											? price[item[1].currency_id].twd > 100000
												? roundDown(price[item[1].currency_id].twd, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
												: price[item[1].currency_id].twd > 1 ? roundDown(price[item[1].currency_id].twd, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
													: price[item[1].currency_id].twd > 0.01
														? price[item[1].currency_id].twd
														: roundDown(price[item[1].currency_id].twd, 6)
											: 0}
									</Text>
								</View>
							</View>
						))}
						{tradeRecord.map((item) => (
							date - item.deal_time.seconds <= 3600
								? <View style={GlobalStyle.normalListView}>
									<View style={{ flex: 2 }}>
										<Icon style={GlobalStyle.icon} name="check" color={"#00afaa"} size={20} />
									</View>
									<View style={{ flex: 1, }}>
									</View>
									<View style={{ flex: 2 }}>
										<Text style={[GlobalStyle.TextM, { textAlign: "center", fontSize: 11 }]}>
											{item.currency_symbol.toUpperCase()}
										</Text>
									</View>
									<View style={[stylesheet.blockS, { flex: 2 }]}>
										<Text style={item.direction == "買入"
											? [GlobalStyle.TextS, GlobalStyle.billingText, { paddingHorizontal: 1, color: "rgba(107, 255, 148, 1)" }]
											: [GlobalStyle.TextS, GlobalStyle.billingText, { paddingHorizontal: 1, color: "rgba(255, 92, 92, 1)" }]
										}>
											{item.direction == "買入"
												? item.isCopyTrade != true
													? "現貨\n買進" : "跟單\n買進"
												: item.isCopyTrade != true
													? "現貨\n賣出" : "跟單\n賣出"}
										</Text>
									</View>
									<View style={{ flex: 4 }}>
										<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
											{item.quantity > 100000
												? roundDown(item.quantity, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
												: item.quantity > 1 ? roundDown(item.quantity, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
													: roundDown(item.quantity, 6)}
										</Text>
									</View>
									<View style={{ flex: 4 }}>
										<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
											{item.order_price
												? item.order_price > 100000
													? roundDown(item.order_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
													: item.order_price > 1 ? roundDown(item.order_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
														: item.order_price > 0.01
															? item.order_price
															: roundDown(item.order_price, 6)
												: item.deal_price > 100000
													? roundDown(item.deal_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
													: item.deal_price > 1 ? roundDown(item.deal_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
														: item.deal_price > 0.01
															? item.deal_price
															: roundDown(item.deal_price, 6)}
										</Text>
									</View>
									<View style={{ flex: 4 }}>
										<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
											{price[item.currency_id]
												? price[item.currency_id].twd > 100000
													? roundDown(price[item.currency_id].twd, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
													: price[item.currency_id].twd > 1 ? roundDown(price[item.currency_id].twd, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
														: price[item.currency_id].twd > 0.01
															? price[item.currency_id].twd
															: roundDown(price[item.currency_id].twd, 6)
												: 0}
										</Text>
									</View>
								</View>
								: <></>
						))}

					</View>

					<View style={[GlobalStyle.normalList, { display: inventoryStyle }]}>

						<View style={[GlobalStyle.normalView, { paddingHorizontal: 5 }]}>
							<Text style={[GlobalStyle.TextM, { textAlign: "center", marginRight: 5, color: "rgba(117, 117, 117, 1)" }]}>現貨總市值：</Text>
							<Text style={[GlobalStyle.TextXL, { textAlign: "center", marginRight: 5 }]}>
								{coinValue > 1 ? roundDown(coinValue, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
									: coinValue > 0.01
										? coinValue
										: roundDown(coinValue, 6)}
							</Text>
							<Text style={[GlobalStyle.TextM, { textAlign: "center", marginRight: 5, color: "rgba(117, 117, 117, 1)" }]}>TWD</Text>
						</View>

						<View style={GlobalStyle.normalView}>
							<PieChart
								style={{ height: 120, flex: 1 }}
								data={pieData}
								innerRadius="70%"
								padAngle={0}
							/>
							<View style={[stylesheet.coinListBlock, { flex: 1 }]}>
								{inventoryRate.map((item) => (
									<View style={{ flexDirection: "row", width: "90%" }} key={item.symbol}>
										<View style={{ flex: 1, justifyContent: "center" }}>
											<Icon style={GlobalStyle.icon} name="checkbox-blank-circle" color={item.color} size={10} />
										</View>
										<View style={{ flex: 2 }}>
											<Text style={GlobalStyle.TextL}>
												{item.symbol}
											</Text>
										</View>
										<View style={{ flex: 2 }}>
											<Text style={[GlobalStyle.TextL, { textAlign: "right" }]}>
												{roundDown(item.rate * 100, 0)}%
											</Text>
										</View>
									</View>
								))}
							</View>
						</View>

						<View>
							<ScrollView horizontal={true} bounces={false}>
								<View style={{ width: 560 }}>
									<View style={[GlobalStyle.normalListView, { width: 520 }]}>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												幣名
											</Text>
										</View>
										<View style={{ width: 70 }}></View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												現價
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交均價
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												持有
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												未實現
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												當前市值
											</Text>
										</View>
									</View>

									<FlatList
										bounces={false}
										data={inventoryData}
										showsVerticalScrollIndicator={false}
										keyExtractor={item => item.id}
										renderItem={({ item }) => (
											<TouchableOpacity
												style={[GlobalStyle.normalListView, { width: 520 }]}
												onPress={() =>
													props.navigation.push('TargetDetail', { coinId: item.id })}>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
														{item.symbol}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextM, { textAlign: "center", paddingBottom: 0 }]}>
														現貨
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.price
															? item.price > 100000 ? roundDown(item.price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.price > 1 ? roundDown(item.price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.price > 0.01
																		? item.price
																		: roundDown(item.price, 6)
															: 0}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.averagePrice
															? item.averagePrice > 100000 ? roundDown(item.averagePrice, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.averagePrice > 1 ? roundDown(item.averagePrice, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.averagePrice > 0.01
																		? item.averagePrice
																		: roundDown(item.averagePrice, 6)
															: 0}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.volume
															? item.volume > 100000 ? roundDown(item.volume, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.volume > 1 ? roundDown(item.volume, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: roundDown(item.volume, 6) : 0}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={item.onTimeValue - item.onTradeValue >= 0
														? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
														: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
													}>
														{item.onTimeValue - item.onTradeValue >= 0 ? "+" : "-"}
														{Math.abs(item.onTimeValue - item.onTradeValue) > 1
															? Math.abs(item.onTimeValue - item.onTradeValue) > 100000
																? roundDown(Math.abs(item.onTimeValue - item.onTradeValue), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: roundDown(Math.abs(item.onTimeValue - item.onTradeValue), 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
															: Math.abs(item.onTimeValue - item.onTradeValue) < 0.000001
																? Math.abs(item.onTimeValue - item.onTradeValue)
																: roundDown(Math.abs(item.onTimeValue - item.onTradeValue), 6)}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.onTimeValue > 100000 ? roundDown(item.onTimeValue, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
															: item.onTimeValue > 1 ? roundDown(item.onTimeValue, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.onTimeValue > 0.01
																	? item.onTimeValue
																	: roundDown(item.onTimeValue, 6)}
													</Text>
												</View>
											</TouchableOpacity>
										)} />
								</View>
							</ScrollView>
						</View>

					</View>

					<View style={[GlobalStyle.normalList, { display: copyTradeStyle }]}>

						<View style={[GlobalStyle.normalView, { paddingHorizontal: 5 }]}>
							<Text style={[GlobalStyle.TextM, { textAlign: "center", marginRight: 5, color: "rgba(117, 117, 117, 1)" }]}>現貨總市值：</Text>
							<Text style={[GlobalStyle.TextXL, { textAlign: "center", marginRight: 5 }]}>
								{coinValue_C > 1 ? roundDown(coinValue_C, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
									: coinValue_C > 0.01
										? coinValue_C
										: roundDown(coinValue_C, 6)}
							</Text>
							<Text style={[GlobalStyle.TextM, { textAlign: "center", marginRight: 5, color: "rgba(117, 117, 117, 1)" }]}>TWD</Text>
						</View>

						<View style={GlobalStyle.normalView}>
							<PieChart
								style={{ height: 120, flex: 1 }}
								data={pieData2}
								innerRadius="70%"
								padAngle={0}
							/>
							<View style={[stylesheet.coinListBlock, { flex: 1 }]}>
								{copyTradeRate.map((item) => (
									<View style={{ flexDirection: "row", width: "90%" }} key={item.symbol}>
										<View style={{ flex: 1, justifyContent: "center" }}>
											<Icon style={GlobalStyle.icon} name="checkbox-blank-circle" color={item.color} size={10} />
										</View>
										<View style={{ flex: 2 }}>
											<Text style={GlobalStyle.TextL}>
												{item.symbol}
											</Text>
										</View>
										<View style={{ flex: 2 }}>
											<Text style={[GlobalStyle.TextL, { textAlign: "right" }]}>
												{roundDown(item.rate * 100, 0)}%
											</Text>
										</View>
									</View>
								))}
							</View>
						</View>

						<View>
							<ScrollView horizontal={true} bounces={false}>
								<View style={{ width: 560 }}>
									<View style={[GlobalStyle.normalListView, { width: 520 }]}>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												幣名
											</Text>
										</View>
										<View style={{ width: 70 }}></View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												現價
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交均價
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												持有
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												未實現
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												當前市值
											</Text>
										</View>
									</View>

									<FlatList
										bounces={false}
										data={copyTradeData}
										showsVerticalScrollIndicator={false}
										keyExtractor={item => item.id}
										renderItem={({ item }) => (
											<TouchableOpacity
												style={[GlobalStyle.normalListView, { width: 520 }]}
												onPress={() =>
													props.navigation.push('TargetDetail', { coinId: item.id })}>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
														{item.symbol}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextM, { textAlign: "center", paddingBottom: 0 }]}>
														現貨
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.price
															? item.price > 100000 ? roundDown(item.price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.price > 1 ? roundDown(item.price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.price > 0.01
																		? item.price
																		: roundDown(item.price, 6)
															: 0}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.averagePrice
															? item.averagePrice > 100000 ? roundDown(item.averagePrice, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.averagePrice > 1 ? roundDown(item.averagePrice, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.averagePrice > 0.01
																		? item.averagePrice
																		: roundDown(item.averagePrice, 6)
															: 0}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.volume
															? item.volume > 100000 ? roundDown(item.volume, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.volume > 1 ? roundDown(item.volume, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: roundDown(item.volume, 6) : 0}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={item.onTimeValue - item.onTradeValue >= 0
														? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
														: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
													}>
														{item.onTimeValue - item.onTradeValue >= 0 ? "+" : "-"}
														{Math.abs(item.onTimeValue - item.onTradeValue) > 1
															? Math.abs(item.onTimeValue - item.onTradeValue) > 100000
																? roundDown(Math.abs(item.onTimeValue - item.onTradeValue), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: roundDown(Math.abs(item.onTimeValue - item.onTradeValue), 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
															: Math.abs(item.onTimeValue - item.onTradeValue) > 0.01
																? Math.abs(item.onTimeValue - item.onTradeValue)
																: roundDown(Math.abs(item.onTimeValue - item.onTradeValue), 6)}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.onTimeValue > 100000 ? roundDown(item.onTimeValue, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
															: item.onTimeValue > 1 ? roundDown(item.onTimeValue, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.onTimeValue > 0.01
																	? item.onTimeValue
																	: roundDown(item.onTimeValue, 6)}
													</Text>
												</View>
											</TouchableOpacity>
										)} />
								</View>
							</ScrollView>
						</View>

					</View>

				</View >
			</ScrollView >

		</View >
	)
}

const stylesheet = StyleSheet.create({
	userId: {
		position: "relative",
		width: "100%",
		height: 80,
		alignItems: "center",
		paddingHorizontal: 25,
		display: "flex",
		flexDirection: "row"
	},
	editButton: {
		height: 50,
		paddingHorizontal: 1,
		paddingVertical: 9,
		backgroundColor: "#00afaa"
	},
	PieChart: {
		height: 120
	},
	blockL: {
		position: "relative",
		height: 90,
		alignItems: "center",
		justifyContent: "center",
		borderColor: "rgba(117, 117, 117, 1)",
		borderTopWidth: 0.5,
		borderBottomWidth: 0.5,
		flex: 1,
		display: "flex",
		flexDirection: "column"
	},
	blockS: {
		height: 50,
		paddingVertical: 0,
		display: "flex",
		flexDirection: "column",
		justifyContent: "center"
	},
	coinListBlock: {
		position: "relative",
		height: 120,
		alignItems: "center",
		justifyContent: "center",
		display: "flex",
		flexDirection: "column",
	},
	deleteLine: {
		position: "absolute",
		top: 0,
		left: 0,
		height: 25,
		width: (Dimensions.get("window").width - 50),
		borderBottomColor: "red",
		borderBottomWidth: 1
	},
	systemButton: {
		position: "absolute",
		height: 40,
		width: 90,
		right: 20,
		backgroundColor: "#00afaa",
		justifyContent: "center",
		borderRadius: 5,
		marginRight: 10,
		paddingHorizontal: 10
	},
});
