import pandas as pd
from sklearn.linear_model import LogisticRegression
import numpy as np

GENRE_FEATURES = [
    'action', 'adventure', 'animation', 'biography', 'comedy', 'crime', 
    'documentary', 'drama', 'family', 'fantasy', 'history', 'horror', 
    'music', 'musical', 'mystery', 'not_available', 'news', 'reality_tv', 
    'romance', 'sci_fi', 'short', 'sport', 'thriller', 'war', 'western'
]

def get_recommendation(user_history_df,all_movies_df,top_n=20):
    # user_history_df: DataFrame of movies the user liked/skipped (from interaction table)
    # all_movies_df: DataFrame of all 2000 movies from the movies table


    if len(user_history_df) < 5:
        return all_movies_df.sample(top_n)
    
    try:
        # Training
        X_train = user_history_df[GENRE_FEATURES]
        y_train = user_history_df['liked']

        unique_classes = y_train.unique()

        seen_ids = user_history_df['id'].values
        candidates = all_movies_df[~all_movies_df['id'].isin(seen_ids)].copy()

        if len(candidates) == 0:
            return all_movies_df.sample(min(top_n,len(all_movies_df))).reset_index(drop=True)
        
        if len(unique_classes) < 2:
            single_class = unique_classes[0]
            if single_class == 1:
                liked_genres = X_train.sum().sort_values(ascending=False)
                top_genre = liked_genres.index[0]
                smart_picks = candidates[candidates[top_genre] == 1].head(top_n)
                
                if len(smart_picks) < top_n:
                    remaining = candidates[~candidates['id'].isin(smart_picks['id'])]
                    padding = remaining.sample(min(top_n - len(smart_picks), len(remaining)))
                    smart_picks = pd.concat([smart_picks, padding])
                
                return smart_picks.sample(frac=1).reset_index(drop=True)
            else:
                return candidates.sample(min(top_n, len(candidates))).reset_index(drop=True)
            

        model = LogisticRegression(solver="liblinear")
        model.fit(X_train,y_train)


        probs = model.predict_proba(candidates[GENRE_FEATURES])[:,1]
        candidates['score'] = probs

        smart_count = int(top_n * 0.6)
        smart_picks = candidates.sort_values(by="score", ascending=False).head(smart_count)

        needed_count = top_n - len(smart_picks)

        remaining_candidates = candidates[~candidates['id'].isin(smart_picks['id'])]
        discovery_picks = remaining_candidates.sample(n=min(needed_count, len(remaining_candidates)))

        final_feed = pd.concat([smart_picks, discovery_picks])

        if len(final_feed) < top_n:
            more_needed = top_n - len(final_feed)
            safety_pool = all_movies_df[~all_movies_df['id'].isin(seen_ids) & ~all_movies_df['id'].isin(final_feed['id'])]
            extra_padding = safety_pool.sample(n=min(more_needed, len(safety_pool)))
            final_feed = pd.concat([final_feed, extra_padding])

        return final_feed.sample(frac=1).reset_index(drop=True)
    
    except Exception as e:
        print(f"Recommender Error: {e}")
        return all_movies_df.sample(top_n)