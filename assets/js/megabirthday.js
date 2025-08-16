// megabirthday.js — stable init, UK output, picker + typing modes
(() => {
  if (window.__MB_CALC_INIT__) return;
  window.__MB_CALC_INIT__ = true;

  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    const form      = document.getElementById('mb-form');
    const dobInput  = document.getElementById('dob');
    const dobText   = document.getElementById('dobText');
    const btn       = document.getElementById('calcBtn');
    const typeToggle= document.getElementById('typeToggle');
    const out       = document.getElementById('result');

    // If this page doesn't have the calculator, bail quietly
    if (!form || !dobInput || !btn || !out) return;

    // Prevent future dates in the picker
    dobInput.max = new Date().toISOString().slice(0,10);

    const MS_PER_DAY = 24*60*60*1000;

    // ---------- helpers ----------
    function ordinal(n){
      const m100 = n % 100, m10 = n % 10;
      if (m100 >= 11 && m100 <= 13) return `${n}th`;
      return `${n}${({1:'st',2:'nd',3:'rd'})[m10] || 'th'}`;
    }
    function formatDateLongUK(dt){ // 23rd January 2028
      const day = dt.getUTCDate();
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const dSuffix = ordinal(day).replace(/\d+/, '');
      return `${day}${dSuffix} ${months[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
    }
    function daysBetweenUTC(a, b){
      const A = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
      const B = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
      return Math.floor((B - A) / MS_PER_DAY);
    }
    function addDaysUTC(d, n){
      const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      return new Date(base + n*MS_PER_DAY);
    }
    function isoToUK(iso){ // "YYYY-MM-DD" -> "DD/MM/YYYY"
      if (!iso) return '';
      const [y,m,d] = iso.split('-');
      return `${d}/${m}/${y}`;
    }
    function parseDOBFromText(s){ // "DD/MM/YYYY" (allows -, . too)
      const m = String(s).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (!m) return null;
      const d = +m[1], mo = +m[2]-1, y = +m[3];
      const dt = new Date(Date.UTC(y, mo, d));
      // guard invalids (e.g., 31/02/2020)
      if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo || dt.getUTCDate() !== d) return null;
      return dt;
    }
    function safeFocus(el, prevent = true){
      if (!el) return;
      try { el.focus(prevent ? { preventScroll: true } : undefined); }
      catch { el.focus(); }
    }

    // ---------- mode management ----------
    let typingMode = false;
    function setMode(isTyping, { focus = true } = {}){
      typingMode = isTyping;

      if (typingMode){
        dobText?.classList.remove('mb-hide');  if (dobText) dobText.disabled = false;
        dobInput?.classList.add('mb-hide');    if (dobInput) dobInput.disabled = true;
        if (dobInput?.value) dobText.value = isoToUK(dobInput.value);
        if (typeToggle) typeToggle.textContent = 'Use date picker';
        if (focus) safeFocus(dobText);
      } else {
        dobInput?.classList.remove('mb-hide'); if (dobInput) dobInput.disabled = false;
        dobText?.classList.add('mb-hide');     if (dobText) dobText.disabled = true;
        const dt = parseDOBFromText(dobText?.value || '');
        if (dt && dobInput) dobInput.value = dt.toISOString().slice(0,10);
        if (typeToggle) typeToggle.textContent = 'Prefer typing?';
        if (focus) safeFocus(dobInput);
      }
    }

    // ---------- main calc ----------
    function calc(){
      let dobUTC = null;

      if (typingMode && dobText && dobText.value.trim()){
        const parsed = parseDOBFromText(dobText.value);
        if (!parsed){
          out.textContent = 'Please enter as DD/MM/YYYY.';
          return;
        }
        dobUTC = parsed;
      } else if (dobInput.value){
        const d = dobInput.valueAsDate || new Date(dobInput.value + 'T00:00:00Z');
        dobUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      } else {
        out.textContent = 'Please pick your date of birth.';
        return;
      }

      // today at UTC midnight
      const now = new Date();
      const todayUTC = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
      ));

      if (dobUTC > todayUTC){
        out.textContent = 'That date is in the future.';
        return;
      }

      const lived = daysBetweenUTC(dobUTC, todayUTC);
      const nextK = Math.floor(lived/1000) + 1;
      const target = addDaysUTC(dobUTC, nextK*1000);
      const toGo = daysBetweenUTC(todayUTC, target);

      if (toGo === 0){
        out.innerHTML = `🎉 Today is your <strong>${ordinal(nextK)}</strong> megabirthday (${formatDateLongUK(target)}).`;
      } else if (toGo < 0){
        const nextNext = nextK + 1;
        const nxt = addDaysUTC(dobUTC, nextNext*1000);
        const nxtToGo = daysBetweenUTC(todayUTC, nxt);
        out.innerHTML = `Your <strong>${ordinal(nextNext)}</strong> megabirthday is on <strong>${formatDateLongUK(nxt)}</strong>. Just <strong>${nxtToGo}</strong> days to go!`;
      } else {
        out.innerHTML = `Your <strong>${ordinal(nextK)}</strong> megabirthday is on <strong>${formatDateLongUK(target)}</strong>. Just <strong>${toGo}</strong> days to go!`;
      }
    }

    // init (no autofocus to avoid mobile scroll jump)
    setMode(false, { focus: false });

    // events
    typeToggle?.addEventListener('click', () => setMode(!typingMode, { focus: true }));
    form.addEventListener('submit', (e) => { e.preventDefault(); calc(); });
    btn.addEventListener('click', (e) => { e.preventDefault(); calc(); });
    dobInput.addEventListener('change', calc);
    dobText?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); calc(); } });

    // expose for quick console checks
    window.MB = Object.assign(window.MB || {}, { calc, setMode });
  });
})();
