const apiUrl = 'https://criptoya.com/api/dolar';
const container = document.getElementById('container');
const brecha = document.getElementById('brecha');
const eliminados = new Set(); // Almacena los identificadores de cajas eliminadas
let isHovering = false; // Flag para evitar conflictos con hover

// Función para cargar los datos
function cargarDatos() {
  if (isHovering) return; // Evita actualizar mientras se está en hover
  fetch(apiUrl)
    .then(respuesta => respuesta.json())
    .then(data => {
      container.innerHTML = ''; // Limpiar el contenido previo antes de actualizar
      mostrarDatos(data);
      calcularBrecha(data); // Calcular y mostrar la brecha
    })
    .catch(error => {
      console.error('Error al cargar la API:', error);
      container.innerHTML = '<p>Error al cargar los datos. Intente nuevamente más tarde.</p>';
      brecha.innerHTML = '<p>Error al calcular la brecha.</p>';
    });
}

// Función para mostrar los datos en cajas
function mostrarDatos(datos) {
  for (const tipo in datos) {
    if (tipo === 'cripto' || tipo === 'mep' || tipo === 'ccl') {
      // Manejar subcategorías con anidación adicional
      for (const subTipo in datos[tipo]) {
        const subDatos = datos[tipo][subTipo];

        if (typeof subDatos === 'object' && subDatos['24hs'] && subDatos['ci']) {
          // Manejar datos con "24hs" y "ci" (como en `mep` y `ccl`)
          for (const tiempo in subDatos) {
            const tiempoDatos = subDatos[tiempo];
            const idCaja = `${tipo}-${subTipo}-${tiempo}`; // Identificador único
            if (!eliminados.has(idCaja)) {
              const caja = crearCaja(`${tipo.toUpperCase()} - ${subTipo.toUpperCase()} (${tiempo})`, tiempoDatos, idCaja);
              container.appendChild(caja);
            }
          }
        } else {
          // Manejar datos estándar (como `cripto`)
          const idCaja = `${tipo}-${subTipo}`; // Identificador único
          if (!eliminados.has(idCaja)) {
            const caja = crearCaja(`${tipo.toUpperCase()} - ${subTipo.toUpperCase()}`, subDatos, idCaja);
            container.appendChild(caja);
          }
        }
      }
    } else {
      // Datos estándar
      const idCaja = `${tipo}`; // Identificador único
      if (!eliminados.has(idCaja)) {
        const datosTipo = datos[tipo];
        const caja = crearCaja(tipo.toUpperCase(), datosTipo, idCaja);
        container.appendChild(caja);
      }
    }
  }
}

// Función para crear una caja de datos
function crearCaja(titulo, datos, idCaja) {
  const valorCompra = datos?.bid ?? datos?.price ?? 'N/A';
  const valorVenta = datos?.ask ?? 'N/A';
  const variacion = datos?.variation ?? 'N/A';
  const timestamp = datos?.timestamp
    ? new Date(datos.timestamp * 1000).toLocaleString()
    : 'N/A';

  const caja = document.createElement('div');
  caja.className = 'caja';
  caja.dataset.id = idCaja; // Asigna el identificador único a la caja

  caja.innerHTML = `
    <button class="cerrar" title="Eliminar esta caja">X</button>
    <h2>${titulo}</h2>
    <p><strong>Compra:</strong> ${valorCompra}</p>
    <p><strong>Venta:</strong> ${valorVenta}</p>
    <p><strong>Variación:</strong> ${variacion}%</p>
    <p><strong>Última actualización:</strong> ${timestamp}</p>
  `;

  // Evento para eliminar la caja al hacer clic en el botón "X"
  const botonCerrar = caja.querySelector('.cerrar');
  botonCerrar.addEventListener('click', () => {
    eliminados.add(idCaja); // Marca esta caja como eliminada
    caja.remove();
  });

  // Eventos para manejar el hover
  caja.addEventListener('mouseenter', () => {
    isHovering = true; // Activar flag en hover
  });
  caja.addEventListener('mouseleave', () => {
    isHovering = false; // Desactivar flag al salir del hover
  });

  return caja;
}

// Función para calcular y mostrar la brecha
function calcularBrecha(datos) {
  const usdt = datos.cripto?.usdt?.bid || null; // Valor de compra (bid) de USDT
  const al30ci = datos.mep?.al30?.ci?.price || null; // Precio de AL30CI
  const al3024hs = datos.mep?.al30?.["24hs"]?.price || null; // Precio de AL30 24hs

  // Limpiar el contenido previo de `brecha`
  brecha.innerHTML = '';

  if (usdt && al30ci) {
    const brechaPorcentaje = ((usdt - al30ci) / al30ci) * 100;
    brecha.innerHTML += `
      <div class="cajabrecha">
        <h2>Brecha USDT vs AL30CI</h2>
        <p><strong>USDT (Compra):</strong> ${usdt.toFixed(2)}</p>
        <p><strong>AL30CI:</strong> ${al30ci.toFixed(2)}</p>
        <p><strong>Brecha:</strong> ${brechaPorcentaje.toFixed(2)}%</p>
      </div>
    `;
  } else {
    brecha.innerHTML += '<p>No se pudo calcular la brecha USDT vs AL30CI. Datos insuficientes.</p>';
  }

  if (usdt && al3024hs) {
    const brechaPorcentaje = ((usdt - al3024hs) / al3024hs) * 100;
    brecha.innerHTML += `
      <div class="cajabrecha">
        <h2>Brecha USDT vs AL30 24h</h2>
        <p><strong>USDT (Compra):</strong> ${usdt.toFixed(2)}</p>
        <p><strong>AL30 24h:</strong> ${al3024hs.toFixed(2)}</p>
        <p><strong>Brecha:</strong> ${brechaPorcentaje.toFixed(2)}%</p>
      </div>
    `;
  } else {
    brecha.innerHTML += '<p>No se pudo calcular la brecha USDT vs AL30 24h. Datos insuficientes.</p>';
  }
}

// Llamar a `cargarDatos` cada 1 segundo
setInterval(cargarDatos, 1000);

// Cargar datos inicialmente
cargarDatos();
