import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"
ADMIN_KEY = "fts_admin_secret_key_2026"

def request_json(url, method="GET", data=None, headers=None):
    hdrs = {"Accept": "application/json"}
    if headers:
        hdrs.update(headers)
    body_bytes = None
    if data is not None:
        body_bytes = json.dumps(data).encode("utf-8")
        hdrs["Content-Type"] = "application/json"
    
    req = urllib.request.Request(f"{BASE_URL}{url}", data=body_bytes, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            status = resp.status
            return status, json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        return e.code, json.loads(content) if content else None

def main():
    print("--- 1. Testing Swagger UI & OpenAPI Specification ---")
    req = urllib.request.Request(f"{BASE_URL}/docs")
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8")
        assert resp.status == 200
        assert "swagger-ui" in html.lower()
        print("  [SUCCESS] Swagger UI (/docs) returns 200 OK HTML")

    status, openapi = request_json("/api/v1/openapi.json")
    assert status == 200
    assert "/api/v1/products" in openapi["paths"]
    assert "/api/v1/categories" in openapi["paths"]
    assert "/api/v1/products/{id_or_slug}" in openapi["paths"]
    assert "/api/v1/products/{product_id}/stock" in openapi["paths"]
    print(f"  [SUCCESS] OpenAPI 3.1.0 schema generated with {len(openapi['paths'])} active paths")

    print("\n--- 2. Testing Category Endpoints ---")
    status, categories = request_json("/api/v1/categories")
    assert status == 200
    assert len(categories) >= 6
    print(f"  [SUCCESS] GET /api/v1/categories returned {len(categories)} categories")
    for cat in categories[:3]:
        print(f"    - {cat['name']} ({cat['slug']}): {cat['item_count']} active products")

    status, cat_elec = request_json("/api/v1/categories/electronics")
    assert status == 200
    assert cat_elec["slug"] == "electronics"
    print(f"  [SUCCESS] GET /api/v1/categories/electronics verified: id={cat_elec['id']}")

    status, err_cat = request_json("/api/v1/categories/invalid-category-xyz")
    assert status == 404
    assert err_cat["error"]["code"] == "CATEGORY_NOT_FOUND"
    print(f"  [SUCCESS] GET /api/v1/categories/invalid-category-xyz returned 404 CATEGORY_NOT_FOUND")

    print("\n--- 3. Testing Product Catalog Endpoints ---")
    status, prod_list = request_json("/api/v1/products?page=1&page_size=5&sort_by=price-low")
    assert status == 200
    assert prod_list["total"] >= 10
    assert len(prod_list["items"]) == 5
    prices = [float(p["price"]) for p in prod_list["items"]]
    assert prices == sorted(prices)
    print(f"  [SUCCESS] GET /api/v1/products?sort_by=price-low: total={prod_list['total']}, sorted prices={prices}")

    # Search
    status, search_res = request_json("/api/v1/products?search=headphones")
    assert status == 200
    assert search_res["total"] >= 1
    print(f"  [SUCCESS] GET /api/v1/products?search=headphones: found {search_res['total']} match(es)")

    # Category filter
    status, filter_res = request_json("/api/v1/products?category=electronics")
    assert status == 200
    assert filter_res["total"] >= 1
    print(f"  [SUCCESS] GET /api/v1/products?category=electronics: returned {filter_res['total']} products")

    # Featured
    status, feat_res = request_json("/api/v1/products/featured?limit=4")
    assert status == 200
    assert len(feat_res) <= 4
    print(f"  [SUCCESS] GET /api/v1/products/featured: returned {len(feat_res)} items")

    # Single product
    first_slug = prod_list["items"][0]["slug"]
    status, single_res = request_json(f"/api/v1/products/{first_slug}")
    assert status == 200
    assert single_res["slug"] == first_slug
    print(f"  [SUCCESS] GET /api/v1/products/{first_slug}: stock_status={single_res['stock_status']}, in_stock={single_res['is_in_stock']}")

    print("\n--- 4. Testing Admin Security & Authorization ---")
    test_prod_payload = {
        "name": "Live HTTP Test Product",
        "slug": "live-http-test-prod",
        "sku": "LIVE-HTTP-001",
        "description": "Test product for live HTTP verification",
        "price": 149.99,
        "stock_quantity": 8,
        "category_id": cat_elec["id"]
    }
    # Unauthenticated attempt -> 401
    status, res_unauth = request_json("/api/v1/products", method="POST", data=test_prod_payload)
    assert status == 401
    print("  [SUCCESS] POST /api/v1/products without credentials blocked with 401 Unauthorized")

    # Admin attempt -> 201
    status, res_created = request_json(
        "/api/v1/products",
        method="POST",
        data=test_prod_payload,
        headers={"X-Admin-Key": ADMIN_KEY}
    )
    assert status == 201
    new_prod_id = res_created["id"]
    print(f"  [SUCCESS] POST /api/v1/products with X-Admin-Key created product ID={new_prod_id}")

    # Patch stock -> 200
    status, res_patched = request_json(
        f"/api/v1/products/{new_prod_id}/stock",
        method="PATCH",
        data={"stock_quantity": 2},
        headers={"X-Admin-Key": ADMIN_KEY}
    )
    assert status == 200
    assert res_patched["stock_status"] == "low_stock"
    print(f"  [SUCCESS] PATCH /api/v1/products/{new_prod_id}/stock updated stock to 2 (status: low_stock)")

    # Archive -> 204
    req_del = urllib.request.Request(
        f"{BASE_URL}/api/v1/products/{new_prod_id}",
        headers={"X-Admin-Key": ADMIN_KEY},
        method="DELETE"
    )
    with urllib.request.urlopen(req_del) as resp_del:
        assert resp_del.status == 204
    print(f"  [SUCCESS] DELETE /api/v1/products/{new_prod_id} archived product (204 No Content)")

    # Verify public lookup 404s
    status, res_after_del = request_json(f"/api/v1/products/{new_prod_id}")
    assert status == 404
    print(f"  [SUCCESS] GET /api/v1/products/{new_prod_id} correctly returns 404 for archived product")

    print("\nALL LIVE HTTP VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
