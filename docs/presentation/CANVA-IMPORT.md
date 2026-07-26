# Build this presentation in Canva

Cursor cannot log into your Canva account. Use either:

1. **Ready deck (open now):** double-click  
   [`Mashtal-Presentation.html`](Mashtal-Presentation.html)  
   → press **F** for fullscreen → arrows to navigate.

2. **Canva (copy/paste):** create a blank Presentation (16:9), then paste each slide below.

Suggested Canva style: green theme, clean white slides, bold title, short bullets.

---

## Canva setup (2 minutes)

1. canva.com → **Create a design** → **Presentation (16:9)**
2. Brand colors (approx): `#15803d` green, `#14532d` dark green, `#f7faf7` background
3. Fonts: any clean sans for body + a serif/display for titles if you want
4. Create **17 blank slides**, then fill from the list below
5. On the **Class diagram** slide, upload your Draw.io PNG export

---

## Slide-by-slide text (paste into Canva)

### Slide 1 — Title
**Title:** Mashtal  
**Subtitle:** Agricultural Social & Commerce Platform  
**Footer:** University Project Presentation · [Names] · [Course] · [Date]

### Slide 2 — Problem
**Title:** The problem  
- Hard to discover trusted local agricultural businesses  
- Shopping, advice, and community are scattered  
- Plant / farming questions need faster guidance  
- Sellers need one place for products, orders, and customers  

### Slide 3 — Solution
**Title:** One platform — Mashtal  
- Discover businesses & community content  
- Shop with cart + online payment  
- Posts & Threads  
- Realtime chat with businesses & Mashtal Support  
- AI assistant (text + plant photo)  
- Business subscription unlocks selling & dashboard  

### Slide 4 — Roles
**Title:** Who uses Mashtal  

| Role | Goal |
|------|------|
| Guest | Browse, search, AI, sign up |
| Visitor | Buy, follow, chat, engage |
| Business | Subscribe, sell, post, analytics |
| Admin | Moderate, support, oversee money |

### Slide 5 — Features (1)
**Title:** Core features  
- Discover / Home feeds  
- Posts & Threads + filters  
- Follow, save, like, comment, share  
- Shop search, filters, sort, grid/list  
- Business & user profiles  

### Slide 6 — Features (2)
**Title:** Commerce, chat & AI  
- Cart → Stripe → purchase history  
- Reviews & business reports  
- Realtime chat + admin support lock  
- Business dashboard (products, orders, charts)  
- Subscription: Stripe & Whish Money  
- AI agronomy + plant-disease analysis  
- EN / AR + RTL  

### Slide 7 — Use cases overview
**Title:** Use cases (UML)  
- Full catalog for Guest, Visitor, Business, Admin, External  
- Split diagrams by actor (complete coverage)  
- Docs: `docs/uml/Mashtal-UseCases.md`  

### Slide 8 — Guest use cases
**Title:** Guest  
- Browse Discover, Posts, Threads, Shop, Search  
- Read profiles & reviews  
- Share externally + AI assistant  
- Sign up / Sign in / Email verify  

### Slide 9 — Visitor use cases
**Title:** Visitor  
- Profile, saved items, follow  
- Like, comment, chat, notifications  
- Cart & Stripe checkout  
- Reviews & reports  

### Slide 10 — Business use cases
**Title:** Business  
**Inactive:** renew Stripe/Whish · edit profile · posts/threads · no selling  
**Active:** products CRUD · orders · analytics  

### Slide 11 — Admin & external
**Title:** Admin & systems  
**Admin:** users, businesses, subscriptions, orders, reports, support lock  
**External:** Stripe, Google, Email, Whish, AI, Translate, Location  

### Slide 12 — Class diagram
**Title:** Domain class model  
- Identity · Social · Commerce · Messaging  
- Multiplicities: 1 · 0..1 · 1..* · *  
- **Upload your Draw.io class-diagram image here**  

### Slide 13 — Architecture
**Title:** Architecture  
Browser → React/Vite SPA → Express REST → MongoDB  
Also: Socket.IO · Stripe · Whish · Python AI · Nodemailer · Google Auth  

### Slide 14 — Frontend tech
**Title:** Frontend stack  
React, Vite, TypeScript, Tailwind, Radix, Lucide  
Axios, Socket.io-client, i18next, Recharts  
Stripe.js, Google OAuth, React Hook Form  

### Slide 15 — Backend & AI tech
**Title:** Backend & AI  
Node, Express, MongoDB, Mongoose, Socket.io, JWT  
Stripe, Google Auth, Multer, Nodemailer  
AI: @xenova/transformers · Python FastAPI + PyTorch + Transformers  

### Slide 16 — Highlights
**Title:** Highlights  
- Feed priority for followed authors (2 days)  
- Checkout + subscription payments  
- Shared Support identity + chat lock  
- EN/AR + RTL  
- Social + commerce + AI together  

### Slide 17 — Thank you
**Title:** Thank you  
**Subtitle:** Live demo next · Questions?  

---

## Tip
In Canva, use **Bulk Create** or duplicate one styled slide, then only change titles/bullets — faster than designing 17 from scratch.
