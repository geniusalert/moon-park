# Historical imagery context · build 0.10

The Historical image tab displays original 8-bit source values and preserved transparency in a separate image panel. It does not supply horizon inputs, terrain heights, mission lighting or hazard scores. No marker is placed on an unregistered image. The original product link and native projected GeoTIFF are available alongside the view.

| Area | Product | Resolution | Available crop pixels |
|---|---|---|---|
| Connecting Ridge | NAC_DTM_SHACKRDGE02_M139797542_120CM | 1.2 m | 40.7%; source nodata elsewhere |
| Shackleton rim | NAC_DTM_ESALL_SR12_NACMOS_1M | 1 m | 100.0% |
| de Gerlache rim | NAC_ROI_DEGERRIMLO1_P885S2933 | 1 m | 100.0%; requested crop fully acquired |

Source imaging is from 2010-09-22, 2010-09-23 through 2010-10-10, and a 2009-07-04 through 2013-01-29 composite, respectively. Those historical shadows do not represent November 2026 replay.

During the earlier partial acquisition, the de Gerlache PDS request returned HTTP 429 with Retry-After 3600 seconds. Further requests were stopped. Offline extraction decodes only fully retained native strips, masks all missing strips and records 1,646 complete / 355 missing strips. Its anchor is acquired and valid. The full source file SHA-256 is deliberately null: only retained byte ranges and derived products have complete hashes. Missing pixels are never synthesized. A complete future acquisition must regenerate the assets and catalog before its limitations are removed.

The source sphere radius is 1,737,400 m. Projection and exact-coordinate source support are checked, but registration to the current mission DEM is unmeasured. Shackleton's README reports varying horizontal misalignments of several meters or more between its images and DTM. The de Gerlache group estimates 5–20 m absolute positional accuracy. Connecting Ridge's README reports DTM-to-adjusted-LOLA average X/Y offsets of −2.88/−6.47 m; no blind correction is applied to imagery.

Source metadata and retained-range hashes are in data/imagery/*.source.json. The immutable catalog binds each of the 30 calculated point coordinates to a coverage state. Browser image bytes are checked against SHA-256 and PNG signature before display. Receipts retain catalog identity, image/native/metadata hashes, historical dates, point-specific coverage, acquisition limitations and display/verification state.

## Reproduction and validation

Run `python scripts/prepare_imagery_catalog.py`, `python scripts/validate_imagery.py`, and `python scripts/stamp_build.py` after changing prepared assets. Network acquisition is separate in prepare_context_imagery.py; prepare_partial_context.py uses the retained cache offline and forbids new requests. Raw cache files are excluded from the release, while prepared native crops, PNGs and provenance are included. The release validator can check prepared assets without downloading originals. Image-to-DEM registration and independent scientific accuracy are not measured by these checks.

Original pages: [Connecting Ridge](https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_SHACKRDGE02_M139797542_120CM), [Shackleton](https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_ESALL_SR12_NACMOS_1M), [de Gerlache](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_ROI_DEGERRIMLO1).


Build 0.10 resumed after the cooldown and completed this crop with 10,485,760 additional source bytes. All 710,355 newly supported pixels are original source values and all earlier valid pixels are unchanged. The preceding partial-acquisition paragraph is historical; missing-strip masks are no longer needed in this requested crop. The full master-file hash remains null because only the required source ranges were acquired. See imagery-transition-v0.10.json for the exact transition and STATUS.md for current verification.

