import { pool } from "../db";

export interface MarketGift {
  id: number;
  external_id: string | null;
  title: string;
  subtitle: string | null;
  category: string | null;
  price_points: number;
  image_url: string | null;
  gradient_key: string | null;
}

export async function listActiveGifts(): Promise<MarketGift[]> {
  const res = await pool.query<MarketGift>(
    `
      select
        id,
        external_id,
        title,
        subtitle,
        category,
        price_points,
        image_url,
        gradient_key
      from market_gifts
      where is_active = true
      order by position asc, id asc
    `
  );
  return res.rows;
}

