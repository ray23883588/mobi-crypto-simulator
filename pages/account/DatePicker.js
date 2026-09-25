import React, { Component } from 'react'
import DatePicker from 'react-native-datepicker'

export default function MyDatePicker({ date, handleDateChange }) {
  return (
    <DatePicker
      style={{
        position: "relative",
        width: 300,
        height: 40,
        borderRadius: 10,
        bottom: "auto",
        paddingHorizontal: 15,
        backgroundColor: "rgba(59, 59, 59, 1)",
        margin: 15,
        alignSelf: "center"
      }}
      showIcon={false}
      date={date}
      mode="date"
      placeholder="select date"
      format="YYYY/MM/DD"
      maxDate={new Date()}
      confirmBtnText="確定"
      cancelBtnText="取消"
      textColor="white"
      customStyles={{
        datePicker: {
          backgroundColor: '#222',
          borderWidth: 0
        },
        datePickerCon: {
          backgroundColor: '#222',
          borderWidth: 0
        },
        dateInput: {
          alignItems: "flex-start",
          borderWidth: 0
        },
        dateText: {
          color: 'white',
          textAlign: 'left',
          fontWeight: "400",
          textDecorationLine: "none",
          fontSize: 14,
        },
        dateTouchBody: {
          borderWidth: 0
        }
        // ... You can check the source to find the other keys.
      }}
      onDateChange={(date) => handleDateChange(date)}
    />
  )
}
