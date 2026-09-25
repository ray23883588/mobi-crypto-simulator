import time
import requests
from bs4 import BeautifulSoup 
import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

cred = credentials.Certificate(
    os.environ.get('FIREBASE_CREDENTIALS', 'serviceAccount.json'))
firebase_admin.initialize_app(cred)
db = firestore.client()

while True:

  i = 0

  webUrl = "https://www.ptt.cc/bbs/DigiCurrency/index.html"
  r = requests.get(webUrl)
  soup = BeautifulSoup(r.text,"html.parser")
  sel = soup.select("div.title a")
  selDate = soup.select("div.date")
  if len(sel) < 8:
    sel_1 = sel
    selDate_1 = selDate
    u = soup.select("div.btn-group.btn-group-paging a")
    webUrl = "https://www.ptt.cc"+ u[1]["href"]
    r = requests.get(webUrl)
    soup = BeautifulSoup(r.text,"html.parser")
    sel = soup.select("div.title a") + sel_1
    selDate = soup.select("div.date") + selDate_1

  collection_ref = db.collection("blog")

  for s in reversed(sel):
    i += 1
    if 6 <= i <=8:
      title = s.text
      url = "https://www.ptt.cc" + s["href"]
      data = {
        'title': title,
        'url': url,
      }
      results = collection_ref.where('order', '==', (i - 5)).get()
      for item in results:
        doc = collection_ref.document(item.id)
        doc.update(data)
    if i == 8:
      break

  i = 0

  for d in reversed(selDate):
    i += 1
    if 6 <= i <=8:
      date = "2022/0" + d.text.strip(" ")
      data = {
        'date': date
      }
      results = collection_ref.where('order', '==', (i - 5)).get()
      for item in results:
        doc = collection_ref.document(item.id)
        doc.update(data)
    if i == 8:
      break

  print("fetch")
  time.sleep(1800)
