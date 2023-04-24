# EXPRESS-COMPLEX-STATS

Project based in [express-simple-stats](https://www.npmjs.com/package/express-simple-stats).

## Install
```shell
npm install express-complex-stats
```

## Usage
You have to initialize a new ComplexStats with a password and optionally a timestamp option. 
The timestamp option can be tunned to:
- daily
- monthly
- yearly
- 0 (no timestamp)

Then you define an endpoint for getting the stats and you include the middleware.

```js
import express, { Request, Response } from "express";
import { ComplexStats } from "./express-complex-stats";

const app = express();

const complexStats = ComplexStats("123456", { timestamp: "daily" });

app.use('/stats', complexStats.router)
//All the routes created before adding this middleware will not be counted
app.use(complexStats.middleware);

app.get('/api/', (req: Request, res: Response) => {
    res.sendStatus(200);
});

app.listen(3000, () => {
    console.log('Server started in http://localhost:3000')
})
```

The data is stored in an sqlite using typeorm.

## How to view the data?
You can use the `/stats` endpoint to view the data. You can also add query parameters to return only the data that you want to view. You have to add the key as a header.

The query parameters you can use are: 
- route (string)
- type (string)
- status (number)
- timestamp (number)

### Sample Request:
```http
GET http://localhost:3000/stats HTTP/1.1
content-type: application/json
x-api-key: 123456
```

### Sample Response:
```shell
[
  {
    "route": "/",
    "type": "GET",
    "status": 404,
    "number_requests": 7,
    "average_time": 2.390625,
    "timestamp": 1682294400000
  },
  {
    "route": "/error",
    "type": "GET",
    "status": 500,
    "number_requests": 2,
    "average_time": 3,
    "timestamp": 1682294400000
  },
  {
    "route": "/api/",
    "type": "GET",
    "status": 304,
    "number_requests": 2,
    "average_time": 2,
    "timestamp": 1682294400000
  }
]
```