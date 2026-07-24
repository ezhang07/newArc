import argparse
import json
import time
import urllib.request
from pathlib import Path


BASE_URL = "https://api.tenrai.org/v1/top/anime"
RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"

THROTTLE_SECONDS = 1.5   # pause between requests (rate limit)
REQUEST_TIMEOUT = 25     # seconds before request gives up
DEFAULT_PAGES = 200      


# fetch to tenrai api
def get_json(url: str) -> dict:
   req = urllib.request.Request(url, headers={"User-Agent": "newArc-ingest"})
   with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
      return json.loads(resp.read())

# helper including retries if call fails
def fetch_with_retry(url: str) -> dict:
   for attempt in range(5):
      try:
         return get_json(url)
         
      except Exception as e:
         wait = 2 ** attempt
         print(f"fetch failed, retrying in {wait}s")
         time.sleep(wait)
   raise RuntimeError(f"failed to fetch after 5 attempts: {url}")
   
# scraper script
def main(target_pages: int) -> None:
   RAW_DIR.mkdir(parents=True, exist_ok=True)

   for page in range(1, target_pages + 1):
      out_file = RAW_DIR / f"page_{page:04d}.json" # make file to store get request from api

      if out_file.exists(): # already have page, skip
         continue

      res = fetch_with_retry(BASE_URL+f"?page={page}") # call to tenrai api

      out_file.write_text(json.dumps(res), encoding="utf-8") # serialize res into json file and put into path

      print(f'page {page} had {len(res["data"])} anime.') # progress check
      if not res["pagination"]["has_next_page"]: # if no more pages, end loop
         print("no more pages left")
         break
      time.sleep(THROTTLE_SECONDS) # rate limiting 

   print("fetch complete")


if __name__ == "__main__":
   parser = argparse.ArgumentParser(description="Pull the anime catalog from Tenrai.")
   parser.add_argument("--pages", type=int, default=DEFAULT_PAGES,
                     help="Pages to fetch (25 anime each).")
   args = parser.parse_args()
   main(args.pages)
