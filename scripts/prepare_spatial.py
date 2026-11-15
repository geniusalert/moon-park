"""Published study-region outlines and explicit terrain geometry for the viewer."""
import hashlib
import io
import json
import tarfile
from pathlib import Path
from urllib.request import urlopen
import numpy as np
import rasterio
from rasterio.enums import Resampling
import shapefile
from pyproj import CRS,Transformer

R=1737400.0

def contains(x,y,rings):
    inside=False
    for ring in rings:
        for a,b in zip(ring,ring[1:]+ring[:1]):
            ax,ay=a;bx,by=b
            if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:inside=not inside
    return inside

def build():
    dataset=json.loads(Path('data/mission-data.json').read_text(encoding='utf-8'))
    lunar=CRS.from_proj4(f'+proj=longlat +R={R} +no_defs')
    regions=[];tiles=[];sources=[]
    for site in dataset['sites']:
        code=site['id'];url=f'https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/{code}/{code}_ROIs.tgz'
        path=Path(f'data/raw/{code}-ROIs.tgz')
        if not path.exists():
            with urlopen(url,timeout=60) as response:path.write_bytes(response.read())
        raw=path.read_bytes()
        # Read files directly from the archive; never extract archive paths.
        with tarfile.open(fileobj=io.BytesIO(raw),mode='r:gz') as archive:
            files={m.name:archive.extractfile(m).read() for m in archive.getmembers() if m.isfile()}
        print(code,'archive',list(files),flush=True)
        terrain_path=Path(f'data/raw/{code}.tif')
        if hashlib.sha256(terrain_path.read_bytes()).hexdigest()!=site['provenance']['sha256']:raise ValueError('Native DEM source hash mismatch')
        with rasterio.open(terrain_path) as ds:
            inverse=Transformer.from_crs(ds.crs,lunar,always_xy=True)
            source_prj=next(v.decode() for k,v in files.items() if k.endswith('.prj'))
            roi_crs=CRS.from_wkt(source_prj)
            if abs(roi_crs.ellipsoid.semi_major_metre-R)>1e-6 or any(abs(a.unit_conversion_factor-1)>1e-12 for a in roi_crs.axis_info):raise ValueError('Unexpected ROI sphere or units')
            roi_inverse=Transformer.from_crs(roi_crs,lunar,always_xy=True)
            test_x=np.array([ds.bounds.left,ds.bounds.right,site['xy'][0]]);test_y=np.array([ds.bounds.bottom,ds.bounds.top,site['xy'][1]])
            a,b=roi_inverse.transform(test_x,test_y);c,d=inverse.transform(test_x,test_y)
            residual=max(float(np.max(np.abs((a-c+180)%360-180))),float(np.max(np.abs(b-d))))
            if residual>1e-9:raise ValueError('ROI projection does not align with terrain')
            for name in files:
                if not name.endswith('.shp'):continue
                stem=name[:-4]
                reader=shapefile.Reader(shp=io.BytesIO(files[name]),shx=io.BytesIO(files[stem+'.shx']) if stem+'.shx' in files else None,dbf=io.BytesIO(files[stem+'.dbf']) if stem+'.dbf' in files else None)
                fields=[x[0] for x in reader.fields[1:]]
                for index,item in enumerate(reader.iterShapeRecords()):
                    points=np.array(item.shape.points)
                    # Source archives use the same polar projection; retain native XY.
                    parts=list(item.shape.parts)+[len(points)];rings=[]
                    for a,b in zip(parts,parts[1:]):
                        ring=points[a:b]
                        if len(ring)<3:continue
                        rings.append(ring.tolist())
                    properties={key:str(value) for key,value in zip(fields,item.record)}
                    for x,y in points:
                        if not ds.bounds.left<=x<=ds.bounds.right or not ds.bounds.bottom<=y<=ds.bounds.top:raise ValueError('ROI outside source DEM bounds')
                    attrs=dict(zip(fields,item.record));px,py=attrs.get('X'),attrs.get('Y')
                    point_status='missing' if px is None or py is None else 'inside' if contains(float(px),float(py),rings) else 'outside'
                    regions.append(dict(id=f'{code}-roi-{index+1}',siteId=code,label=f'{code} published study region {index+1}',ringsXY=rings,properties=properties,attributePointStatus=point_status,status='published-illumination-study-region',simulationCached=False,source=url))
            n=129
            heights=ds.read(1,out_shape=(n,n),resampling=Resampling.bilinear,masked=True)
            transform=ds.transform*ds.transform.scale(ds.width/n,ds.height/n)
            # Mesh vertices are raster-cell centers, not fictitious map corners.
            xs=[float((transform*(i+.5,.5))[0]) for i in range(n)]
            ys=[float((transform*(.5,i+.5))[1]) for i in range(n)]
            tiles.append(dict(siteId=code,width=n,height=n,x=xs,y=ys,z=heights.filled(np.nan).tolist(),crs=ds.crs.to_wkt(),sourceSha256=site['provenance']['sha256'],displayPixelM=float(abs(transform.a)),bounds=list(ds.bounds)))
            for region in [r for r in regions if r['siteId']==code]:
                flat=np.array([p for ring in region['ringsXY'] for p in ring]);region['boundsXY']=[float(flat[:,0].min()),float(flat[:,1].min()),float(flat[:,0].max()),float(flat[:,1].max())]
                lon,lat=inverse.transform(float(flat[:,0].mean()),float(flat[:,1].mean()));region['labelCoordinate']=[float(lon),float(lat)]
            sources.append(dict(siteId=code,url=url,sha256=hashlib.sha256(raw).hexdigest(),roiCRS=source_prj,projectionResidualDeg=residual,projection='South polar stereographic, MOON_ME/DE421; units and projection checked against native DEM',bounds=list(ds.bounds)))
    output=dict(schemaVersion=1,regions=regions,tiles=tiles,sources=sources,scope='Published illumination study regions, not certified landing zones. Only the existing research-point markers have cached mission calculations. Display terrain is downsampled and is not the horizon calculation mesh.')
    text=json.dumps(output,allow_nan=True,separators=(',',':')).replace('NaN','null')
    raw=text.encode();checksum=hashlib.sha256(raw).hexdigest();artifact=Path(f'data/spatial-{checksum[:12]}.json');artifact.write_bytes(raw)
    Path('data/spatial.json').write_bytes(raw)
    dataset['spatial']=dict(url='/'+artifact.as_posix(),sha256=checksum,scope=output['scope'],regionCount=len(regions),sources=sources)
    Path('data/mission-data.json').write_text(json.dumps(dataset,separators=(',',':')),encoding='utf-8')
    print('Regions:',len(regions),'terrain tiles:',len(tiles),flush=True)

if __name__=='__main__':build()
