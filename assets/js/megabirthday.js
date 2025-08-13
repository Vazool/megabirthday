(() => {
  // prevent double-init if this file is included twice
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

    // If this page doesn't have the calculator, do nothing
    if (!dobInput || !out) return;

    const MS_PER_DAY = 24*60*60*1000;

    function toISODateUTC(d){
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth()+1).padStart(2,'0');
      const day = String(d.getUTCDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    }
    function ordinal(n){
      const m100 = n % 100, m10 = n % 10;
      if (m100 >= 11 && m100 <= 13) return `${n}th`;
      return `${n}${({1:'st',2:'nd',3:'rd'})[m10] || 'th'}`;
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

    function calc(){
      const val = dobInput.value;
      if (!val){
        out.textContent = 'Please pick your date of birth.';
        return;
      }
      const [y,m,day] = val.split('-').map(Number);
      const dob = new Date(Date.UTC(y, m-1, day));
      const now = new Date();
      const todayUTC = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
      ));
      if (dob > todayUTC){
        out.textContent = 'That date is in the future.';
        return;
      }

      const lived = daysBetweenUTC(dob, todayUTC);
      const nextK = Math.floor(lived/1000) + 1;
      const target = addDaysUTC(dob, nextK*1000);
      const toGo = daysBetweenUTC(todayUTC, target);

      if (toGo === 0){
        out.innerHTML = `🎉 Today is your <strong>${ordinal(nextK)}</strong> megabirthday (${toISODateUTC(target)}).`;
      } else if (toGo < 0){
        const nextNext = nextK + 1;
        const nxt = addDaysUTC(dob, nextNext*1000);
        const nxtToGo = daysBetweenUTC(todayUTC, nxt);
        out.innerHTML = `Your <strong>${ordinal(nextNext)}</strong> megabirthday is on <strong>${toISODateUTC(nxt)}</strong> (${nxtToGo} days).`;
      } else {
        out.innerHTML = `Your <strong>${ordinal(nextK)}</strong> megabirthday is on <strong>${toISODateUTC(target)}</strong>. Just <strong>${toGo}</strong> days to go.`;
      }
    }

    // Attach once
    form?.addEventListener('submit', (e) => { e.preventDefault(); calc(); });
    btn?.addEventListener('click', calc);
    dobInput.addEventListener('change', calc);

    // Optional: expose for debugging in console
    window.MB = Object.assign(window.MB || {}, { calc });
  });
})();
