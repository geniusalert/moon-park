import sys,unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from stereo_reference import supported_cells,difference_summary

class StereoReferenceTests(unittest.TestCase):
    def test_mixed_interpolated_and_missing_cells_do_not_enter_supported_stats(self):
        reference=np.array([[11.,999.],[np.nan,14.]])
        mission=np.array([[10.,0.],[0.,np.nan]])
        support=supported_cells(reference,mission,np.array([[1.,.99],[1.,1.]]))
        self.assertEqual(support.tolist(),[[True,False],[False,False]])
        self.assertEqual(difference_summary(reference,mission,support)['medianM'],1)
    def test_sign_and_empty_support_are_explicit(self):
        a=np.array([8.,13.]);b=np.array([10.,10.]);support=np.array([True,True])
        s=difference_summary(a,b,support);self.assertEqual(s['medianM'],.5)
        self.assertAlmostEqual(s['rmseM'],np.sqrt(6.5))
        self.assertIsNone(difference_summary(a,b,np.array([False,False]))['medianM'])

if __name__=='__main__':unittest.main()
