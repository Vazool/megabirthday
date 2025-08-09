(function () {
  function pad(n){ return n.toString().padStart(2,"0"); }

  function nextMegabirthday(dobDate){
    const MS_DAY = 24*60*60*1000;
    const today = new Date();
    const daysLived = Math.floor((today - dobDate) / MS_DAY);
    const nextK = Math.ceil((daysLived + 1) / 1000) * 1000; // next multiple of 1000
    const daysToGo = nextK - daysLived;
    const target = new Date(today.getTime() + daysToGo * MS_DAY);
    return { nextK, daysToGo, target };
  }

  function formatDate(dt){
    const y = dt.getFullYear();
    const m = pad(dt.getMonth() + 1);
    const d = pad(dt.getDate());
    return `${y}-${m}-${d}`;
  }

  function suffix(n){
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  }

  function onCalc(){
    const dob = document.getElementById("dob").value;
    const out = document.getElementById("result");
    if (!dob) { out.textContent = "Please choose a date of birth."; return; }
    const dobDate = new Date(dob + "T00:00:00");
    const { nextK, daysToGo, target } = nextMegabirthday(dobDate);
    const nth = nextK / 1000;
    out.innerHTML = `
      <p>Your next megabirthday is your <strong>${nth}${suffix(nth)}</strong> (day ${nextK}).</p>
      <p>Date: <strong>${formatDate(target)}</strong></p>
      <p>Countdown: <strong>${daysToGo} days</strong> to go.</p>
    `;
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("calc-btn");
    if (btn) btn.addEventListener("click", onCalc);
  });
})();
