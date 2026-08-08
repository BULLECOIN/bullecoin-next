# BULLE — corrected complete replacement files

This package fixes the Bull Hub navigation issue by including both rendered components:

```tsx
<TokenDashboard />
<BullHub />
```

They are placed before the Roadmap section.

## Replace these folders/files

Copy the contents of this ZIP into your existing project:

- `app/`
- `components/`
- `public/bulle-logo.jpg`

Choose **Replace** when macOS asks.

## Validate locally

From `/Users/dbsmain/bullecoin` run:

```bash
cd ~/bullecoin
pkill -f "next dev" 2>/dev/null || true
rm -rf .next
npm run build
npm run dev
```

Open the exact Local address shown by Terminal, normally:

```text
http://localhost:3000
```

## Publish

```bash
git add .
git commit -m "Fix Bull Hub rendering"
git push
```

The imports in `app/page.tsx` use relative paths, so they do not depend on the `@` path alias.
