import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SwitchSelector from "react-native-switch-selector";
import GlobalStyle from '../../assets/styles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { addDoc, collection, doc, getDocs, query, setDoc, updateDoc, where, increment, orderBy } from 'firebase/firestore';
import { useIsFocused } from '@react-navigation/native';
import { db } from "../../assets/database";
import { roundDown, timeConvertDate, timeConvertTime } from '../../assets/function';
import { async } from '@firebase/util';
import { coinSymbolColor, coinIdSymbolList } from '../../assets/coinData';
import Toast from 'react-native-toast-message';

export default function CopyTrade(props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [subInfoVisible, setSubInfoVisible] = useState(false);
  const [inProgressStyle, setInProgressStyle] = useState("flex")
  const [historyStyle, setHistoryStyle] = useState("none")
  const [Follow, setFollow] = useState(props.data.following.includes(props.route.params.traderData.uid) ? true : false);
  const [method, setMethod] = useState("")
  const [copyTrade, setCopyTrade] = useState(props.data.copyTrader == props.route.params.traderData.uid ? true : false);
  const [copyTradeValue, setCopyTradeValue] = useState(0);
  const [traderInventory, setTraderInventory] = useState([]);
  const [traderHistory, setTraderHistory] = useState([]);
  const [profitLossCount, setProfitLossCount] = useState([0, 0]);
  const traderData = props.route.params.traderData
  const isFocused = useIsFocused();
  const [processing, setProcessing] = useState(false);
  const [warningCheck, setWarningCheck] = useState([]);
  const [warningVisible, setWarningVisible] = useState(false)
  const [modeSelect, setModeSelect] = useState();


  const getTraderHistory = async () => {
    var temp = [0, 0]
    var temp2 = []
    const TraderHistoryCol = query(collection(db, "transaction"), where("uid", "==", traderData.uid), where("status", "==", "已成交"), where("direction", "==", "賣出"), orderBy("deal_time", "desc"));
    const TraderHistorySnapshot = await getDocs(TraderHistoryCol);
    TraderHistorySnapshot.docs.map((doc) => {
      doc.data().profit > 0 ? temp[0] += 1 : temp[1] += 1
      if (warningCheck.length < 5) {
        doc.data().profit >= 0 ? warningCheck.push("O") : warningCheck.push("X")
      }
    })
    setProfitLossCount(temp)
    setTraderHistory(TraderHistorySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const coinValueFunction = async (coins) => {
    var coinList = ""
    var coinListArr = []
    var data = []
    for (const [key, value] of Object.entries(coins)) {
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
        data.push(
          {
            symbol: coinSymbolColor[key] ? coinSymbolColor[key].symbol : coinIdSymbolList[key] ? coinIdSymbolList[key].symbol.toUpperCase() : key,
            price: dataGet[key]["twd"],
            averagePrice: traderData.averagePrice[key],
            volume: value,
            onTradeValue: value * traderData.averagePrice[key],
            onTimeValue: dataGet[key]["twd"] * value
          }
        )
      }
    }

    setTraderInventory(data)

  }

  async function handleFollowPress(type, followId) {
    setFollow(!Follow)
    let newFollowing = [...props.data.following]
    let newFollowers = [...props.route.params.traderData.followers]
    const profileRef = doc(db, "account", props.data.uid);
    const traderRef = doc(db, "account", followId);
    if (type === true) {
      newFollowing.push(followId)
      await updateDoc(profileRef, {
        following: newFollowing
      });
      newFollowers.push({ uid: props.data.uid, copyTrade: false })
      await updateDoc(traderRef, {
        followers: newFollowers
      });
    } else if (type === false) {
      const index = newFollowing.indexOf(followId);
      if (index > -1) {
        newFollowing.splice(index, 1);
      }
      await updateDoc(profileRef, {
        following: newFollowing
      });
      const index_C = newFollowers.indexOf({ uid: props.data.uid, copyTrade: copyTrade });
      if (index_C > -1) {
        newFollowers.splice(index, 1);
      }
      await updateDoc(traderRef, {
        followers: newFollowers
      });
    }
  }

  async function handleCopyTradePress(method) {
    setProcessing(true)
    if (props.data.admitCopy === true) {
      alert("您已開啟接受跟單模式，無法再跟單！")
      setProcessing(false)
      return
    }
    if (props.data.pocket_C.twd <= 0) {
      alert("跟單帳戶餘額不足，請先劃轉！")
      setProcessing(false)
      return
    }
    if (copyTradeValue % 1 != 0) {
      alert("輸入數值必須為整數！")
      setProcessing(false)
      return
    }
    if (copyTradeValue == 0) {
      alert("輸入數值不得為0！")
      setProcessing(false)
      return

    }
    try {
      const profileRef = doc(db, "account", props.data.uid);
      traderData.followers.forEach((value, index) => {
        if (value.uid === props.data.uid) {
          let newFollowers = [...traderData.followers]
          newFollowers[index].copyTrade = true
          newFollowers[index].copyTradeValue = copyTradeValue
          newFollowers[index].mode = modeSelect
          const traderRef = doc(db, "account", traderData.uid);
          updateDoc(traderRef, {
            followers: newFollowers,
          });
        }
      });
      await updateDoc(profileRef, {
        copyTrader: {
          uid: traderData.uid,
          copyTradeValue: copyTradeValue,
          mode: modeSelect
        }
      });
      setProcessing(false)
      showToast("success", method === "copy" ? "跟單成功！" : "修改成功！")
    } catch (e) {
      showToast("error", "錯誤", "系統錯誤！")
      console.log(e)
      setProcessing(false)
    }
  }

  async function cancel_copy_trade() {
    Alert.alert(
      "注意事項",
      "您即將解除跟單\n請詳閱以下注意事項：\n" +
      "1. 您將不繼續對此使用者進行跟單\n" +
      "2. 您的跟單倉幣現貨將全數轉入庫存倉\n" +
      "3. 跟單帳戶內之新台幣將保留\n" +
      "\n" +
      "確定要解除跟單嗎？",
      [
        { text: "取消", style: "cancel" },
        {
          text: "確定", onPress: async () => {
            try {
              fetch('https://api.mobicrypto.tw/cancel_copy_trade', {
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
                  setProcessing(false)
                  throw Error(response.statusText);
                }
                return response.json();
              }).then(json => {
                if (json.status === "success") {
                  showToast("success", "成功解除跟單！")
                  setProcessing(false)
                } else {
                  showToast("error", "錯誤", "伺服器錯誤，請再試一次！")
                  setProcessing(false)
                }
              });

            } catch (e) {
              console.log(e)
            }
            setProcessing(false)
            return
          }
        }])
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
    coinValueFunction(traderData.pocket);
    getTraderHistory()

  }, [isFocused]);

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
      {console.log(warningCheck)}
      <Modal
        animationType="fade"
        transparent={true}
        visible={infoVisible}
        onRequestClose={() => {
          setInfoVisible(!infoVisible);
        }}
        statusBarTranslucent={true}
      >
        <View style={{ backgroundColor: "#000000AA", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <View style={{ width: "80%", height: "auto", backgroundColor: "rgba(21, 21, 21, 1)", borderRadius: 30, alignItems: "center", padding: 15 }}>
            <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-evenly" }}>
              <Text style={[GlobalStyle.title, stylesheet.infoTitle]}>投資跟單</Text>
              <Image style={stylesheet.logoImg} source={require('../../assets/LOGO.png')} />
              <Text style={[GlobalStyle.title, stylesheet.infoTitle]}>規則說明</Text>
            </View>
            <Text style={[GlobalStyle.TextL, { marginVertical: 25 }]}>
              您的跟單倉將根據所選用戶的投資組合進行跟單交易，藉由跟進績效卓越的投資用戶讓您的勝率最大化！
            </Text>

            <Text style={[GlobalStyle.TextM, { textAlign: "left", color: "red", marginBottom: 15, alignSelf: "flex-start" }]}>
              *報酬率僅供參考
            </Text>
            <Text style={[GlobalStyle.TextM, { textAlign: "left", color: "red", marginBottom: 15, alignSelf: "flex-start" }]}>
              *請注意跟單倉內現金是否足夠
            </Text>
            <Text style={[GlobalStyle.TextM, { textAlign: "left", color: "red", marginBottom: 15, alignSelf: "flex-start" }]}>
              *有開放跟單帳戶者無法進行跟單動作
            </Text>
            <TouchableOpacity
              style={[stylesheet.tradeButton, { height: 50, alignSelf: "center", }]}
              onPress={() => setInfoVisible(!infoVisible)
              }>
              <Text style={GlobalStyle.TextL}>
                確認
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={warningVisible}
        onRequestClose={() => {
          setWarningVisible(!warningVisible);
        }}
        statusBarTranslucent={true}
      >
        <View style={{ backgroundColor: "#000000AA", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <View style={{ width: "80%", height: "auto", backgroundColor: "rgba(21, 21, 21, 1)", borderRadius: 30, alignItems: "center", padding: 15 }}>
            <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-evenly" }}>
              <Text style={[GlobalStyle.title, stylesheet.infoTitle, { color: "#ffd306" }]}>交易員績效警示</Text>
            </View>
            <Text style={[GlobalStyle.TextL, { marginVertical: 25 }]}>
              此交易員最近五次賣出交易皆為虧損，模幣提醒您謹慎挑選跟單對象。
            </Text>

            <TouchableOpacity
              style={[stylesheet.tradeButton, { height: 50, alignSelf: "center", }]}
              onPress={() => setWarningVisible(!warningVisible)
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
          setModeSelect(value)
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
        <Modal
          animationType="fade"
          transparent={true}
          visible={subInfoVisible}
          onRequestClose={() => {
            setSubInfoVisible(!subInfoVisible);
          }}
          statusBarTranslucent={true}
        >
          <View style={{ backgroundColor: "#000000AA", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <View style={stylesheet.infoModal}>
              <Text style={[GlobalStyle.TextL, { marginVertical: 25 }]}>
                {modeSelect === "rate"
                  ? "固定比例：根據設定的比例來交易，假設交易員交易 100 枚標的，比例設定 1%則交易1枚，若1000% 則交易1000枚。"
                  : "固定上限：根據設定的金額上限來交易，假設交易員進行買入之金額超過上限則以上限金額進行交易。"}
              </Text>
              <Text style={[GlobalStyle.TextL, { marginBottom: 25 }]}>
                若餘額不足，則不進行跟單買入。
              </Text>

              <TouchableOpacity
                style={[stylesheet.tradeButton, { height: 50, alignSelf: "center", }]}
                onPress={() => setSubInfoVisible(!subInfoVisible)}>
                <Text style={GlobalStyle.TextL}>
                  確認
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <View style={{ backgroundColor: "#000000AA", justifyContent: "flex-end" }}>

          <TouchableWithoutFeedback
            onPress={() => {
              setModalVisible(!modalVisible);

            }}>
            <View style={{ height: "60%", width: "100%" }}></View>
          </TouchableWithoutFeedback>

          <View style={{ height: "60%", backgroundColor: "rgba(21, 21, 21, 1)", }}>
            <KeyboardAwareScrollView bounces={false}>
              <View style={{ width: "100%", flexDirection: "row" }}>
                <View style={{ flex: 1, height: 60 }}>
                  <View style={{ height: "50%", borderBottomWidth: 1, borderColor: "#00afaa" }} />
                </View>
                <View style={{ width: 90, height: 60, justifyContent: "center" }}>
                  <Text style={[GlobalStyle.title, stylesheet.tradeMenuTitle]}>跟單</Text>
                </View>
                <View style={{ flex: 1, height: 60 }}>
                  <View style={{ height: "50%", borderBottomWidth: 1, borderColor: "#00afaa" }} />
                </View>
              </View>
              <View style={GlobalStyle.normalView}>
                {props.data.copyTrader.uid == traderData.uid
                  ? <></>
                  : <SwitchSelector
                    initial={0}
                    onPress={value => {
                      setModeSelect(value)
                    }}
                    fontSize={20}
                    textColor="white"
                    selectedColor="white"
                    buttonColor="#00afaa"
                    borderColor="rgba(69, 69, 69, 1)"
                    backgroundColor="rgba(69, 69, 69, 1)"
                    borderRadius={5}
                    options={[
                      { label: "固定比例", value: "rate" },
                      { label: "固定上限", value: "limit" },
                    ]}
                  />}
              </View>
              <Text style={[GlobalStyle.TextM, { textAlign: "left", color: "red", marginLeft: 25 }]}>
                *盈餘將撥10%給被跟單者
              </Text>
              {modeSelect === "limit" ?
                <Text style={[GlobalStyle.TextM, { textAlign: "left", color: "red", marginLeft: 25 }]}>
                  *最低上限為1000NTD(MOBI)
                </Text> : <></>}
              {modeSelect === "rate"
                ? <View style={GlobalStyle.normalView}>
                  <Text style={[GlobalStyle.TextL, { marginRight: 10 }]}>比例設定(%)</Text>
                  <TouchableOpacity
                    style={stylesheet.adjustButton}
                    onPress={() => parseInt(copyTradeValue) >= 1
                      ? parseInt(copyTradeValue) - 1 < 0.001
                        ? setCopyTradeValue(0)
                        : setCopyTradeValue(parseInt(copyTradeValue) - 1)
                      : setCopyTradeValue(0)}>
                    <Text style={GlobalStyle.TextXL}>－</Text>
                  </TouchableOpacity>
                  <TextInput
                    // disable={modeSelect != "rate" ? true : false}
                    maxLength={4}
                    editable={true}
                    keyboardType="numeric"
                    value={String(copyTradeValue)}
                    style={stylesheet.input}
                    onChangeText={(value) => { setCopyTradeValue(parseFloat(value) ? parseFloat(value) : value) }} />
                  <TouchableOpacity
                    style={stylesheet.adjustButton}
                    onPress={() => parseFloat(copyTradeValue)
                      ? setCopyTradeValue(parseFloat(copyTradeValue) + 1)
                      : setCopyTradeValue(1)}>
                    <Text style={GlobalStyle.TextXL}>＋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ marginHorizontal: 10 }} onPress={() => setSubInfoVisible(!subInfoVisible)}>
                    <Icon style={{ alignSelf: "center" }} name="help-circle-outline" color={"#00afaa"} size={25} />
                  </TouchableOpacity>
                </View>
                : <View style={GlobalStyle.normalView}>
                  <Text style={[GlobalStyle.TextL, { marginRight: 10 }]}>金額上限設定</Text>
                  <TextInput
                    editable={true}
                    keyboardType="numeric"
                    value={String(copyTradeValue)}
                    style={[stylesheet.input, { width: 140 }]}
                    onChangeText={(value) => { setCopyTradeValue(parseFloat(value) ? parseFloat(value) : value) }} />
                  <TouchableOpacity style={{ marginHorizontal: 10 }} onPress={() => setSubInfoVisible(!subInfoVisible)}>
                    <Icon style={{ alignSelf: "center" }} name="help-circle-outline" color={"#00afaa"} size={25} />
                  </TouchableOpacity>
                </View>}
              <Text style={[GlobalStyle.TextM, { marginHorizontal: 25, marginTop: 20, textAlign: "left" }]}>
                被跟單者每日平均交易額：{traderData.averageDailyValue > 100000
                  ? roundDown(traderData.averageDailyValue, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  : traderData.averageDailyValue > 1 ? roundDown(traderData.averageDailyValue, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    : roundDown(traderData.averageDailyValue, 6)} NTD(MOBI)
              </Text>
              <Text style={[GlobalStyle.TextM, { margin: 25, textAlign: "left" }]}>
                跟單帳戶現有：{props.data.pocket_C.twd > 100000
                  ? roundDown(props.data.pocket_C.twd, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  : props.data.pocket_C.twd > 1 ? roundDown(props.data.pocket_C.twd, 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    : roundDown(props.data.pocket_C.twd, 6)} NTD(MOBI)
              </Text>

              <TouchableOpacity
                style={[stylesheet.tradeButton, { height: 60, alignSelf: "center", margin: 40 }]}
                onPress={() => {
                  handleCopyTradePress(method)
                  setModalVisible(!modalVisible)
                }}
              >
                <Text style={GlobalStyle.TextL}>
                  {method === "copy" ? "開始跟單" : "修改比例"}
                </Text>
              </TouchableOpacity>
            </KeyboardAwareScrollView>
          </View>

        </View >

      </Modal >
      <View style={GlobalStyle.headerBar}>
        <TouchableOpacity style={GlobalStyle.backButton} onPress={() => props.navigation.pop()}>
          <Icon name="chevron-left" color={"#8afff4"} size={50} />
        </TouchableOpacity>
        <Text style={GlobalStyle.title}>
          投資組合跟單
        </Text>
        {warningCheck.length == 5 && !warningCheck.includes("O")
          ? <TouchableOpacity style={[GlobalStyle.backButton, { alignSelf: "flex-end", right: 45, top: 40 }]} onPress={() => setWarningVisible(!infoVisible)}>
            <Icon style={{ alignSelf: "center" }} name="alert-outline" color={"#ffd306"} size={35} />
          </TouchableOpacity>
          : <></>}
        <TouchableOpacity style={[GlobalStyle.backButton, { alignSelf: "flex-end", right: 5, top: 40 }]} onPress={() => setInfoVisible(!infoVisible)}>
          <Icon style={{ alignSelf: "center" }} name="help-circle-outline" color={"#00afaa"} size={35} />
        </TouchableOpacity>
      </View>
      <ScrollView bounces={false} style={{ width: window.width, backgroundColor: "rgba(21, 21, 21, 1)" }} showsVerticalScrollIndicator={false}>
        <View style={[GlobalStyle.frame, { alignItems: "center" }]}>
          <View style={stylesheet.blockLarge}>
            <View style={{ width: "100%", paddingVertical: 25, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={GlobalStyle.TextXXL}>{traderData.nickname}</Text>
              {props.data.uid != traderData.uid
                ? Follow
                  ? <TouchableOpacity
                    style={stylesheet.followButtonActived}
                    onPress={() => {
                      props.data.copyTrader.uid == traderData.uid
                        ? alert("無法取消追蹤跟單中交易員！")
                        : handleFollowPress(false, traderData.uid)
                    }}>
                    <Text style={{ color: "white" }}>追蹤中</Text>
                  </TouchableOpacity>
                  : <TouchableOpacity
                    style={stylesheet.followButton}
                    onPress={() => {
                      handleFollowPress(true, traderData.uid)
                    }}>
                    <Text style={{ color: "#00afaa" }}>追蹤+</Text>
                  </TouchableOpacity>
                : <></>}
            </View>
            <View style={{ height: "60%", width: "100%", paddingBottom: 25, paddingTop: 0, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ height: "100%", flex: 1 }}>
                <Text style={[GlobalStyle.TextM, { margin: 5, textAlign: "center" }]}>追蹤人數</Text>
                <View style={stylesheet.traderDetailBlock}>
                  <Text style={[GlobalStyle.TextXXL]}>{traderData.followers.length}</Text>
                  <Text style={[GlobalStyle.TextL]}>人</Text>
                </View>
              </View>
              <View style={{ height: "100%", flex: 1 }}>
                <Text style={[GlobalStyle.TextM, { margin: 5, textAlign: "center" }]}>交易筆數</Text>
                <View style={stylesheet.traderDetailBlock}>
                  <Text style={[GlobalStyle.TextXL]}>{traderHistory.length}</Text>
                  <Text style={[GlobalStyle.TextL]}>筆</Text>
                </View>
              </View>
              <View style={{ height: "100%", flex: 1.2 }}>
                <Text style={[GlobalStyle.TextM, { margin: 5, textAlign: "center" }]}>上週投報率</Text>
                <View style={stylesheet.traderDetailBlock}>
                  <Text style={[GlobalStyle.TextXXL]}>{roundDown(traderData.billing.weeklyROI * 100, 0)}</Text>
                  <Text style={[GlobalStyle.TextL]}>%</Text>
                </View>
              </View>
              <View style={{ height: "100%", flex: 1.2 }}>
                <Text style={[GlobalStyle.TextM, { margin: 5, textAlign: "center" }]}>上月投報率</Text>
                <View style={stylesheet.traderDetailBlock}>
                  <Text style={[GlobalStyle.TextXXL]}>{roundDown(traderData.billing.lastMonthROI * 100, 0)}</Text>
                  <Text style={[GlobalStyle.TextL]}>%</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={stylesheet.blockSmallView}>
            <View style={stylesheet.blockSmall}>
              <Text style={[GlobalStyle.TextM, { margin: 10 }]}>盈利筆數</Text>
              <Text style={[GlobalStyle.TextXXL]}>{profitLossCount[0]}</Text>
            </View>
            <View style={stylesheet.blockSmall}>
              <Text style={[GlobalStyle.TextM, { margin: 10 }]}>虧損筆數</Text>
              <Text style={[GlobalStyle.TextXXL]}>{profitLossCount[1]}</Text>
            </View>
            <View style={stylesheet.blockSmall}>
              <Text style={[GlobalStyle.TextM, { margin: 10 }]}>總收益</Text>
              <Text style={traderData.billing.historyBenefit - traderData.billing.historyCost >= 0
                ? [GlobalStyle.TextM, GlobalStyle.billingText, { marginVertical: 10, color: "rgba(107, 255, 148, 1)" }]
                : [GlobalStyle.TextM, GlobalStyle.billingText, { marginVertical: 10, color: "rgba(255, 92, 92, 1)" }]
              }>
                {traderData.billing.historyBenefit - traderData.billing.historyCost >= 0 ? "+" : "-"}
                {Math.abs(traderData.billing.historyBenefit - traderData.billing.historyCost) > 1
                  ? Math.abs(traderData.billing.historyBenefit - traderData.billing.historyCost) > 100000
                    ? roundDown(Math.abs(traderData.billing.historyBenefit - traderData.billing.historyCost), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    : roundDown(Math.abs(traderData.billing.historyBenefit - traderData.billing.historyCost), 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  : Math.abs(traderData.billing.historyBenefit - traderData.billing.historyCost) < 0.1
                    ? roundDown(Math.abs(traderData.billing.historyBenefit - traderData.billing.historyCost), 6)
                    : Math.abs(traderData.billing.historyBenefit - traderData.billing.historyCost)}
              </Text>
            </View>
          </View>
        </View>
        <View style={GlobalStyle.normalView}>
          <SwitchSelector
            style={{ margin: 20 }}
            initial={0}
            onPress={value => {
              if (value === "inProgress") {
                setHistoryStyle("none")
                setInProgressStyle("flex")
              }
              else if (value === "history") {
                setHistoryStyle("flex")
                setInProgressStyle("none")
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
              { label: "當前操作", value: "inProgress" },
              { label: "歷史帶單", value: "history" },
            ]}
          />
        </View>

        <View style={[GlobalStyle.normalList, { display: inProgressStyle }]}>
          <View>
            <ScrollView horizontal={true} bounces={false}>
              <View style={{ width: 500 }}>
                <View style={[GlobalStyle.normalListView, { width: 440 }]}>
                  <View style={{ width: 70 }}>
                    <Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
                      幣名
                    </Text>
                  </View>
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
                  data={traderInventory}
                  showsVerticalScrollIndicator={false}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <View style={[GlobalStyle.normalListView, { width: 440 }]}>
                      <View style={{ width: 70 }}>
                        <Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
                          {item.symbol}
                        </Text>
                      </View>
                      <View style={{ width: 70 }}>
                        <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
                          {item.price > 1 ? roundDown(item.price, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : item.price > 0.01
                              ? item.price
                              : roundDown(item.price, 6)}
                        </Text>
                      </View>
                      <View style={{ width: 70 }}>
                        <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
                          {item.averagePrice > 1 ? roundDown(item.averagePrice, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : item.averagePrice > 0.01
                              ? item.averagePrice
                              : roundDown(item.averagePrice, 6)}
                        </Text>
                      </View>
                      <View style={{ width: 70 }}>
                        <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
                          {item.volume > 1 ? roundDown(item.volume, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : roundDown(item.volume, 6)}
                        </Text>
                      </View>
                      <View style={{ width: 70 }}>
                        <Text style={item.onTimeValue - item.onTradeValue >= 0
                          ? [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(107, 255, 148, 1)" }]
                          : [GlobalStyle.TextS, GlobalStyle.billingText, { color: "rgba(255, 92, 92, 1)" }]
                        }>
                          {item.onTimeValue - item.onTradeValue >= 0 ? "+" : "-"}
                          {Math.abs(item.onTimeValue - item.onTradeValue) > 1
                            ? roundDown(Math.abs(item.onTimeValue - item.onTradeValue), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : Math.abs(item.onTimeValue - item.onTradeValue) > 0.01
                              ? Math.abs(item.onTimeValue - item.onTradeValue)
                              : roundDown(Math.abs(item.onTimeValue - item.onTradeValue), 6)}
                        </Text>
                      </View>
                      <View style={{ width: 70 }}>
                        <Text style={[GlobalStyle.TextS, GlobalStyle.billingText]}>
                          {item.onTimeValue > 1 ? roundDown(item.onTimeValue, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : item.onTimeValue > 0.01
                              ? item.onTimeValue
                              : roundDown(item.onTimeValue, 6)}
                        </Text>
                      </View>
                    </View>
                  )} />

              </View>
            </ScrollView>
          </View>

        </View>

        <View style={[GlobalStyle.normalList, { display: historyStyle }]}>
          <View>
            <ScrollView horizontal={true} bounces={false}>
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
                      成交額
                    </Text>
                  </View>
                  <View style={{ width: 70 }}>
                    <Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
                      損益
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
                  data={traderHistory}
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
        <View style={{ height: 150 }} />
      </ScrollView>
      {props.data.uid != traderData.uid
        ? <View style={stylesheet.bottomTab}>
          {Follow == true && props.data.admitCopy == false
            ? props.data.copyTrader.uid == traderData.uid
              ? <View style={{ flexDirection: "row", flex: 1, height: "100%", alignItems: "center", justifyContent: "space-evenly" }}>
                <TouchableOpacity
                  style={stylesheet.tradeButton}
                  onPress={() => {
                    setMethod("edit");
                    setModeSelect(props.data.copyTrader.mode)
                    setCopyTradeValue(props.data.copyTrader.copyTradeValue);
                    setModalVisible(!modalVisible)
                  }}>
                  <Text style={GlobalStyle.TextXL}>
                    {props.data.copyTrader.mode == "rate" ? "修改跟單比例" : "修改跟單上限"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={stylesheet.tradeButton}
                  onPress={() => {
                    cancel_copy_trade()
                  }}>
                  <Text style={GlobalStyle.TextXL}>
                    解除跟單
                  </Text>
                </TouchableOpacity>
              </View>
              : props.data.copyTrader.uid == ""
                ? <TouchableOpacity
                  style={stylesheet.tradeButton}
                  onPress={() => {
                    setMethod("copy")
                    setModeSelect("rate")
                    setCopyTradeValue(0)
                    setModalVisible(!modalVisible)
                  }}>
                  <Text style={GlobalStyle.TextXL}>
                    跟單
                  </Text>
                </TouchableOpacity>
                : <TouchableOpacity
                  disabled={true}
                  style={stylesheet.tradeButtonDisabled}>
                  <Text style={stylesheet.TextXLDisabled} >
                    跟單
                  </Text>
                </TouchableOpacity>
            : <TouchableOpacity
              disabled={true}
              style={stylesheet.tradeButtonDisabled}>
              <Text style={stylesheet.TextXLDisabled} >
                跟單
              </Text>
            </TouchableOpacity>
          }
        </View>
        : <></>}
    </View >
  );
}
const stylesheet = StyleSheet.create({
  blockLarge: {
    width: Dimensions.get("window").width - 50,
    height: 160,
    marginVertical: 15,
    backgroundColor: "rgba(40, 40, 40, 1)",
    borderRadius: 15,
    alignItems: "center"
  },
  blockSmallView: {
    width: Dimensions.get("window").width - 50,
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  blockSmall: {
    width: "30%",
    height: "100%",
    borderRadius: 15,
    backgroundColor: "rgba(40, 40, 40, 1)",
    alignItems: "center"
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
    width: "40%",
    backgroundColor: "#00afaa",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 35,
  },
  traderDetailBlock: {
    height: "45%",
    flexDirection: "row",
    alignItems: "flex-end",
    alignSelf: "center",
    justifyContent: "center"
  },
  tradeMenuTitle: {
    top: 0,
    left: 0,
    alignSelf: "center",
    textAlign: "center"
  },
  followButton: {
    height: 30,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#00afaa",
    borderWidth: 1,
    borderRadius: 10,
  },
  followButtonActived: {
    height: 30,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#00afaa",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "#00afaa",
  },
  logoImg: {
    width: 48,
    height: 48,
    resizeMode: "stretch",
    alignSelf: "center"
  },
  infoTitle: {
    top: 0,
    left: 0,
    fontSize: 20,
    alignSelf: "center"
  },
  input: {
    height: 30,
    width: 80,
    paddingHorizontal: 15,
    color: "white",
    backgroundColor: "rgba(59, 59, 59, 1)",
    textAlign: "center"
  },
  adjustButton: {
    height: 30,
    width: 30,
    color: "white",
    backgroundColor: "rgba(59, 59, 59, 1)",
    justifyContent: "center",
    alignItems: "center"
  },
  infoModal: {
    width: "80%",
    height: "auto",
    backgroundColor: "rgba(21, 21, 21, 1)",
    borderRadius: 30,
    alignItems: "center",
    padding: 15
  },
  tradeButtonDisabled: {
    height: "60%",
    width: "45%",
    backgroundColor: "#444444",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 35,
  },
  TextXLDisabled: {
    position: "relative",
    fontWeight: "400",
    textDecorationLine: "none",
    fontSize: 20,
    color: "#000000",
    textAlign: "left",
    textAlignVertical: "top",
    letterSpacing: 2,
  },
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
})