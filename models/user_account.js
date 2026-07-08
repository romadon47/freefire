const pool = require('../libs/db_pool');
const dateUtils = require('../libs/date_utils');

module.exports = {
    getUserAccountById: async (accountId) => {
        let conn;
        let result;

        try {
            conn = await pool.getConnection();

            var sql = "SELECT account_id, account_username, account_image_url FROM user_accounts "
                + "WHERE account_id = ?";

            var rows = await conn.query(sql, [accountId]);

            result = {
                isError: false,
                data: rows
            };
        } catch (error) {
            result = {
                isError: false,
                errorMessage: error.message
            }
        } finally {
            if (conn)
                conn.release();

            return result;
        }
    },

    checkAuthenRequest: async (authenRequest) => {
        let conn;
        let result;

        try {
            conn = await pool.getConnection();

            var sql = "SELECT account_username FROM user_accounts WHERE "
                + "SHA2(CONCAT(account_username, '&', ?), 256) = ?";

            // First try with today's date
            var today = dateUtils.getCurrentDateForToken();
            var rows = await conn.query(sql, [today, authenRequest]);

            // If not found, try yesterday to tolerate timezone differences
            if (rows.length == 0) {
                var yesterday = dateUtils.getCurrentDateForToken(-1);
                rows = await conn.query(sql, [yesterday, authenRequest]);
            }

            if (rows.length == 0) {
                result = {
                    isError: true,
                    errorMessage: "ไม่พบข้อมูลผู้ใช้ในระบบ"
                }
            } else {
                result = {
                    isError: false,
                    data: rows
                };
            }
        } catch (error) {
            result = {
                isError: true,
                errorMessage: error.message
            }
        } finally {
            if (conn)
                conn.release();

            return result;
        }
    },

    checkAccessRequest: async (authenSignature, authenToken) => {
        let conn;
        let result;

        try {
            conn = await pool.getConnection();

            var sql = "SELECT account_id, account_username, account_image_url FROM user_accounts WHERE "
                + "SHA2(CONCAT(account_username, '&', account_password, '&', ?), 256) = ?";

            var rows = await conn.query(sql, [authenToken, authenSignature]);

            // If the stored password is plain text and the client sends SHA256(password),
            // try a secondary check using SHA2(account_password, 256).
            if (rows.length == 0) {
                sql = "SELECT account_id, account_username, account_image_url FROM user_accounts WHERE "
                    + "SHA2(CONCAT(account_username, '&', SHA2(account_password, 256), '&', ?), 256) = ?";
                rows = await conn.query(sql, [authenToken, authenSignature]);
            }

            if (rows.length == 0) {
                result = {
                    isError: true,
                    errorMessage: "รหัสผ่านไม่ถูกต้อง"
                }
            } else {
                result = {
                    isError: false,
                    data: rows
                };
            }
        } catch (error) {
            result = {
                isError: true,
                errorMessage: error.message
            }
        } finally {
            if (conn)
                conn.release();

            return result;
        }
    },
}