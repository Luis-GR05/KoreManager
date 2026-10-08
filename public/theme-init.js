// Aplica el tema guardado antes de que React cargue (evita el parpadeo).
(function () {
  try {
    var t = localStorage.getItem('theme') || 'dark';
    if (t === 'system') t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var r = document.documentElement;
    r.classList.remove('light', 'dark');
    r.classList.add(t);
    var l = localStorage.getItem('app_language');
    if (l === 'es' || l === 'en') r.lang = l;
  } catch (e) { /* almacenamiento no disponible */ }
})();
