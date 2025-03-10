const apiUrl = 'https://criptoya.com/api/dolar';
const binanceUrl = 'https://api.binance.com/api/v3/ticker/price?symbol=USDTARS';
const container = document.getElementById('container');
const brecha = document.getElementById('brecha');
const eliminados = new Set(); // Almacena los identificadores de cajas eliminadas
let isHovering = false; // Flag para evitar conflictos con hover

// Función para obtener el precio de venta del dólar cripto desde Binance
async function obtenerDolarCripto() {
  try {
    const respuesta = await fetch(binanceUrl);
    const data = await respuesta.json();
    return parseFloat(data.price) || 'N/A';
  } catch (error) {
    console.error('Error al obtener datos de Binance:', error);
    return 'N/A';
  }
}

// Función para cargar los datos
async function cargarDatos() {
  if (isHovering) return; // Evita actualizar mientras se está en hover

  try {
    const respuesta = await fetch(apiUrl);
    const data = await respuesta.json();

    // Obtener el dólar cripto desde Binance
    data.cripto = data.cripto || {};
    data.cripto.usdt = data.cripto.usdt || {};
    data.cripto.usdt.ask = await obtenerDolarCripto();

    container.innerHTML = ''; // Limpiar el contenido previo antes de actualizar
    mostrarDatos(data);
    calcularBrecha(data); // Calcular y mostrar la brecha
  } catch (error) {
    console.error('Error al cargar la API:', error);
    container.innerHTML = '<p>Error al cargar los datos. Intente nuevamente más tarde.</p>';
    brecha.innerHTML = '<p>Error al calcular la brecha.</p>';
  }
}

// Función para mostrar los datos en cajas
function mostrarDatos(datos) {
  for (const tipo in datos) {
    if (tipo === 'cripto' || tipo === 'mep' || tipo === 'ccl') {
      for (const subTipo in datos[tipo]) {
        const subDatos = datos[tipo][subTipo];

        if (typeof subDatos === 'object' && subDatos['24hs'] && subDatos['ci']) {
          for (const tiempo in subDatos) {
            const tiempoDatos = subDatos[tiempo];
            const idCaja = `${tipo}-${subTipo}-${tiempo}`;
            if (!eliminados.has(idCaja)) {
              const caja = crearCaja(`${tipo.toUpperCase()} - ${subTipo.toUpperCase()} (${tiempo})`, tiempoDatos, idCaja);
              container.appendChild(caja);
            }
          }
        } else {
          const idCaja = `${tipo}-${subTipo}`;
          if (!eliminados.has(idCaja)) {
            const caja = crearCaja(`${tipo.toUpperCase()} - ${subTipo.toUpperCase()}`, subDatos, idCaja);
            container.appendChild(caja);
          }
        }
      }
    } else {
      const idCaja = `${tipo}`;
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
  const timestamp = datos?.timestamp ? new Date(datos.timestamp * 1000).toLocaleString() : 'N/A';

  const caja = document.createElement('div');
  caja.className = 'caja';
  caja.dataset.id = idCaja;

  caja.innerHTML = `
    <button class="cerrar" title="Eliminar esta caja">X</button>
    <h2>${titulo}</h2>
    <p><strong>Compra:</strong> ${valorCompra}</p>
    <p><strong>Venta:</strong> ${valorVenta}</p>
    <p><strong>Variación:</strong> ${variacion}%</p>
    <p><strong>Última actualización:</strong> ${timestamp}</p>
  `;

  const botonCerrar = caja.querySelector('.cerrar');
  botonCerrar.addEventListener('click', () => {
    eliminados.add(idCaja);
    caja.remove();
  });

  caja.addEventListener('mouseenter', () => isHovering = true);
  caja.addEventListener('mouseleave', () => isHovering = false);

  return caja;
}

// Llamar a `cargarDatos` cada 1 segundo
setInterval(cargarDatos, 1000);

// Cargar datos inicialmente
cargarDatos();
