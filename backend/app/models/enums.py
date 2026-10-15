import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, enum.Enum):
    CARD = "card"
    PAYPAL = "paypal"
    COD = "cod"

class DiscountType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
