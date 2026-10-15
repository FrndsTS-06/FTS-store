import urllib.request
import json

def test_frontend_live():
    print("--- 1. Testing Storefront HTML Serving ---")
    with urllib.request.urlopen("http://127.0.0.1:3000/") as resp:
        html = resp.read().decode("utf-8")
        assert resp.status == 200
        assert "FTS Store" in html
        assert "/src/main.tsx" in html
        print("  [SUCCESS] Root storefront (http://127.0.0.1:3000/) returned 200 OK with FTS Store HTML")

    print("\n--- 2. Testing Direct Client-Side Routing ---")
    with urllib.request.urlopen("http://127.0.0.1:3000/products") as resp:
        html = resp.read().decode("utf-8")
        assert resp.status == 200
        assert "FTS Store" in html
        print("  [SUCCESS] Direct navigation to /products returned 200 OK")

    with urllib.request.urlopen("http://127.0.0.1:3000/products/aurapulse-wireless-headphones") as resp:
        html = resp.read().decode("utf-8")
        assert resp.status == 200
        print("  [SUCCESS] Direct navigation to /products/:idOrSlug returned 200 OK")

    print("\n--- 3. Testing Vite API Reverse Proxy to Backend ---")
    with urllib.request.urlopen("http://127.0.0.1:3000/api/v1/products?page=1&page_size=4") as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        assert "items" in data
        assert len(data["items"]) == 4
        print(f"  [SUCCESS] Vite proxy /api/v1/products returned {data['total']} total products from FastAPI backend")

    with urllib.request.urlopen("http://127.0.0.1:3000/api/v1/categories") as resp:
        assert resp.status == 200
        cats = json.loads(resp.read().decode("utf-8"))
        assert len(cats) >= 6
        print(f"  [SUCCESS] Vite proxy /api/v1/categories returned {len(cats)} categories")

    print("\nALL FRONTEND LIVE SERVER CHECKS PASSED!")

if __name__ == "__main__":
    test_frontend_live()
