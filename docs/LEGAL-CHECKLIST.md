# Legal checklist — before the shop takes real sales

> Plain-English checklist for making the site legally sound in the UK. None of
> this is legal advice — it's a practical summary with sources so Anna (or a
> solicitor/template service) can finalise it quickly. The pages are already
> written to UK norms; you mostly need to **fill in real details** and have a
> final read.

## 1. Is a privacy policy required? — **Yes**

A privacy policy is **legally required under UK GDPR** the moment you collect any
personal data (names, emails, delivery addresses). It's already written at
[`/privacy`](../src/app/privacy/page.tsx) to UK GDPR standards. You just need to
fill the bracketed details (below).

Source: [ICO / UK GDPR privacy guide](https://waterfront.law/uk-gdpr-privacy-policy-guide-key-requirements-for-websites-and-apps/),
[FSB e-commerce law](https://www.fsb.org.uk/resources/article/14-e-commerce-laws-and-legal-requirements-for-online-businesses-MCKEGGLGLTFFHATKVELB4RUOQCCM).

## 2. Do you need a cookie banner? — **No (as built)**

A consent banner is only required for **non-essential** cookies (analytics,
marketing/tracking). This site uses **only essential cookies** (basket, form
security), which are exempt. So there's **no cookie banner** — kept deliberately
simple. If you ever add Google Analytics or ad pixels, you must add a consent
banner and update the privacy policy first.

## 3. Terms of Service — covers UK consumer law

[`/terms`](../src/app/terms/page.tsx) already includes:

- **14-day right to cancel** (Consumer Contracts Regulations 2013) for standard
  orders, with the **commissions / made-to-order exemption** stated.
- **Consumer Rights Act 2015** for faulty/damaged goods.
- Shipping policy, GBP pricing, IP terms, governing law (England & Wales).

Source: [Consumer Contracts Regs (Which?)](https://www.which.co.uk/consumer-rights/regulation/consumer-contracts-regulations-ajWHC8m21cAk).

## 4. Fill in these bracketed details

Search both pages for `[...]` and replace:

| Placeholder | What to put | Where |
|---|---|---|
| `[trading name]` | The name you trade under (can just be "Anna Barnett") | privacy + terms |
| `[contact email]` | The email customers should use (e.g. `anna@…`) | privacy + terms |
| `[VAT status …]` | If **not** VAT-registered (likely): keep the "not VAT-registered" wording. If registered, state the VAT number | terms |
| `[delivery regions]` | Where you ship (e.g. "mainland UK") | terms |
| `Last updated` date | Set to the date you publish | both |

> **Business address:** you do **not** need to publish a home address. A
> contact email is enough for a sole trader. Only a limited company must show a
> registered office. (If you'd rather, a separate business address or a PO box
> can be added later.)

## 5. Business details on the site

UK rules say key business details should be findable: trading name, a contact
route (email is fine), and — **if** you register a limited company or for VAT —
the company number / VAT number. As a sole trader below the VAT threshold, the
trading name + contact email already on the site are sufficient.

## 6. Optional: a final professional glance

The pages are written to standard UK requirements, but if you want extra
assurance before real sales, a low-cost template service (e.g. a solicitor-drawn
e-commerce T&Cs/privacy pack) or a short solicitor review is the safe final step.
Not required to launch a demo; worth it once money is actually changing hands.

---

**Bottom line:** privacy policy required ✅ (done, fill the blanks), cookie
banner not required ✅, terms cover the 14-day cancellation + faulty-goods law ✅.
The only outstanding work is dropping in Anna's real contact email, trading name
and VAT status.
