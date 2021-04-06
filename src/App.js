const { json } = require('express');
const express = require('express');
const cors = require('cors');
const connection = require('./connection');
const app = express();
const { v4: uuid, validate: isUuid } = require('uuid');
app.use(json());

app.use(cors())

app.post("/createUser", function(req, res){
    const {name, userLogin, userPassword, email, birthDate} = req.body;
    var insertUser = {
        id: uuid(),
        name: name,
        userLogin: userLogin,
        password: userPassword,
        email: email,
        birthDate: birthDate
    }
    connection.query("SELECT * FROM Users WHERE userLogin = ? ", userLogin, function(error, results, fields){
        if(error) throw error;
        if(results.length == 1){
            return res.status(400).json({
                Error: "There is already a registered user with this login"
            })
        }else{
            connection.query("INSERT INTO Users SET ?", insertUser, function(error, results, fields){
                if(error) throw error;
                return res.status(201).json(insertUser);
            })
        }
    })
})
module.exports = app;