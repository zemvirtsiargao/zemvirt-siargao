# Zemvirt Siargao

A mobile-first prototype for booking online stays in Siargao. It includes search filters, date and guest inputs, stay listings, a property detail panel, price breakdown, and Pi Network reservation deposit flow.

## Open

Open `index.html` in a browser.

## Pi Network Setup

The frontend includes the Pi SDK and calls:

- `Pi.init({ version: "2.0", sandbox: true })`
- `Pi.authenticate(["username", "payments"], onIncompletePaymentFound)`
- `Pi.createPayment(...)`

Real Pi payments require backend approval and completion. Use `server.example.js` as the starting backend:

```powershell
$env:PI_API_KEY="your developer portal API key"
C:\Users\ritoe\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe server.example.js
```

Then register the served URL in the Pi Developer Portal and test inside Pi Browser. Keep `PI_API_KEY` only on the server.

## Files

- `index.html` - app structure
- `styles.css` - mobile UI styling
- `app.js` - filtering, booking sheet, and pricing logic
- `server.example.js` - backend template for Pi payment approve/complete calls
- `assets/` - local generated stay images
- `tools/generate-assets.ps1` - regenerates the local PNG stay images
