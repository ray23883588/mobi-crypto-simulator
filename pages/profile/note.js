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
  FlatList,
  RefreshControl
} from "react-native";
import { useScrollToTop } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import GlobalStyle from '../../assets/styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from "../../assets/database";
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { roundDown, timeConvert } from '../../assets/function';
import { coinSymbolColor, coinIdSymbolList } from "../../assets/coinData";
import Toast from 'react-native-toast-message';

export default function NoteScreen(props) {

  const window = useWindowDimensions();
  const note = props.data.note;
  const [refreshing, setRefreshing] = useState(false);
  const [loginStatus, setLoginStatus] = useState(false);
  const isFocused = useIsFocused();
  const [coins, setCoins] = useState([])
  const ref = React.useRef(null);

  const auth = getAuth();

  const coinPriceFunction = async (coins) => {
    var coinList = ""
    for (const [key, value] of Object.entries(coins)) {
      coinList += key + ","
    }
    if (coinList.length > 1) {
      var fetchUrl = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=twd&ids=" + coinList + "&sparkline=false"
      const res = await fetch(
        fetchUrl
      ).then(response => {
        if (!response.ok) {
          console.log(response)
          console.log("標的錯誤")
          throw Error(response.statusText);
        }
        return response;
      });
      const dataGet = await res.json();
      setCoins(dataGet);
    }

  }



  useEffect(() => {
    coinPriceFunction(note)
  }, [isFocused, props.data]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await coinPriceFunction(note);
    setRefreshing(false);
  }, [refreshing]);


  useScrollToTop(ref);

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
      <View style={GlobalStyle.headerBar}>
        <TouchableOpacity style={GlobalStyle.backButton} onPress={() => props.navigation.pop()}>
          <Icon name="chevron-left" color={"#8afff4"} size={50} />
        </TouchableOpacity>
        <Text style={GlobalStyle.title}>
          筆記
        </Text>
        {/* {console.log(coins)} */}
      </View>
      <View style={{ width: window.width, backgroundColor: "rgba(21, 21, 21, 1)" }} showsVerticalScrollIndicator={false}>
        <View style={GlobalStyle.frame}>
          <FlatList
            style={{ height: "100%" }}
            data={coins}
            showsVerticalScrollIndicator={false}
            ref={ref}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
            keyExtractor={item => item.symbol}
            renderItem={({ item }) => (
              note[item.id]
                ? <View style={[GlobalStyle.normalView, { paddingVertical: 25 }]}>
                  <View style={{ flex: 4, justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={
                        [GlobalStyle.TextL, {
                          width: 90,
                          color:
                            coinSymbolColor[item.id] ? coinSymbolColor[item.id]["color"] : "#f7931a"
                        }]}>
                        {item.symbol.toUpperCase()}
                      </Text>
                      <Text style={[GlobalStyle.TextL]}>
                        {item.current_price > 1 ? item.current_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : item.current_price < 0.01
                            ? roundDown(item.current_price, 6)
                            : item.current_price}
                      </Text>
                      <Text style={[GlobalStyle.TextM, { alignSelf: "flex-end" }]}>／TWD</Text>
                    </View>
                    <View style={{ flexDirection: "row", width: "100%" }}>
                      <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>
                        {note[item.id].text.length < 10 ? `${note[item.id].text}` : `${note[item.id].text.substring(0, 10)}...`}
                      </Text>
                      <Text style={[GlobalStyle.TextS, stylesheet.noteDate]}>{timeConvert(note[item.id].time.seconds)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={stylesheet.tradeButton}
                    onPress={() =>
                      props.navigation.push('TargetDetail', { coinId: item.id })
                    }>
                    <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>詳細</Text>
                  </TouchableOpacity>
                </View>
                : <></>
            )}
          />

        </View>
      </View>
    </View>
  );
}

const stylesheet = StyleSheet.create({
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