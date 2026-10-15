def test_list_all_products(client):
    response = client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "categories" in data
    assert data["total"] >= 10
    assert len(data["items"]) == data["total"]

def test_filter_by_category(client):
    response = client.get("/api/products?category=electronics")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["category"] == "electronics"

def test_search_products(client):
    response = client.get("/api/products?search=headphones")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert "Headphones" in data["items"][0]["name"]

def test_sort_products_price_low(client):
    response = client.get("/api/products?sort_by=price-low")
    assert response.status_code == 200
    items = response.json()["items"]
    prices = [item["price"] for item in items]
    assert prices == sorted(prices)

def test_sort_products_price_high(client):
    response = client.get("/api/products?sort_by=price-high")
    assert response.status_code == 200
    items = response.json()["items"]
    prices = [item["price"] for item in items]
    assert prices == sorted(prices, reverse=True)

def test_get_single_product_success(client):
    response = client.get("/api/products/prod-elec-01")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "prod-elec-01"
    assert "AuraPulse" in data["name"]
    assert data["price"] > 0

def test_get_single_product_not_found(client):
    response = client.get("/api/products/non-existent-product-id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_get_featured_products(client):
    response = client.get("/api/products/featured?limit=4")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 4
