"""Explicit inside-polygon native-pixel selection and regional horizon geometry."""
import numpy as np
from extend_horizons import bilinear,destinations
from prepare_terrain import ray_angle

def inside_rings(x,y,rings):
    inside=np.zeros(np.broadcast(x,y).shape,dtype=bool)
    for ring in rings:
        for a,b in zip(ring,ring[1:]+ring[:1]):
            ax,ay=a;bx,by=b
            if by==ay:continue
            inside^=((ay>y)!=(by>y))&(x<(bx-ax)*(y-ay)/(by-ay)+ax)
    return inside

def select_points(region,terrain,transform,expanded=False):
    b=region['boundsXY'];inverse=~transform
    ca,ra=inverse*(b[0],b[3]);cb,rb=inverse*(b[2],b[1])
    rows,cols=np.mgrid[max(0,int(np.floor(ra))):min(terrain.shape[0],int(np.ceil(rb))),max(0,int(np.floor(ca))):min(terrain.shape[1],int(np.ceil(cb)))]
    x=transform.a*(cols+.5)+transform.c;y=transform.e*(rows+.5)+transform.f
    valid=inside_rings(x,y,region['ringsXY'])&np.isfinite(terrain[rows,cols])
    # Bilinear horizon observer support also needs all four neighbor cells.
    valid&=(rows>0)&(cols>0)&(rows<terrain.shape[0]-1)&(cols<terrain.shape[1]-1)
    vr,vc=rows[valid],cols[valid];vx,vy=x[valid],y[valid]
    if not len(vx):raise ValueError('No interior source pixel for '+region['id'])
    center=((b[0]+b[2])/2,(b[1]+b[3])/2)
    i=int(np.argmin((vx-center[0])**2+(vy-center[1])**2));anchor=(float(vx[i]),float(vy[i]))
    targets=[('anchor',anchor)]
    if expanded:targets += [(name,(anchor[0]+dx,anchor[1]+dy)) for name,dx,dy in [('grid-east',50,0),('grid-west',-50,0),('grid-north',0,50),('grid-south',0,-50)]]
    used=set();points=[]
    for name,target in targets:
        distance=(vx-target[0])**2+(vy-target[1])**2
        for chosen in used:distance[chosen]=np.inf
        i=int(np.argmin(distance));used.add(i)
        xy=[float(vx[i]),float(vy[i])];z,ok=bilinear(terrain,transform,*xy)
        if not ok:raise ValueError('Point lacks interpolation support')
        points.append(dict(key=name,xy=xy,groundM=float(z),targetXY=list(target),targetResidualM=float(np.sqrt(distance[i])),offsetFromAnchorM=float(np.hypot(xy[0]-anchor[0],xy[1]-anchor[1]))))
    return points

def profiles_at(site,local,local_transform,regional,regional_transform,forward,region_forward):
    distances=np.concatenate([np.arange(5,205,5),np.arange(220,12001,20),np.arange(12120,180001,120)])
    output={str(h):[] for h in [2,5,10]}
    for first in range(0,1440,120):
        az=np.arange(first,first+120)*.25
        lon,lat=destinations(site['longitude'],site['latitude'],az,distances)
        x,y=forward.transform(lon,lat);rx,ry=region_forward.transform(lon,lat)
        near,nvalid=bilinear(local,local_transform,x,y);far,fvalid=bilinear(regional,regional_transform,rx,ry)
        valid=nvalid|fvalid
        if not np.all(valid):raise ValueError('Missing terrain coverage in candidate horizon')
        z=np.where(nvalid,near,far)
        for h in [2,5,10]:
            angles=ray_angle(distances[None,:],z,site['groundM'],h)
            for j in range(len(az)):
                k=int(np.argmax(angles[j]));output[str(h)].append([round(float(angles[j,k]),7),float(distances[k]),int(not nvalid[j,k]),round(float(x[j,k]),3),round(float(y[j,k]),3)])
    return output
