import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GlobalStyle from '../../assets/styles';
import * as WebBrowser from 'expo-web-browser';

export default function ChargeScreen(props) {
  const _handlePaymentButton = async (amount) => {
    let result = await WebBrowser.openBrowserAsync("https://api.mobicrypto.tw/get_payment_html/?amount=" + amount + "&uid=" + props.userInfo.uid);

  };

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)" }}>
      <View style={GlobalStyle.headerBar}>
        <TouchableOpacity style={GlobalStyle.backButton} onPress={() => props.navigation.pop()}>
          <Icon name="chevron-left" color={"#8afff4"} size={50} />
        </TouchableOpacity>
        <Text style={GlobalStyle.title}>
          儲值
        </Text>
      </View>
      <View style={{ width: window.width, backgroundColor: "rgba(21, 21, 21, 1)" }} showsVerticalScrollIndicator={false}>
        <View style={GlobalStyle.frame}>

          <View style={[GlobalStyle.normalView, { flexDirection: "column" }]}>
            <TouchableOpacity style={stylesheet.chargeOptionView} onPress={() => _handlePaymentButton(30)}>
              <View style={[stylesheet.chargeOptionL, { flex: 2 }]}>
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>MOBI</Text>
                <Image style={{ width: 50, height: 60 }} resizeMode="contain" source={require('../../assets/NTD_1.png')} />
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>$20,000</Text>
              </View>
              <View style={[{ alignItems: "center", justifyContent: "center" }, { flex: 1 }]}>
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>NT$30.00</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={stylesheet.chargeOptionView} onPress={() => _handlePaymentButton(60)}>
              <View style={[stylesheet.chargeOptionL, { flex: 2 }]}>
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>MOBI</Text>
                <Image style={{ width: 60, height: 60 }} resizeMode="contain" source={require('../../assets/NTD_2.png')} />
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>$50,000</Text>
              </View>
              <View style={[{ alignItems: "center", justifyContent: "center" }, { flex: 1 }]}>
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>NT$60.00</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={stylesheet.chargeOptionView} onPress={() => _handlePaymentButton(90)}>
              <View style={[stylesheet.chargeOptionL, { flex: 2 }]}>
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>MOBI</Text>
                <Image style={{ width: 60, height: 60 }} resizeMode="contain" source={require('../../assets/NTD_3.png')} />
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>$100,000</Text>
              </View>
              <View style={[{ alignItems: "center", justifyContent: "center" }, { flex: 1 }]}>
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>NT$90.00</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={[GlobalStyle.normalView, stylesheet.sloganView]}>
            <Text style={[GlobalStyle.TextL, stylesheet.sloganText]}>
              沒有所謂失敗
            </Text>
            <Image style={{ height: 60, width: 60 }} resizeMode="contain" source={require('../../assets/LOGO.png')} />
            <Text style={[GlobalStyle.TextL, stylesheet.sloganText]}>
              除非不再嘗試
            </Text>
          </View>

        </View>
      </View>
    </View>
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
  chargeOptionView: {
    width: "100%",
    height: 160,
    marginBottom: 20,
    backgroundColor: "rgba(59, 59, 59, 1)",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  chargeOptionL: {
    height: "90%",
    alignItems: "center",
    justifyContent: "space-evenly",
    borderColor: "rgba(117, 117, 117, 1)",
    borderRightWidth: 1
  },
  sloganView: {
    height: 120,
    alignItems: "center",
    justifyContent: "space-between"
  },
  sloganText: {
    textAlign: "center",
    letterSpacing: 3,
    color: "rgba(117, 117, 117, 1)"
  }
});

