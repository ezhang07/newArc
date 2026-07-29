import numpy as np
import pandas as pd

TAG_COLUMNS = ["genres", "themes"]

class Vectorizer:
    def __init__(self, df: pd.DataFrame):
        self.tag_map = self._build_tag_map(df)   # {tag_string: column_index}
        self.dim = len(self.tag_map)             # 73 for the current catalog

    def _build_tag_map(self, df: pd.DataFrame) -> dict:
        vocabulary = set()

        # for every anime, add the genres and themes into a set, to create the vocabulary needed for the vector matrix
        for a in df["genres"]:
            for genre in a:
                vocabulary.add(genre)
        for a in df["themes"]:
            for theme in a:
                vocabulary.add(theme)

        sorted_vocab = sorted(vocabulary)
        # create dict mapping to all different genres/themes
        tag_map = {}
        for n, t in enumerate(sorted_vocab):
            tag_map[t] = n

        return tag_map

    def encode_catalog(self, df: pd.DataFrame) -> np.ndarray:
        # make matrix
        matrix = np.zeros((len(df), self.dim), dtype=np.float32)

        for i, (genres, themes) in enumerate(zip(df["genres"], df["themes"])):
             # iterate the list of genres for said anime, then in the matrix, map to the specific anime and then tag_map to find the column of that tag
            for tag in genres:
                matrix[i][self.tag_map[tag]] = 1
            for tag in themes:
                matrix[i][self.tag_map[tag]] = 1

        return matrix
