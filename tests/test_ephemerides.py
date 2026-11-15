import json
import unittest
from scripts.prepare_ephemerides import parse

def response(rows):
    return json.dumps({'result':'$$SOE\n'+rows+'\n$$EOE'})

class EphemerisParsing(unittest.TestCase):
    def test_valid_grid_and_azimuth_wrap(self):
        rows=parse(response('2026-Nov-14 00:00,,,360,1\n2026-Nov-14 00:10,,,2,-1'))
        self.assertEqual(rows[0]['az'],0)
        self.assertEqual(rows[1]['utc'],'2026-11-14T00:10:00Z')
    def test_reject_bad_grid_and_nonfinite(self):
        for rows in ['2026-Nov-14 00:00,,,1,1\n2026-Nov-14 00:20,,,2,1','2026-Nov-14 00:00,,,1,nan\n2026-Nov-14 00:10,,,2,1']:
            with self.assertRaises(ValueError): parse(response(rows))
    def test_api_error(self):
        with self.assertRaises(ValueError): parse(json.dumps({'error':'unavailable'}))

    def test_explicit_reference_cadence_preserves_strict_default(self):
        raw=response('2026-Nov-14 00:00,,,1,1\n2026-Nov-14 00:30,,,2,1')
        with self.assertRaises(ValueError):parse(raw)
        self.assertEqual(len(parse(raw,step_minutes=30)),2)
