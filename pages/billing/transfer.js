import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from "react-native";
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GlobalStyle from '../../assets/styles';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from "../../assets/database";
import { roundDown } from '../../assets/function';
import Toast from 'react-native-toast-message';

export default function TransferScreen(props) {
  const window = useWindowDimensions();
  const [transferType, setTransferType] = useState("iToCt");
  const inventoryTWD = props.data.pocket.twd;
  const copyTradeTWD = props.data.pocket_C.twd;
  const [transferValue, setTransferValue] = useState();
  const [balanceError, setBalanceError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const isFocused = useIsFocused();

  const handleValueChange = (value) => {
    setTransferValue(value)
    if (transferType === "iToCt") {
      if (value > inventoryTWD) {
        setBalanceError(true)
        return
      }
    } else if (transferType === "ctToI") {
      if (value > copyTradeTWD) {
        setBalanceError(true)
        return
      }
    }
    setBalanceError(false)
  }

  async function handleTransferConfirm() {
    setProcessing(true)
    try {
      fetch('https://api.mobicrypto.tw/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id_token: props.userInfo.accessToken,
          source: transferType,
          amount: Number(transferValue)
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
          showToast("success", "劃轉成功！")
          setProcessing(false)
        } else {
          showToast("error", "錯誤", "伺服器錯誤，請再試一次！")
          setProcessing(false)
        }
      });

    } catch (e) {
      console.log(e)
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

  }, [isFocused, props.data]);

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
    >
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
          <TouchableOpacity style={GlobalStyle.backButton} onPress={() => props.navigation.pop()}>
            <Icon name="chevron-left" color={"#8afff4"} size={50} />
          </TouchableOpacity>
          <Text style={GlobalStyle.title}>
            劃轉
          </Text>
        </View>
        <View style={{ width: window.width, backgroundColor: "rgba(21, 21, 21, 1)" }} showsVerticalScrollIndicator={false}>
          <View style={GlobalStyle.frame}>
            <View style={[GlobalStyle.normalView, { height: 200 }]}>
              <View style={[GlobalStyle.normalBox, { height: "100%", flex: 8, justifyContent: "space-evenly" }]}>
                <View style={{ flexDirection: "row", width: "100%" }}>
                  <View style={stylesheet.accountView1}>
                    <Text style={GlobalStyle.TextL}>從</Text>
                  </View>
                  <View style={stylesheet.accountView2}>
                    <Text style={GlobalStyle.TextL}>
                      {transferType === "iToCt" ? "庫存帳戶" : "跟單帳戶"}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", width: "100%" }}>
                  <View style={stylesheet.accountView1}>
                    <Text style={GlobalStyle.TextL}>到</Text>
                  </View>
                  <View style={stylesheet.accountView2}>
                    <Text style={GlobalStyle.TextL}>
                      {transferType === "ctToI" ? "庫存帳戶" : "跟單帳戶"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ flex: 3, justifyContent: "center", alignItems: "center" }}>
                <TouchableOpacity
                  style={stylesheet.changeButton}
                  onPress={() => transferType === "iToCt" ? setTransferType("ctToI") : setTransferType("iToCt")}>
                  <Icon name="swap-vertical" color={"#00afaa"} size={50} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={GlobalStyle.normalView}>
            <TextInput
              style={stylesheet.valueInput1}
              editable={true}
              keyboardType="numeric"
              value={transferValue}
              onChangeText={(value) => { handleValueChange(value) }} />
            <View style={stylesheet.valueInput2}>
              <Text style={GlobalStyle.TextL}>
                NTD(MOBI)
              </Text>
            </View>
          </View>

          <View style={GlobalStyle.normalView}>
            <Text style={GlobalStyle.TextL}>
              可轉數量：{"\n"}
              {transferType === "iToCt"
                ? roundDown(inventoryTWD, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                : roundDown(copyTradeTWD, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}　NTD(MOBI)
            </Text>
          </View>

          {balanceError ?
            <View style={GlobalStyle.normalView}>
              <Text style={stylesheet.ErrorText}>
                餘額不足，請重新輸入
              </Text>
            </View>
            :
            <View style={GlobalStyle.normalView}></View>}
        </View>
        <View style={stylesheet.bottomTab}>
          {transferValue > 0 && balanceError === false ?
            <TouchableOpacity
              onPress={() => handleTransferConfirm()}
              style={stylesheet.tradeButton}>
              <Text style={GlobalStyle.TextXL}>
                確定劃轉
              </Text>
            </TouchableOpacity>
            :
            <TouchableOpacity
              disabled={true}
              style={stylesheet.tradeButtonDisabled}>
              <Text style={stylesheet.TextXLDisabled} >
                確定劃轉
              </Text>
            </TouchableOpacity>
          }

        </View>
      </View>
    </TouchableWithoutFeedback>
  );
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
  accountView1: {
    width: "20%",
    height: 50,
    backgroundColor: "rgba(59, 59, 59, 1)",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    flexDirection: "row",
    paddingHorizontal: 15,
    alignItems: "center",
  },
  accountView2: {
    width: "80%",
    height: 50,
    backgroundColor: "rgba(59, 59, 59, 1)",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  changeButton: {
    height: 50,
    width: 50,
    justifyContent: "center",
    alignItems: "center"
  },
  valueInput1: {
    width: "60%",
    height: 50,
    backgroundColor: "rgba(59, 59, 59, 1)",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    flexDirection: "row",
    paddingHorizontal: 15,
    alignItems: "center",
    color: "white"
  },
  valueInput2: {
    width: "40%",
    height: 50,
    backgroundColor: "rgba(59, 59, 59, 1)",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
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
  tradeButtonDisabled: {
    height: "60%",
    width: "35%",
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
  ErrorText: {
    position: "relative",
    paddingBottom: 5,
    fontWeight: "400",
    textDecorationLine: "none",
    fontSize: 15,
    color: "red",
    textAlign: "left",
    textAlignVertical: "bottom",
    letterSpacing: 0.2,
  },
});

