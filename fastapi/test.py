import requests
import grequests
import time
import json
import asyncio
from firebase_admin import credentials
from firebase_admin import firestore
import firebase_admin
import os

cred = credentials.Certificate(
    os.environ.get("FIREBASE_CREDENTIALS", "firebase-mobi.json"))
firebase_admin.initialize_app(cred)
db = firestore.client()


def err_handler(request, exception):
    print(f"請求失敗:{exception}")


def now(): return time.time()


async def trans_query(currency, price):
    col_ref = db.collection("transaction")
    buy_trans = col_ref.where("status", "==", "待成交").where("currency", "==", currency).where(
        "direction", "==", "買入").where("order_price", ">=", float(price)).stream()
    sell_trans = col_ref.where("status", "==", "待成交").where("currency", "==", currency).where(
        "direction", "==", "賣出").where("order_price", "<=", float(price)).stream()
    for doc in sell_trans:
        data = doc.to_dict()
        print(
            f"賣出成交:{doc.id:20} 幣種:{data['currency']:5} 價格:{data['order_price']:10} 數量:{data['quantity']} 現價:{price}")
    for doc in buy_trans:
        data = doc.to_dict()
        print(
            f"買入成交:{doc.id:20} 幣種:{data['currency']:5} 價格:{data['order_price']:10} 數量:{data['quantity']} 現價:{price}")


async def main():
    req_list = [
        grequests.get(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=twd&order=market_cap_desc&ids=bitcoin,ethereum,tether,binancecoin,usd-coin,solana,terra-luna,ripple,cardano,avalanche-2,polkadot,dogecoin,binance-usd,terrausd,shiba-inu,wrapped-bitcoin,crypto-com-chain,matic-network,near,staked-ether,cosmos,dai,litecoin,chainlink,tron,bitcoin-cash,ftx-token,ethereum-classic,algorand,stellar,leo-token,okb,uniswap,vechain,axie-infinity,internet-computer,hedera-hashgraph,filecoin,waves,elrond-erd-2,decentraland,the-sandbox,fantom,theta-token,monero,compound-ether,tezos,the-graph,apecoin,thorchain,aave,klay-token,osmosis,eos,pancakeswap-token,magic-internet-money,helium,frax,flow,iota,defichain,frax-share,zcash,zilliqa,ecash,convex-finance,maker,bittorrent,harmony,arweave,gala,neo,cdai,theta-fuel,bitcoin-cash-sv,huobi-btc,compound-usd-coin,quant-network,kusama,celo,enjincoin,kucoin-shares,havven,blockstack,chiliz,huobi-token,radix,loopring,nexo,lido-dao,stepn,dash,amp-token,basic-attention-token,true-usd,celsius-degree-token,mina-protocol,humans-ai,kadena,juno-network,holotoken,bitdao,curve-dao-token,moonbeam,compound-governance-token,smooth-love-potion,nem,oasis-network,gatechain-token,secret,link,paxos-standard,xido-finance,iotex,pocket-network,neutrino,msol,skale,decred,iostoken,qtum,sushi,yearn-finance,audius,omisego,1inch,ecomi,nxm,gnosis,swipe,anchor-protocol,icon,ankr,kava,defi-kingdoms,wax,bitkub-coin,xdce-crowd-sale,bitcoin-gold,ravencoin,0x,livepeer,bancor,render-token,radio-caca,compound-usdt,siacoin,dydx,safemoon-2,pax-gold,rocket-pool,zencash,acala,immutable-x,woo-network,oec-token,renbtc,sapphire,e-radix,synapse-2,ontology,dogelon-mars,looksrare,songbird,rally-2,fei-usd,golem,convex-crv,spell-token,just,uma,telcoin,olympus,digibyte,apenft,baby-doge-coin,velas,mobox,bitclout,liquity-usd,tether-gold,ethereum-name-service,polymath,republic-protocol,swissborg,everdome,trust-wallet-token,lido-staked-sol,constellation-labs,nucypher,casper-network,zelcash,hive,astar,serum,illuvium,syscoin,playdapp,pirate-chain,metis-token,nervos-network,vulcan-forged,nano,tomb,tenset,keep-network,astroport,celer-network,lisk,persistence,chromaway,constitutiondao,wink,ultra,dent,perpetual-protocol,coin98,vvs-finance,raydium,tokemak,fetch-ai,kyber-network-crystal,ichi-farm,mmfinance,wazirx,floki-inu,moonriver,coti,injective-protocol,xsushi,dopex,xyo-network,flex-coin,ufo-gaming,aurora-near,husd,fx-coin,status,merit-circle,medibloc,joe,gmx,mimatic,conflux-token,origin-protocol,gemini-dollar,api3,ocean-protocol,mask-network,yield-guild-games&sparkline=false")
    ]
    res_list = grequests.map(req_list, exception_handler=err_handler)
    tasks = []
    for i in res_list:
        data = json.loads(i.text)
        for currency in data:
            tasks.append(trans_query(
                currency["symbol"].upper(), currency["current_price"]))

    results = await asyncio.gather(*tasks, return_exceptions=True)


def test():
    price_data = ""
    with open('assets/price_data.txt', 'r') as outfile:
        price_data = json.load(outfile)

    with open('assets/id_symbol.txt', 'r', encoding="utf-8") as outfile:
        data = json.load(outfile)
        for i in data:
            if price_data.get(i["id"]) != None:
                print('"' + i["id"]+'"' + ':' +
                      '{' + '"symbol":'+'"' + i["symbol"]+'"'+'}'+',')


if __name__ == "__main__":
    start = now()
    # asyncio.run(main())
    test()
    print('TIME:', now() - start)
