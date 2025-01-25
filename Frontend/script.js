document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("printerInfo");
  const noErrorsMessage = document.getElementById("no-errors-message");
  const summaryContainer = document.getElementById("printerSummary");
  const searchBox = document.getElementById("searchBox");
  const clearButton = document.getElementById("clearButton");
  const searchContainer = document.querySelector(".search-container");

  let showAllPrinters = false;
  const expandedPrinters = new Set();

  searchContainer.classList.add("hidden");

  const criticalErrors = new Set([
    "Error fetching errors",
    "Papirstopp",
    "Tom:",
    "stifter",
    "Fyll på",
    "Deksel åpent",
    "Empty:",
    "Cover open",
    "Replace",
    "40132",
    "40133",
    "40134",
    "40135",
    "40010",
    "40011",
    "40012",
    "40013",
    "40014",
    "40015",
    "40300",
    "40341",
    "40490",
    "40800",
    "40540",
    "40100",
    "40241",
    "340101"
  ]);

  const warningErrors = new Set([
    "Nesten",
    "Forbred",
    "Finner ikke:",
    "Almost out",
    "Preparing",
    "Not found:",
    "10032",
    "10072",
    "10073",
    "10074",
    "10075",
    "30609",
    "30427",
    "30722",
    "30743",
    "42000",
    "42001",
    "42009"
  ]);

  const errorTranslations = new Map([
    ["Ring service:", "Ring service: "],
    ["Tomt for papir: magasin", "Tomt for papir i magasin"],
    ["Finner ikke: magasin", "Finner ikke magasin"],
    ["Empty:", "Tom:"],
    ["Cover open", "Deksel åpent"],
    ["Almost out", "Nesten tom"],
    ["Not found:", "Finner ikke:"],
    ["Preparing", "Forbereder"],
    ["Out of paper", "Tom for papir"],
    ["brukt toner", "waste toner"],
    ["skriverkassett", "tonerkasett"],
    ["Error fetching errors", "Frakoblet?"]
  ]);

  const translateError = (error) => {
  let translatedError = error;
  for (const [from, to] of errorTranslations) {
    translatedError = translatedError.split(from).join(to);
  }
  return translatedError;
};


  const fetchPrinterData = () => {
    const currentSearchTerm = searchBox.value.toLowerCase();
    
    fetch("printer_data.json", { headers: { 'Content-Type': 'application/json; charset=UTF-8' } })
      .then((response) => response.json())
      .then((printerData) => {
        const scrollPosition = window.scrollY;
        const expandedStates = {};
        Array.from(container.children).forEach(printer => {
          const printerName = printer.querySelector('h2').textContent;
          expandedStates[printerName] = printer.classList.contains('expanded');
        });

        container.innerHTML = "";

        const printersWithCriticalError = [];
        const printersWithWarning = [];
        const printersWithNoError = [];

        printerData.forEach((printer) => {
          const hasWarning = printer.Errors.some(error =>
            Array.from(warningErrors).some(str => error.toLowerCase().includes(str.toLowerCase()))
          );

          const hasCriticalError = printer.Errors.some(error =>
            Array.from(criticalErrors).some(str => error.toLowerCase().includes(str.toLowerCase()))
          );

          if (!hasCriticalError && !hasWarning && !showAllPrinters) {
            return;
          }

          const printerDiv = document.createElement("div");
          printerDiv.className = "printer";

          if (expandedPrinters.has(printer.IP)) {
            printerDiv.classList.add("expanded");
          }

          if (hasCriticalError) {
            printerDiv.classList.add("pulsate-error");
            printersWithCriticalError.push(printerDiv);
          } else if (hasWarning) {
            printerDiv.classList.add("pulsate-warning");
            printersWithWarning.push(printerDiv);
          } else {
            printersWithNoError.push(printerDiv);
          }

          const inkLevelsHtml = `
            <div class="ink-level-bar-container">
              <span class="ink-level-percentage">Sort: ${printer["Ink Levels"][0]}</span>
              <div class="ink-level-bar ink-black" style="--ink-percentage: ${parseFloat(printer["Ink Levels"][0])}"></div>
            </div>
            <div class="ink-level-bar-container">
              <span class="ink-level-percentage">Cyan: ${printer["Ink Levels"][2]}</span>
              <div class="ink-level-bar ink-cyan" style="--ink-percentage: ${parseFloat(printer["Ink Levels"][2])}"></div>
            </div>
            <div class="ink-level-bar-container">
              <span class="ink-level-percentage">Magenta: ${printer["Ink Levels"][3]}</span>
              <div class="ink-level-bar ink-magenta" style="--ink-percentage: ${parseFloat(printer["Ink Levels"][3])}"></div>
            </div>
            <div class="ink-level-bar-container">
              <span class="ink-level-percentage">Gul: ${printer["Ink Levels"][4]}</span>
              <div class="ink-level-bar ink-yellow" style="--ink-percentage: ${parseFloat(printer["Ink Levels"][4])}"></div>
            </div>
          `;

          const trayCountersHtml = printer["Tray Information"].slice(0, -1).map((count, index) => {
            let countClass = "";
            let answer = count;
            let showArk = true;

            if (count == -3) {
              answer = "Har";
            } else if (count == -2) {
              answer = "Finner ikke magasin";
              countClass = "almostempty";
              showArk = false;
            } else if (answer == 0) {
              countClass = "empty";
            } else if (answer < 56) {
              countClass = "almostempty";
            }

            return `
              <div class="tray-counter ${countClass}">
                <strong>Skuff ${index + 1}:</strong> ${answer} ${showArk ? "ark" : ""}
              </div>
            `;
          }).join("");

          let imagePath = `images/${printer.Model}.png`;
          if (printer.Model === "Error fetching model") {
            imagePath = `images/missing.png`;
          }

          printerDiv.innerHTML = `
            <div class="printer-icon" style="background-image: url('${imagePath}');"></div>
            <h2>${printer.Name} (${printer.Model})</h2>
            <div class="details">
              <div class="printer-info">
                <div class="printer-ip-sn">
                  <div><strong>IP:</strong> <a href="http://${printer.IP}" target="_blank" class="printer-ip">${printer.IP}</a></div>
                  <div><strong>S/N:</strong> <span class="printer-serial" 
                    onmouseover="if(!this.dataset.wascopied) this.classList.add('show-tooltip')" 
                    onmouseout="this.classList.remove('show-tooltip')" 
                    onclick="this.classList.remove('show-tooltip'); this.dataset.wascopied = 'true'; this.classList.add('copied'); setTimeout(() => { this.classList.remove('copied'); delete this.dataset.wascopied; }, 1000); navigator.clipboard.writeText(this.textContent)">${printer.Serial || "N/A"}</span></div>
                </div>
                <div class="toner-section"><strong>Tonernivå:</strong>${inkLevelsHtml}</div>
                <div class="tray-section"><strong>Papirmengde:</strong>${trayCountersHtml}</div>
                <div class="updated"><strong>Sist oppdatert:</strong> ${formatDate(printer.Time)}</div>
              </div>
            </div>
            <ul class="errors-list">
              ${(() => {
                const errorGroups = {
                  critical: [],
                  warning: [],
                  normal: []
                };

                printer.Errors.forEach(error => {
                  const baseError = error.replace(/\s*\{[^\}]+\}\s*$/, '');
                  const errorCode = (error.match(/\{([^\}]+)\}/) || [])[1] || '';
                  const errorText = `${translateError(baseError)}${errorCode ? ` {${errorCode}}` : ''}`;

                  if (Array.from(criticalErrors).some(str => error.includes(str))) {
                    errorGroups.critical.push(errorText);
                  } else if (Array.from(warningErrors).some(str => error.includes(str))) {
                    errorGroups.warning.push(errorText);
                  } else {
                    errorGroups.normal.push(errorText);
                  }
                });

                return [
                  ...errorGroups.critical.map(error => `<li class="critical-error">${error}</li>`),
                  ...errorGroups.warning.map(error => `<li class="warning-error">${error}</li>`),
                  ...errorGroups.normal.map(error => `<li>${error}</li>`)
                ].join('');
              })()}
            </ul>
          `;

          printerDiv.addEventListener("click", () => {
            printerDiv.classList.toggle("expanded");
            if (printerDiv.classList.contains("expanded")) {
              expandedPrinters.add(printer.IP);
            } else {
              expandedPrinters.delete(printer.IP);
            }
          });

          const wasExpanded = expandedStates[`${printer.Name} (${printer.Model})`];
          if (wasExpanded) {
            printerDiv.classList.add("expanded");
            expandedPrinters.add(printer.IP);
          }

          if (currentSearchTerm) {
            const searchableContent = printerDiv.textContent.toLowerCase();
            if (!searchableContent.includes(currentSearchTerm)) {
              printerDiv.classList.add("hidden");
            }
          }

          container.appendChild(printerDiv);
        });

        window.scrollTo(0, scrollPosition);

        if (printersWithCriticalError.length === 0 && printersWithWarning.length === 0 && !showAllPrinters) {
          noErrorsMessage.style.display = "block";
          document.getElementById("printerSummary").style.display = "none";
        } else {
          noErrorsMessage.style.display = "none";
        }

        if (showAllPrinters) {
          printersWithCriticalError.forEach(printer => container.appendChild(printer));
          printersWithWarning.forEach(printer => container.appendChild(printer));
          printersWithNoError.forEach(printer => container.appendChild(printer));
        }

        if (showAllPrinters) {
          const savedSearchTerm = localStorage.getItem("searchTerm");
          if (savedSearchTerm) {
            searchBox.value = savedSearchTerm;
            clearButton.classList.remove("hidden");
            filterPrinters(savedSearchTerm);
          }
        }

        if (!showAllPrinters && !isMobile()) {
          generatePrinterSummary(printerData);
        } else {
          document.getElementById("printerSummary").style.display = "none";
        }
      });
  };

  const generatePrinterSummary = (printerData) => {
    summaryContainer.innerHTML = "";

    const criticalPrinters = [];
    const warningPrinters = [];

    printerData.forEach(printer => {
      const uniqueErrors = printer.Errors.filter((error, index, self) => {
        const normalizedError = error.toLowerCase()
          .replace(/\s*\{[^\}]+\}\s*$/, '')
          .replace(/\d+$/, '');
        return self.findIndex(e => 
          e.toLowerCase()
            .replace(/\s*\{[^\}]+\}\s*$/, '')
            .replace(/\d+$/, '') === normalizedError
        ) === index;
      });

      const hasCriticalError = printer.Errors.some(error => 
        Array.from(criticalErrors).some(str => error.toLowerCase().includes(str.toLowerCase()))
      );
      const hasWarningError = printer.Errors.some(error => 
        Array.from(warningErrors).some(str => error.toLowerCase().includes(str.toLowerCase()))
      ) && !hasCriticalError;

      if (hasCriticalError) {
        criticalPrinters.push({...printer, SummaryErrors: uniqueErrors});
      } else if (hasWarningError) {
        warningPrinters.push({...printer, SummaryErrors: uniqueErrors});
      }
    });

    if (criticalPrinters.length > 0 || warningPrinters.length > 0) {
        summaryContainer.innerHTML = "<h3>Aktive feilmeldinger:</h3>";
        
        if (criticalPrinters.length > 0) {
            const criticalGroup = document.createElement('div');
            criticalGroup.className = 'error-group critical';
            criticalGroup.innerHTML = `
              <ul>${criticalPrinters.map(printer => {
                const errors = printer.SummaryErrors.filter(error => 
                  Array.from(criticalErrors).some(str => error.includes(str))
                ).map(error => translateError(error.replace(/\s*\{[^\}]+\}\s*$/, '')));
                return `<li><strong>${printer.Name} (${printer.Model}):</strong> <span class="critical-error">${errors.join(", ")}</span></li>`;
              }).join("")}</ul>
            `;
            summaryContainer.appendChild(criticalGroup);
        }

        if (warningPrinters.length > 0) {
            const warningGroup = document.createElement('div');
            warningGroup.className = 'error-group warning';
            warningGroup.innerHTML = `
              <ul>${warningPrinters.map(printer => {
                const errors = printer.SummaryErrors.filter(error => 
                  Array.from(warningErrors).some(str => error.includes(str))
                ).map(error => translateError(error.replace(/\s*\{[^\}]+\}\s*$/, '')));
                return `<li><strong>${printer.Name} (${printer.Model}):</strong> <span class="warning-error">${errors.join(", ")}</span></li>`;
              }).join("")}</ul>
            `;
            summaryContainer.appendChild(warningGroup);
        }

        summaryContainer.style.display = "block";
    } else {
        summaryContainer.style.display = "none";
    }
  };

  const setupEventListeners = () => {
    document.getElementById("toggleButton").addEventListener("click", () => {
      const isSummaryView = document.body.classList.contains('summary-view');
      showAllPrinters = !showAllPrinters;
      
      if (isSummaryView) {
          document.body.classList.toggle('show-all-printers', showAllPrinters);
          document.getElementById("toggleButton").textContent = showAllPrinters ? "Vis oppsummering" : "Vis alle skrivere";
      } else {
          document.getElementById("toggleButton").textContent = showAllPrinters ? "Vis kun printere med feil" : "Vis alle skrivere";
      }
      
      searchContainer.classList.toggle("hidden", !showAllPrinters);
      if (!showAllPrinters) {
          searchBox.value = "";
          clearButton.classList.add("hidden");
          localStorage.removeItem("searchTerm");
      }
      fetchPrinterData();
    });

    searchBox.addEventListener("input", (event) => {
      const searchTerm = event.target.value.toLowerCase();
      filterPrinters(searchTerm);
      clearButton.classList.toggle("hidden", !searchTerm);
      if (showAllPrinters) {
        localStorage.setItem("searchTerm", searchTerm);
      }
    });

    clearButton.addEventListener("click", () => {
      searchBox.value = "";
      filterPrinters("");
      clearButton.classList.add("hidden");
      localStorage.removeItem("searchTerm");
    });
  };

  const formatDate = (dateString) => {
    const parts = dateString.split(', ');
    const datePart = parts[0].split(' ');
    const timePart = parts[1];
    const formattedDateString = `${datePart[2]}-${datePart[1]}-${datePart[0]}T${timePart}`;
    const date = new Date(formattedDateString);

    if (isNaN(date)) return "";

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const filterPrinters = debounce((searchTerm) => {
    const printers = container.children;
    for (const printer of printers) {
      const searchableContent = printer.textContent.toLowerCase();
      printer.classList.toggle("hidden", !searchableContent.includes(searchTerm));
    }
    localStorage.setItem("searchTerm", searchTerm);
  }, 250);

  fetchPrinterData();
  setInterval(fetchPrinterData, 8000);

  clearButton.classList.toggle("hidden", !searchBox.value);

  setupEventListeners();
});
