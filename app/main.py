import os
import time
import hashlib
import hmac
import secrets
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from app.core import Store, extract_quotes, ollama_quotes

BASE=Path(__file__).parent

def create_app(db_path=None):
    app=FastAPI(title='Sourcewise',version='0.1.0')
    on_vercel = os.getenv('VERCEL') == '1'
    database_url = os.getenv('DATABASE_URL')
    password = os.getenv('APP_PASSWORD', '')
    if on_vercel and not database_url:
        raise RuntimeError('Set DATABASE_URL to a PostgreSQL connection URL before deploying.')
    if on_vercel and (not database_url.startswith(('postgres://', 'postgresql://'))):
        raise RuntimeError('Vercel requires a PostgreSQL DATABASE_URL.')
    if on_vercel and len(password) < 16:
        raise RuntimeError('Set APP_PASSWORD to a strong password of at least 16 characters.')
    store=Store(db_path or database_url or os.getenv('DATABASE_PATH','data/sourcewise.db'))
    max_upload = 4*1024*1024 if on_vercel else 10*1024*1024
    def valid_session(token):
        try:
            stamp, nonce, signature = token.split('.')
            payload = stamp + '.' + nonce
            expected = hmac.new(password.encode(), payload.encode(), hashlib.sha256).hexdigest()
            age = time.time() - int(stamp)
            return 0 <= age <= 86400 and hmac.compare_digest(expected, signature)
        except (ValueError, AttributeError):
            return False
    @app.middleware('http')
    async def protect(request, call_next):
        protected = request.url.path.startswith('/api/') or request.url.path in ('/docs','/redoc','/openapi.json')
        if password and protected and request.url.path != '/api/login' and not valid_session(request.cookies.get('sourcewise_session','')):
            return JSONResponse({'detail':'Sign in to this workspace.'},status_code=401)
        response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        if protected: response.headers['Cache-Control'] = 'no-store'
        return response
    @app.post('/api/login')
    def login(body:Login):
        if not password or not hmac.compare_digest(body.password.encode(), password.encode()):
            raise HTTPException(401,'Incorrect workspace password.')
        payload = str(int(time.time())) + '.' + secrets.token_hex(16)
        signature = hmac.new(password.encode(), payload.encode(), hashlib.sha256).hexdigest()
        response = JSONResponse({'status':'ok'})
        response.set_cookie('sourcewise_session',payload+'.'+signature,max_age=86400,httponly=True,secure=on_vercel,samesite='strict')
        return response
    @app.get('/api/config')
    def config():
        return {'storage':'postgresql' if store.postgres else 'sqlite', 'hosted':on_vercel, 'max_upload_mb':max_upload//(1024*1024)}
    app.state.store=store
    @app.get('/')
    def home(): return FileResponse(BASE/'static/index.html')
    @app.get('/health')
    def health(): return {'status':'ok'}
    @app.get('/api/documents')
    def documents(): return store.documents()
    @app.post('/api/documents',status_code=201)
    async def upload(file:UploadFile):
        try:
            data=await file.read(max_upload+1)
            if len(data)>max_upload: raise HTTPException(413,f'Maximum file size is {max_upload//(1024*1024)} MB.')
            if not data.startswith(b'%PDF-'): raise HTTPException(400,'Upload a valid PDF file.')
            name=(file.filename or 'document.pdf').replace('\\','/').split('/')[-1][:180]
            try: return store.ingest(name,data)
            except ValueError as e: raise HTTPException(422,str(e)) from e
            except Exception as e: raise HTTPException(422,'PDF could not be parsed.') from e
        finally: await file.close()
    @app.delete('/api/documents/{doc}',status_code=204)
    def delete(doc:str):
        if not store.delete(doc): raise HTTPException(404,'Document not found.')
    @app.post('/api/ask')
    def ask(body:Question):
        start=time.perf_counter()
        question=body.question.strip()
        if not question: raise HTTPException(422,'Question cannot be blank.')
        known={x['id'] for x in store.documents()}
        if any(x not in known for x in body.document_ids): raise HTTPException(404,'Selected document not found.')
        hits=store.search(question,body.document_ids)
        mode=os.getenv('ANSWER_MODE','extractive')
        if mode not in ('extractive','ollama'): raise HTTPException(503,'Invalid ANSWER_MODE configuration.')
        quotes=[]
        if hits:
            if mode=='ollama':
                try: quotes=ollama_quotes(question,hits,os.getenv('OLLAMA_URL','http://localhost:11434'),os.getenv('OLLAMA_MODEL','qwen2.5:3b'))
                except Exception as e: raise HTTPException(502,'Local model unavailable or returned invalid output. Check Ollama configuration.') from e
            else: quotes=extract_quotes(question,hits)
        by_id={h['id']:h for h in hits}
        sources=[{'document_id':by_id[q['id']]['document_id'],'name':by_id[q['id']]['name'],'page':by_id[q['id']]['page'],'quote':q['text'],'score':by_id[q['id']]['score']} for q in quotes]
        return {'status':'evidence_found' if sources else 'no_evidence','mode':mode,'answer':'Relevant document passages are shown below.' if sources else 'No matching evidence found. Try more specific words from the document.','sources':sources,'latency_ms':round((time.perf_counter()-start)*1000,1)}
    return app

class Login(BaseModel):
    password:str=Field(min_length=1,max_length=256)

class Question(BaseModel):
    question:str=Field(min_length=1,max_length=1000)
    document_ids:list[str]=Field(default_factory=list,max_length=50)

app=create_app()
