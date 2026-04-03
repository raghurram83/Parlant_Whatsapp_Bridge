# Major Incident Flip Deck

Production-ready interactive flip deck for an executive incident response walkthrough.

## Run locally

```bash
cd /Users/raghu_heyo_phone/langfuse_streamlit/presentation
npm install
npm run dev
```

Open `http://localhost:3000`.

## UI system

This project uses shadcn/ui components (Card, Button, Badge, Separator, Switch) and CSS variables for theming. UI primitives live in `src/components/ui/`.

## Edit slide content

All slide copy and metadata live in `src/data/slides.tsx`. Each slide references its inline SVG art from `src/components/art/`.

## Presenter mode

Toggle Presenter mode in the header to keep all slides unflipped by default and slightly increase font size and spacing. Flip individual cards to reveal the back content.

## Print view

Visit `/print` to render a print-friendly view with every slide expanded for export or PDF capture.
