const apiUrl = 'https://criptoya.com/api/dolar';
const container = document.getElementById('container');

// Función para cargar los datos
function cargarDatos() {
  fetch(apiUrl)
    .then(respuesta => respuesta.json())
    .then(data => {
      container.innerHTML = ''; // Limpiar el contenido previo antes de actualizar
      mostrarDatos(data);
    })
    .catch(error => {
      console.error('Error al cargar la API:', error);
      container.innerHTML = '<p>Error al cargar los datos. Intente nuevamente más tarde.</p>';
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

// Llamar a `cargarDatos` cada 1 segundo
setInterval(cargarDatos, 1000);

// Cargar datos inicialmente
cargarDatos();
