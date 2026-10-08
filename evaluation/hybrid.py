"""Paraphrase gold set. Hybrid requires a live API key; no mocked quality scores."""
import argparse,json,tempfile
from pathlib import Path
from reportlab.pdfgen.canvas import Canvas
from app.core import Store
from app.ai import index_document,retrieve
from evaluation.run import FACTS
GOLD=[('How long do I have to return my purchase?',1),('When will my parcel arrive?',2),('How many months is the product protected?',3),('Which day can employees stay home?',4),('How much paid time off is available?',5),('What time can I contact the help desk?',6),('What is the minimum credential length?',7),('How often are recovery copies made?',8),('How long is stored information kept?',9),('When must bills be settled?',10)]
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--method',choices=['lexical','semantic','hybrid'],default='lexical');args=parser.parse_args()
    with tempfile.TemporaryDirectory() as tmp:
        file=Path(tmp)/'gold.pdf';pdf=Canvas(str(file))
        for _,fact in FACTS:pdf.drawString(40,750,fact);pdf.showPage()
        pdf.save();store=Store(Path(tmp)/'db');doc=store.ingest('gold.pdf',file.read_bytes())['id']
        if args.method!='lexical':index_document(store,doc)
        cases=[]
        for query,page in GOLD:
            hits=retrieve(store,query,[doc],args.method);pages=[h['page'] for h in hits];rank=pages.index(page)+1 if page in pages else 0
            cases.append({'question':query,'expected_page':page,'retrieved_pages':pages,'reciprocal_rank':1/rank if rank else 0})
    print(json.dumps({'method':args.method,'recall_at_4':sum(c['reciprocal_rank']>0 for c in cases)/len(cases),'mrr_at_4':sum(c['reciprocal_rank'] for c in cases)/len(cases),'cases':cases,'limitations':'10 author-labelled synthetic paraphrases; not a general quality or answer faithfulness benchmark.'},indent=2))
if __name__=='__main__':main()
