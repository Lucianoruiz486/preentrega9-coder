// ===================================================
// Pre-Entrega 9: Asincronismo y Promesas
// Simulador: Validador de Stock de un negocio de indumentaria deportiva
// Continuación de la Pre-Entrega 8: el catálogo se guarda en localStorage y ahora
// se carga con una promesa (async/await), con manejo de errores y un recordatorio
// temporizado. Toda la interacción pasa por el DOM.
// ===================================================

// ===================================================
// 1. CLASE (Pre-Entrega 5): la "fábrica" de productos del simulador
// ===================================================
class Producto {
  constructor(id, nombre, precio, stock) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.stock = stock;
  }

  // INFORMA: indica si hay unidades suficientes para el pedido
  hayStock(cantidad) {
    return cantidad <= this.stock;
  }

  // MODIFICA el estado: descuenta unidades. Solo vende enteros mayores a 0 que alcancen el stock
  // Retorna true si la venta se realizó y false si no
  vender(cantidad) {
    if (Number.isInteger(cantidad) && cantidad > 0 && this.hayStock(cantidad)) {
      this.stock = this.stock - cantidad;
      return true;
    }
    return false;
  }

  // MODIFICA el estado: baja el precio según el porcentaje (solo entre 0 y 100, sin incluirlos)
  aplicarDescuento(porcentaje) {
    if (porcentaje > 0 && porcentaje < 100) {
      this.precio = Math.round(this.precio - (this.precio * porcentaje) / 100);
    }
    return this.precio;
  }

  // CALCULA: precio final con IVA (21%), sin modificar el precio base
  calcularPrecioConIva() {
    return Math.round(this.precio * 1.21);
  }
}

// ===================================================
// 2. ESTADO DEL SIMULADOR: el array de objetos que se dibuja en pantalla
// ===================================================
// Datos de arranque: se usan solo la primera vez, cuando todavía no hay nada guardado
const productosIniciales = [
  { id: 1, nombre: "Zapatillas Running", precio: 85000, stock: 10 },
  { id: 2, nombre: "Remera Deportiva", precio: 22000, stock: 15 },
  { id: 3, nombre: "Short Deportivo", precio: 18000, stock: 12 },
  { id: 4, nombre: "Medias", precio: 6000, stock: 30 },
  { id: 5, nombre: "Mochila", precio: 35000, stock: 8 },
  { id: 6, nombre: "Botella Térmica", precio: 9000, stock: 0 },
];

// Clave con la que se guarda el catálogo en localStorage
const CLAVE_STORAGE = "productosStock";

// GUARDAR: convierte el array a texto JSON y lo almacena
function guardarProductos() {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(productos));
}

// RECUPERAR: lee el texto guardado y lo convierte de nuevo en un array
// - Si es la primera vez no hay nada guardado: getItem devuelve null y ?? usa los datos de arranque
// - JSON.parse devuelve objetos comunes (sin métodos), por eso se vuelven a crear como Producto
//   desestructurando sus propiedades
function cargarProductos() {
  let guardados;
  try {
    guardados = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
  } catch (error) {
    guardados = null; // si el texto guardado estuviera dañado, se empieza de cero
  }

  const lista = guardados ?? productosIniciales;
  return lista.map(({ id, nombre, precio, stock }) => new Producto(id, nombre, precio, stock));
}

// Estado del simulador: el catálogo arranca vacío y se llena con cargarCatalogo()
// (más abajo), que simula la carga desde un servidor
let productos = [];

// Indica si hay una carga en curso (mientras tanto no se puede agregar nada)
let cargando = false;

// Id único para un producto nuevo: el mayor id existente + 1
// (se calcula con los datos actuales porque el contador no sobreviviría a una recarga)
function obtenerNuevoId() {
  return productos.reduce((maximo, { id }) => Math.max(maximo, id), 0) + 1;
}

// ===================================================
// 3. SELECCIÓN DE ELEMENTOS DEL DOM
// ===================================================
const contenedorProductos = document.getElementById("contenedor-productos");
const mensaje = document.getElementById("mensaje");

const inputNombre = document.querySelector("#input-nombre");
const inputPrecio = document.querySelector("#input-precio");
const inputStock = document.querySelector("#input-stock");
const btnAgregar = document.querySelector("#btn-agregar");

const inputBuscar = document.querySelector("#input-buscar");
const checkDisponibles = document.querySelector("#check-disponibles");

const statProductos = document.querySelector("#stat-productos");
const statUnidades = document.querySelector("#stat-unidades");
const statValor = document.querySelector("#stat-valor");
const statAgotados = document.querySelector("#stat-agotados");

const btnRestablecer = document.querySelector("#btn-restablecer");
const btnVaciar = document.querySelector("#btn-vaciar");
const btnRecargar = document.querySelector("#btn-recargar");
const checkFalla = document.querySelector("#check-falla");

const aviso = document.querySelector("#aviso");
const avisoTexto = document.querySelector("#aviso-texto");
const btnCerrarAviso = document.querySelector("#btn-cerrar-aviso");

// ===================================================
// 4. FUNCIONES AUXILIARES
// ===================================================

// Formatea un número como precio argentino: 45000 -> "45.000"
const formatearPrecio = (valor) => valor.toLocaleString("es-AR");

// Evita que el texto escrito por el usuario se interprete como HTML dentro del innerHTML
function escaparHtml(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// FEEDBACK VISUAL: muestra un mensaje en pantalla y lo oculta solo a los 3,5 segundos
// tipo: "exito" (verde), "error" (rojo) o "info" (azul)
let temporizadorMensaje;
function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje mensaje--${tipo}`;

  clearTimeout(temporizadorMensaje);
  temporizadorMensaje = setTimeout(() => {
    mensaje.className = "mensaje oculto";
  }, 3500);
}

// FILTRO: devuelve los productos que coinciden con el texto buscado y con "solo con stock"
function obtenerProductosFiltrados() {
  const texto = inputBuscar.value.trim().toLowerCase();

  return productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(texto) &&
      (!checkDisponibles.checked || producto.stock > 0)
  );
}

// ===================================================
// 5. RENDERIZADO DINÁMICO
// ===================================================

// Recorre el array y dibuja una tarjeta por cada producto usando template strings
function renderizarProductos(lista) {
  if (lista.length === 0) {
    contenedorProductos.innerHTML = `<p class="vacio">No hay productos para mostrar.</p>`;
    return;
  }

  contenedorProductos.innerHTML = lista
    .map((producto) => {
      const agotado = producto.stock === 0;

      return `
        <article class="card ${agotado ? "card--agotado" : ""}" data-id="${producto.id}">
          <span class="etiqueta">${agotado ? "Agotado" : "En stock"}</span>
          <h3>${escaparHtml(producto.nombre)}</h3>
          <p class="card__precio">$${formatearPrecio(producto.precio)}</p>
          <p class="card__detalle">Con IVA: $${formatearPrecio(producto.calcularPrecioConIva())}</p>
          <p class="card__detalle">Stock: ${producto.stock} unidades</p>
          <div class="card__acciones">
            <button class="btn btn--primario" data-accion="vender" data-id="${producto.id}" ${agotado ? "disabled" : ""}>Vender 1</button>
            <button class="btn btn--secundario" data-accion="descuento" data-id="${producto.id}">-10%</button>
            <button class="btn btn--peligro" data-accion="eliminar" data-id="${producto.id}">Eliminar</button>
          </div>
        </article>`;
    })
    .join("");
}

// Actualiza el resumen del inventario (reduce suma, filter cuenta)
function actualizarResumen() {
  const unidades = productos.reduce((acumulado, producto) => acumulado + producto.stock, 0);
  const valorInventario = productos.reduce(
    (acumulado, producto) => acumulado + producto.precio * producto.stock,
    0
  );
  const agotados = productos.filter((producto) => producto.stock === 0).length;

  statProductos.textContent = productos.length;
  statUnidades.textContent = unidades;
  statValor.textContent = `$${formatearPrecio(valorInventario)}`;
  statAgotados.textContent = agotados;
}

// Vuelve a dibujar todo cada vez que el array cambia; si se pasa un id, resalta esa tarjeta
function actualizarVista(idResaltado) {
  renderizarProductos(obtenerProductosFiltrados());
  actualizarResumen();

  if (idResaltado !== undefined) {
    // ?. porque la tarjeta puede no existir (por ejemplo, si el filtro la oculta)
    const tarjeta = document.querySelector(`.card[data-id="${idResaltado}"]`);
    tarjeta?.classList.add("resaltada");
  }
}

// ===================================================
// 6. ACCIONES DEL SIMULADOR
// ===================================================

// Valida los datos del formulario y agrega un producto nuevo al array
function agregarProducto() {
  // Si el catálogo todavía se está cargando, el producto nuevo se perdería al terminar la carga
  if (cargando) {
    mostrarMensaje("Esperá a que termine de cargar el catálogo.", "info");
    return;
  }

  const nombre = inputNombre.value.trim();
  const precio = Number(inputPrecio.value);
  const stock = Number(inputStock.value);

  if (nombre === "") {
    mostrarMensaje("Ingresá el nombre del producto.", "error");
  } else if (!(precio > 0)) {
    mostrarMensaje("Ingresá un precio mayor a 0.", "error");
  } else if (inputStock.value === "" || !Number.isInteger(stock) || stock < 0) {
    mostrarMensaje("Ingresá un stock entero (0 o más).", "error");
  } else if (productos.some((producto) => producto.nombre.toLowerCase() === nombre.toLowerCase())) {
    mostrarMensaje(`Ya existe un producto llamado "${nombre}".`, "error");
  } else {
    // Flujo: crear el dato, agregarlo al array, guardarlo en storage y volver a dibujar
    const nuevoProducto = new Producto(obtenerNuevoId(), nombre, precio, stock);
    productos.push(nuevoProducto);
    guardarProductos();

    // Se limpian el formulario y los filtros para que el producto nuevo se vea seguro
    inputNombre.value = "";
    inputPrecio.value = "";
    inputStock.value = "";
    inputBuscar.value = "";
    checkDisponibles.checked = false;

    mostrarMensaje(`Agregaste "${nuevoProducto.nombre}" al catálogo.`, "exito");
    actualizarVista(nuevoProducto.id);
  }
}

// Vende 1 unidad validando el stock con el método del objeto
function venderUnidad(producto) {
  const vendido = producto.vender(1);

  // Operador ternario: reemplaza un if-else simple (el mensaje y su tipo dependen del resultado)
  mostrarMensaje(
    vendido
      ? `Vendiste 1 unidad de ${producto.nombre}. Quedan ${producto.stock}.`
      : `${producto.nombre} está agotado.`,
    vendido ? "exito" : "error"
  );

  guardarProductos();
  actualizarVista(producto.id);
}

// Aplica un 10% de descuento con el método del objeto
function aplicarDescuentoDiez(producto) {
  producto.aplicarDescuento(10);
  guardarProductos();
  mostrarMensaje(`${producto.nombre} ahora cuesta $${formatearPrecio(producto.precio)}.`, "info");
  actualizarVista(producto.id);
}

// Quita el producto del array (filter se queda con todos los demás)
function eliminarProducto(producto) {
  productos = productos.filter((item) => item.id !== producto.id);
  guardarProductos();
  mostrarMensaje(`Eliminaste "${producto.nombre}" del catálogo.`, "info");
  actualizarVista();
}

// Vacía el catálogo y guarda la lista vacía (al recargar sigue vacío)
function vaciarCatalogo() {
  productos = [];
  guardarProductos();
  mostrarMensaje("Vaciaste el catálogo.", "info");
  actualizarVista();
}

// Borra lo guardado en storage y vuelve a los productos de arranque
function restablecerCatalogo() {
  localStorage.removeItem(CLAVE_STORAGE);
  productos = cargarProductos();
  mostrarMensaje("Catálogo restablecido a los productos iniciales.", "info");
  actualizarVista();
}

// ===================================================
// 6.1 ASINCRONISMO: promesa, async/await y temporizador
// ===================================================

// PROMESA: simula pedirle los productos a un servidor (tarda 1,5 segundos)
// - Se resuelve con el catálogo guardado
// - Se rechaza si se pide simular una falla (como si el servidor no respondiera)
function obtenerProductos(simularFalla) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (simularFalla) {
        reject(new Error("el servidor no respondió"));
      } else {
        resolve(cargarProductos());
      }
    }, 1500);
  });
}

// ASYNC/AWAIT con TRY/CATCH/FINALLY: carga el catálogo sin bloquear la página
async function cargarCatalogo() {
  cargando = true;
  [btnAgregar, btnVaciar, btnRestablecer, btnRecargar].forEach((boton) => {
    boton.disabled = true;
  });
  contenedorProductos.innerHTML = `<p class="vacio">⏳ Cargando productos...</p>`;

  try {
    // await espera a que la promesa se resuelva (o se rechace) sin congelar la interfaz
    productos = await obtenerProductos(checkFalla.checked);
    actualizarVista();
    mostrarMensaje(`✔️ ${productos.length} productos cargados`, "exito");
  } catch (error) {
    // Si la promesa se rechaza, se llega acá con un mensaje claro para el usuario
    actualizarVista();
    mostrarMensaje(`⚠️ No se pudo cargar el catálogo (${error.message}). Intentá de nuevo.`, "error");
  } finally {
    // Se ejecuta SIEMPRE, haya salido bien o mal: se vuelven a habilitar los botones
    cargando = false;
    [btnAgregar, btnVaciar, btnRestablecer, btnRecargar].forEach((boton) => {
      boton.disabled = false;
    });
  }
}

// TEMPORIZADOR: unos segundos después de entrar, muestra un recordatorio con datos reales del stock
function mostrarRecordatorio() {
  const agotados = productos.filter((producto) => producto.stock === 0);

  let texto;
  if (productos.length === 0) {
    texto = "🔔 Recordatorio: el catálogo está vacío. Cargá productos para empezar a vender.";
  } else if (agotados.length === 0) {
    texto = "🔔 Recordatorio: todo el stock está al día.";
  } else {
    const nombres = agotados.map(({ nombre }) => nombre).join(", ");
    texto = `🔔 Recordatorio: hay ${agotados.length} producto/s agotado/s (${nombres}). ¡Es momento de reponer!`;
  }

  avisoTexto.textContent = texto;
  aviso.classList.remove("oculto");
}

// ===================================================
// 7. EVENTOS
// ===================================================

// CLICK en el botón Agregar
btnAgregar.addEventListener("click", agregarProducto);

// CLICK en los botones que vacían o restablecen los datos guardados
btnVaciar.addEventListener("click", vaciarCatalogo);
btnRestablecer.addEventListener("click", restablecerCatalogo);

// CLICK en "Recargar catálogo" (vuelve a ejecutar la carga asíncrona) y en cerrar el aviso
btnRecargar.addEventListener("click", cargarCatalogo);
btnCerrarAviso.addEventListener("click", () => {
  aviso.classList.add("oculto");
});

// TECLADO: Enter en cualquier campo del formulario también agrega el producto
[inputNombre, inputPrecio, inputStock].forEach((campo) => {
  campo.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      agregarProducto();
    }
  });
});

// TECLADO: la búsqueda filtra la lista mientras se escribe; Esc limpia el buscador
inputBuscar.addEventListener("keyup", (evento) => {
  if (evento.key === "Escape") {
    inputBuscar.value = "";
  }
  actualizarVista();
});

// CAMBIO en el checkbox "Solo con stock"
checkDisponibles.addEventListener("change", () => {
  actualizarVista();
});

// CLICK en los botones de cada tarjeta. Como las tarjetas se vuelven a dibujar
// cada vez, se escucha un solo click en el contenedor y se lee qué botón se tocó
contenedorProductos.addEventListener("click", (evento) => {
  // Destructuring: se leen accion e id del dataset del botón en una sola línea
  const { accion, id } = evento.target.dataset;
  const producto = productos.find((item) => item.id === Number(id));

  if (accion === undefined || producto === undefined) {
    return;
  }

  switch (accion) {
    case "vender":
      venderUnidad(producto);
      break;
    case "descuento":
      aplicarDescuentoDiez(producto);
      break;
    case "eliminar":
      eliminarProducto(producto);
      break;
  }
});

// ===================================================
// 8. INICIO: apenas carga la página se pide el catálogo y se programa el recordatorio
// ===================================================
cargarCatalogo();
setTimeout(mostrarRecordatorio, 4000);
