/* --- LÓGICA DE LA HOJA DE PAPEL --- */
function openPaper(mensaje) {
    const modal = document.getElementById('paper-modal');
    const paperText = document.getElementById('paper-text');
    
    paperText.innerText = mensaje;
    modal.style.display = 'flex'; 
}

function closePaper() {
    const modal = document.getElementById('paper-modal');
    modal.style.display = 'none';
}

/* --- LÓGICA DE LA MÚSICA --- */
const audio = document.getElementById('bg-music');
const playBtn = document.getElementById('play-btn');

// Reproducir o pausar la música actual
function toggleMusic() {
    if (audio.paused) {
        audio.play();
        playBtn.innerText = "⏸ Pausar";
    } else {
        audio.pause();
        playBtn.innerText = "🎵 Reproducir";
    }
}

// Abrir el menú desplegable para cambiar pista
function toggleMenu() {
    document.getElementById("song-list").classList.toggle("show");
}

// Cambiar la canción, reproducirla automáticamente y cerrar el menú
function changeSong(src) {
    audio.src = src;
    audio.play();
    playBtn.innerText = "⏸ Pausar";
    document.getElementById("song-list").classList.remove("show");
}

// Cerrar ventanas si se hace clic afuera (tanto el papel como el menú de música)
window.onclick = function(event) {
    // Cerrar el modal del papel
    const modal = document.getElementById('paper-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }

    // Cerrar el menú desplegable de música
    if (!event.target.matches('.dropbtn')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}