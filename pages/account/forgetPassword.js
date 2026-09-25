import React, { useState, useEffect } from "react";
import {
  Alert,
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  LogBox
} from "react-native";
import GlobalStyle from '../../assets/styles'
import { Picker } from '@react-native-picker/picker';
import { db } from "../../assets/database";
import { collection, doc, getDocs } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function ForgetPassword(props) {
  const auth = getAuth();
  const [email, setEmail] = useState("")

  const sendForgotPassEmail = () => {
    if (email === "") {
      createFailAlert("Email不得為空，請檢查！")
    } else {
      sendPasswordResetEmail(auth, email)
        .then(() => {
          createSuccessAlert()
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          createFailAlert(error.code)
        });
    }

  }

  const createSuccessAlert = () =>
    Alert.alert(
      "成功",
      "忘記密碼信件已送出，請查看您的電子信箱！",
      [
        { text: "好的", onPress: () => props.navigation.push('Login') }
      ]
    );

  const createFailAlert = (Mes) => {
    let errorMes = Mes
    if (Mes === "auth/invalid-email" || Mes === "auth/user-not-found") {
      errorMes = "電子信箱格式錯誤或用戶不存在！"
    }
    Alert.alert(
      "錯誤",
      errorMes,
      [
        { text: "好的" }
      ]
    )
  };

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)", overflow: "visible" }}>
        {/* <KeyboardAwareScrollView bounces={false} style={{ flex: 1 }}> */}
        <TouchableOpacity
          style={[GlobalStyle.backButton, { backgroundColor: "rgba(21, 21, 21, 1)" }]}
          onPress={() => props.navigation.pop()}>
          <Icon name="chevron-left" color={"#8afff4"} size={50} />
        </TouchableOpacity>
        <Image style={stylesheet.label} source={require('../../assets/Label.png')} />
        <View style={{ top: 120, paddingHorizontal: 40, paddingVertical: 20, flex: 1 }}>
          <Text style={GlobalStyle.TextL}>輸入帳號</Text>
          <TextInput
            style={stylesheet.input}
            value={email}
            keyboardType="email-address"
            placeholder="請輸入您的E-mail"
            placeholderTextColor="rgba(135, 135, 135, 1)"
            onChangeText={(value) => setEmail(value)}
          />
          <TouchableOpacity style={stylesheet.loginButton} onPress={() => sendForgotPassEmail()} >
            <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>送出</Text>
          </TouchableOpacity>
        </View>
        {/* </KeyboardAwareScrollView> */}
      </View>
    </TouchableWithoutFeedback>
  )
};
const stylesheet = StyleSheet.create({
  input: {
    position: "relative",
    width: 300,
    height: 60,
    borderRadius: 10,
    bottom: "auto",
    paddingHorizontal: 15,
    backgroundColor: "rgba(59, 59, 59, 1)",
    fontWeight: "400",
    textDecorationLine: "none",
    fontSize: 14,
    color: "white",
    textAlign: "left",
    textAlignVertical: "center",
    margin: 15,
    alignSelf: "center"
  },
  loginButton: {
    width: 200,
    height: 40,
    top: 0,
    margin: 20,
    backgroundColor: "#00afaa",
    justifyContent: "center",
    borderRadius: 35,
    alignSelf: "center",
  },
  label: {
    top: 100,
    width: 151,
    height: 150,
    resizeMode: "stretch",
    alignSelf: "center"
  }
});

