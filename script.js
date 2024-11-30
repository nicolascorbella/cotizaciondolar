const apiUrl = 'https://criptoya.com/api/dolar';
const container = document.getElementById('container');
const brecha = document.getElementById('brecha');
// Función para cargar los datos
function cargarDatos() {
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
            const caja = crearCaja(`${tipo.toUpperCase()} - ${subTipo.toUpperCase()} (${tiempo})`, tiempoDatos);
            container.appendChild(caja);
          }
        } else {
          // Manejar datos estándar (como `cripto`)
          const caja = crearCaja(`${tipo.toUpperCase()} - ${subTipo.toUpperCase()}`, subDatos);
          container.appendChild(caja);
        }
      }
    } else {
      // Datos estándar
      const datosTipo = datos[tipo];
      const caja = crearCaja(tipo.toUpperCase(), datosTipo);
      container.appendChild(caja);
    }
  }
}

// Función para crear una caja de datos
function crearCaja(titulo, datos) {
  const valorCompra = datos?.bid ?? datos?.price ?? 'N/A';
  const valorVenta = datos?.ask ?? 'N/A';
  const variacion = datos?.variation ?? 'N/A';
  const timestamp = datos?.timestamp
    ? new Date(datos.timestamp * 1000).toLocaleString()
    : 'N/A';

  const caja = document.createElement('div');
  caja.className = 'caja';

  caja.innerHTML = `
    <h2>${titulo}</h2>
    <p><strong>Compra:</strong> ${valorCompra}</p>
    <p><strong>Venta:</strong> ${valorVenta}</p>
    <p><strong>Variación:</strong> ${variacion}%</p>
    <p><strong>Última actualización:</strong> ${timestamp}</p>
  `;

  return caja;
}

// Función para crear una caja de datos
function crearCaja(titulo, datos) {
  const valorCompra = datos?.bid ?? datos?.price ?? 'N/A';
  const valorVenta = datos?.ask ?? 'N/A';
  const variacion = datos?.variation ?? 'N/A';
  const timestamp = datos?.timestamp
    ? new Date(datos.timestamp * 1000).toLocaleString()
    : 'N/A';

  const caja = document.createElement('div');
  caja.className = 'caja';

  caja.innerHTML = `
    <h2>${titulo}</h2>
    <p><strong>Compra:</strong> ${valorCompra}</p>
    <p><strong>Venta:</strong> ${valorVenta}</p>
    <p><strong>Variación:</strong> ${variacion}%</p>
    <p><strong>Última actualización:</strong> ${timestamp}</p>
  `;

  return caja;
}
function calcularBrecha(datos) {
  const usdt = datos.cripto?.usdt?.bid || null; // Valor de compra (bid) de USDT
  const al30ci = datos.mep?.al30?.ci?.price || null; // Precio de AL30CI
  const al3024hs = datos.mep?.al30?.["24hs"]?.price || null; // Precio de AL30 24hs

  // Limpiar el contenido previo de `brecha`
  brecha.innerHTML = '';

  // Calcular y mostrar la brecha USDT vs AL30CI
  if (usdt && al30ci) {
    const brechaPorcentaje = ((usdt - al30ci) / al30ci) * 100;

    const cajaAL30CI = `
      <div class="caja">
        <h2>Brecha USDT vs AL30CI</h2>
        <p><strong>USDT (Compra):</strong> ${usdt.toFixed(2)}</p>
        <p><strong>AL30CI:</strong> ${al30ci.toFixed(2)}</p>
        <p><strong>Brecha:</strong> ${brechaPorcentaje.toFixed(2)}%</p>
      </div>
    `;

    brecha.innerHTML += cajaAL30CI;
  } else {
    brecha.innerHTML += '<p>No se pudo calcular la brecha USDT vs AL30CI. Datos insuficientes.</p>';
  }

  // Calcular y mostrar la brecha USDT vs AL30 24hs
  if (usdt && al3024hs) {
    const brechaPorcentaje = ((usdt - al3024hs) / al3024hs) * 100;

    const cajaAL3024hs = `
      <div class="caja brecha">
        <h2>Brecha USDT vs AL30 24h</h2>
        <p><strong>USDT (Compra):</strong> ${usdt.toFixed(2)}</p>
        <p><strong>AL30 24h:</strong> ${al3024hs.toFixed(2)}</p>
        <p class="brecha">Brecha:${brechaPorcentaje.toFixed(2)}%</p>
      </div>
    `;

    brecha.innerHTML += cajaAL3024hs;
  } else {
    brecha.innerHTML += '<p>No se pudo calcular la brecha USDT vs AL30 24h. Datos insuficientes.</p>';
  }
}


// Llamar a `cargarDatos` cada 1 segundo
setInterval(cargarDatos, 1000);

// Cargar datos inicialmente
cargarDatos();
