#!/usr/bin/python
# -*- coding: utf-8 -*-
from asyncio.windows_events import NULL
from unittest import result
from bs4 import BeautifulSoup
from asyncio import tasks
from cmath import e
from locale import currency
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.encoders import jsonable_encoder
from fastapi.security import OAuth2PasswordBearer
from apscheduler.schedulers.background import BackgroundScheduler
from firebase_admin import credentials, firestore, auth
from pydantic import BaseModel
import firebase_admin
import datetime
import requests
import json
import os
import time
import asyncio
import hashlib
import urllib.parse
import importlib.util
spec = importlib.util.spec_from_file_location(
    "ecpay_payment_sdk",
    "./sdk/ecpay_payment_sdk.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

app = FastAPI()
cred = credentials.Certificate(
    os.environ.get("FIREBASE_CREDENTIALS", "firebase-mobi.json"))
firebase_admin.initialize_app(cred)
db = firestore.client()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

price_data = {}
exchange_data = []


class Item(BaseModel):
    id_token: str
    currency_id: str
    currency_symbol: str
    order_price: float | None = None
    direction: str
    order_value: float | None = None
    quantity: float | None = None


class Verify_Item(BaseModel):
    id_token: str


class Del_Item(BaseModel):
    id_token: str
    target_id: str


class Transfer_Item(BaseModel):
    id_token: str
    source: str
    amount: float


class Subvent_Item(BaseModel):
    id_token: str
    coin_value: float


def get_price_data():
    global price_data
    res = requests.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,usd-coin,solana,terra-luna,ripple,cardano,avalanche-2,polkadot,dogecoin,binance-usd,terrausd,shiba-inu,wrapped-bitcoin,crypto-com-chain,matic-network,near,staked-ether,cosmos,dai,litecoin,chainlink,tron,bitcoin-cash,ftx-token,ethereum-classic,algorand,stellar,leo-token,okb,uniswap,vechain,axie-infinity,internet-computer,hedera-hashgraph,filecoin,waves,elrond-erd-2,decentraland,the-sandbox,fantom,theta-token,monero,compound-ether,tezos,the-graph,apecoin,thorchain,aave,klay-token,osmosis,eos,pancakeswap-token,magic-internet-money,helium,frax,flow,iota,defichain,frax-share,zcash,zilliqa,ecash,convex-finance,maker,bittorrent,harmony,arweave,gala,neo,cdai,theta-fuel,bitcoin-cash-sv,huobi-btc,compound-usd-coin,quant-network,kusama,celo,enjincoin,kucoin-shares,havven,blockstack,chiliz,huobi-token,radix,loopring,nexo,lido-dao,stepn,dash,amp-token,basic-attention-token,true-usd,celsius-degree-token,mina-protocol,humans-ai,kadena,juno-network,holotoken,bitdao,curve-dao-token,moonbeam,compound-governance-token,smooth-love-potion,nem,oasis-network,gatechain-token,secret,link,paxos-standard,xido-finance,iotex,pocket-network,neutrino,msol,skale,decred,iostoken,qtum,sushi,yearn-finance,audius,omisego,1inch,ecomi,nxm,gnosis,swipe,anchor-protocol,icon,ankr,kava,defi-kingdoms,wax,bitkub-coin,xdce-crowd-sale,bitcoin-gold,ravencoin,0x,livepeer,bancor,render-token,radio-caca,compound-usdt,siacoin,dydx,safemoon-2,pax-gold,rocket-pool,zencash,acala,immutable-x,woo-network,oec-token,renbtc,sapphire,e-radix,synapse-2,ontology,dogelon-mars,looksrare,songbird,rally-2,fei-usd,golem,convex-crv,spell-token,just,uma,telcoin,olympus,digibyte,apenft,baby-doge-coin,velas,mobox,bitclout,liquity-usd,tether-gold,ethereum-name-service,polymath,republic-protocol,swissborg,everdome,trust-wallet-token,lido-staked-sol,constellation-labs,nucypher,casper-network,zelcash,hive,astar,serum,illuvium,syscoin,playdapp,pirate-chain,metis-token,nervos-network,vulcan-forged,nano,tomb,tenset,keep-network,astroport,celer-network,lisk,persistence,chromaway,constitutiondao,wink,ultra,dent,perpetual-protocol,coin98,vvs-finance,raydium,tokemak,fetch-ai,kyber-network-crystal,ichi-farm,mmfinance,wazirx,floki-inu,moonriver,coti,injective-protocol,xsushi,dopex,xyo-network,flex-coin,ufo-gaming,aurora-near,husd,fx-coin,status,merit-circle,medibloc,joe,gmx,mimatic,conflux-token,origin-protocol,gemini-dollar,api3,ocean-protocol,mask-network,yield-guild-games&vs_currencies=twd")
    data = json.loads(res.text)
    price_data = data
    # with open('assets/price_data.txt', 'w') as outfile:
    #     json.dump(data, outfile)


def get_exchange_data():
    global exchange_data
    res = requests.get(
        "https://openapi.taifex.com.tw/v1/DailyForeignExchangeRates")
    data = json.loads(res.text)
    exchange_data = data


get_exchange_data()


@app.on_event('startup')
def init_data():
    scheduler = BackgroundScheduler(timezone="Asia/Taipei")
    scheduler.add_job(get_price_data, 'cron', second='*/6')
    scheduler.add_job(order_check_asyncio, 'cron', second='*/30')
    scheduler.add_job(get_exchange_data, 'cron', second=0)
    scheduler.add_job(reset_billing_daily, 'cron', hour=0)
    scheduler.add_job(reset_billing_weekly, 'cron', day_of_week=1)
    scheduler.add_job(reset_billing_monthly, 'cron', day=1)
    scheduler.start()


# Root Page
@app.get("/")
def read_root():
    return "MOBI"


# 領取獎勵
@ app.post("/receive_award")
async def receive(item: Verify_Item):
    # 驗證id token
    result = id_auth(item.id_token)
    if result == False:
        raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        account_ref = db.collection("account").document(
            result)
        award_ref = account_ref.collection("award")
        docs = award_ref.where("status", "==", False).stream()
        total = 0
        # 讀取獎勵資料並更改狀態
        for doc in docs:
            data = doc.to_dict()
            doc_ref = db.collection("account").document(
                result).collection("award").document(doc.id)
            doc_ref.update({u'status': True})
            total += data["value"]

        # 更新錢包餘額
        account_ref.update({u'pocket.twd': firestore.Increment(int(total))})

        return {'status': 'success'}


# 劃轉
@ app.post('/transfer')
async def transfer(item: Transfer_Item):
    # 驗證id token
    result = id_auth(item.id_token)
    if result == False:
        raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        account_ref = db.collection("account").document(result)
        try:
            if item.source == 'iToCt':
                account_ref.update({
                    "pocket_C.twd": firestore.Increment(item.amount),
                    "pocket.twd": firestore.Increment(-item.amount)
                })
            else:
                account_ref.update({
                    "pocket_C.twd": firestore.Increment(-item.amount),
                    "pocket.twd": firestore.Increment(item.amount)
                })
            return {'status': 'success'}
        except e:
            print(e)
            return {'status': 'error', 'message': 'Server Error'}


# 廣告獎勵
@ app.post('/ad_reward')
async def reward(item: Verify_Item):
    # 驗證id token
    result = id_auth(item.id_token)
    if result == False:
        raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        account_ref = db.collection("account").document(result)
        try:
            account_ref.update({
                "adCount": firestore.Increment(1),
                "pocket.twd": firestore.Increment(20000)
            })
            return {'status': 'success'}
        except e:
            print(e)
            return {'status': 'error', 'message': 'Server Error'}

# 救援金


@ app.post('/subvention')
async def subvent(item: Subvent_Item):
    # 驗證id token
    result = id_auth(item.id_token)
    if result == False:
        raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        count = 0
        account_ref = db.collection("account").document(result)
        records = db.collection("transaction").where(
            u'uid', u'==', "IrpGSERthmTfLMpiEwfg2kKSh602").stream()
        try:
            if item.coin_value < 10000:
                for tran in records:
                    doc = db.collection('transaction').document(tran.id)
                    doc_data = doc.get().to_dict()
                    if doc_data['order_time'].timestamp() > (datetime.datetime.now() - datetime.timedelta(days=7)).timestamp():
                        count += 1
                if count >= 20:
                    account_ref.update({
                        "pocket.twd": firestore.Increment(50000)
                    })
                    return {'status': 'success'}
                else:
                    return {'status': 'error', 'message': '七日內交易次數未達20次！'}
            else:
                return {'status': 'error', 'message': '總資產未低於新台幣10,000！'}
        except e:
            print(e)
            return {'status': 'error', 'message': 'Server Error'}

# 美元匯率


@ app.post("/exchange_rate")
async def process(item: Verify_Item):
    # 驗證id token
    result = id_auth(item.id_token)
    if result == False:
        raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        try:
            return {'status': 'success', 'exchange_rate': exchange_data}
        except e:
            print(e)
            return {'status': 'error', 'message': 'Server Error'}


# 綠界回傳


@ app.post("/ecpay_callback")
async def check(request: Request, background_tasks: BackgroundTasks):
    da = await request.form()
    da = jsonable_encoder(da)
    background_tasks.add_task(
        process_payment_data, da)
    # mac_value = da.pop('CheckMacValue', None)
    # data = da.items()
    # data_list = list(data)
    # parameter_str = "HashKey%3d<TEST_HASH_KEY>%26" + \
    #     urllib.parse.urlencode(da) + "%26HashIV%3d<TEST_HASH_IV>"
    # print(mac_value)

    # print(parameter_str.lower())
    return 1


# 處理綠界回傳資料
async def process_payment_data(data):
    if data["RtnCode"] == '1':
        doc_ref = db.collection("charge").document(data["MerchantTradeNo"])
        doc = doc_ref.get()
        if doc.exists:
            charge_data = doc.to_dict()
            # 檢查綠界回傳之收款金額與資料庫所記錄的訂單金額是否相符
            if int(data["TradeAmt"]) == charge_data["NTD_amount"]:
                # 更新訂單狀態
                doc_ref.update({
                    "PaymentDate": data["PaymentDate"],
                    "status": "已付款",
                    "ecpayTradeNo": data["TradeNo"]
                })

                # 更新錢包餘額
                user_id = charge_data["uid"]
                amount = charge_data["NTD_amount"]
                account_ref = db.collection(
                    "account").document(user_id)
                account_ref.update({
                    u'pocket.twd': firestore.Increment(charge_data["MOBINTD_amount"])
                })

                print(f"{datetime.datetime.now()} 用戶:{user_id} 儲值了{amount}元")
            else:
                return
        else:
            return


# 獲取綠界付款網頁測試
@ app.get("/get_payment_html/", response_class=HTMLResponse)
async def test(amount: int, uid: str):
    if len(uid) != 28:
        raise HTTPException(status_code=404, detail="Not Found")
    if amount < 0:
        return "Error"
    else:
        mobi = 0
        match amount:
            case 30:
                mobi = 20000
            case 60:
                mobi = 50000
            case 90:
                mobi = 100000
            case _:
                return "Error"
        now = datetime.datetime.now()
        order_params = {
            'MerchantTradeNo': now.strftime("MOBI%Y%m%d%H%M%S"),
            'MerchantTradeDate': now.strftime("%Y/%m/%d %H:%M:%S"),
            'PaymentType': 'aio',
            'TotalAmount': amount,
            'TradeDesc': '模幣-虛擬投資平台',
            'ItemName': f'模幣-${mobi} MOBINTD',
            'ReturnURL': 'https://api.mobicrypto.tw/ecpay_callback',
            'ChoosePayment': 'Credit',
            'Remark': '',
            # 'OrderResultURL': 'https://www.ecpay.com.tw/order_result_url.php',
            'EncryptType': 1,
        }

    # 建立實體
        # 測試環境請改用綠界官方提供的測試商店代號與金鑰
        ecpay_payment_sdk = module.ECPayPaymentSdk(
            MerchantID=os.environ['ECPAY_MERCHANT_ID'],
            HashKey=os.environ['ECPAY_HASH_KEY'],
            HashIV=os.environ['ECPAY_HASH_IV']
        )

        try:
            # 產生綠界訂單所需參數
            final_order_params = ecpay_payment_sdk.create_order(order_params)

            # 產生 html 的 form 格式
            # action_url = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'  # 測試環境
            action_url = 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'  # 正式環境

            # 抓取mac_value
            html = ecpay_payment_sdk.gen_html_post_form(
                action_url, final_order_params)
            soup = BeautifulSoup(html, "html.parser")
            mac_value = soup.find("input", {'name': 'CheckMacValue'})["value"]
            # print(mac_value)

            # 建立訂單
            data = {
                u'NTD_amount': amount,
                u'MOBINTD_amount': mobi,
                u'TradeDate': now.strftime("%Y/%m/%d %H:%M:%S"),
                u'uid': uid,
                u'status': "待付款",
            }
            db.collection(u'charge').document(
                now.strftime("MOBI%Y%m%d%H%M%S")).set(data)

            # 檢驗mac_value
            # h = hashlib.new('sha256')
            # h.update(b"hashkey%3d<test_hash_key>%26choosepayment%3dall%26encrypttype%3d1%26itemname%3dapple+iphone+7+%e6%89%8b%e6%a9%9f%e6%ae%bc%26merchantid%3d2000132%26merchanttradedate%3d2013%2f03%2f12+15%3a30%3a23%26merchanttradeno%3decpay20130312153023%26paymenttype%3daio%26returnurl%3dhttps%3a%2f%2fwww.ecpay.com.tw%2freceive.php%26totalamount%3d1000%26tradedesc%3d%e4%bf%83%e9%8a%b7%e6%96%b9%e6%a1%88%26hashiv%3d<test_hash_iv>")
            # print(h.hexdigest())
            # data = order_params.items()
            # data_list = list(data)
            # data_list.sort()
            # print(data_list)
            # for i in data_list:
            #     print(i)
            return html
        except Exception as error:
            print('發生錯誤: ' + str(error))
            return """<html><head><title>Error</title></head><body><h1>Internal Server Error!!</h1></body></html>"""


# 獲取綠界付款網頁正式版
@ app.get("/get_payment/", response_class=HTMLResponse)
async def test(amount: int = 0):

    if amount == 0:
        return "Error"
    else:
        order_params = {
            'MerchantTradeNo': datetime.datetime.now().strftime("MOBI%Y%m%d%H%M%S"),
            'MerchantTradeDate': datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S"),
            'PaymentType': 'aio',
            'TotalAmount': amount,
            'TradeDesc': '模幣-虛擬投資平台',
            'ItemName': f'模幣-{amount}元',
            'ReturnURL': 'https://api.mobicrypto.tw/ecpay_callback',
            'ChoosePayment': 'Credit',
            'ItemURL': 'https://google.com',
            'Remark': '',
            # 'OrderResultURL': 'https://www.ecpay.com.tw/order_result_url.php',
            'EncryptType': 1,
        }

    # 建立實體
    ecpay_payment_sdk = module.ECPayPaymentSdk(
        MerchantID=os.environ['ECPAY_MERCHANT_ID'],
        HashKey=os.environ['ECPAY_HASH_KEY'],
        HashIV=os.environ['ECPAY_HASH_IV']
    )

    try:
        # 產生綠界訂單所需參數
        final_order_params = ecpay_payment_sdk.create_order(order_params)

        # 產生 html 的 form 格式
        # action_url = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'  # 測試環境
        action_url = 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'  # 正式環境
        html = ecpay_payment_sdk.gen_html_post_form(
            action_url, final_order_params)
        return html
    except Exception as error:
        print('發生錯誤: ' + str(error))
        return """<html><head><title>Error</title></head><body><h1>Internal Server Error!!</h1></body></html>"""


# 投報率計算

def ROI(benefit, new_benefit, cost, new_cost):
    return ((benefit + new_benefit) - (cost + new_cost)) / (cost + new_cost)

# 取消跟單


@ app.post("/cancel_copy_trade")
async def process(item: Verify_Item):
    # 驗證id token
    result = id_auth(item.id_token)
    if result == False:
        raise HTTPException(status_code=401, detail="Unauthorized")
    else:
        cancel_copy_trade(result)
        return {'status': 'success'}


# 取消跟單流程
def cancel_copy_trade(uid):
    account_ref = db.collection(u'account').document(uid)
    doc = account_ref.get()

    if doc.exists:
        data = doc.to_dict()
        new_pocket = data["pocket"]
        new_average_price = data["averagePrice"]
        new_pocket_C = data["pocket_C"]
        new_average_price_C = data["averagePrice_C"]
        trader_uid = data["copyTrader"]["uid"]
        pocket_C_twd = new_pocket_C['twd']
        del new_pocket_C['twd']
        for i in new_pocket_C:
            if new_pocket.get(i) == None:
                new_pocket[i] = new_pocket_C[i]
                new_average_price[i] = new_average_price_C[i]
            else:
                new_pocket[i] += new_pocket_C[i]
                new_average_price[i] = (((data["averagePrice_C"][i] * data["pocket_C"][i]) +
                                         (data["averagePrice"][i] * data["pocket"][i])) / (data["pocket_C"][i] + data["pocket"][i]))

        # 更新跟單者錢包及成交均價
        account_ref.update({
            u'copyTrader': {u'uid': "", u'copyTradeValue': 0, u'copyTradeMode': ""},
            u'pocket': new_pocket,
            u'pocket_C': {u'twd': pocket_C_twd},
            u'averagePrice': new_average_price,
            u'averagePrice_C': {}

        })

        # 查詢被跟單者account
        trader_ref = db.collection(u'account').document(trader_uid)
        trader_doc = trader_ref.get()
        if trader_doc.exists:
            trader_data = trader_doc.to_dict()
            new_followers = trader_data["followers"]
            account_uid = data["uid"]

            # 遍尋被跟單者的followers找到自己的uid
            for i in range(len(new_followers)):
                if new_followers[i]["uid"] == account_uid:
                    new_followers[i]["copyTrade"] = False
                    del new_followers[i]["copyTradeValue"]
                    del new_followers[i]["mode"]

            # 更新被跟單者account
            trader_ref.update({
                u'followers': new_followers
            })


# 買入
@ app.post("/buy/{type}")
async def create_item(type: str, item: Item, background_tasks: BackgroundTasks):
    global price_data
    id_vaild = id_auth(item.id_token)
    if id_vaild != False:
        uid = id_vaild
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if type == "market":
        try:

            doc_ref = db.collection(u'account').document(uid)
            doc = doc_ref.get()

            if doc.exists:
                data = doc.to_dict()
                twd_value = data["pocket"]["twd"]
                price = price_data[item.currency_id]["twd"]
                quantity = item.order_value / price

                # 計算成交均價
                if data["averagePrice"].get(item.currency_id) == None or data["averagePrice"][item.currency_id] == 0:
                    average_price = price
                else:
                    if data["pocket"].get(item.currency_id) != None:
                        currency_total_value = data["pocket"][item.currency_id]
                    else:
                        currency_total_value = 0
                    average_price = (((data["averagePrice"][item.currency_id] * currency_total_value) + (
                        price * quantity)) / (currency_total_value + quantity))

                # 判斷錢包餘額是否足夠
                if twd_value >= item.order_value:
                    new_twd_value = twd_value-item.order_value
                    background_tasks.add_task(
                        pending_order_buy,  uid, new_twd_value, item.currency_id, item.currency_symbol, item.direction, price, datetime.datetime.utcnow(), type, item.order_value, quantity, average_price, False, None)

                    # 檢查是否有跟單者
                    for i in data["followers"]:
                        if i["copyTrade"] == True:
                            background_tasks.add_task(
                                check_copy_trading,  i["uid"], i["mode"], i["copyTradeValue"], item.currency_id, item.currency_symbol, item.direction, price, datetime.datetime.utcnow(), type, item.order_value, quantity, None)

                    return {'status': 'success', 'message': 'deal', 'price': price, 'quantity': quantity}
                else:
                    return {'status': 'error', 'message': '帳戶餘額不足'}

            else:
                return {'status': 'error', 'message': 'User no found!'}

        except Exception as e:
            return {'status': 'error', 'message': e}

    elif type == "limit":
        doc_ref = db.collection(u'account').document(uid)

        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            twd_value = data["pocket"]["twd"]
            average_price = 0
            if twd_value >= item.order_value:
                new_twd_value = twd_value-item.order_value

                trans_id = pending_order_buy(uid, new_twd_value, item.currency_id, item.currency_symbol, item.direction,
                                             item.order_price, datetime.datetime.utcnow(), type, item.order_value, item.quantity, average_price, False, None)

                # 檢查是否有跟單者
                for i in data["followers"]:
                    if i["copyTrade"] == True:
                        background_tasks.add_task(
                            check_copy_trading,  i["uid"], i["mode"], i["copyTradeValue"], item.currency_id, item.currency_symbol, item.direction, item.order_price, datetime.datetime.utcnow(), type, item.order_value, item.quantity, trans_id)

                return {'status': 'success', 'message': "掛單成功"}
            else:
                return {'status': 'error', 'message': '帳戶餘額不足'}
    else:
        raise HTTPException(status_code=404, detail="Method not found")


# 賣出
@ app.post("/sell/{type}")
async def create_item(type: str, item: Item, background_tasks: BackgroundTasks):

    global price_data
    id_vaild = id_auth(item.id_token)
    if id_vaild != False:
        uid = id_vaild
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if type == "market":
        try:
            doc_ref = db.collection(u'account').document(uid)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                currency_value = data["pocket"][item.currency_id]
                price = price_data[item.currency_id]["twd"]
                average_price = data["averagePrice"][item.currency_id]
                if currency_value >= item.quantity:
                    if currency_value == item.quantity:
                        clear = True
                    else:
                        clear = False
                    background_tasks.add_task(
                        pending_order_sell, uid, item.currency_id, item.currency_symbol, price, datetime.datetime.utcnow(), type, price*item.quantity, item.quantity, average_price, clear, False, None)
                    # 檢查是否有跟單者
                    for i in data["followers"]:
                        if i["copyTrade"] == True:
                            background_tasks.add_task(
                                check_copy_trading,  i["uid"], i["mode"], i["copyTradeValue"], item.currency_id, item.currency_symbol, item.direction, price, datetime.datetime.utcnow(), type, item.order_value, item.quantity, None)

                    return {'status': 'success', 'message': 'deal', 'price': price, 'quantity': item.quantity}
                else:
                    return {'status': 'error', 'message': '帳戶餘額不足'}

            else:
                return {'status': 'error', 'message': 'User no found!'}

        except Exception as e:
            print(e)
            return {'status': 'error', 'message': e}

    elif type == "limit":
        doc_ref = db.collection(u'account').document(uid)

        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            currency_value = data["pocket"][item.currency_id]

            if currency_value >= item.quantity:
                # background_tasks.add_task(
                trans_id = pending_order_sell(uid, item.currency_id, item.currency_symbol, item.order_price, datetime.datetime.utcnow(
                ), type, item.quantity*item.order_price, item.quantity, None, None, False, None)

                # 檢查是否有跟單者
                for i in data["followers"]:
                    if i["copyTrade"] == True:
                        background_tasks.add_task(
                            check_copy_trading,  i["uid"], i["mode"], i["copyTradeValue"], item.currency_id, item.currency_symbol, item.direction, item.order_price, datetime.datetime.utcnow(), type, item.order_value, item.quantity, trans_id)

                return {'status': 'success', 'message': "掛單成功"}
            else:
                return {'status': 'error', 'message': '帳戶餘額不足'}
    else:
        raise HTTPException(status_code=404, detail="Method not found")


# firebase id驗證
def id_auth(id_token):
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token['uid']
    except Exception as e:
        print(e)
        return False


# 檢查跟單者餘額
async def check_copy_trading(uid, mode, copyTradeValue, currency_id, currency_symbol, direction, order_price, order_time, type, order_value, quantity, trans_id):
    copy_trading_ref = db.collection(u'account').document(uid)
    doc = copy_trading_ref.get()
    if doc.exists:
        data = doc.to_dict()
        twd_value = data["pocket_C"]["twd"]

        # 判斷買入賣出
        if direction == "買入":
            # 判斷跟單模式
            if mode == "limit":
                if copyTradeValue < order_value:
                    trade_value = copyTradeValue

                else:
                    trade_value = order_value

            else:
                trade_value = order_value * (copyTradeValue/100)

            # 利用交易額計算交易數量
            trade_quantity = trade_value / order_price

            # 判斷錢包餘額是否足夠
            if twd_value >= trade_value:
                if type == "market":
                    # 計算成交均價
                    if data["averagePrice_C"].get(currency_id) == None or data["averagePrice_C"][currency_id] == 0:
                        average_price = order_price
                    else:
                        if data["pocket_C"].get(currency_id) != None:
                            currency_total_value = data["pocket_C"][currency_id]
                        else:
                            currency_total_value = 0
                        average_price = (((data["averagePrice_C"][currency_id] * currency_total_value) + (
                            order_price * trade_quantity)) / (currency_total_value + trade_quantity))

                elif type == "limit":
                    average_price = 0

                # 掛單
                new_twd_value = twd_value - trade_value
                pending_order_buy(uid, new_twd_value, currency_id, currency_symbol, direction, order_price, order_time,
                                  type, trade_value, trade_quantity, average_price, True, trans_id)
            else:
                print(f"{datetime.datetime.now()} 用戶:{uid} 餘額不足 不進行掛單")

        elif direction == "賣出":
            # 判斷是否有該幣的庫存
            if data["pocket_C"].get(currency_id) != None:
                # 檢查跟單模式
                if mode == "rate":
                    # 比例模式
                    if quantity * (copyTradeValue/100) >= data["pocket_C"][currency_id]:
                        sell_quantity = data["pocket_C"][currency_id]
                        clear = True
                    else:
                        sell_quantity = quantity * (copyTradeValue/100)
                        clear = False

                else:
                    # 上限模式
                    if quantity >= data["pocket_C"][currency_id]:
                        sell_quantity = data["pocket_C"][currency_id]
                        clear = True
                    else:
                        sell_quantity = quantity
                        clear = False

                # 掛單
                pending_order_sell(uid, currency_id, currency_symbol, order_price, datetime.datetime.utcnow(
                ), type, sell_quantity*order_price, sell_quantity, data["averagePrice_C"][currency_id], clear, True, trans_id)

    else:
        print(f"User:{uid} no found")


# 買入掛單
def pending_order_buy(uid, new_twd_value, currency_id, currency_symbol, direction, order_price, order_time, type, order_value, quantity, average_price, is_copy_trade, orig_trans_id):
    account_ref = db.collection(u'account').document(uid)
    tran_ref = db.collection(u'transaction').document()

    # 判斷市價限價
    if type == "market":
        type = "市價"
        # 判斷是否為跟單並加入相應的錢包
        if is_copy_trade == True:
            account_ref.update({
                u'pocket_C.twd': new_twd_value,
                f'pocket_C.`{currency_id}`': firestore.Increment(quantity),
                f'averagePrice_C.`{currency_id}`': average_price
            })
        else:
            account_ref.update({
                u'pocket.twd': new_twd_value,
                f'pocket.`{currency_id}`': firestore.Increment(quantity),
                f'averagePrice.`{currency_id}`': average_price
            })

        # 掛市價買入單
        tran_ref.set({
            u'uid': uid,
            u'currency_id': currency_id,
            u'currency_symbol': currency_symbol,
            u'direction': direction,
            u'order_price': order_price,
            u'deal_price': order_price,
            u'order_time': order_time,
            u'deal_time': order_time,
            u'order_value': order_value,
            u'order_type': type,
            u'quantity': quantity,
            u'status': "已成交",
            u'isCopyTrade': is_copy_trade
        })
        print(
            f"{datetime.datetime.now()} 市價買入成交:{tran_ref.id:20} 幣種:{currency_symbol.upper():5} 成交價格:{round(order_price,8):10} 買入數量:{round(quantity,8)} 成交均價:{round(average_price,8)}")
    elif type == "limit":
        type = "限價"

        # 判斷是否為跟單並加入相應的錢包
        if is_copy_trade == True:
            account_ref.update({
                u'pocket_C.twd': new_twd_value,
            })
            tran_ref.set({
                u'uid': uid,
                u'currency_id': currency_id,
                u'currency_symbol': currency_symbol,
                u'direction': direction,
                u'order_price': order_price,
                u'order_time': order_time,
                u'order_value': order_value,
                u'order_type': type,
                u'quantity': quantity,
                u'status': "待成交",
                u'isCopyTrade': is_copy_trade,
                u'orig_trans': orig_trans_id
            })
        else:
            account_ref.update({
                u'pocket.twd': new_twd_value,
            })
            tran_ref.set({
                u'uid': uid,
                u'currency_id': currency_id,
                u'currency_symbol': currency_symbol,
                u'direction': direction,
                u'order_price': order_price,
                u'order_time': order_time,
                u'order_value': order_value,
                u'order_type': type,
                u'quantity': quantity,
                u'status': "待成交",
                u'isCopyTrade': is_copy_trade,
            })

        print(
            f"{datetime.datetime.now()} 買入掛單:{tran_ref.id:20} 幣種:{currency_symbol.upper():5} 價格:{round(order_price,8):10} 數量:{round(quantity,8)}")
        return tran_ref.id


# 賣出掛單
def pending_order_sell(uid, currency_id, currency_symbol, order_price, order_time, type, order_value, quantity, average_price, clear, is_copy_trade, orig_trans_id):
    account_ref = db.collection(u'account').document(uid)
    direction = "賣出"
    tran_ref = db.collection(u'transaction').document()
    doc = account_ref.get()
    if doc.exists:
        data = doc.to_dict()

        # 判斷市價限價單
        if type == "market":
            # 判斷是否清零
            if clear == True:
                average_price_value = 0
                quantity_method = firestore.DELETE_FIELD
            else:
                average_price_value = average_price
                quantity_method = firestore.Increment(-quantity)
            # 收益調整值
            profit_adj = 0

            type = "市價"
            # 這邊要先判定是否為跟單再更新個別的錢包
            if is_copy_trade == False:
                account_ref.update({
                    u'pocket.twd': firestore.Increment(order_price * quantity),
                    f'pocket.`{currency_id}`': quantity_method,
                    f'averagePrice.`{currency_id}`': average_price_value,
                    f'billing.dailyBenefit': firestore.Increment(order_price * quantity),
                    f'billing.dailyCost': firestore.Increment(average_price * quantity),
                    f'billing.weeklyBenefit': firestore.Increment(order_price * quantity),
                    f'billing.weeklyCost': firestore.Increment(average_price * quantity),
                    f'billing.monthlyBenefit': firestore.Increment(order_price * quantity),
                    f'billing.monthlyCost': firestore.Increment(average_price * quantity),
                    f'billing.historyBenefit': firestore.Increment(order_price * quantity),
                    f'billing.historyCost': firestore.Increment(average_price * quantity),
                    f'billing.dailyROI': ROI(data["billing"]["dailyBenefit"], (order_price * quantity), data["billing"]["dailyCost"], (average_price * quantity)),
                    f'billing.weeklyROI': ROI(data["billing"]["weeklyBenefit"], (order_price * quantity), data["billing"]["weeklyCost"], (average_price * quantity)),
                    f'billing.monthlyROI': ROI(data["billing"]["monthlyBenefit"], (order_price * quantity), data["billing"]["monthlyCost"], (average_price * quantity)),
                })
            else:
                # 判斷是否有獲利，有則撥10%，無則直接成交
                if (order_price - average_price) > 0:
                    profit_adj = (order_price - average_price) * quantity * 0.1
                    trader_ref = db.collection(u'account').document(
                        data["copyTrader"]["uid"])
                    trader_ref.update({
                        u'pocket.twd': firestore.Increment(profit_adj),
                    })
                    account_ref.update({
                        u'pocket_C.twd': firestore.Increment(order_price * quantity),
                        f'pocket_C.`{currency_id}`': quantity_method,
                        f'averagePrice_C.`{currency_id}`': average_price_value,
                        f'billing_C.dailyBenefit': firestore.Increment(order_price * quantity - profit_adj),
                        f'billing_C.dailyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.weeklyBenefit': firestore.Increment(order_price * quantity - profit_adj),
                        f'billing_C.weeklyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.monthlyBenefit': firestore.Increment(order_price * quantity - profit_adj),
                        f'billing_C.monthlyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.historyBenefit': firestore.Increment(order_price * quantity - profit_adj),
                        f'billing_C.historyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.dailyROI': ROI(data["billing"]["dailyBenefit"], (order_price * quantity - profit_adj), data["billing"]["dailyCost"], (average_price * quantity)),
                        f'billing_C.weeklyROI': ROI(data["billing"]["weeklyBenefit"], (order_price * quantity - profit_adj), data["billing"]["weeklyCost"], (average_price * quantity)),
                        f'billing_C.monthlyROI': ROI(data["billing"]["monthlyBenefit"], (order_price * quantity - profit_adj), data["billing"]["monthlyCost"], (average_price * quantity)),
                    })
                else:
                    account_ref.update({
                        u'pocket_C.twd': firestore.Increment(order_price * quantity),
                        f'pocket_C.`{currency_id}`': quantity_method,
                        f'averagePrice_C.`{currency_id}`': average_price_value,
                        f'billing_C.dailyBenefit': firestore.Increment(order_price * quantity),
                        f'billing_C.dailyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.weeklyBenefit': firestore.Increment(order_price * quantity),
                        f'billing_C.weeklyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.monthlyBenefit': firestore.Increment(order_price * quantity),
                        f'billing_C.monthlyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.historyBenefit': firestore.Increment(order_price * quantity),
                        f'billing_C.historyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.dailyROI': ROI(data["billing"]["dailyBenefit"], (order_price * quantity), data["billing"]["dailyCost"], (average_price * quantity)),
                        f'billing_C.weeklyROI': ROI(data["billing"]["weeklyBenefit"], (order_price * quantity), data["billing"]["weeklyCost"], (average_price * quantity)),
                        f'billing_C.monthlyROI': ROI(data["billing"]["monthlyBenefit"], (order_price * quantity), data["billing"]["monthlyCost"], (average_price * quantity)),
                    })
            # 掛市價賣出單
            tran_ref.set({
                u'uid': uid,
                u'currency_id': currency_id,
                u'currency_symbol': currency_symbol,
                u'direction': direction,
                u'deal_price': order_price,
                u'deal_time': order_time,
                u'deal_value': order_price * quantity,
                u'order_time': order_time,
                u'order_value': order_value,
                u'order_type': type,
                u'quantity': quantity,
                u'status': "已成交",
                u'profit': (order_price - average_price) * quantity - profit_adj,
                u'ROI': ((order_price - average_price) * quantity - profit_adj) / (average_price * quantity),
                u'isCopyTrade': is_copy_trade
            })

            print(
                f"{datetime.datetime.now()} 市價賣出成交:{tran_ref.id:20} 幣種:{currency_symbol.upper():5} 成交價格:{round(order_price,8):10} 賣出數量:{round(quantity,8)} ")
            print(
                f"獲益:{round(((order_price - average_price) * quantity - profit_adj),8)} 調整值:{round(profit_adj,8)} 調整前:{round(((order_price - average_price) * quantity),8)}")
            print(f"收入變動:{round((order_price * quantity - profit_adj),8)}")
        elif type == "limit":
            type = "限價"
            # 判斷是否清零
            if clear == True:
                quantity_method = firestore.DELETE_FIELD
            else:
                quantity_method = firestore.Increment(-quantity)
            # 判斷是否為跟單
            if is_copy_trade == True:
                account_ref.update({
                    f'pocket_C.`{currency_id}`': quantity_method,
                })
                tran_ref.set({
                    u'uid': uid,
                    u'currency_id': currency_id,
                    u'currency_symbol': currency_symbol,
                    u'direction': direction,
                    u'order_price': order_price,
                    u'order_time': order_time,
                    u'order_type': type,
                    u'order_value': order_value,
                    u'quantity': quantity,
                    u'status': "待成交",
                    u'isCopyTrade': True,
                    u'orig_trans': orig_trans_id
                })
            else:
                account_ref.update({
                    f'pocket.`{currency_id}`': quantity_method,
                })
                tran_ref.set({
                    u'uid': uid,
                    u'currency_id': currency_id,
                    u'currency_symbol': currency_symbol,
                    u'direction': direction,
                    u'order_price': order_price,
                    u'order_time': order_time,
                    u'order_type': type,
                    u'order_value': order_value,
                    u'quantity': quantity,
                    u'status': "待成交",
                    u'isCopyTrade': False,
                })
            print(
                f"{datetime.datetime.now()} 賣出掛單:{tran_ref.id:20} 幣種:{currency_symbol.upper():5} 價格:{round(order_price,8):10} 數量:{round(quantity,8)}")
            return tran_ref.id


def order_check_asyncio():
    asyncio.run(order_check())

# 逐一檢查幣種掛單


async def order_check():
    tasks = []
    # print(price_data["status"])
    if "twd" in price_data["status"]:
        for currency, price in price_data.items():
            if price != {}:
                tasks.append(trans_query(currency, price["twd"]))
    results = await asyncio.gather(*tasks, return_exceptions=True)


# 掛單查詢
async def trans_query(currency_id, price):
    col_ref = db.collection("transaction")
    buy_trans = col_ref.where("status", "==", "待成交").where("currency_id", "==", currency_id).where(
        "direction", "==", "買入").where("order_price", ">=", float(price)).stream()
    sell_trans = col_ref.where("status", "==", "待成交").where("currency_id", "==", currency_id).where(
        "direction", "==", "賣出").where("order_price", "<=", float(price)).stream()
    for doc in buy_trans:
        data = doc.to_dict()
        print(
            f"{datetime.datetime.now()} 限價買入成交:{doc.id:20} 幣種:{data['currency_symbol'].upper():5} 掛單價格:{round(data['order_price'],8):10} 現價:{price} 數量:{round(data['quantity'],8)}")
        order_deal(doc.id, data["uid"], "buy",
                   currency_id, data['order_price'], data['quantity'], data["isCopyTrade"])

    for doc in sell_trans:
        data = doc.to_dict()
        print(doc.id)
        print(
            f"{datetime.datetime.now()} 限價賣出成交:{doc.id:20} 幣種:{data['currency_symbol'].upper():5} 掛單價格:{round(data['order_price'],8):10} 現價:{price} 數量:{round(data['quantity'],8)}")
        order_deal(doc.id, data["uid"], "sell",
                   currency_id, data['order_price'], data['quantity'], data["isCopyTrade"], data['order_value'])
    return 0


# 修改掛單狀態及錢包餘額
def order_deal(order_id, user_id, type, currency_id, order_price, quantity, isCopyTrade, order_value: int | None = None):
    account_ref = db.collection(u'account').document(user_id)
    order_ref = db.collection(u'transaction').document(order_id)
    doc = account_ref.get()
    if type == "buy":
        if doc.exists:
            data = doc.to_dict()
            # 判斷是否為跟單
            if isCopyTrade == False:
                # 判斷有無成交均價
                if data["averagePrice"].get(currency_id) == None or data["averagePrice"][currency_id] == 0:
                    average_price_value = order_price
                else:
                    if data["pocket"].get(currency_id) != None:
                        currency_total_value = data["pocket"][currency_id]
                    else:
                        currency_total_value = 0
                    average_price_value = (((data["averagePrice"][currency_id] * currency_total_value) +
                                            (order_price * quantity)) / (currency_total_value + quantity))
            else:
                # 判斷有無成交均價
                if data["averagePrice_C"].get(currency_id) == None or data["averagePrice_C"][currency_id] == 0:
                    average_price_value = order_price
                else:
                    if data["pocket_C"].get(currency_id) != None:
                        currency_total_value = data["pocket_C"][currency_id]
                    else:
                        currency_total_value = 0
                    average_price_value = (((data["averagePrice_C"][currency_id] * currency_total_value) +
                                            (order_price * quantity)) / (currency_total_value + quantity))
        try:
            order_ref.update({
                f'deal_time': datetime.datetime.utcnow(),
                f'deal_price': order_price,
                f'status': "已成交"
            })
            if isCopyTrade == False:
                account_ref.update({
                    f'pocket.`{currency_id}`': firestore.Increment(quantity),
                    f'averagePrice.`{currency_id}`': average_price_value
                })
            else:
                account_ref.update({
                    f'pocket_C.`{currency_id}`': firestore.Increment(quantity),
                    f'averagePrice_C.`{currency_id}`': average_price_value
                })
            return 0
        except(e):
            return e
    elif type == "sell":
        if doc.exists:
            data = doc.to_dict()
            # 判斷是否跟單
            if isCopyTrade == False:
                average_price = data["averagePrice"][currency_id]
                # 判斷是否清零
                if data["pocket"].get(currency_id) == None:
                    average_price_value = 0
                else:
                    average_price_value = average_price
            else:
                average_price = data["averagePrice_C"][currency_id]
                # 判斷是否清零
                if data["pocket_C"].get(currency_id) == None:
                    average_price_value = 0
                else:
                    average_price_value = average_price
            # 收益調整值
            profit_adj = 0
        try:
            # 這邊要先判定是否為跟單再更新個別的錢包
            if isCopyTrade == False:
                account_ref.update({
                    f'pocket.twd': firestore.Increment(order_value),
                    f'averagePrice.`{currency_id}`': average_price_value,
                    f'billing.dailyBenefit': firestore.Increment(order_price * quantity),
                    f'billing.dailyCost': firestore.Increment(average_price * quantity),
                    f'billing.weeklyBenefit': firestore.Increment(order_price * quantity),
                    f'billing.weeklyCost': firestore.Increment(average_price * quantity),
                    f'billing.monthlyBenefit': firestore.Increment(order_price * quantity),
                    f'billing.monthlyCost': firestore.Increment(average_price * quantity),
                    f'billing.historyBenefit': firestore.Increment(order_price * quantity),
                    f'billing.historyCost': firestore.Increment(average_price * quantity),
                    f'billing.dailyROI': ROI(data["billing"]["dailyBenefit"], (order_price * quantity), data["billing"]["dailyCost"], (average_price * quantity)),
                    f'billing.weeklyROI': ROI(data["billing"]["weeklyBenefit"], (order_price * quantity), data["billing"]["weeklyCost"], (average_price * quantity)),
                    f'billing.monthlyROI': ROI(data["billing"]["monthlyBenefit"], (order_price * quantity), data["billing"]["monthlyCost"], (average_price * quantity)),
                })
            else:
                # 判斷是否有獲利，有則撥10%，無則直接成交
                if (order_price - average_price) > 0:
                    profit_adj = (order_price - average_price) * quantity * 0.1
                    trader_ref = db.collection(u'account').document(
                        data["copyTrader"]["uid"])
                    trader_ref.update({
                        u'pocket.twd': firestore.Increment(profit_adj),
                    })
                    account_ref.update({
                        u'pocket_C.twd': firestore.Increment(order_price * quantity),
                        f'averagePrice_C.`{currency_id}`': average_price_value,
                        f'billing_C.dailyBenefit': firestore.Increment(order_price * quantity - profit_adj),
                        f'billing_C.dailyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.weeklyBenefit': firestore.Increment(order_price * quantity - profit_adj),
                        f'billing_C.weeklyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.monthlyBenefit': firestore.Increment(order_price * quantity - profit_adj),
                        f'billing_C.monthlyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.historyBenefit': firestore.Increment(order_price * quantity - profit_adj),
                        f'billing_C.historyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.dailyROI': ROI(data["billing_C"]["dailyBenefit"], (order_price * quantity - profit_adj), data["billing_C"]["dailyCost"], (average_price * quantity)),
                        f'billing_C.weeklyROI': ROI(data["billing_C"]["weeklyBenefit"], (order_price * quantity - profit_adj), data["billing_C"]["weeklyCost"], (average_price * quantity)),
                        f'billing_C.monthlyROI': ROI(data["billing_C"]["monthlyBenefit"], (order_price * quantity - profit_adj), data["billing_C"]["monthlyCost"], (average_price * quantity)),
                    })
                else:
                    account_ref.update({
                        u'pocket_C.twd': firestore.Increment(order_price * quantity),
                        f'averagePrice_C.`{currency_id}`': average_price_value,
                        f'billing_C.dailyBenefit': firestore.Increment(order_price * quantity),
                        f'billing_C.dailyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.weeklyBenefit': firestore.Increment(order_price * quantity),
                        f'billing_C.weeklyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.monthlyBenefit': firestore.Increment(order_price * quantity),
                        f'billing_C.monthlyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.historyBenefit': firestore.Increment(order_price * quantity),
                        f'billing_C.historyCost': firestore.Increment(average_price * quantity),
                        f'billing_C.dailyROI': ROI(data["billing_C"]["dailyBenefit"], (order_price * quantity), data["billing_C"]["dailyCost"], (average_price * quantity)),
                        f'billing_C.weeklyROI': ROI(data["billing_C"]["weeklyBenefit"], (order_price * quantity), data["billing_C"]["weeklyCost"], (average_price * quantity)),
                        f'billing_C.monthlyROI': ROI(data["billing_C"]["monthlyBenefit"], (order_price * quantity), data["billing_C"]["monthlyCost"], (average_price * quantity)),
                    })
            order_ref.update({
                f'deal_time': datetime.datetime.utcnow(),
                f'deal_price': order_price,
                f'status': "已成交",
                u'profit': (order_price - average_price) * quantity - profit_adj,
                u'ROI': ((order_price - average_price) * quantity - profit_adj) / (average_price * quantity)
            })
            print(
                f"{datetime.datetime.now()} 限價賣出成交:{order_ref.id:20} 幣種:{currency_id.upper():5} 成交價格:{round(order_price,8):10} 賣出數量:{round(quantity,8)} ")
            print(
                f"獲益:{round(((order_price - average_price) * quantity - profit_adj),8)} 調整值:{round(profit_adj,8)} 調整前:{round(((order_price - average_price) * quantity),8)}")
            print(f"收入變動:{round((order_price * quantity - profit_adj),8)}")

            return 0
        except(e):
            return e
    else:
        return False

# 刪單


@ app.post('/del_tran')
def delete_tran(item: Del_Item):
    # 驗證id token
    result = id_auth(item.id_token)
    if result == False:
        raise HTTPException(status_code=401, detail="Unauthorized")

    target_ref = db.collection(u'transaction').document(item.target_id)
    target_doc = target_ref.get()
    if target_doc.exists:
        target_data = target_doc.to_dict()
        # 搜尋複製單
        docs = db.collection(u'transaction').where(
            u'orig_trans', u'==', target_doc.id).stream()
        for doc in docs:
            data = doc.to_dict()
            # 更新跟單者錢包餘額
            if data["direction"] == "買入":
                db.collection(u'account').document(data["uid"]).update({
                    f'pocket_C.twd': firestore.Increment(data["order_value"])
                })
            else:
                db.collection(u'account').document(data["uid"]).update({
                    f'pocket_C.{data["currency_id"]}': firestore.Increment(data["quantity"])
                })
            # 刪除複製單
            ref = db.collection(u'transaction').document(doc.id)
            ref.delete()

        # 更新自身錢包餘額
        if target_data["direction"] == "買入":
            db.collection(u'account').document(target_data["uid"]).update({
                f'pocket.twd': firestore.Increment(target_data["order_value"])
            })
        else:
            db.collection(u'account').document(target_data["uid"]).update({
                f'pocket.{target_data["currency_id"]}': firestore.Increment(target_data["quantity"])
            })
        # 刪除目標單
        target_ref.delete()
    return {'status': 'success'}


# 重製帳務資料


def reset_billing_daily():
    year = datetime.datetime.now().strftime("%Y")
    month = datetime.datetime.now().strftime("%m")
    day = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%d")
    accounts = db.collection('account').stream()
    for acc in accounts:
        doc = db.collection('account').document(acc.id)
        doc_data = doc.get().to_dict()
        roi_doc = doc.collection('ROI').document(year + '_' + month)
        roi_data = roi_doc.get()
        newDailyValue = doc_data["billing"]["dailyCost"] + \
            doc_data["billing_C"]["dailyCost"]
        if roi_data.exists:
            roi_doc.update({
                f'{day}': doc_data["billing"]["dailyROI"]
            })
        else:
            roi_doc.set({
                f'{day}': doc_data["billing"]["dailyROI"]
            })
        doc.update({
            f'adCount': 0,
            f'billing.dailyBenefit': 0,
            f'billing.dailyCost': 0,
            f'billing.dailyROI': 0,
            f'billing_C.dailyBenefit': 0,
            f'billing_C.dailyCost': 0,
            f'billing_C.dailyROI': 0,
            f'averageDailyValue': newDailyValue
        })


def reset_billing_weekly():
    year = datetime.datetime.now().strftime("%Y")
    month = datetime.datetime.now().strftime("%m")
    day = datetime.datetime.now().strftime("%d")
    week = int(day) // 7 + 1
    accounts = db.collection('account').stream()

    for acc in accounts:
        doc = db.collection('account').document(acc.id)
        doc_data = doc.get().to_dict()
        roi_doc = doc.collection('ROI').document(year + '_' + month)
        roi_data = roi_doc.get()
        if roi_data.exists:
            roi_doc.update({
                f'week{week}': doc_data["billing"]["weeklyROI"]
            })
        award_doc = doc.collection('award').document(
            year + '_' + month + '_' + str(week))
        if doc_data["billing"]["weeklyROI"] > 0:
            award_value = round(
                doc_data["billing"]["weeklyROI"], 2) * 100 * 10000
        else:
            award_value = 0
        award_doc.set({
            u'ROI': doc_data["billing"]["weeklyROI"],
            u'endTime': datetime.datetime.utcnow(),
            u'startTime': datetime.datetime.utcnow() - datetime.timedelta(days=7),
            u'status': False,
            u'value': award_value
        })
        doc.update({
            f'billing.weeklyBenefit': 0,
            f'billing.weeklyCost': 0,
            f'billing.weeklyROI': 0,
            f'billing_C.weeklyBenefit': 0,
            f'billing_C.weeklyCost': 0,
            f'billing_C.weeklyROI': 0,
        })


def reset_billing_monthly():
    year = datetime.datetime.now().strftime("%Y")
    lastMonth = str(int(datetime.datetime.now().strftime("%m")) - 1)
    accounts = db.collection('account').stream()
    print(year + '_0' + lastMonth)
    for acc in accounts:
        doc = db.collection('account').document(acc.id)
        doc_data = doc.get().to_dict()
        roi_doc = doc.collection('ROI').document(year + '_0' + lastMonth)
        roi_data = roi_doc.get()
        if roi_data.exists:
            roi_doc.update({
                f'month': doc_data["billing"]["monthlyROI"]
            })
        profit = doc_data["billing"]["monthlyBenefit"] - \
            doc_data["billing"]["monthlyCost"]
        doc.update({
            f'billing.monthlyBenefit': 0,
            f'billing.monthlyCost': 0,
            f'billing.monthlyROI': 0,
            f'billing.lastMonthROI': doc_data["billing"]["monthlyROI"],
            f'billing.lastMonthProfit': profit,
            f'billing_C.monthlyBenefit': 0,
            f'billing_C.monthlyCost': 0,
            f'billing_C.monthlyROI': 0,
            f'billing_C.lastMonthROI': doc_data["billing_C"]["monthlyROI"],
            f'billing_C.lastMonthProfit': profit,
        })


reset_billing_weekly()
