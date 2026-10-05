# One More Modern Trade preview

An interactive Vue 3 concept for retailer purchase orders and internal fulfillment.

## Run locally

```sh
npm install
npm run dev -- --port 8767
```

Open `http://127.0.0.1:8767/`.

The sign-in screen is a demo account switcher, not authentication. Orders, stock balances, and movement history use sample data saved in this browser's local storage. Use **Reset sample data** to restore the starting state. No live POS, ERP, retailer, or warehouse system is connected.

Preview flow: enter as a retailer, submit a PO, switch to the One More team, confirm and prepare the SO, dispatch to record stock out, mark delivered, and use Stock & receiving to record stock in.

## Styling

Tailwind CSS v4 runs through `@tailwindcss/vite`. Layout utilities are used directly in Vue templates; reusable component styles in `src/style.css` compose Tailwind utilities with `@apply`. Decorative effects and typography tokens remain CSS. Tailwind Preflight is omitted to preserve the preview’s existing native element defaults.

See the [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite).

## Typography

The preview uses a Material 3 inspired type scale defined in `src/typography.css`. It uses Inter, with Noto Sans Khmer for Khmer text, and named roles instead of scattered pixel values: display 57/45/36, headline 32/28/24, title 22/16/14, body 16/14/12, and labels 14/12. Values are CSS pixels; corresponding line heights are defined beside them. The compact business interface uses 12px only for secondary captions, 14px for table and control text, and 16px for primary reading text.

## Product data

`src/catalog.js` contains the supplied product names, Khmer names, SKUs, piece and case variants, and USD prices. All 24 attached product pictures are copied into `public/products/`. There are 20 priced, orderable SKUs and 14 additional pictured products with no supplied SKU or price; those are visible for reference but cannot be added to an order. Case variants use the corresponding piece picture with a **CASE** badge because case photographs were not supplied. Stock balances are sample values. The pasted `OMK1002` row was incomplete, so its Chicken Powder 400g name and image were matched to the supplied `OMK1002-36` case row; its supplied `$1.50` price is retained.
