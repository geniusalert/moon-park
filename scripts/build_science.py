"""Reproduce the regional science dataset and evidence in dependency order."""
import shutil
import subprocess
import sys

node=shutil.which('node')
if not node:raise RuntimeError('Node.js is required')
steps=[
    [node,'scripts/snapshot_baseline.mjs'],
    [sys.executable,'scripts/extend_horizons.py'],
    [sys.executable,'scripts/prepare_spice.py'],
    [sys.executable,'scripts/validate_convergence.py'],
    [node,'scripts/compare_terrain.mjs'],
    [node,'scripts/validate_data.mjs'],
    [sys.executable,'scripts/fetch_clones.py'],
    [sys.executable,'scripts/prepare_variants.py'],
    [sys.executable,'scripts/refine_uncertainty.py'],
    [node,'scripts/validate_uncertainty.mjs'],
    [sys.executable,'scripts/prepare_spatial.py'],
    [node,'scripts/validate_spatial.mjs'],
    [sys.executable,'scripts/prepare_candidates.py'],
    [node,'scripts/validate_candidates.mjs'],
    [sys.executable,'scripts/validate_candidate_science.py'],
    [node,'scripts/validate_trace.mjs'],
    [node,'scripts/export_image_requests.mjs'],
    [sys.executable,'scripts/stamp_build.py'],
]
for command in steps:
    print('Running',command[-1],flush=True)
    subprocess.run(command,check=True)
