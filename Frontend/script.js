document.addEventListener("DOMContentLoaded", function () {
  const fetchPrinterData = () => {
    fetch("printer_data.json")
      .then((response) => response.json())
      .then((printerData) => {
        const container = document.getElementById("printerInfo");
        container.innerHTML = ''; // Clear existing content before adding new fetched data

        printerData.forEach((printer) => {
          const printerDiv = document.createElement("div");
          printerDiv.className = "printer";

          // Create ink level bars
          const createInkLevelBar = (color, width) => {
            return `
              <div class="ink-level-bar-container">
                  <div class="ink-level-bar ink-${color}" style="width: ${width};"></div>
              </div>
            `;
          };
		  // lag advarsler for små feil
           const hasWarning = printer.Errors.some(
             (error) =>
               error.includes("{13300}") ||
               error.includes("{13400}") ||
			   error.includes("{30343}") 
           );
		   //lag krisike varsler for driftsstans-feil
           const hasCriticalError = printer.Errors.some(
             (error) =>
               error.includes("{40440}" ||
               error.includes("{Error fetching errors}")
           );
           if (hasCriticalError) {
             printerDiv.classList.add("pulsate-error");
           }
           if (hasWarning) {
             printerDiv.classList.add("glow-warning");
           }

          // Skipping the second ink level as it is unknown
          const inkLevelsHtml = `
            ${createInkLevelBar("black", printer["Ink Levels"][0])}
            ${createInkLevelBar("cyan", printer["Ink Levels"][2])}
            ${createInkLevelBar("magenta", printer["Ink Levels"][3])}
            ${createInkLevelBar("yellow", printer["Ink Levels"][4])}
          `;

          // Create tray counters
          const trayCountersHtml = printer["Tray Information"]
            .slice(0, -1) // Ignore the last tray information
            .map(
              (count, index) => `
                  <div class="tray-counter">
                      <strong class="detail">Skuff ${index + 1}:</strong><strong> ${count} Ark</strong>
                  </div>
              `
            )
            .join("");

          printerDiv.innerHTML = `
              <div class="printer-icon"></div>
              <h2>${printer.Name} (${printer.Model})</h2>
              <div class="details">
                  <div class="detail"><strong>IP:</strong> ${printer.IP}</div>
                  <div class="detail"><strong>S/N:</strong> ${printer.Serial || "N/A"}</div>
                  <div class="ink-levels">
                      <strong>Toner:</strong>
                      ${inkLevelsHtml}
                  </div>
                  <div class="tray-counters">
                      <strong>Papirmengde:</strong>
                      ${trayCountersHtml}
                  </div>
                  <div class="detail"><strong>Oppdatert:</strong> ${printer.Time}</div>
                  <ul class="errors-list"><strong>Status:</strong> ${printer.Errors.map(
                    (error) => `<li class="error">${error}</li>`
                  ).join("")}</ul>
              </div>
          `;

          container.appendChild(printerDiv);
        });
      })
      .catch((error) => console.error("Error loading the printer data:", error));
  };

  // Call fetchPrinterData every 10 seconds
  fetchPrinterData(); // Fetch immediately on load
  setInterval(fetchPrinterData, 1000); // Then fetch every 10 seconds
});
