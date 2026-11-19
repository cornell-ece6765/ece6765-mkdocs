//========================================================================
// leaderboard.js
//========================================================================
// Renders the public leaderboard on any page that contains
// <div id="leaderboard" data-src="...">. The staff script that runs once a
// day publishes the JSON file that data-src names; its format is described
// in the README of cornell-ece6765/ece6765-leaderboard.

(function () {
  "use strict";

  var COLUMNS = [
    { label: "Rank", numeric: true },
    { label: "Group", numeric: false },
    { label: "Score", numeric: true },
    { label: "Counted updates", numeric: true },
    { label: "Last counted update", numeric: false },
  ];

  function cell(tag, text, numeric) {
    var element = document.createElement(tag);
    element.textContent = text;
    if (numeric) {
      element.style.textAlign = "right";
    }
    return element;
  }

  function number(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function formatTime(iso) {
    var date = new Date(iso);
    if (!iso || isNaN(date.getTime())) {
      return "not yet";
    }
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function render(root, data) {
    var teams = (Array.isArray(data.teams) ? data.teams : []).map(function (team) {
      return {
        name: String(team.name || team.team || ""),
        team: String(team.team || ""),
        score: number(team.score),
        counted: Math.max(0, Math.floor(number(team.counted_updates))),
        lastCounted: team.last_counted ? String(team.last_counted) : "",
      };
    });

    teams.sort(function (a, b) {
      return b.score - a.score || a.team.localeCompare(b.team);
    });

    var updated = document.createElement("p");
    updated.textContent = "Last updated: " + formatTime(data.updated_at) + ".";

    var table = document.createElement("table");
    var head = table.createTHead().insertRow();
    COLUMNS.forEach(function (column) {
      head.appendChild(cell("th", column.label, column.numeric));
    });

    var body = table.createTBody();
    var rank = 0;
    teams.forEach(function (team, index) {
      // Groups with equal scores share a rank; groups without a score
      // have none.
      if (index === 0 || team.score !== teams[index - 1].score) {
        rank = index + 1;
      }
      var row = body.insertRow();
      row.appendChild(cell("td", team.score > 0 ? String(rank) : "", true));
      row.appendChild(cell("td", team.name, false));
      row.appendChild(cell("td", team.score.toFixed(2), true));
      row.appendChild(cell("td", String(team.counted), true));
      row.appendChild(cell("td", team.lastCounted, false));
    });

    // Match the markup that Material wraps around Markdown tables.
    var scroll = document.createElement("div");
    scroll.className = "md-typeset__scrollwrap";
    var wrap = document.createElement("div");
    wrap.className = "md-typeset__table";
    wrap.appendChild(table);
    scroll.appendChild(wrap);

    root.replaceChildren(updated, scroll);
  }

  function init() {
    var root = document.getElementById("leaderboard");
    if (!root) {
      return;
    }
    fetch(root.getAttribute("data-src"), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        render(root, data);
      })
      .catch(function () {
        root.textContent =
          "The leaderboard could not be loaded. Reload the page to try again.";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
