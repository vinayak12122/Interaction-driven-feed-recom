from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI,Depends,Query,HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import select,text
import pandas as pd
import uvicorn
import os

from database import engine,get_db,Base
import db_models
import models
from recommender import get_recommendation,GENRE_FEATURES

Base.metadata.create_all(bind=engine)

port = int(os.environ.get("PORT", 2006))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://feed-three-sand.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=['*'],
)

app.mount(
    "/images", 
    StaticFiles(directory="Images", html=True), 
    name="images"
)

@app.middleware("http")
async def add_cache_control_header(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/images"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response

@app.get('/feed')
def read_feed(session_id:str=Query(...),limit: int = Query(20),db:Session=Depends(get_db)):
    # Step 1 - Fetch All Movies
    all_movies = db.execute(select(db_models.Movie)).scalars().all()

    movies_list = [
        {k:v for k,v in m.__dict__.items() if k != '_sa_instance_state'} for m in all_movies
    ]
    all_movies_df = pd.DataFrame(movies_list)

    # Step 2 - Fetch User Histroy
    history = db.execute(
        select(db_models.Interaction,db_models.Movie).join(db_models.Movie,db_models.Interaction.movie_id == db_models.Movie.id).where(db_models.Interaction.session_id == session_id)
    ).all()

    if not history:
        return all_movies_df.sample(20)[['id', 'genre_list', 'poster_url']].to_dict(orient='records')
    
    # Step 3 - Preparing Training Data
    user_data = []
    for inter,movie in history:
        m_dict = {k: v for k, v in movie.__dict__.items() if k != '_sa_instance_state'}
        m_dict['liked'] = inter.liked
        user_data.append(m_dict)
    
    user_history_df = pd.DataFrame(user_data)

    recommended_df = get_recommendation(user_history_df,all_movies_df,top_n=limit)

    return recommended_df[['id', 'genre_list', 'poster_url']].to_dict(orient="records")

@app.post('/interact')
def post_interact(batch:models.InteractionBatch,db:Session=Depends(get_db)):
    for item in batch.interactions:
        new_interaction = db_models.Interaction(
            session_id =item.session_id,
            movie_id = item.movie_id,
            liked = item.liked
        )
        db.add(new_interaction)

    db.commit()
    return {"status": "success", "processed": len(batch.interactions)}

@app.get('/download/{filename}')
async def download(filename: str):
    file_path = os.path.join('images', filename)

    if not os.path.exists(file_path):
        print(f"DEBUG: Looking for file at {file_path}")
        raise HTTPException(status_code=404, detail=f"Image {filename} not found")
    
    return FileResponse(
        path=file_path, 
        filename=filename, 
        media_type='application/octet-stream'
    )

from sqlalchemy import text

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("SELECT * FROM movies WHERE id = :id"),
            {"id": "tt0086425"}
        )
        
        data = result.fetchall()

        return {
            "status": "connected",
            "data": [dict(row._mapping) for row in data]
        }

    except Exception as e:
        return {"status": "error", "details": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=port)