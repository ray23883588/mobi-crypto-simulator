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

    r = requests.get("https://blockcast.it/")  # 將網頁資料GET下來
    soup = BeautifulSoup(r.text, "html.parser")  # 將網頁資料以html.parser
    sel = soup.select(
        "div.jeg_posts article.jeg_pl_md_1 div.jeg_postblock_content h3.jeg_post_title a")
    selDate = soup.select(
        "div.jeg_posts article.jeg_pl_md_1 div.jeg_postblock_content div.jeg_meta_date a")
    selImage = soup.select(
        "div.jeg_posts article.jeg_pl_md_1 div.jeg_thumb a div img")
    collection_ref = db.collection("news")

    for s in sel:
        i += 1
        if 1 <= i <= 3:
            title = s.text
            url = s["href"]
            data = {
                'title': title,
                'url': url,
            }
            results = collection_ref.where('order', '==', i).get()
            for item in results:
                doc = collection_ref.document(item.id)
                doc.update(data)
        if i == 3:
            break

    i = 0

    for d in selDate:
        i += 1
        if 1 <= i <= 3:
            date = d.text.strip(" ")
            data = {
                'date': date
            }
            results = collection_ref.where('order', '==', i).get()
            for item in results:
                doc = collection_ref.document(item.id)
                doc.update(data)
        if i == 3:
            break

    i = 0

    for j in selImage:
        i += 1
        if 1 <= i <= 3:
            src = j["src"]
            data = {
                'img': src
            }
            results = collection_ref.where('order', '==', i).get()
            for item in results:
                doc = collection_ref.document(item.id)
                doc.update(data)
        if i == 3:
            break

    print("fetch")
    time.sleep(1800)
