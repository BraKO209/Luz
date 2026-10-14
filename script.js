/**
 * script.js - Lógica interactiva de la Gran Biblioteca de Luz
 * Maneja navegación entre libreros, renderizado físico de libros,
 * reproductor de música lofi, lector de documentos y sincronización con Drive.
 */

// Estado global de la aplicación
let estadoApp = {
    catalogo: null,
    vistaActual: 'categorias', // 'categorias' | 'categoria-detalle' | 'busqueda'
    categoriaActivaId: null,
    filtroBusqueda: ''
};

/* --- SONIDOS AMBIENTALES COZY (Sintetizador Web Audio API) --- */
const SonidosBiblioteca = {
    ctx: null,
    iniciar: function() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
    },
    // Sonido suave de libro de madera al sacarlo de la repisa
    libroSacado: function() {
        try {
            this.iniciar();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.13);
        } catch(e) {}
    },
    // Sonido suave de pasar hoja de papel
    pasarHoja: function() {
        try {
            this.iniciar();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(580, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.09);
        } catch(e) {}
    }
};

/* --- INICIALIZACIÓN --- */
document.addEventListener('DOMContentLoaded', () => {
    // Cargar catálogo guardado o por defecto
    estadoApp.catalogo = BibliotecaManager.obtenerCatalogo();
    
    // Configurar estado del badge de Google Drive
    actualizarIndicadorDrive();

    // Renderizar la vista inicial
    renderizarBiblioteca();

    // Configurar buscador en vivo
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            estadoApp.filtroBusqueda = query;
            if (query.length > 0) {
                estadoApp.vistaActual = 'busqueda';
            } else {
                estadoApp.vistaActual = 'categorias';
            }
            renderizarBiblioteca();
        });
    }

    // Configurar input de carpeta local
    const localFolderInput = document.getElementById('local-folder-input');
    if (localFolderInput) {
        localFolderInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                try {
                    mostrarMensajeCarga("Importando libros de tu carpeta local...");
                    const nuevoCatalogo = await BibliotecaManager.importarCarpetaLocal(e.target.files);
                    estadoApp.catalogo = nuevoCatalogo;
                    estadoApp.vistaActual = 'categorias';
                    renderizarBiblioteca();
                    alert(`¡Éxito! Se han importado ${nuevoCatalogo.categorias.length} categorías de libros.`);
                } catch (err) {
                    alert("Error al importar carpeta: " + err.message);
                } finally {
                    ocultarMensajeCarga();
                }
            }
        });
    }
});

/* --- RENDERIZADO PRINCIPAL DE LA BIBLIOTECA --- */
function renderizarBiblioteca() {
    const contenedor = document.getElementById('library-shelves-container');
    const navBar = document.getElementById('category-nav-bar');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    // Vista 1: Menú General de Categorías
    if (estadoApp.vistaActual === 'categorias') {
        if (navBar) navBar.style.display = 'none';

        if (!estadoApp.catalogo.categorias || estadoApp.catalogo.categorias.length === 0) {
            contenedor.innerHTML = '<div class="empty-shelf-message">No hay categorías cargadas en el librero.</div>';
            return;
        }

        estadoApp.catalogo.categorias.forEach((categoria) => {
            const seccion = document.createElement('div');
            seccion.className = 'category-shelf-section';

            // 1. Placa de latón tallada con nombre y total de libros
            const placa = document.createElement('div');
            placa.className = 'brass-placard';
            placa.onclick = () => navegarACategoria(categoria.id);
            placa.innerHTML = `
                <span>${categoria.icono || '🍓'} ${categoria.nombre}</span>
                <span class="brass-placard-count">${categoria.libros.length} libros</span>
                <span class="brass-placard-action">Explorar librero →</span>
            `;
            seccion.appendChild(placa);

            // 2. Estante con los libros de la categoría
            const estante = document.createElement('div');
            estante.className = 'shelf';

            // Sujetalibros izquierdo
            const bookendLeft = document.createElement('div');
            bookendLeft.className = 'bookend';
            estante.appendChild(bookendLeft);

            // Renderizar libros en este estante (muestra hasta 12 o todos si caben)
            const librosAMostrar = categoria.libros.slice(0, 14);
            librosAMostrar.forEach((libro) => {
                const libroEl = crearElementoLibro(libro, categoria);
                estante.appendChild(libroEl);
            });

            // Sujetalibros derecho
            const bookendRight = document.createElement('div');
            bookendRight.className = 'bookend';
            estante.appendChild(bookendRight);

            seccion.appendChild(estante);
            contenedor.appendChild(seccion);
        });
    } 
    // Vista 2: Librero Específico de una Categoría (Con todos sus libros distribuidos en varios estantes)
    else if (estadoApp.vistaActual === 'categoria-detalle') {
        const categoria = estadoApp.catalogo.categorias.find(c => c.id === estadoApp.categoriaActivaId);
        if (!categoria) {
            navegarACategorias();
            return;
        }

        // Configurar barra de navegación / breadcrumbs
        if (navBar) {
            navBar.style.display = 'flex';
            document.getElementById('breadcrumb-category-name').innerText = `${categoria.icono || '📚'} ${categoria.nombre}`;
            document.getElementById('breadcrumb-category-count').innerText = `${categoria.libros.length} libros`;
        }

        if (categoria.libros.length === 0) {
            contenedor.innerHTML = '<div class="empty-shelf-message">No hay libros en esta categoría actualmente.</div>';
            return;
        }

        // Distribuir libros en estantes de hasta 10 a 12 libros por repisa
        const librosPorEstante = 11;
        const totalEstantes = Math.ceil(categoria.libros.length / librosPorEstante);

        for (let i = 0; i < totalEstantes; i++) {
            const estante = document.createElement('div');
            estante.className = 'shelf';

            // Sujetalibros izquierdo
            const bookendLeft = document.createElement('div');
            bookendLeft.className = 'bookend';
            estante.appendChild(bookendLeft);

            const librosLote = categoria.libros.slice(i * librosPorEstante, (i + 1) * librosPorEstante);
            librosLote.forEach(libro => {
                const libroEl = crearElementoLibro(libro, categoria);
                estante.appendChild(libroEl);
            });

            // Sujetalibros derecho
            const bookendRight = document.createElement('div');
            bookendRight.className = 'bookend';
            estante.appendChild(bookendRight);

            contenedor.appendChild(estante);
        }
    }
    // Vista 3: Resultados de Búsqueda
    else if (estadoApp.vistaActual === 'busqueda') {
        if (navBar) {
            navBar.style.display = 'flex';
            document.getElementById('breadcrumb-category-name').innerText = `🔍 Búsqueda: "${estadoApp.filtroBusqueda}"`;
            document.getElementById('breadcrumb-category-count').innerText = `Filtrando`;
        }

        const librosEncontrados = [];
        estadoApp.catalogo.categorias.forEach(cat => {
            cat.libros.forEach(libro => {
                const coincideTitulo = libro.titulo.toLowerCase().includes(estadoApp.filtroBusqueda);
                const coincideAutor = libro.autor && libro.autor.toLowerCase().includes(estadoApp.filtroBusqueda);
                const coincideCat = cat.nombre.toLowerCase().includes(estadoApp.filtroBusqueda);
                if (coincideTitulo || coincideAutor || coincideCat) {
                    librosEncontrados.push({ libro, categoria: cat });
                }
            });
        });

        if (librosEncontrados.length === 0) {
            contenedor.innerHTML = `<div class="empty-shelf-message">No se encontraron libros que coincidan con "${estadoApp.filtroBusqueda}".</div>`;
            return;
        }

        const librosPorEstante = 11;
        const totalEstantes = Math.ceil(librosEncontrados.length / librosPorEstante);

        for (let i = 0; i < totalEstantes; i++) {
            const estante = document.createElement('div');
            estante.className = 'shelf';

            const bookendLeft = document.createElement('div');
            bookendLeft.className = 'bookend';
            estante.appendChild(bookendLeft);

            const lote = librosEncontrados.slice(i * librosPorEstante, (i + 1) * librosPorEstante);
            lote.forEach(item => {
                const libroEl = crearElementoLibro(item.libro, item.categoria);
                estante.appendChild(libroEl);
            });

            const bookendRight = document.createElement('div');
            bookendRight.className = 'bookend';
            estante.appendChild(bookendRight);

            contenedor.appendChild(estante);
        }
    }
}

/* --- CREAR ELEMENTO DOM DE CADA LIBRO FÍSICO --- */
function crearElementoLibro(libro, categoria) {
    const el = document.createElement('div');
    el.className = `book ${libro.color || 'color-red'} ${libro.altura || 'medium'} ${libro.patron || ''} ${libro.inclinacion || ''}`;
    
    // Icono superior si existe
    if (libro.icono) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'book-spine-icon';
        iconSpan.innerText = libro.icono;
        el.appendChild(iconSpan);
    }

    // Título grabado en el lomo
    const titleSpan = document.createElement('span');
    titleSpan.className = 'book-spine-title';
    titleSpan.innerText = libro.titulo;
    titleSpan.title = libro.titulo;
    el.appendChild(titleSpan);

    // Cinta marcapáginas colgante
    const ribbon = document.createElement('div');
    ribbon.className = 'book-ribbon';
    el.appendChild(ribbon);

    // Tooltip flotante al pasar el cursor
    const tooltip = document.createElement('div');
    tooltip.className = 'book-tooltip';
    tooltip.innerHTML = `<strong>${libro.titulo}</strong><br><small>${libro.autor || 'Desconocido'} • ${categoria.nombre}</small>`;
    el.appendChild(tooltip);

    // Evento de clic para abrir el libro
    el.onclick = (e) => {
        e.stopPropagation();
        abrirLibro(libro, categoria);
    };

    return el;
}

/* --- NAVEGACIÓN ENTRE VISTAS --- */
function navegarACategoria(categoriaId) {
    SonidosBiblioteca.pasarHoja();
    estadoApp.categoriaActivaId = categoriaId;
    estadoApp.vistaActual = 'categoria-detalle';
    estadoApp.filtroBusqueda = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    renderizarBiblioteca();
    window.scrollTo({ top: 120, behavior: 'smooth' });
}

function navegarACategorias() {
    SonidosBiblioteca.pasarHoja();
    estadoApp.vistaActual = 'categorias';
    estadoApp.categoriaActivaId = null;
    estadoApp.filtroBusqueda = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    renderizarBiblioteca();
}

/* --- ABRIR Y LEER UN LIBRO --- */
function abrirLibro(libro, categoria) {
    SonidosBiblioteca.libroSacado();

    // Caso 1: Es una nota o poema de texto
    if (libro.tipo === 'texto') {
        const modal = document.getElementById('paper-modal');
        const paperText = document.getElementById('paper-text');
        paperText.innerText = libro.contenidoTexto || libro.titulo;
        modal.style.display = 'flex';
    } 
    // Caso 2: Es un PDF, archivo de Google Drive o libro digital
    else {
        const readerModal = document.getElementById('reader-modal');
        const readerTitle = document.getElementById('reader-title');
        const readerAuthor = document.getElementById('reader-author');
        const readerIframe = document.getElementById('reader-iframe');
        const btnExternal = document.getElementById('reader-external-btn');

        readerTitle.innerText = libro.titulo;
        readerAuthor.innerText = `${libro.autor || 'Google Drive'} • ${categoria ? categoria.nombre : ''}`;
        
        // Asignar URL de vista previa (Google Drive preview, enlace directo o visor embebido)
        const urlVisualizacion = libro.urlVistaPrevia || libro.urlDrive || '';
        readerIframe.src = urlVisualizacion;

        // Botón para abrir en Google Drive en pestaña nueva
        if (btnExternal) {
            btnExternal.href = libro.urlDrive || libro.urlVistaPrevia || '#';
        }

        readerModal.style.display = 'flex';
    }
}

function closePaper() {
    document.getElementById('paper-modal').style.display = 'none';
}

function closeReader() {
    const readerModal = document.getElementById('reader-modal');
    const readerIframe = document.getElementById('reader-iframe');
    readerIframe.src = 'about:blank';
    readerModal.style.display = 'none';
}

/* --- PANTALLA COMPLETA PARA EL LECTOR --- */
function toggleFullScreenReader() {
    const container = document.querySelector('.reader-container');
    if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

/* --- MODAL DE CONFIGURACIÓN DE GOOGLE DRIVE --- */
function openDriveConfig() {
    const modal = document.getElementById('drive-config-modal');
    const config = BibliotecaManager.obtenerConfig();
    const inputUrl = document.getElementById('drive-script-url');
    if (inputUrl && config.scriptUrl) {
        inputUrl.value = config.scriptUrl;
    }
    modal.style.display = 'flex';
}

function closeDriveConfig() {
    document.getElementById('drive-config-modal').style.display = 'none';
}

async function sincronizarGoogleDrive() {
    const inputUrl = document.getElementById('drive-script-url');
    const statusMsg = document.getElementById('drive-status-msg');
    const url = inputUrl.value.trim();

    if (!url) {
        alert("Por favor introduce la URL del Google Apps Script.");
        return;
    }

    try {
        statusMsg.innerText = "⏳ Conectando con Google Drive y leyendo libros...";
        statusMsg.style.color = "#7A4C32";

        const nuevoCatalogo = await BibliotecaManager.sincronizarDesdeGoogleDrive(url);
        estadoApp.catalogo = nuevoCatalogo;
        estadoApp.vistaActual = 'categorias';
        renderizarBiblioteca();
        actualizarIndicadorDrive();

        statusMsg.innerText = `✅ ¡Sincronización exitosa! Se cargaron ${nuevoCatalogo.categorias.length} categorías.`;
        statusMsg.style.color = "#2D5A3C";

        setTimeout(() => {
            closeDriveConfig();
        }, 1500);

    } catch (err) {
        statusMsg.innerText = `❌ Error: ${err.message}`;
        statusMsg.style.color = "#D24C4A";
    }
}

function actualizarIndicadorDrive() {
    const config = BibliotecaManager.obtenerConfig();
    const badge = document.getElementById('drive-sync-badge');
    if (badge) {
        if (config.sincronizado) {
            badge.innerText = "🟢 Drive Conectado";
            badge.className = "status-badge status-connected";
        } else {
            badge.innerText = "🟡 Modo Local / Muestra";
            badge.className = "status-badge status-disconnected";
        }
    }
}

function restaurarLibreroOriginal() {
    if (confirm("¿Deseas restaurar la biblioteca a su estado original con poemas de muestra?")) {
        estadoApp.catalogo = BibliotecaManager.restaurarPorDefecto();
        estadoApp.vistaActual = 'categorias';
        renderizarBiblioteca();
        actualizarIndicadorDrive();
        closeDriveConfig();
    }
}

function mostrarMensajeCarga(msg) {
    console.log(msg);
}

function ocultarMensajeCarga() {}

/* --- LÓGICA DEL REPRODUCTOR DE MÚSICA (PRESERVADA Y OPTIMIZADA) --- */
const audio = document.getElementById('bg-music');
const playBtn = document.getElementById('play-btn');

function toggleMusic() {
    if (audio.paused) {
        audio.play().then(() => {
            playBtn.innerHTML = "⏸ Pausar Fresa";
        }).catch(e => {
            console.log("Interacción requerida para audio:", e);
        });
    } else {
        audio.pause();
        playBtn.innerHTML = "🎵 Música Lofi";
    }
}

function toggleMenu() {
    document.getElementById("song-list").classList.toggle("show");
}

function changeSong(src) {
    audio.src = src;
    audio.play();
    playBtn.innerHTML = "⏸ Pausar Fresa";
    document.getElementById("song-list").classList.remove("show");
}

/* --- CERRAR MODALES AL HACER CLIC AFUERA --- */
window.onclick = function(event) {
    const paperModal = document.getElementById('paper-modal');
    if (event.target === paperModal) {
        closePaper();
    }

    const readerModal = document.getElementById('reader-modal');
    if (event.target === readerModal) {
        closeReader();
    }

    const configModal = document.getElementById('drive-config-modal');
    if (event.target === configModal) {
        closeDriveConfig();
    }

    // Menú desplegable de música
    if (!event.target.matches('.dropbtn') && !event.target.closest('.dropdown')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show')) {
                dropdowns[i].classList.remove('show');
            }
        }
    }
};