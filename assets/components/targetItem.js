import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import GlobalStyle from "../styles"
import { LineChart, Grid } from 'react-native-svg-charts'

const TargetItem = ({ coin }) => (
  <TouchableOpacity style={[GlobalStyle.normalView, { paddingVertical: 20 }]}>
    <View style={{ flex: 3, paddingRight: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flexDirection: "row", marginRight: 10, width: 120 }}>
          <Image style={[styles.cryptoIcon, { marginRight: 10 }]} source={{ uri: coin.image }} />
          <Text style={coin.symbol.length < 5 ? GlobalStyle.TextXXL : GlobalStyle.TextXL}>
            {coin.symbol.toUpperCase()}
          </Text>
        </View>
        <Text style={[GlobalStyle.TextL, { position: "relative", textAlign: "left" }]}>
          ${coin.current_price > 1 ? coin.current_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : coin.current_price < 0.01
              ? coin.current_price.toFixed(6)
              : coin.current_price}
        </Text>
      </View>

      <View style={{ flexDirection: "row", marginVertical: 20 }}>
        <View style={{ flexDirection: "row", width: 120 }}>
          <Text style={[GlobalStyle.TextM, { color: "rgba(107, 255, 148, 1)", textAlign: "left", marginRight: 10 }]}>
            最高
          </Text>
          <Text style={[GlobalStyle.TextM, { color: "rgba(107, 255, 148, 1)", textAlign: "left" }]}>
            ${coin.high_24h > 1 ? coin.high_24h.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              : coin.high_24h < 0.01
                ? coin.high_24h.toFixed(6)
                : coin.high_24h}
          </Text>
        </View>
        <View style={{ flexDirection: "row", width: 120 }}>
          <Text style={[GlobalStyle.TextM, { color: "rgba(255, 92, 92, 1)", textAlign: "left", marginRight: 10 }]}>
            最低
          </Text>
          <Text style={[GlobalStyle.TextM, { color: "rgba(255, 92, 92, 1)", textAlign: "left" }]}>
            ${coin.low_24h > 1 ? coin.low_24h.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              : coin.low_24h < 0.01
                ? coin.low_24h.toFixed(6)
                : coin.low_24h}
          </Text>
        </View>
      </View>
    </View>
    <View style={{ flex: 1, marginLeft: 10, alignItems: "center", justifyContent: "center" }}>
      <LineChart
        style={styles.volumeChart}
        data={coin.sparkline_in_7d.price}
        svg={{ stroke: coin.price_change_percentage_24h > 0 ? "rgba(107, 255, 148, 1)" : "rgba(255, 92, 92, 1)" }}
        contentInset={{ top: 5, bottom: 5 }}
      >
        <Grid />
      </LineChart>
      <TouchableOpacity style={styles.trade}>
        <Text style={[GlobalStyle.TextM, { textAlign: "center" }]}>
          交易
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>

);

const styles = StyleSheet.create({
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
  }
});

export default TargetItem;