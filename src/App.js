const { json } = require('express');
const express = require('express');
const cors = require('cors');
const connection = require('./connection');
const app = express();
const {createNewUser, userLogin} = require("./query")

app.use(json());


app.use(cors())

app.post("/createUser", createNewUser);
app.post("/verifylogin", userLogin);

module.exports = app;