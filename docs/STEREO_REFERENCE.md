# Shackleton stereo-source review · build 0.11

Updated 12 November 2026.

The workbench now offers the Shackleton NAC stereo terrain as a separate inspection source. Its 2 m post spacing and scientific confidence product help distinguish measured stereo support from shadowed or interpolated locations. The DTM label gives elevations in metres above a 1,737,400 m lunar sphere. [DTM product](https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_ESALL_SR12), [confidence product](https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_ESALL_SR12_CONF).

The source uses LOLA control. Its README also reports spatially varying image offsets relative to its own DTM. Agreement with our LOLA terrain therefore cannot establish independent accuracy or exact photo registration. [Product README](https://pds.mcp.nasa.gov/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/LROLRC_2001/DATA/SDP/NAC_DTM/ESALL_SR12/NAC_DTM_ESALL_SR12_README.TXT).

## Measured unshifted comparison

The existing approximately 2 km image footprint is sampled onto its existing 401 × 401 inspection grid. Reference and mission elevations are bilinearly sampled; the native reference crop retains its original values. Quality categories are displayed by nearest-neighbour sampling, while statistical eligibility requires the entire inspection-cell area to have source category 14. Thus a green centre pixel alone does not establish full-cell support.

| Quantity | Result |
|---|---|
| Strictly supported inspection cells | 156,415 / 160,801 · 97.27% |
| Cells with both heights available | 98.87% |
| Median NAC-minus-mission elevation | +0.781 m |
| Central 90% of height differences | −0.473 to +2.215 m |
| Unshifted RMS difference | 1.167 m |
| Horizontal or vertical correction fitted | None |
| Image registration established | No |

These are differences between two terrain products at nominal map coordinates. They are not an accuracy bound, independent truth, a confidence probability, or an assessment of the full published study region. Adjacent grid cells are correlated. Different effective terrain resolution, shared control, source artifacts and unmeasured map alignment remain relevant. No registration uncertainty has been removed from these statistics.

## Scientific confidence decoding

The original PDS IMG contains an attached label and the scientific categories. The browse confidence TIFF uses display intensities and was excluded from quantitative classification. Product identity, grid, source hashes, height units and the original PDS format are checked before preparation.

| Code | Interpretation | Display | Statistical eligibility |
|---|---|---|---|
| 0 | Outside usable coverage | Transparent | Excluded |
| 1 | Shadowed | Blue | Excluded |
| 4 | Filled using surrounding terrain | Amber | Excluded |
| 14 | Successful stereo matching | Green | Eligible only with full cell-area support and two valid heights |
| Other | Not defined by the supplied lookup | Grey | Excluded |

The native crop contains 11,367 category-1 cells, 11,992 category-4 cells and 978,642 category-14 cells. The complete source contains a few additional codes; their meaning is not inferred. Native cells and inspection cells use different grids, so their counts should not be combined.

## Review of the two earlier tentative landmarks

The historical v0.10 assessment is retained unchanged and identified by hash. Quality is sampled separately at each pair's nominal image and mission coordinates.

| Earlier landmark | Source category at both positions | Stereo height | Review outcome |
|---|---|---|---|
| Northern crater fit | 1 · shadowed | Unavailable | Unsupported by this stereo reference |
| Mid-rim bowl check | 14 · stereo matching | Available | Correspondence still unreviewed |

This explains why the earlier single-fit translation must not be treated as validated. It does not prove a horizontal error or quantify the ambiguity of the manually selected crater centre. The first landmark cannot be validated using a stereo height that is missing; the second still requires geometric correspondence review. No pair is accepted or removed from history, and no correction is applied.

## Workbench behaviour and reproduction

Choose Shackleton rim, then **Terrain source → Source stereo reference**. Four synthetic-light views, slope contrast and the colour quality layer are available. Zoom and pan remain synchronized. Mission pair markers and pick cursors are hidden on the reference panel; reference picks and adding a pair are blocked. Switch back to Mission terrain to record a pair. Existing pairs and their original mission-source identities remain intact. Other areas cannot inherit the Shackleton reference.

Exports record the reference catalog identity and displayed terrain source/layer alongside the original mission-based assessment. Source-bound restoration continues to recompute measurements. The reference is an inspection aid, not an alternative mission horizon input.

Prepare after the existing native terrain, imagery and registration assets:

```sh
python scripts/prepare_stereo_reference.py
python scripts/validate_stereo_reference.py
python scripts/stamp_build.py
```

Full originals stay in the ignored raw cache. Native bounded terrain/quality crops, comparison bands, masked display images and the source-linked report are packaged under data/registration/reference/. The validator recomputes support and height summaries from these derived products. When full originals are available it also checks exact crop pixels against them. All original horizon, ephemeris and candidate evidence remains unchanged.

Next acceptance gate: select additional unambiguous, spatially distributed landmarks with explicit support checks, then review correspondences separately. This source review closes neither human evaluation nor independent scientific review.
