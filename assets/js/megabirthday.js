(function () {
  // Helper to make a UTC date (avoids DST/timezone quirks)
  function makeUTCDate(y, m, d) {
    return new Date(Date.UTC(y, m, d));
  }

  // Parse yyyy-mm-dd from <input type="date"> safely into UTC
  function parseInputDate(value) {
    const [yyyy, mm, dd] = value.split("-").map(Number);
    if (!yyyy || !mm || !dd) return null;
    return makeUTCDate(yyyy, mm - 1, dd);
  }

  // Add N days in UTC
  function addDaysUTC(dateUTC, days) {
    const msPerDay = 24 * 60 * 60 * 1000;
    return new Date(dateUTC.getTime() + days * msPerDay);
  }

  // Difference in whole days between two UTC dates
  function diffDaysUTC(aUTC, bUTC) {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((aUTC - bUTC) / msPerDay);
  }

  // Format to UK date
  function formatUK(dateUTC) {
    return dateUTC.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  const form = document.getElementById("mb-form");
  const result = document.getElementById("result");

  if (!form || !result) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const dobInput = document.getElementById("dob");
    const dob = parseInputDate(dobInput.value);
    if (!dob) {
      result.textContent = "Please enter a valid date of birth.";
      return;
    }

    const today = makeUTCDate(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    );

    const livedDays = diffDaysUTC(today, dob); // days since DOB
    const nextIndex = Math.floor(livedDays / 1000) + 1; // next 1000-day index
    const nextDate = addDaysUTC(dob, nextIndex * 1000);
    const daysUntil = diffDaysUTC(nextDate, today);

    result.innerHTML = `
      <p>Your next megabirthday is your <strong>${ordinal(nextIndex * 1000)}</strong> day</p>
      <p><strong>${formatUK(nextDate)}</strong> (${daysUntil} days to go)</p>
    `;
  });
})();
