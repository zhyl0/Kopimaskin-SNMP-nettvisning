document.addEventListener("DOMContentLoaded", function () {
  const imageCache = {};
  let showAllPrinters = false;

  document.getElementById("toggleButton").addEventListener("click", () => {
    showAllPrinters = !showAllPrinters;
    document.getElementById("toggleButton").textContent = showAllPrinters ? "Vis kun printere med feil" : "Vis alle skrivere";
    fetchPrinterData();
  });

const fetchPrinterData = () => {
  fetch("printer_data.json")
      .then((response) => response.json())
      .then((printerData) => {
        const container = document.getElementById("printerInfo");
        container.innerHTML = "";

        const printersWithCriticalError = [];
        const printersWithWarning = [];
        const printersWithNoError = [];

        printerData.forEach((printer) => {
          const hasWarning = printer.Errors.some(error =>
            error.includes("Nesten") ||
            error.includes("Forbred") ||
            error.includes("Finner ikke:")
          );

          const hasCriticalError = printer.Errors.some(error =>
            error.includes("Papirstopp") ||
            error.includes("Tom:") ||
            error.includes("stifter") ||
            error.includes("Fyll på")
          );

          const printerDiv = document.createElement("div");
          printerDiv.className = "printer";


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
            <div class="ink-level-bar-container"><div class="ink-level-bar ink-black" style="width: ${printer["Ink Levels"][0]};"></div></div>
            <div class="ink-level-bar-container"><div class="ink-level-bar ink-cyan" style="width: ${printer["Ink Levels"][2]};"></div></div>
            <div class="ink-level-bar-container"><div class="ink-level-bar ink-magenta" style="width: ${printer["Ink Levels"][3]};"></div></div>
            <div class="ink-level-bar-container"><div class="ink-level-bar ink-yellow" style="width: ${printer["Ink Levels"][4]};"></div></div>
          `;

          const trayCountersHtml = printer["Tray Information"].slice(0, -1).map((count, index) => {
            let countClass = "";
            const answer = count == -3 ? "Har" : count;
            if (answer == 0) {
              countClass = "empty";
            } else if (answer < 56) {
              countClass = "almostempty";
            }

            return `
              <div class="tray-counter ${countClass}">
                <strong>Skuff ${index + 1}:</strong> ${answer} Ark
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
              <div><strong>IP:</strong> ${printer.IP}</div>
              <div><strong>S/N:</strong> ${printer.Serial || "N/A"}</div>
              <div><strong>Tonernivå:</strong>${inkLevelsHtml}</div>
              <div><strong>Papirmengde:</strong>${trayCountersHtml}</div>
              <div><strong>Sist oppdatert:</strong> ${printer.Time}</div>
            </div>
            <ul class="errors-list">${printer.Errors.map(error => `<li>${error}</li>`).join("")}</ul>
          `;

          printerDiv.addEventListener("click", () => {
            printerDiv.classList.toggle("expanded");
          });

          if (hasCriticalError) {
            container.appendChild(printerDiv);
          }
        });


        printersWithWarning.forEach(printerDiv => container.appendChild(printerDiv));

        if (printersWithCriticalError.length === 0 && printersWithWarning.length === 0) {
          showNoIssuesMessage(container);
        } else {

          hideNoIssuesMessage(container);
        }


        if (showAllPrinters) {
          printersWithCriticalError.concat(printersWithWarning, printersWithNoError).forEach(printerDiv => container.appendChild(printerDiv));
        }
      });
  };


  function showNoIssuesMessage(container) {
    if (!document.querySelector('.no-issues-message')) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'no-issues-message';
      messageDiv.innerHTML = '✅ Ingen kopimaskiner med feil.'; 
      container.appendChild(messageDiv);
    }
  }


  function hideNoIssuesMessage(container) {
    const messageDiv = container.querySelector('.no-issues-message');
    if (messageDiv) {
      container.removeChild(messageDiv);
    }
  }


  fetchPrinterData();
  setInterval(fetchPrinterData, 8000);
});
