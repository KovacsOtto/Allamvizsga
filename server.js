const express = require("express");

const app = express();

const dbConfig = require('./db')

const port = process.env.port || 5000;

app.listen(port, () => console.log('Node server started using nodemon'));