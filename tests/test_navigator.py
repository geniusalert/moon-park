import sys,json,tempfile,unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from navigator_worker import validate,destinations,cache_save,cache_read
from prepare_spice import basis
class NavigatorTests(unittest.TestCase):
 def request(self,**kw):return dict(longitude=0,latitude=-87,duration=168,delay=72,height=2,startUTC='2027-12-31T23:50:00Z',**kw)
 def test_wrapping_and_pole(self):
  q=self.request();q['longitude']=-721;self.assertEqual(validate(q)[0],-1)
  q['latitude']=-90;self.assertEqual(validate(q)[0],0)
 def test_rejects_rounding_and_unsupported_inputs(self):
  for name,value in [('height',2.5),('duration',1.01),('delay',73),('latitude',-84.9),('startUTC','2027-01-01T00:01:00Z'),('startUTC','2028-01-01T00:00:00Z')]:
   q=self.request();q[name]=value
   with self.assertRaises(ValueError):validate(q)
 def test_exact_pole_rays_are_distinct(self):
  lo,la=destinations(0,-90,np.array([0,90,180,270]),np.array([1000.]))
  np.testing.assert_allclose(la,np.full_like(la,la[0,0]),atol=1e-10)
  self.assertEqual(len(set(np.round(lo[:,0],5))),4)
 def test_vector_rays_match_existing_away_from_pole(self):
  from extend_horizons import destinations as original
  az=np.arange(0,360,10);dist=np.array([5.,12000.,180000.]);a,b=destinations(143,-86,az,dist);x,y=original(143,-86,az,dist)
  np.testing.assert_allclose((a-x+180)%360-180,0,atol=1e-8);np.testing.assert_allclose(b,y,atol=1e-8)
 def test_cache_integrity(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.json';cache_save(p,{'x':4});self.assertEqual(cache_read(p),{'x':4});r=json.loads(p.read_text());r['payload']['x']=5;p.write_text(json.dumps(r))
   with self.assertRaises(ValueError):cache_read(p)
 def test_missing_and_changed_sources_are_rejected(self):
  import os,contextlib,io
  from unittest.mock import patch
  from navigator_worker import run
  original=Path.cwd()
  with tempfile.TemporaryDirectory() as temp:
   try:
    os.chdir(temp)
    with patch.dict(os.environ,{'MOON_PARK_STORE':str(Path(temp)/'cache')}),contextlib.redirect_stdout(io.StringIO()):
     with self.assertRaisesRegex(ValueError,'not installed'):run(self.request())
     Path('data/raw/navigator').mkdir(parents=True);Path('data/mission-data.json').write_text('{"sites":[]}');Path('changed.bin').write_bytes(b'changed terrain')
     Path('data/raw/navigator/catalog.json').write_text(json.dumps({'sources':[{'id':'changed','path':'changed.bin','sha256':'0'*64,'pixelM':20}]}))
     with self.assertRaisesRegex(ValueError,'checksum changed'):run(self.request())
   finally:os.chdir(original)
if __name__=='__main__':unittest.main()

