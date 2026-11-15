"""Source-verified native-photo closeups for three atlas search windows.

These windows are agent-selected search regions, never landmark picks.
"""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    base = json.loads((ROOT/'data/mission-data.json').read_text())
    sources = {}

    def checked(item):
        p = ROOT/item['url'].lstrip('/')
        if sha(p) != item['sha256']:
            raise ValueError(f'Source mismatch: {p}')
        sources[item['url']] = item['sha256']
        return p

    registration = json.loads(checked(base['registration']).read_text())
    reference = json.loads(checked(base['stereoReference']).read_text())
    entry = next(e for e in registration['entries'] if e['siteId'] == 'Site04')
    layers = [('Mission 45', entry['assets']['shade45']),
              ('Mission 225', entry['assets']['shade225']),
              ('Stereo 45', reference['assets']['shade45']),
              ('Stereo quality', reference['assets']['confidence'])]
    images = [(name, Image.open(checked(item)).convert('RGBA')) for name,item in layers]
    records = []
    sheet = Image.new('RGB',(1620,3*400),'#151b24')
    draw = ImageDraw.Draw(sheet)
    l,b,r,t = entry['boundsXYM']
    with rasterio.open(checked(entry['sourceImage'])) as photo, rasterio.open(checked(reference['confidenceNative'])) as quality:
        assert photo.res == (1.,1.)
        assert photo.crs == quality.crs
        for i,(c,row) in enumerate([(50,29),(98,106),(44,284)]):
            x=l+(c+.5)*(r-l)/entry['width']; y=t-(row+.5)*(t-b)/entry['height']
            pr,pc = photo.index(x,y)
            # Keep the full search window inside the source, including near the
            # northern crop edge. This moves a search footprint, not a pick.
            pr=max(150,min(photo.height-150,pr))
            pc=max(150,min(photo.width-150,pc))
            window = rasterio.windows.Window(pc-150,pr-150,300,300)
            assert window.intersection(rasterio.windows.Window(0,0,photo.width,photo.height)) == window
            bounds = rasterio.windows.bounds(window,photo.transform)
            values = photo.read(1,window=window,masked=True)
            native = Image.fromarray(values.filled(0)).convert('RGBA')
            native.putalpha(Image.fromarray((~np.ma.getmaskarray(values)).astype('uint8')*255))
            draw.text((10,i*400+8),f'Search {i+1} | 300 m footprint | nominal source coordinates | no correspondence accepted',fill='white')
            draw.text((10,i*400+30),'Native photo 1 m/pixel',fill='white')
            sheet.paste(native,(10,i*400+55),native)
            # Fractional EXTENT sampling gives every display panel precisely the
            # native-photo footprint. It is display interpolation, not new data.
            x0,y0,x1,y1=bounds
            extent=((x0-l)/(r-l)*entry['width'],(t-y1)/(t-b)*entry['height'],
                    (x1-l)/(r-l)*entry['width'],(t-y0)/(t-b)*entry['height'])
            for k,(name,im) in enumerate(images,1):
                crop=im.transform((300,300),Image.Transform.EXTENT,extent,resample=Image.Resampling.NEAREST)
                draw.text((k*320+10,i*400+30),name+' (display enlarged)',fill='white')
                sheet.paste(crop,(k*320+10,i*400+55),crop)
            requested=quality.window(*bounds)
            qx,qy=math.floor(requested.col_off),math.floor(requested.row_off)
            qw=rasterio.windows.Window(qx,qy,math.ceil(requested.col_off+requested.width)-qx,
                                       math.ceil(requested.row_off+requested.height)-qy)
            assert qw.intersection(rasterio.windows.Window(0,0,quality.width,quality.height))==qw
            codes=quality.read(1,window=qw)
            records.append(dict(id=f'Search-{i+1}',searchCentreInspectionPixel=[c,row],
                nativePhotoWindow=[pc-150,pr-150,300,300],boundsXYM=list(bounds),
                nativePhotoSupportedPixels=int((~np.ma.getmaskarray(values)).sum()),
                confidenceCountBoundsXYM=list(rasterio.windows.bounds(qw,quality.transform)),
                nativeConfidenceCounts={str(int(v)):int((codes==v).sum()) for v in np.unique(codes)},
                status='not-accepted',imagePick=None,missionPick=None,
                pickingUncertaintyM=None,
                reason='Crater vicinity recognizable; unique corresponding rim point not established on mission terrain. Shadow centre unsuitable as a stable feature.'))
    output=OUT/'native-rim-review.png';sheet.save(output)
    report=dict(schemaVersion=1,date='2026-11-12',siteId='Site04',
        method='Three atlas-selected 300 m native-photo windows; terrain and confidence displays sampled on identical nominal footprints.',
        generatorSha256=sha(Path(__file__)),sources=sources,imageSha256=sha(output),
        photoPixelM=1,inspectionPixelM=entry['pixelM'],
        limitations=['Nearest-neighbour display enlargement supplies no extra terrain resolution.',
                     'Quality counts cover enclosing native 2 m cells, with their own bounds; not support at an accepted landmark.',
                     'Repeated blind picks were not performed because an unambiguous mission-side feature was not established.'],
        searches=records,acceptedPairs=0,registrationEstablished=False)
    (OUT/'native-rim-review.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(dict(searches=len(records),nativePixelsPerSearch=90000,acceptedPairs=0)))


if __name__ == '__main__':
    main()
