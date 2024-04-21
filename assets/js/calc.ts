import { IS_JITA_ROUND_TRIP } from "../src/consts.js";
import { RouteCalc, routes } from "../../src/routes.js";

const ROUTE_SEP_ARROW = " ➠ ";
const ROUTE_SEP_ARROW_RT = " ⮂ ";
const routeMap = {};

const DEFAULT_ROUTE_SELECTION = `1DQ1-A${
  IS_JITA_ROUND_TRIP ? ROUTE_SEP_ARROW_RT : ROUTE_SEP_ARROW
}Jita/Perimeter`;

/**
 * Adds options to the select element representing routes serviced
 * @param dropdown
 * @param option
 */
function addRouteOption(dropdown: Element, option: string) {
  console.log("adding " + option);
  const routeOption = document.createElement("option");
  routeOption.value = option;
  routeOption.text = option;
  if (option === DEFAULT_ROUTE_SELECTION) {
    routeOption.selected = true;
  }
  dropdown.appendChild(routeOption);
}

window.onload = () => {
  console.log("onload called, populating route dropdown....");
  const routeDropdown = document.querySelector("#calc-route");
  let routeStrs = [];
  for (const route of routes) {
    for (const destination of route.destinations) {
      const r = new RouteCalc(route.origin, destination);
      const routeStr = r.toString();
      console.log("adding " + routeStr);
      routeStrs.push(routeStr);

      routeMap[routeStr] = r;
    }
  }
  console.log("DEFAULT_ROUTE_SELECTION=", DEFAULT_ROUTE_SELECTION);

  routeStrs = routeStrs.sort();
  for (const routeStr of routeStrs) {
    addRouteOption(routeDropdown, routeStr);
  }
};
