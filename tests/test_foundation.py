import pytest

def test_root_endpoint(client):
    """Verify top-level root metadata endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "FTS Store API"
    assert data["status"] == "online"
    assert "docs" in data
    assert "health" in data

def test_service_health(client):
    """Verify service liveness health endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "FTS Store API" in data["service"]
    assert "version" in data
    assert "environment" in data

def test_database_readiness(client):
    """Verify database connection pool readiness check."""
    response = client.get("/api/v1/health/db")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
    assert data["database"]["status"] == "ready"
    assert data["database"]["readiness"] is True
    assert data["database"]["database"] in ["sqlite", "postgresql"]

def test_top_health_alias(client):
    """Verify container orchestrator top-level /health check."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_cors_headers(client):
    """Verify CORS headers on OPTIONS preflight."""
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code in [200, 204]
    assert response.headers.get("access-control-allow-origin") in ["http://localhost:3000", "*"]
