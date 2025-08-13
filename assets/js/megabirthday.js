(() => {
  // stop double init if script included twice
  if (window.__MB_CALC_INIT__) return;
  window.__MB_CALC_INIT__ = true;

  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    // ------- element lookups -------
    const form      = document.getElementById('mb-form');
    const dobInput  = document.getElementById('dob');       // <input type="date">
    const dobText   = document.getElementById('dobText');   // <input type="text"> (typing mode)
    const typeToggle= document.getElementById('typeToggle');// "Prefer typing?" button
    const btn       = document.getElementById('calcBtn');   // Calculate button
    const out       = document.getElementById('result');

    // if this page doesn't have the calculator, bail
    if (!out) return;

    // prevent choosing a future date
    if (dobInput) dobInput.max = new Date().toISOString().slice(0, 10);

    // ------- hard guards against page navigation -------
    form?.addEventListener('submit', (e) => e.preventDefault());
    dobInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter'){ e.preventDefault(); calc(); }});
    dobText?.addEventListener('keydown',  (e) => { if (e.key === 'Enter'){ e.preventDefault(); calc(); }});

    const MS_PER_DAY = 24*60*60*1000;

    // ------- helpers -------
    function ordinal(n){
      const m100 = n % 100, m10 = n % 10;
      if (m100 >= 11 && m100 <= 13) return `${n}th`;
      return `${n}${({1:'st',2:'nd',3:'rd'})[m10] || 'th'}`;
    }
    function formatDateLongUK(dt){
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const day = dt.getUTCDate();
      const month = months[dt.getUTCMonth()];
      const year = dt.getUTCFullYear();
      return `${ordinal(day)} ${month} ${year}`;
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
    // iso "yyyy-mm-dd" -> "dd/mm/yyyy" (for prefill when swapping modes)
    function isoToUK(iso){
      if (!iso) return '';
      const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`;
    }
    // parse DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, or YYYY-MM-DD -> Date (UTC) or null
    function parseDOBFromText(s){
      if (!s) return null;
      s = s.trim();
      let m;
      if ((m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/))){
        let d = +m[1], mo = +m[2], y = +m[3]; if (y < 100) y += (y >= 50 ? 1900 : 2000);
        if (mo<1||mo>12||d<1||d>31) return null;
        const dt = new Date(Date.UTC(y, mo-1, d));
        if (dt.getUTCFullYear()!==y || dt.getUTCMonth()!==mo-1 || dt.getUTCDate()!==d) return null;
        return dt;
      }
      if ((m = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/))){
        let y = +m[1], mo = +m[2], d = +m[3];
        if (mo<1||mo>12||d<1||d>31) return null;
        const dt = new Date(Date.UTC(y, mo-1, d));
        if (dt.getUTCFullYear()!==y || dt.getUTCMonth()!==mo-1 || dt.getUTCDate()!==d) return null;
        return dt;
      }
      return null;
    }

    // ------- mode management (this is the part you asked about) -------
    let typingMode = false; // false = use date picker; true = use text input

    function setMode(isTyping){
      typingMode = isTyping;

      if (typingMode){
        // show text; hide picker
        dobText?.classList.remove('mb-hide');
        if (dobText) dobText.disabled = false;

        dobInput?.classList.add('mb-hide');
        if (dobInput) dobInput.disabled = true;

        // prefill typing field from picker if present
        if (dobInput?.value) dobText.value = isoToUK(dobInput.value);
        if (typeToggle) typeToggle.textContent = 'Use date picker';
        dobText?.focus();
      } else {
        // show picker; hide text
        dobInput?.classList.remove('mb-hide');
        if (dobInput) dobInput.disabled = false;

        dobText?.classList.add('mb-hide');
        if (dobText) dobText.disabled = true;

        // carry typed value across if valid
        const dt = parseDOBFromText(dobText?.value || '');
        if (dt && dobInput) dobInput.value = dt.toISOString().slice(0,10);
        if (typeToggle) typeToggle.textContent = 'Prefer typing?';
        dobInput?.focus();
      }
    }

    // initial mode: picker
    setMode(false);

    // toggle button
    typeToggle?.addEventListener('click', () => setMode(!typingMode));

    // ------- calculator -------
    function calc(){
      // 1) Read DOB from active mode
      let dobUTC;

      if (typingMode){
        const dt = parseDOBFromText(dobText?.value || '');
        if (!dt){ out.textContent = 'Please enter date as DD/MM/YYYY.'; return; }
        dobUTC = dt; // already UTC
      } else {
        const d = dobInput?.valueAsDate; // local midnight or null
        if (!d){ out.textContent = 'Please pick your date of birth.'; return; }
        dobUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      }

      // 2) Today at UTC midnight
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      if (dobUTC > todayUTC){
        out.textContent = 'That date is in the future.';
        return;
      }

      // 3) Megabirthday maths
      const lived  = daysBetweenUTC(dobUTC, todayUTC);
      const nextK  = Math.floor(lived / 1000) + 1;
      const target = addDaysUTC(dobUTC, nextK * 1000);
      const toGo   = daysBetweenUTC(todayUTC, target);
      const dayWord = (toGo === 1 ? 'day' : 'days');

      // 4) Output
      if (toGo === 0){
        out.innerHTML = `🎉 Today is your <strong>${ordinal(nextK)}</strong> megabirthday (${formatDateLongUK(target)}).`;
      } else if (toGo < 0){
        const nextNext = nextK + 1;
        const nxt      = addDaysUTC(dobUTC, nextNext * 1000);
        const nxtToGo  = daysBetweenUTC(todayUTC, nxt);
        const nxtDayWord = (nxtToGo === 1 ? 'day' : 'days');
        out.innerHTML = `Your <strong>${ordinal(nextNext)}</strong> megabirthday is on <strong>${formatDateLongUK(nxt)}</strong>. Just <strong>${nxtToGo}</strong> ${nxtDayWord} to go!`;
      } else {
        out.innerHTML = `Your <strong>${ordinal(nextK)}</strong> megabirthday is on <strong>${formatDateLongUK(target)}</strong>. Just <strong>${toGo}</strong> ${dayWord} to go!`;
      }
    }

    // wire up calculate actions
    btn?.addEventListener('click', (e) => { e.preventDefault(); calc(); });

    // read ?dob= from URL (if present), prefill & calculate, then clean URL
    try {
      const params = new URLSearchParams(location.search);
      const q = params.get('dob');
      if (q){
        // decide which mode based on format
        if (/^\d{4}-\d{2}-\d{2}$/.test(q)){       // ISO → picker
          if (dobInput){ dobInput.value = q; setMode(false); }
        } else {                                  // non-ISO → typing
          if (dobText){ dobText.value = q; setMode(true); }
        }
        calc();
        history.replaceState({}, '', location.pathname);
      }
    } catch(_) {}

    // expose for console debugging (optional)
    window.MB = Object.assign(window.MB || {}, { calc, setMode });
  });
})();
