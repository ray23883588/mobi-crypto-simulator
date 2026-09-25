import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Image, LogBox } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import 'react-native-gesture-handler';
import { db } from "./assets/database";
import { collection, query, where, getDocs, onSnapshot, doc, orderBy, limit } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WalletScreen from "./pages/WalletScreen";
import TargetScreen from "./pages/TargetScreen";
import HomeScreen from "./pages/HomeScreen";
import BillingScreen from "./pages/BillingScreen";
import BillingRecordScreen from "./pages/billing/record";
import ProfileScreen from "./pages/ProfileScreen";
import LoginScreen from "./pages/account/loginPage";
import SignInScreen from "./pages/account/signInPage";
import ForgetPassword from "./pages/account/forgetPassword";
import TargetDetailScreen from "./pages/target/TargetDetailScreen";
import SplashScreen from "./pages/SplashScreen";
import NoteScreen from "./pages/profile/note";
import FavoriteScreen from "./pages/profile/favorite";
import CopyTrade from "./pages/billing/copyTrade";
import EditProfile from "./pages/account/editProfile";
import TransferScreen from "./pages/billing/transfer";
import ChargeScreen from "./pages/billing/charge";
import Toast from 'react-native-toast-message';
import TestPage from "./pages/target/TradeMenu";


// LogBox.ignoreLogs(['AsyncStorage has been extracted from react-native core and will be removed in a future release']);
// LogBox.ignoreLogs(['componentWillReceiveProps has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.']);
// LogBox.ignoreLogs(['Animated: `useNativeDriver` was not specified. This is a required option and must be explicitly set to `true` or `false`']);
// LogBox.ignoreLogs(['Encountered two children with the same key']);
LogBox.ignoreAllLogs()

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const MyConText = React.createContext();

// 登入相關Navigator
function LoginStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
          overlayStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
              extrapolate: 'clamp',
            }),
          },
        }),
        headerShown: false,
      }
      }>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignInScreen" component={SignInScreen} />
      <Stack.Screen name="ForgetPassword" component={ForgetPassword} />

    </Stack.Navigator>
  )
}

// 主功能Bottom Navigator
function TabNaviGator() {
  const Data = React.useContext(MyConText)
  return (
    <Tab.Navigator
      initialRouteName='Home'
      screenOptions={{
        tabBarStyle: { backgroundColor: "rgba(69, 69, 69, 1)", borderTopWidth: 0 },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: "#8afff4",
      }}>
      <Tab.Screen
        name="Home"
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <Icon name="home-variant-outline" color={color} size={30} />
          )
        }} >{props => <HomeScreen {...props} traderData={Data.trader} userInfo={Data.userInfo} />}</Tab.Screen>
      <Tab.Screen
        name="Target"
        component={TargetScreen}
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <Icon name="bitcoin" color={color} size={30} />
          )
        }} />
      <Tab.Screen
        name="Wallet"
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <Icon name="wallet-outline" color={color} size={30} />
          )
        }}>{props => <WalletScreen {...props} data={Data.userData} userInfo={Data.userInfo} />}</Tab.Screen>
      <Tab.Screen
        name="Billing"
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <Icon name="text-box-check-outline" color={color} size={30} />
          )
        }}>{props => <BillingScreen {...props} data={Data.userData} entrusts={Data.entrusts} tradeRecord={Data.tradeRecord} userInfo={Data.userInfo} />}</Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <Icon name="account-outline" color={color} size={30} />
          )
        }} >{props => <ProfileScreen {...props} data={Data.userData} trader={Data.trader} userInfo={Data.userInfo} />}</Tab.Screen>
    </Tab.Navigator>
    // </NavigationContainer>
  )
}

export default function App(props) {
  const [userData, setUserData] = useState({})
  const [isLogedIn, setIsLogedIn] = useState()
  const [id, setId] = useState("")
  const [userInfo, setUserInfo] = useState({})
  const [tradeRecord, setTradeRecord] = useState({});
  const [trader, setTrader] = useState([]);
  const [entrusts, setEntrusts] = useState([]);
  const auth = getAuth();
  const myContext = { userData: userData, trader: trader, tradeRecord: tradeRecord, entrusts: entrusts, userInfo: userInfo }

  // 登入檢測
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setId(user.uid)
      setIsLogedIn(true)
    }
    else {
      setId("")
      setIsLogedIn(false)
    }
  })

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserInfo(user)
        if (id != "") {
          // 抓取帳戶個人資料
          onSnapshot(
            doc(db, "account", id),
            { includeMetadataChanges: false },
            (doc) => {
              setUserData(doc.data())
            });
          // 抓取交易紀錄
          onSnapshot(
            query(collection(db, "transaction"), where("uid", "==", id), where("status", "==", "已成交"), orderBy("deal_time", "desc")),
            { includeMetadataChanges: false },
            (querySnapshot) => {
              const records = [];
              querySnapshot.forEach((doc) => {
                records.push(doc.data());
              });
              setTradeRecord(records);
            });
          // 抓取跟單交易員
          onSnapshot(
            query(collection(db, 'account'), where("admitCopy", "==", true), orderBy("billing.weeklyROI", "desc"), limit(15)),
            { includeMetadataChanges: false },
            (querySnapshot) => {
              const Traders = [];
              querySnapshot.forEach((doc) => {
                Traders.push(doc.data());
              });
              setTrader(Traders);
            });
          // 抓取委託
          onSnapshot(
            query(collection(db, "transaction"), where("uid", "==", id), where("status", "==", "待成交"), orderBy("order_time", "desc")),
            { includeMetadataChanges: false },
            (querySnapshot) => {
              const Entrust = [];
              querySnapshot.forEach((doc) => {
                Entrust.push([doc.id, doc.data()]);
              });
              setEntrusts(Entrust);
            });

        }
      } else {
        setUserInfo({})
      }
    })
  }, [db, auth, id]);
  return (
    // 主程式
    <MyConText.Provider value={myContext}>
      <NavigationContainer mode="modal">
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLogedIn != null
            ? isLogedIn
              ? <Stack.Screen name='Root' component={TabNaviGator}></Stack.Screen>
              : <Stack.Screen name="Login" component={LoginStack}
                options={{
                  animationTypeForReplace: !isLogedIn ? 'pop' : 'push',
                }} />
            : <Stack.Screen name='Splash' component={SplashScreen} />
          }
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="TargetDetail">{props => <TargetDetailScreen {...props} data={userData} userInfo={userInfo} />}</Stack.Screen>
            <Stack.Screen name="BillingRecord">{props => <BillingRecordScreen {...props} tradeRecord={tradeRecord} data={userData} />}</Stack.Screen>
            <Stack.Screen name="CopyTrade">{props => <CopyTrade {...props} data={userData} userInfo={userInfo} />}</Stack.Screen>
            <Stack.Screen name="TestPage">{props => <TestPage {...props} data={userData} userInfo={userInfo} />}</Stack.Screen>
          </Stack.Group>
          <Stack.Screen name="FavoriteScreen">{props => <FavoriteScreen {...props} data={userData} />}</Stack.Screen>
          <Stack.Screen name="NoteScreen">{props => <NoteScreen {...props} data={userData} />}</Stack.Screen>
          <Stack.Screen name="EditScreen">{props => <EditProfile {...props} data={userData} />}</Stack.Screen>
          <Stack.Screen name="TransferScreen">{props => <TransferScreen {...props} data={userData} userInfo={userInfo} />}</Stack.Screen>
          <Stack.Screen name="ChargeScreen">{props => <ChargeScreen {...props} data={userData} userInfo={userInfo} />}</Stack.Screen>
        </Stack.Navigator>

      </NavigationContainer>
      <Toast />
    </MyConText.Provider>
  )
}

const stylesheet = StyleSheet.create({})