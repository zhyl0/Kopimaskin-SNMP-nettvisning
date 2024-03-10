function calculateBackgroundColor(paperCount) {
  const maxPaperCount = 550;
  let color;

  if (paperCount >= maxPaperCount) {
    color = 'rgb(0, 255, 0)'; // Green
  } else if (paperCount <= 0) {
    color = 'rgb(255, 0, 0)'; // Red
  } else if (paperCount <= 275) {
    // Transition from red to yellow
    let green = Math.round((paperCount / 275) * 255);
    color = `rgb(255, ${green}, 0)`;
  } else {
    // Transition from yellow to green
    let red = Math.round(((maxPaperCount - paperCount) / 275) * 255);
    color = `rgb(${red}, 255, 0)`;
  }

  return color;
}


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
               error.includes("{40440}") || error.includes("{Error fetching errors}")

           );
           if (hasCriticalError) {
             printerDiv.classList.add("pulsate-error");
           }
           if (hasWarning) {
             printerDiv.classList.add("glow-warning");
           }

		// Assuming 'printer' is the current object being processed in a loop
		const hasFetchError = printer.Errors.some(error => error === "Error fetching errors");
		if (hasFetchError) {
			const svgHTML = `
			<div class='vector' style='height: 100%; width: 100%; position: absolute; top: 0; left: 0;'>
				<svg viewBox='0 0 600 250' preserveAspectRatio='xMidYMid meet' style='height: 100%; width: 100%;'>
					<line x1='1' y1='1' x2='600' y2='1' id='top' />
					<line x1='1' y1='1' x2='1' y2='250' />
					<line x1='1' y1='1' x2='450' y2='250' />
					<line x1='1' y1='1' x2='175' y2='250' />
					<path d='M 1,80 a 12,15 45 1,1 37,-26 a 10,12 0 1,1 14,-24 a 25,20 -45 1,1 40,-30' />
					<path d='M 1,160 a 17,20 45 1,1 75,-52 a 17,20 0 1,1 30,-48 a 30,25 -45 1,1 60,-70' />
					<path d='M 1,240 a 22,25 45 1,1 113,-78 a 23,26 0 1,1 46,-72 a 35,30 -45 1,1 90,-110' />
				</svg>
			</div>`;
				printerDiv.style.position = 'relative'; // Ensure the printerDiv can contain the absolutely positioned SVG
				printerDiv.innerHTML += svgHTML; // Append the SVG to the printer's div
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
              (count, index) => {
				  const backgroundColor = calculateBackgroundColor(parseInt(count));
				  return `
					<div class="tray-counter" style="background-color: ${backgroundColor};">
						<strong class="detail">Skuff ${index + 1}:</strong><strong> ${count} ark</strong>
					</div>
				`;
			})
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
