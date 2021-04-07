const { Router } = require("express");
const { createNewUser, userLogin } = require("../controller/UserController")
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

module.exports = routes;