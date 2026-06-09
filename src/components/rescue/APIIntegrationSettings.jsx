import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, Zap, RefreshCw } from "lucide-react";

export default function APIIntegrationSettings({ rescueEmail }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("petfinder");
  const [formData, setFormData] = useState({
    api_key: "",
    api_secret: "",
    api_endpoint: "",
    petfinder_organization_id: "",
    sync_frequency: "on_demand",
    sync_pets: true,
    sync_applications: true,
  });
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["apiIntegrations", rescueEmail],
    queryFn: async () => {
      const results = await base44.entities.RescueAPIIntegration.filter({
        rescue_email: rescueEmail,
      });
      return results;
    },
  });

  const petfinderIntegration = integrations.find((i) => i.api_provider === "petfinder");
  const customIntegration = integrations.find((i) => i.api_provider === "custom");

  const { data: syncLogs = [] } = useQuery({
    queryKey: ["syncLogs", rescueEmail],
    queryFn: async () => {
      const logs = await base44.entities.SyncLog.filter(
        { rescue_email: rescueEmail },
        "-created_date",
        20
      );
      return logs;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.RescueAPIIntegration.create({
        rescue_email: rescueEmail,
        api_provider: selectedProvider,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiIntegrations", rescueEmail] });
      setShowForm(false);
      setSelectedProvider("petfinder");
      setFormData({
        api_key: "",
        api_secret: "",
        api_endpoint: "",
        petfinder_organization_id: "",
        sync_frequency: "on_demand",
        sync_pets: true,
        sync_applications: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const integration = selectedProvider === "petfinder" ? petfinderIntegration : customIntegration;
      return base44.entities.RescueAPIIntegration.update(integration.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiIntegrations", rescueEmail] });
      setShowForm(false);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke("syncPetfinderPets", {
        rescue_email: rescueEmail,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiIntegration", rescueEmail] });
      queryClient.invalidateQueries({ queryKey: ["syncLogs", rescueEmail] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentIntegration) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const currentIntegration = selectedProvider === "petfinder" ? petfinderIntegration : customIntegration;

  const handleSetProvider = (provider) => {
    setSelectedProvider(provider);
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading integration settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSetProvider("petfinder")}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedProvider === "petfinder"
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="font-semibold text-slate-900">Petfinder</div>
          <div className="text-xs text-slate-600 mt-1">
            {petfinderIntegration ? "Connected" : "Not connected"}
          </div>
        </button>
        <button
          onClick={() => handleSetProvider("custom")}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedProvider === "custom"
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="font-semibold text-slate-900">Custom API</div>
          <div className="text-xs text-slate-600 mt-1">
            {customIntegration ? "Connected" : "Not connected"}
          </div>
        </button>
      </div>
      {/* Main Integration Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedProvider === "petfinder" ? "Petfinder" : "Custom API"} Integration
              </CardTitle>
              <CardDescription>
                {selectedProvider === "petfinder"
                  ? "Sync adoptable pets from Petfinder to Good Dogs Here"
                  : "Connect your custom API endpoint for pet data sync"}
              </CardDescription>
            </div>
            {currentIntegration?.is_active && (
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentIntegration && !showForm ? (
            <>
              {/* Integration Status */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-slate-900">Integration Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Status</p>
                    <p className="text-slate-900 font-medium">
                      {currentIntegration.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Sync Frequency</p>
                    <p className="text-slate-900 font-medium capitalize">
                      {currentIntegration.sync_frequency.replace("_", " ")}
                    </p>
                  </div>
                  {currentIntegration.last_sync && (
                    <div>
                      <p className="text-slate-500 mb-1">Last Sync</p>
                      <p className="text-slate-900 font-medium">
                        {new Date(currentIntegration.last_sync).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Options */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-slate-900">Sync Options</h4>
                <div className="space-y-2 text-sm">
                   <div className="flex items-center gap-2">
                     <input
                       type="checkbox"
                       checked={currentIntegration.sync_pets}
                       readOnly
                       className="w-4 h-4"
                     />
                     <span className="text-slate-700">
                       Sync pets {selectedProvider === "petfinder" ? "from Petfinder" : "from API"}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <input
                       type="checkbox"
                       checked={currentIntegration.sync_applications}
                       readOnly
                       className="w-4 h-4"
                     />
                     <span className="text-slate-700">Sync application statuses</span>
                   </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg gap-2"
                >
                  {syncMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Sync Now
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowForm(true)}
                  variant="outline"
                  className="flex-1 rounded-lg"
                >
                  Edit Settings
                </Button>
              </div>
            </>
          ) : (
            /* Integration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedProvider === "petfinder" ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-900">
                      Petfinder API Key *
                    </label>
                    <input
                      type="text"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="Your Petfinder API key"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      Get this from{" "}
                      <a
                        href="https://www.petfinder.com/developers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Petfinder Developers
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-900">
                      Petfinder API Secret *
                    </label>
                    <input
                      type="password"
                      value={formData.api_secret}
                      onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                      placeholder="Your Petfinder API secret"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-900">
                      Petfinder Organization ID *
                    </label>
                    <input
                      type="text"
                      value={formData.petfinder_organization_id}
                      onChange={(e) =>
                        setFormData({ ...formData, petfinder_organization_id: e.target.value })
                      }
                      placeholder="e.g., CA123"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-900">
                      API Endpoint URL *
                    </label>
                    <input
                      type="url"
                      value={formData.api_endpoint}
                      onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                      placeholder="https://api.example.com/pets"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-900">
                      API Key (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="Your API key for authentication"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-900">
                      API Secret/Token (Optional)
                    </label>
                    <input
                      type="password"
                      value={formData.api_secret}
                      onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                      placeholder="Your API secret or bearer token"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900">
                  Sync Frequency
                </label>
                <select
                  value={formData.sync_frequency}
                  onChange={(e) => setFormData({ ...formData, sync_frequency: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="on_demand">On-Demand (Manual)</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div className="space-y-3 bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900">Sync Options</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sync_pets}
                    onChange={(e) => setFormData({ ...formData, sync_pets: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">Sync adoptable pets from Petfinder</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sync_applications}
                    onChange={(e) =>
                      setFormData({ ...formData, sync_applications: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">
                    Sync application statuses back to Petfinder
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                {currentIntegration && (
                  <Button
                    type="button"
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="flex-1 rounded-lg"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : currentIntegration ? (
                    "Update Settings"
                  ) : selectedProvider === "petfinder" ? (
                    "Connect Petfinder"
                  ) : (
                    "Connect API"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      {syncLogs.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Recent synchronization logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {syncLogs.map((log) => (
                <div key={log.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {log.status === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 capitalize">
                          {log.sync_type.replace("_", " ")}
                        </p>
                        <p className="text-sm text-slate-600">
                          {log.status === "success"
                            ? `${log.pets_synced || 0} pets synced, ${log.applications_synced || 0} applications`
                            : log.error_message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(log.created_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        log.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}