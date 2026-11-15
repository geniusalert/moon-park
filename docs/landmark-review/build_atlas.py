"""Reproduce the source-bound spatial review atlas from the repository root.

This is a research artifact generator, separate from the released application.
No feature detection, coordinate fitting or registration acceptance is performed.
"""
import base64
import hashlib
import json
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    base = json.loads((ROOT / 'data/mission-data.json').read_text(encoding='utf-8'))
    catalog_path = ROOT / base['stereoReference']['url'].lstrip('/')
    assert digest(catalog_path) == base['stereoReference']['sha256']
    ref = json.loads(catalog_path.read_text(encoding='utf-8'))
    reg_path = ROOT / base['registration']['url'].lstrip('/')
    assert digest(reg_path) == base['registration']['sha256']
    reg = json.loads(reg_path.read_text())
    entry = next(e for e in reg['entries'] if e['siteId'] == 'Site04')
    sources = {}

    def checked(item):
        path = ROOT / item['url'].lstrip('/')
        assert digest(path) == item['sha256'], str(path)
        sources[item['url']] = item['sha256']
        return path

    with rasterio.open(checked(ref['comparisonGrid'])) as ds:
        z, mission, fraction = ds.read()
        transform = ds.transform
    support = np.isfinite(z) & np.isfinite(mission) & (fraction >= 1 - 1e-6)
    assert int(support.sum()) == ref['strictDifference']['count']
    # These are already prepared on the identical 401 x 401 nominal grid.
    photo_item = entry['assets']['image']
    panels = [('Historical photo', Image.open(checked(photo_item)).convert('RGBA'))]
    for label, key in [('Mission terrain 45', 'shade45')]:
        panels.append((label, Image.open(checked(entry['assets'][key])).convert('RGBA')))
    for label, key in [('Stereo terrain 45', 'shade45'), ('Stereo terrain 225', 'shade225'), ('Stereo quality', 'confidence')]:
        panels.append((label, Image.open(checked(ref['assets'][key])).convert('RGBA')))
    assert all(im.size == (ref['width'], ref['height']) for _, im in panels)
    rows = []
    sheet = Image.new('RGB', (1500, 9 * 340), '#121820')
    draw = ImageDraw.Draw(sheet)
    edges = np.linspace(0, ref['width'], 4, dtype=int)
    for r in range(3):
        for c in range(3):
            index = r * 3 + c
            x0, x1 = int(edges[c]), int(edges[c+1])
            y0, y1 = int(edges[r]), int(edges[r+1])
            region = support[y0:y1, x0:x1]
            left, top = transform * (x0, y0)
            right, bottom = transform * (x1, y1)
            row = dict(id=f'R{r+1}C{c+1}', window=[x0,y0,x1,y1],
                       boundsXYM=[left,bottom,right,top],
                       supportedCells=int(region.sum()), cells=int(region.size),
                       supportedFraction=float(region.mean()),
                       correspondenceStatus='unreviewed-region', acceptedPairs=0)
            rows.append(row)
            draw.text((10,index*340+5), f"{row['id']} | complete stereo support {100*row['supportedFraction']:.2f}% | nominal coordinates; no alignment established", fill='white')
            for i, (label, im) in enumerate(panels):
                draw.text((i*300+10,index*340+27), label, fill='white')
                tile = im.crop((x0,y0,x1,y1)).resize((280,280), Image.Resampling.NEAREST)
                sheet.paste(tile,(i*300+10,index*340+48),tile)
    image_path = OUT / 'shackleton-review-atlas.png'
    sheet.save(image_path)
    report = dict(schemaVersion=1, siteId='Site04', date='2026-11-12',
        purpose='Spatially exhaustive visual search for replacement landmarks',
        method='Fixed 3 by 3 partition of the full common inspection grid; no ranking or feature selection',
        limitations=['Support is complete-cell confidence category 14 with both heights available.',
                      'Region support does not establish a feature match, horizontal accuracy or independence.',
                      'Mission and stereo terrain have shared LOLA control heritage.',
                      'Photo and synthetic illumination differ. Panels use nominal coordinates without correction.'],
        referenceCatalog=dict(url=base['stereoReference']['url'],sha256=digest(catalog_path)),
        generatorSha256=digest(Path(__file__)), sources=sources,
        atlasSha256=digest(image_path), regions=rows, acceptedPairs=0,
        registrationEstablished=False)
    (OUT/'shackleton-review-atlas.json').write_text(json.dumps(report,indent=2)+'\n')
    encoded = base64.b64encode(image_path.read_bytes()).decode()
    html = '''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Shackleton landmark review atlas</title><style>body{background:#121820;color:#eee;font:17px system-ui;margin:24px;max-width:1500px}img{width:100%;height:auto}p{max-width:85ch}a{color:#acd9ff}</style>
<h1>Shackleton landmark review atlas</h1><p><a href="native-rim-review.png">Native-photo follow-up: three western search windows</a> · <a href="native-rim-review.json">Source records and outcome</a> · <a href="ridge-profiles.png">Broad ridge profiles</a> · <a href="ridge-profile-samples.csv">Profile samples</a> · <a href="REVIEW.md">Review notes and decision</a></p><p>Review all nine regions for stable crater rims or other identifiable shapes. Each row shows the same nominal footprint. Zoom in to compare shape under opposite synthetic lighting. Nearest-neighbour enlargement preserves the inspection pixels.</p>
<p>Green quality pixels indicate successful stereo matching; blue indicates shadow and amber interpolation. Complete-cell support percentages use the numeric area fractions, not the display colour. Clear stereo support alone does not prove a photo-to-terrain correspondence. Zero pairs are accepted.</p>
<p>For a candidate, record a precise feature definition, image and mission coordinates, picking uncertainty and competing interpretations. Reserve checks before fitting; obtain repeated picks before assessing a correction. Use the source hashes and region bounds in the companion JSON.</p>'''
    (OUT/'index.html').write_text(html+f'<img alt="Nine regions in five source views" src="data:image/png;base64,{encoded}">',encoding='utf-8')
    assert sum(v['cells'] for v in rows) == support.size
    assert sum(v['supportedCells'] for v in rows) == int(support.sum())
    print(json.dumps(dict(regions=len(rows),coveredCells=support.size,supportedCells=int(support.sum()),acceptedPairs=0)))


if __name__ == '__main__':
    main()
