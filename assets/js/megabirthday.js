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

    // Prevent choosing a future date (sets max="YYYY-MM-DD")
    if (dobInput) dobInput.max = new Date().toISOString().slice(0, 10);

    // If this page doesn't have the calculator, do nothing
    if (!dobInput || !out) return;

    const MS_PER_DAY = 24*60*60*1000;

    function ordinal(n){
      const m100 = n % 100, m10 = n % 10;
      if (m100 >= 11 && m100 <= 13) return `${n}th`;
      return `${n}${({1:'st',2:'nd',3:'rd'})[m10] || 'th'}`;
    }

    // NEW: "30th August 2027" (UTC-safe)
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
      const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      return new Date(base + n*MS_PER_DAY);
    }

    function calc(){
      // Use the browser-parsed Date from the <input type="date">
      const d = dobInput.valueAsDate;   // Date at local midnight or null
      if (!d){
        out.textContent = 'Please pick your date of birth.';
        return;
      }

      // Normalise DOB to UTC midnight (stable maths)
      const dobUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

      // Today at UTC midnight
      const now = new Date();
      const todayUTC = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
      ));

      if (dobUTC > todayUTC){
        out.textContent = 'That date is in the future.';
        return;
      }

      const lived  = daysBetweenUTC(dobUTC, todayUTC);
      const nextK  = Math.floor(lived / 1000) + 1;
      const target = addDaysUTC(dobUTC, nextK * 1000);
      const toGo   = daysBetweenUTC(todayUTC, target);
      const dayWord = (toGo === 1 ? 'day' : 'days');

      if (toGo === 0){
        out.innerHTML = `🎉 Today is your <strong>${ordinal(nextK)}</strong> megabirthday (${formatDateLongUK(target)}).`;
      } else if (toGo < 0){
