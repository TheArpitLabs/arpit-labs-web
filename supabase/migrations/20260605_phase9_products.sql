-- Create the products and product_features tables for Arpit Labs Product Hub

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category text not null,
  pricing_type text not null,
  pricing_details text,
  demo_url text,
  documentation_url text,
  cover_image text,
  screenshots text[],
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  title text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table products enable row level security;
alter table product_features enable row level security;

create policy "Public select published products" on products
  for select
  using (published = true);

create policy "Public select features for published products" on product_features
  for select
  using (
    exists (
      select 1 from products p where p.id = product_features.product_id and p.published = true
    )
  );
