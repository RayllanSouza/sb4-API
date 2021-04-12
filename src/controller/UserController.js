const { v4: uuid, validate: isUuid } = require('uuid');
const bcrypt = require('bcrypt');
const connection = require('../database/connection');
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/cfg");
const crypto = require('crypto');

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

exports.getUserByUserLogin = async (req, res) => {
    const { userLogin } = req.body;
    console.log(userLogin);
    try {
        let username_rows = await SyncSQL("SELECT * FROM users WHERE userLogin = ?", userLogin);

        if (username_rows.length > 0) {
            return res.status(200).send({
                userFounded: true,
                userAvatar: username_rows[0].avatarIndex,
                userLogin: username_rows[0].userLogin,
                userName: username_rows[0].name
            })
        } else {
            return res.status(200).send({
                userFounded: false
            })
        }
    } catch (err) {
        console.log(err)
        return res.status(500).send({
            error: true,
            error_msg: "Internal Error"
        })
    }
}

exports.sendFriendRequest = async (req, res) => {
    const { sender_username, receiver_username } = req.body;

    if (sender_username == receiver_username) {
        return res.status(400).send({
            request_sent: true,
            reason: "Sender request is equal to receiver"
        })
    }

    try {
        let username_rows = await SyncSQL("SELECT * FROM users WHERE userLogin = ?", receiver_username);

        if (username_rows.length > 0) {

            let friend_requests_arr = JSON.parse(username_rows[0].friend_requests);

            let already_request = friend_requests_arr.find(element => element == sender_username);
            if (!already_request) {
                friend_requests_arr.push(sender_username);
            }

            await SyncSQL("UPDATE users SET friend_requests = ? WHERE userLogin = ?", [JSON.stringify(friend_requests_arr), receiver_username]);

            return res.status(200).send({
                request_sent: true,
                
                receiver_avatar: username_rows[0].avatarIndex,
                receiver_name: username_rows[0].name,
                receiver_login: username_rows[0].userLogin
            })
        } else {
            return res.status(404).send({
                request_sent: false,
                reason: "User not found"
            });
        }

    } catch(err) {
        return res.status(500).send({
            error: true,
            error_msg: "Internal Error"
        });
    }
}

exports.acceptFriendRequest = async (req, res) => {
    const { user_id, userLogin, iat, exp } = req.headers.decoded;
    const { user_accept } = req.body;

    try {

        let rows = await SyncSQL("SELECT * FROM users WHERE userLogin = ?", userLogin);
        
        let friend_requests = JSON.parse(rows[0].friend_requests);
        let friend_list = JSON.parse(rows[0].friend_list);

        let index = friend_requests.indexOf(user_accept);
        let index2 = friend_list.indexOf(user_accept);

        if (index > -1) {
            friend_requests.splice(index, 1);
        }

        if (index2 == -1) {
            friend_list.push(user_accept);
        }

        await SyncSQL("UPDATE users SET friend_requests = ? WHERE userLogin = ?", [JSON.stringify(friend_requests), userLogin]);
        await SyncSQL("UPDATE users SET friend_list = ? WHERE userLogin = ?", [JSON.stringify(friend_list), userLogin]);

    } catch(err) {
        console.log(err);

        return res.status(500).send({
            error: true,
            error_msg: "Internal Error"
        });
    }

    try {
        let rows = await SyncSQL("SELECT * FROM users WHERE userLogin = ?", user_accept);

        let friend_requests = JSON.parse(rows[0].friend_requests);
        let friend_list = JSON.parse(rows[0].friend_list);

        let index = friend_requests.indexOf(userLogin);
        let index2 = friend_list.indexOf(userLogin);

        if (index > -1) {
            friend_requests.splice(index, 1);
        }

        if (index2 == -1) {
            friend_list.push(userLogin);
        }

        await SyncSQL("UPDATE users SET friend_requests = ? WHERE userLogin = ?", [JSON.stringify(friend_requests), user_accept]);
        await SyncSQL("UPDATE users SET friend_list = ? WHERE userLogin = ?", [JSON.stringify(friend_list), user_accept]);

        res.status(200).send({
            userAccept: true
        });

    } catch(err) {
        return res.status(500).send({
            error: true,
            error_msg: "Internal Error"
        });
    }
}

exports.getUserFriendList = async (req, res) => {
    const { user_id, userLogin, iat, exp } = req.headers.decoded;

    try {

        let rows = await SyncSQL("SELECT * FROM users WHERE userLogin = ?", userLogin);

        if (rows.length > 0) {
            let friend_list = JSON.parse(rows[0].friend_list);
            let formatted_friend_list  = [];

            for (let i = 0; i < friend_list.length; i++) {
                let user = await SyncSQL("SELECT * FROM users WHERE userLogin = ?", friend_list[i]);

                if (user.length == 0) return;
                formatted_friend_list.push({ username: user[0].userLogin, avatar: user[0].avatarIndex });
            }

            return res.status(200).send({
                formatted_friend_list
            });
        } else {
            return res.status(404).send({
                reason: "User not found"
            });
        }

    } catch(err) {
        return res.status(500).send({
            error: true,
            error_msg: "Internal Error"
        });
    }
}

exports.getUserFriendsRequest = async (req, res) => {
    const { user_id, userLogin, iat, exp } = req.headers.decoded;

    try {
        let rows = await SyncSQL("SELECT * FROM users WHERE userLogin = ?", userLogin);

        if (rows.length > 0) {

            let friend_requests = JSON.parse(rows[0].friend_requests);

            let formatted_friend_requests = [];

            for (let i = 0; i < friend_requests.length; i++) {
                let user = await SyncSQL("SELECT * FROM users WHERE userLogin = ?", friend_requests[i]);

                if (user.length == 0) return;
                formatted_friend_requests.push({ username: user[0].userLogin, avatar: user[0].avatarIndex });
            }

            return res.status(200).send({
                formatted_friend_requests
            });
        } else {
            return res.status(404).send({
                reason: "User not found"
            });
        }

    } catch(err) {
        console.log(err);

        return res.status(500).send({
            error: true,
            error_msg: "Internal Error"
        });
    }
}

exports.updateUserAvatar = async (req, res)=>{
    const { userLogin, userAvatar } = req.body;
    try{
        const userResults = await SyncSQL('UPDATE users SET avatarIndex = ? WHERE userLogin = ?', [userAvatar, userLogin])
        return res.status(204).json(userResults)
    }catch(err){
        console.log(err)
        return res.status(500).send({
            error: true,
            error_msg: "Internal Error"
        })
    }
}

exports.updateUserName = async (req, res)=>{
    const { userName, userLogin} = req.body;
    try{
        const userResults = await SyncSQL('UPDATE users SET name = ? WHERE userLogin = ?', [userName, userLogin])
        return res.status(204).json(userResults)
    }catch(err){
        console.log(err)
        return res.status(500).send({
            error: true,
            error_msg: "Internal Error"
        })
    }
}

exports.userLogin = function userLogin(req, res){
    const { userLogin, userPassword } = req.body;

    console.log(userLogin, userPassword);

    connection.query("SELECT * FROM users WHERE userLogin = ? ", userLogin, function(error, results, fields){
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
            } else {
                res.status(401).json({
                    Erro: "Credentials invalid"
                });
            }
            
        }else {            
            res.status(404).json({
                Error: "User Not found"
            });
        }
    })
}