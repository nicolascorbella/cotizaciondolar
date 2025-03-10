const apiUrl = 'https://criptoya.com/api/dolar';
const binanceP2PUrl = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
const container = document.getElementById('container');
const brecha = document.getElementById('brecha');
const eliminados = new Set(); // Almacena los identificadores de cajas eliminadas
let isHovering = false; // Flag para evitar conflictos con hover

// Función para obtener el precio del dólar cripto desde Binance P2P
async function obtenerDolarCripto() {
  try {
    const respuesta = await fetch(binanceP2PUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: 'USDT',
        fiat: 'ARS',
        tradeType: 'SELL', // Venta de USDT
        payTypes: [], // Puedes agregar métodos de pago específicos
        page: 1,
        rows: 1, // Solo queremos la mejor oferta
        publisherType: null
      })
    });

    const data = await respuesta.json();

    if (data && data.data.length > 0) {
      return parseFloat(data.data[0].adv.price); // Devuelve el precio de venta del USDT en ARS
    } else {
      console.warn('No se encontraron ofertas de venta de USDT en Binance P2P.');
      return null;
    }

  } catch (error) {
    console.error('Error al obtener el precio de venta de USDT en Binance P2P:', error);
    return null;
  }
}

// Función para cargar los datos
async function cargarDatos() {
  if (isHovering) return; // Evita actualizar mientras se está en hover

  try {
    const [datos, dolarCripto] = await Promise.all([
      fetch(apiUrl).then(res => res.json()),
      obtenerDolarCripto(), // Obtiene el precio de venta desde Binance P2P
    ]);

    // Sobrescribir el valor del dólar cripto con el de Binance P2P
    if (dolarCripto) {
      datos.cripto = { usdt: { ask: dolarCripto } };
    }

    container.innerHTML = ''; // Limpiar el contenido previo antes de actualizar
    mostrarDatos(datos);
    calcularBrecha(datos); // Calcular y mostrar la brecha

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
  const timestamp = datos?.timestamp
    ? new Date(datos.timestamp * 1000).toLocaleString()
    : 'N/A';

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

// Función para calcular y mostrar la brecha
function calcularBrecha(datos) {
  const usdt = datos.cripto?.usdt?.ask || null;
  const al30ci = datos.mep?.al30?.ci?.price || null;
  const al3024hs = datos.mep?.al30?.["24hs"]?.price || null;

  brecha.innerHTML = '';

  if (usdt && al30ci) {
    const brechaPorcentaje = ((usdt - al30ci) / al30ci) * 100;
    brecha.innerHTML += `https://github.com/nicolascorbella/cotizaciondolar/blob/main/script.js
      <div class="cajabrecha">
        <h2>Brecha USDT vs AL30CI</h2>
        <p><strong>USDT (Venta):</strong> ${usdt.toFixed(2)}</p>
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
        <p><strong>USDT (Venta):</strong> ${usdt.toFixed(2)}</p>
        <p><strong>AL30 24h:</strong> ${al3024hs.toFixed(2)}</p>
        <p><strong>Brecha:</strong> ${brechaPorcentaje.toFixed(2)}%</p>
      </div>
    `;
  } else {
    brecha.innerHTML += '<p>No se pudo calcular la brecha USDT vs AL30 24h. Datos insuficientes.</p>';
  }
}

// Llamar a cargarDatos cada 1 segundo
setInterval(cargarDatos, 1000);

// Cargar datos inicialmente
cargarDatos();
