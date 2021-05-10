const connection = require('../database/connection');

let SyncSQL = (sql, placeholders) => new Promise((resolve, reject) => {
    connection.query(sql, placeholders, (err, results, fields) => {
        if (err) return reject(err);
        return resolve(results);
    });
});

exports.IncreaseGameTime = async (req, res) => {
    let decoded = req.headers.decoded;
    let { game, increase } = req.body;

    console.log(`INCREASE ${increase} IN GAME ${game}`);

    try {

        let rows = await SyncSQL(`SELECT * FROM game_counters WHERE game = '${game}' AND username = '${decoded.userLogin}'`);

        if (rows.length > 0) {
            let time = rows[0].counter + increase;
            await SyncSQL(`UPDATE game_counters SET counter = ${time} WHERE game = '${game}' AND username = '${decoded.userLogin}'`);
        } else {
            let time = increase;
            await SyncSQL(`INSERT INTO game_counters (counter,game,username) VALUES(${time}, '${game}', '${decoded.userLogin}')`);
        }

        res.status(200).send({ increased: true });

    } catch(err) {
        return res.status(500).send({
            error: true,
            error_msg: "Internal Error"
        })
    }
}