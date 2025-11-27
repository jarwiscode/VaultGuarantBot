import { pool } from "../db";

export async function getLoyaltySummary(userId: number) {
  const userRes = await pool.query(
    "select loyalty_points from users where id = $1",
    [userId]
  );
  const points = userRes.rows[0]?.loyalty_points ?? 0;

  const rewardsRes = await pool.query(
    "select * from loyalty_rewards where user_id = $1 order by created_at desc limit 20",
    [userId]
  );

  const redemptionsRes = await pool.query(
    "select * from loyalty_redemptions where user_id = $1 order by created_at desc limit 20",
    [userId]
  );

  return {
    points,
    rewards: rewardsRes.rows,
    redemptions: redemptionsRes.rows,
  };
}

