import urllib.request
import re
import json
import time

SUBFOLDERS = {
    "antropologia": "1CXGAFK-toWZKT8nP21Wm0_lGPMZtiYmR",
    "brujeria": "1-dpROlshkrDyqe2Rn1LnS7jvLpGFtC-6",
    "clasicos": "1Dj0FQdXUTLy5j7HaCjKkw3XgHQ65qdii",
    "cuentos cortos y poesias": "1xL4_srygDFhFKd1sMBxWFvEvZ3sF82ls",
    "el nombre del viento": "1Gd91BxQRCsOhynUVnSdLhK4ezJwM23Dg",
    "electro": "162CwBqB5flZUbU1ok-8y-vVf6HevQ0wV",
    "eroticos": "1LfGlvHDhZB1PigZks7zGmpqelf4ji7UZ",
    "feminismo": "1EdAWa8pgJ1yfh0jQBTWkKhFFMrBiD54b",
    "filosofia": "1U_kXVakAajS80K9gezWXQ0UbFxdSjeYT",
    "Historia": "1EWZsha7Sf0Bnlh2OaCcSqPIOTOv_X3Ey",
    "italiano": "1snW2di25KTtf9k4Ayu6uDi5ksaKfXVuH",
    "japones": "13SXL8fAOMqCoIpKoKXYHsHICmtLjwzJP",
    "Juego de Tronos": "1EsfG_I418NncCMg0qEsS-ux5LwPrhu4U",
    "just novela": "1VF5EFYZQoSug0JOdlG-G_IdjgVRVqDo7",
    "las cronicas de narnia": "1QSb-gy6R0xDd5uKyvdjbaqTyVXzuwxKi",
    "las tejedoras de destinos": "1oOp3wTecTaZ3S4ABrj6uTxtD6j8v_nds",
    "lgbt books": "1sJX0cKzG76cJz8Z_-8sCNsdDnHCSA_ID",
    "literatura adolecentes": "121MJ03FQaCHwZMzuVJ4DEcuYe92K-y6Z",
    "literatura latinoamericana": "10qjdpq9NZ-5DyPJ8azOCAqW_kuiGJji1",
    "marcel schwob": "1PvIY_Xm4QJxFgsbM-q240ZqCHezuteiS",
    "portugues": "1o8ZlXYXY5OZZUjSdJgL2t9NruNdg__TK",
    "psicologia": "114jlaZitlJ29H9RwzzwqFt2PMhQ7vG8C",
    "saga mujeres ocultas stella": "1DHRBOhcmBDX-mgwLA6Wj3gUIc-ftPdQ-",
    "terror, suspenso, thriller, policiales, etc": "1RNy3VUdh0A93mFqFLt7QiTL0GcpqoKtX"
}

CATEGORY_METADATA = {
    "antropologia": {"name": "Antropología & Culturas", "icon": "🗿"},
    "brujeria": {"name": "Brujería & Ocultismo", "icon": "🔮"},
    "clasicos": {"name": "Clásicos Universales", "icon": "☕"},
    "cuentos cortos y poesias": {"name": "Cuentos Cortos & Poesías", "icon": "🍓"},
    "el nombre del viento": {"name": "El Nombre del Viento (Patrick Rothfuss)", "icon": "🍃"},
    "electro": {"name": "Electrónica & Técnica", "icon": "⚡"},
    "eroticos": {"name": "Novela Erótica & Romance", "icon": "🌹"},
    "feminismo": {"name": "Feminismo & Sociedad", "icon": "💜"},
    "filosofia": {"name": "Filosofía & Pensamiento", "icon": "🏛️"},
    "Historia": {"name": "Historia Universal", "icon": "📜"},
    "italiano": {"name": "Biblioteca en Italiano", "icon": "🇮🇹"},
    "japones": {"name": "Literatura & Cultura Japonesa", "icon": "⛩️"},
    "Juego de Tronos": {"name": "Canción de Hielo y Fuego / Juego de Tronos", "icon": "🐉"},
    "just novela": {"name": "Novelas & Narrativa", "icon": "📖"},
    "las cronicas de narnia": {"name": "Las Crónicas de Narnia (C.S. Lewis)", "icon": "🦁"},
    "las tejedoras de destinos": {"name": "Las Tejedoras de Destinos", "icon": "🧵"},
    "lgbt books": {"name": "Literatura Diversa & LGBT", "icon": "🌈"},
    "literatura adolecentes": {"name": "Literatura Juvenil & YA", "icon": "✨"},
    "literatura latinoamericana": {"name": "Literatura Latinoamericana", "icon": "🌎"},
    "marcel schwob": {"name": "Marcel Schwob & Simbolismo", "icon": "🕯️"},
    "portugues": {"name": "Biblioteca em Português", "icon": "🇵🇹"},
    "psicologia": {"name": "Psicología & Mente", "icon": "🧠"},
    "saga mujeres ocultas stella": {"name": "Saga Mujeres Ocultas", "icon": "👑"},
    "terror, suspenso, thriller, policiales, etc": {"name": "Terror, Suspenso & Policiales", "icon": "🦇"}
}

PALETTE = ["color-red", "color-pink", "color-mint", "color-cream", "color-burgundy", "color-navy", "color-gold", "color-forest"]
PATTERNS = ["", "pattern-stripes", "pattern-dots", "pattern-ribbon"]
HEIGHTS = ["short", "medium", "tall"]
TILTS = ["", "", "", "tilted-left", "tilted-right"]
ICONS = ["🍓", "🌿", "📖", "✨", "📜", "⭐", "☕", "🍂", "🕊️"]

def clean_book_title(filename):
    # Remove extension
    title = re.sub(r'\.(pdf|epub|mobi|doc|docx|txt)$', '', filename, flags=re.IGNORECASE)
    # Clean underscores and common formatting
    title = title.replace('_', ' ').replace('-', ' ').strip()
    # Normalize multiple spaces
    title = re.sub(r'\s+', ' ', title)
    return title

catalog = {
    "nombre": "Gran Biblioteca de Luz (Google Drive)",
    "driveUrl": "https://drive.google.com/drive/folders/1M4rZbtBV-aKu2NgnFUpkL4TZzbxAFqz3",
    "driveFolderId": "1M4rZbtBV-aKu2NgnFUpkL4TZzbxAFqz3",
    "ultimaActualizacion": time.strftime("%Y-%m-%d %H:%M:%S"),
    "categorias": []
}

total_books_found = 0

for cat_key, folder_id in SUBFOLDERS.items():
    meta = CATEGORY_METADATA.get(cat_key, {"name": cat_key.capitalize(), "icon": "📚"})
    print(f"Fetching {meta['name']} ({folder_id})...")
    
    url = f"https://drive.google.com/drive/folders/{folder_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    
    books = []
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            
            # Find aria-label="... (PDF|EPUB...)" ... data-id="..."
            items = re.findall(r'aria-label="([^"]+\.(?:pdf|epub|doc|docx|mobi|txt)[^"]*)"[\s\S]{1,700}?data-id="([a-zA-Z0-9_-]{25,45})"', html)
            
            # Deduplicate by file ID
            seen_ids = set()
            for label, fid in items:
                if fid in seen_ids or fid == folder_id:
                    continue
                seen_ids.add(fid)
                
                clean_name = re.sub(r'\s+(PDF|EPUB|DOCX|DOC|TXT)\s+Shared.*$', '', label, flags=re.IGNORECASE).strip()
                title = clean_book_title(clean_name)
                
                seed = (len(catalog["categorias"]) * 19 + len(books) * 11)
                color = PALETTE[seed % len(PALETTE)]
                height = HEIGHTS[seed % len(HEIGHTS)]
                pattern = PATTERNS[(seed + 1) % len(PATTERNS)]
                tilt = TILTS[(seed + 2) % len(TILTS)]
                icon = ICONS[seed % len(ICONS)] if (seed % 3 == 0) else ""
                
                books.append({
                    "id": fid,
                    "titulo": title,
                    "nombreArchivo": clean_name,
                    "autor": meta["name"],
                    "color": color,
                    "altura": height,
                    "patron": pattern,
                    "inclinacion": tilt,
                    "icono": icon,
                    "tipo": "drive-pdf",
                    "urlVistaPrevia": f"https://drive.google.com/file/d/{fid}/preview",
                    "urlDirecta": f"https://drive.google.com/uc?id={fid}&export=download",
                    "urlDrive": f"https://drive.google.com/file/d/{fid}/view"
                })
        
        print(f"  -> {len(books)} libros encontrados")
    except Exception as e:
        print(f"  -> Error: {e}")
    
    total_books_found += len(books)
    catalog["categorias"].append({
        "id": f"drive-cat-{cat_key.replace(' ', '-').lower()}",
        "driveFolderId": folder_id,
        "nombre": meta["name"],
        "icono": meta["icon"],
        "descripcion": f"{len(books)} libros disponibles en Google Drive.",
        "libros": books
    })

print(f"\nTotal Categorías: {len(catalog['categorias'])}, Total Libros: {total_books_found}")

# Write to drive_catalog.json
with open("drive_catalog.json", "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print("Saved drive_catalog.json successfully!")
