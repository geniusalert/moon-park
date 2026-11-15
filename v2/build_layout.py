from pathlib import Path
from bs4 import BeautifulSoup,Doctype
root=Path(__file__).resolve().parents[1]
source=BeautifulSoup((root/'index.html').read_text(encoding='utf-8'),'html.parser')
s=BeautifulSoup('<!DOCTYPE html><html lang="en"><head></head><body class="v2 left-open right-open"></body></html>','html.parser')
s.head.append(BeautifulSoup(str(source.head),'html.parser').head.extract())
s.head.unwrap();s.head if False else None
# The source head is already the document head after unwrapping the empty shell head.
head=s.find('head');head.title.string='Moon Park V2 · Mission Observatory';head.append(s.new_tag('link',rel='stylesheet',href='/v2/workspace.css'));head.append(s.new_tag('link',rel='stylesheet',href='/v2/observatory.css'))
body=s.body
shell='''<header class="v2-topbar"><a class="v2-brand" href="/">◒ <strong>MOON PARK</strong><span>V2 · OBSERVATORY</span></a><div class="v2-top-context"><span id="v2StageName">LUNAR GLOBE</span><time id="v2Clock">Choose an arrival · UTC</time></div><nav aria-label="Workspace panels"><button id="v2TogglePlan" aria-expanded="true" type="button">Plan</button><button id="v2ToggleResults" aria-expanded="true" type="button">Conditions</button><button id="v2ToggleDock" aria-expanded="true" type="button">Horizon / timeline</button></nav></header><div id="v2Scene" class="v2-scene"><section id="v2WorldHost" aria-label="3D lunar environment"></section></div><aside class="v2-left" id="v2Left" aria-label="Mission planning"><section id="v2Locator" class="v2-locator"><div class="v2-panel-heading"><span>LOCATION OVERVIEW</span><button id="v2MapMode" type="button" aria-pressed="true">Follow view</button></div><div id="v2MapMount"></div><p id="v2MapPosition">Near-facing globe center</p></section><div id="v2PlanMount"></div></aside><aside class="v2-right" id="v2Right" aria-label="Calculated conditions and tools"><div id="v2ConditionsHeader"><span class="v2-kicker">MISSION CONDITIONS</span><h2 id="v2RightTitle">No site calculated</h2><p id="v2RightCoordinate">Choose a location, then Generate.</p></div><div id="v2ScenarioMount"></div><div id="v2MetricsMount"></div><p id="v2EmptyMetrics">Sunlight, Earth visibility and shared windows appear after calculation.</p><section id="v2ActionMount" aria-label="Scene actions"></section><div id="v2Notices"></div><details id="v2LandingTools"><summary>Landing playback &amp; environment</summary><div id="v2LandingMount"></div></details><details id="v2ComparisonTools"><summary>Site &amp; date comparison</summary></details><details id="v2AnalysisTools"><summary>Scientific detail &amp; engineering</summary></details><details id="v2AlternativeTools"><summary>Test alternative arrivals</summary></details><details id="v2SaveTools"><summary>Save, restore &amp; sources</summary></details><details id="v2SkyTools"><summary>Advanced observer sky</summary></details></aside><section class="v2-bottom" id="v2Bottom" aria-label="Horizon and visibility timeline"><div class="v2-charts"><article class="v2-horizon-panel"><div class="v2-panel-heading"><h2>Observer horizon</h2><span id="v2HorizonBasis">Awaiting calculation</span></div><div id="v2HorizonMount"></div></article><article class="v2-timeline-panel"><div class="v2-panel-heading"><h2>Visibility timeline</h2><span>UTC</span></div><div id="v2TimelineMount"></div></article></div><div id="v2ReplayMount"></div></section><div class="v2-scene-tools" id="v2CameraTools" aria-label="Globe camera controls"></div><div class="v2-status" role="status"><span class="v2-status-dot"></span><span id="v2StatusText">Local scientific engine · loading sources</span></div><div id="v2Toast" role="alert" hidden></div><div id="v2Compatibility" hidden></div>'''
for e in list(BeautifulSoup(shell,'html.parser').contents):body.append(e.extract())
def mount(target,selector):
 e=source.select_one(selector)
 if e is None:raise ValueError(selector)
 s.select_one(target).append(e.extract())
# Extract nested controls before their containers.
mount('#v2ScenarioMount','.active-scenario')
mount('#v2MetricsMount','.mission-live-strip')
mount('#v2ActionMount','.scene-workflow')
for id in ['sceneFlowNote','sceneLightingBadge','comparisonClock','globeEnvironment','sceneComparisonModelNote','sceneComparisonSummary','globePanel']:mount('#v2Notices','#'+id)
mount('#v2LandingMount','#landingExperience')
for selector in ['.atlas-toolbar','.camera-presets']:mount('#v2CameraTools',selector)
mount('#v2AnalysisTools','.angular-chart')
mount('#v2Notices','.next-events-strip')
mount('#v2ReplayMount','#sharedReplay')
mount('#v2MapMount','#view-map');mount('#v2HorizonMount','#view-horizon');mount('#v2TimelineMount','#view-timeline')
for id in ['view-map','view-horizon','view-timeline']:
 e=s.select_one('#'+id);e.attrs.pop('hidden',None);e.attrs.pop('role',None)
for e in list(s.select('#view-map h3,#view-map p')):e.decompose()
mount('#v2PlanMount','.mission-controls');left=s.select_one('.mission-controls');left['id']='v2PlannerScroll';left.select_one('.ai-planner').attrs.pop('open',None)
for id,target in [('compareWorkspace','#v2ComparisonTools'),('seasonResults','#v2ComparisonTools'),('inspectionPanel','#v2AnalysisTools'),('alternativesWorkspace','#v2AlternativeTools'),('workspaceTools','#v2SaveTools'),('historicalTools','#v2SaveTools'),('evidenceTools','#v2SaveTools'),('view-simulation','#v2SkyTools')]:mount(target,'#'+id)
mount('#v2Compatibility','.view-tabs')
# Keep the original view ID around the single full-screen canvas.
world=s.new_tag('section',id='view-globe');world['class']=['v2-world'];s.select_one('#v2WorldHost').append(world);mount('#view-globe','#moonGlobe')
# Retain source-only controls and identities that lived in discarded presentation wrappers.
for e in list(source.select('[id]')):
 if s.select_one('#'+e['id']) is not None:continue
 clone=BeautifulSoup(str(e),'html.parser').find()
 for nested in list(clone.select('[id]')):
  if s.select_one('#'+nested['id']) is not None:nested.decompose()
 s.select_one('#v2Compatibility').append(clone)
for e in source.select('script[type=importmap]'):body.append(e.extract())
body.append(s.new_tag('script',type='module',src='/v2/src/navigator.js'))
s.select_one('#v2CameraTools').append(BeautifulSoup('<div class="v2-camera-extra"><button id="v2Fit" type="button">Fit Moon</button><button id="v2Fullscreen" type="button" aria-label="Full screen">⤢</button></div>','html.parser'))
body.append(BeautifulSoup('<div id="v2CompactCompare" hidden><button id="v2PrevSite" type="button" aria-label="Previous compared site">←</button><span id="v2CompareName"></span><button id="v2NextSite" type="button" aria-label="Next compared site">→</button></div>','html.parser'))
action=s.select_one('#v2ActionMount').extract();s.select_one('#v2MetricsMount').insert_before(action)
box=s.new_tag('div',id='v2DescentControls');box['hidden']='';s.select_one('#v2ActionMount').append(box)
for sel in ['.landing-hud','.landing-readouts','label[for=landingTime]','#landingTime','.landing-stage-markers']:
 e=s.select_one(sel).extract();e.attrs.pop('hidden',None);box.append(e)
s.select_one('#v2Bottom').insert(0,BeautifulSoup('<div id="v2MobileCharts"><button id="v2ChartHorizon" type="button" aria-pressed="true">Horizon</button><button id="v2ChartTimeline" type="button" aria-pressed="false">Timeline</button><time id="v2MobileUTC">UTC · no calculated time</time></div>','html.parser'))
body.append(BeautifulSoup('<div id="v2FloatingPlayback"><span id="v2QuickClock">Illustrative descent</span><button id="v2QuickPlay" type="button" aria-label="Play landing">▶</button></div>','html.parser'))
# Simplify the introduction while preserving all actual location input methods.
for e in s.select('#v2PlannerScroll > h2, #v2PlannerScroll > .setup-subtitle'):
 e.decompose()
shortcuts=s.select_one('.location-shortcuts').extract()
s.select_one('#v2Compatibility').append(shortcuts)
guide=BeautifulSoup('<button id="v2Help" type="button" aria-haspopup="dialog" title="Conversational help and mission planning">✦ AI assistant</button>','html.parser')
s.select_one('.v2-brand').insert_after(guide)
# Make existing scientific descriptions discoverable by name, without scattered '?' icons.
for summary in s.select('summary'):
 if summary.get_text(strip=True)=='?':summary.string=summary.get('aria-label','Model details')
s.select_one('#v2ConditionsHeader').insert_after(s.select_one('#analysisStatus').extract())
for e in s.select('.ai-auto'):
 checkbox=e.find('input');checkbox.extract();label=s.new_tag('span');label.string='Run supported requests automatically';e.clear();e.append(checkbox);e.append(label)
handle=BeautifulSoup('<div id="v2DockResize" role="separator" tabindex="0" aria-label="Resize horizon and timeline. Drag, or use up and down arrows. Double-click to reset." aria-orientation="horizontal" aria-valuemin="180" aria-valuemax="600" aria-valuenow="290"><span></span></div>','html.parser')
s.select_one('#v2Bottom').insert(0,handle)
s.select_one('#v2ToggleDock')['aria-expanded']='false'
(root/'v2/index.html').write_text(str(s),encoding='utf-8')
