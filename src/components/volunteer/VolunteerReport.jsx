import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";

export default function VolunteerReport({ userEmail }) {
  const { data: applications = [] } = useQuery({
    queryKey: ["volunteer-report", userEmail],
    queryFn: () =>
      base44.entities.VolunteerApplication.filter(
        { volunteer_email: userEmail },
        "-created_date"
      ),
  });

  const completedApps = applications.filter((app) => app.status === "completed");
  const totalHours = applications.reduce((sum, app) => sum + (app.hours_completed || 0), 0);
  const avgHoursPerPosition = completedApps.length > 0 ? (totalHours / completedApps.length).toFixed(1) : 0;

  const generatePDF = () => {
    let content = "VOLUNTEER CONTRIBUTION REPORT\n";
    content += "======================================\n\n";
    content += `Generated: ${format(new Date(), "PPP")}\n`;
    content += `Volunteer: ${userEmail}\n\n`;

    content += "SUMMARY\n";
    content += `Total Hours: ${totalHours}\n`;
    content += `Positions Completed: ${completedApps.length}\n`;
    content += `Average Hours per Position: ${avgHoursPerPosition}\n`;
    content += `Total Opportunities: ${applications.length}\n\n`;

    content += "CONTRIBUTIONS BY OPPORTUNITY\n";
    content += "======================================\n";
    applications.forEach((app) => {
      content += `\n${app.opportunity_title}\n`;
      content += `Organization: ${app.rescue_email}\n`;
      content += `Status: ${app.status}\n`;
      content += `Hours: ${app.hours_completed || 0}\n`;
      if (app.date_completed) {
        content += `Completed: ${format(new Date(app.date_completed), "PPP")}\n`;
      }
      if (app.notes) {
        content += `Notes: ${app.notes}\n`;
      }
    });

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", `volunteer-report-${format(new Date(), "yyyy-MM-dd")}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Your Impact Report
          </h2>
          <Button
            onClick={generatePDF}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Download className="w-4 h-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-slate-200">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-slate-600">Total Hours</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{totalHours}</div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-600">Completed</span>
          </div>
          <div className="text-3xl font-bold text-green-600">{completedApps.length}</div>
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-slate-600">Avg Hours</span>
          </div>
          <div className="text-3xl font-bold text-amber-600">{avgHoursPerPosition}</div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-slate-600">Total Opps</span>
          </div>
          <div className="text-3xl font-bold text-purple-600">{applications.length}</div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">All Contributions</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {applications.length === 0 ? (
            <p className="text-slate-500 text-sm">No volunteer positions yet.</p>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{app.opportunity_title}</h4>
                    <p className="text-xs text-slate-600">{app.rescue_email}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{app.hours_completed || 0} hrs</div>
                    <div className="text-xs text-slate-600">{app.status}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}