"""Optional real database integration test. Use only a disposable test database."""
import os
from pathlib import Path
from uuid import uuid4
import pytest
from app.core import Store
from tests.test_app import pdf

@pytest.mark.skipif(not os.getenv('TEST_DATABASE_URL'),reason='No disposable PostgreSQL test database configured')
def test_postgres_roundtrip():
    import psycopg
    url=os.environ['TEST_DATABASE_URL']
    with psycopg.connect(url) as c:
        c.execute(Path('migrations/001_initial.sql').read_text())
        c.execute(Path('migrations/002_embeddings.sql').read_text())
    store=Store(url)
    result=store.ingest('integration-'+uuid4().hex+'.pdf',pdf(['A unique nebular policy permits remote Fridays.']))
    try:
        assert any(d['id']==result['id'] for d in Store(url).documents())
        hits=Store(url).search('nebular',[result['id']])
        assert hits[0]['page']==1
    finally:store.delete(result['id'])
    assert not store.search('nebular',[result['id']])
