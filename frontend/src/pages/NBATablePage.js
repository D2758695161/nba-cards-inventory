import React, { useEffect, useRef } from "react";
import nbaCardsData from "../data/nbaCardsData";

const NBATablePage = () => {
  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);

  useEffect(() => {
    // Load Tabulator CDN if not already loaded
    const loadTabulator = () => {
      return new Promise((resolve) => {
        if (window.Tabulator) {
          resolve();
          return;
        }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/tabulator-tables@5.5.0/dist/css/tabulator.min.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/tabulator-tables@5.5.0/dist/js/tabulator.min.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    const initTable = async () => {
      await loadTabulator();

      if (!window.Tabulator || !tableRef.current) return;

      // Destroy existing table
      if (tabulatorRef.current) {
        tabulatorRef.current.destroy();
      }

      // PSA Grade color formatter
      const psaColorFormatter = (cell) => {
        const grade = cell.getValue();
        const colors = {
          10: "#00ff88",
          9: "#00ccff",
          8: "#ffcc00",
          7: "#ff9900",
          6: "#ff6600",
        };
        const color = colors[grade] || "#aaaaaa";
        return `<span style="
          background: ${color}22;
          color: ${color};
          border: 1px solid ${color};
          border-radius: 4px;
          padding: 2px 8px;
          font-weight: bold;
          font-size: 12px;
        ">PSA ${grade}</span>`;
      };

      // Rookie badge formatter
      const rookieFormatter = (cell) => {
        const isRookie = cell.getValue();
        if (isRookie) {
          return `<span style="
            background: linear-gradient(135deg, #ff00ff22, #00ffff22);
            color: #ff00ff;
            border: 1px solid #ff00ff;
            border-radius: 4px;
            padding: 2px 8px;
            font-weight: bold;
            font-size: 11px;
            text-shadow: 0 0 6px #ff00ff;
          ">馃弨 RC</span>`;
        }
        return `<span style="color: #555;">鈥?/span>`;
      };

      // Player name formatter with team color accent
      const playerFormatter = (cell) => {
        const data = cell.getRow().getData();
        return `<div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#e0e0ff;font-weight:600;font-size:14px;">${data.playerName}</span>
        </div>`;
      };

      // Value formatter with $ and commas
      const valueFormatter = (cell) => {
        const val = cell.getValue();
        if (!val) return "鈥?;
        return `<span style="color:#00ff88;font-weight:600;">$${val.toLocaleString()}</span>`;
      };

      // Team badge
      const teamFormatter = (cell) => {
        const teamColors = {
          "Cleveland Cavaliers": "#860038",
          "Chicago Bulls": "#ce1141",
          "Golden State Warriors": "#006bb6",
          "Los Angeles Lakers": "#552583",
          "San Antonio Spurs": "#c4ced4",
          "Seattle SuperSonics": "#005ca5",
          "Milwaukee Bucks": "#004200",
          "Dallas Mavericks": "#00538c",
          "New Orleans Pelicans": "#002b5c",
          "Memphis Grizzlies": "#5d76a9",
          "Portland Trail Blazers": "#e13a3e",
          "Minnesota Timberwolves": "#0c2340",
          "Boston Celtics": "#007a33",
          "Toronto Raptors": "#ce1141",
        };
        const team = cell.getValue();
        const color = teamColors[team] || "#888";
        return `<span style="
          background: ${color}33;
          color: ${color};
          border-radius: 3px;
          padding: 2px 6px;
          font-size: 11px;
        ">${team}</span>`;
      };

      // Year + Brand combined
      const yearBrandFormatter = (cell) => {
        const data = cell.getRow().getData();
        return `<div>
          <div style="color:#ffd700;font-size:13px;">${data.year}</div>
          <div style="color:#aaa;font-size:11px;">${data.brand}</div>
        </div>`;
      };

      tabulatorRef.current = new window.Tabulator(tableRef.current, {
        data: nbaCardsData,
        layout: "fitDataFill",
        responsiveLayout: "collapse",
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [5, 10, 20, 50],
        paginationCounter: "rows",
        movableColumns: true,
        headerFilterPlaceholder: "Search...",

        initialSort: [
          { column: "gradedValue", dir: "desc" },
        ],

        columnDefaults: {
          headerFilter: true,
          headerSortTristate: true,
        },

        columns: [
          {
            title: "Player",
            field: "playerName",
            width: 180,
            formatter: playerFormatter,
            headerFilter: "input",
            headerSort: true,
          },
          {
            title: "Team",
            field: "team",
            width: 200,
            formatter: teamFormatter,
            headerFilter: "list",
            headerFilterParams: {
              values: nbaCardsData.map((c) => c.team).filter((v, i, a) => a.indexOf(v) === i),
              clearable: true,
            },
            headerSort: true,
          },
          {
            title: "Year / Brand",
            field: "year",
            width: 150,
            formatter: yearBrandFormatter,
            headerSort: true,
            sorter: "number",
          },
          {
            title: "Rookie",
            field: "rookieCard",
            width: 80,
            formatter: rookieFormatter,
            headerFilter: "select",
            headerFilterParams: {
              values: { true: "RC", false: "Non-RC" },
            },
            headerSort: true,
          },
          {
            title: "PSA Grade",
            field: "psaGrade",
            width: 110,
            formatter: psaColorFormatter,
            headerFilter: "select",
            headerFilterParams: {
              values: { 10: "PSA 10", 9: "PSA 9", 8: "PSA 8", 7: "PSA 7" },
            },
            headerSort: true,
            sorter: "number",
          },
          {
            title: "Graded Value",
            field: "gradedValue",
            width: 150,
            formatter: valueFormatter,
            headerSort: true,
            sorter: "number",
            bottomCalc: "sum",
            bottomCalcFormatter: (val) =>
              `<span style="color:#00ff88;font-weight:bold;">Total: $${val.toLocaleString()}</span>`,
          },
        ],

        // Custom row styling
        rowFormatter: (row) => {
          const data = row.getData();
          if (data.rookieCard) {
            row.getElement().style.backgroundColor = "rgba(255,0,255,0.04)";
            row.getElement().style.borderLeft = "3px solid #ff00ff";
          } else {
            row.getElement().style.borderLeft = "3px solid transparent";
          }
        },

        // Table theme via class
        tableClass: "tabulator-table-dark",

        // Lang for custom text
        langs: {
          default: {
            pagination: {
              first: "芦",
              last: "禄",
              prev: "鈥?,
              next: "鈥?,
              info: "Showing $1鈥?2 of $3 cards",
              per_page: "Per page:",
              page_size: "Page Size",
            },
          },
        },
      });

      // Custom CSS injection
      const style = document.createElement("style");
      style.textContent = `
        /* Tabulator Cyberpunk Dark Theme */
        .tabulator-table-dark {
          background: #0a0a0f !important;
        }

        #nba-table-wrap .tabulator {
          background: #0d0d1a !important;
          border: 1px solid #1a1a3a !important;
          border-radius: 12px !important;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', sans-serif !important;
          box-shadow: 0 0 40px rgba(0, 255, 136, 0.05), 0 0 80px rgba(255, 0, 255, 0.03);
        }

        #nba-table-wrap .tabulator-header {
          background: linear-gradient(180deg, #12122a 0%, #0d0d1a 100%) !important;
          border-bottom: 2px solid #ff00ff44 !important;
          padding: 12px 0 !important;
        }

        #nba-table-wrap .tabulator-header .tabulator-col {
          background: transparent !important;
          border-right: 1px solid #1a1a3a !important;
          color: #e0e0ff !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          padding: 8px 10px !important;
        }

        #nba-table-wrap .tabulator-header .tabulator-col:hover {
          background: #1a1a3a !important;
          color: #ff00ff !important;
        }

        #nba-table-wrap .tabulator-header .tabulator-col-sortable:hover {
          cursor: pointer;
        }

        #nba-table-wrap .tabulator-table {
          background: #0a0a0f !important;
          color: #c0c0d0 !important;
        }

        #nba-table-wrap .tabulator-row {
          background: #0d0d1a !important;
          border-bottom: 1px solid #1a1a2e !important;
          transition: all 0.2s ease !important;
        }

        #nba-table-wrap .tabulator-row:nth-child(even) {
          background: #0f0f22 !important;
        }

        #nba-table-wrap .tabulator-row:hover {
          background: #1a1a3a !important;
          color: #ffffff !important;
        }

        #nba-table-wrap .tabulator-cell {
          padding: 10px 10px !important;
          border-right: 1px solid #1a1a2e !important;
          vertical-align: middle !important;
        }

        #nba-table-wrap .tabulator-footer {
          background: #0d0d1a !important;
          border-top: 2px solid #00ff8833 !important;
          color: #aaa !important;
          padding: 12px 16px !important;
        }

        #nba-table-wrap .tabulator-paginator {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
        }

        #nba-table-wrap .tabulator-paginator button {
          background: #1a1a3a !important;
          border: 1px solid #2a2a4a !important;
          color: #e0e0ff !important;
          border-radius: 6px !important;
          padding: 5px 10px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          font-size: 13px !important;
        }

        #nba-table-wrap .tabulator-paginator button:hover:not(:disabled) {
          background: #ff00ff22 !important;
          border-color: #ff00ff !important;
          color: #ff00ff !important;
          box-shadow: 0 0 8px #ff00ff44 !important;
        }

        #nba-table-wrap .tabulator-paginator button.active {
          background: #00ff8822 !important;
          border-color: #00ff88 !important;
          color: #00ff88 !important;
          box-shadow: 0 0 8px #00ff8844 !important;
        }

        #nba-table-wrap .tabulator-paginator button:disabled {
          opacity: 0.3 !important;
          cursor: not-allowed !important;
        }

        #nba-table-wrap .tabulator-page-size {
          background: #1a1a3a !important;
          border: 1px solid #2a2a4a !important;
          color: #e0e0ff !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
        }

        /* Header filter inputs */
        #nba-table-wrap .tabulator-header-filter input {
          background: #0a0a1a !important;
          border: 1px solid #2a2a4a !important;
          color: #e0e0ff !important;
          border-radius: 4px !important;
          padding: 3px 6px !important;
          font-size: 11px !important;
          width: 100% !important;
        }

        #nba-table-wrap .tabulator-header-filter input:focus {
          outline: none !important;
          border-color: #00ff88 !important;
          box-shadow: 0 0 6px #00ff8844 !important;
        }

        #nba-table-wrap .tabulator-header-filter select {
          background: #0a0a1a !important;
          border: 1px solid #2a2a4a !important;
          color: #e0e0ff !important;
          border-radius: 4px !important;
          font-size: 11px !important;
        }

        /* Sort arrows */
        #nba-table-wrap .tabulator-arrow {
          border-color: #ff00ff transparent transparent transparent !important;
        }

        /* Scrollbar */
        #nba-table-wrap .tabulator-table::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        #nba-table-wrap .tabulator-table::-webkit-scrollbar-track {
          background: #0a0a0f;
        }
        #nba-table-wrap .tabulator-table::-webkit-scrollbar-thumb {
          background: #2a2a4a;
          border-radius: 3px;
        }

        /* Column resize handle */
        #nba-table-wrap .tabulator-col-resize-handle {
          background: #ff00ff44 !important;
        }
      `;
      document.head.appendChild(style);
    };

    initTable();

    return () => {
      if (tabulatorRef.current) {
        try {
          tabulatorRef.current.destroy();
        } catch (e) {}
      }
    };
  }, []);

  const handleExportCSV = () => {
    if (tabulatorRef.current) {
      tabulatorRef.current.download("csv", "nba-cards-export.csv");
    }
  };

  const handleExportJSON = () => {
    if (tabulatorRef.current) {
      tabulatorRef.current.download("json", "nba-cards-export.json");
    }
  };

  const totalValue = nbaCardsData.reduce((sum, c) => sum + c.gradedValue, 0);
  const rookieCount = nbaCardsData.filter((c) => c.rookieCard).length;
  const psa10Count = nbaCardsData.filter((c) => c.psaGrade === 10).length;

  return (
    <div style={{ background: "#070710", minHeight: "100vh", padding: "24px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Hero Header */}
      <div style={{
        textAlign: "center",
        marginBottom: "32px",
        padding: "32px 24px",
        background: "linear-gradient(135deg, #0d0d1a 0%, #1a0a2a 50%, #0a1a2a 100%)",
        borderRadius: "16px",
        border: "1px solid #ff00ff33",
        boxShadow: "0 0 60px rgba(255,0,255,0.1), 0 0 120px rgba(0,255,136,0.05)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background grid lines */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(#ff00ff 1px, transparent 1px), linear-gradient(90deg, #ff00ff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: "11px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#ff00ff",
            marginBottom: "8px",
            textShadow: "0 0 10px #ff00ff88",
          }}>
            NBA Cards Inventory 路 $1,000 Platform
          </div>
          <h1 style={{
            fontSize: "36px",
            fontWeight: "900",
            background: "linear-gradient(90deg, #ff00ff, #00ffff, #00ff88)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "12px",
            textShadow: "none",
          }}>
            馃弨 NBA Cards Table
          </h1>
          <p style={{ color: "#8080a0", fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
            Interactive Tabulator.js table with cyberpunk dark theme. Sort, filter, search, and export your collection.
          </p>

          {/* Stats row */}
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "24px", flexWrap: "wrap" }}>
            {[
              { label: "Total Cards", value: nbaCardsData.length, color: "#e0e0ff" },
              { label: "Rookie Cards", value: rookieCount, color: "#ff00ff" },
              { label: "PSA 10s", value: psa10Count, color: "#00ff88" },
              { label: "Total Value", value: `$${totalValue.toLocaleString()}`, color: "#ffd700" },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #2a2a4a",
                borderRadius: "8px",
                padding: "10px 20px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "22px", fontWeight: "800", color: stat.color, textShadow: `0 0 10px ${stat.color}66` }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          onClick={handleExportCSV}
          style={{
            background: "linear-gradient(135deg, #1a1a3a, #2a1a4a)",
            border: "1px solid #ff00ff66",
            color: "#ff00ff",
            borderRadius: "8px",
            padding: "8px 18px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            transition: "all 0.2s",
            boxShadow: "0 0 12px #ff00ff22",
          }}
          onMouseOver={(e) => { e.target.style.boxShadow = "0 0 20px #ff00ff44"; e.target.style.borderColor = "#ff00ff"; }}
          onMouseOut={(e) => { e.target.style.boxShadow = "0 0 12px #ff00ff22"; e.target.style.borderColor = "#ff00ff66"; }}
        >
          馃摜 Export CSV
        </button>
        <button
          onClick={handleExportJSON}
          style={{
            background: "linear-gradient(135deg, #1a1a3a, #1a2a2a)",
            border: "1px solid #00ff8866",
            color: "#00ff88",
            borderRadius: "8px",
            padding: "8px 18px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            transition: "all 0.2s",
            boxShadow: "0 0 12px #00ff8822",
          }}
          onMouseOver={(e) => { e.target.style.boxShadow = "0 0 20px #00ff8844"; e.target.style.borderColor = "#00ff88"; }}
          onMouseOut={(e) => { e.target.style.boxShadow = "0 0 12px #00ff8822"; e.target.style.borderColor = "#00ff8866"; }}
        >
          馃摜 Export JSON
        </button>
      </div>

      {/* Table Container */}
      <div id="nba-table-wrap" style={{
        background: "#0d0d1a",
        borderRadius: "12px",
        border: "1px solid #1a1a3a",
        overflow: "hidden",
        boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
      }}>
        <div ref={tableRef} style={{ width: "100%" }} />
      </div>

      {/* Legend */}
      <div style={{
        marginTop: "20px",
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        fontSize: "12px",
        color: "#666",
        justifyContent: "center",
      }}>
        <span>馃弨 <strong style={{ color: "#ff00ff" }}>RC</strong> = Rookie Card (highlighted row)</span>
        <span>馃煝 <strong style={{ color: "#00ff88" }}>PSA 10</strong> = Gem Mint</span>
        <span>馃數 <strong style={{ color: "#00ccff" }}>PSA 9</strong> = Mint</span>
        <span>馃煛 <strong style={{ color: "#ffcc00" }}>PSA 8</strong> = Near Mint</span>
        <span>猬囷笍 Click column headers to sort</span>
        <span>馃攳 Type in header fields to filter</span>
      </div>
    </div>
  );
};

export default NBATablePage;
