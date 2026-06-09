import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function AdoptionChart({ pets }) {
  const adopted = pets.filter(p => p.status === "adopted").length;
  const available = pets.filter(p => p.status === "available").length;
  const pending = pets.filter(p => p.status === "pending").length;

  const data = [
    { name: "Adopted", value: adopted, color: "#10b981" },
    { name: "Available", value: available, color: "#3b82f6" },
    { name: "Pending", value: pending, color: "#f59e0b" },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Pet Adoption Status</h2>
      {pets.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-slate-400">
          No pets data available
        </div>
      )}
    </div>
  );
}