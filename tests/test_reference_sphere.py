import sys,math,unittest,tempfile,os,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from reference_sphere_worker import validate,sphere_profile,display_patch,R,run
class ReferenceSphereTests(unittest.TestCase):
 def request(self,**changes):
  value=dict(latitude=.67416,longitude=23.47314,startUTC='2027-01-01T00:00:00Z',duration=72,delay=48,height=2);value.update(changes);return value
 def test_global_coordinates_preserved_and_poles_canonicalized(self):
  self.assertEqual(validate(self.request())[0:2],(23.47314,.67416))
  self.assertEqual(validate(self.request(latitude=90,longitude=321))[0],0)
  self.assertEqual(validate(self.request(latitude=-90,longitude=321))[0],0)
  self.assertEqual(validate(self.request(longitude=721))[0],1)
 def test_reject_invalid_settings_without_rounding(self):
  for change in [dict(latitude=91),dict(latitude=float('nan')),dict(height=0),dict(duration=1.01),dict(delay=73),dict(startUTC='2028-01-01T00:00:00Z'),dict(startUTC='2027-01-01T00:01:00Z')]:
   with self.assertRaises(ValueError):validate(self.request(**change))
 def test_analytic_limb_and_observer_height(self):
  previous=0
  for h in [2,5,10]:
   profile=sphere_profile(h);self.assertEqual(len(profile),1440);angle=-math.degrees(math.acos(R/(R+h)))
   self.assertLess(angle,previous);previous=angle
   self.assertTrue(all(abs(p['el']-angle)<1e-10 and p['source']=='analytic-reference-sphere' for p in profile))
   self.assertAlmostEqual(profile[0]['distanceM']**2,(R+h)**2-R**2,places=4)
   self.assertNotIn('blocker',profile[0])
 def test_display_is_sphere_curvature_not_fake_terrain(self):
  patch=display_patch();self.assertEqual(patch['frame'],'local-reference-sphere');self.assertEqual(patch['z'][25][25],0);self.assertTrue(all(z<=0 for row in patch['z'] for z in row));self.assertAlmostEqual(patch['z'][0][0],patch['z'][-1][-1])
 def test_missing_kernels_explains_reference_setup(self):
  from unittest.mock import patch
  original=Path.cwd()
  with tempfile.TemporaryDirectory() as folder:
   try:
    os.chdir(folder)
    with patch.dict(os.environ,{'MOON_PARK_STORE':str(Path(folder)/'cache')}):
     with self.assertRaisesRegex(ValueError,'SPICE kernels missing'):run(self.request())
   finally:os.chdir(original)
 def test_changed_kernel_identity_is_rejected(self):
  from unittest.mock import patch
  original=Path.cwd()
  with tempfile.TemporaryDirectory() as folder:
   try:
    os.chdir(folder);Path('data/raw/kernels').mkdir(parents=True);Path('changed.bsp').write_bytes(b'changed')
    Path('data/raw/kernels/manifest.json').write_text(json.dumps([{'path':'changed.bsp','sha256':'0'*64}]))
    with patch.dict(os.environ,{'MOON_PARK_STORE':str(Path(folder)/'cache')}):
     with self.assertRaisesRegex(ValueError,'Kernel checksum changed'):run(self.request())
   finally:os.chdir(original)
if __name__=='__main__':unittest.main()
