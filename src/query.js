const { v4: uuid, validate: isUuid } = require('uuid');
const bcrypt = require('bcrypt');
const connection = require('./connection');

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
    const {name, userLogin, userPassword, email, birthDate} = req.body;
    const hashedPassword = await hashPassword(userPassword);
    var insertUser = {
        id: uuid(),
        name: name,
        userLogin: userLogin,
        password: hashedPassword,
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
}

exports.userLogin = function userLogin(req, res){
    const {userLogin, userPassword} = req.body;
    connection.query("SELECT * FROM Users WHERE userLogin = ? ", userLogin, function(error, results, fields){
        if(error) throw error;
        if(results.length == 1){
            const passwordIsValid = bcrypt.compareSync(userPassword, results[0].password)
            if(passwordIsValid){
                return res.status(200).json({
                    Sucess: "User and password is valid"
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