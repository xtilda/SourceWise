import json
import pytest
from app import ai
from app.core import Store
from tests.test_app import pdf

def test_index_retrieve_scope_persistence_cascade(tmp_path,monkeypatch):
    store=Store(tmp_path/'db');a=store.ingest('a.pdf',pdf(['A car travels on the road.']))['id'];b=store.ingest('b.pdf',pdf(['Bananas are yellow.']))['id']
    def embedding(texts):return [[1.,0.]+[0.]*510 if 'Bananas' not in t else [0.,1.]+[0.]*510 for t in texts]
    monkeypatch.setattr(ai,'embed',embedding)
    with pytest.raises(ValueError,match='Index every'):ai.retrieve(store,'automobile',[],'hybrid')
    ai.index_document(store,a);ai.index_document(store,b)
    assert ai.retrieve(Store(tmp_path/'db'),'automobile',[],'semantic')[0]['document_id']==a
    assert ai.retrieve(store,'automobile',[b],'semantic')==[]
    assert ai.retrieve(store,'car',[],'hybrid')[0]['document_id']==a
    store.delete(a)
    with store.connect() as db:assert db.execute('SELECT COUNT(*) AS n FROM embeddings').fetchone()['n']==1

def test_provider_validation(monkeypatch):
    monkeypatch.setattr(ai,'api',lambda *args:{'data':[{'index':0,'embedding':[1,2]}]})
    with pytest.raises(ValueError):ai.embed(['x'])

def test_grounded_answer_fail_closed(monkeypatch):
    hits=[{'id':'a','text':'Shipping takes five days.'}]
    def output(quotes):return {'choices':[{'message':{'content':json.dumps({'answer':'Five days.','quotes':quotes})}}]}
    monkeypatch.setattr(ai,'api',lambda *args:output([{'id':'a','text':'Shipping takes five days.'}]))
    assert ai.grounded_answer('when',hits)[0]=='Five days.'
    monkeypatch.setattr(ai,'api',lambda *args:output([{'id':'a','text':'Shipping takes two days.'}]))
    assert ai.grounded_answer('when',hits)==('',[])

def test_http_payload(monkeypatch):
    import httpx
    real=httpx.Client;seen=[]
    def handler(request):
        seen.append(request);return httpx.Response(200,json={'data':[{'index':0,'embedding':[1.]+[0.]*511}]})
    monkeypatch.setenv('OPENAI_API_KEY','fake-test-key')
    monkeypatch.setattr(ai.httpx,'Client',lambda **kwargs:real(transport=httpx.MockTransport(handler)))
    assert len(ai.embed(['test'])[0])==512
    assert json.loads(seen[0].content)['dimensions']==512
    assert seen[0].headers['authorization']=='Bearer fake-test-key'
