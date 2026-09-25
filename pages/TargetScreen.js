import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Image,
	RefreshControl,
	StyleSheet,
	useWindowDimensions,
	FlatList,
	TouchableWithoutFeedback,
	Keyboard
} from "react-native";
import { useIsFocused } from '@react-navigation/native';
import { useScrollToTop } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GlobalStyle from '../assets/styles';
import { LineChart, Grid } from 'react-native-svg-charts';
import { roundDown } from '../assets/function';

export default function TargetScreen(props) {

	const window = useWindowDimensions();
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState("");
	const [coins, setCoins] = useState();
	const isFocused = useIsFocused();
	const ref = React.useRef(null);

	useScrollToTop(ref);

	const getCoins = async () => {
		const res = await fetch(
			"https://api.coingecko.com/api/v3/coins/markets?vs_currency=twd&order=market_cap_desc&ids=bitcoin,ethereum,tether,binancecoin,usd-coin,solana,terra-luna,ripple,cardano,avalanche-2,polkadot,dogecoin,binance-usd,terrausd,shiba-inu,wrapped-bitcoin,crypto-com-chain,matic-network,near,staked-ether,cosmos,dai,litecoin,chainlink,tron,bitcoin-cash,ftx-token,ethereum-classic,algorand,stellar,leo-token,okb,uniswap,vechain,axie-infinity,internet-computer,hedera-hashgraph,filecoin,waves,elrond-erd-2,decentraland,the-sandbox,fantom,theta-token,monero,compound-ether,tezos,the-graph,apecoin,thorchain,aave,klay-token,osmosis,eos,pancakeswap-token,magic-internet-money,helium,frax,flow,iota,defichain,frax-share,zcash,zilliqa,ecash,convex-finance,maker,bittorrent,harmony,arweave,gala,neo,cdai,theta-fuel,bitcoin-cash-sv,huobi-btc,compound-usd-coin,quant-network,kusama,celo,enjincoin,kucoin-shares,havven,blockstack,chiliz,huobi-token,radix,loopring,nexo,lido-dao,stepn,dash,amp-token,basic-attention-token,true-usd,celsius-degree-token,mina-protocol,humans-ai,kadena,juno-network,holotoken,bitdao,curve-dao-token,moonbeam,compound-governance-token,smooth-love-potion,nem,oasis-network,gatechain-token,secret,link,paxos-standard,xido-finance,iotex,pocket-network,neutrino,msol,skale,decred,iostoken,qtum,sushi,yearn-finance,audius,omisego,1inch,ecomi,nxm,gnosis,swipe,anchor-protocol,icon,ankr,kava,defi-kingdoms,wax,bitkub-coin,xdce-crowd-sale,bitcoin-gold,ravencoin,0x,livepeer,bancor,render-token,radio-caca,compound-usdt,siacoin,dydx,safemoon-2,pax-gold,rocket-pool,zencash,acala,immutable-x,woo-network,oec-token,renbtc,sapphire,e-radix,synapse-2,ontology,dogelon-mars,looksrare,songbird,rally-2,fei-usd,golem,convex-crv,spell-token,just,uma,telcoin,olympus,digibyte,apenft,baby-doge-coin,velas,mobox,bitclout,liquity-usd,tether-gold,ethereum-name-service,polymath,republic-protocol,swissborg,everdome,trust-wallet-token,lido-staked-sol,constellation-labs,nucypher,casper-network,zelcash,hive,astar,serum,illuvium,syscoin,playdapp,pirate-chain,metis-token,nervos-network,vulcan-forged,nano,tomb,tenset,keep-network,astroport,celer-network,lisk,persistence,chromaway,constitutiondao,wink,ultra,dent,perpetual-protocol,coin98,vvs-finance,raydium,tokemak,fetch-ai,kyber-network-crystal,ichi-farm,mmfinance,wazirx,floki-inu,moonriver,coti,injective-protocol,xsushi,dopex,xyo-network,flex-coin,ufo-gaming,aurora-near,husd,fx-coin,status,merit-circle,medibloc,joe,gmx,mimatic,conflux-token,origin-protocol,gemini-dollar,api3,ocean-protocol,mask-network,yield-guild-games&sparkline=true"
		).then(response => {
			if (!response.ok) {
				console.log(response)
				console.log("標的錯誤")
				throw Error(response.statusText);
			}
			return response;
		});
		const data = await res.json();
		setCoins(data);
	};

	const onRefresh = React.useCallback(async () => {
		setRefreshing(true);
		await getCoins();
		setRefreshing(false);
	}, [refreshing]);

	useEffect(() => {
		setSearch("")
		getCoins();
		const timer = setInterval(() => {
			getCoins();
		}, 10000)

		return () => {
			clearInterval(timer)
		}
	}, [isFocused]);

	return (
		<TouchableWithoutFeedback
			onPress={Keyboard.dismiss}
			accessible={false}
		>
			<View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
				<View style={GlobalStyle.headerBar}>
					<Text style={GlobalStyle.title}>
						標的
					</Text>
					<View>
						<TextInput
							style={stylesheet.search}
							placeholder="搜尋虛擬貨幣"
							placeholderTextColor="rgba(135, 135, 135, 1)"
							// onChangeText={(text) => text && setSearch(text)}
							value={search}
							onChangeText={setSearch}
						/>
						<Icon name="magnify" color={"rgba(135, 135, 135, 1)"} size={20} style={stylesheet.searchIcon} />
					</View>
				</View>
				<View style={{ width: window.width, backgroundColor: "rgba(21, 21, 21, 1)" }} showsVerticalScrollIndicator={false}>
					<View style={GlobalStyle.frame}>
						<FlatList
							data={search === "" ? coins :
								coins.filter((coin) =>
									coin.name.toLowerCase().includes(search.toLocaleLowerCase()) ||
									coin.symbol.toLocaleLowerCase().includes(search.toLocaleLowerCase())
								)
							}
							showsVerticalScrollIndicator={false}
							ref={ref}
							refreshControl={
								<RefreshControl
									refreshing={refreshing}
									onRefresh={onRefresh}
								/>
							}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={[GlobalStyle.normalView, { paddingVertical: 20 }]}
									onPress={() =>
										props.navigation.push('TargetDetail', { coinId: item.id })
									}>
									<View style={{ flex: 3, paddingRight: 20 }}>
										<View style={{ flexDirection: "row", alignItems: "center" }}>
											<View style={{ flexDirection: "row", width: 120, alignItems: "center" }}>
												<Image style={[stylesheet.cryptoIcon, { marginRight: 10 }]} source={{ uri: item.image }} />
												<Text style={[
													item.symbol.length >= 6
														? GlobalStyle.TextL
														: item.symbol.length < 5 ? GlobalStyle.TextXXL
															: GlobalStyle.TextXL, { width: 80 }]}>
													{item.symbol.toUpperCase()}
												</Text>
											</View>
											<Text style={[GlobalStyle.TextL, { position: "relative", textAlign: "left" }]}>
												NT${item.current_price > 1 ? item.current_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
													: item.current_price > 0.01
														? roundDown(item.current_price, 6)
														: roundDown(item.current_price, 2)}
											</Text>
										</View>

										<View style={{ flexDirection: "row", marginVertical: 20 }}>
											<View style={{ flexDirection: "row", width: 120 }}>
												<Text style={[GlobalStyle.TextM, { color: "rgba(107, 255, 148, 1)", textAlign: "left", marginRight: 5 }]}>
													最高
												</Text>
												<Text style={[GlobalStyle.TextM, { color: "rgba(107, 255, 148, 1)", textAlign: "left" }]}>
													NT${item.high_24h > 1 ? item.high_24h.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
														: item.high_24h > 0.01
															? roundDown(item.high_24h, 6)
															: roundDown(item.high_24h, 2)}
												</Text>
											</View>
											<View style={{ flexDirection: "row", width: 120 }}>
												<Text style={[GlobalStyle.TextM, { color: "rgba(255, 92, 92, 1)", textAlign: "left", marginRight: 5 }]}>
													最低
												</Text>
												<Text style={[GlobalStyle.TextM, { color: "rgba(255, 92, 92, 1)", textAlign: "left" }]}>
													NT${item.low_24h > 1 ? item.low_24h.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
														: item.low_24h > 0.01
															? roundDown(item.low_24h, 6)
															: roundDown(item.low_24h, 2)}
												</Text>
											</View>
										</View>
									</View>
									<View style={{ flex: 1, marginLeft: 10, alignItems: "center", justifyContent: "center" }}>
										<LineChart
											style={stylesheet.volumeChart}
											data={item.sparkline_in_7d.price}
											svg={{ stroke: item.price_change_percentage_24h > 0 ? "rgba(107, 255, 148, 1)" : "rgba(255, 92, 92, 1)" }}
											contentInset={{ top: 5, bottom: 5 }}
										>
											<Grid />
										</LineChart>
										<View style={stylesheet.trade}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												交易
											</Text>
										</View>
									</View>
								</TouchableOpacity>
							)}
						/>
						<View style={{ height: 80 }}></View>
					</View>
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
}

const stylesheet = StyleSheet.create({
	cryptoIcon: {
		position: "relative",
		width: 30,
		height: 30,
		backgroundColor: "rgba(255, 255, 255, 0)",
	},
	volumeChart: {
		position: "relative",
		width: 96,
		height: 50
	},
	trade: {
		height: 25,
		width: 75,
		backgroundColor: "rgba(40, 40, 40, 1)",
		marginVertical: 5,
		paddingVertical: 5,
		borderRadius: 5
	},
	search: {
		position: "absolute",
		width: 149,
		height: 30,
		borderRadius: 36,
		right: 20,
		top: 16.5,
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
		top: 21.5,
	},
});

