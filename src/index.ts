import express, { NextFunction, Request, Response } from "express";
import { DataSource } from "typeorm";
import { petition } from "./Petition";
import "reflect-metadata";

type timestamp = "daily" | "monthly" | "yearly" | "0";

const StatsDataSource = new DataSource({
    type: "sqlite",
    database: "stats.db",
    entities: [petition],
    synchronize: true
})

StatsDataSource.initialize(); //We initialize the sqlite db
const statsRepository = StatsDataSource.getRepository(petition); //and get a ref of the statsRepository

export const ComplexStats = (password: string, options?: { timestamp: timestamp }) => {
    if (!password || password.length < 1) throw new Error("Password is required"); //we see if user introduced password

    const router = express.Router();
    router.use(express.json());

    router.get("/", async (req: Request, res: Response) => { //We initialize a post to return the stats data
        if (password.length < 1) return res.status(500).send("Initialization not done properly");
        if (req.header("x-api-key") && req.header("x-api-key") === password) {
            const route = getParam(req.query.route);
            const type = getParam(req.query.type);
            const status = getParam(req.query.status);
            const timestamp = getParam(req.query.timestamp);
            return res.status(200).json(await getStats(route, type, status, timestamp));
        } else {
            return res.status(403).send("Not authorized");
        }
    })

    const middleware = async (req: Request, res: Response, next: NextFunction) => { //and we initialize the middleware
        const startTime = Date.now();
        res.on("finish", async () => {
            addPetition(req, res, startTime, options ? options.timestamp : "0");
        });
        next();
    }

    return { middleware, router }
}

const addPetition = async (req: Request, res: Response, startTime: number, Timestamp?: timestamp) => {
    const endTime = Date.now(); //get the endTime of the petition
    const time = endTime - startTime; //calculate the time
    const route = getRoute(req); //get the petition route
    const type = req.method; //get the method
    const status = res.statusCode; //get the status code

    const timestamp = getTimestamp(Timestamp);

    const exists = await statsRepository.findOneBy({ //we search if already an entry of type/route/status exists
        type: type,
        route: route,
        status: status,
        timestamp: timestamp
    });

    if (exists) return updatePetition(exists, time); //if exists, we update this entry with the added request and average_time
    else return createPetition(time, route, type, status, timestamp); //if not, we create the entry with the route, type, status and time
}

const updatePetition = async (peticion: petition, time: number) => {
    peticion.number_requests++; //we update the number of requests
    peticion.average_time = (peticion.average_time + time) / 2; //and update the average time
    await statsRepository.save(peticion); //and save the petition
}

const createPetition = async (time: number, route: string, type: string, status: number, timestamp: number) => {
    const peticion = new petition(); //we create a new object petition and add all the data
    peticion.type = type;
    peticion.route = route;
    peticion.status = status;
    peticion.number_requests = 1;
    peticion.average_time = time;
    peticion.timestamp = timestamp;

    await statsRepository.save(peticion); //and we save the new entry
}

const getRoute = (req: Request) => {
    const route = req.route ? req.route.path : '';
    const baseUrl = req.baseUrl ? req.baseUrl : '';

    return route ? `${baseUrl === '/' ? '' : baseUrl}${route}` : req.originalUrl;
}

const getStats = async (route: string, type: string, status: number, timestamp: number) => {
    return await statsRepository.find({
        where: {
            route: route,
            type: type,
            status: status,
            timestamp: timestamp
        }
    });
}

const getTimestamp = (timestamp?: timestamp) => {
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
}

const getParam = (param: any) => {
    try {
        return param.toString();
    } catch (e) {
        return undefined;
    }
}