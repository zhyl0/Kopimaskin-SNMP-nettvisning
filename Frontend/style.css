:root {
  --primary-color: linear-gradient(90deg, #e63946, #f77f00);
  --secondary-color: #f01616;
  --background-color: #f0f0f0;
  --text-color: #000;
  --error-color: #D80000;
  --warning-color: #FF9900;
  --white-color: #fff;
  --ink-black-color: #000;
  --ink-cyan-color: #00bfff;
  --ink-magenta-color: #ff00ff;
  --ink-yellow-color: #ffff00;
  --border-color: #ddd;
  --border-light-color: #ccc;
  --shadow-color: #00000019;
  --background-light: #eee;
  --tooltip-bg: rgba(0, 0, 0, 0.8);
  --tooltip-text: #fff;
}

body {
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--background-color);
}

header {
  display: flex;
  align-items: center;
  background: var(--primary-color); 
  color: var(--white-color);
  padding: 10px;
  position: relative;
  border-bottom: 2px solid var(--secondary-color); 
}

header h1 {
  margin: 0;
  font-size: 2rem;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.header-icon {
  width: auto;
  height: 50px;
  max-height: 100%;
  margin-left: auto;
  margin-right: 15px;
}

.printer-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-gap: 1vh;
  padding: 2vh;
  grid-auto-flow: dense;
}

.printer-container > * {
  background-color: var(--white-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  padding: 2vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.printer h2 {
  line-height: 1.2;
  margin-bottom: 0.2em;
  min-height: 2.4em;
}

.pulsate-error {
  animation: pulsate 1s infinite;
  order: -2;
  transform: translateZ(0);
  will-change: box-shadow;
}

.pulsate-warning {
  animation: pulsate-warning 1s infinite;
  order: -1;
  transform: translateZ(0);
  will-change: box-shadow;
}

@keyframes pulsate {
   0%, 100% {
    box-shadow: 0 0 10px 1px var(--error-color);
  }
  50% {
    box-shadow: 0 0 15px 2px var(--error-color);
  }
}

@keyframes pulsate-warning {
   0%, 100% {
    box-shadow: 0 0 10px 1px var(--warning-color);
  }
  50% {
    box-shadow: 0 0 15px 2px var(--warning-color);
  }
}

@keyframes blink {
   0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes blink-orange {
  0%, 100% { box-shadow: 0 0 10px 1px var(--warning-color); }
  50% { box-shadow: 0 0 20px 1px var(--warning-color); }
}

.printer-icon {
  width: 100px;
  height: 100px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin: 0 auto;
}

.ink-level-bar-container {
  height: 10px;
  background-color: var(--background-light);
  border-radius: 5px;
  margin-bottom: 5px;
  overflow: visible;
  position: relative;
}

.ink-level-percentage {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--tooltip-bg);
  color: var(--tooltip-text);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  display: none;
  z-index: 10;
}

.ink-level-bar-container:hover .ink-level-percentage {
  display: block;
}

.ink-level-bar {
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
  width: calc(var(--ink-percentage) * 1%);
  position: relative;
  cursor: help;
}

.ink-black {
  background-color: var(--ink-black-color);
}

.ink-cyan {
  background-color: var(--ink-cyan-color);
}

.ink-magenta {
  background-color: var(--ink-magenta-color);
}

.ink-yellow {
  background-color: var(--ink-yellow-color);
}

.printer-info,
.printer-serial,
.toner-section,
.tray-section {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5em;
  margin-bottom: 1em;
}

.tray-counter {
  margin-top: 0.5em;
  font-weight: normal;
}

.last-updated {
  margin-top: 1em;
}

.empty {
  color: var(--error-color);
}

.almostempty {
  color: var(--warning-color);
}

.error-list {
  color: var(--error-color);
  font-size: 0.9rem;
}

.errors-list {
  padding-left: 2vh;
}

.printer-ip, .printer-serial {
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-block;
  padding: 2px 4px;
  border-radius: 3px;
  text-decoration: none !important;
  border: none;
}

.printer-ip:hover, .printer-serial:hover {
  background-color: var(--background-light);
}

.printer-ip:active, .printer-serial:active {
  background-color: var(--border-light-color);
}

#toggleButton {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  font-size: 1rem;
  background-color: var(--secondary-color);
  color: var(--white-color);
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

#toggleButton:hover {
  background-color: #d10404; 
}

.printer-ip {
  color: inherit;
  text-decoration: none;
  position: relative;
}

.printer-ip:hover {
  color: inherit;
  text-decoration: none;
}

.printer-ip::after {
  content: "Åpne Web UI";
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--tooltip-bg);
  color: var(--tooltip-text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s;
  white-space: nowrap;
  z-index: 10;
}

.printer-ip:hover::after {
  opacity: 1;
  visibility: visible;
}

.no-errors-message {
  display: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--white-color);
  color: var(--text-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  font-size: 1em;
  z-index: 1000;
  text-align: center;
}

.no-errors-message img {
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
}

.no-errors-message h2 {
  margin: 0;
  font-size: 1.5em;
}

.printer-info > div {
  border: none;
  padding: 0;
  margin: 0;
}

.printer-info > div + div {
  border-top: 1px solid var(--border-light-color);
  padding-top: 8px;
  margin-top: 8px;
}

.printer-ip-sn a {
  color: inherit;
  text-decoration: none;
}

.printer-ip-sn a:visited {
  color: inherit;
}

.printer-ip-sn a:hover {
  color: inherit;
  text-decoration: none;
}

.printer-ip-sn a:active {
  color: inherit;
}

.critical-error {
  color: var(--error-color);
  font-weight: bold;
}

.warning-error {
  color: var(--warning-color);
  font-weight: bold;
}

.search-container {
  position: relative;
  margin: 10px auto;
  width: calc(100% - 40px);
  max-width: 400px;
}

#searchBox {
  width: 100%;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid var(--primary-color);
  border-radius: 5px;
  box-sizing: border-box;
}

#clearButton {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--primary-color);
}

.hidden {
  display: none;
}

.printer-summary {
  margin: 0;
  padding: 2vh;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: left;
  overflow: hidden;
  display: inline-block;
  white-space: normal;
  word-wrap: break-word;
  word-break: break-word;
  width: fit-content;
  max-width: calc(100% - 4vh);
}

.printer-summary h3 {
  margin: 0 0 8px 0;
  padding: 0;
  font-size: 1.2rem;
}

.printer-summary ul {
  list-style-type: none;
  padding: 0;
  margin: 0 0 0 0.5em;
}

.printer-summary li {
  margin-bottom: 5px;
  color: var(--text-color);
  padding: 0;
  display: block;
  width: 100%;
  font-size: 1.2rem;
}

.printer-summary .critical-error {
  color: var(--white-color);
  font-weight: bold;
  background-color: var(--error-color);
  border-radius: 10px;
  padding: 2px 8px;
}

.printer-summary .warning-error {
  color: var(--text-color);
  font-weight: bold;
  background-color: var(--warning-color);
  border-radius: 10px;
  padding: 2px 8px;
}

.printer-summary .warning-error-container {
  display: block;
  animation: blink-orange 1s infinite;
  margin-bottom: 8px;
}

.pulsate-error,
.pulsate-warning,
.critical-error,
.warning-error {
  animation-duration: 1s;
  animation-timing-function: linear;
  animation-delay: 0s;
  animation-iteration-count: infinite;
}

.error-group {
  margin: 10px 0;
  padding: 10px;
  border-radius: 8px;
}

.error-group.critical {
  border: 2px solid var(--error-color);
  animation: pulsate 1s infinite;
}

.error-group.warning {
  border: 2px solid var(--warning-color);
  animation: pulsate-warning 1s infinite;
  box-shadow: 0 0 10px 1px var(--warning-color);
}

.summary-view .printer-summary {
  display: block !important;
  width: 95%;
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  background-color: transparent;
  box-shadow: none;
}

.summary-view .printer-summary h3 {
  font-size: 1.7rem;
  margin-bottom: 8px;
  text-align: center;
}

.summary-view .printer-summary li {
  margin: 0;
  padding: 15px;
  font-size: clamp(0.9rem, 1.5vw + 0.2rem, 1.4rem);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.summary-view .error-group {
  margin: 0;
  padding: 10px;
  background-color: var(--background-color);
}

.summary-view .error-group.critical {
  margin-bottom: 15px;
  border: 2px solid var(--error-color);
  animation: pulsate 1s infinite;
}

.summary-view .error-group.warning {
  border: 2px solid var(--warning-color);
  animation: pulsate-warning 1s infinite;
}

.summary-view .error-group ul {
  margin: 0;
  padding: 0;
  line-height: 1;
}

.summary-view .error-group li {
  margin: 0;
  padding: 2px 15px;
  line-height: 1;
  display: block;
}

.summary-view .printer-container {
  display: none;
}

.summary-view.show-all-printers .printer-container {
  display: grid;
}

.summary-view.show-all-printers .printer-summary {
  display: none !important;
}

@media (max-width: 768px) {
  .summary-view .printer-summary ul {
    grid-template-columns: 1fr;
  }

  .summary-view .printer-summary li {
    font-size: 1rem;
    padding: 12px;
  }
}

@media (min-width: 1200px) {
  .summary-view .printer-summary[data-error-count="1"],
  .summary-view .printer-summary[data-error-count="2"] {
    font-size: 1.4rem;
  }
}

.printer-serial {
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-block;
  padding: 2px 4px;
  border-radius: 3px;
  user-select: none;
  position: relative;
  text-decoration: none !important;
  border: none;
}

.printer-serial::before {
  content: "Kopier serienummer";
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--tooltip-bg);
  color: var(--tooltip-text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s;
  white-space: nowrap;
  z-index: 9;
}

.printer-serial.show-tooltip::before {
  opacity: 1;
  visibility: visible;
}

.printer-serial::after {
  content: "Serienummer kopiert";
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--tooltip-bg);
  color: var(--tooltip-text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s;
  white-space: nowrap;
  z-index: 10;
}

.printer-serial.copied::after {
  opacity: 1;
  visibility: visible;
}
