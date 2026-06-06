"use client";

export default function BackButton() {
  return (
    <button
      className="btn"
      onClick={() => (window.location.href = "/")}
    >
      Run Another Analysis
    </button>
  );
}
