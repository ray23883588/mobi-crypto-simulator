import React, { useState } from "react";
import {
  Button,
  Alert,
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Modal
} from "react-native";
import GlobalStyle from '../../assets/styles'
import { Picker } from '@react-native-picker/picker';
import { db } from "../../assets/database";
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { async } from "@firebase/util";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MyDatePicker from "./DatePicker";
import Checkbox from 'expo-checkbox';


export default function SignIn(props) {
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  const [chkPass, setChkPass] = useState("")
  const [nickname, setNickname] = useState("");
  const [selectedGender, setSelectedGender] = useState("male");
  const [selectedProfession, setSelectedProfession] = useState("學生");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [date, setDate] = useState("2000/01/01");
  const [isChecked, setChecked] = useState(false);
  const [policyVisible, setPolicyVisible] = useState(false)

  const auth = getAuth();

  const formChk = () => {
    if (email === "") {
      alert("Email不可為空!");
    } else if (pass === "") {
      alert("密碼不可為空!")
    } else if (chkPass != pass) {
      alert("兩次輸入的密碼需相同!")
    } else if (nickname === "") {
      alert("暱稱不可為空!")
    } else if (isChecked === false) {
      alert("請先同意隱私權政策!")
    }
    else {
      signUp(email, pass, nickname, selectedGender, selectedProfession, year, month, day)
    }
  }

  const signUp = (email, pass) => {
    createUserWithEmailAndPassword(auth, email, pass)
      .then((userCredential) => {
        const user = userCredential.user;
        createProfile(user.uid)
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (error.code == "auth/email-already-in-use") {
          alert("此Email已被註冊，請更換後重試。");
        } else if (error.code == "auth/invalid-email") {
          alert("Email格式錯誤，請檢查!");
        } else if (error.code == "auth/operation-not-allowed") {
          alert("權限無效!");
        } else if (error.code == "auth/weak-password") {
          alert("此密碼安全度太低，請更換後重試。");
        } else {
          alert(errorCode)
        }
      });
  }

  const handleDateChange = (date) => {
    setDate(date)
  }

  async function createProfile(uid) {
    try {
      const docRef = doc(db, "account", uid)
      await setDoc(docRef, {
        adCount: 0,
        admitCopy: false,
        averagePrice: {},
        averagePrice_C: {},
        billing: {
          dailyBenefit: 0,
          dailyCost: 0,
          dailyROI: 0,
          monthlyBenefit: 0,
          monthlyCost: 0,
          monthlyROI: 0,
          weeklyBenefit: 0,
          weeklyCost: 0,
          weeklyROI: 0,
          historyCost: 0,
          historyBenefit: 0,
          lastMonyhProfit: 0,
          lastMonthROI: 0,
        },
        billing_C: {
          dailyBenefit: 0,
          dailyCost: 0,
          dailyROI: 0,
          monthlyBenefit: 0,
          monthlyCost: 0,
          monthlyROI: 0,
          weeklyBenefit: 0,
          weeklyCost: 0,
          weeklyROI: 0,
          historyCost: 0,
          historyBenefit: 0,
          lastMonyhProfit: 0,
          lastMonthROI: 0,
        },
        birthday: date,
        copyTrader: {
          mode: "",
          copyTradeValue: 0,
          uid: ""
        },
        email: email,
        favorite: {},
        followers: [],
        following: [],
        gender: selectedGender,
        nickname: nickname,
        note: [],
        profession: selectedProfession,
        uid: uid,
        pocket: {
          twd: 150000,
        },
        pocket_C: {
          twd: 0,
        }
      });

      createSuccessAlert()
    } catch (e) {
      alert(e)
    }

  }

  const createSuccessAlert = () =>
    Alert.alert(
      "成功",
      "註冊成功！",
      [
        { text: "好欸" }
      ]
    );

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)", overflow: "visible" }}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={policyVisible}
          onRequestClose={() => {
            setPolicyVisible(!policyVisible);
          }}
          statusBarTranslucent={true}
        >
          <View style={{ backgroundColor: "#000000AA", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <View style={{ width: "80%", height: "auto", backgroundColor: "black", borderRadius: 30, alignItems: "center", padding: 15 }}>
              <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-evenly" }}>
                <Text style={[GlobalStyle.title, stylesheet.infoTitle, { color: "#8afff4" }]}>隱私權政策</Text>
              </View>
              <ScrollView style={{ height: "60%", marginVertical: 25 }}>
                <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>
                  MOBI-隱私權政策聲明
                  {"\n\n"}
                  非常歡迎您下載本App，為了讓您能夠安心使用本App的各項服務與資訊，特此向您說明本App的隱私權保護政策，以保障您的權益，請您詳閱下列內容：
                  {"\n\n"}
                  一、隱私權保護政策的適用範圍
                  {"\n"}
                  隱私權保護政策內容，包括本App如何處理在您使用App服務時收集到的個人識別資料。隱私權保護政策不適用於本App以外的相關連結外部網頁，也不適用於非本App所委託或參與管理的人員。
                  {"\n\n"}
                  二、個人資料的蒐集、處理及利用方式
                  {"\n"}
                  本App將向使用者蒐集以下個人資料。若您拒絕提供，將無法提供您使用本 APP 相關服務：
                  {"\n"}

                  當您登入使用本App時，根據本App提供服務性質不同，我們會請您提供個人資訊，包括：電子郵件、密碼、性別、職業、生日及其他相關必要資料。
                  {"\n"}
                  於一般連線時，伺服器會自行記錄相關行徑，包括您使用連線設備的IP位址、使用時間、使用的作業系統、瀏覽及點選資料記錄等，做為我們增進App服務的參考依據，此記錄為內部應用，決不對外公佈。
                  {"\n\n"}
                  三、資料之保護
                  {"\n"}
                  本App主機均設有防火牆、防毒系統等相關的各項資訊安全設備及必要的安全防護措施，加以保護網站及您的個人資料採用嚴格的保護措施，只由經過授權的人員才能接觸您的個人資料，相關處理人員皆簽有保密合約，如有違反保密義務者，將會受到相關的法律處分。
                  {"\n"}
                  如因業務需要有必要委託其他單位提供服務時，本App亦會嚴格要求其遵守保密義務，並且採取必要檢查程序以確定其將確實遵守。
                  {"\n\n"}
                  四、網站對外的相關連結
                  {"\n"}
                  本App的網頁提供其他網站的網路連結，您也可經由本App所提供的連結，點選進入其他網站。但該連結網站不適用本App的隱私權保護政策，您必須參考該連結網站中的隱私權保護政策。
                  {"\n\n"}
                  五、與第三人共用個人資料之政策
                  {"\n"}
                  本App絕不會提供、交換、出租或出售任何您的個人資料給其他個人、團體、私人企業或公務機關，但有法律依據或合約義務者，不在此限。 前項但書之情形包括不限於：
                  {"\n\n"}
                  經由您書面同意。
                  {"\n"}
                  法律明文規定。
                  {"\n"}
                  為免除您生命、身體、自由或財產上之危險。
                  {"\n"}
                  與公務機關或學術研究機構合作，基於公共利益為統計或學術研究而有必要，且資料經過提供者處理或蒐集著依其揭露方式無從識別特定之當事人。
                  {"\n"}
                  當您在App裡的行為，違反服務條款或可能損害或妨礙App與其他使用者權益或導致任何人遭受損害時，經App管理單位研析揭露您的個人資料是為了辨識、聯絡或採取法律行動所必要者。
                  {"\n"}
                  有利於您的權益。
                  {"\n"}
                  本App委託廠商協助蒐集、處理或利用您的個人資料時，將對委外廠商或個人善盡監督管理之責。
                  {"\n\n"}
                  六、隱私權保護政策之修正
                  {"\n"}
                  本App隱私權保護政策將因應需求隨時進行修正。
                  {"\n\n"}
                  【開發者聯絡方式】
                  ray23883588@gmail.com
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={[stylesheet.loginButton, { height: 50, alignSelf: "center", }]}
                onPress={() => setPolicyVisible(!policyVisible)
                }>
                <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>
                  確認
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <KeyboardAwareScrollView>
          <TouchableOpacity
            style={[GlobalStyle.backButton, { backgroundColor: "rgba(21, 21, 21, 1)" }]}
            onPress={() => props.navigation.pop()}>
            <Icon name="chevron-left" color={"#8afff4"} size={50} />
          </TouchableOpacity>
          <Image style={stylesheet.label} source={require('../../assets/Label_H.png')} />

          <View style={{ top: 50, paddingHorizontal: 40, paddingBottom: 60 }}>
            <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>帳號</Text>
            <TextInput
              style={stylesheet.input}
              value={email}
              placeholder="E-mail"
              keyboardType="email-address"
              placeholderTextColor="rgba(135, 135, 135, 1)"
              onChangeText={(value) => setEmail(value)}
              returnKeyType='next'
              returnKeyLabel='next' />
            <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>密碼</Text>
            <TextInput
              style={stylesheet.input}
              value={pass}
              placeholder="密碼" secureTextEntry={true}
              placeholderTextColor="rgba(135, 135, 135, 1)"
              onChangeText={(value) => setPass(value)}
              returnKeyType='next'
              returnKeyLabel='next' />
            <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>再次確認密碼</Text>
            <TextInput
              style={stylesheet.input}
              value={chkPass}
              placeholder="密碼" secureTextEntry={true}
              placeholderTextColor="rgba(135, 135, 135, 1)"
              onChangeText={(value) => setChkPass(value)}
              returnKeyType='next'
              returnKeyLabel='next' />
            <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>暱稱</Text>
            <TextInput
              style={stylesheet.input}
              value={nickname}
              placeholder="10個字以內"
              maxLength={10}
              placeholderTextColor="rgba(135, 135, 135, 1)"
              onChangeText={(value) => setNickname(value)}
              returnKeyType='next'
              returnKeyLabel='next' />
            <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>生日</Text>

            <MyDatePicker date={date} handleDateChange={handleDateChange} />
            <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>性別</Text>
            <Picker
              style={stylesheet.picker}
              selectedValue={selectedGender}
              onValueChange={(itemValue, itemIndex) =>
                setSelectedGender(itemValue)
              }
              dropdownIconColor="rgba(135, 135, 135, 1)"
              mode="dropdown"
            >
              <Picker.Item color='white' label="男" value="male" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="女" value="female" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="其他" value="other" style={stylesheet.pickerText} />
            </Picker>
            <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>職業</Text>
            <Picker
              style={stylesheet.picker}
              selectedValue={selectedProfession}
              onValueChange={(itemValue, itemIndex) =>
                setSelectedProfession(itemValue)
              }
              dropdownIconColor="rgba(135, 135, 135, 1)"
              mode="dropdown"
            >
              <Picker.Item color='white' label="學生" value="學生" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="軍公教人員" value="軍公教人員" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="金融業" value="金融業" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="科技業" value="科技業" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="服務業" value="服務業" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="製造業" value="製造業" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="能源業" value="能源業" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="交通業" value="交通業" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="醫療服務業" value="醫療服務業" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="農林漁牧業" value="農林漁牧業" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="自由業" value="自由業" style={stylesheet.pickerText} />
              <Picker.Item color='white' label="其他" value="其他" style={stylesheet.pickerText} />
            </Picker>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Checkbox style={{ marginRight: 10 }} value={isChecked} onValueChange={setChecked} />
              <Text style={[GlobalStyle.TextM, { textAlign: "left" }]}>我同意</Text>
              <TouchableOpacity onPress={() => { setPolicyVisible(!policyVisible) }}>
                <Text style={[GlobalStyle.TextM, { textAlign: "left", color: "#00afaa" }]}>隱私權政策</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={stylesheet.loginButton} onPress={() => formChk()}>
              <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>註冊</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </View>

    </TouchableWithoutFeedback>
  )
};
const stylesheet = StyleSheet.create({
  input: {
    position: "relative",
    width: 300,
    height: 40,
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
  picker: {
    position: "relative",
    width: 300,
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
  pickerText: {
    backgroundColor: 'rgba(59, 59, 59, 1)',
    color: 'white'
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
    top: 35,
    width: 179,
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
});

