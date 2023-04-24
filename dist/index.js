"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplexStats = void 0;
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const Petition_1 = require("./Petition");
require("reflect-metadata");
const StatsDataSource = new typeorm_1.DataSource({
    type: "sqlite",
    database: "stats.db",
    entities: [Petition_1.petition],
    synchronize: true
});
StatsDataSource.initialize(); //We initialize the sqlite db
const statsRepository = StatsDataSource.getRepository(Petition_1.petition); //and get a ref of the statsRepository
const ComplexStats = (password, options) => {
    if (!password || password.length < 1)
        throw new Error("Password is required"); //we see if user introduced password
    const router = express_1.default.Router();
    router.use(express_1.default.json());
    router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (password.length < 1)
            return res.status(500).send("Initialization not done properly");
        if (req.header("x-api-key") && req.header("x-api-key") === password) {
            const route = getParam(req.query.route);
            const type = getParam(req.query.type);
            const status = getParam(req.query.status);
            const timestamp = getParam(req.query.timestamp);
            return res.status(200).json(yield getStats(route, type, status, timestamp));
        }
        else {
            return res.status(403).send("Not authorized");
        }
    }));
    const middleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const startTime = Date.now();
        res.on("finish", () => __awaiter(void 0, void 0, void 0, function* () {
            addPetition(req, res, startTime, options ? options.timestamp : "0");
        }));
        next();
    });
    return { middleware, router };
};
exports.ComplexStats = ComplexStats;
const addPetition = (req, res, startTime, Timestamp) => __awaiter(void 0, void 0, void 0, function* () {
    const endTime = Date.now(); //get the endTime of the petition
    const time = endTime - startTime; //calculate the time
    const route = getRoute(req); //get the petition route
    const type = req.method; //get the method
    const status = res.statusCode; //get the status code
    const timestamp = getTimestamp(Timestamp);
    const exists = yield statsRepository.findOneBy({
        type: type,
        route: route,
        status: status,
        timestamp: timestamp
    });
    if (exists)
        return updatePetition(exists, time); //if exists, we update this entry with the added request and average_time
    else
        return createPetition(time, route, type, status, timestamp); //if not, we create the entry with the route, type, status and time
});
const updatePetition = (peticion, time) => __awaiter(void 0, void 0, void 0, function* () {
    peticion.number_requests++; //we update the number of requests
    peticion.average_time = (peticion.average_time + time) / 2; //and update the average time
    yield statsRepository.save(peticion); //and save the petition
});
const createPetition = (time, route, type, status, timestamp) => __awaiter(void 0, void 0, void 0, function* () {
    const peticion = new Petition_1.petition(); //we create a new object petition and add all the data
    peticion.type = type;
    peticion.route = route;
    peticion.status = status;
    peticion.number_requests = 1;
    peticion.average_time = time;
    peticion.timestamp = timestamp;
    yield statsRepository.save(peticion); //and we save the new entry
});
const getRoute = (req) => {
    const route = req.route ? req.route.path : '';
    const baseUrl = req.baseUrl ? req.baseUrl : '';
    return route ? `${baseUrl === '/' ? '' : baseUrl}${route}` : req.originalUrl;
};
const getStats = (route, type, status, timestamp) => __awaiter(void 0, void 0, void 0, function* () {
    return yield statsRepository.find({
        where: {
            route: route,
            type: type,
            status: status,
            timestamp: timestamp
        }
    });
});
const getTimestamp = (timestamp) => {
    const d = new Date();
    d.setUTCHours(0);
    d.setUTCMinutes(0);
    d.setUTCSeconds(0);
    d.setUTCMilliseconds(0);
    switch (timestamp) {
        case "daily":
            return d.getTime();
        case "monthly":
            d.setUTCDate(1);
            return d.getTime();
        case "yearly":
            d.setUTCDate(1);
            d.setUTCMonth(0);
            return d.getTime();
        default:
            return 0;
    }
};
const getParam = (param) => {
    try {
        return param.toString();
    }
    catch (e) {
        return undefined;
    }
};
//# sourceMappingURL=index.js.map