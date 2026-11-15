"""Fetch a raw JPL reference observation; this does not feed the demo UI yet."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

p = argparse.ArgumentParser()
p.add_argument('--longitude', type=float, default=0, help='East longitude degrees; reference point only')
p.add_argument('--latitude', type=float, default=-89)
p.add_argument('--altitude-km', type=float, default=0, help='Height above Horizons reference surface, not DEM ground')
p.add_argument('--start', default='2026-11-14')
p.add_argument('--stop', default='2026-11-15')
args = p.parse_args()
if not -90 <= args.latitude <= 90 or not -360 <= args.longitude <= 360:
    p.error('Coordinates out of range')
out = Path('data/raw'); out.mkdir(parents=True, exist_ok=True)
for target, name in [('10', 'sun'), ('399', 'earth')]:
    parameters = dict(format='json', COMMAND=f"'{target}'", OBJ_DATA="'NO'", MAKE_EPHEM="'YES'",
        EPHEM_TYPE="'OBSERVER'", CENTER="'coord@301'", COORD_TYPE="'GEODETIC'",
        SITE_COORD=f"'{args.longitude},{args.latitude},{args.altitude_km}'", START_TIME=f"'{args.start}'",
        STOP_TIME=f"'{args.stop}'", STEP_SIZE="'30 m'", QUANTITIES="'4'", CSV_FORMAT="'YES'",
        ELEV_CUT="'-90'", APPARENT="'AIRLESS'", TIME_TYPE="'UT'")
    url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urlencode(parameters)
    with urlopen(url, timeout=60) as response:
        raw = response.read()
    payload = json.loads(raw)
    if payload.get('error') or '$$SOE' not in payload.get('result', ''):
        raise RuntimeError(payload.get('error', payload.get('result', 'No ephemeris')))
    (out / f'{name}.json').write_bytes(raw)
    manifest = dict(source=url, retrievedAt=dt.datetime.now(dt.timezone.utc).isoformat(),
        sha256=hashlib.sha256(raw).hexdigest(), parameters=parameters,
        status='raw-reference-not-validated', aiAssistance='Acquisition script developed with AI assistance')
    (out / f'{name}.manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f'{name}: raw ephemeris saved; SHA-256 {manifest["sha256"]}')
