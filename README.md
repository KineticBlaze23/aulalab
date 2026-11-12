# 🎓 AulaLab — Plataforma Personal y Privada de Estudio y Evaluación

**AulaLab** es una plataforma web modular, responsiva y elegante diseñada para gestionar materias universitarias, importar cuestionarios en formatos JSON/YAML generados mediante Inteligencia Artificial, y realizar evaluaciones interactivas con retroalimentación inmediata y explicaciones oficiales.

---

## 🚀 Arquitectura y Tecnologías

- **Frontend nativo modular**: `index.html`, `config.js`, `seed.js`, `app.js`.
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) con soporte completo para **Modo Oscuro** (`bg-slate-950`) y **Modo Claro**, persistido en `localStorage`.
- **Base de Datos & Autenticación en la Nube**: [Supabase](https://supabase.com/) (`@supabase/supabase-js` v2).
- **Parser de Cuestionarios**: [js-yaml](https://github.com/nodeca/js-yaml) para soporte simultáneo de JSON y YAML.
- **Efectos interactivos**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) al aprobar cuestionarios.

---

## 🛠️ Configuración Rápida

### 1. Ejecución Local Inmediata
Puedes abrir directamente el archivo `index.html` en cualquier navegador web moderno, o iniciar un servidor local:

```bash
# Opción 1: Abrir directamente
start index.html

# Opción 2: Usar Node.js
npx serve . -l 3000
```

### 2. Conexión con Supabase (Nube)
Por defecto, si no has configurado tu clave pública, **AulaLab** iniciará en **Modo Local / Demo**, guardando tus materias y resultados en tu navegador.

Para sincronizar en la nube entre tu computadora y teléfono móvil:
1. Abre el archivo `config.js`.
2. Reemplaza `"PEGA_AQUI_TU_CLAVE_PUBLICA"` con tu clave `anon public` de Supabase:
   ```javascript
   const SUPABASE_URL = "https://lkxqgxhxyoclssovfsne.supabase.co";
   const SUPABASE_ANON_KEY = "tu_clave_anon_aqui";
   ```
3. En tu proyecto de Supabase, asegúrate de tener creada la tabla `estudio_data` ejecutando este SQL en el **SQL Editor** de Supabase:

```sql
create table if not exists public.estudio_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table public.estudio_data enable row level security;

-- Política de acceso para que cada usuario solo lea y modifique sus datos
create policy "Usuarios gestionan sus propios datos de estudio"
  on public.estudio_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 📱 Despliegue en Producción (Vercel o GitHub Pages)

### Opción A: Despliegue con Vercel
1. Instala o ejecuta Vercel CLI:
   ```bash
   npx vercel
   ```
2. Sigue las instrucciones en consola (acepta los valores predeterminados).
3. Obtendrás de inmediato una URL pública HTTPS lista para abrir en tu celular (ej. `https://aulalab.vercel.app`).

### Opción B: Despliegue con GitHub Pages
1. Crea un repositorio privado o público en tu cuenta de GitHub llamado `aulalab`.
2. Vincula y sube el repositorio:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/aulalab.git
   git push -u origin main
   ```
3. En GitHub: ve a **Settings** > **Pages** > en **Source** selecciona la rama `main` y carpeta `/ (root)`.

---

## 🤖 Generación de Cuestionarios con IA
Usa el botón **"Plantilla para IA"** dentro de cualquier materia para copiar el prompt estructurado y generar cuestionarios a partir de tus diapositivas o PDFs.

