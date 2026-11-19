//========================================================================
// leaderboard.js
//========================================================================
// Renders the public leaderboard on any page that contains
// <div id="leaderboard" data-src="...">. The staff script that runs once a
// day publishes the JSON file that data-src names; its format is described
// in the README of cornell-ece6765/ece6765-leaderboard.

(function () {
  "use strict";

  // The overall ranking first, then one ranking per public trace. A board
  // without a trace reads the overall score.
  var BOARDS = [
    { title: "Overall", trace: null },
    { title: "short-query-answerable", trace: "short-query-answerable" },
    { title: "long-query-answerable", trace: "long-query-answerable" },
    { title: "short-query-unanswerable", trace: "short-query-unanswerable" },
    { title: "long-query-unanswerable", trace: "long-query-unanswerable" },
  ];

  var OVERALL_COLUMNS = [
    { label: "Rank", numeric: true },
    { label: "Group", numeric: false },
    { label: "Score", numeric: true },
    { label: "Counted updates", numeric: true },
    { label: "Last counted update", numeric: false },
  ];

  var TRACE_COLUMNS = OVERALL_COLUMNS.slice(0, 3);

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

  function table(board, teams) {
    var columns = board.trace ? TRACE_COLUMNS : OVERALL_COLUMNS;
    var rows = teams
      .map(function (team) {
        return {
          team: team,
          score: board.trace ? number(team.traces[board.trace]) : team.score,
        };
      })
      .sort(function (a, b) {
        return (
          Number(b.team.reported) - Number(a.team.reported) ||
          b.score - a.score ||
          a.team.team.localeCompare(b.team.team)
        );
      });

    var element = document.createElement("table");
    var head = element.createTHead().insertRow();
    columns.forEach(function (column) {
      head.appendChild(cell("th", column.label, column.numeric));
    });

    var body = element.createTBody();
    var rank = 0;
    rows.forEach(function (row, index) {
      // Groups with equal scores share a rank; groups that have not
      // reported a valid update have none.
      if (index === 0 || row.score !== rows[index - 1].score) {
        rank = index + 1;
      }
      var line = body.insertRow();
      line.appendChild(cell("td", row.team.reported ? String(rank) : "", true));
      line.appendChild(cell("td", row.team.name, false));
      line.appendChild(cell("td", row.score.toFixed(2), true));
      if (!board.trace) {
        line.appendChild(cell("td", String(row.team.counted), true));
        line.appendChild(cell("td", row.team.lastCounted, false));
      }
    });

    // Match the markup that Material wraps around Markdown tables.
    var scroll = document.createElement("div");
    scroll.className = "md-typeset__scrollwrap";
    var wrap = document.createElement("div");
    wrap.className = "md-typeset__table";
    wrap.appendChild(element);
    scroll.appendChild(wrap);
    return scroll;
  }

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function render(root, data) {
    var entries = Array.isArray(data.teams) ? data.teams : [];
    // Schema 1 has no trace scores; show only the overall ranking then.
    var hasTraces = entries.some(function (team) {
      return isObject(team) && isObject(team.traces);
    });
    var teams = entries.map(function (team) {
      var counted = Math.max(0, Math.floor(number(team.counted_updates)));
      var score = number(team.score);
      return {
        name: String(team.name || team.team || ""),
        team: String(team.team || ""),
        score: score,
        traces: isObject(team.traces) ? team.traces : {},
        counted: counted,
        lastCounted: team.last_counted ? String(team.last_counted) : "",
        // Every valid update counts the first time, so a group with a
        // counted update has reported a score, even one that rounds to 0.
        reported: counted > 0 || score > 0,
      };
    });

    var updated = document.createElement("p");
    updated.textContent = "Last updated: " + formatTime(data.updated_at) + ".";
    var children = [updated];

    // The four trace rankings sit in a grid, two per row on a wide screen
    // and one per row on a narrow one.
    var grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(16rem, 1fr))";
    grid.style.columnGap = "1.5rem";

    BOARDS.forEach(function (board) {
      if (board.trace && !hasTraces) {
        return;
      }
      var title = document.createElement("h3");
      if (board.trace) {
        var code = document.createElement("code");
        code.textContent = board.trace;
        title.appendChild(code);
        var section = document.createElement("div");
        section.append(title, table(board, teams));
        grid.appendChild(section);
      } else {
        title.textContent = board.title;
        children.push(title, table(board, teams));
      }
    });
    if (grid.children.length) {
      children.push(grid);
    }

    root.replaceChildren.apply(root, children);
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
