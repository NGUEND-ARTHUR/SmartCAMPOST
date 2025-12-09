export default function Settings() {
  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-600">
        Later we’ll use this page to configure hubs, service types, tariffs,
        notification templates, etc.
      </p>

      <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
        <div>
          <label
            htmlFor="appName"
            className="block text-xs font-medium text-slate-600"
          >
            Application name
          </label>
          <input
            id="appName"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/40"
            defaultValue="SmartCAMPOST"
            placeholder="Enter application name"
          />
        </div>

        <div>
          <label
            htmlFor="defaultCountry"
            className="block text-xs font-medium text-slate-600"
          >
            Default country
          </label>
          <input
            id="defaultCountry"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/40"
            defaultValue="Cameroon"
            placeholder="Enter default country"
          />
        </div>
      </div>
    </div>
  );
}
