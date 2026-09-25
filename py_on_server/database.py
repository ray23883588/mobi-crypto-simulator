# 引用必要套件
import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

a = input()

# 引用私密金鑰
# path/to/serviceAccount.json 請用自己存放的路徑
cred = credentials.Certificate(
    os.environ.get('FIREBASE_CREDENTIALS', 'serviceAccount.json'))

# 初始化firebase，注意不能重複初始化
firebase_admin.initialize_app(cred)

# 初始化firestore
db = firestore.client()

doc = {
  'order': 3,
  'title': "[閒聊] NFT事件對ETH影響",
  'url': "https://www.ptt.cc/bbs/DigiCurrency/M.1645434425.A.8DA.html",
  'date': "2022/02/23",
  'img': ""
}

# 語法
# collection_ref = db.collection("集合路徑")

collection_ref = db.collection("blog")
# collection_ref提供一個add的方法，input必須是文件，型別是dictionary

collection_ref.add(doc)

# path = "account"
# # collection_ref = db.collection(path)
docs = collection_ref.get()
for doc in docs:
  print("文件內容：{}".format(doc.to_dict()))