import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { useIsFocused } from '@react-navigation/native'
import GlobalStyle from '../../assets/styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from "../../assets/database";
import { addDoc, collection, doc, getDocs, query, setDoc, updateDoc, where, increment, limit, orderBy } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { LineChart, Grid, YAxis, XAxis } from 'react-native-svg-charts';
import SwitchSelector from "react-native-switch-selector";
import { TextInput } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Slider from '@react-native-community/slider';
import { roundDown } from '../../assets/function';
import Toast from 'react-native-toast-message';
import { async } from '@firebase/util';



export default function TargetDetailScreen(props) {
  const [userId, setUserId] = useState("")
  const window = useWindowDimensions();
  const [Favorite, setFavorite] = useState(props.data.favorite[props.route.params.coinId] ? true : false);
  const [note, setNote] = useState(props.data.note[props.route.params.coinId] ? props.data.note[props.route.params.coinId].text : "");
  const [coins, setCoins] = useState([]);
  const [USDPrice, setUSDPrice] = useState([0, 0, 0, 0, 0, 0, 0]);
  const isFocused = useIsFocused();
  const [modalVisible, setModalVisible] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  const [priceSelect, setPriceSelect] = useState();
  const [tradePrice, setTradePrice] = useState();
  const [volume, setVolume] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [tradeType, setTradeType] = useState();
  const [rate, setRate] = useState(0);
  const [rateCount, setRateCount] = useState(0);
  const twdValue = props.data.pocket.twd;
  const date = new Date();
  const [sliderFocus, setSliderFocus] = useState(false);
  const [volumeFocus, setVolumeFocus] = useState(false);
  const [tradeValueFocus, setTradeValueFocus] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [insideModalToast, setInsideModalToast] = useState(false)
  const [buyingOrderBook, setBuyingOrderBook] = useState([]);
  const [sellingOrderBook, setSellingOrderBook] = useState([]);

  const getOrderBook = async () => {
    const BuyingCol = query(collection(db, "transaction"), where("currency_id", "==", props.route.params.coinId), where("direction", "==", "買入"), orderBy("order_time", "desc"), limit(5));
    const SellingCol = query(collection(db, "transaction"), where("currency_id", "==", props.route.params.coinId), where("direction", "==", "賣出"), orderBy("order_time", "desc"), limit(5));
    const BuyingSnapshot = await getDocs(BuyingCol);
    const SellingSnapshot = await getDocs(SellingCol);
    setBuyingOrderBook(BuyingSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    setSellingOrderBook(SellingSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  let datesCollection = [];
  let datesCollectionLong = [];

  if (date.getDate() < 7) {
    if (date.getMonth() + 1 == 1, 3, 5, 7, 8, 10, 12) {
      for (var i = 0; i <= 6; i++) {
        if (date.getDate() - i < 1) {
          datesCollectionLong.push(`${date.getFullYear()}${("00" + String(date.getMonth() + 1)).slice(-2)}${("00" + String(date.getDate() - i + 30)).slice(-2)}`)
          datesCollection.push(`${date.getMonth()}/${date.getDate() - i + 30}`)
        }
        else {
          datesCollectionLong.push(`${date.getFullYear()}${("00" + String(date.getMonth() + 1)).slice(-2)}${("00" + String(date.getDate() - i)).slice(-2)}`)
          datesCollection.push(`${date.getMonth() + 1}/${date.getDate() - i}`)
        }
      }
    }
    else if (date.getMonth() + 1 == 4, 6, 9, 11) {
      for (var i = 0; i <= 6; i++) {
        if (date.getDate() - i < 1) {
          datesCollectionLong.push(`${date.getFullYear()}${("00" + String(date.getMonth() + 1)).slice(-2)}${("00" + String(date.getDate() - i + 29)).slice(-2)}`)
          datesCollection.push(`${date.getMonth()}/${date.getDate() - i + 29}`)
        }
        else {
          datesCollectionLong.push(`${date.getFullYear()}${("00" + String(date.getMonth() + 1)).slice(-2)}${("00" + String(date.getDate() - i)).slice(-2)}`)
          datesCollection.push(`${date.getMonth() + 1}/${date.getDate() - i}`)
        }
      }
    }
    else {
      for (var i = 0; i <= 6; i++) {
        if (date.getDate() - i < 1) {
          if ((date.getFullYear() % 4 == 0 && date.getFullYear() % 100 != 0) || (date.getFullYear() % 400 == 0)) {
            datesCollectionLong.push(`${date.getFullYear()}${("00" + String(date.getMonth() + 1)).slice(-2)}${("00" + String(date.getDate() - i + 28)).slice(-2)}`)
            datesCollection.push(`${date.getMonth()}/${date.getDate() - i + 28}`)
          } else {
            datesCollectionLong.push(`${date.getFullYear()}${("00" + String(date.getMonth() + 1)).slice(-2)}${("00" + String(date.getDate() - i + 27)).slice(-2)}`)
            datesCollection.push(`${date.getMonth()}/${date.getDate() - i + 27}`)
          }
        }
        else {
          datesCollectionLong.push(`${date.getFullYear()}${("00" + String(date.getMonth() + 1)).slice(-2)}${("00" + String(date.getDate() - i)).slice(-2)}`)
          datesCollection.push(`${date.getMonth() + 1}/${date.getDate() - i}`)
        }
      }
    }
  }
  else {
    for (var i = 0; i <= 6; i++) {
      datesCollectionLong.push(`${date.getFullYear()}${("00" + String(date.getMonth() + 1)).slice(-2)}${("00" + String(date.getDate() - i)).slice(-2)}`)
      datesCollection.push(`${date.getMonth() + 1}/${date.getDate() - i}`)
    }
  }

  const getCoins = async () => {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=twd&ids=" + props.route.params.coinId + "&sparkline=true"
    ).then(response => {
      if (!response.ok) {
        console.log(response)
        console.log("TD1錯誤")
        throw Error(response.statusText);
      }
      return response;
    });
    const data = await res.json();
    setCoins(data);
  };

  const getDefaultCoins = async () => {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=twd&ids=" + props.route.params.coinId + "&sparkline=true"
    ).then(response => {
      if (!response.ok) {
        console.log(response)
        console.log("TD2錯誤")
        throw Error(response.statusText);
      }
      return response;
    });
    const data = await res.json();
    setTradePrice(data[0].current_price);
  };

  const getUSDPrice = async () => {
    var usd_price = []
    var data = []
    try {
      fetch('https://api.mobicrypto.tw/exchange_rate', {
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
          data = json.exchange_rate
          for (var i = 0; i < datesCollectionLong.length; i++) {
            var check = 0
            var pointer = 0
            for (var j = 0; j < data.length; j++) {
              if (data[j].Date === datesCollectionLong[i]) {
                check = 1
                usd_price.unshift(Number(data[j]["USD/NTD"]))
              }
              if (datesCollectionLong[i] > data[j].Date) {
                pointer = j
              }
            }
            if (check === 0) {
              usd_price.unshift(Number(data[pointer]["USD/NTD"]))
            }
          }
        } else {
          showToast("error", "錯誤", json.message)
        }
      });

    } catch (e) {
      console.log(e)
    }


    const res2 = await fetch(
      "https://tw.rter.info/capi.php"
    );
    const data2 = await res2.json();
    if (usd_price.length == 6) usd_price[6] = data2.USDTWD.Exrate
    setUSDPrice(usd_price);
    // setUSDPrice(data2.USDTWD.Exrate);

  };



  async function handleTransButtonPress(priceSelect) {
    setProcessing(true)
    if (tradeValue === 0) {
      alert("成交額不可為0！")
      // showToast("error", "錯誤", "成交額不可為0！")
      setProcessing(false)
    } else {
      if (tradeType === "買進") {
        if (tradeValue > twdValue) {
          showToast("error", "錯誤", "帳戶餘額不足！")
          setProcessing(false)
        } else {
          if (priceSelect === "market") {
            try {
              fetch('https://api.mobicrypto.tw/buy/market', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  id_token: props.userInfo.accessToken,
                  currency_id: coins[0].id,
                  currency_symbol: coins[0].symbol,
                  direction: "買入",
                  order_value: tradeValue,
                })
              }).then(response => {
                if (!response.ok) {
                  showToast("error", "錯誤", "伺服器錯誤")
                  setProcessing(false)
                  throw Error(response.statusText);
                }
                return response.json();
              }).then(json => {
                if (json.status === "success") {
                  showToast("success", "成交", "已在價格" + json.price + "買入" + json.quantity + "個" + coins[0].symbol.toUpperCase())
                  setModalVisible(false)
                  setProcessing(false)
                } else {
                  showToast("error", "錯誤", "伺服器錯誤")
                  setProcessing(false)
                }
              });

            } catch (e) {
              console.log(e)
              setProcessing(false)
            }
          } else if (priceSelect === "limit") {
            if (tradePrice === undefined) { }
            try {
              fetch('https://api.mobicrypto.tw/buy/limit', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  id_token: props.userInfo.accessToken,
                  currency_id: coins[0].id,
                  currency_symbol: coins[0].symbol,
                  direction: "買入",
                  order_value: tradeValue,
                  order_price: tradePrice,
                  quantity: volume
                })
              }).then(response => {
                if (!response.ok) {
                  throw Error(response.statusText);
                }
                return response.json();
              }).then(json => {
                if (json.status === "success") {
                  showToast("success", "掛單成功", "將在價格為" + tradePrice + "時買入" + volume + "個" + coins[0].symbol.toUpperCase())
                  setModalVisible(false)
                  setProcessing(false)
                } else {
                  showToast("error", "錯誤", "伺服器錯誤")
                  setProcessing(false)
                }
              }).catch(e => {
                showToast("error", "錯誤", "伺服器錯誤")
                setProcessing(false)
                console.log(e)
              });
            } catch (e) {
              console.log(e)
              setProcessing(false)
            }
          }
        }
      } else {
        let currencyValue = props.data.pocket[coins[0].id] ? props.data.pocket[coins[0].id] : 0
        if (volume > currencyValue) {
          showToast("error", "錯誤", "帳戶餘額不足！")
          setProcessing(false)
        } else {
          if (priceSelect === "market") {
            try {
              fetch('https://api.mobicrypto.tw/sell/market', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  id_token: props.userInfo.accessToken,
                  currency_id: coins[0].id,
                  currency_symbol: coins[0].symbol,
                  direction: "賣出",
                  quantity: volume,
                })
              }).then(response => {
                if (!response.ok) {
                  showToast("error", "錯誤", "伺服器錯誤")
                  setProcessing(false)
                  throw Error(response.statusText);
                }
                return response.json();
              }).then(json => {
                if (json.status === "success") {
                  showToast("success", "成交", "已在價格" + json.price + "賣出" + json.quantity + "個" + coins[0].symbol.toUpperCase())
                  setModalVisible(false)
                  setProcessing(false)
                } else {
                  console.log(json)
                  showToast("error", "錯誤", "伺服器錯誤1")
                  setProcessing(false)
                }
              });

            } catch (e) {
              console.log(e)
              setProcessing(false)
            }
          } else if (priceSelect === "limit") {
            if (tradePrice === undefined) { }
            try {
              fetch('https://api.mobicrypto.tw/sell/limit', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  id_token: props.userInfo.accessToken,
                  currency_id: coins[0].id,
                  currency_symbol: coins[0].symbol,
                  direction: "賣出",
                  order_value: tradeValue,
                  order_price: tradePrice,
                  quantity: volume
                })
              }).then(response => {
                if (!response.ok) {
                  throw Error(response.statusText);
                }
                return response.json();
              }).then(json => {
                if (json.status === "success") {
                  showToast("success", "掛單成功", "將在價格為" + tradePrice + "時買入" + volume + "個" + coins[0].symbol.toUpperCase())
                  setModalVisible(false)
                  setProcessing(false)
                } else {
                  showToast("error", "錯誤", "伺服器錯誤")
                  setProcessing(false)
                }
              }).catch(e => {
                showToast("error", "錯誤", "伺服器錯誤")
                setProcessing(false)
                console.log(e)
              });
            } catch (e) {
              console.log(e)
              setProcessing(false)
            }
          }
        }
      }
    }
  }

  async function handleFavoritePress(status) {
    setFavorite(!Favorite)
    let favoriteCurrency = { ...props.data.favorite }
    const profileRef = doc(db, "account", props.userInfo.uid);
    if (status === true) {
      favoriteCurrency[props.route.params.coinId] = true
      await updateDoc(profileRef, {
        favorite: favoriteCurrency
      });
    } else if (status === false) {
      delete favoriteCurrency[props.route.params.coinId]
      await updateDoc(profileRef, {
        favorite: favoriteCurrency
      });
    }
  }

  async function handleNoteConfirm() {
    setNoteVisible(!noteVisible)
    let newNote = { ...props.data.note }
    const profileRef = doc(db, "account", props.userInfo.uid);
    if (note === "") {
      delete newNote[props.route.params.coinId]
      await updateDoc(profileRef, {
        note: newNote
      });
    } else {
      newNote[props.route.params.coinId] = {
        text: note,
        time: new Date(),
      }
      await updateDoc(profileRef, {
        note: newNote
      });
    }
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

  useEffect(() => {
    getUSDPrice();
    getDefaultCoins();
    getOrderBook();
    const timer = setInterval(() => {
      getCoins();
    }, 4000)

    return () => {
      clearInterval(timer)
    }

  }, [isFocused]);


  return (
    <FlatList
      style={{ width: window.width, backgroundColor: "rgba(21, 21, 21, 1)", flex: 1 }}
      scrollEnabled={false}
      horizontal={true}
      bounces={false}
      data={coins}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={{ width: window.width, flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
          <Modal
            animationType="fade"
            transparent={true}
            visible={noteVisible}
            onRequestClose={() => {
              setNoteVisible(!noteVisible);
            }}
            statusBarTranslucent={true}
          >
            <View style={{ backgroundColor: "#000000AA", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <View style={{ width: "80%", height: "40%", backgroundColor: "rgba(21, 21, 21, 1)", borderRadius: 30, alignItems: "center" }}>
                <TextInput
                  style={stylesheet.noteInput}
                  value={note}
                  defaultValue={note}
                  onChangeText={(value) => setNote(value)}
                  returnKeyType='next'
                  returnKeyLabel='next' />
                <TouchableOpacity
                  style={[stylesheet.tradeButton, { height: 50, alignSelf: "center" }]}
                  onPress={() => handleNoteConfirm()
                  }>
                  <Text style={GlobalStyle.TextL}>
                    確認
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(!modalVisible);
            }}
            statusBarTranslucent={true}
          >
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

            <View style={{ backgroundColor: "#000000AA", justifyContent: "flex-end" }}>
              <TouchableWithoutFeedback
                onPress={() => {
                  setModalVisible(!modalVisible);
                }}>
                <View style={{ height: "30%", width: "100%" }}></View>
              </TouchableWithoutFeedback>
              <View style={{ height: "70%", backgroundColor: "rgba(21, 21, 21, 1)", }}>
                <View style={{ width: "100%", flexDirection: "row" }}>
                  <View style={{ flex: 1, height: 60 }}>
                    <View style={{ height: "50%", borderBottomWidth: 1, borderColor: "#00afaa" }} />
                  </View>
                  <View style={{ width: 90, height: 60, justifyContent: "center" }}>
                    <Text style={[GlobalStyle.title, stylesheet.tradeMenuTitle]}>交易</Text>
                  </View>
                  <View style={{ flex: 1, height: 60 }}>
                    <View style={{ height: "50%", borderBottomWidth: 1, borderColor: "#00afaa" }} />
                  </View>
                </View>
                <KeyboardAwareScrollView bounces={false}>
                  <View style={GlobalStyle.normalView}>
                    <SwitchSelector
                      initial={0}
                      onPress={value => {
                        setPriceSelect(value)
                        setVolume(0)
                        setRate(0)
                        setRateCount(0)
                        setTradeValue(0)
                      }}
                      fontSize={20}
                      textColor="white"
                      selectedColor="white"
                      buttonColor="#00afaa"
                      borderColor="rgba(69, 69, 69, 1)"
                      backgroundColor="rgba(69, 69, 69, 1)"
                      borderRadius={5}
                      options={[
                        { label: "市價", value: "market" },
                        { label: "限價", value: "limit" },
                      ]}
                    />
                  </View>
                  <Text style={[GlobalStyle.TextM, { textAlign: "left", color: "red", marginLeft: 25 }]}>
                    *數值大於1/小於1，超過小數點後2/6位將無條件捨去
                  </Text>
                  <View style={GlobalStyle.normalList}>
                    <View style={[GlobalStyle.normalListView, { justifyContent: "space-between" }]}>
                      {priceSelect === "limit" ? <Text style={GlobalStyle.TextL}>價格</Text> : <Text style={GlobalStyle.TextL}>當前參考價格</Text>}

                      {priceSelect === "limit"
                        ? <TextInput
                          editable={true}
                          keyboardType="numeric"
                          value={
                            tradePrice.toString()
                          }
                          style={stylesheet.input}
                          onChangeText={(value) => {
                            setTradePrice(value)
                            // setTradeValue((parseFloat(value) * parseFloat(volume)) ? (parseFloat(value) * parseFloat(volume)) : "0");
                            setVolume((parseFloat(tradeValue)) / parseFloat(value) ? (parseFloat(tradeValue) / parseFloat(value)) : "0");
                          }} />
                        : <TextInput
                          editable={false}
                          value={
                            item.current_price > 1 ? item.current_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                              : item.current_price > 0.01
                                ? item.current_price.toString()
                                : item.current_price < 0.000001
                                  ? tradePrice.toString()
                                  : roundDown(item.current_price, 6).toString()
                          }
                          style={stylesheet.input} />
                      }

                    </View>
                    <View style={[GlobalStyle.normalListView, { justifyContent: "space-between" }]}>
                      <Text style={GlobalStyle.TextL}>數量</Text>
                      <TextInput
                        keyboardType="numeric"
                        maxLength={volume < 1 ? 8 : 100}
                        onFocus={() => setVolumeFocus(true)}
                        onBlur={() => setVolumeFocus(false)}
                        style={stylesheet.input}
                        value={
                          volume < 1
                            ? volume.toString().length < 9
                              ? volume.toString()
                              : roundDown(volume, 6).toString()
                            : typeof (volume) == "number"
                              ? roundDown(volume, 2).toString()
                              : volume
                        }
                        onChangeText={(value) => {
                          if (volumeFocus) {
                            setVolume(value);
                            if (priceSelect === "limit") {
                              setTradeValue((parseFloat(tradePrice) * parseFloat(value)) ? (parseFloat(tradePrice) * parseFloat(value)) : "0");
                            }
                            else {
                              setTradeValue((item.current_price * parseFloat(value)) ? (item.current_price * parseFloat(value)) : "0");
                            }
                            if (tradeType === "買進") {
                              setRateCount(tradeValue / twdValue);
                              setRate(tradeValue / twdValue);
                            }
                            else {
                              setRateCount((parseFloat(value) / props.data.pocket[item.id]) ? (parseFloat(value) / props.data.pocket[item.id]) : 0);
                              setRate((parseFloat(value) / props.data.pocket[item.id]) ? (parseFloat(value) / props.data.pocket[item.id]) : 0);
                            }
                          }
                        }}
                      />
                    </View>
                    <View style={[GlobalStyle.normalListView, { justifyContent: "space-between" }]}>
                      <Text style={GlobalStyle.TextL}>成交額</Text>
                      <TextInput
                        style={stylesheet.input}
                        maxLength={volume < 1 ? 8 : 100}
                        onFocus={() => setTradeValueFocus(true)}
                        onBlur={() => setTradeValueFocus(false)}
                        editable={true}
                        keyboardType="numeric"
                        value={
                          tradeValue <= 1
                            ? tradeValue.toString().length < 9
                              ? tradeValue.toString()
                              : roundDown(tradeValue, 6).toString()
                            : typeof (tradeValue) == "number"
                              ? roundDown(tradeValue, 2).toString()
                              : tradeValue
                        }
                        onChangeText={(value) => {
                          if (tradeValueFocus) {
                            if (rate != 0 || rateCount != 0) {
                              setRate(0)
                              setRateCount(0)
                            }
                            setTradeValue(value);
                            if (priceSelect === "limit") {
                              setVolume((parseFloat(value) / parseFloat(tradePrice)) ? (parseFloat(value) / parseFloat(tradePrice)) : 0);
                            }
                            else {
                              setVolume((parseFloat(value) / item.current_price) ? (parseFloat(value) / item.current_price) : 0);
                            }
                          }
                        }}
                      />
                    </View>
                    {rate <= 1
                      ? <Text style={[GlobalStyle.title, stylesheet.pocketRate]}>{(rate * 100).toFixed(2) + "%"}</Text>
                      : <Text style={[GlobalStyle.title, stylesheet.pocketRate, { color: "red" }]}>
                        {(rate * 100).toFixed(2) + "%"}
                      </Text>}
                    <View style={GlobalStyle.normalView}>
                      {Platform.OS == "android"
                        ? tradeType === "買進"
                          ? <Slider
                            style={{ width: "100%", height: 40 }}
                            value={rateCount}
                            minimumValue={0}
                            maximumValue={1}
                            step={0.01}
                            minimumTrackTintColor={rate <= 1 ? "#00afaa" : "red"}
                            maximumTrackTintColor="white"
                            onValueChange={(value) => {
                              if (!tradeValueFocus && !volumeFocus) {
                                setTradeValue(twdValue * value);
                                setVolume(tradeValue / item.current_price);
                                setRate(value);
                              }
                              if (value == 0) {
                                setVolume(0)
                                setRate(0)
                                setRateCount(0)
                                setTradeValue(0)
                              }
                            }}
                          />
                          : <Slider
                            style={{ width: "100%", height: 40 }}
                            value={rateCount}
                            minimumValue={0}
                            maximumValue={1}
                            step={0.01}
                            minimumTrackTintColor={rate <= 1 ? "#00afaa" : "red"}
                            maximumTrackTintColor="white"
                            onValueChange={(value) => {
                              if (!tradeValueFocus && !volumeFocus) {
                                setVolume(props.data.pocket[item.id] * value);
                                setTradeValue(priceSelect === "limit" ? tradePrice * volume : item.current_price * volume);
                                setRate(value);
                              }
                              if (value == 0) {
                                setVolume(0)
                                setRate(0)
                                setRateCount(0)
                                setTradeValue(0)
                              }
                            }}
                          />
                        : tradeType === "買進"
                          ? <Slider
                            style={{ width: "100%", height: 40 }}
                            onFocus={() => setSliderFocus(true)}
                            onBlur={() => setSliderFocus(false)}
                            value={rateCount}
                            minimumValue={0}
                            maximumValue={1}
                            step={0.01}
                            minimumTrackTintColor={rate <= 1 ? "#00afaa" : "red"}
                            maximumTrackTintColor="rgba(59, 59, 59, 1)"
                            onValueChange={(value) => {
                              if (!tradeValueFocus && !volumeFocus) {
                                setTradeValue(twdValue * value);
                                setVolume(tradeValue / item.current_price);
                                setRate(value);
                              }
                              if (value == 0) {
                                setVolume(0)
                                setRate(0)
                                setRateCount(0)
                                setTradeValue(0)
                              }
                            }}
                          />
                          : <Slider
                            style={{ width: "100%", height: 40 }}
                            value={rateCount}
                            minimumValue={0}
                            maximumValue={1}
                            step={0.01}
                            minimumTrackTintColor={rate <= 1 ? "#00afaa" : "red"}
                            maximumTrackTintColor="rgba(59, 59, 59, 1)"
                            onValueChange={(value) => {
                              if (!tradeValueFocus && !volumeFocus) {
                                setVolume(props.data.pocket[item.id] * value);
                                setTradeValue(priceSelect === "limit" ? tradePrice * volume : item.current_price * volume);
                                setRate(value);
                              }
                              if (value == 0) {
                                setVolume(0)
                                setRate(0)
                                setRateCount(0)
                                setTradeValue(0)
                              }
                            }}
                          />
                      }
                    </View>
                    <View style={GlobalStyle.normalView}>
                      {tradeType === "買進"
                        ? <Text style={GlobalStyle.TextL}>現有：{roundDown(twdValue, 2)}　TWD</Text>
                        : <Text style={GlobalStyle.TextL}>現有：{props.data.pocket[item.id] ? roundDown(props.data.pocket[item.id], 6) : 0} {item.symbol.toUpperCase()}</Text>
                      }
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[stylesheet.tradeButton, { height: 60, alignSelf: "center", margin: 40 }]}
                    // onPress={() => setModalVisible(!modalVisible)}
                    onPress={() => handleTransButtonPress(priceSelect)}
                  >
                    <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>{tradeType}{item.symbol.toUpperCase()}</Text>
                  </TouchableOpacity>
                </KeyboardAwareScrollView>
              </View>
            </View>
          </Modal>

          <View style={GlobalStyle.headerBar}>
            <TouchableOpacity style={GlobalStyle.backButton} onPress={() => props.navigation.pop()}>
              <Icon name="chevron-left" color={"#8afff4"} size={50} />
            </TouchableOpacity>
            <Text style={[GlobalStyle.title, { alignSelf: "center", left: 0 }]}>
              {item.symbol ? item.symbol.toUpperCase() : item.symbol}
            </Text>
            <TouchableOpacity style={{ width: 80, height: 50, alignSelf: "flex-end" }} onPress={() => {
              setNoteVisible(!noteVisible);
            }}>
              <Text style={stylesheet.note}>
                筆記
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={GlobalStyle.normalView}>
              <Image style={[stylesheet.cryptoIcon, { marginRight: 10 }]} source={{ uri: item.image }} />
              <View>
                <Text style={GlobalStyle.TextXL}>{item.symbol ? item.symbol.toUpperCase() : item.symbol} / TWD</Text>
                <Text style={GlobalStyle.TextXL}>
                  NT${item.current_price > 1 ? item.current_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    : item.current_price < 0.01
                      ? item.current_price < 0.000001
                        ? roundDown(item.current_price, 9)
                        : roundDown(item.current_price, 6)
                      : item.current_price}
                </Text>
              </View>

              {Favorite ? <TouchableOpacity style={stylesheet.favoriteButtonActived} onPress={() => { handleFavoritePress(false) }}>
                <Text style={{ color: "white" }}>取消{"\n"}最愛</Text>
              </TouchableOpacity>
                : <TouchableOpacity style={stylesheet.favoriteButton} onPress={() => { handleFavoritePress(true) }}>
                  <Text style={{ color: "#00afaa" }}>加入{"\n"}最愛</Text>
                </TouchableOpacity>}

            </View>
            <View style={[GlobalStyle.normalView, { flexDirection: "column" }]}>
              <View style={{ height: 30, width: "100%", flexDirection: "row" }}>
                <View style={stylesheet._24hPrice}>
                  <Text style={[GlobalStyle.TextM, { textAlign: "left", color: "rgba(107, 255, 148, 1)" }]}>24h/最高  </Text>
                  <Text style={[GlobalStyle.TextL, { textAlign: "left", color: "rgba(107, 255, 148, 1)" }]}>
                    {item.high_24h > 1 ? item.high_24h.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : item.high_24h < 0.01
                        ? roundDown(item.high_24h, 6)
                        : item.high_24h}
                  </Text>
                </View>
                <View style={stylesheet._24hPrice}>
                  <Text style={[GlobalStyle.TextM, { textAlign: "left", color: "rgba(255, 92, 92, 1)" }]}>24h/最低  </Text>
                  <Text style={[GlobalStyle.TextL, { textAlign: "left", color: "rgba(255, 92, 92, 1)" }]}>
                    {item.low_24h > 1 ? item.low_24h.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : item.low_24h < 0.01
                        ? roundDown(item.low_24h, 6)
                        : item.low_24h}
                  </Text>
                </View>
              </View>
              <View style={stylesheet._24hVolume}>
                <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>24h/成交額  </Text>
                <Text style={GlobalStyle.TextL}>
                  {item.total_volume > 1 ? item.total_volume.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    : item.low_24h < 0.01
                      ? roundDown(item.low_24h, 6)
                      : item.low_24h}
                </Text>
                <Text style={GlobalStyle.TextM}> (TWD)</Text>
              </View>
              <View style={stylesheet._24hVolume}>
                <Text
                  style={item.price_change_percentage_24h >= 0
                    ? [GlobalStyle.TextM, { textAlign: "left", color: "rgba(107, 255, 148, 1)" }]
                    : [GlobalStyle.TextM, { textAlign: "left", color: "rgba(255, 92, 92, 1)" }]
                  }>24h/漲跌幅  </Text>
                <Text
                  style={item.price_change_percentage_24h >= 0
                    ? [GlobalStyle.TextL, { color: "rgba(107, 255, 148, 1)" }]
                    : [GlobalStyle.TextL, { color: "rgba(255, 92, 92, 1)" }]
                  }>
                  {roundDown(item.price_change_percentage_24h, 2)}%
                </Text>
              </View>
            </View>
            <View style={[GlobalStyle.subTitleView, { marginLeft: 20 }]}>
              <View style={stylesheet.blockImg}></View>
              <Text style={GlobalStyle.subTitle}>
                價格走勢圖
              </Text>
            </View>
            <View style={[GlobalStyle.normalView, { height: 200 }]}>
              <YAxis
                style={{ width: 50, marginRight: 5 }}
                data={
                  (item.sparkline_in_7d.price).map(function (value, index) {
                    if (index != 168) {
                      return USDPrice[parseInt(index / 24)] ? value *= USDPrice[parseInt(index / 24)] : value *= 1
                    }
                    else return USDPrice[6] ? value *= USDPrice[6] : value *= 1
                    // return value *= USDPrice
                  })}
                svg={{
                  fill: 'grey',
                  fontSize: 10,
                }}
                numberOfTicks={15}
                formatLabel={(value) =>
                  Math.max.apply(item.sparkline_in_7d.price) - Math.min.apply(item.sparkline_in_7d.price) > 1
                    ? Math.floor(value)
                    : value
                }
              />
              <LineChart
                style={stylesheet.volumeChart}
                data={
                  (item.sparkline_in_7d.price).map(function (value, index) {
                    if (index != 168) {
                      return USDPrice[parseInt(index / 24)] ? value *= USDPrice[parseInt(index / 24)] : value *= 1
                    }
                    else return USDPrice[6] ? value *= USDPrice[6] : value *= 1
                    // return value *= USDPrice
                  })}
                svg={{ stroke: item.price_change_percentage_24h > 0 ? "rgba(107, 255, 148, 1)" : "rgba(255, 92, 92, 1)" }}
                contentInset={{ top: 20, bottom: 20 }}
              >
                <Grid />
              </LineChart>

            </View>
            <View style={[GlobalStyle.normalView, { width: "75%", marginLeft: 70 }]}>
              {datesCollection.reverse().map((dateValue, i) => {
                return (
                  <Text key={i} style={[GlobalStyle.TextS, { flex: 1 }]}>{dateValue}</Text>
                )
              })}
            </View>
            <View style={[GlobalStyle.subTitleView, { marginLeft: 20 }]}>
              <View style={stylesheet.blockImg}></View>
              <Text style={GlobalStyle.subTitle}>
                訂單現況
              </Text>
            </View>
            <View style={[GlobalStyle.normalView]}>
              <View style={{ flex: 1, height: 220 }}>
                <View style={stylesheet.orderBookTitle}>
                  <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>委買</Text>
                </View>
                <View style={stylesheet.orderBookSubTitle}>
                  <Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>量</Text>
                  <Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>價</Text>
                </View>
                {buyingOrderBook.map((item) => (
                  <View style={stylesheet.orderBookContent}>
                    <Text style={[GlobalStyle.TextM, { textAlign: "center", color: "rgba(107, 255, 148, 1)" }]}>
                      {item.quantity > 100000
                        ? roundDown(item.quantity, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        : item.quantity > 1 ? roundDown(item.quantity, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : roundDown(item.quantity, 6)}
                    </Text>
                    <Text style={[GlobalStyle.TextM, { textAlign: "center", color: "rgba(107, 255, 148, 1)" }]}>
                      {item.deal_price > 100000
                        ? roundDown(item.deal_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        : item.deal_price > 1 ? roundDown(item.deal_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : item.deal_price > 0.01
                            ? roundDown(item.deal_price, 2)
                            : roundDown(item.deal_price, 6)}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1, height: 220 }}>
                <View>
                  <View style={stylesheet.orderBookTitle}>
                    <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>委賣</Text>
                  </View>
                  <View style={stylesheet.orderBookSubTitle}>
                    <Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>價</Text>
                    <Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>量</Text>
                  </View>
                </View>
                {sellingOrderBook.map((item) => (
                  <View style={stylesheet.orderBookContent}>
                    <Text style={[GlobalStyle.TextM, { textAlign: "center", color: "rgba(255, 92, 92, 1)" }]}>
                      {item.order_price
                        ? item.order_price > 100000
                          ? roundDown(item.order_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : item.order_price > 1 ? roundDown(item.order_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : item.order_price > 0.01
                              ? roundDown(item.order_price, 2)
                              : roundDown(item.order_price, 6)
                        : item.deal_price > 100000
                          ? roundDown(item.deal_price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : item.deal_price > 1 ? roundDown(item.deal_price, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : item.deal_price > 0.01
                              ? roundDown(item.deal_price, 2)
                              : roundDown(item.deal_price, 6)}
                    </Text>
                    <Text style={[GlobalStyle.TextM, { textAlign: "center", color: "rgba(255, 92, 92, 1)" }]}>
                      {item.quantity > 100000
                        ? roundDown(item.quantity, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        : item.quantity > 1 ? roundDown(item.quantity, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : roundDown(item.quantity, 6)}
                    </Text>
                  </View>
                ))}
              </View>

            </View>

            <View style={{ height: 80 }}></View>



          </ ScrollView >
          <View style={stylesheet.bottomTab}>
            <TouchableOpacity
              style={stylesheet.tradeButton}
              onPress={() => {
                setModalVisible(!modalVisible);
                setTradeType("買進");
                setPriceSelect("market");
              }}>
              <Text style={GlobalStyle.TextXL}>買進</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={stylesheet.tradeButton}
              onPress={() => {
                setModalVisible(!modalVisible);
                setTradeType("賣出");
                setPriceSelect("market");
              }}>
              <Text style={GlobalStyle.TextXL}>賣出</Text>
            </TouchableOpacity>

          </View >
        </View>
      )
      } />
  )
}

const stylesheet = StyleSheet.create({
  loading: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000AA",
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cryptoIcon: {
    position: "relative",
    width: 60,
    height: 60,
    backgroundColor: "rgba(21, 21, 21, 1)",
  },
  favoriteButton: {
    position: "absolute",
    height: 60,
    width: 60,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#00afaa",
    borderWidth: 1,
    borderRadius: 10,
  },
  favoriteButtonActived: {
    position: "absolute",
    height: 60,
    width: 60,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#00afaa",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "#00afaa",
  },
  blockImg: {
    position: "relative",
    width: 6,
    height: 25,
    left: "auto",
    right: "auto",
    top: 0,
    bottom: "auto",
    marginRight: 15,
    backgroundColor: "#8afff4",
  },
  _24hPrice: {
    width: "50%",
    alignItems: "flex-end",
    flexDirection: "row",
  },
  _24hVolume: {
    height: 50,
    width: "100%",
    alignItems: "flex-end",
    flexDirection: "row"
  },
  volumeChart: {
    flex: 1
  },
  bottomTab: {
    position: "absolute",
    bottom: 0,
    height: 90,
    width: "100%",
    backgroundColor: "rgba(28, 28, 28, 1)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tradeButton: {
    height: "60%",
    width: "35%",
    backgroundColor: "#00afaa",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 35,
  },
  tradeMenuTitle: {
    top: "auto",
    left: "auto",
    alignSelf: "center",
    textAlign: "center"
  },
  input: {
    height: 30,
    width: 180,
    paddingHorizontal: 15,
    color: "white",
    backgroundColor: "rgba(59, 59, 59, 1)"
  },
  pocketRate: {
    top: 0,
    left: 0,
    alignSelf: "center",
    marginTop: 10
  },
  noteInput: {
    height: 200,
    width: 250,
    paddingHorizontal: 15,
    color: "white",
    backgroundColor: "rgba(59, 59, 59, 1)",
    margin: 25,
    borderRadius: 15
  },
  note: {
    position: "relative",
    top: 16,
    right: 20,
    alignSelf: "flex-end",
    textDecorationLine: "none",
    fontSize: 24,
    color: "#00afaa",
    textAlign: "center",
    letterSpacing: 0.7199997901916504,
  },
  orderBookTitle: {
    width: "100%",
    height: 40,
    borderColor: "rgba(117, 117, 117, 1)",
    borderBottomWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  orderBookSubTitle: {
    width: "100%",
    height: 30,
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "row"
  },
  orderBookContent: {
    width: "100%",
    height: 30,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 5
  }
})

// borderWidth: 1, borderColor: "white"