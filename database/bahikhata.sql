-- ============================================================
-- BAHIKHATA SCHEMA — PostgreSQL / Supabase version
-- Converted from Cassandra CQL to a normalized relational design
-- ============================================================

-- Supabase enables pgcrypto by default (for gen_random_uuid()).
-- If not enabled, uncomment the line below:
-- create extension if not exists pgcrypto;

-- ============================================================
-- ROLES
-- ============================================================

create table if not exists roles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now()
);

-- Seed default roles
insert into roles (name, description) values
('Customer', 'Consumer user purchasing products or daily services'),
('Retail Shop', 'Local Kirana / Retail shop merchant'),
('Delivery Business', 'Milk / Newspaper / Water daily delivery business'),
('Service Provider', 'Daily service provider merchant'),
('Admin', 'Platform super administrator')
on conflict (name) do nothing;

-- ============================================================
-- USERS
-- ============================================================

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    role_id uuid references roles(id) on delete set null,
    name text not null,
    email text unique,
    phone text unique,
    password_hash text not null,
    profile_pic text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_users_role_id on users(role_id);

-- ============================================================
-- ADDRESSES
-- ============================================================

create table if not exists addresses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    type text,
    address_line text,
    society text,
    building text,
    floor text,
    house_no text,
    zone text,
    city text,
    state text,
    pincode text,
    created_at timestamptz not null default now()
);

create index if not exists idx_addresses_user_id on addresses(user_id);

-- ============================================================
-- SHOPS
-- ============================================================

create table if not exists shops (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references users(id) on delete cascade,
    business_name text not null,
    gst_no text,
    is_approved boolean not null default false,
    qr_code text,
    created_at timestamptz not null default now()
);

-- ============================================================
-- DELIVERY BUSINESS
-- ============================================================

create table if not exists delivery_business (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references users(id) on delete cascade,
    business_name text not null,
    vehicle_no text,
    is_approved boolean not null default false,
    created_at timestamptz not null default now()
);

-- ============================================================
-- SERVICE BUSINESS
-- ============================================================

create table if not exists service_business (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references users(id) on delete cascade,
    business_name text not null,
    service_type text,
    is_approved boolean not null default false,
    created_at timestamptz not null default now()
);

-- ============================================================
-- CUSTOMER GROUPS
-- ============================================================

create table if not exists customer_groups (
    id uuid primary key default gen_random_uuid(),
    business_user_id uuid not null references users(id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_customer_groups_business on customer_groups(business_user_id);

-- ============================================================
-- CUSTOMERS
-- ============================================================

create table if not exists customers (
    id uuid primary key default gen_random_uuid(),
    business_user_id uuid not null references users(id) on delete cascade,
    customer_user_id uuid references users(id) on delete set null,
    group_id uuid references customer_groups(id) on delete set null,
    customer_name text not null,
    customer_phone text,
    customer_email text,
    credit_limit decimal(12,2) default 0,
    outstanding_balance decimal(12,2) default 0,
    notes text,
    created_at timestamptz not null default now()
);

create index if not exists idx_customers_business on customers(business_user_id);
create index if not exists idx_customers_user on customers(customer_user_id);
create index if not exists idx_customers_group on customers(group_id);

-- ============================================================
-- CATEGORIES
-- ============================================================

create table if not exists categories (
    id uuid primary key default gen_random_uuid(),
    business_user_id uuid not null references users(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz not null default now()
);

create index if not exists idx_categories_business on categories(business_user_id);

-- ============================================================
-- PRODUCTS
-- ============================================================

create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    business_user_id uuid not null references users(id) on delete cascade,
    category_id uuid references categories(id) on delete set null,
    name text not null,
    description text,
    barcode text,
    price decimal(12,2) not null default 0,
    cost_price decimal(12,2) default 0,
    is_active boolean not null default true,
    image_url text,
    created_at timestamptz not null default now()
);

create index if not exists idx_products_business on products(business_user_id);
create index if not exists idx_products_category on products(category_id);
create unique index if not exists uq_products_business_barcode
    on products(business_user_id, barcode) where barcode is not null;

-- ============================================================
-- INVENTORY
-- ============================================================

create table if not exists inventory (
    product_id uuid primary key references products(id) on delete cascade,
    business_user_id uuid not null references users(id) on delete cascade,
    stock int not null default 0,
    low_stock_threshold int default 0,
    last_restocked_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_inventory_business on inventory(business_user_id);

-- ============================================================
-- BILLS
-- ============================================================

create table if not exists bills (
    id uuid primary key default gen_random_uuid(),
    business_user_id uuid not null references users(id) on delete cascade,
    customer_id uuid references customers(id) on delete set null,
    invoice_no text not null,
    total_amount decimal(12,2) not null default 0,
    tax_amount decimal(12,2) default 0,
    discount_amount decimal(12,2) default 0,
    net_amount decimal(12,2) not null default 0,
    payment_status text not null default 'pending',
    payment_method text,
    pdf_url text,
    created_at timestamptz not null default now()
);

create unique index if not exists uq_bills_business_invoice
    on bills(business_user_id, invoice_no);
create index if not exists idx_bills_customer on bills(business_user_id, customer_id, created_at desc);

-- ============================================================
-- BILL ITEMS
-- ============================================================

create table if not exists bill_items (
    id uuid primary key default gen_random_uuid(),
    bill_id uuid not null references bills(id) on delete cascade,
    product_id uuid references products(id) on delete set null,
    product_name text not null,
    quantity decimal(12,3) not null default 1,
    price decimal(12,2) not null default 0,
    tax decimal(12,2) default 0,
    total decimal(12,2) not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_bill_items_bill on bill_items(bill_id);

-- ============================================================
-- PAYMENTS
-- ============================================================

create table if not exists payments (
    id uuid primary key default gen_random_uuid(),
    business_user_id uuid not null references users(id) on delete cascade,
    customer_id uuid references customers(id) on delete set null,
    bill_id uuid references bills(id) on delete set null,
    amount decimal(12,2) not null,
    payment_method text,
    status text not null default 'pending',
    transaction_id text,
    receipt_url text,
    notes text,
    created_at timestamptz not null default now()
);

create index if not exists idx_payments_customer on payments(business_user_id, customer_id, created_at desc);
create index if not exists idx_payments_bill on payments(bill_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

create table if not exists subscriptions (
    id uuid primary key default gen_random_uuid(),
    business_user_id uuid not null references users(id) on delete cascade,
    customer_id uuid references customers(id) on delete cascade,
    product_id uuid references products(id) on delete set null,
    service_name text,
    start_date date,
    end_date date,
    frequency text,
    status text not null default 'active',
    quantity_per_delivery decimal(12,3) default 1,
    paused_until date,
    created_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_business on subscriptions(business_user_id);
create index if not exists idx_subscriptions_customer on subscriptions(business_user_id, customer_id);

create table if not exists subscription_days (
    subscription_id uuid not null references subscriptions(id) on delete cascade,
    day_of_week text not null check (day_of_week in
        ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
    primary key (subscription_id, day_of_week)
);

-- ============================================================
-- ATTENDANCE
-- ============================================================

create table if not exists attendance (
    id uuid primary key default gen_random_uuid(),
    subscription_id uuid not null references subscriptions(id) on delete cascade,
    business_user_id uuid not null references users(id) on delete cascade,
    customer_id uuid references customers(id) on delete set null,
    attendance_date date not null,
    status text not null,
    quantity_delivered decimal(12,3) default 0,
    photo_proof text,
    notes text,
    created_at timestamptz not null default now(),
    unique (subscription_id, attendance_date)
);

create index if not exists idx_attendance_business_date on attendance(business_user_id, attendance_date);

-- ============================================================
-- DELIVERY REQUESTS
-- ============================================================

create table if not exists delivery_requests (
    id uuid primary key default gen_random_uuid(),
    subscription_id uuid not null references subscriptions(id) on delete cascade,
    request_date date not null,
    request_type text,
    quantity decimal(12,3),
    status text not null default 'pending',
    created_at timestamptz not null default now()
);

create index if not exists idx_delivery_requests_sub on delivery_requests(subscription_id, request_date);

-- ============================================================
-- TEMP BILLS
-- ============================================================

create table if not exists temp_bills (
    id uuid primary key default gen_random_uuid(),
    business_user_id uuid not null references users(id) on delete cascade,
    phone text,
    invoice_no text,
    total_amount decimal(12,2) default 0,
    discount_amount decimal(12,2) default 0,
    net_amount decimal(12,2) default 0,
    payment_status text default 'pending',
    payment_method text,
    items_json jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_temp_bills_business on temp_bills(business_user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    title text,
    message text,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, created_at desc);

-- ============================================================
-- HOLIDAYS
-- ============================================================

create table if not exists holidays (
    id uuid primary key default gen_random_uuid(),
    business_user_id uuid not null references users(id) on delete cascade,
    holiday_date date not null,
    reason text,
    created_at timestamptz not null default now()
);

create index if not exists idx_holidays_business_date on holidays(business_user_id, holiday_date);

-- ============================================================
-- COMPANIES / ZONES / SOCIETIES
-- ============================================================

create table if not exists companies (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz not null default now()
);

create table if not exists zones (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references companies(id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_zones_company on zones(company_id);

create table if not exists societies (
    id uuid primary key default gen_random_uuid(),
    zone_id uuid not null references zones(id) on delete cascade,
    name text not null,
    address text,
    created_at timestamptz not null default now()
);

create index if not exists idx_societies_zone on societies(zone_id);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================

create table if not exists activity_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    action text,
    details text,
    ip_address text,
    created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_user on activity_logs(user_id, created_at desc);
