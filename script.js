// Wait for DOMContentLoaded so elements exist before accessing them
document.addEventListener("DOMContentLoaded", function () {
  const capacity = 50;

  const attendeeCountEl = document.getElementById("attendeeCount");
  const progressBar = document.getElementById("progressBar");
  const form = document.getElementById("checkInForm");
  const nameInput = document.getElementById("attendeeName");
  const teamSelect = document.getElementById("teamSelect");
  const greeting = document.getElementById("greeting");

  // Track attendance
  let totalCount =
    parseInt(attendeeCountEl && attendeeCountEl.textContent, 10) || 0;

  // Update the attendee count display and progress bar
  function updateAttendeeCountDisplay() {
    if (attendeeCountEl) {
      attendeeCountEl.textContent = `${totalCount}`;
    }
    if (progressBar) {
      const percent = Math.min(100, Math.round((totalCount / capacity) * 100));
      progressBar.style.width = `${percent}%`;
    }
  }

  // Add: localStorage keys and helpers
  const LS_KEYS = {
    total: "totalCount",
    water: "waterCount",
    zero: "zeroCount",
    power: "powerCount",
    attendees: "attendees", // NEW: list of attendee objects
  };

  // NEW: in-memory attendee list
  let attendees = [];

  // NEW: map team value to label with emoji (matches design)
  function getTeamLabel(teamValue) {
    if (teamValue === "water") {
      return "🌊 Team Water Wise";
    }
    if (teamValue === "zero") {
      return "🌿 Team Net Zero";
    }
    if (teamValue === "power") {
      return "⚡ Team Renewables";
    }
    return "Unknown Team";
  }

  // NEW: load and save attendees to localStorage
  function loadAttendees() {
    const raw = localStorage.getItem(LS_KEYS.attendees);
    if (!raw) {
      attendees = [];
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      attendees = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      attendees = [];
    }
  }

  function saveAttendees() {
    try {
      localStorage.setItem(LS_KEYS.attendees, JSON.stringify(attendees));
    } catch (e) {
      // ignore storage errors
    }
  }

  // NEW: ensure the attendee list section exists under the team counters
  function ensureAttendeeListSection() {
    var section = document.getElementById("attendeeListSection");
    if (section) {
      var ulExisting = section.querySelector("ul");
      if (ulExisting) {
        return ulExisting;
      }
    }

    var teamStats = document.querySelector(".team-stats");
    if (!teamStats) {
      return null;
    }

    section = document.createElement("div");
    section.id = "attendeeListSection";
    section.className = "attendee-list";

    var title = document.createElement("h3");
    title.textContent = "Attendees";

    var list = document.createElement("ul");
    list.id = "attendeeList";

    section.appendChild(title);
    section.appendChild(list);

    // Insert section directly after the team-stats block
    if (teamStats.parentNode) {
      teamStats.parentNode.insertBefore(section, teamStats.nextSibling);
    }

    return list;
  }

  // NEW: render attendees
  function renderAttendeesList() {
    var list = ensureAttendeeListSection();
    if (!list) {
      return;
    }
    // Clear current items
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    // Add items
    for (let i = 0; i < attendees.length; i++) {
      var item = attendees[i];
      var li = document.createElement("li");

      var nameSpan = document.createElement("span");
      nameSpan.className = "attendee-name";
      nameSpan.textContent = item.name;

      var sep = document.createTextNode(" – ");

      var teamSpan = document.createElement("span");
      teamSpan.className = "attendee-team";
      teamSpan.textContent = getTeamLabel(item.team);

      li.appendChild(nameSpan);
      li.appendChild(sep);
      li.appendChild(teamSpan);
      list.appendChild(li);
    }
  }

  // Initialize from localStorage (fallbacks handled inside)
  function loadCounts() {
    const savedTotal = parseInt(localStorage.getItem(LS_KEYS.total), 10);
    if (!isNaN(savedTotal) && savedTotal >= 0) {
      totalCount = savedTotal;
    }

    const waterEl = document.getElementById("waterCount");
    const zeroEl = document.getElementById("zeroCount");
    const powerEl = document.getElementById("powerCount");

    const savedWater = parseInt(localStorage.getItem(LS_KEYS.water), 10);
    const savedZero = parseInt(localStorage.getItem(LS_KEYS.zero), 10);
    const savedPower = parseInt(localStorage.getItem(LS_KEYS.power), 10);

    if (waterEl) {
      const value =
        !isNaN(savedWater) && savedWater >= 0
          ? savedWater
          : parseInt(waterEl.textContent, 10) || 0;
      waterEl.textContent = `${value}`;
    }
    if (zeroEl) {
      const value =
        !isNaN(savedZero) && savedZero >= 0
          ? savedZero
          : parseInt(zeroEl.textContent, 10) || 0;
      zeroEl.textContent = `${value}`;
    }
    if (powerEl) {
      const value =
        !isNaN(savedPower) && savedPower >= 0
          ? savedPower
          : parseInt(powerEl.textContent, 10) || 0;
      powerEl.textContent = `${value}`;
    }

    updateAttendeeCountDisplay();
  }

  function saveCounts() {
    localStorage.setItem(LS_KEYS.total, String(totalCount));
    const waterEl = document.getElementById("waterCount");
    const zeroEl = document.getElementById("zeroCount");
    const powerEl = document.getElementById("powerCount");
    if (waterEl) {
      localStorage.setItem(LS_KEYS.water, waterEl.textContent || "0");
    }
    if (zeroEl) {
      localStorage.setItem(LS_KEYS.zero, zeroEl.textContent || "0");
    }
    if (powerEl) {
      localStorage.setItem(LS_KEYS.power, powerEl.textContent || "0");
    }
  }

  // Increment the selected team's counter
  function incrementTeamCount(team) {
    const idMap = {
      water: "waterCount",
      zero: "zeroCount",
      power: "powerCount",
    };
    const teamCountId = idMap[team];
    if (!teamCountId) {
      return;
    }
    const el = document.getElementById(teamCountId);
    if (!el) {
      return;
    }
    const current = parseInt(el.textContent, 10) || 0;
    el.textContent = `${current + 1}`;
  }

  // Helper: find current winning team(s) by count
  function getWinningTeams() {
    const teams = [
      { id: "waterCount", name: "Team Water Wise" },
      { id: "zeroCount", name: "Team Net Zero" },
      { id: "powerCount", name: "Team Renewables" },
    ];

    let max = 0;
    let winners = [];

    for (let i = 0; i < teams.length; i++) {
      const el = document.getElementById(teams[i].id);
      const count = parseInt(el && el.textContent, 10) || 0;

      if (count > max) {
        max = count;
        winners = [teams[i].name];
      } else if (count === max) {
        winners.push(teams[i].name);
      }
    }

    return winners;
  }

  // Handle form submission
  function handleSubmit(event) {
    event.preventDefault();

    if (!nameInput || !teamSelect) {
      return;
    }

    const name = nameInput.value.trim();
    const team = teamSelect.value;
    const teamName = teamSelect.options[teamSelect.selectedIndex].text;

    if (name === "" || team === "") {
      if (greeting) {
        greeting.textContent = "Please enter a name and select a team.";
      }
      return;
    }

    if (totalCount >= capacity) {
      if (greeting) {
        greeting.textContent =
          "Capacity reached. Cannot check in more attendees.";
      }
      return;
    }

    // Increment count
    totalCount += 1;
    updateAttendeeCountDisplay();
    incrementTeamCount(team);
    // Persist counts after any change
    saveCounts();

    // NEW: store attendee and update list
    attendees.push({ name: name, team: team });
    saveAttendees();
    renderAttendeesList();

    // Celebration when goal is reached
    if (totalCount === capacity) {
      if (greeting) {
        const winners = getWinningTeams();
        if (winners.length === 1) {
          greeting.textContent = `🎉 Goal reached! Congratulations to ${winners[0]}!`;
        } else {
          greeting.textContent = `🎉 Goal reached! It's a tie between ${winners.join(
            " and "
          )}!`;
        }
      }
    } else {
      // Show welcome message
      if (greeting) {
        greeting.textContent = `Welcome, ${name} from ${teamName}!`;
      }
    }

    form.reset();
    nameInput.focus();
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  // Public helpers in case other scripts need to adjust the count
  window.setAttendeeCount = function (newCount) {
    const n = Number(newCount);
    if (!isNaN(n) && n >= 0) {
      totalCount = n;
      updateAttendeeCountDisplay();
      // Persist when manually setting the count
      saveCounts();
    }
  };

  window.incrementAttendeeCount = function (step) {
    const inc = Number(step) || 1;
    totalCount += inc;
    updateAttendeeCountDisplay();
    // Persist when manually incrementing the count
    saveCounts();
  };

  // Initialize from localStorage (fallbacks handled inside)
  loadCounts();
  // NEW: load and render attendees on startup
  loadAttendees();
  renderAttendeesList();
});
