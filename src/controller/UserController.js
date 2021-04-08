const { v4: uuid, validate: isUuid } = require('uuid');
const bcrypt = require('bcrypt');
const connection = require('../database/connection');
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/cfg");

let SyncSQL = (sql, placeholders) => new Promise((resolve, reject) => {
    connection.query(sql, placeholders, (err, results, fields) => {
        if (err) return reject(err);
        return resolve(results);
    });
});

function hashPassword(password){
    const salt = 10;
    return new Promise((resolve, reject)=>{
        bcrypt.hash(password, salt, (error, hash)=>{
            if(error) return reject(error)
            resolve(hash)
        })
    })
}

exports.createNewUser = async function createNewUser(req, res){
    const { name, userLogin, userPassword, email, birthDate } = req.body;
    const hashedPassword = await hashPassword(userPassword);
    var insertUser = {
        id: uuid(),
        name: name,
        userLogin: userLogin,
        password: hashedPassword,
        email: email,
        birthDate: birthDate
    }

    try {
        let username_rows = await SyncSQL("SELECT * FROM users WHERE userLogin = ?", userLogin);
        let email_rows = await SyncSQL("SELECT * FROM users WHERE email = ?", email);

        let already_exist_username = username_rows.length > 0;
        let already_exist_email = email_rows.length > 0;

        if (already_exist_username) {
            return res.status(400).send({
                error: true,
                error_msg: "This username already in using!"
            });
        }

        if (already_exist_email) {
            return res.status(400).send({
                error: true,
                error_msg: "This email already in using!"
            });
        }

        await SyncSQL("INSERT INTO Users SET ?", insertUser);
        return res.status(201).json(insertUser);

    } catch(err) {
        return res.status(500).send({
            error: true
        })
    }
}

exports.userLogin = function userLogin(req, res){
    const {userLogin, userPassword} = req.body;
    connection.query("SELECT * FROM Users WHERE userLogin = ? ", userLogin, function(error, results, fields){
        if(error) throw error;
        if(results.length == 1){
            const passwordIsValid = bcrypt.compareSync(userPassword, results[0].password)
            if(passwordIsValid){
                let token = jwt.sign({
                    user_id: results[0].id,
                    userLogin: userLogin
                },
                JWT_SECRET,
                {
                    expiresIn: "1d"
                })

                return res.status(200).json({
                    Sucess: "User and password is valid",
                    token: token,
                    user_info: results[0]
                })
            }
           res.status(401).json({
               Erro: "Credentials invalid"
           });
        }else{            
            res.status(404).json({
                Error: "User Not found"
            });
        }
    })
}