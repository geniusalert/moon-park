"""Fetch bounded PDS reference bytes using the Windows system certificate store."""
import hashlib,json,subprocess
from pathlib import Path
base='https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_pcp/diurnal/ltim/pols/'
root=Path('data/raw/diviner');root.mkdir(parents=True,exist_ok=True)
name='pcp_avg_tbol_pols_sum_ltim01_240'
requests=[(name+'.lbl',name+'.lbl',None),(name+'.xml',name+'.xml',None),(name+'.tab',name+'.polar.tab','106230000-106295535')]
records=[]
for remote,local,byte_range in requests:
 target=root/local
 command=['curl.exe','--fail','--silent','--show-error','--max-time','60','--location']
 if byte_range:command+=['--range',byte_range]
 command +=[base+remote,'--output',str(target)]
 subprocess.run(command,check=True)
 raw=target.read_bytes()
 if byte_range and len(raw)!=65536:raise ValueError('PDS range request returned an unexpected number of bytes')
 records.append(dict(url=base+remote,localPath=target.as_posix(),byteRange=byte_range,sha256=hashlib.sha256(raw).hexdigest()))
(root/'manifest.json').write_text(json.dumps(records,indent=2))
