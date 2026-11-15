import sys
import unittest
from pathlib import Path
import numpy as np
from affine import Affine
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from candidate_geometry import select_points,inside_rings

class CandidateTests(unittest.TestCase):
    def test_hole_rejects_center_and_selection_is_interior(self):
        rings=[[[10,10],[90,10],[90,90],[10,90],[10,10]],[[35,35],[65,35],[65,65],[35,65],[35,35]]]
        r={'id':'test','boundsXY':[10,10,90,90],'ringsXY':rings}
        points=select_points(r,np.zeros((20,20)),Affine(5,0,0,0,-5,100),True)
        self.assertEqual(len(set(tuple(p['xy']) for p in points)),5)
        self.assertTrue(all(bool(inside_rings(*p['xy'],rings)) for p in points))
        self.assertFalse(bool(inside_rings(50,50,rings)))
        self.assertEqual(points,select_points(r,np.zeros((20,20)),Affine(5,0,0,0,-5,100),True))
    def test_empty_or_missing_region_rejects(self):
        r={'id':'test','boundsXY':[10,10,90,90],'ringsXY':[[[10,10],[90,10],[90,90],[10,90]]]}
        with self.assertRaises(ValueError):select_points(r,np.full((20,20),np.nan),Affine(5,0,0,0,-5,100))
    def test_native_pixel_centers_and_constant_height(self):
        r={'id':'test','boundsXY':[10,10,90,90],'ringsXY':[[[10,10],[90,10],[90,90],[10,90]]]}
        point=select_points(r,np.full((20,20),123.),Affine(5,0,0,0,-5,100))[0]
        self.assertEqual(point['groundM'],123.)
        self.assertTrue(all(v%5==2.5 for v in point['xy']))
