// --- Variables globales ---
let _escudoActivo = {};
let _numAsignados = new Set();
let _tiraRankeada = "";
let ord = [];

// --- Al cargar la página ---
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosDesdeServidor();
    document.getElementById('btnEjecutar').addEventListener('click', ejecutarProcesoCompleto);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarTodo);
    document.getElementById('btnGrabar').addEventListener('click', guardarPrediccion);
    document.getElementById('cmbJuego').addEventListener('change', ejecutarProcesoCompleto);
    document.getElementById('btnCopiarVerde').addEventListener('click', () => copiarTexto('txtCombinaciones'));
    document.getElementById('btnCopiarRojo').addEventListener('click', () => copiarTexto('txtCombinacionesExcluidas'));
});

// --- Cargar datos desde el servidor ---
async function cargarDatosDesdeServidor() {
    try {
        const respuesta = await fetch('/api/consultar-numeros');
        if (!respuesta.ok) throw new Error('Error al cargar datos');
        const datos = await respuesta.json();
        llenarTabla(datos);
        if (datos.length > 0) ejecutarProcesoCompleto();
    } catch (error) {
        console.error(error);
        alert('No se pudo conectar con el servidor');
    }
}

function llenarTabla(datos) {
    const cuerpo = document.getElementById('cuerpoTabla');
    cuerpo.innerHTML = "";
    datos.forEach(fila => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${fila.Numero}</td><td>${fila.Pais || ''}</td><td>${fila.Fecha || ''}</td><td>${fila.Hora || ''}</td>`;
        cuerpo.appendChild(tr);
    });
}

// --- Procesar frecuencias ---
function procesarEscudo() {
    _escudoActivo = {};
    for (let n = 0; n <= 99; n++) _escudoActivo[n] = 0;

    const filas = document.querySelectorAll('#cuerpoTabla tr');
    const limite = Math.min(150, filas.length);
    for (let i = 0; i < limite; i++) {
        const num = parseInt(filas[i].cells[0].textContent);
        if (!isNaN(num) && num >= 0 && num <= 99) _escudoActivo[num]++;
    }
}

// --- Obtener dígito único ---
function obtenerUnico(n) {
    let res = n % 10;
    let intentos = 0;
    while (_numAsignados.has(res) && intentos < 10) {
        res = (res + 1) % 10;
        intentos++;
    }
    _numAsignados.add(res);
    return res;
}

// --- Descomponer fecha y llenar la cruz ---
function descomponerFecha() {
    _numAsignados.clear();
    const fecha = new Date(document.getElementById('fechaBase').value);
    const d = fecha.getDate();
    const m = fecha.getMonth() + 1;
    const a = fecha.getFullYear();

    const ii = obtenerUnico(d);
    const id = obtenerUnico(m);
    const iff = obtenerUnico(a % 100);
    const is = obtenerUnico(m + a);

    document.getElementById('txtInternoIzquierdo').value = ii;
    document.getElementById('txtInternoDerecho').value = id;
    document.getElementById('txtInternoInferior').value = iff;
    document.getElementById('txtInternoSuperior').value = is;

    document.getElementById('txtSuperiorDerecha').value = obtenerUnico(iff + ii);
    document.getElementById('txtInferiorDerecha').value = obtenerUnico(is + id);
    document.getElementById('txtInferiorIzquierda').value = obtenerUnico(is + iff);
    document.getElementById('txtSuperiorIzquierda').value = obtenerUnico(id + ii);
}

// --- Generar combinaciones ---
function generarCombinaciones() {
    const sI = parseInt(document.getElementById('txtSuperiorIzquierda').value) || 0;
    const sD = parseInt(document.getElementById('txtSuperiorDerecha').value) || 0;
    const iI = parseInt(document.getElementById('txtInferiorIzquierda').value) || 0;
    const iD = parseInt(document.getElementById('txtInferiorDerecha').value) || 0;
    const nI = parseInt(document.getElementById('txtInternoIzquierdo').value) || 0;
    const nD = parseInt(document.getElementById('txtInternoDerecho').value) || 0;
    const nS = parseInt(document.getElementById('txtInternoSuperior').value) || 0;
    const nF = parseInt(document.getElementById('txtInternoInferior').value) || 0;

    const internos = [nI, nD, nS, nF];
    const esquinas = [sI, sD, iI, iD];

    const diagonales = [`${sI}${iD}`, `${iI}${sD}`];
    document.getElementById('txtEsquinasYDiagonales').value = [...new Set(diagonales)].join(', ');

    const combInt = [];
    internos.forEach(a => internos.forEach(b => { if (a !== b) combInt.push(`${a}${b}`); }));
    document.getElementById('txtCombinacionesInternas').value = [...new Set(combInt)].sort().join(', ');

    const cantidad = parseInt(document.getElementById('cmbJuego').value.replace(/\D/g, ''));

    const ultimoSorteo = {};
    for (let n = 0; n <= 99; n++) ultimoSorteo[n] = 9999;
    document.querySelectorAll('#cuerpoTabla tr').forEach((fila, idx) => {
        const num = parseInt(fila.cells[0].textContent);
        if (!isNaN(num) && ultimoSorteo[num] === 9999) ultimoSorteo[num] = idx + 1;
    });

    ord = [];
    for (let n = 0; n <= 99; n++) {
        const sn = n.toString().padStart(2, '0');
        const d1 = parseInt(sn[0]), d2 = parseInt(sn[1]);
        let pts = 0;
        if (_escudoActivo[n] > 0) pts += 10000 / ultimoSorteo[n];
        pts += _escudoActivo[n] * 100;
        if (internos.includes(d1) || internos.includes(d2)) pts += 100;
        if (esquinas.includes(d1) || esquinas.includes(d2)) pts += 50;
        pts -= ultimoSorteo[n] * 0.0001;
        ord.push({ num: sn, puntos: pts });
    }

    ord.sort((a, b) => b.puntos - a.puntos || a.num.localeCompare(b.num));

    const listaVerde = ord.slice(0, cantidad).map(x => x.num).sort();
    const listaRoja = ord.slice(cantidad).map(x => x.num).sort();

    document.getElementById('txtCombinaciones').value = `(${cantidad}) = ${listaVerde.join(', ')}`;
    document.getElementById('txtCombinacionesExcluidas').value = `(${100 - cantidad}) = ${listaRoja.join(', ')}`;

    _tiraRankeada = ord.map(x => x.num).join(', ');
    document.getElementById('txtCombinaListados').value = _tiraRankeada;

    if (document.querySelector('#cuerpoTabla tr')) {
        document.getElementById('lblAncla').textContent = `Ancla: (${document.querySelector('#cuerpoTabla tr').cells[0].textContent})`;
    }
}

// --- Ejecutar todo el proceso ---
function ejecutarProcesoCompleto() {
    procesarEscudo();
    descomponerFecha();
    generarCombinaciones();
}

// --- Limpiar campos ---
function limpiarTodo() {
    document.querySelectorAll('.caja-texto').forEach(el => el.value = '');
    document.getElementById('txtEsquinasYDiagonales').value = '';
    document.getElementById('txtCombinacionesInternas').value = '';
    document.getElementById('txtCombinaciones').value = '';
    document.getElementById('txtCombinacionesExcluidas').value = '';
    document.getElementById('txtCombinaListados').value = '';
    document.getElementById('lblAncla').textContent = 'Ancla: --';
}

// --- Copiar texto ---
function copiarTexto(id) {
    const texto = document.getElementById(id).value;
    navigator.clipboard.writeText(texto)
        .then(() => alert('Copiado al portapapeles'))
        .catch(() => alert('No se pudo copiar'));
}

// --- Guardar predicción en Azure ---
async function guardarPrediccion() {
    try {
        const datos = {
            fecha: document.getElementById('fechaBase').value,
            idPais: 1,
            idHora: 1,
            tira: _tiraRankeada,
            juego: document.getElementById('cmbJuego').value
        };
        const respuesta = await fetch('/api/grabar-prediccion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
        alert(resultado.ok ? 'Guardado correctamente' : 'Error: ' + resultado.error);
    } catch (error) {
        console.error(error);
        alert('No se pudo guardar');
    }
}
