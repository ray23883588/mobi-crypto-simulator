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
import GlobalStyle from '../../assets/styles';
import { LineChart, Grid } from 'react-native-svg-charts';

export default function FavoriteScreen(props) {

  const window = useWindowDimensions();
  const favorite = props.data.favorite;
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [coins, setCoins] = useState([]);
  const isFocused = useIsFocused();
  const ref = React.useRef(null);

  useScrollToTop(ref);

  const getCoins = async () => {
    var coinList = ""
    for (const [key, value] of Object.entries(favorite)) {
      coinList += key + ","
    }
    if (coinList.length > 1) {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=twd&ids=" + coinList + "&sparkline=true"
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
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await getCoins();
    setRefreshing(false);
  }, [refreshing]);

  useEffect(() => {
    setSearch("")
    getCoins();
    // const timer = setInterval(() => {
    // 	getCoins();
    // }, 10000)

    // return () => {
    // 	clearInterval(timer)
    // }
  }, [isFocused, props.data]);

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
        <View style={GlobalStyle.headerBar}>
          <TouchableOpacity style={GlobalStyle.backButton} onPress={() => props.navigation.pop()}>
            <Icon name="chevron-left" color={"#8afff4"} size={50} />
          </TouchableOpacity>
          <Text style={GlobalStyle.title}>
            最愛
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
              style={{ height: "100%" }}
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
                favorite[item.id]
                  ? <TouchableOpacity
                    style={[GlobalStyle.normalView, { paddingVertical: 20 }]}
                    onPress={() =>
                      props.navigation.push('TargetDetail', { coinId: item.id })
                    }>
                    <View style={{ flex: 3, paddingRight: 20 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ flexDirection: "row", marginRight: 10, width: 120 }}>
                          <Image style={[stylesheet.cryptoIcon, { marginRight: 10 }]} source={{ uri: item.image }} />
                          <Text style={[item.symbol.length < 5 ? GlobalStyle.TextXXL : GlobalStyle.TextXL, { width: 80 }]}>
                            {item.symbol.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[GlobalStyle.TextL, { position: "relative", textAlign: "left" }]}>
                          ${item.current_price > 1 ? item.current_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : item.current_price < 0.01
                              ? item.current_price.toFixed(6)
                              : item.current_price}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", marginVertical: 20 }}>
                        <View style={{ flexDirection: "row", width: 120 }}>
                          <Text style={[GlobalStyle.TextM, { color: "rgba(107, 255, 148, 1)", textAlign: "left", marginRight: 10 }]}>
                            最高
                          </Text>
                          <Text style={[GlobalStyle.TextM, { color: "rgba(107, 255, 148, 1)", textAlign: "left" }]}>
                            ${item.high_24h > 1 ? item.high_24h.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                              : item.high_24h < 0.01
                                ? item.high_24h.toFixed(6)
                                : item.high_24h}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", width: 120 }}>
                          <Text style={[GlobalStyle.TextM, { color: "rgba(255, 92, 92, 1)", textAlign: "left", marginRight: 10 }]}>
                            最低
                          </Text>
                          <Text style={[GlobalStyle.TextM, { color: "rgba(255, 92, 92, 1)", textAlign: "left" }]}>
                            ${item.low_24h > 1 ? item.low_24h.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                              : item.low_24h < 0.01
                                ? item.low_24h.toFixed(6)
                                : item.low_24h}
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
                  : <></>

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

