const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
const puppeteer = require("./modules/puppeteer");
puppeteer.init();
const treeBuilder = require("./modules/treeBuilder");
treeBuilder.init(puppeteer);
require('dotenv').config();

const checkAuth = async (req, res, next) => {
    let _token = req.headers['x-access-token'];
    if (!_token) {
        _token = req.query.token;
    }
    if (_token == "ZYDObSNLYWsISl1jNr3J2vT7t7xZBH") next()
    else res.status(401).json({ error: 'Not Authorised' })
}

app.post('/getLinktree', checkAuth, async (req, res) => {
    try {
        const response = await treeBuilder.accessQueue(req.body);
        if (!response.error) {
            res.json(response);
        } else {
            res.status(400).json(response);
        }
    }
    catch (error) {
        res.status(400).json({ error: true, info : error.message, stack : error.stack });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Index Linktree Server is running on http://localhost:${PORT}`);
});