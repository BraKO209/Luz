/**
 * ====================================================================
 * SCRIPT PARA CONECTAR TU GOOGLE DRIVE CON LA BIBLIOTECA
 * ====================================================================
 * 
 * INSTRUCCIONES RÁPIDAS (Toma menos de 2 minutos):
 * 1. Ve a https://script.google.com e inicia sesión con tu cuenta de Google.
 * 2. Haz clic en "Nuevo proyecto" (arriba a la izquierda).
 * 3. Borra todo el código que aparezca y pega TODO este archivo.
 * 4. Cambia el valor de CARPETA_RAIZ_ID por el ID de tu carpeta principal de Drive.
 *    (El ID es la serie de letras y números que aparece en la URL de tu carpeta de Drive:
 *     drive.google.com/drive/folders/ESTE_ES_EL_ID_DE_TU_CARPETA)
 * 5. Haz clic en "Implementar" (botón azul arriba a la derecha) -> "Nueva implementación".
 * 6. En el engranaje ⚙️ selecciona "Aplicación web".
 * 7. Configura:
 *    - Descripción: "API Biblioteca"
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 8. Haz clic en "Implementar", autoriza los permisos requeridos.
 * 9. Copia la "URL de la aplicación web" (termina en /exec) y pégala en el panel de configuración de tu Biblioteca.
 */

// ID DE TU CARPETA PRINCIPAL EN GOOGLE DRIVE
const CARPETA_RAIZ_ID = "1M4rZbtBV-aKu2NgnFUpkL4TZzbxAFqz3";

function doGet(e) {
  try {
    const folderId = (e && e.parameter && e.parameter.folderId) ? e.parameter.folderId : CARPETA_RAIZ_ID;
    
    if (!folderId || folderId === "COLOCA_AQUI_EL_ID_DE_TU_CARPETA") {
      return respuestaJson({
        status: "error",
        message: "No se ha configurado un ID de carpeta válido en el script."
      });
    }

    const carpetaPrincipal = DriveApp.getFolderById(folderId);
    const categorias = [];
    
    // 1. Obtener subcarpetas (cada subcarpeta será una Categoría o Género)
    const subcarpetas = carpetaPrincipal.getFolders();
    while (subcarpetas.hasNext()) {
      const subcarpeta = subcarpetas.next();
      const nombreCategoria = subcarpeta.getName();
      const categoriaId = subcarpeta.getId();
      
      const libros = obtenerLibrosDeCarpeta(subcarpeta);
      
      categorias.push({
        id: categoriaId,
        nombre: nombreCategoria,
        totalLibros: libros.length,
        libros: libros
      });
    }
    
    // 2. También incluir libros que estén sueltos en la carpeta raíz (General / Varios)
    const librosSueltos = obtenerLibrosDeCarpeta(carpetaPrincipal);
    if (librosSueltos.length > 0) {
      categorias.unshift({
        id: "general",
        nombre: "Colección General",
        totalLibros: librosSueltos.length,
        libros: librosSueltos
      });
    }

    return respuestaJson({
      status: "success",
      bibliotecaNombre: carpetaPrincipal.getName(),
      totalCategorias: categorias.length,
      categorias: categorias
    });

  } catch (error) {
    return respuestaJson({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Función auxiliar para leer los archivos de una carpeta (incluyendo subcarpetas como autores)
 */
function obtenerLibrosDeCarpeta(carpeta, prefijoRuta) {
  let libros = [];
  prefijoRuta = prefijoRuta || "";
  
  // 1. Obtener archivos directos de esta carpeta
  const archivos = carpeta.getFiles();
  while (archivos.hasNext()) {
    const archivo = archivos.next();
    const mime = archivo.getMimeType();
    const nombreCompleto = archivo.getName();
    
    // Filtrar solo formatos de lectura relevantes
    if (nombreCompleto.match(/\.(pdf|epub|mobi|doc|docx|txt)$/i)) {
      const fileId = archivo.getId();
      const tituloLimpio = nombreCompleto.replace(/\.(pdf|epub|doc|docx|txt|mobi)$/i, '');
      const tituloFinal = prefijoRuta ? (prefijoRuta + " - " + tituloLimpio) : tituloLimpio;
      
      libros.push({
        id: fileId,
        nombreArchivo: nombreCompleto,
        titulo: tituloFinal,
        tipo: mime,
        tamanoBytes: archivo.getSize(),
        urlVistaPrevia: "https://drive.google.com/file/d/" + fileId + "/preview",
        urlDirecta: "https://drive.google.com/uc?id=" + fileId + "&export=download",
        urlDrive: "https://drive.google.com/file/d/" + fileId + "/view"
      });
    }
  }

  // 2. Si la carpeta tiene subcarpetas (ej. autores dentro de Clásicos), leerlas recursivamente
  const subcarpetas = carpeta.getFolders();
  while (subcarpetas.hasNext()) {
    const sub = subcarpetas.next();
    const nombreSub = sub.getName();
    const librosSub = obtenerLibrosDeCarpeta(sub, nombreSub);
    libros = libros.concat(librosSub);
  }
  
  // Ordenar alfabéticamente por título
  libros.sort(function(a, b) {
    return a.titulo.localeCompare(b.titulo);
  });
  
  return libros;
}

function respuestaJson(datos) {
  return ContentService.createTextOutput(JSON.stringify(datos))
    .setMimeType(ContentService.MimeType.JSON);
}
