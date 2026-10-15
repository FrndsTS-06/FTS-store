import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:3000"

def fetch(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "StorefrontTester/1.0", "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")

def main():
    print("==================================================================")
    print("  FTS STORE — CUSTOMER STOREFRONT END-TO-END VERIFICATION")
    print("==================================================================")

    # 1. Home Page Verification
    s, html = fetch("/")
    assert s == 200, f"Expected 200, got {s}"
    assert "FTS Store" in html
    assert "/src/main.tsx" in html
    print("[PASS] 1. Home page served with 200 OK and valid HTML entrypoint")

    # 2. Product Listing Page Direct Navigation
    s, html = fetch("/products")
    assert s == 200, f"Expected 200, got {s}"
    assert "FTS Store" in html
    print("[PASS] 2. Product catalogue direct navigation (/products) served with 200 OK")

    # 3. Product Detail Page Direct Navigation
    s, html = fetch("/products/aurapulse-wireless-headphones")
    assert s == 200, f"Expected 200, got {s}"
    assert "FTS Store" in html
    print("[PASS] 3. Product detail direct navigation (/products/:idOrSlug) served with 200 OK")

    # 4. Categories API via Vite Reverse Proxy
    s, body = fetch("/api/v1/categories")
    assert s == 200, f"Expected 200, got {s}"
    categories = json.loads(body)
    assert isinstance(categories, list)
    assert len(categories) >= 6
    print(f"[PASS] 4. Categories proxy API returned {len(categories)} active departments:")
    for c in categories[:3]:
        print(f"       - {c['name']} (slug: {c['slug']}, active items: {c['item_count']})")

    # 5. Featured Products API via Proxy
    s, body = fetch("/api/v1/products/featured?limit=8")
    assert s == 200, f"Expected 200, got {s}"
    featured = json.loads(body)
    assert len(featured) >= 4
    print(f"[PASS] 5. Featured products API returned {len(featured)} highlights (all active)")

    # 6. Product Listing Query with Pagination
    s, body = fetch("/api/v1/products?page=1&page_size=8")
    assert s == 200, f"Expected 200, got {s}"
    data = json.loads(body)
    assert data["total"] >= 10
    assert len(data["items"]) == 8
    print(f"[PASS] 6. Paginated catalogue query returned page {data['page']}/{data['total_pages']} ({data['total']} total items)")

    # 7. Category Filter Verification
    s, body = fetch("/api/v1/products?category=electronics")
    assert s == 200, f"Expected 200, got {s}"
    data = json.loads(body)
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["category"]["slug"] == "electronics"
    print(f"[PASS] 7. Category filter (?category=electronics) correctly matched {data['total']} tech items")

    # 8. Keyword Search Verification
    s, body = fetch("/api/v1/products?search=headphones")
    assert s == 200, f"Expected 200, got {s}"
    data = json.loads(body)
    assert data["total"] >= 1
    assert "headphone" in data["items"][0]["name"].lower()
    print(f"[PASS] 8. Keyword search (?search=headphones) found '{data['items'][0]['name']}'")

    # 9. Sorting Verification (Price Low to High)
    s, body = fetch("/api/v1/products?sort_by=price-low&page_size=6")
    assert s == 200, f"Expected 200, got {s}"
    data = json.loads(body)
    prices = [float(p["price"]) for p in data["items"]]
    assert prices == sorted(prices), f"Prices not sorted: {prices}"
    print(f"[PASS] 9. Price ascending sorting verified: {prices}")

    # 10. Single Product Detail Verification
    s, body = fetch("/api/v1/products/aurapulse-wireless-headphones")
    assert s == 200, f"Expected 200, got {s}"
    prod = json.loads(body)
    assert prod["slug"] == "aurapulse-wireless-headphones"
    assert float(prod["price"]) == 249.99
    assert prod["is_in_stock"] is True
    assert prod["stock_status"] == "in_stock"
    assert len(prod["images"]) >= 1
    print(f"[PASS] 10. Single product detail API matches database: price=${prod['price']}, status={prod['stock_status']}")

    # 11. Missing Product Error Verification
    s, body = fetch("/api/v1/products/completely-unknown-item-xyz")
    assert s == 404, f"Expected 404, got {s}"
    err = json.loads(body)
    assert err["error"]["code"] == "PRODUCT_NOT_FOUND"
    print("[PASS] 11. Missing product request cleanly returned 404 PRODUCT_NOT_FOUND")

    print("\n==================================================================")
    print("  ALL 11 STOREFRONT INTEGRATION CHECKS COMPLETED SUCCESSFULLY!")
    print("==================================================================")

if __name__ == "__main__":
    main()
