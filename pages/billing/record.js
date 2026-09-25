import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, TouchableOpacity, useWindowDimensions, FlatList } from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SwitchSelector from "react-native-switch-selector";
import GlobalStyle from '../../assets/styles';
import { roundDown, timeConvertDate, timeConvertTime } from '../../assets/function';

export default function Record(props) {

	const window = useWindowDimensions();
	const [halfDayStyle, setHalfDayStyle] = useState("flex")
	const [oneDayStyle, setOneDayStyle] = useState("none")
	const [threeDaysStyle, setThreeDaysStyle] = useState("none")
	const [allStyle, setAllStyle] = useState("none")
	const record = props.tradeRecord;
	const averagePrice = props.data.averagePrice;
	const date = Date.now() / 1000;

	const unrealized = (averagePrice, dealPrice, quantity) => {
		return (dealPrice - averagePrice) * quantity
	}

	return (
		<View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
			<View style={GlobalStyle.headerBar}>
				<TouchableOpacity style={GlobalStyle.backButton} onPress={() => props.navigation.pop()}>
					<Icon name="chevron-left" color={"#8afff4"} size={50} />
				</TouchableOpacity>
				<Text style={GlobalStyle.title}>
					交易紀錄
				</Text>
			</View>
			<ScrollView bounces={false} style={{ width: window.width, backgroundColor: "rgba(21, 21, 21, 1)" }} showsVerticalScrollIndicator={false}>
				<View style={GlobalStyle.frame}>

					<View style={GlobalStyle.normalView}>
						<SwitchSelector
							style={{ marginHorizontal: 20 }}
							initial={0}
							onPress={value => {
								if (value === "halfDay") {
									setHalfDayStyle("flex")
									setOneDayStyle("none")
									setThreeDaysStyle("none")
									setAllStyle("none")
								}
								else if (value === "oneDay") {
									setHalfDayStyle("none")
									setOneDayStyle("flex")
									setThreeDaysStyle("none")
									setAllStyle("none")
								}
								else if (value === "threeDays") {
									setHalfDayStyle("none")
									setOneDayStyle("none")
									setThreeDaysStyle("flex")
									setAllStyle("none")
								}
								else {
									setHalfDayStyle("none")
									setOneDayStyle("none")
									setThreeDaysStyle("none")
									setAllStyle("flex")
								}
							}}
							fontSize={16}
							textColor="white"
							selectedColor="white"
							buttonColor="#00afaa"
							borderColor="rgba(69, 69, 69, 1)"
							backgroundColor="rgba(69, 69, 69, 1)"
							borderRadius={5}
							options={[
								{ label: "近半日", value: "halfDay" },
								{ label: "近一日", value: "oneDay" },
								{ label: "近三日", value: "threeDays" },
								{ label: "全部", value: "all" },
							]}
						/>
					</View>

					<View style={[GlobalStyle.normalList, { display: halfDayStyle }]}>
						<View style={{ position: "relative", display: "flex", width: (Dimensions.get("window").width - 25) }}>
							<View style={{ flex: 1, alignItems: "flex-end" }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center", color: "red" }]}>
									*以新台幣計算
								</Text>
							</View>
						</View>
						<View>
							<ScrollView horizontal={true} bounces={false} style={{ height: "100%" }}>
								<View style={{ width: 590 }}>
									<View style={[GlobalStyle.normalListView, { width: 550 }]}>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												日期
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												幣名
											</Text>
										</View>
										<View style={{ width: 30 }}></View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												數量
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交價
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												損益
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交額
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												投報率
											</Text>
										</View>
									</View>

									<FlatList
										bounces={false}
										data={record}
										showsVerticalScrollIndicator={false}
										keyExtractor={item => item.deal_time}
										renderItem={({ item }) => (
											date - item.deal_time.seconds <= 43200
												? <View style={[GlobalStyle.normalListView, { width: 550 }]}>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText, { lineHeight: 12 }]}>
															{timeConvertDate(item.deal_time.seconds)}
															{timeConvertTime(item.deal_time.seconds)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextL, GlobalStyle.billingText]}>
															{item.currency_symbol.toUpperCase()}
														</Text>
													</View>
													<View style={{ width: 30 }}>
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
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.quantity > 100000
																? roundDown(item.quantity, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.quantity > 1 ? roundDown(item.quantity, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: roundDown(item.quantity, 6)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.deal_price > 100000
																? roundDown(item.deal_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.deal_price > 1 ? roundDown(item.deal_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.deal_price > 0.01
																		? roundDown(item.deal_price, 2)
																		: roundDown(item.deal_price, 6)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														{item.direction == "買入"
															? <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
																-
															</Text>
															: <Text style={item.profit >= 0
																? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
																: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
															}>
																{item.profit >= 0 ? "+" : "-"}
																{Math.abs(item.profit) > 1
																	? roundDown(Math.abs(item.profit), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: Math.abs(item.profit) > 0.01
																		? roundDown(Math.abs(item.profit), 2)
																		: roundDown(Math.abs(item.profit), 6)}
															</Text>
														}
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.deal_value
																? item.deal_value > 1 ? roundDown(item.deal_value, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.deal_value > 0.01
																		? roundDown(item.order_value, 2)
																		: roundDown(item.deal_value, 6)
																: item.order_value > 1 ? roundDown(item.order_value, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.order_value > 0.01
																		? roundDown(item.order_value, 2)
																		: roundDown(item.order_value, 6)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.direction == "買入"
																? <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
																	-
																</Text>
																: <Text style={item.ROI >= 0
																	? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
																	: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
																}>
																	{roundDown(item.ROI * 100, 2)}%
																</Text>
															}
														</Text>
													</View>
												</View>
												: <></>
										)} />


								</View>
							</ScrollView>
						</View>

					</View>

					<View style={[GlobalStyle.normalList, { display: oneDayStyle }]}>

						<View style={{ position: "relative", display: "flex", width: (Dimensions.get("window").width - 25) }}>
							<View style={{ flex: 1, alignItems: "flex-end" }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center", color: "red" }]}>
									*以新台幣計算
								</Text>
							</View>
						</View>
						<View>
							<ScrollView horizontal={true} bounces={false} style={{ height: "100%" }}>
								<View style={{ width: 590 }}>
									<View style={[GlobalStyle.normalListView, { width: 550 }]}>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												日期
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												幣名
											</Text>
										</View>
										<View style={{ width: 30 }}></View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												數量
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交價
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												損益
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交額
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												投報率
											</Text>
										</View>
									</View>

									<FlatList
										bounces={false}
										data={record}
										showsVerticalScrollIndicator={false}
										keyExtractor={item => item.deal_time}
										renderItem={({ item }) => (
											date - item.deal_time.seconds <= 86400
												? <View style={[GlobalStyle.normalListView, { width: 550 }]}>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText, { lineHeight: 12 }]}>
															{timeConvertDate(item.deal_time.seconds)}
															{timeConvertTime(item.deal_time.seconds)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextL, GlobalStyle.billingText]}>
															{item.currency_symbol.toUpperCase()}
														</Text>
													</View>
													<View style={{ width: 30 }}>
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
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.quantity > 100000
																? roundDown(item.quantity, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.quantity > 1 ? roundDown(item.quantity, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: roundDown(item.quantity, 6)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.deal_price > 100000
																? roundDown(item.deal_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.deal_price > 1 ? roundDown(item.deal_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.deal_price > 0.01
																		? roundDown(item.deal_price, 2)
																		: roundDown(item.deal_price, 6)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														{item.direction == "買入"
															? <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
																-
															</Text>
															: <Text style={item.profit >= 0
																? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
																: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
															}>
																{item.profit >= 0 ? "+" : "-"}
																{Math.abs(item.profit) > 1
																	? roundDown(Math.abs(item.profit), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: Math.abs(item.profit) > 0.01
																		? roundDown(Math.abs(item.profit), 2)
																		: roundDown(Math.abs(item.profit), 6)}
															</Text>
														}
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.deal_value
																? item.deal_value > 1 ? roundDown(item.deal_value, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.deal_value > 0.01
																		? roundDown(item.order_value, 2)
																		: roundDown(item.deal_value, 6)
																: item.order_value > 1 ? roundDown(item.order_value, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.order_value > 0.01
																		? roundDown(item.order_value, 2)
																		: roundDown(item.order_value, 6)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.direction == "買入"
																? <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
																	-
																</Text>
																: <Text style={item.ROI >= 0
																	? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
																	: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
																}>
																	{roundDown(item.ROI * 100, 2)}%
																</Text>
															}
														</Text>
													</View>
												</View>
												: <></>
										)} />


								</View>
							</ScrollView>
						</View>


					</View>

					<View style={[GlobalStyle.normalList, { display: threeDaysStyle }]}>
						<View style={{ position: "relative", display: "flex", width: (Dimensions.get("window").width - 25) }}>
							<View style={{ flex: 1, alignItems: "flex-end" }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center", color: "red" }]}>
									*以新台幣計算
								</Text>
							</View>
						</View>
						<View>
							<ScrollView horizontal={true} bounces={false} style={{ height: "100%" }}>
								<View style={{ width: 590 }}>
									<View style={[GlobalStyle.normalListView, { width: 550 }]}>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												日期
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												幣名
											</Text>
										</View>
										<View style={{ width: 30 }}></View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												數量
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交價
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												損益
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交額
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												投報率
											</Text>
										</View>
									</View>

									<FlatList
										bounces={false}
										data={record}
										showsVerticalScrollIndicator={false}
										keyExtractor={item => item.deal_time}
										renderItem={({ item }) => (
											date - item.deal_time.seconds <= 259200
												? <View style={[GlobalStyle.normalListView, { width: 550 }]}>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText, { lineHeight: 12 }]}>
															{timeConvertDate(item.deal_time.seconds)}
															{timeConvertTime(item.deal_time.seconds)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextL, GlobalStyle.billingText]}>
															{item.currency_symbol.toUpperCase()}
														</Text>
													</View>
													<View style={{ width: 30 }}>
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
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.quantity > 100000
																? roundDown(item.quantity, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.quantity > 1 ? roundDown(item.quantity, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: roundDown(item.quantity, 6)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.deal_price > 100000
																? roundDown(item.deal_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.deal_price > 1 ? roundDown(item.deal_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.deal_price > 0.01
																		? roundDown(item.deal_price, 2)
																		: roundDown(item.deal_price, 6)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														{item.direction == "買入"
															? <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
																-
															</Text>
															: <Text style={item.profit >= 0
																? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
																: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
															}>
																{item.profit >= 0 ? "+" : "-"}
																{Math.abs(item.profit) > 1
																	? roundDown(Math.abs(item.profit), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: Math.abs(item.profit) > 0.01
																		? roundDown(Math.abs(item.profit), 2)
																		: roundDown(Math.abs(item.profit), 6)}
															</Text>
														}
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.deal_value
																? item.deal_value > 1 ? roundDown(item.deal_value, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.deal_value > 0.01
																		? roundDown(item.order_value, 2)
																		: roundDown(item.deal_value, 6)
																: item.order_value > 1 ? roundDown(item.order_value, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																	: item.order_value > 0.01
																		? roundDown(item.order_value, 2)
																		: roundDown(item.order_value, 6)}
														</Text>
													</View>
													<View style={{ width: 70 }}>
														<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															{item.direction == "買入"
																? <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
																	-
																</Text>
																: <Text style={item.ROI >= 0
																	? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
																	: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
																}>
																	{roundDown(item.ROI * 100, 2)}%
																</Text>
															}
														</Text>
													</View>
												</View>
												: <></>
										)} />


								</View>
							</ScrollView>
						</View>

					</View>

					<View style={[GlobalStyle.normalList, { display: allStyle }]}>
						<View style={{ position: "relative", display: "flex", width: (Dimensions.get("window").width - 25) }}>
							<View style={{ flex: 1, alignItems: "flex-end" }}>
								<Text style={[GlobalStyle.TextM, { textAlign: "center", color: "red" }]}>
									*以新台幣計算
								</Text>
							</View>
						</View>
						<View>
							<ScrollView horizontal={true} bounces={false} style={{ height: "100%" }}>
								<View style={{ width: 590 }}>
									<View style={[GlobalStyle.normalListView, { width: 550 }]}>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												日期
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												幣名
											</Text>
										</View>
										<View style={{ width: 30 }}></View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												數量
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交價
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												損益
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												成交額
											</Text>
										</View>
										<View style={{ width: 70 }}>
											<Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
												投報率
											</Text>
										</View>
									</View>

									<FlatList
										bounces={false}
										data={record}
										showsVerticalScrollIndicator={false}
										keyExtractor={item => item.deal_time}
										renderItem={({ item }) => (
											<View style={[GlobalStyle.normalListView, { width: 550 }]}>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText, { lineHeight: 12 }]}>
														{timeConvertDate(item.deal_time.seconds)}
														{timeConvertTime(item.deal_time.seconds)}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextL, GlobalStyle.billingText]}>
														{item.currency_symbol.toUpperCase()}
													</Text>
												</View>
												<View style={{ width: 30 }}>
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
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.quantity > 100000
															? roundDown(item.quantity, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
															: item.quantity > 1 ? roundDown(item.quantity, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: roundDown(item.quantity, 6)}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.deal_price > 100000
															? roundDown(item.deal_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
															: item.deal_price > 1 ? roundDown(item.deal_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.deal_price > 0.01
																	? roundDown(item.deal_price, 2)
																	: roundDown(item.deal_price, 6)}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													{item.direction == "買入"
														? <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
															-
														</Text>
														: <Text style={item.profit >= 0
															? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
															: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
														}>
															{item.profit >= 0 ? "+" : "-"}
															{Math.abs(item.profit) > 1
																? roundDown(Math.abs(item.profit), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: Math.abs(item.profit) > 0.01
																	? roundDown(Math.abs(item.profit), 2)
																	: roundDown(Math.abs(item.profit), 6)}
														</Text>
													}
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.deal_value
															? item.deal_value > 1 ? roundDown(item.deal_value, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.deal_value > 0.01
																	? roundDown(item.order_value, 2)
																	: roundDown(item.deal_value, 6)
															: item.order_value > 1 ? roundDown(item.order_value, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
																: item.order_value > 0.01
																	? roundDown(item.order_value, 2)
																	: roundDown(item.order_value, 6)}
													</Text>
												</View>
												<View style={{ width: 70 }}>
													<Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
														{item.direction == "買入"
															? <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
																-
															</Text>
															: <Text style={item.ROI >= 0
																? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
																: [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
															}>
																{roundDown(item.ROI * 100, 2)}%
															</Text>
														}
													</Text>
												</View>
											</View>
										)} />


								</View>
							</ScrollView>
						</View>

					</View>
					<View style={{ height: 80 }}></View>

				</View>
			</ScrollView>
		</View>
	);
}