# 📖 Bahi Khata – Digital Business Management & SaaS Ledger Platform

> 🔗 **Live Web Application:** [https://bahikhata123.netlify.app/](https://bahikhata123.netlify.app/)

---

## 📌 Project Overview

**Bahi Khata** (*Hindi for Account Ledger Book*) is a full-stack multi-tenant SaaS platform built to digitize daily operations for local businesses and service providers in India — including Kirana/retail shops, milk & water delivery routes, newspaper vendors, daily service providers (cooks, maids, laundries), and their customers.

It simplifies business management by replacing paper registers with:
- **Smart Point of Sale (POS) Billing** with barcode scanning and auto-stock updates.
- **Unique Phone Auto-Lookup** for customer credit (*Udhar*) tracking.
- **Daily Route & Delivery Attendance Tracking** (*Delivered / Skipped*).
- **Automated Subscription Billing** based on actual delivered quantities.
- **Unified Customer Portal** with a one-click **"Pay All"** dues feature.
- **Instant PDF Invoice & Receipt Generation**.

---

## 🌐 Live Hosting & Deployment Architecture

| Tier | Component | Platform / Host | Technology Stack | Live URL |
|---|---|---|---|---|
| **Front-End** | Client SPA | **Netlify** | React 18, Vite 5, Tailwind CSS |
| **Back-End** | REST API Server | **Render** | Node.js, Express 5, JWT, PDFKit |
| **Database** | Relational Database | **Supabase** | PostgreSQL 15+ (Transaction Pooler) |

---

## 👥 User Roles & Key Functionalities

### 1. 👤 Customer (Consumer)
- **Unified Ledger**: View live outstanding credit (*Udhar*) balances across all connected shops and service providers in one place.
- **One-Click "Pay All"**: Pay total accumulated dues across businesses instantly with a single button.
- **Subscription Tracker**: Track daily deliveries (milk, water, newspaper) and check today's status (*Delivered / Skipped*).
- **Flexibility Actions**: Request **"+1 Extra Item"** or **"Pause Subscription (7 Days)"**.
- **Payment History**: View past payment records and download printable PDF receipts.

### 2. 🏪 Retail Shop Merchant (Kirana / Store)
- **Point of Sale (POS)**: Search products or scan physical barcodes for instant cart checkout.
- **Udhar Auto-Fetch**: Type a 10-digit phone number in POS to auto-fetch customer name and live credit balance.
- **Flexible Payments**: Support Cash, UPI, Card, or Udhar checkout options.
- **Inventory & Stock Alerts**: Real-time stock deduction with low-stock threshold warning badges (`<= 5` units).
- **Reports & Invoices**: Generate, view, and download formatted PDF tax invoices for any bill.

### 3. 🚚 Delivery Business (Milk / Water / Newspaper)
- **Today's Delivery Route**: View scheduled customer delivery list filtered automatically for the current day of the week.
- **1-Tap Attendance**: Mark daily deliveries (*Delivered* / *Skipped*) with one click.
- **Subscription Management**: Add new customer subscriptions with product rate, daily quantity, and delivery days.
- **Automated Monthly Billing**: Auto-calculate monthly invoices (`Delivered Days × Daily Qty × Unit Price`), update customer Udhar balance, and generate PDF bills.

### 4. 🛠️ Daily Service Provider (Maids / Cooks / Laundry)
- Track daily service attendance and monthly visits.
- Set fixed per-day or per-month service rates.
- Compute monthly service bills and issue PDF receipts.

### 5. 👑 Super Admin
- **Platform Analytics**: Monitor platform-wide metrics (Total Users, Registered Shops, Delivery Businesses, Total Bill Volume).
- **User Directory Management**: View all users across roles.
- **Account Control**: Toggle user active/blocked status in real-time.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS, React Icons, Axios
- **Backend**: Node.js, Express 5, JWT (`jsonwebtoken`), bcrypt, PDFKit
- **Database**: PostgreSQL on Supabase (`pg` connection pool with SSL)
- **Build & Tools**: npm, dotenv, Nodemon

---

## 📂 Project Structure

```
Bahi Khata/
├── frontend/                   # React + Vite Frontend App
│   ├── src/
│   │   ├── components/        # Reusable UI components & modals
│   │   ├── contexts/          # AuthContext for session management
│   │   ├── pages/             # Pages (Login, Register, Admin, Shop, Delivery, Customer)
│   │   ├── utils/             # Axios instance configured with API URL
│   │   └── App.jsx            # Main Router setup
│   ├── netlify.toml           # Netlify build & SPA routing configuration
│   └── package.json
├── backend/                    # Express REST API Backend Server
│   ├── src/
│   │   ├── config/            # db.js (PostgreSQL Pool & MySQL compatibility layer)
│   │   ├── controllers/       # Auth, Admin, Bill, Customer, Delivery, Shop controllers
│   │   ├── middleware/        # JWT auth protection middleware
│   │   └── routes/            # Express routes
│   ├── app.js                 # Express middleware & route declarations
│   ├── server.js              # HTTP server entry point
│   └── package.json
└── database/
    └── bahikhata.sql          # PostgreSQL / Supabase Schema & seed data
```

---

## 🗄️ Database Schema Overview

The database uses PostgreSQL with UUID primary keys (`gen_random_uuid()`):

- `roles`: Pre-seeded user roles (`Customer`, `Retail Shop`, `Delivery Business`, `Service Provider`, `Admin`).
- `users`: Registered users with hashed passwords (`password_hash`), phone, email, and role reference.
- `shops` / `delivery_business` / `service_business`: Business profile details.
- `customers`: Mapping between businesses and customers with live `outstanding_balance`.
- `products` & `inventory`: Catalog management with stock levels and low-stock thresholds.
- `bills` & `bill_items`: POS invoices and line items.
- `payments`: Transaction records.
- `subscriptions` & `subscription_days`: Daily delivery subscriptions and active days.
- `attendance`: Daily delivery tracking (`attendance_date`, `status`, `quantity_delivered`).
- `temp_bills`: Staging table for walk-in customer bills before account registration.

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (or Supabase account)

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/jackofallcodes5/Bahi-Khata.git
cd "Bahi Khata"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

**Frontend (`frontend/.env.local` or `.env.production`):**
```env
VITE_API_URL=http://localhost:5000
```

### 4. Run Locally

```bash
# Start backend server (runs on http://localhost:5000)
cd backend
npm run dev

# Start frontend dev server (runs on http://localhost:3000)
cd frontend
npm run dev
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
