"use client";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend
);

export default function LineGraph({ dataPoints, labels }: any) {
  const data = {
    labels,
    datasets: [
      {
        label: "Monthly Solar Production (kWh)",
        data: dataPoints,
        borderColor: "#FFD700", // ⭐ Yellow line
        backgroundColor: "rgba(255, 215, 0, 0.25)", // ⭐ Yellow shading
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: "#FFD700"
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true, // ⭐ Start at 0,0
        ticks: { color: "#ffffff" },
        grid: { color: "rgba(255,255,255,0.1)" }
      },
      x: {
        ticks: { color: "#ffffff" },
        grid: { color: "rgba(255,255,255,0.05)" }
      }
    },
    plugins: {
      legend: {
        labels: { color: "#ffffff" }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.raw.toFixed(0)} kWh`
        }
      }
    }
  };

  return (
    <div style={{ width: "100%", height: "300px" }}>
      <Line data={data} options={options} />
    </div>
  );
}
