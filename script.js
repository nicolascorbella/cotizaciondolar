const apiUrl = 'https://criptoya.com/api/dolar';
const binanceP2PUrl = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
const container = document.getElementById('container');
const brecha = document.getElementById('brecha');
const eliminados = new Set(); // Almacena los identificadores de cajas eliminadas
let isHovering = false; // Flag para evitar conflictos con hover
let dolarCripto = null; // Variable global para almacenar el valor del dólar cripto

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
        tradeType: 'SELL',
        payTypes: [],
        page: 1,
        rows: 1,
        publisherType: null
      })
    });

    const data = await respuesta.json();

    if (data && data.data.length > 0) {
      dolarCripto = parseFloat(data.data[0].adv.price);
    } else {
      console.warn('No se encontraron ofertas de venta de USDT en Binance P2P.');
      dolarCripto = null;
    }
  } catch (error) {
    console.error('Error al obtener el precio de venta de USDT en Binance P2P:', error);
    dolarCripto = null;
  }
}

// Función para cargar los datos
async function cargarDatos() {
  if (isHovering) return; // Evita actualizar mientras se está en hover

  try {
    const datos = await fetch(apiUrl).then(res => res.json());
    
    if (dolarCripto) {
      datos.cripto = { usdt: { ask: dolarCripto } };
    }

    container.innerHTML = ''; // Limpiar contenido antes de actualizar
    mostrarDatos(datos);
    calcularBrecha(datos);
  } catch (error) {
    console.error('Error al cargar la API:', error);
    container.innerHTML = '<p>Error al cargar los datos. Intente nuevamente más tarde.</p>';
    brecha.innerHTML = '<p>Error al calcular la brecha.</p>';
  }
}

// Función para mostrar los datos en tarjetas
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

// Función para crear una tarjeta de datos
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
  const al3024hs = datos.mep?.al30?.["24hs"]?.price || null; // Tomar el precio de AL30 hace 24 horas

  brecha.innerHTML = '';

  if (usdt && al3024hs) {
    const brechaPorcentaje = ((usdt - al3024hs) / al3024hs) * 100;
    brecha.innerHTML += `
      <div class="cajabrecha">
        <h2>Brecha USDT vs AL30 (24h)</h2>
        <p><strong>USDT (Venta):</strong> <span style="color:green;">${usdt.toFixed(2)}</span></p>
        <p><strong>AL30 (24h):</strong> <span style="color:red;">${al3024hs.toFixed(2)}</span></p>
        <p><strong>Brecha:</strong> ${brechaPorcentaje.toFixed(2)}%</p>
      </div>
    `;
  }
}


// Actualizar el valor del dólar cripto cada 5 segundos
setInterval(obtenerDolarCripto, 5000);
// Cargar los datos cada 1 segundo
setInterval(cargarDatos, 1000);

// Cargar datos inicialmente
obtenerDolarCripto();
cargarDatos();
