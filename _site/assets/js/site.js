// Mobile nav toggle (independent from the calculator JS)
(() => {
  function ready(fn){ document.readyState !== 'loading'
    ? fn() : document.addEventListener('DOMContentLoaded', fn); }

  ready(() => {
    const header = document.querySelector('[data-nav]');
    const toggle = document.getElementById('navToggle');
    const menu   = document.getElementById('site-menu');
    if (!header || !toggle || !menu) return;

    function setOpen(open){
      header.setAttribute('data-open', String(open));
      toggle.setAttribute('aria-expanded', String(open));
    }

    toggle.addEventListener('click', () => {
      const open = header.getAttribute('data-open') === 'true';
      setOpen(!open);
    });

    // Close on link click (nice on mobile)
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  });
})();
