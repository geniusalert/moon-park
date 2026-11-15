# Moon Park V2 — experimental 3D-first interface

Open `http://127.0.0.1:4182/v2/index.html` with the existing local service running. The current interface remains at `http://127.0.0.1:4182/`.

The 3D scene fills the viewport. On desktop the collapsible left column uses about 30% of the width for inputs alone. Essential conditions float at the upper right. **Menu** contains scene views, comparisons, scientific detail, alternatives, exports and sources. Mission playback remains at the bottom; **Graphs** opens an optional, resizable horizon/timeline overlay. Graphs and the map start hidden. On narrow screens the inputs and conditions become drawers. Horizon/Timeline tabs show each chart at full width on phones.

Choose a catalogue site, mission or exact coordinates; set UTC arrival/stay and observer height; Generate. Calculated sites get geographic markers. In **Menu → 3D environment**, switch between globe, the Moon/Earth/Sun diagram, landing playback and multi-site comparison. Selected-site geometry and model limits are retained. Mission replay and the illustrative descent clock remain independent. The ordinary globe uses neutral atlas lighting. Body models appear in the explicit Moon/Earth/Sun view, with normal depth occlusion; their sizes and distances remain diagrammatic.

Click **Map** beside the input heading to open the location map over the scene. Drag its heading to reposition it; close it with ×. It never replaces the input area. The locator follows the near-facing hemisphere when orbiting the globe and the selected location during a local simulation. Switch Follow view to Selected site to lock its center. This is geographic context, not added terrain coverage.

Timeline bars use the existing mission engine's continuous intervals. Clicking the timeline or using its arrow/Home/End keys selects actual samples; no time interpolation is introduced. Empty or preview-only selections do not retain another site's calculated sky or charts.

The single **AI assistant** button beside **V2 · Observatory** opens **Help & questions** for a conversation, or **Plan & run** for the existing image/text planning workflow. Scattered question-mark controls have been removed. Authored steps remain under **Steps and model limits** and work offline. The guide receives only a compact scenario summary and current sky values, explains them and cannot execute mission actions. Messages and context are sent to Meta only when you submit a question; conversations are kept in memory and can be cleared.

In **Choose your location → Location input**, choose the catalogue, **Custom lunar coordinates**, or a mission programme. Enter signed degrees, preview the coordinate, set arrival/stay and Generate. Add another location to compare up to three actual calculations. The map overlay offers 50/200/500 km radius choices and expands to a readable location map.

**Menu → Site & date comparison → Open comparison workspace** opens **Sites** (visual cards, side-by-side table or sequential inspection), **Two dates**, **Arrival alternatives**, and **Why outcomes change**. Comparisons preserve failed and unavailable outcomes. Applying an arrival remains deliberate. The explanation uses sampled clearance differences, actual schedule changes and reference-sphere distances; mismatched dates/heights/models are identified.

The right panel highlights solar elevation, separate Sun/Earth/shared totals, continuous shared time and sampled sunset/Earthset or return countdowns. Exact UTC brackets are expandable. “No sampled event” means no transition was found before the result's last sample; it does not establish permanent visibility. Detailed original readings remain available in **All visibility metrics and source geometry**. The airless-Moon illustration compares ideal flat-plane shadow lengths with an explicitly illustrative 30° Sun.

Calculations show actual worker stages and progress, completion counts, queue state and cancellation. Stage percentages are not whole-job completion estimates. First-time custom terrain calculations can be substantially slower than cache reuse.

Use **▶ Play** at the bottom for mission replay. Drag the slider to inspect actual samples. With **Graphs** open, drag the timeline or scroll over its bars. Scrubbing pauses playback. Drag the graph overlay's top grip to resize it; focus the grip and use Up/Down for keyboard resizing, Home or double-click to reset. Mission replay stays separate from the illustrative descent clock. The globe reframes when the input column or graph overlay changes.

The introductory heading/subtitle and redundant shortcut row have been removed from the visible V2 planner. Catalogue selection, custom coordinates, mission programme selection and every existing calculation control remain available in the staged flow. The existing 8K NASA texture now uses more restrained close-up framing and markers sized consistently on screen; its lower-detail polar fill is still explicitly disclosed.

V2 shares scientific engines, data, source validation, APIs and model assets with the current application. Only the presentation coordinator, planner flow, globe and landing-view adapters are forked under `v2/src`. No current-interface application files are changed. Their captured hashes are recorded in `baseline.json`. V2 saves to a separate browser-storage key (`moon-park-lab-v2-workspace`). The experiment can be discarded without migrating or replacing the current interface.

This is a UX experiment, not a new scientific accuracy claim. Terrain limits, reference-sphere omissions, illustrative body sizes/texture orientation, decorative regolith and non-physical landing motion remain explicitly labeled.

## Verification

158 JavaScript checks pass, including 20 V2 checks. The scene-first shell and its specific acceptance limits are recorded in [evidence/SCENE_FIRST.md](evidence/SCENE_FIRST.md). Real custom-coordinate calculations, live Meta guidance, comparison modes, sampled events, progress, replay and responsive layout from earlier iterations remain documented in [evidence/ACCEPTANCE.md](evidence/ACCEPTANCE.md) and [evidence/DECISION_WORKFLOW.md](evidence/DECISION_WORKFLOW.md). Current-version application hashes remain unchanged.
