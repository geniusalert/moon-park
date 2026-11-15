# Original imagery intake · 11 November 2026

## Acquired and checked

The referenced Download Lunar Images chat identified LROC product NAC_DTM_SHACKRDGE02_M139797542_120CM. The original 21,434,528-byte GeoTIFF and its README were downloaded from the LROC PDS link, which redirects to the NASA PDS archive. Source URLs, final redirect URLs and SHA-256 identities are retained in data/raw/imagery/*.source.json. No new download is required from the user for this product.

The image is 5,116 × 4,183 pixels, one 8-bit band, 1.20 m/pixel, in south-polar stereographic coordinates on a 1,737,400 m lunar sphere. It includes valid image data at our Connecting Ridge outline-1 anchor. It does not include the selected Shackleton or de Gerlache anchors. Product metadata describes 22 September 2010 source imaging; it does not show the simulated 2026 mission lighting. [Product page](https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_SHACKRDGE02_M139797542_120CM), [product group and README](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_DTM_SHACKRDGE02).

A source-grid-aligned crop of approximately 2 km × 2 km is prepared as data/imagery/connecting-ridge-context-1p2m.tif, with a PNG preview and machine-readable source/coverage manifest alongside it. Pixel values are preserved without contrast enhancement or invented fill. Only 40.7% of the requested crop has non-nodata image values; its mask is preserved. This fraction describes source-mask support, not sunlight availability or whole-region coverage. The GeoTIFF retains projection and transform; use the source manifest to position the PNG preview.

Every overlapping source/crop pixel was checked for equality, and the selected anchor pixel is preserved. Projection agreement does not establish exact image-to-current-DEM registration. The source README reports average X/Y offsets of −2.88/−6.47 m in its DTM comparison to Site01 adjusted LOLA tracks. No blind correction has been applied to this orthophoto. Registration must be assessed before using it as an aligned terrain texture or pixel-accurate overlay.

## Still useful from the user

Original orthophotos or georeferenced image mosaics near Shackleton rim (89.7614° S, 157.1289° W) and de Gerlache rim (88.6680° S, 68.4034° W), with source/product IDs and map metadata. The linked chat supplies elevation/slope links for these locations rather than verified photographs. The project already contains the three native LOLA elevation maps; re-downloading them is unnecessary. Additional Connecting Ridge coverage or a different illumination view could fill the current context-image gaps.

## Integration state

Prepared as a historical context asset; not yet applied to the scientific terrain display or included in the v0.7 release ZIP. The horizon, ephemeris, decision and trace calculations remain unchanged. No generic Moon image is substituted for local source data. See IMAGE_REQUESTS.md for exact requested footprints.

## Build 0.8 update — supersedes the intake state above

All three user-identified areas now have prepared historical context and are integrated in the app and v0.8 package. Shackleton has full crop support; de Gerlache has 82.3% acquired support and explicit missing-strip masks after an HTTP 429 one-hour retry instruction. No further requests were made. Original master-file hashes are not claimed for ranged acquisitions. See HISTORICAL_IMAGERY.md for current products, dates, registration limits and validation. No extra user download is needed to use this milestone.


## Build 0.10 update — current acquisition state

The de Gerlache context crop is now complete with 100.0% native source support. After the cooldown, two source requests acquired 10,485,760 additional bytes. All 710,355 added pixels come from the original source; every previously available pixel remains unchanged. The complete master image was not downloaded. Connecting Ridge remains 40.7% supported due to source nodata; Shackleton remains 100.0%. Historical lighting and registration limits remain. See imagery-transition-v0.10.json and STATUS.md.

