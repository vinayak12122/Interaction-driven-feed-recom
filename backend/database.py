import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,DeclarativeBase

load_dotenv()

db = os.getenv("DB_URL")

if db and db.startswith("postgresql://"):
    db = db.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(db,connect_args={"sslmode": "require"})

SessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()