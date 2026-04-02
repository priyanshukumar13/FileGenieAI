from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings
from fastapi import HTTPException
import logging

settings = get_settings()

client: AsyncIOMotorClient | None = None
db = None


async def connect_to_mongo():
    global client, db

    if not settings.mongodb_uri:
        logging.warning("⚠️ MONGODB_URI is not set. Database will not be connected.")
        return

    try:
        import certifi
        client = AsyncIOMotorClient(settings.mongodb_uri, tlsCAFile=certifi.where())

        # ✅ BEST PRACTICE → uses DB from URI automatically
        db = client.get_default_database()

        # 🔥 Optional: force connection check
        await client.admin.command("ping")

        logging.info("✅ Connected to MongoDB successfully!")

    except Exception as e:
        logging.error(f"❌ Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    global client

    if client:
        client.close()
        logging.info("🔌 Closed MongoDB connection.")


def get_db():
    if db is None:
        raise HTTPException(
            status_code=500,
            detail="Database is not connected"
        )
    return db