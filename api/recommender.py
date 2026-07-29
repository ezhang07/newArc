import re
from pathlib import Path

import numpy as np
import pandas as pd

from .vectorizer import Vectorizer

# repo_root/data/anime.parquet  (this file lives in repo_root/api/)
DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "anime.parquet"

# temp fix to merge franchises
def franchise_key(title: str) -> str:
    key = title.lower()
    key = key.split(":")[0]
    key = re.sub(r"\b(season|part|cour|final|the final chapters?|movie|film|ova|oad|ona|special|tv|recaps?)\b", " ", key)
    key = re.sub(r"\b[ivx]+\b", " ", key)
    key = re.sub(r"\d+", " ", key)
    key = re.sub(r"[^a-z0-9]+", " ", key)
    key = re.sub(r"\s+", " ", key).strip()
    return key


class Recommender:
    """Holds the precomputed index and answers recommendation requests."""

    def __init__(self, df: pd.DataFrame, matrix: np.ndarray):
        self.df = df
        self.matrix = matrix
        # Precompute item norms once (they never change) so per-request cosine only has to norm the taste vector
        self.item_norms = np.linalg.norm(matrix, axis=1)
        # title -> row index, for turning a user's liked titles into matrix rows
        self.title_to_row = {t: i for i, t in enumerate(df["title"])}

    def recommend(self, liked: list[str], top_n: int = 10) -> list[dict]:
        # PER-REQUEST path: build the taste vector, score every anime, rank.
        rows = []
        for anime in liked:
            if anime in self.title_to_row:
                rows.append(self.matrix[self.title_to_row[anime]])

        if not rows: # all titles were unknown to db, so just return nothing
            return []
        
        taste_vector = np.mean(rows, axis=0)

        # cosine similarity formula
        numerators = self.matrix @ taste_vector

        taste_norm = np.linalg.norm(taste_vector)
        anime_norms = self.item_norms

        # division/ unsorted results of all anime in the cosine similarity formula
        scores = numerators / (taste_norm * anime_norms)

        order = np.argsort(scores)[::-1]

        return self._rank(order=order, scores=scores, liked=liked, top_n=top_n)


    def _rank(self, order, scores, liked, top_n) -> list[dict]:
        # Walk the ranked order, skip inputs + duplicate franchises, take top_n.
        seen = {franchise_key(t) for t in liked}
        results = []
        for index in order:
            if len(results) >= top_n:
                break
            title = self.df["title"].iloc[index]
            if title in liked:
                continue
            key = franchise_key(title)
            if key in seen:
                continue
            seen.add(key)
            results.append({"title": title, "score": float(scores[index])})
        return results


def build_recommender() -> Recommender:
    """STARTUP path: load catalog -> build matrix -> return a ready Recommender."""
    df = pd.read_parquet(DATA_FILE)
    vectorizer = Vectorizer(df)
    matrix = vectorizer.encode_catalog(df)
    return Recommender(df, matrix)
