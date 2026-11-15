import sys
import unittest
from pathlib import Path
import numpy as np
from affine import Affine
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from extend_horizons import bilinear,destinations
from prepare_spice import basis
from validate_convergence import durations
from prepare_variants import clone_weight,ray_distances
from fetch_clones import error_from_surfaces
from prepare_terrain import ray_angle

class ScienceTests(unittest.TestCase):
    def test_bilinear_at_pixel_center_and_between(self):
        z=np.array([[0.,2.],[4.,6.]])
        v,good=bilinear(z,Affine.identity(),.5,.5)
        self.assertTrue(good);self.assertEqual(float(v),0)
        v,good=bilinear(z,Affine.identity(),1.,1.)
        self.assertTrue(good);self.assertEqual(float(v),3)
    def test_bilinear_rejects_missing_support_and_edge(self):
        z=np.array([[0.,2.],[4.,np.nan]])
        self.assertFalse(bool(bilinear(z,Affine.identity(),1.,1.)[1]))
        self.assertFalse(bool(bilinear(z,Affine.identity(),-.1,1.)[1]))
    def test_basis_is_orthonormal_and_right_handed(self):
        for lon,lat in [(0,0),(-137,-89.4),(175,-89.9)]:
            n,e,u=basis(lon,lat)
            np.testing.assert_allclose(np.array([e,n,u])@np.array([e,n,u]).T,np.eye(3),atol=1e-14)
            np.testing.assert_allclose(np.cross(e,n),u,atol=1e-14)
    def test_destination_bearings(self):
        lon,lat=destinations(0,0,np.array([0.,90.]),np.array([1000.]))
        self.assertAlmostEqual(float(lon[0,0]),0,places=12)
        self.assertGreater(lat[0,0],0)
        self.assertAlmostEqual(float(lat[1,0]),0,places=12)
        self.assertGreater(lon[1,0],0)
    def test_longest_includes_endpoints(self):
        r=durations(np.array([False,True,False,False]),np.array([True]*4),30)
        self.assertEqual(r['sunHours'],.5);self.assertEqual(r['longestDark'],1)
    def test_clone_taper_preserves_near_field_and_has_no_crop_edge_step(self):
        np.testing.assert_allclose(clone_weight(np.array([0,1800,1900,2000,3000])),[1,1,.5,0,0],atol=1e-14)
    def test_refined_radial_grid_contains_every_nominal_distance(self):
        self.assertTrue(set(ray_distances()).issubset(set(ray_distances(True))))
    def test_absolute_clone_is_differenced_against_nominal_and_wrong_semantics_fail(self):
        nominal=np.full((2,2),1000.)
        np.testing.assert_allclose(error_from_surfaces(nominal+.2,nominal),.2)
        with self.assertRaises(ValueError):error_from_surfaces(np.full((2,2),.2),nominal)
    def test_common_height_offset_does_not_create_a_false_nearby_ridge(self):
        a=float(ray_angle(1000,0,0,2));b=float(ray_angle(1000,1,1,2))
        self.assertLess(abs(a-b),1e-6)

if __name__=='__main__':unittest.main()
