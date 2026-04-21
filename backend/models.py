from pydantic import BaseModel
from typing import List

class InteractionSchema(BaseModel):
    session_id:str
    movie_id:str
    liked:int

class InteractionBatch(BaseModel):
    interactions:List[InteractionSchema]

class MovieResponse(BaseModel):
    id:str
    genre_list :str
    poster_url:str

    class Config:
        from_attributes = True