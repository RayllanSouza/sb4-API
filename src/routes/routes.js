const { Router } = require("express");
const { createNewUser, userLogin, sendFriendRequest, getUserFriendsRequest, acceptFriendRequest, getUserFriendList, getUserByUserLogin, updateUserAvatar, updateUserName } = require("../controller/UserController");
const UserController = require("../controller/UserController");
const GameCounterController = require("../controller/GameCounterController");
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

routes.get("/get_all_avatars", UserController.getAllAvatars);
routes.get("/get_all_backgrounds", UserController.getAllBackgrounds);

routes.post("/get_user_friends_request", JwtMiddleWare, getUserFriendsRequest);
routes.post("/get_user_friend_list", JwtMiddleWare, getUserFriendList);

routes.post("/send_friend_request", JwtMiddleWare, sendFriendRequest);
routes.post("/accept_friend_request", JwtMiddleWare, acceptFriendRequest);
routes.post("/deny_friend_request", JwtMiddleWare, UserController.denyFriendRequest);

routes.post("/get_user_by_userlogin", JwtMiddleWare, getUserByUserLogin);

routes.put("/updateavatar", JwtMiddleWare, updateUserAvatar);
routes.put("/updatename", JwtMiddleWare, updateUserName);
routes.put("/updatedesc", JwtMiddleWare, UserController.updateUserDesc);

routes.post("/increase_game_counter", JwtMiddleWare, GameCounterController.IncreaseGameTime);

module.exports = routes;