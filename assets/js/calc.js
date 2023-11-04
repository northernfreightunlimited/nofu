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
    System["O4T"] = "O4T-Z5 (Esoteria / Paragon Soul)";
    System["CloudRing"] = "F7C-H0 (Cloud Ring)";
    System["Deployment2023"] = "DO6H-Q (Fade Deployment)";
})(System || (System = {}));
;
var ROUTE_SEP_ARROW = " ➠ ";
var ROUTE_SEP_ARROW_RT = " ⮂ ";
var CLICK_TO_COPY = " Click to Copy";
var COPIED = " Copied!";
var routeMap = {};
var DEFAULT_COLLATERAL_PERCENTAGE_FEE = 0.0075; // 0.75%
var JITA_REDUCED_MIN_REWARD = 10e6; // 10m
var MILLIONS = 1e6; // 1m
// Rates
var FOUR_JUMP_RT = 700;
var STANDARD_IMPORT_FROM_JITA_RATE = 850;
var STANDARD_EXPORT_TO_JITA_RATE = 850;
var JITA_RATE_DISCOUNT = 0;
var IS_JITA_ROUND_TRIP = STANDARD_EXPORT_TO_JITA_RATE - STANDARD_IMPORT_FROM_JITA_RATE === 0;
var STANDARD_DOMAIN_RATE = FOUR_JUMP_RT;
var FOUNTAIN_DELVE_RATE = 900;
var DEFAULT_ROUTE_SELECTION = "1DQ1-A".concat(IS_JITA_ROUND_TRIP ? ROUTE_SEP_ARROW_RT : ROUTE_SEP_ARROW, "Jita/Perimeter");
// Defaults where not otherwise specified
var defaults = {
    minReward: 30e6,
    maxCollateral: 10e9,
    m3Rate: 800,
    collateralRate: DEFAULT_COLLATERAL_PERCENTAGE_FEE,
    maxM3: 350000,
    isRoundTrip: false,
    flatRate: NaN,
};
var RouteCalc = /** @class */ (function () {
    function RouteCalc(origin, destination) {
        var _a, _b, _c, _d, _e, _f;
        this.origin = origin;
        this.destination = destination.destination;
        this.minReward = (_a = destination.minReward) !== null && _a !== void 0 ? _a : defaults.minReward;
        this.maxM3 = (_b = destination.maxM3) !== null && _b !== void 0 ? _b : defaults.maxM3;
        this.m3Rate = (_c = destination.m3Rate) !== null && _c !== void 0 ? _c : defaults.m3Rate;
        this.collateralRate = (_d = destination.collateralRate) !== null && _d !== void 0 ? _d : defaults.collateralRate;
        this.maxCollateral = (_e = destination.maxCollateral) !== null && _e !== void 0 ? _e : defaults.maxCollateral;
        this.isRoundTrip = destination.isRoundTrip;
        this.flatRate = (_f = destination.flatRate) !== null && _f !== void 0 ? _f : defaults.flatRate;
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
                m3Rate: STANDARD_EXPORT_TO_JITA_RATE - JITA_RATE_DISCOUNT,
                minReward: JITA_REDUCED_MIN_REWARD,
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
                m3rate: 750,
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
    if (option === DEFAULT_ROUTE_SELECTION) {
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
    var desiredCollateral = document.getElementById("calc-collateral");
    var route = routeMap[desiredRoute.value];
    var maxVolume = (_a = route.maxM3) !== null && _a !== void 0 ? _a : defaults.maxM3;
    if (!isNaN(route.flatRate) && route.flatRate > 0) {
        outputRouteReward(desiredRoute.value, route.flatRate.toLocaleString(), route.maxM3.toLocaleString(), "Flat Rate");
        return;
    }
    if (desiredm3.value == "" || desiredCollateral.value == "") {
        return;
    }
    desiredm3.classList.remove("error");
    desiredCollateral.classList.remove("error");
    if (!form.checkValidity()) {
        console.log("Form doesn't validate, not calculating reward");
        // Currently the form native validation only works with the hardcoded default m3
        outputRouteReward(desiredRoute.value, "Fix Invalid Input", maxVolume.toLocaleString(), "None");
        return;
    }
    if (Number(desiredm3.value) > maxVolume) {
        console.log("".concat(desiredm3.value, " m3 over the maximum of ").concat(maxVolume, " for route ").concat(desiredRoute.value));
        desiredm3.classList.add("error");
        outputRouteReward(desiredRoute.value, "Desired Contract Volume is too Large", maxVolume.toLocaleString(), "None");
        return;
    }
    var desiredCollateralVal = Number(desiredCollateral.value) * MILLIONS;
    var m3Fee = Number(desiredm3.value) * route.m3Rate;
    var collateralFee = desiredCollateralVal * route.collateralRate;
    var calculatedReward = Math.max(m3Fee + collateralFee, route.minReward);
    var rateType = "Rate is ".concat(route.m3Rate, " isk/m3 + ").concat(route.collateralRate * 100, "% of collateral");
    console.log("Route: ".concat(route, ",\n        Rate: ").concat(route.m3Rate, ",\n        m3: ").concat(desiredm3.value, ",\n        Reward: ").concat(calculatedReward, ",\n        RateType: ").concat(rateType, ",\n    "));
    outputRouteReward(desiredRoute.value, calculatedReward.toLocaleString(), maxVolume.toLocaleString(), rateType);
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
function outputRouteReward(route, reward, maxM3, rateType) {
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
    createElements("Route", route);
    createElements("Contract To", "Northern Freight Unlimited [NOFU]", "corp-name", "Northern Freight Unlimited");
    createElements("Reward", reward, "reward", reward);
    createElements("Contract Rate Structure", rateType);
    createElements("Time to Accept/Complete", "14 day accept / 7 day complete");
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
    console.log("DEFAULT_ROUTE_SELECTION=", DEFAULT_ROUTE_SELECTION);
    routeStrs = routeStrs.sort();
    for (var _c = 0, routeStrs_1 = routeStrs; _c < routeStrs_1.length; _c++) {
        var routeStr = routeStrs_1[_c];
        addRouteOption(routeDropdown, routeStr);
    }
    registerEventHandlers();
};
