"""Summarize actual, anonymous pilot records without counting developer checks."""
import argparse,json
from pathlib import Path

def summarize(records):
    accepted=[];excluded=[];seen=set();versions=set()
    for record in records:
        key=record.get('anonymousSessionId')
        if not key or key in seen:raise ValueError('Missing or duplicate session identity')
        seen.add(key)
        if record.get('kind')!='participant' or record.get('includeInHumanStudy') is not True:
            excluded.append(key);continue
        answers=record.get('answers',[])
        if len(answers)!=5 or not all(type(a.get('correct')) is bool for a in answers):raise ValueError('Incomplete participant answers')
        correct=sum(a['correct'] for a in answers)
        if record.get('correctCount')!=correct:raise ValueError('Score does not match recorded answers')
        if not isinstance(record.get('elapsedSeconds'),(int,float)) or record['elapsedSeconds']<0:raise ValueError('Invalid duration')
        version=record.get('reference',{}).get('version',{});versions.add(json.dumps({p:version.get(p) for p in ['index.html','src/dashboard.js','src/engine.js','src/mission.js','src/robustness.js','src/region-study.js']},sort_keys=True))
        accepted.append(record)
    if len(versions)>1:raise ValueError('Participant sessions used different app versions; report separately')
    unaided=sum(all(a['correct'] for a in r['answers']) and not r.get('assisted',False) for r in accepted)
    return dict(participants=len(accepted),excludedDeveloperOrOtherSessions=len(excluded),allTasksCorrectUnaided=unaided,gate='pending-five-participants' if len(accepted)<5 else 'met' if unaided/len(accepted)>=.8 else 'not-met',target='At least 4 of the first 5 actual participants complete all five tasks unaided; larger cohorts use the stated 80% descriptive target',byTask=[dict(task=i+1,correct=sum(r['answers'][i]['correct'] for r in accepted),total=len(accepted)) for i in range(5)],elapsedSeconds=[r['elapsedSeconds'] for r in accepted],assisted=sum(bool(r.get('assisted')) for r in accepted),scope='Formative pilot only; no population generalization or scientific validation')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('folder',type=Path);args=p.parse_args()
    report=summarize([json.loads(f.read_text(encoding='utf-8')) for f in sorted(args.folder.glob('*.json'))]);Path('docs/pilot-results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
