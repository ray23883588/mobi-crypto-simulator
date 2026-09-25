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
} from "react-native";
import GlobalStyle from '../../assets/styles'
import { Picker } from '@react-native-picker/picker';
import { db } from "../../assets/database";
import { doc, setDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { async } from "@firebase/util";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MyDatePicker from "./DatePicker";


export default function EditProfile(props) {
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  const [chkPass, setChkPass] = useState("")
  const [nickname, setNickname] = useState(props.data.nickname);
  const [selectedGender, setSelectedGender] = useState(props.data.gender);
  const [selectedProfession, setSelectedProfession] = useState(props.data.profession);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [date, setDate] = useState(props.data.birthday);

  const auth = getAuth();

  const formChk = () => {
    if (nickname === "") {
      alert("暱稱不可為空!")
    } else {
      editProfile()
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

  async function editProfile() {
    try {
      const docRef = doc(db, "account", props.data.uid)
      await updateDoc(docRef, {
        birthday: date,
        gender: selectedGender,
        nickname: nickname,
        profession: selectedProfession,
      });

      createSuccessAlert()
    } catch (e) {
      alert(e)
    }

  }

  const createSuccessAlert = () =>
    Alert.alert(
      "成功",
      "更改資料成功！",
      [
        { text: "好欸", onPress: () => props.navigation.pop() }
      ]
    );

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(21, 21, 21, 1)", overflow: "visible" }}>
        <KeyboardAwareScrollView>
          <TouchableOpacity
            style={[GlobalStyle.backButton, { backgroundColor: "rgba(21, 21, 21, 1)" }]}
            onPress={() => props.navigation.pop()}>
            <Icon name="chevron-left" color={"#8afff4"} size={50} />
          </TouchableOpacity>
          <Image style={stylesheet.label} source={require('../../assets/Label_H.png')} />

          <View style={{ top: 50, paddingHorizontal: 40, paddingBottom: 60 }}>

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
            <TouchableOpacity style={stylesheet.loginButton} onPress={() => formChk()}>
              <Text style={[GlobalStyle.TextL, { textAlign: "center" }]}>確定更改</Text>
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
    fontSize: 16,
    color: "white",
    textAlign: "left",
    textAlignVertical: "center",
    margin: 15,
    alignSelf: "center"
  },
});

