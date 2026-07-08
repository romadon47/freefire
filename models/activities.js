const pool = require('../libs/db_pool');

module.exports = {
    getAllActivitiesByUser: async (accountId) => {
        let conn;
        let result;

        try {
            conn = await pool.getConnection();

            var sql = "SELECT a.act_id, a.ex_id, b.ex_name, "
                    + "DATE_FORMAT(a.act_date, '%d-%m-%Y %H:%i:%s') AS act_date, "
                    + "a.kcal_expense "
                    + "FROM activities a "
                    + "JOIN exercises b ON a.ex_id = b.ex_id "
                    + "WHERE account_id = ?";

            var rows = await conn.query(sql, [accountId]);

            result = {
                isError: false,
                data: rows,
                errorMessage: ""
            };
        } catch (error) {
            result = {
                isError: false,
                data: "",
                errorMessage: error.message
            }
        } finally {
            if (conn)
                conn.release();

            return result;
        }
    }
}