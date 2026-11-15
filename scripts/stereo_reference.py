"""Pure quality rules for a stereo terrain comparison, not registration approval."""
import numpy as np

CONFIDENCE={0:'No data',1:'Shadowed',4:'Interpolated or extrapolated',14:'Successful stereo correlations'}
def supported_cells(reference,mission,correlated_fraction):
    return np.isfinite(reference)&np.isfinite(mission)&(correlated_fraction>=1-1e-6)

def difference_summary(reference,mission,support):
    values=(reference.astype('float64')-mission.astype('float64'))[support]
    if not values.size:return dict(count=0,medianM=None,p05M=None,p95M=None,rmseM=None)
    return dict(count=int(values.size),medianM=float(np.median(values)),p05M=float(np.percentile(values,5)),p95M=float(np.percentile(values,95)),rmseM=float(np.sqrt(np.mean(values**2))))
