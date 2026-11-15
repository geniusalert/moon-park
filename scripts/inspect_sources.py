from urllib.request import urlopen
from html.parser import HTMLParser
from pathlib import Path

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'a' and any(s in a.get('href', '') for s in ['README', 'Site01_final_adj_5mpp_surf', 'Site04_final_adj_5mpp_surf', 'Site11_final_adj_5mpp_surf']):
            print(a['href'])

raw = urlopen('https://pgda.gsfc.nasa.gov/products/78', timeout=60).read()
Path('data/raw/pgda.html').write_bytes(raw)
Links().feed(raw.decode())
