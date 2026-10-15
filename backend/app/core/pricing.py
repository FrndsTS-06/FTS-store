"""
FTS Store — Pricing & Shipping Business Rules Engine
Centralized, decimal-safe monetary arithmetic for cart calculations, taxes, shipping fees, and discounts.

BUSINESS RULES SPECIFICATION:
1. Currency & Precision:
   - All financial amounts MUST use `Decimal` with 2 decimal places (`ROUND_HALF_UP`).
   - Browser inputs are never trusted for prices, totals, or item names.

2. Shipping Fee Calculation:
   - Free shipping threshold: $100.00 USD.
   - Standard shipping flat fee: $9.99 USD.
   - If cart subtotal (prior to tax/shipping) >= $100.00 OR a verified free-shipping coupon is applied:
     shipping_fee = $0.00, is_free_shipping = True.
   - Otherwise (for subtotal > $0.00 and < $100.00):
     shipping_fee = $9.99, is_free_shipping = False.
   - If cart is completely empty (subtotal == $0.00):
     shipping_fee = $0.00, is_free_shipping = False.

3. Sales Tax Calculation:
   - Default sales tax rate: 8.00% (0.08).
   - Taxable amount = max(0, subtotal - discount_amount).
   - Tax amount = round(taxable_amount * 0.08, 2).

4. Coupon Discount Rules:
   - Percent discount: round(subtotal * (discount_pct / 100), 2).
   - Fixed discount: min(subtotal, fixed_amount).
   - Free shipping: Sets shipping_fee = 0.00.
   - Minimum order threshold enforced if defined on coupon.

5. Final Total Equation:
   - total = subtotal - discount_amount + tax_amount + shipping_fee.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Tuple
from app.models.enums import DiscountType
from app.models.order import Coupon

# =============================================================================
# Documented Global Business Rule Constants
# =============================================================================
FREE_SHIPPING_THRESHOLD = Decimal("100.00")
STANDARD_SHIPPING_FEE = Decimal("9.99")
DEFAULT_TAX_RATE = Decimal("0.08")
MAX_QUANTITY_PER_ITEM = 99
MIN_QUANTITY_PER_ITEM = 1

def round_currency(value: Decimal) -> Decimal:
    """Round decimal monetary amount to exactly 2 decimal places using half-up arithmetic."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def calculate_shipping(subtotal: Decimal, is_free_shipping_coupon: bool = False) -> Tuple[Decimal, bool, Decimal]:
    """
    Calculate shipping fee based on documented business rule.
    Returns: (shipping_fee, is_free_shipping, amount_needed_for_free_shipping)
    """
    if subtotal <= Decimal("0.00"):
        return Decimal("0.00"), False, FREE_SHIPPING_THRESHOLD

    if is_free_shipping_coupon or subtotal >= FREE_SHIPPING_THRESHOLD:
        return Decimal("0.00"), True, Decimal("0.00")

    needed = round_currency(FREE_SHIPPING_THRESHOLD - subtotal)
    return STANDARD_SHIPPING_FEE, False, needed

def calculate_tax(taxable_amount: Decimal, tax_rate: Decimal = DEFAULT_TAX_RATE) -> Decimal:
    """Calculate sales tax amount on eligible net subtotal."""
    if taxable_amount <= Decimal("0.00"):
        return Decimal("0.00")
    return round_currency(taxable_amount * tax_rate)

def calculate_coupon_discount(coupon: Optional[Coupon], subtotal: Decimal) -> Tuple[Decimal, bool, Optional[str]]:
    """
    Evaluate coupon discount against subtotal.
    Returns: (discount_amount, is_free_shipping, description)
    """
    if not coupon or not coupon.is_active or subtotal <= Decimal("0.00"):
        return Decimal("0.00"), False, None

    # Check minimum order amount if configured
    if coupon.min_order_amount and subtotal < coupon.min_order_amount:
        return Decimal("0.00"), False, f"Minimum order of ${coupon.min_order_amount} required"

    if coupon.discount_type == DiscountType.PERCENTAGE:
        pct = Decimal(str(coupon.discount_value))
        discount = round_currency(subtotal * (pct / Decimal("100.00")))
        return min(discount, subtotal), False, f"{int(pct)}% Promotional Discount"

    elif coupon.discount_type == DiscountType.FIXED_AMOUNT:
        val = Decimal(str(coupon.discount_value))
        discount = min(val, subtotal)
        return round_currency(discount), False, f"${val} Fixed Discount"

    elif coupon.discount_type == DiscountType.FREE_SHIPPING:
        return Decimal("0.00"), True, "Complimentary Free Shipping Coupon"

    return Decimal("0.00"), False, None
