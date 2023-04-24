import * as express from "express";

type timestamp = "daily" | "monthly" | "yearly" | "0";

export interface ComplexStats {
    middleware: (req: express.Request, res: express.Response, next: express.NextFunction) => void;
    router: express.Router;
}

export declare function Stats(password: string, options?: { timestamp: timestamp }): ComplexStats;