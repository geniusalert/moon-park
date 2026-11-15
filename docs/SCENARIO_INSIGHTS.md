# Rapid scenario comparison and lunar conditions

Verified 13 November 2026 in the current local source build, after the preserved 0.16 package.

## Four integrated changes

1. **Rapid comparison:** a schedule-impact card for every pinned point shows revised constraint status, signed changes in total and longest continuous shared windows, and inspection access. The existing point-by-delay grid remains the bounded alternatives workflow. Unavailable results do not produce zero metrics.
2. **Operational countdowns:** original/revised comparison columns now include Sun and Earth state and their next transition from arrival. Live countdowns in inspection still use replay time. Hidden objects report their return; no transition means none found inside the calculated interval, never a claim of permanent visibility. Sample brackets and UTC endpoints are preserved.
3. **Lunar conditions:** an ideal one-metre object's shadow at the selected solar elevation is compared with a clearly illustrative 30° Sun. Both use the same 0–100 m bar scale; longer shadows clip visually but retain numerical length. Below-horizontal solar centres have no finite estimate. This flat-plane centre-ray sketch is not actual terrain shadowing or an Earth forecast. Text distinguishes an airless horizon from atmospheric effects without introducing atmospheric corrections into lunar calculations.
4. **Why changes matter:** aligned relative-time samples identify the first visibility difference between baseline and revised arrival, with both UTC times and Sun/Earth clearance. Tested site pairs report spherical distance, shared-time difference and the separate Sun elevation/skyline values at arrival. Differences in local obstruction can be inspected in the existing horizon and terrain-witness views. These observations do not prove causal attribution or establish a spatial error bound. Reference-sphere results explicitly cannot infer local terrain effects.

Derived schedule-impact evidence is included in JSON export and the human-readable brief; workspace schema 1 remains compatible because scenarios and restoration rules are unchanged. The shadow teaching comparison is not a saved engineering calculation. Views clear when results are missing and recompute from active scenario settings.

## Verification

86 JavaScript tests pass, including signed schedule effects, zero shifts, status flips, low-Sun/vertical/below-horizontal shadow geometry, longitude wrapping and exact-pole distances. Existing event tests cover hidden/no-transition and final-boundary cases. The unchanged Python worker previously passed 51 tests during N17; no Python changes were made here.

Browser verified three prepared locations. One scenario retains no direct Earth visibility; other locations gain roughly 48 shared hours under the recorded 48-hour shift. First changed samples include Earth clearances close to zero. Replay updates the selected solar-angle sketch (one observed last sample: 0.62° gives about 93.0 m ideal shadow). At 390 px viewport, document client/scroll widths both equal 375 px. No console errors were recorded. Screenshot: rapid-scenario-insights.jpg. These are software checks, not human-study or independent scientific validation.
