from sqlalchemy import Column,Integer,String,ForeignKey,DateTime
from sqlalchemy.sql import func
from database import Base
from sqlalchemy.orm import Mapped,mapped_column

class Movie(Base):
    __tablename__ = "movies"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    genre_list: Mapped[str] = mapped_column(String)
    poster_url: Mapped[str] = mapped_column(String)
    
    # Genre Features (Matches your new_train.csv columns)
    action: Mapped[int] = mapped_column(Integer, default=0)
    adventure: Mapped[int] = mapped_column(Integer, default=0)
    animation: Mapped[int] = mapped_column(Integer, default=0)
    biography: Mapped[int] = mapped_column(Integer, default=0)
    comedy: Mapped[int] = mapped_column(Integer, default=0)
    crime: Mapped[int] = mapped_column(Integer, default=0)
    documentary: Mapped[int] = mapped_column(Integer, default=0)
    drama: Mapped[int] = mapped_column(Integer, default=0)
    family: Mapped[int] = mapped_column(Integer, default=0)
    fantasy: Mapped[int] = mapped_column(Integer, default=0)
    history: Mapped[int] = mapped_column(Integer, default=0)
    horror: Mapped[int] = mapped_column(Integer, default=0)
    music: Mapped[int] = mapped_column(Integer, default=0)
    musical: Mapped[int] = mapped_column(Integer, default=0)
    mystery: Mapped[int] = mapped_column(Integer, default=0)
    not_available: Mapped[int] = mapped_column(Integer, default=0)
    news: Mapped[int] = mapped_column(Integer, default=0)
    reality_tv: Mapped[int] = mapped_column(Integer, default=0)
    romance: Mapped[int] = mapped_column(Integer, default=0)
    sci_fi: Mapped[int] = mapped_column(Integer, default=0)
    short: Mapped[int] = mapped_column(Integer, default=0)
    sport: Mapped[int] = mapped_column(Integer, default=0)
    thriller: Mapped[int] = mapped_column(Integer, default=0)
    war: Mapped[int] = mapped_column(Integer, default=0)
    western: Mapped[int] = mapped_column(Integer, default=0)

class Interaction(Base):
    __tablename__ = "interaction"

    id:Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id:Mapped[str] = mapped_column(String, nullable=False)
    movie_id:Mapped[str] = mapped_column(String, ForeignKey("movies.id"), nullable=False)
    liked:Mapped[str] = mapped_column(Integer, nullable=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
