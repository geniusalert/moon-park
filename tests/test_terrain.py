import sys
import json,hashlib
import unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from prepare_terrain import ray_angle, R
from prepare_ephemerides import parse

class TerrainTests(unittest.TestCase):
    def test_spherical_surface_angle(self):
        # Chord to equal-radius ground drops by half the subtended angle.
        for distance in [20,1000,12000]:
            self.assertAlmostEqual(float(ray_angle(distance,0,0,0)),-np.degrees(distance/R)/2,places=7)
    def test_ridge(self):
        self.assertGreater(float(ray_angle(1000,100,0,2)),5)
    def test_height_monotonic(self):
        self.assertLess(float(ray_angle(1000,100,0,10)),float(ray_angle(1000,100,0,2)))
    def test_curvature(self):
        self.assertLess(float(ray_angle(12000,0,0,2)),0)
    def test_parser_raw_reference(self):
        fixture=Path(__file__).resolve().parent/'fixtures/horizons-sun-reference.json'
        raw=fixture.read_bytes();manifest=json.loads(fixture.with_suffix('.manifest.json').read_text())
        self.assertEqual(hashlib.sha256(raw).hexdigest(),manifest['sha256'])
        rows=parse(raw,step_minutes=30)
        self.assertEqual(rows[0]['utc'],'2026-11-14T00:00:00Z')
        self.assertEqual(rows[0]['az'],126.635106)
        self.assertEqual(rows[0]['el'],.960002)

if __name__=='__main__':unittest.main()
