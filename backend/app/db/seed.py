import uuid
from decimal import Decimal
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models import (
    User, UserRole, Address, Category, Product, ProductImage, Coupon, DiscountType
)
from app.core.security import hash_password

# Seed Sample Data across all departments
SEED_CATEGORIES = [
    {
        "name": "Electronics & Tech",
        "slug": "electronics",
        "description": "Cutting-edge audio gear, computing, and smart accessories.",
        "icon_name": "cpu",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
    },
    {
        "name": "Fashion & Apparel",
        "slug": "fashion",
        "description": "Contemporary outerwear, tailored apparel, and urban footwear.",
        "icon_name": "shopping-bag",
        "image_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6"
    },
    {
        "name": "Home & Living",
        "slug": "home",
        "description": "Minimalist artisanal lighting, ceramic ware, and living decor.",
        "icon_name": "home",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c"
    },
    {
        "name": "Beauty & Wellness",
        "slug": "beauty",
        "description": "Clean botanicals, luxury fragrances, and mindful self-care rituals.",
        "icon_name": "sparkles",
        "image_url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908"
    },
    {
        "name": "Sports & Outdoors",
        "slug": "sports",
        "description": "Engineered technical gear, hydration equipment, and active tools.",
        "icon_name": "activity",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    },
    {
        "name": "Books & Stationery",
        "slug": "books",
        "description": "Hardbound architecture journals and precision writing instruments.",
        "icon_name": "book-open",
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c"
    },
    # Dedicated Category Shortcuts from FTS Store visual reference
    {
        "name": "Mobiles",
        "slug": "mobiles",
        "description": "Flagship 5G smartphones, foldable devices, and mobile accessories.",
        "icon_name": "smartphone",
        "image_url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80"
    },
    {
        "name": "Laptops",
        "slug": "laptops",
        "description": "High-performance ultrabooks, creator workstations, and gaming laptops.",
        "icon_name": "laptop",
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80"
    },
    {
        "name": "Accessories",
        "slug": "accessories",
        "description": "GaN fast chargers, premium cables, ergonomic stands, and hubs.",
        "icon_name": "headphones",
        "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80"
    },
    {
        "name": "Smart Devices",
        "slug": "smart-devices",
        "description": "Voice-enabled home assistants, ambient lighting, and connected living hubs.",
        "icon_name": "cpu",
        "image_url": "https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80"
    },
    {
        "name": "Gaming",
        "slug": "gaming",
        "description": "Pro wireless controllers, ultra-fast monitors, and gaming gear.",
        "icon_name": "gamepad-2",
        "image_url": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80"
    },
    {
        "name": "Home Appliances",
        "slug": "home-appliances",
        "description": "Artisan espresso machines, air purifiers, and modern smart appliances.",
        "icon_name": "home",
        "image_url": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80"
    },
    {
        "name": "Audio",
        "slug": "audio",
        "description": "True wireless noise-cancelling earbuds, studio monitors, and soundbars.",
        "icon_name": "volume-2",
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80"
    },
    {
        "name": "Cameras",
        "slug": "cameras",
        "description": "4K cinema mirrorless cameras, prime lenses, and content creation rigs.",
        "icon_name": "camera",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
    },
    {
        "name": "Wearables",
        "slug": "wearables",
        "description": "Bio-tracking smartwatches, fitness bands, and sapphire sport chronos.",
        "icon_name": "watch",
        "image_url": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80"
    }
]

SEED_PRODUCTS = [
    # Electronics
    {
        "sku": "FTS-TECH-001",
        "name": "AuraPulse Wireless Noise-Cancelling Headphones",
        "slug": "aurapulse-wireless-headphones",
        "category_slug": "electronics",
        "price": Decimal("249.99"),
        "compare_at_price": Decimal("299.99"),
        "stock_quantity": 45,
        "badge": "Best Seller",
        "rating": Decimal("4.90"),
        "review_count": 342,
        "description": "Flagship hybrid active noise cancellation with 40-hour battery life, spatial audio calibration, and plush memory foam cushions.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80", "alt_text": "AuraPulse Headphones Angle View", "is_primary": True}
        ]
    },
    {
        "sku": "FTS-TECH-002",
        "name": "Titan Chrono Pro Smartwatch Ultra",
        "slug": "titan-chrono-pro-smartwatch",
        "category_slug": "electronics",
        "price": Decimal("329.00"),
        "compare_at_price": Decimal("379.00"),
        "stock_quantity": 28,
        "badge": "Trending",
        "rating": Decimal("4.80"),
        "review_count": 189,
        "description": "Grade 5 Titanium case, dual-frequency GPS, sapphire crystal display, and multi-day battery life with biometric sensors.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80", "alt_text": "Titan Chrono Smartwatch", "is_primary": True}
        ]
    },
    {
        "sku": "FTS-TECH-003",
        "name": "Lumix Studio Mechanical Keyboard RGB",
        "slug": "lumix-studio-mechanical-keyboard",
        "category_slug": "electronics",
        "price": Decimal("149.50"),
        "compare_at_price": Decimal("175.00"),
        "stock_quantity": 60,
        "badge": "Staff Pick",
        "rating": Decimal("4.70"),
        "review_count": 215,
        "description": "Gasket-mounted hot-swappable mechanical keyboard featuring CNC aluminum chassis, pre-lubed switches, and per-key RGB illumination.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80", "alt_text": "Lumix Keyboard Workspace", "is_primary": True}
        ]
    },

    # Fashion
    {
        "sku": "FTS-FASH-001",
        "name": "Nordic Merino Wool Minimalist Overcoat",
        "slug": "nordic-merino-wool-overcoat",
        "category_slug": "fashion",
        "price": Decimal("285.00"),
        "compare_at_price": Decimal("340.00"),
        "stock_quantity": 20,
        "badge": "Trending",
        "rating": Decimal("4.90"),
        "review_count": 124,
        "description": "Tailored from 100% sustainably sourced Scandinavian merino wool. Double-faced weave provides wind resistance and elegance.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80", "alt_text": "Merino Wool Overcoat", "is_primary": True}
        ]
    },
    {
        "sku": "FTS-FASH-002",
        "name": "Urban Strider Ergonomic Knit Sneakers",
        "slug": "urban-strider-knit-sneakers",
        "category_slug": "fashion",
        "price": Decimal("129.99"),
        "compare_at_price": Decimal("160.00"),
        "stock_quantity": 55,
        "badge": "Popular",
        "rating": Decimal("4.70"),
        "review_count": 412,
        "description": "Featherlight breathable knit upper mounted on dynamic cloud-foam midsoles for day-long urban exploration.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", "alt_text": "Urban Strider Red Sneakers", "is_primary": True}
        ]
    },

    # Home & Living
    {
        "sku": "FTS-HOME-001",
        "name": "Zenith Ambient Arc Lamp with Smart Dimmer",
        "slug": "zenith-ambient-arc-lamp",
        "category_slug": "home",
        "price": Decimal("179.00"),
        "compare_at_price": Decimal("210.00"),
        "stock_quantity": 22,
        "badge": "Staff Pick",
        "rating": Decimal("4.80"),
        "review_count": 93,
        "description": "Sculptural brushed brass arc lamp with spun marble base and warm temperature color tuning from 2200K to 4000K.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80", "alt_text": "Zenith Lamp in Modern Room", "is_primary": True}
        ]
    },
    {
        "sku": "FTS-HOME-002",
        "name": "Kyoto Artisan Ceramic Pour-Over Set",
        "slug": "kyoto-ceramic-pourover-set",
        "category_slug": "home",
        "price": Decimal("68.50"),
        "compare_at_price": Decimal("85.00"),
        "stock_quantity": 40,
        "badge": "Top Rated",
        "rating": Decimal("4.90"),
        "review_count": 164,
        "description": "Handcrafted textured stoneware dripper and serving carafe finished in an organic ash-glaze.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80", "alt_text": "Kyoto Ceramic Dripper and Cup", "is_primary": True}
        ]
    },

    # Beauty & Wellness
    {
        "sku": "FTS-BEAU-001",
        "name": "Botanical Radiance Youth Revival Elixir",
        "slug": "botanical-radiance-elixir",
        "category_slug": "beauty",
        "price": Decimal("76.00"),
        "compare_at_price": Decimal("95.00"),
        "stock_quantity": 50,
        "badge": "Bestseller",
        "rating": Decimal("4.90"),
        "review_count": 310,
        "description": "Cold-pressed rosehip seed oil, bakuchiol, and squalane blend designed to replenish cellular moisture.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80", "alt_text": "Botanical Serum Dropper Bottle", "is_primary": True}
        ]
    },

    # Sports & Outdoors
    {
        "sku": "FTS-SPRT-001",
        "name": "Apex Ridge Ultralight 40L Alpine Pack",
        "slug": "apex-ridge-ultralight-alpine-pack",
        "category_slug": "sports",
        "price": Decimal("189.00"),
        "compare_at_price": Decimal("220.00"),
        "stock_quantity": 16,
        "badge": "Pro Gear",
        "rating": Decimal("4.90"),
        "review_count": 89,
        "description": "Constructed from diamond-grid Dyneema composite fabric. Weighs under 850 grams.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80", "alt_text": "Apex Backpack Outdoor", "is_primary": True}
        ]
    },

    # Books & Stationery
    {
        "sku": "FTS-BOOK-001",
        "name": "Architectural Systems & Design Masterclass",
        "slug": "architectural-systems-design-book",
        "category_slug": "books",
        "price": Decimal("48.00"),
        "compare_at_price": Decimal("60.00"),
        "stock_quantity": 35,
        "badge": "Staff Pick",
        "rating": Decimal("4.90"),
        "review_count": 112,
        "description": "Collector's linen-bound edition exploring modern UI, distributed architecture patterns, and HCI.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80", "alt_text": "Architectural Systems Hardcover Book", "is_primary": True}
        ]
    },

    # Mobiles
    {
        "sku": "FTS-MOB-001",
        "name": "AeroPhone 16 Pro Max 5G (256GB Titanium)",
        "slug": "aerophone-16-pro-max",
        "category_slug": "mobiles",
        "price": Decimal("1099.00"),
        "compare_at_price": Decimal("1199.00"),
        "stock_quantity": 30,
        "badge": "Flagship",
        "rating": Decimal("4.95"),
        "review_count": 528,
        "description": "Aerospace-grade titanium enclosure, Super Retina XDR ProMotion 120Hz display, and periscope optical zoom.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80", "alt_text": "AeroPhone 16 Pro Max Smartphone", "is_primary": True}
        ]
    },

    # Laptops
    {
        "sku": "FTS-LAP-001",
        "name": "ZenBook Ultra 16 OLED Creator Laptop",
        "slug": "zenbook-ultra-16-oled",
        "category_slug": "laptops",
        "price": Decimal("1499.00"),
        "compare_at_price": Decimal("1699.00"),
        "stock_quantity": 25,
        "badge": "Best Seller",
        "rating": Decimal("4.90"),
        "review_count": 274,
        "description": "16-inch 3.2K 120Hz Lumina OLED display, 32GB LPDDR5X RAM, 1TB NVMe Gen4 SSD, and all-day 99Wh battery.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80", "alt_text": "ZenBook Ultra 16 OLED Laptop", "is_primary": True}
        ]
    },

    # Accessories
    {
        "sku": "FTS-ACC-001",
        "name": "MagCharge Dual 65W GaN Fast Charger & Cable",
        "slug": "magcharge-dual-65w-gan-charger",
        "category_slug": "accessories",
        "price": Decimal("49.99"),
        "compare_at_price": Decimal("65.00"),
        "stock_quantity": 80,
        "badge": "Popular",
        "rating": Decimal("4.85"),
        "review_count": 412,
        "description": "Gallium Nitride (GaN III) dual USB-C charging station with braided Kevlar 100W cable and intelligent heat dissipation.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80", "alt_text": "MagCharge 65W GaN Charger", "is_primary": True}
        ]
    },

    # Smart Devices
    {
        "sku": "FTS-SMT-001",
        "name": "EchoSphere Smart Living Hub & Ambient Speaker",
        "slug": "echosphere-smart-living-hub",
        "category_slug": "smart-devices",
        "price": Decimal("129.00"),
        "compare_at_price": Decimal("159.00"),
        "stock_quantity": 38,
        "badge": "Trending",
        "rating": Decimal("4.75"),
        "review_count": 165,
        "description": "Voice-enabled Matter-compatible smart home controller with 360-degree room-filling acoustic audio and ambient LED halo.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80", "alt_text": "EchoSphere Smart Home Hub", "is_primary": True}
        ]
    },

    # Gaming
    {
        "sku": "FTS-GAM-001",
        "name": "Vortex Elite Wireless Pro Gaming Controller",
        "slug": "vortex-elite-wireless-controller",
        "category_slug": "gaming",
        "price": Decimal("79.99"),
        "compare_at_price": Decimal("99.99"),
        "stock_quantity": 42,
        "badge": "Pro Gamer",
        "rating": Decimal("4.90"),
        "review_count": 310,
        "description": "Hall-effect magnetic zero-drift analog joysticks, micro-switch mechanical tactile buttons, and remappable rear paddles.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80", "alt_text": "Vortex Elite Gaming Controller", "is_primary": True}
        ]
    },

    # Home Appliances
    {
        "sku": "FTS-APP-001",
        "name": "Barista Touch Espresso Machine & Conical Grinder",
        "slug": "barista-touch-espresso-machine",
        "category_slug": "home-appliances",
        "price": Decimal("599.00"),
        "compare_at_price": Decimal("699.00"),
        "stock_quantity": 18,
        "badge": "Top Rated",
        "rating": Decimal("4.92"),
        "review_count": 198,
        "description": "ThermoJet 3-second heating system, 54mm stainless steel portafilter, automatic microfoam milk texturing, and digital touch interface.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80", "alt_text": "Barista Touch Espresso Machine", "is_primary": True}
        ]
    },

    # Audio
    {
        "sku": "FTS-AUD-001",
        "name": "AcousticStudio Wireless Hi-Res Earbuds",
        "slug": "acousticstudio-wireless-earbuds",
        "category_slug": "audio",
        "price": Decimal("179.99"),
        "compare_at_price": Decimal("219.99"),
        "stock_quantity": 55,
        "badge": "Best Seller",
        "rating": Decimal("4.88"),
        "review_count": 285,
        "description": "Dual balanced-armature drivers, LDAC lossless codec certification, 32-hour playback case with wireless Qi charging.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80", "alt_text": "AcousticStudio Wireless Earbuds", "is_primary": True}
        ]
    },

    # Cameras
    {
        "sku": "FTS-CAM-001",
        "name": "AlphaVision 4K Cinema Mirrorless Camera Body",
        "slug": "alphavision-4k-cinema-camera",
        "category_slug": "cameras",
        "price": Decimal("1299.00"),
        "compare_at_price": Decimal("1450.00"),
        "stock_quantity": 15,
        "badge": "Creator Choice",
        "rating": Decimal("4.91"),
        "review_count": 142,
        "description": "Full-frame 33MP BSI CMOS sensor, 10-bit 4:2:2 4K 60p uncompressed recording, 759-point real-time phase detection autofocus.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80", "alt_text": "AlphaVision Cinema Camera", "is_primary": True}
        ]
    },

    # Wearables
    {
        "sku": "FTS-WEAR-001",
        "name": "AeroTrack Sport GPS Smartwatch & BioTracker",
        "slug": "aerotrack-sport-gps-smartwatch",
        "category_slug": "wearables",
        "price": Decimal("199.00"),
        "compare_at_price": Decimal("249.00"),
        "stock_quantity": 36,
        "badge": "Trending",
        "rating": Decimal("4.82"),
        "review_count": 218,
        "description": "Sapphire crystal touch face, dual-band 5-satellite GPS tracking, continuous SpO2 and HRV monitoring, 5ATM water resistance.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80", "alt_text": "AeroTrack Sport Smartwatch", "is_primary": True}
        ]
    },

    # Additional Realistic Electronics for Best Sellers & Promotional Sections
    {
        "sku": "FTS-LAP-002",
        "name": "MacBook Pro 16 M3 Max Studio Workstation",
        "slug": "macbook-pro-16-m3-max",
        "category_slug": "laptops",
        "price": Decimal("2499.00"),
        "compare_at_price": Decimal("2799.00"),
        "stock_quantity": 20,
        "badge": "Best Seller",
        "rating": Decimal("4.95"),
        "review_count": 418,
        "description": "Liquid Retina XDR display, Apple M3 Max 16-core CPU, 40-core GPU, 48GB unified memory, and up to 22 hours battery life.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80", "alt_text": "MacBook Pro 16 Studio Laptop", "is_primary": True}
        ]
    },
    {
        "sku": "FTS-LAP-003",
        "name": "Blade Stealth 14 RTX 4080 Gaming Laptop",
        "slug": "blade-stealth-14-rtx-4080",
        "category_slug": "laptops",
        "price": Decimal("1899.00"),
        "compare_at_price": Decimal("2199.00"),
        "stock_quantity": 18,
        "badge": "Pro Gamer",
        "rating": Decimal("4.88"),
        "review_count": 185,
        "description": "Ultra-thin CNC aluminum unibody, QHD+ 240Hz OLED display, GeForce RTX 4080 12GB VRAM, vapor chamber cooling.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80", "alt_text": "Blade Stealth Gaming Laptop", "is_primary": True}
        ]
    },
    {
        "sku": "FTS-SMT-002",
        "name": "NestAura Smart Ambient Light Bar with Audio Sync",
        "slug": "nestaura-smart-ambient-light-bar",
        "category_slug": "smart-devices",
        "price": Decimal("89.99"),
        "compare_at_price": Decimal("119.99"),
        "stock_quantity": 45,
        "badge": "Best Seller",
        "rating": Decimal("4.82"),
        "review_count": 215,
        "description": "Dynamic RGBIC ambient backlighting with HDMI 2.1 zero-latency screen mirroring, smart sound sync, and voice automation.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80", "alt_text": "NestAura Smart Ambient Light Bar", "is_primary": True}
        ]
    },
    {
        "sku": "FTS-SMT-003",
        "name": "OmniView 2K Smart Video Doorbell & Security Hub",
        "slug": "omniview-2k-smart-video-doorbell",
        "category_slug": "smart-devices",
        "price": Decimal("149.00"),
        "compare_at_price": Decimal("189.00"),
        "stock_quantity": 30,
        "badge": "Trending",
        "rating": Decimal("4.79"),
        "review_count": 142,
        "description": "Dual camera color night vision, radar-based PIR motion detection, local AI facial recognition, and two-way crystal audio.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80", "alt_text": "OmniView 2K Smart Video Doorbell", "is_primary": True}
        ]
    },
    {
        "sku": "FTS-MOB-002",
        "name": "Galaxy Ultra Z Fold 6 AI Edition (512GB)",
        "slug": "galaxy-ultra-z-fold-6-ai",
        "category_slug": "mobiles",
        "price": Decimal("1399.00"),
        "compare_at_price": Decimal("1599.00"),
        "stock_quantity": 22,
        "badge": "Best Seller",
        "rating": Decimal("4.92"),
        "review_count": 380,
        "description": "Immersive 7.6-inch Dynamic AMOLED 2X folding display, Snapdragon 8 Gen 3 with Galaxy AI, titanium hinge, and S Pen support.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&q=80", "alt_text": "Galaxy Ultra Z Fold 6", "is_primary": True}
        ]
    },
    {
        "sku": "FTS-ACC-002",
        "name": "Aerocore 10-in-1 Aluminum Thunderbolt 4 Dock",
        "slug": "aerocore-10-in-1-thunderbolt-4-dock",
        "category_slug": "accessories",
        "price": Decimal("119.00"),
        "compare_at_price": Decimal("149.00"),
        "stock_quantity": 50,
        "badge": "Best Seller",
        "rating": Decimal("4.86"),
        "review_count": 294,
        "description": "Dual 4K 60Hz display output, 100W Power Delivery pass-through, UHS-II SD card slot, 2.5Gbps Gigabit Ethernet, aircraft aluminum.",
        "images": [
            {"url": "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=800&q=80", "alt_text": "Aerocore 10-in-1 Thunderbolt 4 Dock", "is_primary": True}
        ]
    }
]

SEED_COUPONS = [
    {"code": "WELCOME10", "discount_type": DiscountType.PERCENTAGE, "discount_value": Decimal("10.00"), "min_order_amount": Decimal("0.00")},
    {"code": "SUPER20", "discount_type": DiscountType.PERCENTAGE, "discount_value": Decimal("20.00"), "min_order_amount": Decimal("50.00")},
    {"code": "FESTIVE15", "discount_type": DiscountType.PERCENTAGE, "discount_value": Decimal("15.00"), "min_order_amount": Decimal("0.00")},
    {"code": "VIP30", "discount_type": DiscountType.PERCENTAGE, "discount_value": Decimal("30.00"), "min_order_amount": Decimal("100.00")}
]

def seed_database(db: Session) -> dict:
    """
    Idempotent development seed loader.
    Safely creates initial administrative staff, sample customer, categories,
    and clearly labeled multi-category sample products without duplicating records.
    """
    stats = {
        "users_created": 0,
        "categories_created": 0,
        "products_created": 0,
        "coupons_created": 0
    }

    # 1. Seed Super Admin User
    admin = db.query(User).filter(User.email == "admin@frndstech.com").first()
    if not admin:
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@frndstech.com",
            hashed_password=hash_password("Admin@FTS2026!"),
            full_name="Frnds Tech Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        stats["users_created"] += 1
    else:
        admin.hashed_password = hash_password("Admin@FTS2026!")

    # 2. Seed Sample Customer User
    customer = db.query(User).filter(User.email == "customer@frndstech.com").first()
    if not customer:
        customer = User(
            id=str(uuid.uuid4()),
            email="customer@frndstech.com",
            hashed_password=hash_password("Customer@FTS2026!"),
            full_name="Alex Mercer",
            role=UserRole.CUSTOMER,
            is_active=True
        )
        db.add(customer)
        db.flush()

        # Customer default shipping address
        addr = Address(
            id=str(uuid.uuid4()),
            user_id=customer.id,
            full_name="Alex Mercer",
            phone="+1-555-0192",
            address_line1="742 Evergreen Terrace",
            city="Springfield",
            state="OR",
            postal_code="97477",
            country="United States",
            is_default=True
        )
        db.add(addr)
        stats["users_created"] += 1
    else:
        customer.hashed_password = hash_password("Customer@FTS2026!")
        db.add(customer)

    # 3. Seed Categories
    category_map = {}
    for cat_data in SEED_CATEGORIES:
        cat = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not cat:
            cat = Category(
                id=str(uuid.uuid4()),
                name=cat_data["name"],
                slug=cat_data["slug"],
                description=cat_data["description"],
                icon_name=cat_data["icon_name"],
                image_url=cat_data["image_url"],
                is_active=True
            )
            db.add(cat)
            db.flush()
            stats["categories_created"] += 1
        category_map[cat.slug] = cat

    # 4. Seed Products
    for p_data in SEED_PRODUCTS:
        product = db.query(Product).filter(Product.sku == p_data["sku"]).first()
        if not product:
            cat = category_map.get(p_data["category_slug"])
            if not cat:
                continue
            product = Product(
                id=str(uuid.uuid4()),
                category_id=cat.id,
                name=p_data["name"],
                slug=p_data["slug"],
                sku=p_data["sku"],
                price=p_data["price"],
                compare_at_price=p_data["compare_at_price"],
                stock_quantity=p_data["stock_quantity"],
                badge=p_data["badge"],
                rating=p_data["rating"],
                review_count=p_data["review_count"],
                description=p_data["description"],
                is_active=True
            )
            db.add(product)
            db.flush()

            for img_data in p_data.get("images", []):
                img = ProductImage(
                    id=str(uuid.uuid4()),
                    product_id=product.id,
                    url=img_data["url"],
                    alt_text=img_data.get("alt_text"),
                    is_primary=img_data.get("is_primary", False)
                )
                db.add(img)

            stats["products_created"] += 1

    # 5. Seed Coupons
    for coup_data in SEED_COUPONS:
        coupon = db.query(Coupon).filter(Coupon.code == coup_data["code"]).first()
        if not coupon:
            coupon = Coupon(
                id=str(uuid.uuid4()),
                code=coup_data["code"],
                discount_type=coup_data["discount_type"],
                discount_value=coup_data["discount_value"],
                min_order_amount=coup_data["min_order_amount"],
                is_active=True
            )
            db.add(coupon)
            stats["coupons_created"] += 1

    db.commit()
    return stats

if __name__ == "__main__":
    db = SessionLocal()
    try:
        results = seed_database(db)
        print("FTS Store Database Seed Complete:")
        print(f" - Users created: {results['users_created']}")
        print(f" - Categories created: {results['categories_created']}")
        print(f" - Products created: {results['products_created']}")
        print(f" - Coupons created: {results['coupons_created']}")
    finally:
        db.close()
