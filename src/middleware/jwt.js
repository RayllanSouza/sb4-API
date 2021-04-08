const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/cfg");
 
function JwtMiddleWare(request, response, next) {
    let { authorization } = request.headers;

    try {
        let token = authorization.split(" ")[1];
        let decoded = jwt.verify(token, JWT_SECRET, {});

        request.headers.decoded = decoded;
        next()
    } catch(err) {
        return response.status(401).send({
            Error: "JWT Invalid"
        })
    }
}

module.exports = JwtMiddleWare;