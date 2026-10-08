from io import BytesIO
from reportlab.pdfgen.canvas import Canvas
from fastapi.testclient import TestClient
from app.main import create_app
from app.core import verify_quotes

def pdf(pages):
    b=BytesIO(); c=Canvas(b)
    for text in pages:
        c.drawString(50,750,text); c.showPage()
    c.save(); return b.getvalue()

def client(tmp_path): return TestClient(create_app(tmp_path/'test.db'))

def test_upload_retrieve_delete_persistence(tmp_path):
    c=client(tmp_path)
    r=c.post('/api/documents',files={'file':('policy.pdf',pdf(['Office hours start at nine.','Remote work is allowed on Fridays.']),'application/pdf')})
    assert r.status_code==201
    doc=r.json()['id']
    answer=c.post('/api/ask',json={'question':'When is remote work allowed?','document_ids':[doc]}).json()
    assert answer['status']=='evidence_found'
    assert answer['sources'][0]['page']==2
    assert answer['sources'][0]['quote']=='Remote work is allowed on Fridays.'
    assert client(tmp_path).get('/api/documents').json()[0]['id']==doc
    assert c.delete('/api/documents/'+doc).status_code==204
    assert c.post('/api/ask',json={'question':'remote'}).json()['status']=='no_evidence'

def test_invalid_and_empty_pdf(tmp_path):
    c=client(tmp_path)
    assert c.post('/api/documents',files={'file':('x.pdf',b'not pdf')}).status_code==400
    assert c.post('/api/documents',files={'file':('blank.pdf',pdf(['']))}).status_code==422
    assert c.post('/api/documents',files={'file':('broken.pdf',b'%PDF-invalid')}).status_code==422

def test_validation_scope_and_home(tmp_path):
    c=client(tmp_path)
    assert c.get('/').status_code==200
    assert c.get('/health').json()['status']=='ok'
    assert c.post('/api/ask',json={'question':'   '}).status_code==422
    assert c.post('/api/ask',json={'question':'test','document_ids':['missing']}).status_code==404
    assert c.delete('/api/documents/missing').status_code==404
    a=c.post('/api/documents',files={'file':('a.pdf',pdf(['Mercury is a planet.']))}).json()['id']
    c.post('/api/documents',files={'file':('b.pdf',pdf(['Saturn has rings.']))})
    assert c.post('/api/ask',json={'question':'Saturn','document_ids':[a]}).json()['status']=='no_evidence'

def test_quotes_cannot_be_invented():
    hits=[{'id':'one','text':'Refunds take five days.'}]
    assert verify_quotes([{'id':'one','text':'Refunds take two days.'}],hits)==[]
    assert verify_quotes([{'id':'wrong','text':'Refunds take five days.'}],hits)==[]
    assert len(verify_quotes([{'id':'one','text':'Refunds take five days.'}],hits))==1

def test_model_errors_are_visible(tmp_path,monkeypatch):
    monkeypatch.setenv('ANSWER_MODE','ollama')
    def fail(*args): raise RuntimeError('offline')
    monkeypatch.setattr('app.main.ollama_quotes',fail)
    c=client(tmp_path)
    c.post('/api/documents',files={'file':('a.pdf',pdf(['Refunds take five days.']))})
    assert c.post('/api/ask',json={'question':'refunds'}).status_code==502

def test_oversized_upload(tmp_path):
    c=client(tmp_path)
    assert c.post('/api/documents',files={'file':('big.pdf',b'%PDF-'+b'x'*(10*1024*1024))}).status_code==413

def test_password_auth_and_cookie(tmp_path,monkeypatch):
    monkeypatch.setenv('APP_PASSWORD','a-strong-workspace-password')
    c=client(tmp_path)
    assert c.get('/api/documents').status_code==401
    assert c.get('/docs').status_code==401
    assert c.get('/').status_code==200
    assert c.post('/api/login',json={'password':'wrong'}).status_code==401
    r=c.post('/api/login',json={'password':'a-strong-workspace-password'})
    assert r.status_code==200
    assert 'HttpOnly' in r.headers['set-cookie']
    assert c.get('/api/documents').status_code==200
    c.cookies.set('sourcewise_session','fake')
    assert c.get('/api/documents').status_code==401

def test_vercel_requires_configuration(monkeypatch):
    import pytest
    monkeypatch.setenv('VERCEL','1')
    monkeypatch.delenv('DATABASE_URL',raising=False)
    with pytest.raises(RuntimeError,match='DATABASE_URL'):create_app()
    monkeypatch.setenv('DATABASE_URL','postgresql://user:pass@localhost/db')
    monkeypatch.setenv('APP_PASSWORD','short')
    with pytest.raises(RuntimeError,match='APP_PASSWORD'):create_app()

def test_vercel_starts_without_db_access_and_limits_upload(monkeypatch):
    monkeypatch.setenv('VERCEL','1')
    monkeypatch.setenv('DATABASE_URL','postgresql://user:pass@localhost/db')
    monkeypatch.setenv('APP_PASSWORD','a-strong-workspace-password')
    c=TestClient(create_app())
    r=c.post('/api/login',json={'password':'a-strong-workspace-password'})
    assert 'Secure' in r.headers['set-cookie']
    # TestClient default HTTP URL does not send secure cookies; use HTTPS.
    c=TestClient(create_app(),base_url='https://testserver')
    c.post('/api/login',json={'password':'a-strong-workspace-password'})
    assert c.get('/api/config').json()['max_upload_mb']==4
    assert c.post('/api/documents',files={'file':('big.pdf',b'%PDF-'+b'x'*(4*1024*1024))}).status_code==413

def test_postgres_adapter_parameterization():
    from app.core import PostgresAdapter
    class Fake:
        def execute(self,q,p):self.query=q;self.params=p;return self
    db=Fake();PostgresAdapter(db).execute('DELETE FROM documents WHERE id=?',('unsafe\'value',))
    assert db.query=='DELETE FROM documents WHERE id=%s'
    assert db.params==('unsafe\'value',)
