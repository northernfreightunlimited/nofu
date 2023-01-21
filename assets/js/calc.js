var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var System;
(function (System) {
    System["ImperialPalace"] = "1DQ1-A";
    System["Delve"] = "Intra Delve";
    System["Forge"] = "Jita/Perimeter";
    System["Domain"] = "Amarr/Ashab";
    System["Ahbazon"] = "Ahbazon (Genesis)";
    System["Zinkon"] = "Zinkon";
    System["Irmalin"] = "Irmalin";
    System["Initiative"] = "B17O-R (INIT.)";
    System["Querious"] = "Querious";
    System["PeriodBasis"] = "Period Basis";
    System["Serren"] = "Serren (KFU)";
    System["Amok"] = "K-6K16 (Am0k)";
    System["DP"] = "D-PNP9 / O4T-Z5 (Esoteria / Paragon Soul)";
    System["NorthernSIGDeployment"] = "Northern SIG Deployment";
    System["CloudRing"] = "O-ZXUV (Cloud Ring)";
})(System || (System = {}));
;
var DEFAULT_ROUTE_SELECTION = "1DQ1-A ⮂ Jita/Perimeter";
var ROUTE_SEP_ARROW = " ➠ ";
var ROUTE_SEP_ARROW_RT = " ⮂ ";
var CLICK_TO_COPY = " Click to Copy";
var COPIED = " Copied!";
var routeMap = {};
var HIGH_COLLAT_REWARD_PERCENT = .01;
var JITA_REDUCED_MIN_REWARD = 10e6; // 10m
// Rates
var FOUR_JUMP_RT = 700;
var STANDARD_IMPORT_FROM_JITA_RATE = 850;
var STANDARD_EXPORT_TO_JITA_RATE = 850;
var STANDARD_DOMAIN_RATE = FOUR_JUMP_RT;
var FOUNTAIN_DELVE_RATE = 900;
// Defaults where not otherwise specified
var defaults = {
    minReward: 30e6,
    maxCollateral: 10e9,
    rate: 800,
    maxM3: 350000,
    isRoundTrip: false,
};
var RouteCalc = /** @class */ (function () {
    function RouteCalc(origin, destination) {
        var _a, _b, _c, _d;
        this.origin = origin;
        this.destination = destination.destination;
        this.minReward = (_a = destination.minReward) !== null && _a !== void 0 ? _a : defaults.minReward;
        this.maxM3 = (_b = destination.maxM3) !== null && _b !== void 0 ? _b : defaults.maxM3;
        this.rate = (_c = destination.rate) !== null && _c !== void 0 ? _c : defaults.rate;
        this.maxCollateral = (_d = destination.maxCollateral) !== null && _d !== void 0 ? _d : defaults.maxCollateral;
        this.isRoundTrip = destination.isRoundTrip;
    }
    RouteCalc.prototype.toString = function () {
        if (this.isRoundTrip) {
            return this.origin + ROUTE_SEP_ARROW_RT + this.destination;
        }
        return this.origin + ROUTE_SEP_ARROW + this.destination;
    };
    return RouteCalc;
}());
var routes = [
    {
        origin: System.ImperialPalace,
        destinations: [
            {
                destination: System.Forge,
                rate: STANDARD_EXPORT_TO_JITA_RATE,
                minReward: JITA_REDUCED_MIN_REWARD,
                isRoundTrip: STANDARD_EXPORT_TO_JITA_RATE == STANDARD_IMPORT_FROM_JITA_RATE,
            },
            {
                destination: System.DP,
                rate: 750,
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
];
/**
 * Adds options to the select element representing routes serviced
 * @param dropdown
 * @param option
 */
function addRouteOption(dropdown, option) {
    console.log("adding " + option);
    var routeOption = document.createElement("option");
    routeOption.value = option;
    routeOption.text = option;
    if (option == DEFAULT_ROUTE_SELECTION) {
        routeOption.selected = true;
    }
    dropdown.appendChild(routeOption);
}
/**
 * Register event handler on the form so we can calculate rewards
 * whenever the user changes something.
 */
function registerEventHandlers() {
    var form = document.getElementById("calc-form");
    var controls = form.getElementsByClassName("form-control");
    var _loop_1 = function (i) {
        controls[i].addEventListener("blur", calculateRouteReward);
        controls[i].addEventListener("invalid", function (event) {
            controls[i].classList.add("error");
        });
    };
    for (var i in controls) {
        _loop_1(i);
    }
}
/**
 * Calculate route reward and update UI
 */
function calculateRouteReward() {
    var _a;
    var form = document.getElementById("calc-form");
    var desiredRoute = document.getElementById("calc-route");
    var desiredm3 = document.getElementById("calc-m3");
    if (desiredm3.value == "") {
        return;
    }
    // const desiredCollateral = document.getElementById("calc-collateral") as HTMLInputElement;
    desiredm3.classList.remove("error");
    var route = routeMap[desiredRoute.value];
    var maxVolume = (_a = route.maxM3) !== null && _a !== void 0 ? _a : defaults.maxM3;
    if (!form.checkValidity()) {
        console.log("Form doesn't validate, not calculating reward");
        // Currently the form native validation only works with the hardcoded default m3
        outputRouteReward(desiredRoute.value, NaN.toLocaleString(), maxVolume.toLocaleString());
        return;
    }
    if (Number(desiredm3.value) > maxVolume) {
        console.log("".concat(desiredm3.value, " m3 over the maximum of ").concat(maxVolume, " for route ").concat(desiredRoute.value));
        desiredm3.classList.add("error");
        outputRouteReward(desiredRoute.value, NaN.toLocaleString(), maxVolume.toLocaleString());
        return;
    }
    var calculatedReward = Number(desiredm3.value) * route.rate;
    calculatedReward = Math.max(calculatedReward, route.minReward);
    console.log("Route: ".concat(route, ", Rate: ").concat(route.rate, ", m3: ").concat(desiredm3.value, ", Reward: ").concat(calculatedReward));
    outputRouteReward(desiredRoute.value, calculatedReward.toLocaleString(), maxVolume.toLocaleString());
}
function getCalcOutput() {
    return document.getElementById("calc-output");
}
function clearCalcOutput(output) {
    while (output.firstChild) {
        output.removeChild(output.lastChild);
    }
}
/**
 * Outputs the reward for a contract to the user
 */
function outputRouteReward(route, reward, maxM3) {
    var output = getCalcOutput();
    output.style.visibility = "visible";
    clearCalcOutput(output);
    var createElements = function (term, val, id, copyVal) {
        var termElem = document.createElement("dt");
        termElem.innerText = term;
        var valElem = document.createElement("dd");
        valElem.innerText = val;
        valElem.setAttribute("onClick", "copyToClipboard(\"".concat(id, "\", \"").concat(copyVal !== null && copyVal !== void 0 ? copyVal : val, "\")"));
        if (id != null) {
            var ctcElem = document.createElement("a");
            ctcElem.id = id;
            ctcElem.className = "click-to-copy";
            ctcElem.title = "click-to-copy";
            ctcElem.innerText = " Click to Copy";
            valElem.appendChild(ctcElem);
        }
        output.appendChild(termElem);
        output.appendChild(valElem);
    };
    var rewardStr = reward !== "NaN" ? "".concat(reward, " ISK") : "Desired Contract Volume Too High";
    createElements("Route", route);
    createElements("Contract To", "Northern Freight Unlimited [NOFU]", "corp-name", "Northern Freight Unlimited");
    createElements("Reward", rewardStr, "reward", reward);
    createElements("Time to Accept/Complete", "7 Days", "time-to-accept");
    createElements("Max Volume", "".concat(maxM3, " m3"));
}
/**
 * Copy contents of value to the system clipboard
 * @param value
 */
function copyToClipboard(id, value) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            navigator.clipboard.writeText(value).then(function () {
                console.log("clipboard copy \"".concat(value, " (").concat(id, ")\""));
                var tag = document.getElementById(id);
                tag.innerText = COPIED;
                setTimeout(function () { tag.innerText = CLICK_TO_COPY; }, 1000);
            }, function () {
                console.log("FAIL clipboard copy \"".concat(value, " (").concat(id, ")\""));
            });
            return [2 /*return*/];
        });
    });
}
window.onload = function (event) {
    console.log("onload called, populating route dropdown....");
    var routeDropdown = document.querySelector('#calc-route');
    var routeStrs = [];
    for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
        var route = routes_1[_i];
        for (var _a = 0, _b = route.destinations; _a < _b.length; _a++) {
            var destination = _b[_a];
            var r = new RouteCalc(route.origin, destination);
            var routeStr = r.toString();
            console.log("adding " + routeStr);
            routeStrs.push(routeStr);
            routeMap[routeStr] = r;
        }
    }
    console.log(routes);
    routeStrs = routeStrs.sort();
    for (var _c = 0, routeStrs_1 = routeStrs; _c < routeStrs_1.length; _c++) {
        var routeStr = routeStrs_1[_c];
        addRouteOption(routeDropdown, routeStr);
    }
    registerEventHandlers();
};
