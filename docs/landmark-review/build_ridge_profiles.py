"""Source-bound cross-crop terrain profiles for the broad-feature review.

Transects are nominal source geometry, not matched image landmarks.
"""
import csv
import hashlib
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import rasterio
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    base=json.loads((ROOT/'data/mission-data.json').read_text())
    sources={}
    def checked(item):
        p=ROOT/item['url'].lstrip('/')
        if sha(p)!=item['sha256']:raise ValueError(f'Source mismatch: {p}')
        sources[item['url']]=item['sha256']
        return p
    ref=json.loads(checked(base['stereoReference']).read_text())
    reg=json.loads(checked(base['registration']).read_text())
    entry=next(e for e in reg['entries'] if e['siteId']=='Site04')
    with rasterio.open(checked(ref['comparisonGrid'])) as ds:
        stereo,mission,fraction=ds.read()
        transform=ds.transform
        assert ds.width==entry['width'] and ds.height==entry['height']
    assert tuple(rasterio.transform.array_bounds(401,401,transform))==tuple(entry['boundsXYM'])
    support=np.isfinite(stereo)&np.isfinite(mission)&(fraction>=1-1e-6)
    assert int(support.sum())==ref['strictDifference']['count']
    rows=[80,200,320]
    x=np.array([(transform*(c+.5,.5))[0] for c in range(401)])
    fig=plt.figure(figsize=(14,12),layout='constrained')
    grid=fig.add_gridspec(4,2,height_ratios=[1.7,1,1,1])
    views=[('Historical photo',entry['assets']['image']),('Mission hillshade, azimuth 45 degrees',entry['assets']['shade45'])]
    for col,(name,item) in enumerate(views):
        ax=fig.add_subplot(grid[0,col]);ax.imshow(Image.open(checked(item)));ax.set_title(name)
        for row,color in zip(rows,['tab:red','tab:orange','tab:cyan']):
            ax.axhline(row,color=color,lw=1);ax.text(8,row-5,f'row {row}',color=color,backgroundcolor='black')
        ax.set_xlabel('Common-grid column');ax.set_ylabel('Common-grid row')
    records=[];samples=[]
    for i,(row,color) in enumerate(zip(rows,['tab:red','tab:orange','tab:cyan']),1):
        y=(transform*(.5,row+.5))[1]
        ax=fig.add_subplot(grid[i,:]);ax.plot(x,mission[row],label='Mission LOLA',color='black')
        ax.plot(x,np.where(support[row],stereo[row],np.nan),label='NAC stereo; complete supported cells only',color=color)
        ax.set(xlabel='Projected X (m)',ylabel='Height above lunar sphere (m)',title=f'Row {row}; projected Y = {y:.2f} m; nominal coordinates, no shift')
        ax.grid(alpha=.25);ax.legend(loc='best')
        models={}
        for name,z,mask in [('mission',mission[row],np.isfinite(mission[row])),('stereoSupported',stereo[row],support[row])]:
            available=np.flatnonzero(mask)
            if not available.size:raise ValueError('Empty transect')
            peak=int(available[np.argmax(z[available])]);near=available[z[available]>=z[peak]-1]
            models[name]=dict(maximumXM=float(x[peak]),maximumHeightM=float(z[peak]),
                maximumAtCropEdge=bool(peak in [0,400]),
                withinOneMetreOfMaxXEnvelopeM=[float(x[near.min()]),float(x[near.max()])],
                withinOneMetreOfMaxCellCount=int(near.size))
        records.append(dict(row=row,yM=y,supportedCells=int(support[row].sum()),models=models))
        for c in range(401):samples.append([row,c,float(x[c]),float(y),float(mission[row,c]),
            float(stereo[row,c]) if np.isfinite(stereo[row,c]) else '',float(fraction[row,c]),bool(support[row,c])])
    fig.suptitle('Shackleton broad-feature investigation — three fixed cross-crop transects\nProfiles describe terrain shape; they do not measure photo registration.',fontsize=15)
    output=OUT/'ridge-profiles.png';fig.savefig(output,dpi=150);plt.close(fig)
    csv_path=OUT/'ridge-profile-samples.csv'
    with csv_path.open('w',newline='') as f:
        writer=csv.writer(f);writer.writerow(['row','column','x_m','y_m','mission_height_m','stereo_height_m','confidence14_area_fraction','complete_support']);writer.writerows(samples)
    report=dict(schemaVersion=1,siteId='Site04',date='2026-11-12',sources=sources,
        generatorSha256=sha(Path(__file__)),plotSha256=sha(output),csvSha256=sha(csv_path),
        method='Three prespecified full-width common-grid rows, 80/200/320; no smoothing, shift, brightness matching or fitted correction.',
        limitations=['Heights share LOLA control heritage; agreement is not independent validation.',
                     'A height maximum along a line is not necessarily a ridge crest or a physical photo landmark.',
                     'The within-one-metre envelope is a descriptive height band, not horizontal uncertainty; gaps can occur.',
                     'Photo brightness depends on illumination and reflectance and is not compared numerically with height.'],
        transects=records,acceptedPairs=0,registrationEstablished=False)
    (OUT/'ridge-profiles.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(dict(profileSamples=len(samples),transects=records)))


if __name__=='__main__':main()
