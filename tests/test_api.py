import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint_returns_online():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_openapi_schema_is_available():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["title"] == "College Placement Portal API"


def test_docs_page_is_available():
    response = client.get("/docs")
    assert response.status_code == 200
