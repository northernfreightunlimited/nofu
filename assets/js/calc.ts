
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
    DP = "D-PNP9 / O4T-Z5 (Esoteria / Paragon Soul)",
    NorthernSIGDeployment = "Northern SIG Deployment",
    CloudRing = "O-ZXUV (Cloud Ring)",
};

const DEFAULT_ROUTE_SELECTION = "1DQ1-A ⮂ Jita/Perimeter";
const ROUTE_SEP_ARROW = " ➠ ";
const ROUTE_SEP_ARROW_RT = " ⮂ "
const CLICK_TO_COPY = " Click to Copy";
const COPIED = " Copied!";
const routeMap = {};

const HIGH_COLLAT_REWARD_PERCENT = .01;
const JITA_REDUCED_MIN_REWARD = 10e6;  // 10m

// Rates
const FOUR_JUMP_RT = 700;
const STANDARD_IMPORT_FROM_JITA_RATE = 850;
const STANDARD_EXPORT_TO_JITA_RATE = 850;
const STANDARD_DOMAIN_RATE = FOUR_JUMP_RT;
const FOUNTAIN_DELVE_RATE = 900;

// Defaults where not otherwise specified
const defaults = {
    minReward: 30e6,  // 30m
    maxCollateral: 10e9,  // 10b
    rate: 800,  // isk per m3
    maxM3: 350000,  // 350k m3
    isRoundTrip: false,
};

interface Destination {
    destination: string,
    minReward?: number,
    maxCollateral?: number,
    maxM3?: number,
    rate: number,  // isk per m3
    isRoundTrip?: boolean,
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
    readonly rate: number;  // isk per m3
    readonly isRoundTrip?: boolean;

    constructor(origin :string, destination :Destination) {
        this.origin = origin
        this.destination = destination.destination
        this.minReward = destination.minReward ?? defaults.minReward
        this.maxM3 = destination.maxM3 ?? defaults.maxM3
        this.rate = destination.rate ?? defaults.rate
        this.maxCollateral = destination.maxCollateral ?? defaults.maxCollateral
        this.isRoundTrip = destination.isRoundTrip
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
                rate: STANDARD_EXPORT_TO_JITA_RATE,
                minReward: JITA_REDUCED_MIN_REWARD,  // 10m
                isRoundTrip: STANDARD_EXPORT_TO_JITA_RATE == STANDARD_IMPORT_FROM_JITA_RATE,
            },
            {
                destination: System.DP,
                rate:  750,
                isRoundTrip: true,
            },
            {
                destination: System.CloudRing,
                rate: STANDARD_IMPORT_FROM_JITA_RATE + FOUR_JUMP_RT,
                isRoundTrip: true,
            },
            {
                destination: System.Ahbazon,
                rate: FOUR_JUMP_RT,
                isRoundTrip: true,
            },
            {
                destination: System.Domain,
                rate: STANDARD_DOMAIN_RATE,
                isRoundTrip: true,
            },
            {
                destination: System.Initiative,
                rate: FOUNTAIN_DELVE_RATE,
            },
            {
                destination: System.PeriodBasis,
                rate: FOUR_JUMP_RT,
                isRoundTrip: true,
            },
            {
                destination: System.Zinkon,
                rate: STANDARD_DOMAIN_RATE,
                isRoundTrip: true,
            },
            {
                destination: System.Delve,
                rate: 300,
                isRoundTrip: true,
            },
            {
                destination: System.Serren,
                rate: STANDARD_EXPORT_TO_JITA_RATE,
                isRoundTrip: true,
            },
            {
                destination: System.Querious,
                rate: 300,
                isRoundTrip: true,
            },
            {
                destination: System.Amok,
                rate: 250,
                isRoundTrip: true,
            },
        ]
    },
    {
        origin: System.Initiative,
        destinations: [
            {
                destination: System.Forge,
                rate: STANDARD_EXPORT_TO_JITA_RATE,
            },
            {
                destination: System.ImperialPalace,
                rate: FOUNTAIN_DELVE_RATE,
            },
        ]
    },
    {
        origin: System.Forge,
        destinations: [
            {
                destination: System.CloudRing,
                rate: STANDARD_DOMAIN_RATE,
                isRoundTrip: true,
            },
            {
                destination: System.NorthernSIGDeployment,
                rate: 400,
                isRoundTrip: true,
            },
            {
                destination: System.ImperialPalace,
                rate: STANDARD_IMPORT_FROM_JITA_RATE,
                minReward: JITA_REDUCED_MIN_REWARD,
                isRoundTrip: STANDARD_EXPORT_TO_JITA_RATE == STANDARD_IMPORT_FROM_JITA_RATE,
            },
            {
                destination: System.Initiative,
                rate: STANDARD_IMPORT_FROM_JITA_RATE,
            },
            {
                destination: System.Querious,
                rate: STANDARD_IMPORT_FROM_JITA_RATE + 100,
                isRoundTrip: true,
            },
            {
                destination: System.Serren,
                rate: FOUR_JUMP_RT,
                isRoundTrip: true,
            },
            {
                destination: System.Amok,
                rate: STANDARD_IMPORT_FROM_JITA_RATE + 50,
                minReward: JITA_REDUCED_MIN_REWARD,
                isRoundTrip: true,
            },
            {
                destination: System.PeriodBasis,
                rate: STANDARD_IMPORT_FROM_JITA_RATE + 350,
                isRoundTrip: true,
            },
            {
                destination: System.DP,
                rate: STANDARD_IMPORT_FROM_JITA_RATE + 750,
            },
        ],
    },
    {
        origin: System.Irmalin,
        destinations: [
            {
                destination: System.Forge,
                rate: STANDARD_EXPORT_TO_JITA_RATE,
            },
            {
                destination: System.ImperialPalace,
                rate: 500,
            }
        ]
    },
    {
        origin: System.Zinkon,
        destinations: [
            {
                destination: System.Forge,
                rate: STANDARD_EXPORT_TO_JITA_RATE,
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
    if (option == DEFAULT_ROUTE_SELECTION) {
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
    if(desiredm3.value == "") {
        return;
    }
    // const desiredCollateral = document.getElementById("calc-collateral") as HTMLInputElement;

    desiredm3.classList.remove("error");

    const route = routeMap[desiredRoute.value] as Destination;
    const maxVolume = route.maxM3 ?? defaults.maxM3;

    if(! form.checkValidity()) {
        console.log("Form doesn't validate, not calculating reward");
        // Currently the form native validation only works with the hardcoded default m3
        outputRouteReward(desiredRoute.value, NaN.toLocaleString(), maxVolume.toLocaleString());
        return;
    }

    if (Number(desiredm3.value) > maxVolume){
        console.log(`${desiredm3.value} m3 over the maximum of ${maxVolume} for route ${desiredRoute.value}`);
        desiredm3.classList.add("error");
        outputRouteReward(desiredRoute.value, NaN.toLocaleString(), maxVolume.toLocaleString());
        return;
    }

    let calculatedReward = Number(desiredm3.value) * route.rate;
    calculatedReward = Math.max(calculatedReward, route.minReward);
    console.log(`Route: ${route}, Rate: ${route.rate}, m3: ${desiredm3.value}, Reward: ${calculatedReward}`);

    outputRouteReward(desiredRoute.value, calculatedReward.toLocaleString(), maxVolume.toLocaleString());
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
function outputRouteReward(route: string, reward: string, maxM3: string) {
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

    const rewardStr = reward !== "NaN" ? `${reward} ISK` : "Desired Contract Volume Too High";

    createElements("Route", route);
    createElements("Contract To", "Northern Freight Unlimited [NOFU]", "corp-name", "Northern Freight Unlimited");
    createElements("Reward", rewardStr, "reward", reward);
    createElements("Time to Accept/Complete", "7 Days", "time-to-accept");
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
    console.log(routes)

    routeStrs = routeStrs.sort();
    for (const routeStr of routeStrs) {
        addRouteOption(routeDropdown, routeStr);
    }

    registerEventHandlers();
}