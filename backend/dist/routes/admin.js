"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.use(auth_1.adminMiddleware);
router.get("/users", async (_req, res) => {
    const users = await db_1.pool.query("select id, telegram_id, username, first_name, last_name, language, loyalty_points, is_admin, created_at from users order by created_at desc limit 100");
    return res.json(users.rows);
});
router.get("/deals", async (_req, res) => {
    const deals = await db_1.pool.query("select * from deals order by created_at desc limit 100");
    return res.json(deals.rows);
});
router.post("/deals/:id/resolve-dispute", async (req, res) => {
    const id = Number(req.params.id);
    const { resolution } = req.body;
    const result = await db_1.pool.query(`
      update deals
      set status = 'completed',
          dispute_resolution = $2,
          updated_at = now()
      where id = $1
      returning *;
    `, [id, resolution ?? null]);
    if (!result.rows[0]) {
        return res.status(404).json({ error: "NOT_FOUND" });
    }
    return res.json(result.rows[0]);
});
router.get("/config", async (_req, res) => {
    const result = await db_1.pool.query("select * from app_config");
    return res.json(result.rows);
});
router.put("/config/:key", async (req, res) => {
    const key = req.params.key;
    const value = req.body;
    const result = await db_1.pool.query(`
      insert into app_config (key, value)
      values ($1, $2)
      on conflict (key) do update set
        value = excluded.value,
        updated_at = now()
      returning *;
    `, [key, value]);
    return res.json(result.rows[0]);
});
exports.default = router;
