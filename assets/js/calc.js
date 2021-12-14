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
        while (_) try {
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
    System["Zinkon"] = "Zinkon";
    System["Irmalin"] = "Irmalin";
    System["Initiative"] = "B17O-R (INIT.)";
    System["Bastion"] = "57-KGB (BASTN)";
    System["Delta"] = "W-IX39 (\u0394 Sqad)";
    System["IFED"] = "E2-RDQ (IFED)";
    System["Serren"] = "Serren (KFU)";
    System["Amok"] = "K-6K16 (Am0k)";
})(System || (System = {}));
;
var ROUTE_SEP_ARROW = " ➠ ";
var ROUTE_SEP_ARROW_RT = " ⮂ ";
var CLICK_TO_COPY = " Click to Copy";
var COPIED = " Copied!";
var routeMap = {};
var STANDARD_IMPORT_FROM_JITA_RATE = 1100;
var STANDARD_EXPORT_TO_JITA_RATE = 1000;
var STANDARD_IMPORT_FROM_JITA_MIN = 10e6; // 10m
var FOUNTAIN_DELVE_RATE = 1100;
var FOUR_JUMP_RT = 800;
// Defaults where not otherwise specified
var defaults = {
    minReward: 30e6,
    maxCollateral: 10e9,
    rate: 800,
    maxM3: 335000,
    isRoundTrip: false
};
var RouteCalc = /** @class */ (function () {
    function RouteCalc(origin, destination) {
        this.origin = origin;
        this.destination = destination.destination;
        this.minReward = destination.minReward;
        this.maxM3 = destination.maxM3;
        this.rate = destination.rate;
        this.maxCollateral = destination.maxCollateral;
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
                minReward: STANDARD_IMPORT_FROM_JITA_MIN
            },
            {
                destination: System.Domain,
                rate: 800,
                isRoundTrip: true
            },
            {
                destination: System.Initiative,
                rate: FOUNTAIN_DELVE_RATE
            },
            {
                destination: System.Bastion,
                rate: FOUNTAIN_DELVE_RATE,
                isRoundTrip: true
            },
            {
                destination: System.IFED,
                rate: FOUR_JUMP_RT,
                isRoundTrip: true
            },
            {
                destination: System.Zinkon,
                rate: 800,
                isRoundTrip: true
            },
            {
                destination: System.Delve,
                rate: 600,
                isRoundTrip: true
            },
            {
                destination: System.Serren,
                rate: STANDARD_EXPORT_TO_JITA_RATE,
                isRoundTrip: true
            },
            {
                destination: System.Delta,
                rate: 800,
                isRoundTrip: true
            },
            {
                destination: System.Amok,
                rate: 500,
                isRoundTrip: true
            },
        ]
    },
    {
        origin: System.Initiative,
        destinations: [
            {
                destination: System.Forge,
                rate: STANDARD_EXPORT_TO_JITA_RATE
            },
            {
                destination: System.ImperialPalace,
                rate: FOUNTAIN_DELVE_RATE
            },
            {
                destination: System.Bastion,
                rate: 600,
                isRoundTrip: true
            },
        ]
    },
    {
        origin: System.Forge,
        destinations: [
            {
                destination: System.ImperialPalace,
                rate: STANDARD_IMPORT_FROM_JITA_RATE,
                minReward: STANDARD_IMPORT_FROM_JITA_MIN
            },
            {
                destination: System.Initiative,
                rate: STANDARD_IMPORT_FROM_JITA_RATE,
                minReward: STANDARD_IMPORT_FROM_JITA_MIN
            },
            {
                destination: System.Bastion,
                rate: STANDARD_IMPORT_FROM_JITA_RATE,
                minReward: STANDARD_IMPORT_FROM_JITA_MIN,
                isRoundTrip: true
            },
            {
                destination: System.Delta,
                rate: STANDARD_IMPORT_FROM_JITA_RATE + 200,
                minReward: STANDARD_IMPORT_FROM_JITA_MIN,
                isRoundTrip: true
            },
            {
                destination: System.Serren,
                rate: FOUR_JUMP_RT,
                isRoundTrip: true
            },
            {
                destination: System.Amok,
                rate: STANDARD_IMPORT_FROM_JITA_RATE + 100,
                minReward: STANDARD_IMPORT_FROM_JITA_MIN,
                isRoundTrip: true
            }
        ]
    },
    {
        origin: System.Irmalin,
        destinations: [
            {
                destination: System.Forge,
                rate: 900
            },
            {
                destination: System.ImperialPalace,
                rate: FOUR_JUMP_RT
            }
        ]
    },
    {
        origin: System.Zinkon,
        destinations: [
            {
                destination: System.Forge,
                rate: 900
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
    var form = document.getElementById("calc-form");
    var desiredRoute = document.getElementById("calc-route");
    var desiredm3 = document.getElementById("calc-m3");
    // const desiredCollateral = document.getElementById("calc-collateral") as HTMLInputElement;
    desiredm3.classList.remove("error");
    if (!form.checkValidity()) {
        console.log("Form doesn't validate, not calculating reward");
        return;
    }
    var route = routeMap[desiredRoute.value];
    var calculatedReward = Number(desiredm3.value) * route.rate;
    calculatedReward = Math.max(calculatedReward, route.minReward);
    console.log("Route: ".concat(route, ", Rate: ").concat(route.rate, ", m3: ").concat(desiredm3.value, ", Reward: ").concat(calculatedReward));
    outputRouteReward(desiredRoute.value, calculatedReward);
}
/**
 * Outputs the reward for a contract to the user
 */
function outputRouteReward(route, reward) {
    var output = document.getElementById("calc-output");
    output.style.visibility = "visible";
    while (output.firstChild) {
        output.removeChild(output.lastChild);
    }
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
    createElements("Reward", "".concat(reward.toLocaleString(), " ISK"), "reward", reward.toString());
    createElements("Time to Accept/Complete", "7 Days", "time-to-accept");
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
