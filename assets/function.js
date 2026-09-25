export function roundDown(num, decimal) {
  return Math.floor((num + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
}
export function averagePriceFucion(averagePrice, totalVolume, tradePrice, volume) {
  if (type == "buying") {
    if (totalVolume == 0) { //若買入前總量 == 0
      averagePrice = tradePrice //成交均價 = 本次交易價
      totalVolume = volume //總量 = 本次交易幣量
    }
    else { //否則
      averagePrice = ((averagePrice * totalVolume) + tradePrice * volume) / (totalVolume + volume)
      //成交均價 = ((成交均價 * 總量) + 本次交易價 * 本次交易幣量) / (總量 + 本次交易幣量)
      totalVolume += volume
      //總量 += 本次交易幣量
    }
  }
  else if (type == "selling") {
    totalVolume -= volume
    // roi == (((tradePrice - averagePrice) * volume) / (averagePrice * volume)) * 100
  }
}
export function ROIFunction(benefit, cost, averagePrice, volume, orderValue) {
  cost += averagePrice * volume
  benefit += orderValue
  return benefit / cost
}
export function timeConvert(time) {
  let unix_timestamp = time

  var d = new Date(unix_timestamp * 1000);

  var formattedTime = d.getFullYear() + "/" +
    ("00" + (d.getMonth() + 1)).slice(-2) + "/" +
    ("00" + d.getDate()).slice(-2) + " " +
    ("00" + d.getHours()).slice(-2) + ":" +
    ("00" + d.getMinutes()).slice(-2) + ":" +
    ("00" + d.getSeconds()).slice(-2)

  return formattedTime

}

export function timeConvertDate(time) {
  let unix_timestamp = time

  var d = new Date(unix_timestamp * 1000);

  var formattedTime = ("00" + d.getFullYear()).slice(-2) + "/" +
    ("00" + (d.getMonth() + 1)).slice(-2) + "/" +
    ("00" + d.getDate()).slice(-2) + " "

  return formattedTime

}

export function timeConvertDateAlt(time) {
  let unix_timestamp = time

  var d = new Date(unix_timestamp);

  var formattedTime = ("00" + d.getFullYear()).slice(-4) +
    ("00" + (d.getMonth() + 1)).slice(-2) +
    ("00" + d.getDate()).slice(-2)

  return formattedTime

}

export function timeConvertTime(time) {
  let unix_timestamp = time

  var d = new Date(unix_timestamp * 1000);

  var formattedTime =
    ("00" + d.getHours()).slice(-2) + ":" +
    ("00" + d.getMinutes()).slice(-2) + ":" +
    ("00" + d.getSeconds()).slice(-2)

  return formattedTime

}
