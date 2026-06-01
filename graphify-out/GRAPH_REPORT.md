# Graph Report - .  (2026-06-01)

## Corpus Check
- 37 files · ~12,155 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 579 nodes · 608 edges · 34 communities (29 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.82)
- Token cost: 74,476 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_External Services & Infra Setup|External Services & Infra Setup]]
- [[_COMMUNITY_Products Table Schema|Products Table Schema]]
- [[_COMMUNITY_Orders Table Schema|Orders Table Schema]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Product Images Schema|Product Images Schema]]
- [[_COMMUNITY_Order Items Schema|Order Items Schema]]
- [[_COMMUNITY_Orders Indexes|Orders Indexes]]
- [[_COMMUNITY_Product Variants Schema|Product Variants Schema]]
- [[_COMMUNITY_Products Constraints & Indexes|Products Constraints & Indexes]]
- [[_COMMUNITY_Drizzle Migration Snapshot|Drizzle Migration Snapshot]]
- [[_COMMUNITY_Order Items Foreign Keys|Order Items Foreign Keys]]
- [[_COMMUNITY_Images Foreign Keys|Images Foreign Keys]]
- [[_COMMUNITY_App Runtime Logic (env, db, rate-limit)|App Runtime Logic (env, db, rate-limit)]]
- [[_COMMUNITY_Variants Constraints & FKs|Variants Constraints & FKs]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Order Items Constraints|Order Items Constraints]]
- [[_COMMUNITY_Dev Dependencies & Tooling|Dev Dependencies & Tooling]]
- [[_COMMUNITY_Product Variants Indexes|Product Variants Indexes]]
- [[_COMMUNITY_Drizzle ORM Models & Types|Drizzle ORM Models & Types]]
- [[_COMMUNITY_Skills Lock Manifest|Skills Lock Manifest]]
- [[_COMMUNITY_Prettier Config|Prettier Config]]
- [[_COMMUNITY_Root Layout & Fonts|Root Layout & Fonts]]
- [[_COMMUNITY_Next Config & Security Headers|Next Config & Security Headers]]
- [[_COMMUNITY_Drizzle Migration Journal|Drizzle Migration Journal]]
- [[_COMMUNITY_UI Icon Assets|UI Icon Assets]]
- [[_COMMUNITY_Privacy Page|Privacy Page]]
- [[_COMMUNITY_Terms Page|Terms Page]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Brand Logo Assets|Brand Logo Assets]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `scripts` - 15 edges
3. `columns` - 12 edges
4. `public.images` - 11 edges
5. `public.order_items` - 11 edges
6. `public.orders` - 11 edges
7. `public.product_variants` - 11 edges
8. `public.products` - 11 edges
9. `columns` - 11 edges
10. `Anna's Art Platform Engineering Plan` - 11 edges

## Surprising Connections (you probably didn't know these)
- `CI/CD Pipeline` --semantically_similar_to--> `Git Hooks (Husky)`  [INFERRED] [semantically similar]
  docs/anna-art-platform-plan.md → README.md
- `Secrets Management` --semantically_similar_to--> `Account Ownership Rule (Anna's Name)`  [INFERRED] [semantically similar]
  SECURITY.md → docs/EXTERNAL-SETUP.md
- `Neon Production Postgres` --conceptually_related_to--> `Local Postgres 17 Container`  [INFERRED]
  docs/EXTERNAL-SETUP.md → docker-compose.yml
- `Tech Stack` --conceptually_related_to--> `Tech Stack Rationale`  [INFERRED]
  README.md → docs/anna-art-platform-plan.md
- `Security Architecture` --conceptually_related_to--> `Security Posture`  [INFERRED]
  docs/anna-art-platform-plan.md → SECURITY.md

## Hyperedges (group relationships)
- **Checkout Critical Path (Stripe + Inventory + Idempotency)** — plan_checkoutflow, plan_inventoryintegrity, plan_pricesnapshots, security_pcisaqa, handover_invariants [INFERRED 0.80]
- **Defence-in-Depth Security Model** — security_secretsmgmt, security_headerscsp, security_applayer, security_supplychain, plan_securityarch [INFERRED 0.80]
- **Local Dev Onboarding Flow** — readme_devup, dockercompose_postgres, extsetup_checklist, runbook_environments [INFERRED 0.75]
- **Next.js Default Scaffolding Assets** — next_wordmark_logo, vercel_triangle_logo, file_document_icon [INFERRED 0.85]

## Communities (34 total, 5 thin omitted)

### Community 0 - "External Services & Infra Setup"
Cohesion: 0.07
Nodes (46): Local Dev Stack (Docker Compose), Local Postgres 17 Container, AWS Media Pipeline (S3 + CloudFront), External Setup Checklist, Neon Production Postgres, Account Ownership Rule (Anna's Name), Resend Transactional Email, Sentry Error Monitoring (+38 more)

### Community 1 - "Products Table Schema"
Cohesion: 0.05
Nodes (41): name, notNull, primaryKey, type, base_price_cents, description, slug, status (+33 more)

### Community 2 - "Orders Table Schema"
Cohesion: 0.05
Nodes (38): currency, customer_email, shipping_address, shipping_cents, stripe_payment_intent_id, subtotal_cents, total_cents, default (+30 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, drizzle-orm, next, postgres, react, react-dom, server-only, stripe (+26 more)

### Community 4 - "Product Images Schema"
Cohesion: 0.06
Nodes (34): default, name, notNull, primaryKey, type, alt_text, height, id (+26 more)

### Community 5 - "Order Items Schema"
Cohesion: 0.06
Nodes (32): order_id, product_id, quantity, title_snapshot, unit_price_cents, variant_id, name, notNull (+24 more)

### Community 6 - "Orders Indexes"
Cohesion: 0.06
Nodes (31): orders_email_idx, orders_payment_intent_idx, orders_status_idx, columns, concurrently, isUnique, method, name (+23 more)

### Community 7 - "Product Variants Schema"
Cohesion: 0.07
Nodes (28): created_at, name, price_cents, sku, stock_qty, default, name, notNull (+20 more)

### Community 8 - "Products Constraints & Indexes"
Cohesion: 0.07
Nodes (27): products_base_price_nonneg, products_slug_idx, products_status_idx, name, value, columns, concurrently, isUnique (+19 more)

### Community 9 - "Drizzle Migration Snapshot"
Cohesion: 0.07
Nodes (26): dialect, enums, public.order_status, public.product_status, public.product_type, id, _meta, columns (+18 more)

### Community 10 - "Order Items Foreign Keys"
Cohesion: 0.08
Nodes (25): order_items_order_id_orders_id_fk, order_items_product_id_products_id_fk, order_items_variant_id_product_variants_id_fk, columnsFrom, columnsTo, name, onDelete, onUpdate (+17 more)

### Community 11 - "Images Foreign Keys"
Cohesion: 0.08
Nodes (25): images_product_id_products_id_fk, columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo (+17 more)

### Community 12 - "App Runtime Logic (env, db, rate-limit)"
Cohesion: 0.13
Nodes (16): db, globalForDb, GET(), adminEmails, clientSchema, env, serverSchema, clientIp() (+8 more)

### Community 13 - "Variants Constraints & FKs"
Cohesion: 0.09
Nodes (23): product_variants_price_nonneg, product_variants_stock_nonneg, product_variants_product_id_products_id_fk, name, value, columnsFrom, columnsTo, name (+15 more)

### Community 14 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 15 - "Order Items Constraints"
Cohesion: 0.10
Nodes (20): order_items_qty_positive, order_items_order_idx, columns, concurrently, isUnique, method, name, with (+12 more)

### Community 16 - "Dev Dependencies & Tooling"
Cohesion: 0.13
Nodes (15): devDependencies, dotenv, drizzle-kit, eslint, eslint-config-next, husky, lint-staged, prettier (+7 more)

### Community 17 - "Product Variants Indexes"
Cohesion: 0.13
Nodes (15): product_variants_product_idx, product_variants_sku_idx, columns, concurrently, isUnique, method, name, with (+7 more)

### Community 18 - "Drizzle ORM Models & Types"
Cohesion: 0.13
Nodes (14): Image, images, NewProduct, Order, OrderItem, orderItems, orders, orderStatus (+6 more)

### Community 19 - "Skills Lock Manifest"
Cohesion: 0.15
Nodes (12): computedHash, skillPath, source, sourceType, skills, neon-postgres, upstash, computedHash (+4 more)

### Community 20 - "Prettier Config"
Cohesion: 0.29
Nodes (6): plugins, printWidth, semi, singleQuote, tabWidth, trailingComma

### Community 21 - "Root Layout & Fonts"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 22 - "Next Config & Security Headers"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 23 - "Drizzle Migration Journal"
Cohesion: 0.50
Nodes (3): dialect, entries, version

### Community 24 - "UI Icon Assets"
Cohesion: 0.67
Nodes (3): File / Document Icon, Globe / World Icon, Window / Browser Icon

## Knowledge Gaps
- **409 isolated node(s):** `semi`, `singleQuote`, `trailingComma`, `printWidth`, `tabWidth` (+404 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `tables` connect `Order Items Constraints` to `Orders Indexes`, `Products Constraints & Indexes`, `Drizzle Migration Snapshot`, `Images Foreign Keys`, `Variants Constraints & FKs`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `id` connect `Product Images Schema` to `Products Table Schema`, `Orders Table Schema`, `Order Items Schema`, `Product Variants Schema`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `public.order_items` connect `Order Items Constraints` to `Order Items Foreign Keys`, `Order Items Schema`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `semi`, `singleQuote`, `trailingComma` to the rest of the system?**
  _414 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `External Services & Infra Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.06570048309178744 - nodes in this community are weakly interconnected._
- **Should `Products Table Schema` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Orders Table Schema` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._