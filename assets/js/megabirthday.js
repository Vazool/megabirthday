(() => {
  if (window.__MB_CALC_INIT__) return;
  window.__MB_CALC_INIT__ = true;

  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    const form = document.getElementById('mb-form');
    const dobInput = document.getElementById('dob');
    const btn = document.getElementById('calcBtn');
    const out = document.getElementById('result');

    // after: const out = document.getElementById('result');
    const dobText = document.getElementById('dobText');
    const typeToggle = document.getElementById('typeToggle');
    let typingMode = false; // false = using native <input type="date">

    // helper: convert ISO "yyyy-mm-dd" → "dd/mm/yyyy"
    function isoToUK(iso){
      const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`;
    }

    // Parse DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD → Date(UTC) or null
    function parseDOBFromText(s){
      if (!s) return null;
      s = s.trim();
      let m;
      // dd/mm/yyyy (or dd-mm-yyyy / dd.mm.yyyy)
      if ((m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/))){
        let d = +m[1], mo = +m[2], y = +m[3];
        if (y < 100) y += (y >= 50 ? 1900 : 2000);
        if (mo<1||mo>12||d<1||d>31) return null;
        const dt = new Date(Date.UTC(y, mo-1, d));
        if (dt.getUTCFullYear()!==y || dt.getUTCMonth()!==mo-1 || dt.getUTCDate()!==d) return null;
        return dt;
      }
      // yyyy-mm-dd
      if ((m = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/))){
        let y = +m[1], mo = +m[2], d = +m[3];
        if (mo<1||mo>12||d<1||d>31) return null;
        const dt = new Date(Date.UTC(y, mo-1, d));
        if (dt.getUTCFullYear()!==y || dt.getUTCMonth()!==mo-1 || dt.getUTCDate()!==d) return null;
        return dt;
      }
      return null;
    }  

    // Toggle typing mode
    typeToggle?.addEventListener('click', () => {
      typingMode = !typingMode;
      if (typingMode){
        // show text, hide native date
        dobText.classList.remove('mb-hide');
        dobInput.classList.add('mb-hide');
        // prefill from existing ISO value if present
        if (dobInput.value) dobText.value = isoToUK(dobInput.value);
        typeToggle.textContent = 'Use date picker';
        dobText.focus();
      } else {
      // show native date, hide text
      dobInput.classList.remove('mb-hide');
      dobText.classList.add('mb-hide');
      // try to carry across a typed value
      const dt = parseDOBFromText(dobText.value);
      if (dt){
        const iso = dt.toISOString().slice(0,10);
        dobInput.value = iso;
      }
      typeToggle.textContent = 'Prefer typing?';
      dobInput.focus();
    }
  });
    
    if (!dobInput || !out) return;

    // Prevent choosing a future date (sets max="YYYY-MM-DD")
    dobInput.max = new Date().toISOString().slice(0, 10);

    // --- hard stop: never let the form navigate the page ---
    form?.addEventListener('submit', (e) => e.preventDefault());

    // Extra guard: Enter in the date field should NOT submit the page
    dobInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); calc(); }
    });

    const MS_PER_DAY = 24*60*60*1000;

    function ordinal(n){
      const m100 = n % 100, m10 = n % 10;
      if (m100 >= 11 && m100 <= 13) return `${n}th`;
      return `${n}${({1:'st',2:'nd',3:'rd'})[m10] || 'th'}`;
    }
    function formatDateLongUK(dt){
      const months = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
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
      const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getDate());
      return new Date(base + n*MS_PER_DAY);
    }

function calc(){
  // 1) Get DOB as a UTC date, from whichever mode is active
  let dobUTC;

  if (typingMode){
    const dt = parseDOBFromText(dobText.value); // expects DD/MM/YYYY (or DD-MM-YYYY / YYYY-MM-DD)
    if (!dt){
      out.textContent = 'Please enter date as DD/MM/YYYY.';
      return;
    }
    dobUTC = dt; // parseDOBFromText already returns a UTC Date
  } else {
    const d = dobInput.valueAsDate;            // Date at local midnight or null
    if (!d){
      out.textContent = 'Please pick your date of birth.';
      return;
    }
    dobUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  // 2) Today at UTC midnight
  const now = new Date();
  const todayUTC = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
  ));

  if (dobUTC > todayUTC){
    out.textContent = 'That date is in the future.';
    return;
  }

  // 3) Megabirthday math
  const lived  = daysBetweenUTC(dobUTC, todayUTC);
  const nextK  = Math.floor(lived / 1000) + 1;
  const target = addDaysUTC(dobUTC, nextK * 1000);
  const toGo   = daysBetweenUTC(todayUTC, target);
  const dayWord = (toGo === 1 ? 'day' : 'days');

  // 4) Friendly UK output
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
   
    // Wire up click after guards
    btn?.addEventListener('click', (e) => { e.preventDefault(); calc(); });

    // If a dob=? is present in the URL (from an earlier submit), prefill & calculate
    try {
      const params = new URLSearchParams(location.search);
      const q = params.get('dob');
      if (q){
        dobInput.value = q;     // browser parses it for valueAsDate
        calc();
        // Optional: clean the URL (no reload)
        history.replaceState({}, '', location.pathname);
      }
    } catch(_) {}
    
    // Expose for debugging
    window.MB = Object.assign(window.MB || {}, { calc });
  });
})();
