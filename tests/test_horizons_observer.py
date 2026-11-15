import sys,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from horizons_observer import fetch_observations,AU_KM
class Response:
 def __enter__(self):return self
 def __exit__(self,*args):pass
 def read(self):return json.dumps({'result':'Center pole/equ : MEAN_ME (high precision)\nAtmos refraction: NO (AIRLESS)\nCenter radii : 1737.4, 1737.4, 1737.4 km\n$$SOE\n2027-Jan-01 00:00:00,,,360,1,1,0,\n2027-Jan-01 00:10,,,2,-1,2,0,\n$$EOE'}).encode()
class HorizonsTests(unittest.TestCase):
 def test_live_parser_units_cache_and_integrity(self):
  with tempfile.TemporaryDirectory() as store,patch('horizons_observer.urlopen',return_value=Response()) as request:
   args=('10',0,-89,2,['2027-01-01T00:00:00Z','2027-01-01T00:10:00Z'],store)
   rows,source=fetch_observations(*args)
   self.assertEqual(rows[0]['az'],0);self.assertEqual(rows[0]['rangeKm'],AU_KM)
   self.assertEqual(source['parameters']['APPARENT'],"'AIRLESS'")
   self.assertEqual(fetch_observations(*args)[0],rows);self.assertEqual(request.call_count,1)
   path=next(Path(store).glob('*.json'));payload=json.loads(path.read_text());payload['raw']='changed';path.write_text(json.dumps(payload))
   with self.assertRaisesRegex(ValueError,'checksum'):fetch_observations(*args)
 def test_incomplete_table_rejected(self):
  with tempfile.TemporaryDirectory() as store,patch('horizons_observer.urlopen',return_value=Response()):
   with self.assertRaisesRegex(ValueError,'coverage'):fetch_observations('399',0,-89,2,['2027-01-01T00:00:00Z'],store)
 def test_frame_refraction_and_datum_mismatch_rejected(self):
  original=Response().read()
  for before,after,reason in [(b'MEAN_ME',b'IAU_MOON','frame'),(b'NO (AIRLESS)',b'YES (REFRACTED)','airless'),(b'1737.4',b'1738.0','radius')]:
   with tempfile.TemporaryDirectory() as store,patch.object(Response,'read',return_value=original.replace(before,after)),patch('horizons_observer.urlopen',return_value=Response()):
    with self.assertRaisesRegex(ValueError,reason):fetch_observations('10',0,-89,2,['2027-01-01T00:00:00Z','2027-01-01T00:10:00Z'],store)
