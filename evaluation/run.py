"""Synthetic English retrieval regression benchmark, not an LLM quality score."""
import json
import tempfile
import time
from pathlib import Path
from statistics import median
from reportlab.pdfgen.canvas import Canvas
from app.core import Store, extract_quotes, verify_quotes

FACTS=[('refund','Refund requests must arrive within thirty days.'),('shipping','Shipping takes five business days.'),('warranty','Warranty coverage lasts twelve months.'),('remote','Remote work is allowed every Friday.'),('vacation','Vacation allowance is twenty days annually.'),('support','Support opens at nine in the morning.'),('password','Password length must be at least twelve characters.'),('backup','Backup copies are created every evening.'),('retention','Retention lasts ninety days.'),('invoice','Invoice payments are due within fourteen days.'),('travel','Travel expenses require manager approval.'),('training','Training budgets are five hundred dollars.'),('probation','Probation lasts three months.'),('overtime','Overtime requires advance approval.'),('parental','Parental leave lasts sixteen weeks.'),('equipment','Equipment is returned on the final working day.'),('accessibility','Accessibility requests go to the people team.'),('encryption','Encryption is required for company laptops.'),('incident','Incident reports must be filed within one hour.'),('meeting','Meeting notes are shared within two days.')]

def run():
    cases=[]
    with tempfile.TemporaryDirectory() as tmp:
        path=Path(tmp)/'handbook.pdf'; c=Canvas(str(path))
        for _,fact in FACTS: c.drawString(40,750,fact); c.showPage()
        c.save(); store=Store(Path(tmp)/'db.sqlite');store.ingest('Synthetic handbook.pdf',path.read_bytes())
        lat=[]
        for page,(term,fact) in enumerate(FACTS,1):
            start=time.perf_counter();hits=store.search('What is the '+term+' policy?');lat.append((time.perf_counter()-start)*1000)
            quotes=verify_quotes(extract_quotes(term,hits),hits)
            cases.append({'question':term,'expected_page':page,'top_page':hits[0]['page'] if hits else None,'passed':bool(hits and hits[0]['page']==page and any(q['text']==fact for q in quotes))})
        for query in ['astronaut','volcano','dinosaur','neptune','alchemy']:
            cases.append({'question':query,'passed':not store.search(query)})
    report={'dataset':'25 synthetic English keyword retrieval cases','passed':sum(x['passed'] for x in cases),'total':len(cases),'median_retrieval_ms':round(median(lat),2),'limitations':'Lexical retrieval regression only. Does not measure paraphrases, Turkish morphology, semantic understanding, or live LLM output.','cases':cases}
    print(json.dumps(report,indent=2))
    return report
if __name__=='__main__':
    report=run()
    raise SystemExit(0 if report['passed']==report['total'] else 1)
