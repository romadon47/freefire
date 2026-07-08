const http = require('http');
const bp = require('body-parser');
const express = require('express');
const userAccountModel = require('./models/user_account');
const jwt = require('./libs/jwt');
const dateUtils = require('./libs/date_utils');
const exercises = require('./models/exercises');
const activities = require('./models/activities');

const app = express();
app.use(bp.urlencoded({ extended: true }));
app.use(bp.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const hostname = '127.0.0.1';
const port = 3000; 

const checkAccessToken = (req, res, next) => {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    } else {
        token = req.body.token;
    }
    jwt.verify(token)
        .then((decoded) => {
            req.decoded = decoded;
            next();
        }, (err) => {
            res.json({
                isError: false,
                result: false,
                errorMessage: "ยังไม่ได้เข้าสู่ระบบ"
            });
        });
}

app.get("/api/users", (req, res) => {
  var response = {
    isError: true,
    data: "You are unauthorized for this data"
  };
  res.send(JSON.stringify(response));
});

app.post("/api/multiple_by_2", (req, res) => {
  var response = {
    isError: false,
    data:{
      no1: req.body.no1 * 2,
      no2: req.body.no2 * 2
    }
  };
  res.send(JSON.stringify(response));
});

app.get("/api/user/:accountId", async (req, res) => {
  var accountId = req.params.accountId;
  var response = await userAccountModel.getUserAccountById(accountId);
  res.send(JSON.stringify(response));
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

app.post("/api/authen/authen_request", async (req, res) => {
    console.log("[authen_request] route hit");
    console.log("[authen_request] body:", req.body);
    const authenRequest = req.body.authen_request;
    console.log("[authen_request] authenRequest:", authenRequest);
    const result = await userAccountModel.checkAuthenRequest(authenRequest);
    console.log("[authen_request] result:", result);

    let response;
    if (result.isError) {
        response = { isError: true, data: "", errorMessage: result.errorMessage };
    } else {
        var payload = { username: result.data[0].account_username }
        const authenToken = jwt.sign(payload);
        console.log("[authen_request] authenToken:", authenToken);
        response = {
            isError: false,
            data: authenToken,
            errorMessage: ""
        }
    }

    res.send(JSON.stringify(response));
});

app.post("/api/authen/access_request", async (req, res) => {
    console.log("[access_request] route hit");
    console.log("[access_request] body:", req.body);
    const authenSignature = req.body.authen_signature;
    const authenToken = req.body.authen_token;

    console.log("[access_request] authenToken:", authenToken);
    console.log("[access_request] authenSignature:", authenSignature);

    let decoded;
    try {
        decoded = await jwt.verify(authenToken);
        console.log("[access_request] decoded authen token:", decoded);
    } catch (error) {
        console.log("[access_request] verify error:", error.message);
        res.send(JSON.stringify({
            isError: true,
            data: "",
            errorMessage: "ข้อมูลไม่ถูกต้อง"
        }));
        return;
    }

    let response;

    if (decoded) {
        const result = await userAccountModel.checkAccessRequest(authenSignature, authenToken);
        console.log("access request result:", result);

        if (result.isError) {
            response = { isError: true, data: "", errorMessage: result.errorMessage };
        } else {
            var payload = {
                user_id: result.data[0].account_id,
                username: result.data[0].account_username,
                image_url: result.data[0].account_image_url,
                date: dateUtils.getCurrentDateForToken()
            };

            const accessToken = jwt.sign(payload);
            console.log("accessToken:", accessToken);
            response = {
                isError: false,
                data: {
                    access_token: accessToken,
                    image_url: result.data[0].account_image_url
                },
                errorMessage: ""
            }
        }
    } else {
        response = {
            isError: true,
            data: "",
            errorMessage: "ข้อมูลไม่ถูกต้อง"
        };
    }

    res.send(JSON.stringify(response));
});

app.get("/api/exercises/get_all", checkAccessToken, async (req, res) => {
    const response = await exercises.getAllExercises();
    res.json(response);
});

app.get("/api/activities/get_all_by_user", checkAccessToken, async (req, res) => {
    console.log(req.decoded);
    const accountId = req.decoded.user_id;
    const response = await activities.getAllActivitiesByUser(accountId);
    res.json(response);
});