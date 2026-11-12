// =============================================================================
// AULALAB — MOTOR DE ESTUDIO Y EVALUACIÓN (app.js)
// =============================================================================

(function () {
  'use strict';

  // --- ESTADO GLOBAL DE LA APLICACIÓN ---
  const state = {
    appName: "AulaLab",
    materias: [],
    activeMateriaId: null,
    activeQuizId: null,
    quizState: {
      active: false,
      answers: {}, // { [questionIndex]: value }
      shuffledOptions: {}, // { [questionIndex]: array of matching options }
      submitted: false,
      results: null
    },
    user: null,
    supabaseClient: null,
    isDemoMode: false,
    editingQuizId: null
  };

  // --- NORMALIZACIÓN DE TEXTO PARA PREGUNTAS TIPO FILL ---
  function normalizeText(str) {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina tildes y diacríticos
      .trim()
      .replace(/\s+/g, ' '); // Elimina espacios redundantes
  }

  // --- REPRODUCCIÓN DE CONFETI ---
  function launchConfetti() {
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isError = type === 'error';
    const isSuccess = type === 'success';

    toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${
      isError
        ? 'bg-rose-900 text-rose-100 border-rose-700'
        : isSuccess
        ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
        : 'bg-slate-900 text-slate-100 border-slate-700'
    }`;

    toast.innerHTML = `
      <span>${isSuccess ? '✓' : isError ? '⚠' : 'ℹ'}</span>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --- TEMA: MODO OSCURO / MODO CLARO ---
  function initTheme() {
    const savedTheme = localStorage.getItem('aulalab_theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;

    applyTheme(isDark);

    const btnToggle = document.getElementById('btn-toggle-theme');
    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        const currentDark = document.documentElement.classList.contains('dark');
        applyTheme(!currentDark);
      });
    }
  }

  function applyTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aulalab_theme', 'dark');
      document.getElementById('icon-sun')?.classList.remove('hidden');
      document.getElementById('icon-moon')?.classList.add('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aulalab_theme', 'light');
      document.getElementById('icon-sun')?.classList.add('hidden');
      document.getElementById('icon-moon')?.classList.remove('hidden');
    }
  }

  // --- INDICADOR DE SINCRONIZACIÓN ---
  function setSyncStatus(status, text) {
    const dot = document.getElementById('sync-dot');
    const label = document.getElementById('sync-text');
    if (!dot || !label) return;

    if (status === 'saving') {
      dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      label.textContent = text || 'Guardando...';
    } else if (status === 'synced') {
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
      label.textContent = text || 'Sincronizado';
    } else if (status === 'local') {
      dot.className = 'w-2 h-2 rounded-full bg-indigo-500';
      label.textContent = text || 'Modo Local';
    } else if (status === 'error') {
      dot.className = 'w-2 h-2 rounded-full bg-rose-500';
      label.textContent = text || 'Error de sincronización';
    }
  }

  // --- GESTIÓN DE NOMBRE DE LA PLATAFORMA ---
  function updateAppTitleUI(title) {
    state.appName = title || 'AulaLab';
    const display = document.getElementById('app-title-display');
    const loginTitle = document.getElementById('login-app-title');
    if (display) display.textContent = state.appName;
    if (loginTitle) loginTitle.textContent = state.appName;
    document.title = `${state.appName} — Plataforma Personal de Estudio y Evaluación`;
  }

  function setupAppTitleEditor() {
    const trigger = document.getElementById('btn-edit-app-title');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const newTitle = prompt('Ingresa el nuevo nombre para tu plataforma:', state.appName);
      if (newTitle && newTitle.trim() && newTitle.trim() !== state.appName) {
        updateAppTitleUI(newTitle.trim());
        saveState();
        showToast('Nombre de la plataforma actualizado', 'success');
      }
    });
  }

  // --- CONFIGURACIÓN Y CLIENTE SUPABASE ---
  function getEffectiveSupabaseAnonKey() {
    const customKey = localStorage.getItem('aulalab_custom_anon_key');
    if (customKey && customKey.trim()) return customKey.trim();

    const configKey = window.SUPABASE_ANON_KEY;
    if (configKey && configKey !== 'PEGA_AQUI_TU_CLAVE_PUBLICA' && configKey.trim()) {
      return configKey.trim();
    }
    return null;
  }

  function initSupabase() {
    const supabaseUrl = window.SUPABASE_URL || 'https://lkxqgxhxyoclssovfsne.supabase.co';
    const anonKey = getEffectiveSupabaseAnonKey();

    const modeLabel = document.getElementById('supabase-mode-label');
    const urlInput = document.getElementById('input-supabase-url');
    if (urlInput) urlInput.value = supabaseUrl;

    if (!anonKey) {
      // Modo Local / Demo de emergencia
      console.info('Supabase anon key no configurada. Activando Modo Local / Demo.');
      state.isDemoMode = true;
      if (modeLabel) modeLabel.textContent = 'Demo / Local';
      setSyncStatus('local', 'Modo Local');
      loadInitialOrLocalData();
      showAppView();
      return;
    }

    // Inicializar cliente Supabase v2
    try {
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        state.supabaseClient = window.supabase.createClient(supabaseUrl, anonKey);
        state.isDemoMode = false;
        if (modeLabel) modeLabel.textContent = 'Nube Supabase';
        checkSupabaseSession();
      } else {
        console.warn('Librería de Supabase no disponible en ventana. Pasando a Modo Local.');
        state.isDemoMode = true;
        loadInitialOrLocalData();
        showAppView();
      }
    } catch (err) {
      console.error('Error inicializando Supabase:', err);
      state.isDemoMode = true;
      loadInitialOrLocalData();
      showAppView();
    }
  }

  async function checkSupabaseSession() {
    if (!state.supabaseClient) return;

    setSyncStatus('saving', 'Verificando sesión...');
    try {
      const { data, error } = await state.supabaseClient.auth.getSession();
      if (error) throw error;

      if (data?.session?.user) {
        state.user = data.session.user;
        await loadUserDataFromSupabase();
        showAppView();
      } else {
        showLoginView();
      }
    } catch (err) {
      console.error('Error comprobando sesión de Supabase:', err);
      showLoginView();
    }
  }

  async function loadUserDataFromSupabase() {
    if (!state.supabaseClient || !state.user) return;

    setSyncStatus('saving', 'Cargando datos...');
    try {
      const { data, error } = await state.supabaseClient
        .from('estudio_data')
        .select('payload')
        .eq('user_id', state.user.id)
        .maybeSingle();

      if (error) {
        console.warn('Error al leer estudio_data en Supabase:', error);
      }

      if (data && data.payload && Array.isArray(data.payload.materias)) {
        // Datos existentes encontrados
        state.appName = data.payload.appName || 'AulaLab';
        state.materias = data.payload.materias;
      } else {
        // Inicializar con seed.js
        console.info('No se encontró registro para el usuario. Inicializando con seed.js...');
        const seedData = window.INITIAL_DATA || { appName: 'AulaLab', materias: [] };
        state.appName = seedData.appName || 'AulaLab';
        state.materias = JSON.parse(JSON.stringify(seedData.materias || []));

        await state.supabaseClient.from('estudio_data').upsert({
          user_id: state.user.id,
          payload: {
            appName: state.appName,
            materias: state.materias
          },
          updated_at: new Date().toISOString()
        });
      }

      updateAppTitleUI(state.appName);
      ensureActiveMateria();
      renderAll();
      setSyncStatus('synced', 'Sincronizado');
    } catch (err) {
      console.error('Error en loadUserDataFromSupabase:', err);
      setSyncStatus('error', 'Error al sincronizar');
      loadInitialOrLocalData();
    }
  }

  // --- CARGA DE DATOS LOCALES / DEMO ---
  function loadInitialOrLocalData() {
    const local = localStorage.getItem('aulalab_data');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        state.appName = parsed.appName || 'AulaLab';
        state.materias = parsed.materias || [];
      } catch (e) {
        console.error('Error parseando datos locales:', e);
        fallbackToSeed();
      }
    } else {
      fallbackToSeed();
    }

    updateAppTitleUI(state.appName);
    ensureActiveMateria();
    renderAll();
  }

  function fallbackToSeed() {
    const seed = window.INITIAL_DATA || { appName: 'AulaLab', materias: [] };
    state.appName = seed.appName || 'AulaLab';
    state.materias = JSON.parse(JSON.stringify(seed.materias || []));
  }

  function ensureActiveMateria() {
    if (!state.activeMateriaId || !state.materias.some(m => m.id === state.activeMateriaId)) {
      if (state.materias.length > 0) {
        state.activeMateriaId = state.materias[0].id;
      } else {
        state.activeMateriaId = null;
      }
    }
  }

  // --- PERSISTENCIA AUTOMÁTICA (UPSERT EN SUPABASE / LOCALSTORAGE) ---
  let saveTimeout = null;
  function saveState() {
    setSyncStatus('saving', 'Guardando...');

    // Persistencia local inmediata como caché resiliente
    try {
      localStorage.setItem(
        'aulalab_data',
        JSON.stringify({
          appName: state.appName,
          materias: state.materias
        })
      );
    } catch (e) {
      console.warn('Error escribiendo en localStorage:', e);
    }

    if (state.isDemoMode || !state.supabaseClient || !state.user) {
      setTimeout(() => {
        setSyncStatus('local', 'Guardado local');
      }, 350);
      return;
    }

    // Debounce de guardado en la nube de Supabase
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        const { error } = await state.supabaseClient.from('estudio_data').upsert({
          user_id: state.user.id,
          payload: {
            appName: state.appName,
            materias: state.materias
          },
          updated_at: new Date().toISOString()
        });

        if (error) throw error;
        setSyncStatus('synced', 'Sincronizado');
      } catch (err) {
        console.error('Error guardando en Supabase:', err);
        setSyncStatus('error', 'Fallo al guardar en nube');
        showToast('Error al sincronizar con Supabase. Guardado localmente.', 'error');
      }
    }, 450);
  }

  // --- CONTROL DE VISTAS (LOGIN VS APP) ---
  function showLoginView() {
    document.getElementById('view-login')?.classList.remove('hidden');
    document.getElementById('view-app')?.classList.add('hidden');
    document.getElementById('btn-logout-header')?.classList.add('hidden');
  }

  function showAppView() {
    document.getElementById('view-login')?.classList.add('hidden');
    document.getElementById('view-app')?.classList.remove('hidden');
    document.getElementById('btn-logout-header')?.classList.remove('hidden');
  }

  // --- GESTIÓN DE AUTENTICACIÓN ---
  function setupAuthHandlers() {
    const formLogin = document.getElementById('form-login');
    const alertBox = document.getElementById('login-alert');
    const btnDemoFromLogin = document.getElementById('btn-demo-mode-from-login');
    const btnLogoutSidebar = document.getElementById('btn-logout');
    const btnLogoutHeader = document.getElementById('btn-logout-header');

    if (formLogin) {
      formLogin.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('login-email')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const submitBtn = document.getElementById('btn-login-submit');

        if (!email || !password) return;

        if (!state.supabaseClient) {
          alert('Configura tu clave pública anónima de Supabase en config.js para iniciar sesión.');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Verificando...</span>';
        }
        if (alertBox) alertBox.classList.add('hidden');

        try {
          const { data, error } = await state.supabaseClient.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          state.user = data.user;
          state.isDemoMode = false;
          showToast(`¡Bienvenido! Sesión iniciada como ${state.user.email}`, 'success');
          await loadUserDataFromSupabase();
          showAppView();
        } catch (err) {
          console.error('Error en autenticación:', err);
          if (alertBox) {
            alertBox.textContent = err.message || 'Error al iniciar sesión. Verifica correo y contraseña.';
            alertBox.classList.remove('hidden');
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Iniciar Sesión</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>';
          }
        }
      });
    }

    if (btnDemoFromLogin) {
      btnDemoFromLogin.addEventListener('click', () => {
        state.isDemoMode = true;
        setSyncStatus('local', 'Modo Local');
        loadInitialOrLocalData();
        showAppView();
        showToast('Accediendo en Modo Local / Demo sin conexión', 'info');
      });
    }

    async function handleLogout() {
      if (confirm('¿Deseas cerrar tu sesión?')) {
        if (state.supabaseClient) {
          try {
            await state.supabaseClient.auth.signOut();
          } catch (e) {
            console.warn('Error en signOut:', e);
          }
        }
        state.user = null;
        showLoginView();
        showToast('Sesión cerrada con éxito', 'info');
      }
    }

    btnLogoutSidebar?.addEventListener('click', handleLogout);
    btnLogoutHeader?.addEventListener('click', handleLogout);
  }

  // --- RENDERIZADO DE MATERIAS (SIDEBAR) ---
  function renderMateriasSidebar() {
    const list = document.getElementById('materias-list');
    if (!list) return;

    list.innerHTML = '';

    if (state.materias.length === 0) {
      list.innerHTML = `
        <div class="px-3 py-4 text-center text-xs text-slate-400">
          No hay materias aún. Crea una arriba.
        </div>
      `;
      return;
    }

    state.materias.forEach(materia => {
      const isActive = materia.id === state.activeMateriaId;
      const count = materia.cuestionarios?.length || 0;

      const item = document.createElement('div');
      item.className = `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer select-none ${
        isActive
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`;

      item.innerHTML = `
        <div class="flex items-center gap-2.5 truncate flex-1 mr-2">
          <svg class="w-4 h-4 flex-none ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
          <span class="truncate">${materia.nombre}</span>
        </div>
        <div class="flex items-center gap-1.5 flex-none">
          <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
            isActive ? 'bg-brand-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }">${count}</span>
          <button class="btn-edit-materia p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition" title="Renombrar materia">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          <button class="btn-del-materia p-1 rounded hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition" title="Eliminar materia">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      `;

      // Evento de selección de materia
      item.addEventListener('click', e => {
        if (e.target.closest('.btn-edit-materia') || e.target.closest('.btn-del-materia')) return;
        state.activeMateriaId = materia.id;
        state.quizState.active = false;
        renderAll();
        closeMobileSidebar();
      });

      // Editar materia
      item.querySelector('.btn-edit-materia')?.addEventListener('click', e => {
        e.stopPropagation();
        const nuevoNombre = prompt('Renombrar materia:', materia.nombre);
        if (nuevoNombre && nuevoNombre.trim() && nuevoNombre.trim() !== materia.nombre) {
          materia.nombre = nuevoNombre.trim();
          saveState();
          renderAll();
          showToast('Materia renombrada', 'success');
        }
      });

      // Eliminar materia
      item.querySelector('.btn-del-materia')?.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de eliminar "${materia.nombre}" con todos sus cuestionarios?`)) {
          state.materias = state.materias.filter(m => m.id !== materia.id);
          ensureActiveMateria();
          saveState();
          renderAll();
          showToast('Materia eliminada', 'info');
        }
      });

      list.appendChild(item);
    });
  }

  // --- RENDERIZADO DE LA VISTA DE CUESTIONARIOS ---
  function renderMateriaDetail() {
    const currentMateria = state.materias.find(m => m.id === state.activeMateriaId);
    const viewDetail = document.getElementById('view-materia-detail');
    const viewRunner = document.getElementById('view-quiz-runner');

    if (state.quizState.active) {
      viewDetail?.classList.add('hidden');
      viewRunner?.classList.remove('hidden');
      return;
    } else {
      viewDetail?.classList.remove('hidden');
      viewRunner?.classList.add('hidden');
    }

    const titleEl = document.getElementById('current-materia-title');
    const statsEl = document.getElementById('current-materia-stats');
    const container = document.getElementById('cuestionarios-container');
    const emptyState = document.getElementById('cuestionarios-empty');

    if (!currentMateria) {
      if (titleEl) titleEl.textContent = 'Selecciona una materia';
      if (statsEl) statsEl.textContent = '0 cuestionarios';
      if (container) container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (titleEl) titleEl.textContent = currentMateria.nombre;
    const count = currentMateria.cuestionarios?.length || 0;
    if (statsEl) statsEl.textContent = `${count} cuestionario${count === 1 ? '' : 's'}`;

    if (!currentMateria.cuestionarios || currentMateria.cuestionarios.length === 0) {
      if (container) container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (container) {
      container.innerHTML = '';

      currentMateria.cuestionarios.forEach(quiz => {
        const card = document.createElement('div');
        card.className =
          'bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4';

        // Resumen de tipos de preguntas
        const tipos = {};
        quiz.preguntas?.forEach(p => {
          tipos[p.tipo] = (tipos[p.tipo] || 0) + 1;
        });

        const badgesTipos = Object.entries(tipos)
          .map(([t, c]) => `<span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">${c} ${t}</span>`)
          .join(' ');

        // Estado del último intento
        let intentoBadge = `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <span>Sin intentos aún</span>
          </span>
        `;

        if (quiz.ultimoIntento) {
          const nota = Number(quiz.ultimoIntento.nota || 0).toFixed(2);
          const pct = Math.round(quiz.ultimoIntento.porcentaje || 0);
          const isPassed = pct >= 70;
          intentoBadge = `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              isPassed
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            }">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Último intento: ${nota}/10 (${pct}%)</span>
            </span>
          `;
        }

        card.innerHTML = `
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold text-base text-slate-900 dark:text-white leading-snug">${quiz.titulo}</h3>
              <div class="flex items-center gap-1">
                <button class="btn-edit-quiz p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Editar código del cuestionario">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button class="btn-del-quiz p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition" title="Eliminar cuestionario">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">${quiz.descripcion || 'Sin descripción'}</p>
          </div>

          <div class="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                ${quiz.preguntas?.length || 0} preguntas
              </span>
              ${badgesTipos}
            </div>

            <div class="flex items-center justify-between gap-2 pt-1">
              ${intentoBadge}
              <button class="btn-start-quiz inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition">
                <span>${quiz.ultimoIntento ? 'Repetir Intento' : 'Iniciar'}</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </div>
        `;

        // Eventos de la tarjeta
        card.querySelector('.btn-start-quiz')?.addEventListener('click', () => {
          startQuiz(quiz.id);
        });

        card.querySelector('.btn-edit-quiz')?.addEventListener('click', () => {
          openEditQuizModal(quiz);
        });

        card.querySelector('.btn-del-quiz')?.addEventListener('click', () => {
          if (confirm(`¿Estás seguro de eliminar el cuestionario "${quiz.titulo}"?`)) {
            currentMateria.cuestionarios = currentMateria.cuestionarios.filter(q => q.id !== quiz.id);
            saveState();
            renderAll();
            showToast('Cuestionario eliminado', 'info');
          }
        });

        container.appendChild(card);
      });
    }
  }

  // --- MOTOR DE EVALUACIÓN INTERACTIVO (QUIZ RUNNER) ---
  function startQuiz(quizId) {
    const currentMateria = state.materias.find(m => m.id === state.activeMateriaId);
    if (!currentMateria) return;

    const quiz = currentMateria.cuestionarios?.find(q => q.id === quizId);
    if (!quiz) return;

    state.activeQuizId = quizId;
    state.quizState = {
      active: true,
      answers: {},
      shuffledOptions: {},
      submitted: false,
      results: null
    };

    // Pre-mezclar opciones para preguntas tipo matching
    quiz.preguntas.forEach((p, idx) => {
      if (p.tipo === 'matching' && Array.isArray(p.pares)) {
        const uniqueAnswers = Array.from(new Set(p.pares.map(item => item.respuesta)));
        // Fisher-Yates shuffle
        for (let i = uniqueAnswers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [uniqueAnswers[i], uniqueAnswers[j]] = [uniqueAnswers[j], uniqueAnswers[i]];
        }
        state.quizState.shuffledOptions[idx] = uniqueAnswers;
      }
    });

    renderQuizRunner();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderQuizRunner() {
    const currentMateria = state.materias.find(m => m.id === state.activeMateriaId);
    const quiz = currentMateria?.cuestionarios?.find(q => q.id === state.activeQuizId);

    const viewDetail = document.getElementById('view-materia-detail');
    const viewRunner = document.getElementById('view-quiz-runner');

    if (!quiz) {
      state.quizState.active = false;
      renderAll();
      return;
    }

    viewDetail?.classList.add('hidden');
    viewRunner?.classList.remove('hidden');

    // Título y descripción
    const titleEl = document.getElementById('runner-quiz-title');
    const descEl = document.getElementById('runner-quiz-desc');
    if (titleEl) titleEl.textContent = quiz.titulo;
    if (descEl) descEl.textContent = quiz.descripcion || 'Evaluación interactiva';

    // Banner de resultados (oculto hasta enviar)
    const resultsBanner = document.getElementById('quiz-results-banner');
    if (resultsBanner) {
      if (state.quizState.submitted && state.quizState.results) {
        const { nota10, porcentaje, aciertosTotales, totalPreguntas } = state.quizState.results;
        const isPassed = porcentaje >= 70;

        resultsBanner.className = `rounded-2xl p-6 border shadow-sm ${
          isPassed
            ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800'
            : 'bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100 border-amber-200 dark:border-amber-800'
        }`;

        resultsBanner.innerHTML = `
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isPassed ? 'bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300' : 'bg-amber-200/60 dark:bg-amber-900 text-amber-800 dark:text-amber-300'
              }">
                ${isPassed ? '🎉 ¡Aprobado con Éxito!' : '📖 Sigue Practicando'}
              </span>
              <h3 class="text-2xl font-black tracking-tight">
                Nota Final: ${nota10} / 10.00 <span class="text-lg font-semibold opacity-80">(${porcentaje}%)</span>
              </h3>
              <p class="text-xs sm:text-sm opacity-80">
                Puntaje acumulado: ${aciertosTotales.toFixed(2)} de ${totalPreguntas} puntos posibles. Revisa las explicaciones detalladas abajo.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-banner-retry" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition">
                Repetir Intento
              </button>
            </div>
          </div>
        `;
        resultsBanner.classList.remove('hidden');

        document.getElementById('btn-banner-retry')?.addEventListener('click', () => {
          startQuiz(quiz.id);
        });
      } else {
        resultsBanner.classList.add('hidden');
      }
    }

    // Renderizar cada pregunta
    const container = document.getElementById('quiz-questions-list');
    if (!container) return;
    container.innerHTML = '';

    quiz.preguntas.forEach((pregunta, qIdx) => {
      const qCard = document.createElement('div');
      const isSubmitted = state.quizState.submitted;
      const qResult = state.quizState.results?.evaluaciones?.[qIdx];

      let borderStyle = 'border-slate-200 dark:border-slate-800';
      let statusBadge = '';

      if (isSubmitted && qResult) {
        if (qResult.score === 1) {
          borderStyle = 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30';
          statusBadge = `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              ✓ Correcto (1.0 / 1.0)
            </span>
          `;
        } else if (qResult.score > 0) {
          borderStyle = 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-1 ring-amber-500/30';
          statusBadge = `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
              ⚠ Parcial (${qResult.score.toFixed(2)} / 1.0)
            </span>
          `;
        } else {
          borderStyle = 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 ring-1 ring-rose-500/30';
          statusBadge = `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
              ✗ Incorrecto (0.0 / 1.0)
            </span>
          `;
        }
      }

      qCard.className = `bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border ${borderStyle} shadow-sm transition space-y-4`;

      // Header de la pregunta: número, tipo y badge de estado
      const tipoLabel = {
        single: 'Selección Única',
        multiple: 'Selección Múltiple',
        matching: 'Emparejamiento',
        fill: 'Completar Espacio'
      }[pregunta.tipo] || pregunta.tipo;

      let cardHTML = `
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold flex items-center justify-center">
              ${qIdx + 1}
            </span>
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
              ${tipoLabel}
            </span>
          </div>
          ${statusBadge}
        </div>
        <p class="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
          ${pregunta.enunciado}
        </p>
      `;

      // Renderizar cuerpo según el tipo
      cardHTML += `<div class="space-y-2 pt-1" id="question-body-${qIdx}">`;

      if (pregunta.tipo === 'single') {
        const selected = state.quizState.answers[qIdx];
        pregunta.opciones.forEach((op, opIdx) => {
          const isChecked = selected === opIdx;
          let optStyle = 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700';

          if (isSubmitted) {
            if (opIdx === pregunta.correcta) {
              optStyle = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
            } else if (isChecked && opIdx !== pregunta.correcta) {
              optStyle = 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
            }
          } else if (isChecked) {
            optStyle = 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200';
          }

          cardHTML += `
            <label class="flex items-start gap-3 p-3 rounded-xl border ${optStyle} transition cursor-pointer text-xs sm:text-sm">
              <input type="radio" name="q-${qIdx}" value="${opIdx}" ${isChecked ? 'checked' : ''} ${isSubmitted ? 'disabled' : ''} class="mt-0.5 text-brand-600 focus:ring-brand-500">
              <span class="flex-1">${op}</span>
              ${isSubmitted && opIdx === pregunta.correcta ? '<span class="text-emerald-600 font-bold text-xs">✓ Correcta</span>' : ''}
            </label>
          `;
        });
      } else if (pregunta.tipo === 'multiple') {
        const selectedArr = state.quizState.answers[qIdx] || [];
        pregunta.opciones.forEach((op, opIdx) => {
          const isChecked = selectedArr.includes(opIdx);
          const isCorrect = pregunta.correctas?.includes(opIdx);
          let optStyle = 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700';

          if (isSubmitted) {
            if (isCorrect && isChecked) {
              optStyle = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
            } else if (isCorrect && !isChecked) {
              optStyle = 'border-emerald-500/70 border-dashed bg-emerald-50/20 text-emerald-800 dark:text-emerald-300';
            } else if (!isCorrect && isChecked) {
              optStyle = 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
            }
          } else if (isChecked) {
            optStyle = 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200';
          }

          cardHTML += `
            <label class="flex items-start gap-3 p-3 rounded-xl border ${optStyle} transition cursor-pointer text-xs sm:text-sm">
              <input type="checkbox" name="q-${qIdx}" value="${opIdx}" ${isChecked ? 'checked' : ''} ${isSubmitted ? 'disabled' : ''} class="mt-0.5 rounded text-brand-600 focus:ring-brand-500">
              <span class="flex-1">${op}</span>
              ${isSubmitted && isCorrect ? '<span class="text-emerald-600 font-bold text-xs">✓ Correcta</span>' : ''}
            </label>
          `;
        });
      } else if (pregunta.tipo === 'matching') {
        const userMatches = state.quizState.answers[qIdx] || {};
        const availableOptions = state.quizState.shuffledOptions[qIdx] || [];

        cardHTML += `<div class="space-y-3">`;
        pregunta.pares.forEach((par, pIdx) => {
          const selectedVal = userMatches[par.item] || '';
          const isMatchCorrect = isSubmitted && selectedVal === par.respuesta;
          let rowStyle = 'border-slate-200 dark:border-slate-800';

          if (isSubmitted) {
            rowStyle = isMatchCorrect
              ? 'border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/30'
              : 'border-rose-500/80 bg-rose-50/30 dark:bg-rose-950/30';
          }

          cardHTML += `
            <div class="p-3 rounded-xl border ${rowStyle} space-y-2">
              <div class="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                <span class="font-bold text-slate-400 mr-1.5">•</span>${par.item}
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <select data-qidx="${qIdx}" data-item="${encodeURIComponent(par.item)}" ${isSubmitted ? 'disabled' : ''} class="matching-select flex-1 px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">-- Seleccionar respuesta correspondiente --</option>
                  ${availableOptions
                    .map(
                      opt =>
                        `<option value="${encodeURIComponent(opt)}" ${
                          selectedVal === opt ? 'selected' : ''
                        }>${opt}</option>`
                    )
                    .join('')}
                </select>
                ${
                  isSubmitted && !isMatchCorrect
                    ? `<span class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Respuesta correcta: ${par.respuesta}</span>`
                    : ''
                }
              </div>
            </div>
          `;
        });
        cardHTML += `</div>`;
      } else if (pregunta.tipo === 'fill') {
        const userText = state.quizState.answers[qIdx] || '';
        let inputStyle = 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white';

        if (isSubmitted) {
          const isCorrect = qResult?.score === 1;
          inputStyle = isCorrect
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold'
            : 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100';
        }

        cardHTML += `
          <div class="space-y-2">
            <input type="text" data-qidx="${qIdx}" value="${userText}" placeholder="Escribe aquí tu respuesta..." ${
          isSubmitted ? 'disabled' : ''
        } class="fill-input w-full px-3.5 py-2.5 rounded-xl border ${inputStyle} text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            ${
              isSubmitted && qResult?.score !== 1
                ? `<div class="text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                    Respuestas válidas aceptadas: <span class="font-bold">${(pregunta.respuestasValidas || []).join(' | ')}</span>
                  </div>`
                : ''
            }
          </div>
        `;
      }

      cardHTML += `</div>`; // fin question-body

      // Si está calificado, mostrar caja explicativa oficial
      if (isSubmitted && pregunta.explicacion) {
        cardHTML += `
          <div class="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3">
            <svg class="w-5 h-5 flex-none text-brand-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <span class="font-bold text-slate-900 dark:text-white block mb-0.5">Explicación oficial:</span>
              <p class="leading-relaxed">${pregunta.explicacion}</p>
            </div>
          </div>
        `;
      }

      qCard.innerHTML = cardHTML;
      container.appendChild(qCard);
    });

    updateQuizProgressBar();
  }

  // --- ACTUALIZACIÓN DE BARRA DE PROGRESO DEL QUIZ ---
  function updateQuizProgressBar() {
    const currentMateria = state.materias.find(m => m.id === state.activeMateriaId);
    const quiz = currentMateria?.cuestionarios?.find(q => q.id === state.activeQuizId);
    if (!quiz) return;

    const total = quiz.preguntas.length;
    let answered = 0;

    quiz.preguntas.forEach((p, idx) => {
      const ans = state.quizState.answers[idx];
      if (p.tipo === 'single' && typeof ans === 'number') answered++;
      else if (p.tipo === 'multiple' && Array.isArray(ans) && ans.length > 0) answered++;
      else if (p.tipo === 'matching' && ans && Object.keys(ans).length === p.pares.length) answered++;
      else if (p.tipo === 'fill' && typeof ans === 'string' && ans.trim().length > 0) answered++;
    });

    const counter = document.getElementById('quiz-question-counter');
    const bar = document.getElementById('quiz-progress-bar');
    const pct = total > 0 ? (answered / total) * 100 : 0;

    if (counter) counter.textContent = `Progreso: ${answered} de ${total} respondidas (${Math.round(pct)}%)`;
    if (bar) bar.style.width = `${pct}%`;
  }

  // --- CALIFICACIÓN Y EVALUACIÓN DEL QUIZ ---
  function evaluateQuiz() {
    const currentMateria = state.materias.find(m => m.id === state.activeMateriaId);
    const quiz = currentMateria?.cuestionarios?.find(q => q.id === state.activeQuizId);
    if (!quiz) return;

    // Verificar si faltan preguntas por responder
    let unansweredCount = 0;
    quiz.preguntas.forEach((p, idx) => {
      const ans = state.quizState.answers[idx];
      if (p.tipo === 'single' && typeof ans !== 'number') unansweredCount++;
      else if (p.tipo === 'multiple' && (!Array.isArray(ans) || ans.length === 0)) unansweredCount++;
      else if (p.tipo === 'matching' && (!ans || Object.keys(ans).length < p.pares.length)) unansweredCount++;
      else if (p.tipo === 'fill' && (!ans || ans.trim().length === 0)) unansweredCount++;
    });

    if (unansweredCount > 0) {
      if (!confirm(`Tienes ${unansweredCount} pregunta(s) sin responder por completo. ¿Deseas calificar de todos modos?`)) {
        return;
      }
    }

    let aciertosTotales = 0;
    const totalPreguntas = quiz.preguntas.length;
    const evaluaciones = {};

    quiz.preguntas.forEach((pregunta, qIdx) => {
      let score = 0;
      const userAns = state.quizState.answers[qIdx];

      if (pregunta.tipo === 'single') {
        score = userAns === pregunta.correcta ? 1 : 0;
      } else if (pregunta.tipo === 'multiple') {
        const correctas = pregunta.correctas || [];
        const seleccionadas = Array.isArray(userAns) ? userAns : [];
        if (correctas.length > 0) {
          const hits = seleccionadas.filter(i => correctas.includes(i)).length;
          const misses = seleccionadas.filter(i => !correctas.includes(i)).length;
          // Puntuación proporcional justa: (aciertos - penalización) / totalCorrectas
          score = Math.max(0, (hits - misses) / correctas.length);
        }
      } else if (pregunta.tipo === 'matching') {
        const pares = pregunta.pares || [];
        if (pares.length > 0 && userAns && typeof userAns === 'object') {
          const hits = pares.filter(p => userAns[p.item] === p.respuesta).length;
          score = hits / pares.length;
        }
      } else if (pregunta.tipo === 'fill') {
        const normUser = normalizeText(userAns);
        const validList = (pregunta.respuestasValidas || []).map(normalizeText);
        score = validList.includes(normUser) ? 1 : 0;
      }

      aciertosTotales += score;
      evaluaciones[qIdx] = { score };
    });

    const porcentaje = totalPreguntas > 0 ? (aciertosTotales / totalPreguntas) * 100 : 0;
    const nota10 = totalPreguntas > 0 ? (aciertosTotales / totalPreguntas) * 10 : 0;

    state.quizState.submitted = true;
    state.quizState.results = {
      aciertosTotales,
      totalPreguntas,
      porcentaje: Math.round(porcentaje),
      nota10: Number(nota10.toFixed(2)),
      evaluaciones
    };

    // Registrar último intento en el objeto de cuestionario
    quiz.ultimoIntento = {
      nota: Number(nota10.toFixed(2)),
      porcentaje: Math.round(porcentaje),
      aciertosTotales,
      totalPreguntas,
      fecha: new Date().toISOString()
    };

    saveState();
    renderQuizRunner();

    if (porcentaje >= 70) {
      launchConfetti();
      showToast(`¡Excelente! Calificación obtenida: ${nota10.toFixed(2)}/10.00 (${Math.round(porcentaje)}%)`, 'success');
    } else {
      showToast(`Intento finalizado: ${nota10.toFixed(2)}/10.00 (${Math.round(porcentaje)}%)`, 'info');
    }

    // Scroll arriba suave para ver el banner de resultados
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- LISTENERS DEL MOTOR DE EVALUACIÓN ---
  function setupQuizEventListeners() {
    const questionsContainer = document.getElementById('quiz-questions-list');
    if (!questionsContainer) return;

    // Manejo unificado de inputs vía event delegation
    questionsContainer.addEventListener('change', e => {
      if (state.quizState.submitted) return;

      const target = e.target;

      // Radio single
      if (target.type === 'radio' && target.name.startsWith('q-')) {
        const qIdx = parseInt(target.name.replace('q-', ''), 10);
        state.quizState.answers[qIdx] = parseInt(target.value, 10);
        updateQuizProgressBar();
      }

      // Checkbox multiple
      if (target.type === 'checkbox' && target.name.startsWith('q-')) {
        const qIdx = parseInt(target.name.replace('q-', ''), 10);
        const val = parseInt(target.value, 10);
        const currentArr = state.quizState.answers[qIdx] || [];
        if (target.checked) {
          if (!currentArr.includes(val)) currentArr.push(val);
        } else {
          const idx = currentArr.indexOf(val);
          if (idx !== -1) currentArr.splice(idx, 1);
        }
        state.quizState.answers[qIdx] = currentArr;
        updateQuizProgressBar();
      }

      // Select matching
      if (target.classList.contains('matching-select')) {
        const qIdx = parseInt(target.getAttribute('data-qidx'), 10);
        const item = decodeURIComponent(target.getAttribute('data-item'));
        const val = target.value ? decodeURIComponent(target.value) : '';

        if (!state.quizState.answers[qIdx]) state.quizState.answers[qIdx] = {};
        if (val) {
          state.quizState.answers[qIdx][item] = val;
        } else {
          delete state.quizState.answers[qIdx][item];
        }
        updateQuizProgressBar();
      }
    });

    questionsContainer.addEventListener('input', e => {
      if (state.quizState.submitted) return;
      const target = e.target;

      // Input fill
      if (target.classList.contains('fill-input')) {
        const qIdx = parseInt(target.getAttribute('data-qidx'), 10);
        state.quizState.answers[qIdx] = target.value;
        updateQuizProgressBar();
      }
    });

    // Botones de acción del runner
    document.getElementById('btn-back-to-materia')?.addEventListener('click', () => {
      state.quizState.active = false;
      renderAll();
    });

    document.getElementById('btn-reset-quiz')?.addEventListener('click', () => {
      if (confirm('¿Reiniciar todas tus respuestas de este cuestionario?')) {
        if (state.activeQuizId) startQuiz(state.activeQuizId);
      }
    });

    document.getElementById('btn-submit-quiz')?.addEventListener('click', () => {
      if (state.quizState.submitted) {
        showToast('Este intento ya ha sido calificado. Pulsa "Reiniciar Respuestas" para intentarlo de nuevo.', 'info');
        return;
      }
      evaluateQuiz();
    });
  }

  // --- MODAL DE AGREGAR / EDITAR CUESTIONARIO (JSON & YAML) ---
  function openAddQuizModal() {
    state.editingQuizId = null;
    const modal = document.getElementById('modal-cuestionario');
    const title = document.getElementById('modal-cuestionario-title');
    const textarea = document.getElementById('modal-code-input');
    const errorBanner = document.getElementById('modal-error-banner');

    if (title) title.textContent = 'Agregar Cuestionario';
    if (textarea) textarea.value = '';
    if (errorBanner) errorBanner.classList.add('hidden');
    modal?.classList.remove('hidden');
  }

  function openEditQuizModal(quiz) {
    state.editingQuizId = quiz.id;
    const modal = document.getElementById('modal-cuestionario');
    const title = document.getElementById('modal-cuestionario-title');
    const textarea = document.getElementById('modal-code-input');
    const errorBanner = document.getElementById('modal-error-banner');

    if (title) title.textContent = `Editar Cuestionario: ${quiz.titulo}`;
    if (textarea) textarea.value = JSON.stringify(quiz, null, 2);
    if (errorBanner) errorBanner.classList.add('hidden');
    modal?.classList.remove('hidden');
  }

  function setupQuizModalHandlers() {
    const modal = document.getElementById('modal-cuestionario');
    const btnClose = document.getElementById('btn-close-modal-cuestionario');
    const btnCancel = document.getElementById('btn-modal-cancel');
    const btnSave = document.getElementById('btn-modal-save-cuestionario');
    const btnLoadSample = document.getElementById('btn-modal-load-sample');
    const textarea = document.getElementById('modal-code-input');
    const errorBanner = document.getElementById('modal-error-banner');

    const closeModal = () => modal?.classList.add('hidden');
    btnClose?.addEventListener('click', closeModal);
    btnCancel?.addEventListener('click', closeModal);

    btnLoadSample?.addEventListener('click', () => {
      const sample = {
        titulo: "Ejemplo de Cuestionario Rápido",
        descripcion: "Demostración de los 4 tipos de preguntas admitidos",
        preguntas: [
          {
            tipo: "single",
            enunciado: "¿Cuál es la capital de Francia?",
            opciones: ["Madrid", "Berlín", "París", "Roma"],
            correcta: 2,
            explicacion: "París es la capital histórica y oficial de Francia."
          },
          {
            tipo: "multiple",
            enunciado: "Seleccione los números primos menores a 10:",
            opciones: ["2", "4", "3", "7", "9"],
            correctas: [0, 2, 3],
            explicacion: "2, 3 y 7 son números primos; 4 y 9 son compuestos."
          },
          {
            tipo: "matching",
            enunciado: "Empareje cada país con su moneda:",
            pares: [
              { item: "Reino Unido", respuesta: "Libra esterlina" },
              { item: "Japón", respuesta: "Yen" },
              { item: "Estados Unidos", respuesta: "Dólar" }
            ],
            explicacion: "Cada país emite su moneda de curso legal respectiva."
          },
          {
            tipo: "fill",
            enunciado: "La memoria [___] es volátil y de acceso aleatorio.",
            respuestasValidas: ["ram", "memoria ram"],
            explicacion: "La memoria RAM pierde su contenido al apagarse el sistema."
          }
        ]
      };
      if (textarea) textarea.value = JSON.stringify(sample, null, 2);
    });

    btnSave?.addEventListener('click', () => {
      const text = textarea?.value?.trim();
      if (!text) {
        if (errorBanner) {
          errorBanner.textContent = 'El código del cuestionario no puede estar vacío.';
          errorBanner.classList.remove('hidden');
        }
        return;
      }

      let parsedData = null;

      // Intento 1: Parsear como JSON
      try {
        parsedData = JSON.parse(text);
      } catch (jsonErr) {
        // Intento 2: Parsear como YAML con js-yaml
        try {
          if (typeof jsyaml !== 'undefined' && jsyaml.load) {
            parsedData = jsyaml.load(text);
          } else {
            throw new Error('Librería YAML no disponible');
          }
        } catch (yamlErr) {
          if (errorBanner) {
            errorBanner.textContent = `Error de sintaxis: No es un JSON ni un YAML válido. (${jsonErr.message})`;
            errorBanner.classList.remove('hidden');
          }
          return;
        }
      }

      // Validar estructura requerida
      if (!parsedData || typeof parsedData !== 'object') {
        if (errorBanner) {
          errorBanner.textContent = 'El contenido debe ser un objeto con título y arreglo de preguntas.';
          errorBanner.classList.remove('hidden');
        }
        return;
      }

      if (!parsedData.titulo || !parsedData.titulo.trim()) {
        if (errorBanner) {
          errorBanner.textContent = 'El cuestionario debe incluir un campo "titulo" no vacío.';
          errorBanner.classList.remove('hidden');
        }
        return;
      }

      if (!Array.isArray(parsedData.preguntas) || parsedData.preguntas.length === 0) {
        if (errorBanner) {
          errorBanner.textContent = 'El cuestionario debe incluir un arreglo "preguntas" con al menos 1 pregunta.';
          errorBanner.classList.remove('hidden');
        }
        return;
      }

      const currentMateria = state.materias.find(m => m.id === state.activeMateriaId);
      if (!currentMateria) {
        alert('Debes tener una materia seleccionada para guardar el cuestionario.');
        return;
      }

      if (!Array.isArray(currentMateria.cuestionarios)) {
        currentMateria.cuestionarios = [];
      }

      if (state.editingQuizId) {
        // Actualizar existente
        const existingIdx = currentMateria.cuestionarios.findIndex(q => q.id === state.editingQuizId);
        if (existingIdx !== -1) {
          const old = currentMateria.cuestionarios[existingIdx];
          currentMateria.cuestionarios[existingIdx] = {
            ...parsedData,
            id: old.id,
            ultimoIntento: old.ultimoIntento
          };
          showToast('Cuestionario actualizado con éxito', 'success');
        }
      } else {
        // Crear nuevo
        const newQuiz = {
          ...parsedData,
          id: 'quiz-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
        };
        currentMateria.cuestionarios.push(newQuiz);
        showToast('Cuestionario agregado con éxito', 'success');
      }

      saveState();
      closeModal();
      renderAll();
    });
  }

  // --- COPIA DE PLANTILLA PARA IA ---
  const AI_TEMPLATE_PROMPT = `Genera un cuestionario de estudio de [NÚMERO, ej. 15] preguntas basado estrictamente en el material adjunto, mezclando los 4 tipos de preguntas (\`single\`, \`multiple\`, \`matching\` y \`fill\`). Devuélveme ÚNICAMENTE un bloque de código JSON válido (sin texto adicional antes ni después) con exactamente esta estructura para pegarlo en AulaLab:

\`\`\`json
{
  "titulo": "Título de la Clase o Tema",
  "descripcion": "Breve resumen de los temas evaluados.",
  "preguntas": [
    {
      "tipo": "single",
      "enunciado": "Pregunta de selección única...",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correcta": 0,
      "explicacion": "Justificación clara de la respuesta correcta."
    },
    {
      "tipo": "multiple",
      "enunciado": "Pregunta de selección múltiple (Seleccione todas las que apliquen)...",
      "opciones": ["Opción 0", "Opción 1", "Opción 2", "Opción 3"],
      "correctas": [0, 2],
      "explicacion": "Justificación de por qué esas opciones son correctas."
    },
    {
      "tipo": "matching",
      "enunciado": "Empareje cada concepto con su definición:",
      "pares": [
        { "item": "Concepto 1", "respuesta": "Definición 1" },
        { "item": "Concepto 2", "respuesta": "Definición 2" },
        { "item": "Concepto 3", "respuesta": "Definición 3" }
      ],
      "explicacion": "Explicación de las relaciones."
    },
    {
      "tipo": "fill",
      "enunciado": "La [___] permite completar conceptos clave con texto exacto.",
      "respuestasValidas": ["respuesta exacta", "sinonimo aceptado"],
      "explicacion": "Explicación del término."
    }
  ]
}
\`\`\``;

  function setupAITemplateCopy() {
    const btn = document.getElementById('btn-copy-ai-template');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(AI_TEMPLATE_PROMPT);
        showToast('¡Plantilla para IA copiada al portapapeles! Úsala con tus PDFs o apuntes.', 'success');
      } catch (err) {
        // Fallback clásico
        const fallbackTextarea = document.createElement('textarea');
        fallbackTextarea.value = AI_TEMPLATE_PROMPT;
        document.body.appendChild(fallbackTextarea);
        fallbackTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(fallbackTextarea);
        showToast('¡Plantilla para IA copiada al portapapeles!', 'success');
      }
    });
  }

  // --- RESPALDO: EXPORTAR E IMPORTAR JSON ---
  function setupBackupHandlers() {
    const btnExport = document.getElementById('btn-export-backup');
    const btnImportTrigger = document.getElementById('btn-import-backup-trigger');
    const fileImport = document.getElementById('file-import-backup');

    btnExport?.addEventListener('click', () => {
      const dataToExport = {
        appName: state.appName,
        materias: state.materias,
        exportadoEn: new Date().toISOString(),
        version: "1.0"
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `aulalab_respaldo_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Respaldo descargado exitosamente', 'success');
    });

    btnImportTrigger?.addEventListener('click', () => {
      fileImport?.click();
    });

    fileImport?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const imported = JSON.parse(evt.target.result);
          if (!imported || !Array.isArray(imported.materias)) {
            throw new Error('El archivo no contiene un respaldo válido de AulaLab.');
          }

          if (confirm('¿Deseas restaurar este respaldo? Reemplazará las materias actuales.')) {
            state.appName = imported.appName || state.appName;
            state.materias = imported.materias;
            ensureActiveMateria();
            saveState();
            updateAppTitleUI(state.appName);
            renderAll();
            showToast('Respaldo importado y sincronizado con éxito', 'success');
          }
        } catch (err) {
          alert('Error al leer el archivo de respaldo: ' + err.message);
        } finally {
          fileImport.value = '';
        }
      };
      reader.readAsText(file);
    });
  }

  // --- MODAL DE AJUSTES SUPABASE (MANUAL OVERRIDE) ---
  function setupSupabaseModal() {
    const modal = document.getElementById('modal-supabase');
    const btnOpen = document.getElementById('btn-supabase-status');
    const btnClose = document.getElementById('btn-close-modal-supabase');
    const btnSave = document.getElementById('btn-supabase-modal-save');
    const btnDemo = document.getElementById('btn-supabase-modal-demo');
    const anonInput = document.getElementById('input-supabase-anon-key');

    btnOpen?.addEventListener('click', () => {
      const curKey = getEffectiveSupabaseAnonKey() || '';
      if (anonInput) anonInput.value = curKey;
      modal?.classList.remove('hidden');
    });

    const closeModal = () => modal?.classList.add('hidden');
    btnClose?.addEventListener('click', closeModal);

    btnSave?.addEventListener('click', () => {
      const keyVal = anonInput?.value?.trim();
      if (keyVal) {
        localStorage.setItem('aulalab_custom_anon_key', keyVal);
        showToast('Clave anon guardada. Conectando con Supabase...', 'success');
        closeModal();
        initSupabase();
      } else {
        localStorage.removeItem('aulalab_custom_anon_key');
        showToast('Clave removida. Pasando a Modo Local.', 'info');
        closeModal();
        initSupabase();
      }
    });

    btnDemo?.addEventListener('click', () => {
      state.isDemoMode = true;
      setSyncStatus('local', 'Modo Local');
      closeModal();
      showToast('Cambiado a Modo Local / Demo', 'info');
    });
  }

  // --- MOBILE SIDEBAR HANDLERS ---
  function openMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar?.classList.remove('-translate-x-full');
    backdrop?.classList.remove('hidden');
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar?.classList.add('-translate-x-full');
    backdrop?.classList.add('hidden');
  }

  function setupMobileSidebar() {
    document.getElementById('btn-toggle-sidebar')?.addEventListener('click', openMobileSidebar);
    document.getElementById('btn-close-sidebar-mobile')?.addEventListener('click', closeMobileSidebar);
    document.getElementById('sidebar-backdrop')?.addEventListener('click', closeMobileSidebar);
  }

  // --- AGREGAR NUEVA MATERIA ---
  function setupAddMateria() {
    document.getElementById('btn-add-materia')?.addEventListener('click', () => {
      const nombre = prompt('Nombre de la nueva materia:');
      if (nombre && nombre.trim()) {
        const newMateria = {
          id: 'materia-' + Date.now(),
          nombre: nombre.trim(),
          cuestionarios: []
        };
        state.materias.push(newMateria);
        state.activeMateriaId = newMateria.id;
        state.quizState.active = false;
        saveState();
        renderAll();
        showToast(`Materia "${newMateria.nombre}" creada`, 'success');
        closeMobileSidebar();
      }
    });
  }

  // --- RENDERIZADO GLOBAL ---
  function renderAll() {
    renderMateriasSidebar();
    renderMateriaDetail();
  }

  // --- INICIALIZACIÓN PRINCIPAL DE LA APLICACIÓN ---
  function initApp() {
    initTheme();
    setupAppTitleEditor();
    setupAuthHandlers();
    setupMobileSidebar();
    setupAddMateria();
    setupQuizModalHandlers();
    setupQuizEventListeners();
    setupAITemplateCopy();
    setupBackupHandlers();
    setupSupabaseModal();

    // Botones de "+ Agregar Cuestionario"
    document.getElementById('btn-add-cuestionario')?.addEventListener('click', openAddQuizModal);
    document.getElementById('btn-empty-add-cuestionario')?.addEventListener('click', openAddQuizModal);

    // Conexión inicial
    initSupabase();
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
