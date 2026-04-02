from pymongo import MongoClient
import os

# get URI from .env
uri = os.getenv("MONGODB_URI")

try:
    client = MongoClient(uri)

    # 🔥 this actually checks connection
    client.admin.command('ping')

    print("✅ MongoDB Connected Successfully!")

except Exception as e:
    print("❌ Connection Failed:", e)