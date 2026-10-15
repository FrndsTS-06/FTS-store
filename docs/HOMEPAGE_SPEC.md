# FTS Store — Homepage UI/UX Design & Architectural Specification

**Client / Brand**: Frnds Tech Solution (FTS)  
**Document Classification**: UI/UX Engineering & Front-End Architectural Specification  
**Version**: 1.0.0  
**Author**: Senior Full-Stack Developer, UI/UX Engineer & QA Lead  
**Status**: Ready for Planning Review & Phase 1 Implementation Approval  

---

## 1. Executive Design Brief & Visual Hierarchy

The FTS Store homepage serves as the primary visual and commercial gateway for Frnds Tech Solution’s multi-category e-commerce platform. Based on the reference visual specification, the interface adheres to a modern, premium **dark luxury aesthetic** paired with high-conversion e-commerce patterns:

- **Atmosphere**: Deep space slate (`bg-slate-950`), subtle borders (`border-slate-800`), refined glassmorphism (`backdrop-blur-xl`), and vibrant indigo/purple/blue gradient accents (`from-indigo-500 via-purple-500 to-pink-500`).
- **Visual Hierarchy**:
  1. Top-of-funnel discovery (Announcement Bar $\rightarrow$ Global Search & Multi-Action Header $\rightarrow$ Category Navigation Bar).
  2. Emotional hook & primary conversion trigger (Immersive Hero Banner with product photography and direct CTAs).
  3. Quick-access navigation & trust anchors (Category Shortcut Cards + 4 Value Proposition Benefit Tiles).
  4. Core catalog discovery (Featured Product Grid with ratings, badges, and quick add).
  5. Mid-page commercial momentum (Two High-Impact Promotional Banners).
  6. Social proof & velocity highlights (Best-Seller Product Grid + Customer Testimonials).
  7. High-conversion retention & comprehensive close (Vibrant Blue Newsletter Strip $\rightarrow$ Multi-Column Footer).

---

## 2. Master Section Order & Proportions

| Order | Section Name | Target Height / Proportion | Background & Visual Style | Primary Function |
|:---:|---|---|---|---|
| **01** | **Dark Announcement Bar** | ~36px – 40px (Fixed height) | `bg-slate-950 border-b border-slate-900` | Shipping threshold notice, discount code alert, customer care link |
| **02** | **Main Header (Tier 2)** | ~72px – 80px (Sticky) | `bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80` | Brand logo, central category search bar, account, wishlist & cart |
| **03** | **Horizontal Category Nav (Tier 3)** | ~44px – 48px | `bg-slate-900/50 border-b border-slate-800/60 backdrop-blur-md` | Horizontal scrollable department pills with active indicators & sale tag |
| **04** | **Wide Hero Banner** | ~500px – 560px (~16:7 aspect) | Deep gradient `from-slate-900 via-slate-950 to-indigo-950` with mesh glow | Key marketing headline, lifestyle product visual, dual CTAs |
| **05** | **Category Shortcut Cards** | ~140px – 160px | Transparent container, cards in `bg-slate-900/40 border-slate-800` | 6 quick-access department cards with custom icons & live item counts |
| **06** | **Four Service-Benefit Items** | ~100px – 120px | 4-column cards in `bg-slate-900/30 border-slate-800/80` | Trust guarantees: Free Shipping, Authentic Gear, 30-Day Returns, 24/7 Support |
| **07** | **Featured Product Grid** | Dynamic (~750px – 850px) | Transparent container on `bg-slate-950` | 4–8 curated product cards with discount tags, ratings, and quick add-to-cart |
| **08** | **Two Promotional Banners** | ~280px – 320px (~16:9 split) | Dual cards with rich image overlays & contrasting gradient text | Split campaigns: e.g., Audio gear spotlight & Wearables/Tech deal |
| **09** | **Best-Seller Product Cards** | Dynamic (~750px – 850px) | Transparent container on `bg-slate-950` | Top-rated items with "Best Seller" badges, live stock meters, and quick actions |
| **10** | **Customer Testimonials** | ~320px – 360px | 3-column glassmorphic cards `bg-slate-900/40 border-slate-800` | Social proof: 5-star ratings, quotes, verified buyer tags, and user avatars |
| **11** | **Blue Newsletter Strip** | ~180px – 220px | `bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800` | High-contrast incentive strip for 15% discount code & email capture |
| **12** | **Dark Multi-Column Footer** | ~420px – 480px | `bg-slate-950 border-t border-slate-800` | 5-column navigation, brand story, payment badge icons, copyright |

---

## 3. Design System Tokens: Colors, Typography & Radii

### 3.1 Color Palette
```css
/* Background & Surfaces */
--surface-canvas:      #020617; /* slate-950 (Main Page Canvas) */
--surface-subtle:      #0b0f19; /* Custom deep dark tier */
--surface-card:        rgba(15, 23, 42, 0.45); /* slate-900/45 */
--surface-card-hover:  rgba(15, 23, 42, 0.85); /* slate-900/85 */
--surface-elevated:    #1e293b; /* slate-800 */

/* Borders & Separators */
--border-subtle:       rgba(30, 41, 59, 0.8); /* slate-800/80 */
--border-active:       rgba(99, 102, 241, 0.5); /* indigo-500/50 */

/* Brand & Accents */
--brand-primary:       #6366f1; /* indigo-500 */
--brand-primary-hover: #4f46e5; /* indigo-600 */
--brand-purple:        #a855f7; /* purple-500 */
--brand-pink:          #ec4899; /* pink-500 */
--brand-blue:          #2563eb; /* blue-600 (Newsletter Strip) */

/* Functional & Status */
--status-success:      #10b981; /* emerald-500 */
--status-warning:      #f59e0b; /* amber-500 */
--status-danger:       #f43f5e; /* rose-500 */
--status-info:         #06b6d4; /* cyan-500 */

/* Typography */
--text-primary:        #f8fafc; /* slate-50 */
--text-secondary:      #cbd5e1; /* slate-300 */
--text-muted:          #94a3b8; /* slate-400 */
--text-dimmed:         #64748b; /* slate-500 */
```

### 3.2 Typography Hierarchy
- **Display Font**: `Outfit`, `sans-serif` (Headings, banner titles, hero titles, metrics).
  - Hero Display Title: `text-4xl sm:text-5xl lg:text-6xl`, `font-extrabold`, `tracking-tight`, line-height `1.1`.
  - Section Headlines: `text-2xl sm:text-3xl lg:text-4xl`, `font-bold`, `tracking-tight`.
  - Card Titles: `text-sm sm:text-base`, `font-semibold`.
- **Body & UI Font**: `Plus Jakarta Sans`, `Inter`, `sans-serif` (Paragraphs, labels, inputs, pricing).
  - Body Text: `text-sm sm:text-base`, `text-slate-300`, line-height `1.6`.
  - Product Price: `text-lg sm:text-xl`, `font-extrabold`, `text-white`.
  - Strikethrough Price: `text-xs sm:text-sm`, `text-slate-500`, `line-through`.
  - Microcopy / Badges: `text-[10px] sm:text-xs`, `font-bold`, uppercase, tracking-wider.

### 3.3 Border Radius & Shadow Tokens
- **Banners & Hero**: `rounded-3xl` (24px)
- **Product Cards & Shortcut Cards**: `rounded-2xl` (16px)
- **Buttons, Inputs & Badges**: `rounded-xl` (12px)
- **Glow & Elevation**: `shadow-xl shadow-indigo-500/5` on hover; `backdrop-blur-xl` on sticky containers.

---

## 4. Comprehensive Section-by-Section Breakdown

### Section 01: Dark Announcement Bar
- **Position**: Global topmost header strip.
- **Left Slot**: Promotional marquee text with tag:
  - `[Limited Offer]` "Free express delivery on orders over $100 • Use code **WELCOME10** for 10% off"
- **Right Slot**: Utility navigation:
  - Phone / Helpdesk: `+1 (800) 555-FTS-TECH`
  - Quick link: `Track Order` (`/orders`)
  - Currency indicator: `USD ($)`
- **Behavior**: Dismissible button or static announcement; mobile view condenses to marquee or primary promo.

### Section 02: Main Header Tier (Search, Account, Wishlist, Cart)
- **Logo**: Stylized FTS Store emblem with glowing indigo-to-purple icon box and bold title.
- **Global Search Bar**:
  - Center positioned, expanding to `max-w-2xl`.
  - Category selector dropdown prefix ("All Departments").
  - Instant input with placeholder: `"Search 2,000+ tech, apparel, and lifestyle products..."`.
  - Keyboard shortcut hint badge: `Ctrl K` / `⌘ K`.
  - Search icon trigger and instant clear (`X`) button.
  - Submitting redirects to `/products?search={term}&category={cat}`.
- **Action Group (Right)**:
  - **Account Icon / Name**:
    - Authenticated: Avatar badge with first letter, first name, and dropdown menu (`Profile`, `Orders`, `Logout`).
    - Unauthenticated: "Sign In / Register" trigger redirecting to `/login`.
  - **Wishlist Button**:
    - Heart icon with badge counter linking to wishlist modal / page.
    - Reactively synchronizes with `WishlistContext`.
  - **Cart Button**:
    - Shopping bag/cart icon with prominent quantity pill (`totalItemsCount`).
    - Directly triggers the existing slide-over `CartDrawer`.
  - **Admin Pill (Role Guarded)**:
    - Displays only when `user?.role === 'admin'`, linking directly to `/admin`.

### Section 03: Horizontal Category Navigation Bar
- **Position**: Tier 3 underneath main header.
- **Items**:
  - "All Categories" (with grid icon)
  - "Electronics & Tech"
  - "Fashion & Apparel"
  - "Home & Living"
  - "Beauty & Wellness"
  - "Sports & Outdoors"
  - "Books & Stationery"
  - Right-aligned "🔥 Flash Sale (Up to 40% Off)" badge linking to `/products?badge=Trending`.
- **Behavior**:
  - Smooth hover underline / background pill effect.
  - Active state highlights current active category filter.
  - Mobile: Horizontal scrolling with hidden scrollbar (`no-scrollbar`).

### Section 04: Wide Hero Banner
- **Layout**: Two-column container banner with organic mesh gradients in the background.
- **Left Column (55% width)**:
  - Eyebrow pill: `✨ Curated Excellence • Frnds Tech Solution 2026`
  - Headline: `"Curated Excellence for Modern Living"` with gradient text highlight.
  - Subheading: Clear proposition highlighting acoustics, computing, and tailored lifestyle apparel.
  - CTA Button Cluster:
    - Primary Button: `"Explore All Products"` (solid indigo with right arrow).
    - Secondary Button: `"Trending Deals"` (glassmorphic dark with zap icon).
  - Trust indicators below CTAs: `✓ 100% Authentic • ✓ 30-Day Returns • ✓ 24/7 Support`.
- **Right Column (45% width)**:
  - High-resolution hero image composition (e.g., flagship audio headset or smartwatch setup).
  - Floating Glass Badge 1: `"Top Rated ★ 4.9 (340+ Reviews)"`.
  - Floating Glass Badge 2: `"Save $50 on AuraPulse ANC"`.

### Section 05: Category Shortcut Cards
- **Layout**: 6-column grid on desktop, 3-column on tablet, 2-column on mobile.
- **Card Elements**:
  - Squircle icon container with department icon (Laptop, ShoppingBag, Home, Sparkles, Activity, BookOpen).
  - Category Title (e.g., "Electronics & Tech").
  - Dynamic Item Count pill (e.g., "4 items").
  - Hover interaction: Scale up 105%, border transitions to `border-indigo-500/50`, card lifts with shadow.
  - Click target: Navigates to `/products?category={slug}`.

### Section 06: Four Service-Benefit Items
- **Layout**: 4-column horizontal card strip.
- **Benefits**:
  1. **Free Express Shipping**: "On all qualifying orders over $100" (Truck icon, Indigo).
  2. **Authentic Warranty**: "100% verified original gear & direct coverage" (ShieldCheck icon, Emerald).
  3. **30-Day Hassle-Free**: "Instant customer refunds & replacements" (RotateCcw icon, Purple).
  4. **24/7 Priority Support**: "Dedicated human technical assistance team" (Headphones icon, Pink).
- **Styling**: `bg-slate-900/35 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm`.

### Section 07: Featured Product Grid
- **Header**:
  - Eyebrow: `HANDPICKED`
  - Title: `"Featured & Trending Products"`
  - Link: `"View Full Catalogue →"`
- **Product Card Architecture**:
  - Image ratio: `aspect-[4/3]` with smooth zoom on hover.
  - Top Badges: Discount badge (e.g., `-17%`) on left; status badge (`Featured` or `Best Seller`) on right.
  - Wishlist Heart Button: Floating top-right heart icon with filled animation on toggle.
  - Content Block:
    - Category name (muted small link).
    - Star Rating component (e.g., `★ 4.9 (342)`).
    - Product Name (line-clamp-1, hover: text-indigo-300).
    - Price Block: Current price (e.g., `$249.99`) + Strikethrough original price (`$299.99`).
    - Stock Status: Green `In Stock` or Amber `Only 3 left` indicator.
  - Footer Action: Quick `"Add to Cart"` button with spinner during cart API request.

### Section 08: Two Promotional Banners
- **Layout**: 2-column grid (`grid-cols-1 md:grid-cols-2 gap-6`).
- **Banner 1 — Audio & Studio Gear**:
  - Background: Gradient `from-indigo-950/70 to-slate-900/90` with studio headphones photography.
  - Tag: `LIMITED TIME PROMO`
  - Headline: `"AuraPulse Noise-Cancelling Sound"`
  - Description: `"Experience pure acoustic fidelity with 42dB hybrid ANC and spatial calibration."`
  - CTA Button: `"Shop Audio Gear →"` (`/products?category=electronics`)
- **Banner 2 — Work & Lifestyle Essentials**:
  - Background: Gradient `from-purple-950/70 to-slate-900/90` with ergonomic smartwatch & desk gear.
  - Tag: `EXCLUSIVE DEAL`
  - Headline: `"Next-Gen Smart Living & Wearables"`
  - Description: `"Precision bio-tracking, aerospace-grade alloy, and all-day battery performance."`
  - CTA Button: `"Explore Tech Deals →"` (`/products?category=electronics&badge=Trending`)

### Section 09: Best-Seller Product Cards
- **Header**:
  - Eyebrow: `TOP RATED BY CUSTOMERS`
  - Title: `"Best Sellers & Customer Favorites"`
  - Filter Tabs: `All`, `Electronics`, `Fashion`, `Home` for instant client-side or API category toggling.
- **Card Set**: 4 top-selling products featuring gold "Best Seller" badges, review counts, stock meters, and quick-add actions.

### Section 10: Customer Testimonials
- **Layout**: 3-column card grid (`grid-cols-1 md:grid-cols-3 gap-6`).
- **Card Anatomy**:
  - Star rating: 5 amber stars (`★ ★ ★ ★ ★`).
  - Quote: Realistic, high-praise customer feedback regarding build quality, customer support, and fast checkout.
  - Reviewer info:
    - User avatar or photo thumbnail.
    - Name: E.g., "Sarah Jenkins", "David Chen", "Marcus Vance".
    - Role / Location: E.g., "Software Engineer, Seattle", "Design Director, Austin", "Tech Enthusiast, Chicago".
    - Verification: `✓ Verified Buyer` badge in emerald.
    - Product purchased: E.g., `Purchased: AuraPulse Wireless Headphones`.

### Section 11: Blue Newsletter Strip
- **Layout**: Full-width or boxed high-contrast banner with radiant blue/indigo gradient (`from-blue-600 via-indigo-600 to-purple-600`).
- **Copy**:
  - Eyebrow: `STAY CONNECTED`
  - Headline: `"Unlock 15% Off Your Next Order"`
  - Subtitle: `"Join 25,000+ insiders who receive exclusive product drops, member-only discounts, and tech reviews."`
- **Interactive Form**:
  - Email input with envelope icon, placeholder `"Enter your business or personal email..."`.
  - Button: `"Subscribe & Get Code"` with spinner.
  - Success feedback state: `"🎉 Success! Check your inbox for your 15% discount code (INSIDER15)."`
  - Privacy reassurance note: `"No spam ever. Unsubscribe at any time."`

### Section 12: Dark Multi-Column Footer
- **Layout**: 5-column grid on desktop, 2-column on tablet, 1-column on mobile.
- **Columns**:
  1. **Brand Story**: FTS Store logo, tagline, customer service email (`support@frndstech.com`), phone, and social icon links (Twitter/X, GitHub, LinkedIn, Instagram).
  2. **Shop Departments**: All Products, Electronics & Tech, Fashion & Apparel, Home & Living, Beauty & Wellness.
  3. **Customer Support**: Track My Order (`/orders`), Shipping Information, Returns & Exchanges, FAQs, Contact Support.
  4. **Account & Legal**: My Profile (`/profile`), Shopping Cart (`/cart`), Wishlist, Privacy Policy, Terms of Service.
  5. **Payment & Security**: Payment badge icons (Visa, Mastercard, American Express, PayPal, Apple Pay) and 256-bit SSL secure encryption badge.
- **Bottom Bar**: Copyright `© 2026 Frnds Tech Solution (FTS). All rights reserved.` with legal links.

---

## 5. Responsive Behavior Across Breakpoints

| Breakpoint | Header & Nav | Hero Banner | Grids (Categories & Products) | Banners & Testimonials | Footer |
|---|---|---|---|---|---|
| **Desktop (≥ 1280px)** | Full 3-tier header; search expanded (640px); all nav items visible. | 2-column split (55% / 45%); height 540px; floating badges visible. | Categories: 6 cols; Products: 4 cols. | Promo Banners: 2 cols; Testimonials: 3 cols. | 5 columns with payment icons right-aligned. |
| **Tablet (768px – 1024px)** | Search bar compact; category nav horizontally scrollable; wishlist/cart badges intact. | Stacked or compact 2-column; hero image slightly reduced. | Categories: 3 cols; Products: 2–3 cols. | Promo Banners: 2 cols; Testimonials: 2 cols (3rd wraps). | 2–3 columns wrapped cleanly. |
| **Mobile (< 768px)** | Announcement bar condensed; header collapses to Logo + Search Icon + Wishlist + Cart + Hamburger; drawer for menu. | 1-column stacked (headline $\rightarrow$ CTAs $\rightarrow$ hero image); full width buttons. | Categories: 2 cols or horizontal scroll; Products: 1–2 cols. | Promo Banners: 1 col stacked; Testimonials: 1 col carousel/stack. | Accordion or single column stack with centered copyright. |

---

## 6. Frontend Component Breakdown & Architecture

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── AnnouncementBar.tsx       # [NEW] Section 01: Top promotional & utility bar
│   │   ├── Navbar.tsx                # [UPDATE] Section 02: 3-tier header with search, account, wishlist, cart
│   │   ├── CategoryNav.tsx           # [NEW] Section 03: Horizontal department navigation
│   │   ├── Footer.tsx                # [UPDATE] Section 12: 5-column luxury dark footer with payment badges
│   │   └── AppLayout.tsx             # Wraps Navbar + Outlet + Footer + CartDrawer
│   ├── home/
│   │   ├── HeroBanner.tsx            # [NEW] Section 04: Two-column hero with floating badges
│   │   ├── CategoryShortcuts.tsx     # [NEW] Section 05: 6 squircle shortcut cards with item counts
│   │   ├── ValueProps.tsx            # [NEW] Section 06: 4 service-benefit trust cards
│   │   ├── PromoBanners.tsx          # [NEW] Section 08: Dual split promotional banners
│   │   ├── BestSellersSection.tsx    # [NEW] Section 09: Best-seller catalog grid with category filter
│   │   ├── TestimonialsSection.tsx   # [NEW] Section 10: 3 customer review cards with verified buyer tags
│   │   └── NewsletterStrip.tsx       # [NEW] Section 11: Vibrant blue newsletter conversion strip
│   ├── products/
│   │   ├── ProductCard.tsx           # [UPDATE] Section 07 & 09: Added wishlist heart toggle & quick add
│   │   └── ProductGrid.tsx           # Standardized product grid wrapper
│   └── wishlist/
│       └── WishlistDrawer.tsx        # [NEW] Slide-over or modal for saved favorite items
├── context/
│   ├── AuthContext.tsx               # (Existing) Authentication & role management
│   ├── CartContext.tsx               # (Existing) Cart management & drawer trigger
│   └── WishlistContext.tsx           # [NEW] React state & localStorage persistence for favorites
├── pages/
│   └── HomePage.tsx                  # [REWRITE] Orchestrates all 12 sections cleanly
└── types/
    └── catalog.ts                    # Updated with Wishlist & Testimonial interfaces
```

---

## 7. State Management & API Connections

1. **Category Discovery**:
   - `apiClient.getCategories()` loads real active categories from FastAPI backend.
   - Fallback guarantees default 6 categories if network delay occurs.
2. **Product Catalog Highlights**:
   - Section 07 (Featured): Uses `apiClient.getFeaturedProducts(8)`.
   - Section 09 (Best Sellers): Uses `apiClient.getProducts({ badge: 'Best Seller', page_size: 4 })` or client-filtered high-rating products.
3. **Shopping Cart Integration**:
   - Uses existing `useCart()` hook (`addItem`, `openDrawer`, `totalItemsCount`).
   - Quick "Add to Cart" button triggers `addItem(product.id, 1)` with visual feedback.
4. **Wishlist State Integration**:
   - Implement `WishlistContext`:
     - `wishlist: Product[]` (persisted in `localStorage.getItem('fts_wishlist')`).
     - `toggleWishlist(product: Product): void`.
     - `isInWishlist(productId: string): boolean`.
     - `wishlistCount: number` synchronized to heart badge in Section 02.
5. **Global Search Integration**:
   - Search bar input in Section 02 captures query and selected category prefix.
   - On `Enter` or search button click, navigates to `/products?search=${encodeURIComponent(query)}`.
6. **Newsletter Subscription**:
   - Client-side validation for valid email format (`regex`).
   - Simulates API subscription, stores promo code in `localStorage`, and displays instant confirmation message with copyable discount code `INSIDER15`.

---

## 8. Curated Image Asset Requirements

All photography must be high-resolution, thematic, and reliable:

| Section | Subject | Aspect Ratio | Dimensions | Theme / Details |
|---|---|:---:|:---:|---|
| **Hero (Sec 04)** | Flagship Audio / Tech Setup | 1:1 or 4:3 | 800 × 800 px | Dark background, subtle blue/purple studio rim lighting |
| **Promo 1 (Sec 08)** | Wireless Headphones & Acoustic Gear | 16:9 | 800 × 450 px | Lifestyle headphones on dark sleek desk |
| **Promo 2 (Sec 08)** | Smartwatch & Wearables | 16:9 | 800 × 450 px | Precision chronograph smartwatch on wrist or stand |
| **Products (Sec 07 & 09)**| Real Seed Products | 4:3 | 600 × 450 px | Unsplash CDN URLs from seed database with SVG fallback |
| **Testimonials (Sec 10)**| Customer Avatars | 1:1 | 100 × 100 px | Professional friendly headshots on neutral backgrounds |

---

## 9. Environment & Tooling Audit

- **Operating System**: Windows 11 Enterprise (64-bit).
- **Backend Service**: Python FastAPI on `http://127.0.0.1:8000` (Verified active and healthy).
- **Frontend Service**: React 18 + Vite on `http://127.0.0.1:3000` (Verified active and healthy).
- **Node Runtime**: Node.js installed in `d:\projects_demo\e-commers\.tools\node`. All PowerShell commands must prefix `$env:PATH = "d:\projects_demo\e-commers\.tools\node;$env:PATH"`.
- **Browser Automation Blocker**: The Playwright browser driver archive returned `404 Not Found` from Microsoft Azure CDN. Alternative verification must rely on automated HTTP testing, TypeScript compilation (`tsc`), ESLint, and Vite production builds.

---

## 10. Phase 1 Implementation Acceptance Criteria

1. **Visual Accuracy**:
   - All 12 documented sections are present in the exact specified order.
   - The dark luxury theme (`slate-950`, `slate-900`, `indigo-500`, `purple-500`) matches the reference visual specification.
2. **Interactive Correctness**:
   - Header search bar executes searches to `/products?search=...`.
   - Wishlist heart toggles add/remove products and increment the header badge counter.
   - Quick Add-to-Cart buttons increment the cart count and open `CartDrawer`.
   - Category cards navigate to `/products?category=...`.
   - Newsletter form validates email input and reveals the discount code banner.
3. **Responsiveness**:
   - Mobile viewport (375px - 430px) renders without horizontal scroll blowouts.
   - Tablet viewport (768px - 1024px) cleanly adapts column counts.
   - Desktop viewport (1280px+) matches the reference image proportion and spacing.
4. **Code Quality & Stability**:
   - 0 TypeScript compiler errors (`npx tsc --noEmit`).
   - 0 ESLint warnings or errors (`npm run lint`).
   - Clean Vite production bundle (`npm run build`).
   - All 87 existing Pytest tests remain green.
