# OpenSaaS Dine - Restaurant Ordering SaaS

This project is a multi-tenant restaurant ordering system built on top of the [Open Saas](https://opensaas.sh) template.

## Core Features
- **Multi-tenant Architecture**: Each restaurant manages its own isolated context.
- **Restaurant Onboarding**: Multi-step flow from signup to admin approval.
- **Menu Management**: Owners manage categories, items (with images), and add-ons.
- **Customer Menu**: Public-facing, mobile-first menu at `/m/[slug]` with persistent cart.
- **Order System**: Support for Dine-in, Takeaway, and Delivery with manual Pakistani payment methods.
- **Live Tracking**: Customers track orders via a dynamic status timeline.
- **Dashboard**: Real-time order processing, QR code generation, and analytics.

## Directory Structure

1. `app` - The Wasp web application (Core Logic).
2. `e2e-tests` - [Playwright](https://playwright.dev/) tests for your Wasp web app.
3. `blog` - Your blog / docs, built with [Astro](https://docs.astro.build) based on [Starlight](https://starlight.astro.build/) template.

For more details, check READMEs of each respective directory!
