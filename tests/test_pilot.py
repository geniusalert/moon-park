import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from summarize_pilot import summarize

class PilotTests(unittest.TestCase):
    def record(self,key,kind='participant',score=5):return dict(anonymousSessionId=key,kind=kind,includeInHumanStudy=kind=='participant',answers=[dict(correct=i<score) for i in range(5)],correctCount=score,elapsedSeconds=100,assisted=False,reference={'version':{}})
    def test_developer_sessions_are_never_human_evidence(self):
        r=summarize([self.record('dev','developer')]);self.assertEqual(r['participants'],0);self.assertEqual(r['gate'],'pending-five-participants')
    def test_target_and_failed_observations_are_retained(self):
        r=summarize([self.record(str(i),score=5 if i<4 else 2) for i in range(5)])
        self.assertEqual(r['gate'],'met');self.assertEqual(r['participants'],5);self.assertEqual(r['byTask'][4]['correct'],4)
    def test_duplicate_and_inconsistent_score_reject(self):
        with self.assertRaises(ValueError):summarize([self.record('same'),self.record('same')])
        r=self.record('bad');r['correctCount']=1
        with self.assertRaises(ValueError):summarize([r])
