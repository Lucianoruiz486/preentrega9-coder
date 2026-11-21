# Simulador de Ventas - Validador de Stock

Simulador en JavaScript para un negocio de indumentaria deportiva. Es la **Pre-Entrega 9 (Asincronismo y Promesas)**: el catálogo se carga con una promesa (como si viniera de un servidor), con manejo de errores, y un recordatorio aparece unos segundos después de entrar. Todo se maneja desde el DOM.

## Estructura del repositorio
```
preentrega9-coder/
├── index.html      # estructura de la página; enlaza el CSS y el JS (con defer)
├── README.md
├── css/
│   └── style.css   # estilos y layout
└── js/
    └── main.js     # clase Producto, storage, asincronismo, renderizado y eventos
```

## Cómo ejecutarlo
1. Descargá o cloná el repositorio.
2. Abrí `index.html` con doble clic. No hace falta instalar nada.

## Cómo comprobar el asincronismo
1. **Carga con promesa:** al abrir la página se ve "⏳ Cargando productos..." durante 1,5 segundos y después "✔️ 6 productos cargados". Mientras carga, la página no se congela.
2. **Manejo de errores:** tildá **Simular falla de carga** y tocá **Recargar catálogo**. La promesa se rechaza y aparece "⚠️ No se pudo cargar el catálogo...". Los botones se vuelven a habilitar igual, porque el `finally` se ejecuta siempre. Destildá y recargá para que vuelva a funcionar.
3. **Temporizador:** 4 segundos después de entrar aparece un recordatorio amarillo con los productos agotados (se cierra con el botón **Cerrar**).

## Criterios de la consigna y dónde se cumplen
| Criterio | Dónde está en `js/main.js` |
|---|---|
| Temporizador (15%) | `setTimeout(mostrarRecordatorio, 4000)` al final del archivo; `mostrarRecordatorio()` usa los datos reales del stock |
| Promesa con async/await (15%) | `obtenerProductos()` devuelve una `Promise` resuelta con `setTimeout`; `cargarCatalogo()` (`async`) la consume con `await` |
| Manejo de errores (30%) | `cargarCatalogo()`: `try` con el `await`, `catch` con un mensaje claro para el usuario y `finally` que siempre vuelve a habilitar los botones |
| Avances en el proyecto (30%) | Se mantiene todo lo anterior: clase `Producto`, array de objetos, `localStorage` con `JSON.parse`/`JSON.stringify`, `??`, `?.`, ternario, destructuring, renderizado con `map`, eventos de click y teclado, y funciones de orden superior |
| Repositorio correcto (10%) | `index.html` en la raíz, `css/style.css` y `js/main.js` enlazados en el `head` |
