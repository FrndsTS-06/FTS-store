import os
from app.db.session import SessionLocal
from app.models import Product, Category

def inspect():
    db = SessionLocal()
    try:
        total_cats = db.query(Category).count()
        cats = db.query(Category).all()
        print(f"Total categories: {total_cats}")
        for c in cats:
            prod_count = db.query(Product).filter(Product.category_id == c.id).count()
            print(f"  - {c.slug} ({c.name}): {prod_count} products")

        total_prods = db.query(Product).count()
        print(f"\nTotal products: {total_prods}")
        
        best_sellers = db.query(Product).filter(Product.badge.ilike("%best%")).all()
        print(f"\nBest seller products: {len(best_sellers)}")
        for p in best_sellers:
            print(f"  - {p.name} | Cat: {p.category.slug} | Price: {p.price} | Compare: {p.compare_at_price} | Rating: {p.rating} ({p.review_count}) | Badge: {p.badge}")

        discount_prods = db.query(Product).filter(Product.compare_at_price > Product.price).all()
        print(f"\nDiscounted products: {len(discount_prods)}")
        for p in discount_prods[:10]:
            pct = int(round(((p.compare_at_price - p.price) / p.compare_at_price) * 100))
            print(f"  - {p.name} | Cat: {p.category.slug} | Price: {p.price} | Orig: {p.compare_at_price} | -{pct}% | Badge: {p.badge}")

        laptops = db.query(Product).join(Category).filter(Category.slug == "laptops").all()
        print(f"\nLaptops count: {len(laptops)}")
        for p in laptops:
            print(f"  - {p.name} | Price: {p.price} | Orig: {p.compare_at_price}")

        smart_devices = db.query(Product).join(Category).filter(Category.slug == "smart-devices").all()
        print(f"\nSmart devices count: {len(smart_devices)}")
        for p in smart_devices:
            print(f"  - {p.name} | Price: {p.price} | Orig: {p.compare_at_price}")

    finally:
        db.close()

if __name__ == "__main__":
    inspect()
