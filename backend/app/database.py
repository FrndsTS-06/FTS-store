import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict
from app.config import settings
from app.data.seed_data import CATEGORIES, PRODUCTS, COUPONS
from app.schemas import (
    Product, Category, CartItemInput, CartItemDetail,
    CartCalculationResponse, OrderCreateRequest, OrderResponse, CustomerInfo
)

class InMemoryDatabase:
    def __init__(self):
        self._categories: List[Category] = [Category(**cat) for cat in CATEGORIES]
        self._products: List[Product] = [Product(**p) for p in PRODUCTS]
        self._coupons: Dict[str, int] = dict(COUPONS)
        self._orders: Dict[str, OrderResponse] = {}

    def get_categories(self) -> List[Category]:
        return self._categories

    def get_category_by_slug(self, slug: str) -> Optional[Category]:
        for cat in self._categories:
            if cat.slug.lower() == slug.lower():
                return cat
        return None

    def get_products(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        badge: Optional[str] = None,
        sort_by: str = "featured"
    ) -> List[Product]:
        results = list(self._products)

        # Filter by category
        if category and category != "all":
            results = [p for p in results if p.category.lower() == category.lower()]

        # Filter by search keyword
        if search:
            query = search.strip().lower()
            results = [
                p for p in results
                if query in p.name.lower()
                or query in p.description.lower()
                or any(query in tag.lower() for tag in p.tags)
            ]

        # Filter by price bounds
        if min_price is not None:
            results = [p for p in results if p.price >= min_price]
        if max_price is not None:
            results = [p for p in results if p.price <= max_price]

        # Filter by badge
        if badge:
            results = [p for p in results if p.badge and p.badge.lower() == badge.lower()]

        # Sorting
        if sort_by == "price-low":
            results.sort(key=lambda p: p.price)
        elif sort_by == "price-high":
            results.sort(key=lambda p: p.price, reverse=True)
        elif sort_by == "rating":
            results.sort(key=lambda p: p.rating, reverse=True)
        elif sort_by == "newest":
            results.sort(key=lambda p: p.created_at, reverse=True)
        # default featured keeps curated order

        return results

    def get_product_by_id(self, product_id: str) -> Optional[Product]:
        for p in self._products:
            if p.id == product_id or p.slug == product_id:
                return p
        return None

    def validate_coupon(self, code: str) -> Tuple[bool, int, str]:
        if not code:
            return False, 0, "No coupon provided"
        clean_code = code.strip().upper()
        if clean_code in self._coupons:
            discount = self._coupons[clean_code]
            return True, discount, f"Coupon '{clean_code}' applied! You save {discount}%."
        return False, 0, f"Coupon code '{clean_code}' is invalid or expired."

    def calculate_cart(
        self, items: List[CartItemInput], coupon_code: Optional[str] = None
    ) -> CartCalculationResponse:
        detailed_items: List[CartItemDetail] = []
        subtotal = 0.0
        total_items_count = 0

        for item in items:
            product = self.get_product_by_id(item.product_id)
            if not product:
                continue
            line_total = round(product.price * item.quantity, 2)
            detailed_items.append(
                CartItemDetail(
                    product_id=product.id,
                    product_name=product.name,
                    product_image=product.image,
                    category=product.category,
                    unit_price=product.price,
                    quantity=item.quantity,
                    total_price=line_total,
                )
            )
            subtotal += line_total
            total_items_count += item.quantity

        subtotal = round(subtotal, 2)

        # Coupon Discount
        discount_amount = 0.0
        applied_coupon_label = None
        if coupon_code:
            is_valid, discount_pct, _ = self.validate_coupon(coupon_code)
            if is_valid and subtotal > 0:
                discount_amount = round(subtotal * (discount_pct / 100.0), 2)
                applied_coupon_label = f"{coupon_code.upper()} (-{discount_pct}%)"

        after_discount = max(0.0, subtotal - discount_amount)

        # Shipping Calculation
        is_free_shipping = after_discount >= settings.FREE_SHIPPING_THRESHOLD or subtotal == 0
        shipping_fee = 0.0 if is_free_shipping else settings.STANDARD_SHIPPING_FEE

        # Tax Calculation
        tax_amount = round(after_discount * settings.DEFAULT_TAX_RATE, 2)
        total = round(after_discount + tax_amount + shipping_fee, 2)

        return CartCalculationResponse(
            items=detailed_items,
            subtotal=subtotal,
            discount_amount=discount_amount,
            discount_applied=applied_coupon_label,
            tax_rate=settings.DEFAULT_TAX_RATE,
            tax_amount=tax_amount,
            shipping_fee=shipping_fee,
            is_free_shipping=is_free_shipping,
            free_shipping_threshold=settings.FREE_SHIPPING_THRESHOLD,
            total=total,
            item_count=total_items_count,
        )

    def create_order(self, order_data: OrderCreateRequest) -> OrderResponse:
        summary = self.calculate_cart(order_data.items, order_data.coupon_code)
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        tracking = f"TRK-{uuid.uuid4().hex[:10].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        order_record = OrderResponse(
            order_id=order_id,
            status="confirmed",
            customer=order_data.customer,
            summary=summary,
            payment_method=order_data.payment_method,
            created_at=now_iso,
            tracking_number=tracking,
        )

        self._orders[order_id] = order_record
        return order_record

    def get_order(self, order_id: str) -> Optional[OrderResponse]:
        return self._orders.get(order_id)

db = InMemoryDatabase()
