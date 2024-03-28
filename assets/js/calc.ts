import { IS_JITA_ROUND_TRIP, MILLIONS } from "./src/consts.js";
import { RouteCalc, routes } from "./src/routes.js";
import { CalcFeeRequest, CalcFeeResponse, Destination } from "./src/types.js";

const ROUTE_SEP_ARROW = " ➠ ";
const ROUTE_SEP_ARROW_RT = " ⮂ "
const CLICK_TO_COPY = " Click to Copy";
const COPIED = " Copied!";
const routeMap = {};

const DEFAULT_ROUTE_SELECTION = `1DQ1-A${IS_JITA_ROUND_TRIP ? ROUTE_SEP_ARROW_RT : ROUTE_SEP_ARROW}Jita/Perimeter`;

/**
 * Adds options to the select element representing routes serviced
 * @param dropdown
 * @param option
 */
function addRouteOption(dropdown: Element, option: string) {
  console.log("adding " + option)
  const routeOption = document.createElement("option")
  routeOption.value = option
  routeOption.text = option
  if (option === DEFAULT_ROUTE_SELECTION) {
    routeOption.selected = true
  }
  dropdown.appendChild(routeOption)
}

/**
 * Register event handler on the form so we can calculate rewards
 * whenever the user changes something.
 */
function registerEventHandlers() {
  const form = document.getElementById("calc-form") as HTMLFormElement;
  const controls = form.getElementsByClassName("form-control");
  for (const i in controls) {
    controls[i].addEventListener("blur", calculateRouteReward);
    controls[i].addEventListener("invalid", () => {
      controls[i].classList.add("error");
    });
  }
}

/**
 * Calculate route reward and update UI
 */
async function calculateRouteReward() {
  // Collect information from the form
  const form = document.getElementById("calc-form") as HTMLFormElement;
  const desiredRoute = document.getElementById("calc-route") as HTMLSelectElement;
  const desiredm3 = document.getElementById("calc-m3") as HTMLInputElement;
  const desiredCollateral = document.getElementById("calc-collateral") as HTMLInputElement;
  const desiredCollateralLabel = document.getElementById("calc-collateral-label") as HTMLInputElement;

  const route = routeMap[desiredRoute.value] as RouteCalc;
  const maxVolume = route.maxM3;

  const disableCollateral = isNaN(route.collateralRate) || route.collateralRate == 0;

  // Toggle visibility and validation requirement of collateral rate if necessary
  if (disableCollateral) {
    desiredCollateral.required = false;
    desiredCollateral.hidden = true;
    desiredCollateralLabel.hidden = true;
  } else {
    desiredCollateral.required = true;
    desiredCollateral.hidden = false;
    desiredCollateralLabel.hidden = false;
  }

  // Check for flat rate routes
  if (!isNaN(route.flatRate) && route.flatRate > 0) {
    outputRouteReward(desiredRoute.value, route.flatRate.toLocaleString(), route.maxM3.toLocaleString(), "Flat Rate");
    return;
  }

  // If the desired m3 or desired collateral are empty, then the user hasn't
  // entered anything yet so we should return early.
  if (desiredm3.value == "" || (!disableCollateral && desiredCollateral.value == "")) {
    return;
  }

  // Remove error classes and then recheck validity of data.
  desiredm3.classList.remove("error");
  desiredCollateral.classList.remove("error");

  if (!form.checkValidity()) {
    console.log("Form doesn't validate, not calculating reward");
    // Currently the form native validation only works with the hardcoded default m3
    outputRouteReward(desiredRoute.value, "Fix Invalid Input", maxVolume.toLocaleString(), "None");
    return;
  }

  if (Number(desiredm3.value) > maxVolume) {
    console.log(`${desiredm3.value} m3 over the maximum of ${maxVolume} for route ${desiredRoute.value}`);
    desiredm3.classList.add("error");
    outputRouteReward(desiredRoute.value, "Desired Contract Volume is too Large", maxVolume.toLocaleString(), "None");
    return;
  }

  const calculatorResponse = await fetch("http://localhost:4001/", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: route.origin,
      destination: route.destination,
      volume: desiredm3.valueAsNumber,
      collateral: desiredCollateral.valueAsNumber,
    } as CalcFeeRequest),
  })

  const { rateStructure, reward, maxM3 } = await calculatorResponse.json() as CalcFeeResponse;

  const rateType = `Rate is ${rateStructure.m3Rate} isk/m3 + ${rateStructure.collateralRate * 100}% of collateral`;
  console.log(`Calculate Response:
    Route: ${route},
    Rate: ${rateStructure.m3Rate},
    CollateralRate: ${rateStructure.collateralRate},
    m3: ${desiredm3.value},
    Reward: ${reward},
    RateType: ${rateType},
  `);

  outputRouteReward(desiredRoute.value, reward.toLocaleString(), maxM3.toLocaleString(), rateType);
}

function getCalcOutput(): HTMLSpanElement {
  return document.getElementById("calc-output") as HTMLSpanElement;
}

function clearCalcOutput(output: HTMLSpanElement) {
  while (output.firstChild) {
    output.removeChild(output.lastChild);
  }
}

/**
 * Outputs the reward for a contract to the user
 */
function outputRouteReward(route: string, reward: string, maxM3: string, rateType: string) {
  const output = getCalcOutput();
  output.style.visibility = "visible";
  clearCalcOutput(output);

  const createElements = (term: string, val: string, id?: string, copyVal?: string) => {
    const termElem = document.createElement("dt");
    termElem.innerText = term;

    const valElem = document.createElement("dd");
    valElem.innerText = val;
    valElem.setAttribute("onClick", `copyToClipboard("${id}", "${copyVal ?? val}")`);

    if (id != null) {
      const ctcElem = document.createElement("a");
      ctcElem.id = id;
      ctcElem.className = "click-to-copy";
      ctcElem.title = "click-to-copy";
      ctcElem.innerText = " Click to Copy";
      valElem.appendChild(ctcElem);
    }

    output.appendChild(termElem);
    output.appendChild(valElem);
  }

  createElements("Route", route);
  createElements("Contract To", "Northern Freight Unlimited [NOFU]", "corp-name", "Northern Freight Unlimited");
  createElements("Reward", reward, "reward", reward);
  createElements("Contract Rate Structure", rateType)
  createElements("Time to Accept/Complete", "14 day accept / 7 day complete");
  createElements("Max Volume", `${maxM3} m3`);
}

/**
 * Copy contents of value to the system clipboard
 * @param value
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function copyToClipboard(id: string, value: string) {
  navigator.clipboard.writeText(value).then(() => {
    console.log(`clipboard copy "${value} (${id})"`);
    const tag = document.getElementById(id);
    tag.innerText = COPIED;
    setTimeout(() => { tag.innerText = CLICK_TO_COPY }, 1000);
  }, () => {
    console.log(`FAIL clipboard copy "${value} (${id})"`);
  });
}

window.onload = () => {
  console.log("onload called, populating route dropdown....");
  const routeDropdown = document.querySelector('#calc-route');
  let routeStrs = [];
  for (const route of routes) {
    for (const destination of route.destinations) {
      const r = new RouteCalc(route.origin, destination);
      const routeStr = r.toString();
      console.log("adding " + routeStr)
      routeStrs.push(routeStr);

      routeMap[routeStr] = r;
    }
  }
  console.log("DEFAULT_ROUTE_SELECTION=", DEFAULT_ROUTE_SELECTION)

  routeStrs = routeStrs.sort();
  for (const routeStr of routeStrs) {
    addRouteOption(routeDropdown, routeStr);
  }

  // registerEventHandlers();
}
