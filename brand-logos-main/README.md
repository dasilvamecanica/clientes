# Car Brand Logos — 184 SVG & PNG Automotive Logos

A free, curated collection of **184 car brand logos** in **SVG and PNG** format — the same automotive logo set used in production on [VehicleSpecs.io, a free car specifications database](https://vehiclespecs.io).

Covers mass-market makes (Toyota, Volkswagen, Ford), supercar marques (Koenigsegg, Pagani, Hennessey), historical brands (Saab, Pontiac, Plymouth), and modern EV-only manufacturers (Rivian, Lucid, Polestar, Xpeng) — **100 cleaned SVGs + 84 optimized PNGs**.

Looking for full vehicle specs? [Browse all car brands on VehicleSpecs.io](https://vehiclespecs.io/brands).

## Usage

### CDN — jsDelivr (no download, no install)

Every logo is automatically served free over the [jsDelivr](https://www.jsdelivr.com/) global CDN. Just reference the file:

```html
<img src="https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@main/bmw-logo.svg" alt="BMW logo" />
```

For production, pin to a tagged release or commit hash instead of `@main` so the CDN cache stays stable:

```html
<img src="https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@v1.0.0/tesla-logo.svg" alt="Tesla logo" />
```

### Direct file reference (raw GitHub)

```html
<img src="https://raw.githubusercontent.com/vehiclespecs/brand-logos/main/bmw-logo.svg" alt="BMW logo" />
```

### Programmatic — npm package + `brands.json` manifest

Install from npm:

```bash
npm install car-brand-logos
```

A manifest mapping brand name → filename is included:

```json
{
  "BMW": "bmw-logo.svg",
  "Ferrari": "ferrari-logo.svg",
  "Tesla": "tesla-logo.svg",
  "Toyota": "toyota-logo.svg"
}
```

```js
import brands from 'car-brand-logos/brands.json' with { type: 'json' }
const logoFile = brands['BMW'] // → "bmw-logo.svg"
```

### Clone the repo

```bash
git clone https://github.com/vehiclespecs/brand-logos.git
```

## Important: Designed for white backgrounds

These logos were curated and visually verified on **white backgrounds**. Many use dark or full-color marks that will not render legibly on dark, colored, or transparent surfaces. **If your application uses a non-white background, check each logo individually** before relying on it — some brand marks tolerate dark surfaces; others become invisible or lose contrast.

This repository does not ship monochrome, inverted, or dark-mode variants. If you need them, fork the repo or transform via CSS `filter: invert()` (acceptable for simple marks, breaks on multi-color logos).

## Filenames

Filenames follow the `brand-name-logo.{svg,png}` convention. Brands with multiple words use hyphens (`alfa-romeo-logo.svg`, `aston-martin-logo.svg`).

## Trademarks

**All logos are property of their respective brand owners.** This repository provides them for identification and reference purposes only. Inclusion here is not endorsement by, sponsorship from, or affiliation with any brand.

If you represent a brand and would like a logo removed, updated, or replaced with an official version, please open an issue.

## License

The repository structure, manifest, and curation effort are released under the **MIT License** (see `LICENSE`).

This license applies only to the project's organization and metadata — **the logos themselves remain trademarked property of their respective brand owners**, as noted above. You cannot license something you don't own; treat the logo files as you would any other trademark asset.

## About

Compiled from publicly available materials and quality-checked for use on [VehicleSpecs.io](https://vehiclespecs.io) — a free database of detailed car specifications, performance figures, and dimensions for thousands of models.

## Contributing

- Found an outdated logo (brand redesigned, file is wrong)? Open an issue or PR.
- Brand we're missing? Open an issue with a public-source SVG or PNG and we'll evaluate.
- Logo doesn't render correctly? Open an issue with the affected filename and the rendering context (browser, background color, intended size).
