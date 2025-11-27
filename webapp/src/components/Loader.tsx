import React from "react";

export const Loader: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="center">
      <div className="spinner" />
      {text && <div className="mt-2">{text}</div>}
    </div>
  );
};

