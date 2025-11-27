import React, { useState } from "react";
import { api } from "../api";

export const NewDealScreen: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await api.post("/app/deals", {
      amount: Number(amount),
      currency: "USDT",
      title,
      description,
    });
    setCreatedCode(res.data.code);
  }

  return (
    <div>
      <h2>Создать сделку</h2>
      <form className="form" onSubmit={submit}>
        <label>
          Название:
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Сумма USDT:
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label>
          Описание:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button className="primary" type="submit">
          Создать
        </button>
      </form>

      {createdCode && (
        <div className="card mt-2">
          Сделка создана. Код: <b>{createdCode}</b>
        </div>
      )}
    </div>
  );
};
