const { Router } = require("express");
const { createNewUser, userLogin, sendFriendRequest, getUserFriendsRequest, acceptFriendRequest, getUserFriendList, getUserByUserLogin } = require("../controller/UserController")
const routes = Router();
const JwtMiddleWare = require("../middleware/jwt");

routes.post("/createUser", createNewUser);
routes.post("/verifylogin", userLogin);

routes.post("/refresh_token", JwtMiddleWare, (req, res) => res.status(200).send("sucess"));
routes.post("/check_token", JwtMiddleWare, (req, res) => {
    res.status(200).send({
        "status": "jwt is valid"
    });
});


routes.post("/get_user_friends_request", JwtMiddleWare, getUserFriendsRequest);
routes.post("/get_user_friend_list", JwtMiddleWare, getUserFriendList);

routes.post("/send_friend_request", JwtMiddleWare, sendFriendRequest);
routes.post("/accept_friend_request", JwtMiddleWare, acceptFriendRequest);

routes.post("/get_user_bt_userlogin", JwtMiddleWare, getUserByUserLogin);

module.exports = routes;