
enum System {
    ImperialPalace = "1DQ1-A",  // Can't use 1DQ as key here because it starts with a number
    Delve = "Intra Delve",
    Forge = "Jita/Perimeter",
    Domain = "Amarr/Ashab",
    Zinkon = "Zinkon",
    Irmalin = "Irmalin",
    Initiative = "B17O-R (INIT.)",
    Bastion = "57-KGB (BASTN)",
    Delta = "W-IX39 (Δ Sqad)",
    IFED = "E2-RDQ (IFED)",
    Serren = "Serren (KFU)",
    Uemon = "Uemon",
};

const ROUTE_SEP_ARROW = " ➠ ";
const CLICK_TO_COPY = " Click to Copy";
const COPIED = " Copied!";
const routeMap = {};

const STANDARD_IMPORT_FROM_JITA_RATE = 1400;
const STANDARD_EXPORT_TO_JITA_RATE = 800;
const STANDARD_IMPORT_FROM_JITA_MIN = 10e6;  // 10m
const FOUNTAIN_DELVE_RATE = 1100;
const FOUR_JUMP_RT = 800;

// Defaults where not otherwise specified
const defaults :Base = {
    minReward: 30e6,  // 30m
    maxCollateral: 10e9,  // 10b
    rate: 800,  // isk per m3
    maxM3: 335000,  // 335k m3
};

interface Base {
    minReward?: number,
    maxCollateral?: number,
    maxM3?: number,
    rate?: number,  // isk per m3
}

interface Destination extends Base {
    destination: string,
}

interface Route extends Base {
    origin: string,
    destinations: Destination[],
}

class RouteCalc implements Base {
    readonly minReward: number;
    readonly maxCollateral: number;
    readonly maxM3: number;
    readonly rate: number;  // isk per m3
    readonly origin: string;
    readonly destination: string;

    constructor(origin :string, destination :Destination) {
        this.origin = origin
        this.destination = destination.destination
        this.minReward = destination.minReward ?? defaults.minReward
        this.maxM3 = destination.maxM3 ?? defaults.maxM3
        this.rate = destination.rate ?? defaults.rate
        this.maxCollateral = destination.maxCollateral ?? defaults.maxCollateral
    }

    toString() :string {
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
                minReward: STANDARD_IMPORT_FROM_JITA_MIN,  // 10m
            },
            {
                destination: System.Domain,
                rate: 800,
            },
            {
                destination: System.Initiative,
                rate: FOUNTAIN_DELVE_RATE,
            },
            {
                destination: System.Bastion,
                rate: FOUNTAIN_DELVE_RATE,
            },
            {
                destination: System.IFED,
                rate: FOUR_JUMP_RT,
            },
            {
                destination: System.Irmalin,
                rate: 600,
            },
            {
                destination: System.Zinkon,
                rate: 800,
            },
            {
                destination: System.Delve,
                rate: 600,
            },
            {
                destination: System.Serren,
                rate: STANDARD_EXPORT_TO_JITA_RATE,
            },
            {
                destination: System.Delta,
                rate: 800,
            }
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
            {
                destination: System.Bastion,
                rate: 600,
            },
        ]
    },
    {
        origin: System.Bastion,
        destinations: [
            {
                destination: System.Initiative,
                rate: 600,
            },
            {
                destination: System.ImperialPalace,
                rate: FOUNTAIN_DELVE_RATE,
            },
            {
                destination: System.Forge,
                rate: STANDARD_EXPORT_TO_JITA_RATE,
            },
        ],
    },
    {
        origin: System.Delve,
        destinations: [
            {
                destination: System.ImperialPalace,
                rate: 600,
            },
        ],
    },
    {
        origin: System.IFED,
        destinations: [
            {
                destination: System.ImperialPalace,
                rate: FOUR_JUMP_RT,
            },
        ],
    },
    {
        origin: System.Forge,
        destinations: [
            {
                destination: System.ImperialPalace,
                rate: STANDARD_IMPORT_FROM_JITA_RATE,
                minReward: STANDARD_IMPORT_FROM_JITA_MIN,
            },
            {
                destination: System.Initiative,
                rate: STANDARD_IMPORT_FROM_JITA_RATE,
                minReward: STANDARD_IMPORT_FROM_JITA_MIN,
            },
            {
                destination: System.Bastion,
                rate: STANDARD_IMPORT_FROM_JITA_RATE,
                minReward: STANDARD_IMPORT_FROM_JITA_MIN,
            },
            {
                destination: System.Delta,
                rate: STANDARD_IMPORT_FROM_JITA_RATE + 200,
                minReward: STANDARD_IMPORT_FROM_JITA_MIN,
            },
            {
                destination: System.Serren,
                rate: FOUR_JUMP_RT,
            },
            {
                destination: System.Uemon,
                rate: FOUR_JUMP_RT,
            },
        ],
    },
    {
        origin: System.Domain,
        destinations: [
            {
                destination: System.ImperialPalace,
                rate: 900,
            },
        ],
    },
    {
        origin: System.Irmalin,
        destinations: [
            {
                destination: System.ImperialPalace,
                rate: 600,
            },
            {
                destination: System.Forge,
                rate: 900,
            },
        ]
    },
    {
        origin: System.Zinkon,
        destinations: [
            {
                destination: System.ImperialPalace,
                rate: 800,
            },
            {
                destination: System.Forge,
                rate: 900,
            },
        ]
    },
    {
        origin: System.Serren,
        destinations: [
            {
                destination: System.ImperialPalace,
                rate: STANDARD_IMPORT_FROM_JITA_RATE,
            },
            {
                destination: System.Forge,
                rate: 600,
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
    // const desiredCollateral = document.getElementById("calc-collateral") as HTMLInputElement;

    desiredm3.classList.remove("error");

    if(! form.checkValidity()) {
        console.log("Form doesn't validate, not calculating reward");
        return;
    }

    const route = routeMap[desiredRoute.value];
    let calculatedReward = Number(desiredm3.value) * route.rate;
    calculatedReward = Math.max(calculatedReward, route.minReward);
    console.log(`Route: ${route}, Rate: ${route.rate}, m3: ${desiredm3.value}, Reward: ${calculatedReward}`);

    outputRouteReward(desiredRoute.value, calculatedReward);
}

/**
 * Outputs the reward for a contract to the user
 */
function outputRouteReward(route: string, reward: number) {
    const output = document.getElementById("calc-output") as HTMLSpanElement;
    output.style.visibility = "visible";
    while(output.firstChild) {
        output.removeChild(output.lastChild);
    }

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
    createElements("Reward", `${reward.toLocaleString()} ISK`, "reward", reward.toString());
    createElements("Time to Accept/Complete", "7 Days", "time-to-accept");
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