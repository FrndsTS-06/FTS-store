def test_get_all_categories(client):
    response = client.get("/api/categories")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    assert len(categories) >= 6
    slugs = [c["slug"] for c in categories]
    assert "all" in slugs
    assert "electronics" in slugs
    assert "fashion" in slugs
    assert "home" in slugs

def test_get_category_by_slug(client):
    response = client.get("/api/categories/electronics")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "electronics"
    assert "Electronics" in data["name"]

def test_get_invalid_category_slug(client):
    response = client.get("/api/categories/non-existing-category")
    assert response.status_code == 404
