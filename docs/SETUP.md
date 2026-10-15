# NovaMart Setup & Execution Guide

This guide walks you through setting up and running both the Python FastAPI backend and the modern web frontend.

---

## 1. Prerequisites

- **Python**: Version 3.8 or higher installed (`python --version`)
- **Web Browser**: Any modern browser (Chrome, Edge, Firefox, Safari)

---

## 2. Backend Setup (FastAPI)

### Step 2.1: Open a terminal in the project directory
```powershell
cd d:\projects_demo\e-commers\backend
```

### Step 2.2: (Optional but recommended) Create a virtual environment
```powershell
python -m venv venv
.\venv\Scripts\activate
```
*(On macOS / Linux: `source venv/bin/activate`)*

### Step 2.3: Install dependencies
```powershell
pip install -r requirements.txt
```

### Step 2.4: Environment configuration
Copy `.env.example` to `.env` in the root or `backend/` folder:
```powershell
copy ..\.env.example .env
```

### Step 2.5: Launch the backend server
You can start the server using either the built-in runner or uvicorn directly:

```powershell
python run.py
```
*Or:*
```powershell
uvicorn app.main:app --reload --port 8000
```

The server will be available at:
- **API Base**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc UI**: `http://127.0.0.1:8000/redoc`

---

## 3. Running Automated Tests

Run the full test suite with `pytest` from the root directory:

```powershell
cd d:\projects_demo\e-commers
pytest tests/ -v
```

This runs tests verifying:
- Product listing, search, price sorting, and category filters
- Category metadata and slugs
- Cart calculation engine and coupon discounts
- Order submission and retrieval

---

## 4. Launching the Frontend

The frontend is built with modern HTML5, Vanilla CSS, and JavaScript. It connects directly to the FastAPI backend at `http://127.0.0.1:8000` while also including a smart embedded fallback mode so it can run immediately even before the backend is started.

### Option A: Open directly in your browser
Double-click `frontend/index.html` or open it with your browser:
```powershell
start d:\projects_demo\e-commers\frontend\index.html
```

### Option B: Serve with Python's built-in HTTP server
```powershell
cd d:\projects_demo\e-commers\frontend
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

---

## 5. Testing Demo Features

1. **Category Navigation**: Click between **All Categories**, **Electronics**, **Fashion**, **Home**, **Beauty**, **Sports**, and **Books** to filter products instantaneously.
2. **Instant Search**: Type keywords like "headphones", "sneakers", "lamp", or "journal" in the search input.
3. **Sort Options**: Sort by Featured, Price (Low to High), Price (High to Low), Top Rated, or Newest.
4. **Quick View**: Click "Quick View" on any product card to see detailed specifications and multi-feature bullets.
5. **Interactive Cart**:
   - Add items to your cart.
   - Adjust quantities or remove items.
   - Free shipping progress bar automatically updates as you approach $100.
6. **Promo Coupons**: Enter test codes like `WELCOME10` (10% off) or `SUPER20` (20% off) to see instant price deductions.
7. **Checkout**: Click "Proceed to Checkout", fill in customer shipping details, select payment method, and submit to generate an official order receipt with tracking code.
8. **Dark/Light Theme**: Toggle the sleek theme switch in the header.
