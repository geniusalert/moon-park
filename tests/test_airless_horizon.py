import sys,math,unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from airless_horizon import R,ray_angle,sphere_limb,remote_horizon_bound,ray_distances,profile_row,model_metadata
class AirlessTests(unittest.TestCase):
 def test_exact_sphere_tangent_for_heights_and_datums(self):
  for ground in [-9000.,0.,10000.]:
   for height in [0.,.000001,2.,5.,10.,1000.]:
    limb=sphere_limb(height,R+ground)
    if height:
     distance=R*math.atan2(math.sqrt(height*(2*(R+ground)+height)),R+ground)
     self.assertAlmostEqual(float(ray_angle(distance,ground,ground,height)),limb['elevationDeg'],places=9)
     self.assertAlmostEqual(limb['lineOfSightM']**2,height*(2*(R+ground)+height),places=5)
    else:self.assertEqual(limb['elevationDeg'],0)
 def test_no_refraction_or_flat_earth_approximation(self):
  for distance in [.0001,1,1000,180000]:
   self.assertAlmostEqual(float(ray_angle(distance,-4000,-4000,0)),-math.degrees(distance/R)/2,places=10)
 def test_below_datum_does_not_add_imaginary_sphere(self):
  # Surface lies 4 km below the coordinate datum. It still has an ordinary
  # local depressed horizon; the observer is not inside an opaque datum ball.
  limb=sphere_limb(2,R-4000)
  self.assertLess(limb['elevationDeg'],0)
  self.assertGreater(float(ray_angle(1000,-3900,-4000,2)),5)
 def test_remote_envelope_is_upper_bound_including_high_observer(self):
  distances=np.linspace(180000,math.pi*R-1,10000)
  for ground,height in [(-9000,2),(0,10),(50000,100)]:
   bound=remote_horizon_bound(ground,height)
   angles=ray_angle(distances,12000,ground,height)
   self.assertGreaterEqual(bound+1e-10,float(angles.max()))
 def test_invalid_geometry_rejected(self):
  for args in [(0,0,0,2),(-1,0,0,2),(1000,float('nan'),0,2),(1000,0,0,-1)]:
   with self.assertRaises(ValueError):ray_angle(*args)
  for height in [-1,float('nan')]:
   with self.assertRaises(ValueError):sphere_limb(height)
 def test_refinement_detects_peak_and_preserves_witness(self):
  distances=np.array([1.,2.,3.,4.]);z=np.array([0.,100.,0.,0.]);res=np.full(4,5)
  row=profile_row(0,distances,z,0,2,res,distances,distances)
  self.assertEqual(row['distanceM'],2);self.assertEqual(row['blockerElevationM'],100)
  self.assertGreater(row['radialRefinementDeltaDeg'],0)
 def test_sampling_is_continuous_monotonic_and_reaches_radius(self):
  d=ray_distances();self.assertEqual(d[0],1);self.assertEqual(d[-1],180000)
  self.assertTrue(np.all(np.diff(d)>0));self.assertLessEqual(np.diff(d[d<=12000]).max(),10)
 def test_smooth_sampled_terrain_converges_to_analytic_limb(self):
  d=ray_distances()
  for h in [2,5,10]:
   numerical=float(ray_angle(d,np.zeros_like(d),0,h).max())
   self.assertAlmostEqual(numerical,sphere_limb(h)['elevationDeg'],places=6)
