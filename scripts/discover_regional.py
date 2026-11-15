from html.parser import HTMLParser
from urllib.request import urlopen

class Links(HTMLParser):
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        u=a.get('href','')
        if tag=='a' and 'LDEM' in u and '_ADJ.TIF' in u:print(u)

Links().feed(urlopen('https://pgda.gsfc.nasa.gov/products/90',timeout=60).read().decode())
