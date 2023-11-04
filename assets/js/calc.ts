
enum System {
    ImperialPalace = "1DQ1-A",  // Can't use 1DQ as key here because it starts with a number
    Delve = "Intra Delve",
    Forge = "Jita/Perimeter",
    Domain = "Amarr/Ashab",
    Ahbazon = "Ahbazon (Genesis)",
    Zinkon = "Zinkon",
    Irmalin = "Irmalin",
    Initiative = "B17O-R (INIT.)",
    Querious = "Querious",
    PeriodBasis = "Period Basis",
    Serren = "Serren (KFU)",
    Amok = "K-6K16 (Am0k)",
    O4T = "O4T-Z5 (Esoteria / Paragon Soul)",
    CloudRing = "F7C-H0 (Cloud Ring)",
    Deployment2023 = "DO6H-Q (Fade Deployment)"
};

const ROUTE_SEP_ARROW = " ➠ ";
const ROUTE_SEP_ARROW_RT = " ⮂ "
const CLICK_TO_COPY = " Click to Copy";
const COPIED = " Copied!";
const routeMap = {};

const DEFAULT_COLLATERAL_PERCENTAGE_FEE = 0.0075; // 0.75%
const JITA_REDUCED_MIN_REWARD = 10e6;  // 10m
const MILLIONS = 1e6; // 1m

// Rates
const FOUR_JUMP_RT = 700;
const STANDARD_IMPORT_FROM_JITA_RATE = 850;
const STANDARD_EXPORT_TO_JITA_RATE = 850;
const JITA_RATE_DISCOUNT = 0;
const IS_JITA_ROUND_TRIP = STANDARD_EXPORT_TO_JITA_RATE - STANDARD_IMPORT_FROM_JITA_RATE === 0;
const STANDARD_DOMAIN_RATE = FOUR_JUMP_RT;
const FOUNTAIN_DELVE_RATE = 900;

const DEFAULT_ROUTE_SELECTION = `1DQ1-A${IS_JITA_ROUND_TRIP ? ROUTE_SEP_ARROW_RT : ROUTE_SEP_ARROW}Jita/Perimeter`;

// Defaults where not otherwise specified
const defaults = {
    minReward: 30e6,  // 30m
    maxCollateral: 10e9,  // 10b
    m3Rate: 800,  // isk per m3
    collateralRate: DEFAULT_COLLATERAL_PERCENTAGE_FEE, // percent collateral to charge as reward
    maxM3: 350000,  // 350k m3
    isRoundTrip: false,
    flatRate: NaN,
};

interface Destination {
    destination: string,
    minReward?: number,
    maxCollateral?: number,
    maxM3?: number,
    m3Rate: number,  // isk per m3
    collateralRate: number, // percent fee of collateral to charge
    isRoundTrip?: boolean,
    flatRate?: number, // flat rate fee
}

interface Route {
    origin: string,
    destinations: Destination[],
}

class RouteCalc implements Destination {
    readonly origin: string;
    readonly destination: string;
    readonly minReward?: number;
    readonly maxCollateral?: number;
    readonly maxM3?: number;
    readonly m3Rate: number;  // isk per m3
    readonly collateralRate: number; // percent fee of collateral to charge
    readonly isRoundTrip?: boolean;
    readonly flatRate?: number;

    constructor(origin :string, destination :Destination) {
        this.origin = origin
        this.destination = destination.destination
        this.minReward = destination.minReward ?? defaults.minReward
        this.maxM3 = destination.maxM3 ?? defaults.maxM3
        this.m3Rate = destination.m3Rate ?? defaults.m3Rate
        this.collateralRate = destination.collateralRate ?? defaults.collateralRate
        this.maxCollateral = destination.maxCollateral ?? defaults.maxCollateral
        this.isRoundTrip = destination.isRoundTrip
        this.flatRate = destination.flatRate ?? defaults.flatRate
    }

    toString() :string {
        if (this.isRoundTrip) {
            return this.origin + ROUTE_SEP_ARROW_RT + this.destination
        }
        return this.origin + ROUTE_SEP_ARROW + this.destination
    }
}

const routes = [
    {
        origin: System.ImperialPalace,
        destinations: [
            {
                destination: System.Forge,
                m3Rate: STANDARD_EXPORT_TO_JITA_RATE - JITA_RATE_DISCOUNT,
                minReward: JITA_REDUCED_MIN_REWARD,  // 10m
                isRoundTrip: IS_JITA_ROUND_TRIP,
            },
            {
                destination: System.Deployment2023,
                m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 415,
                isRoundTrip: true,
                flatRate: NaN,
                collateralRate: 0,
            },
            {
                destination: System.O4T,
                m3rate:  750,
                isRoundTrip: true,
            },
            {
                destination: System.CloudRing,
                m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + (FOUR_JUMP_RT / 2),
                isRoundTrip: true,
            },
            {
                destination: System.Ahbazon,
                m3Rate: FOUR_JUMP_RT,
                isRoundTrip: true,
            },
            {
                destination: System.Domain,
                m3Rate: STANDARD_DOMAIN_RATE,
                isRoundTrip: true,
            },
            {
                destination: System.Initiative,
                m3Rate: FOUNTAIN_DELVE_RATE,
            },
            {
                destination: System.PeriodBasis,
                m3Rate: FOUR_JUMP_RT,
                isRoundTrip: true,
            },
            {
                destination: System.Zinkon,
                m3Rate: STANDARD_DOMAIN_RATE,
                isRoundTrip: true,
            },
            {
                destination: System.Delve,
                m3Rate: 300,
                isRoundTrip: true,
            },
            {
                destination: System.Serren,
                m3Rate: STANDARD_EXPORT_TO_JITA_RATE,
                isRoundTrip: true,
            },
            {
                destination: System.Querious,
                m3Rate: 300,
                isRoundTrip: true,
            },
            {
                destination: System.Amok,
                m3Rate: 250,
                isRoundTrip: true,
            },
        ]
    },
    {
        origin: System.Initiative,
        destinations: [
            {
                destination: System.Forge,
                m3Rate: STANDARD_EXPORT_TO_JITA_RATE,
            },
            {
                destination: System.ImperialPalace,
                m3Rate: FOUNTAIN_DELVE_RATE,
            },
        ]
    },
    {
        origin: System.Forge,
        destinations: [
            {
                destination: System.CloudRing,
                m3Rate: STANDARD_DOMAIN_RATE,
                isRoundTrip: true,
            },
            {
                destination: System.ImperialPalace,
                m3Rate: STANDARD_IMPORT_FROM_JITA_RATE - JITA_RATE_DISCOUNT,
                minReward: JITA_REDUCED_MIN_REWARD,
                isRoundTrip: IS_JITA_ROUND_TRIP,
            },
            {
                destination: System.Initiative,
                m3Rate: STANDARD_IMPORT_FROM_JITA_RATE,
            },
            {
                destination: System.Querious,
                m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 100,
                isRoundTrip: true,
            },
            {
                destination: System.Serren,
                m3Rate: FOUR_JUMP_RT,
                isRoundTrip: true,
            },
            {
                destination: System.Amok,
                m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 50,
                isRoundTrip: true,
            },
            {
                destination: System.PeriodBasis,
                m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 350,
                isRoundTrip: true,
            },
            {
                destination: System.O4T,
                m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 750,
            },
            {
                destination: System.Deployment2023,
                m3Rate: 415,
                isRoundTrip: true,
            },
        ],
    },
    {
        origin: System.Irmalin,
        destinations: [
            {
                destination: System.Forge,
                m3Rate: STANDARD_EXPORT_TO_JITA_RATE,
            },
            {
                destination: System.ImperialPalace,
                m3Rate: 500,
            }
        ]
    },
    {
        origin: System.Zinkon,
        destinations: [
            {
                destination: System.Forge,
                m3Rate: STANDARD_EXPORT_TO_JITA_RATE,
            },
        ]
    },
] as Route[]

/**
 * Adds options to the select element representing routes serviced
 * @param dropdown
 * @param option
 */
function addRouteOption(dropdown :Element, option :string) {
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
        controls[i].addEventListener("invalid", (event) => {
            controls[i].classList.add("error");
        });
    }
}

/**
 * Calculate route reward and update UI
 */
function calculateRouteReward() {
    const form = document.getElementById("calc-form") as HTMLFormElement;
    const desiredRoute = document.getElementById("calc-route") as HTMLSelectElement;
    const desiredm3 = document.getElementById("calc-m3") as HTMLInputElement;
    const desiredCollateral = document.getElementById("calc-collateral") as HTMLInputElement;

    const route = routeMap[desiredRoute.value] as Destination;
    const maxVolume = route.maxM3 ?? defaults.maxM3;

    if (!isNaN(route.flatRate) && route.flatRate > 0){
        outputRouteReward(desiredRoute.value, route.flatRate.toLocaleString(), route.maxM3.toLocaleString(), "Flat Rate");
        return;
    }

    if(desiredm3.value == "" || desiredCollateral.value == "" ) {
        return;
    }

    desiredm3.classList.remove("error");
    desiredCollateral.classList.remove("error");

    if(! form.checkValidity()) {
        console.log("Form doesn't validate, not calculating reward");
        // Currently the form native validation only works with the hardcoded default m3
        outputRouteReward(desiredRoute.value, "Fix Invalid Input", maxVolume.toLocaleString(), "None");
        return;
    }

    if (Number(desiredm3.value) > maxVolume){
        console.log(`${desiredm3.value} m3 over the maximum of ${maxVolume} for route ${desiredRoute.value}`);
        desiredm3.classList.add("error");
        outputRouteReward(desiredRoute.value, "Desired Contract Volume is too Large", maxVolume.toLocaleString(), "None");
        return;
    }

    let desiredCollateralVal = Number(desiredCollateral.value) * MILLIONS;

    let m3Fee = Number(desiredm3.value) * route.m3Rate;
    let collateralFee = desiredCollateralVal * route.collateralRate;
    let calculatedReward = Math.max(m3Fee + collateralFee, route.minReward);

    let rateType = `Rate is ${route.m3Rate} isk/m3 + ${route.collateralRate * 100}% of collateral`;

    console.log(
        `Route: ${route},
        Rate: ${route.m3Rate},
        m3: ${desiredm3.value},
        Reward: ${calculatedReward},
        RateType: ${rateType},
    `);

    outputRouteReward(desiredRoute.value, calculatedReward.toLocaleString(), maxVolume.toLocaleString(), rateType);
}

function getCalcOutput(): HTMLSpanElement {
    return document.getElementById("calc-output") as HTMLSpanElement;
}

function clearCalcOutput(output: HTMLSpanElement) {
    while(output.firstChild) {
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

    const createElements = (term :string, val :string, id? :string, copyVal? :string) => {
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
async function copyToClipboard(id :string, value :string) {
    navigator.clipboard.writeText(value).then(() => {
        console.log(`clipboard copy "${value} (${id})"`);
        const tag = document.getElementById(id);
        tag.innerText = COPIED;
        setTimeout(() => {tag.innerText = CLICK_TO_COPY}, 1000);
    }, () => {
        console.log(`FAIL clipboard copy "${value} (${id})"`);
    });
}

window.onload = (event) => {
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

    registerEventHandlers();
}
