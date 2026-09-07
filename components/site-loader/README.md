# Site Loader

Un loader iniziale leggero e riutilizzabile. Non mostra percentuali fittizie, non blocca la pagina oltre `9s` e rispetta `prefers-reduced-motion`.

## Uso rapido

Nel `<head>`:

```html
<link rel="stylesheet" href="/components/site-loader/site-loader.css">
```

Subito dopo `<body>`:

```html
<div class="site-loader" data-site-loader data-duration="2600" aria-live="polite" aria-label="Caricamento in corso">
  <div class="site-loader__content" role="status">
    <p class="site-loader__credit"><span>Creato da</span>Nome Studio</p>
    <div class="site-loader__topline">
      <span class="site-loader__mark">A.</span>
      <span class="site-loader__state">Loading</span>
    </div>
    <div class="site-loader__meter" aria-hidden="true">
      <div class="site-loader__track"><span class="site-loader__bar"></span></div>
      <span class="site-loader__progress" data-loader-progress>0%</span>
    </div>
    <p class="site-loader__label" data-loader-label>Sto preparando l'esperienza.</p>
  </div>
</div>
```

`data-duration` e' la durata del progresso da 0% a 100%; 2.400 ms e' il valore predefinito. Il fade parte solo una volta completato il 100%.

Prima della chiusura di `</body>` o con `defer`:

```html
<script src="/components/site-loader/site-loader.js"></script>
```

## Personalizzazione

```css
.site-loader {
  --site-loader-bg: #101010;
  --site-loader-ink: #f5f2ea;
  --site-loader-accent: #e8754d;
}
```

## API per pagine o transizioni

```js
SiteLoader.show({ label: "Apro il progetto…", delay: 120 });
// Quando la nuova vista è pronta:
SiteLoader.hide({ minDuration: 350 });
```

Il `delay` evita di mostrare il loader per navigazioni praticamente istantanee.
