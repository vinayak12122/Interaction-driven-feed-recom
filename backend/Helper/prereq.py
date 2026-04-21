import os
import pandas as pd
import sqlalchemy
from dotenv import load_dotenv

load_dotenv()

db_user = os.getenv("DB_USERNAME")
db_pass = os.getenv("DB_PASSWORD")
db_name = os.getenv("DB_NAME")

df = pd.read_csv('dataset/new_train.csv').head(2000)


engine = sqlalchemy.create_engine(f"postgresql://{db_user}:{db_pass}@localhost/{db_name}")

df.to_sql('movies',engine,if_exists='append',index=False)
