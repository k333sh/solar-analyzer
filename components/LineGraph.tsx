"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function LineGraph({ dataPoints }: { dataPoints: number[] }) {
  const data = {
    labels: dataPoints.map((_, i) => `Year ${i + 1}`),
    datasets: [
      {
        label: "Annual Energy Production (kWh)",
        data: dataPoints,
        borderColor: "#000",
        backgroundColor: "rgba(0,0,0,0.3)",
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#000",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#000" } },
      y: { ticks: { color: "#000" } },
    },
  };

  return <Line data={data} options={options} />;
}
