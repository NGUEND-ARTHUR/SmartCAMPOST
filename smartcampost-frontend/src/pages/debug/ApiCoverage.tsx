import React, { useState } from "react";
import coverage from "@/services/coverage/coverage.api";
import {
  ENDPOINTS,
  invokeEndpoint,
  EndpointDescriptor,
} from "@/services/coverage/coverage.api";
import axiosInstance from "@/lib/axiosClient";

export default function ApiCoverage() {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [bodies, setBodies] = useState<Record<string, string>>({});

  const call = async (ep: EndpointDescriptor) => {
    setLoading((l) => ({ ...l, [ep.id]: true }));
    try {
      const params: Record<string, string> = {};
      // extract {var} keys
      const matches = [...ep.path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
      matches.forEach((k) => {
        params[k] = pathParams[`${ep.id}::${k}`] || "";
      });
      const body = bodies[ep.id] ? JSON.parse(bodies[ep.id]) : undefined;
      const res = await invokeEndpoint(ep, params, body);
      setResponses((r) => ({ ...r, [ep.id]: { ok: true, data: res } }));
    } catch (err: any) {
      setResponses((r) => ({ ...r, [ep.id]: { ok: false, error: err } }));
    } finally {
      setLoading((l) => ({ ...l, [ep.id]: false }));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">API Coverage Debug Console</h2>
      <p className="text-sm mb-4">
        Use this page to call any backend endpoint discovered during audit.
      </p>
      <div className="space-y-4">
        {ENDPOINTS.map((ep) => (
          <div key={ep.id} className="border p-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <strong className="mr-2">{ep.method}</strong>
                <span>{ep.path}</span>
              </div>
              <div>
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => call(ep)}
                  disabled={!!loading[ep.id]}
                  aria-label={`Invoke endpoint ${ep.id}`}
                >
                  {loading[ep.id] ? "Calling..." : "Invoke"}
                </button>

                {/* Generic custom call to reach any endpoint not listed (kept outside the Invoke button) */}
                <div className="border p-3 rounded mb-4 mt-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col">
                      <label htmlFor={`method-${ep.id}`} className="sr-only">
                        HTTP method
                      </label>
                      <select
                        id={`method-${ep.id}`}
                        className="border p-1 rounded"
                        defaultValue="GET"
                        aria-label="Custom HTTP method"
                      >
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>PATCH</option>
                        <option>DELETE</option>
                      </select>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label htmlFor={`path-${ep.id}`} className="sr-only">
                        Request path
                      </label>
                      <input
                        id={`path-${ep.id}`}
                        className="border p-1 rounded w-full"
                        placeholder="/parcels/{id}"
                        aria-label="Custom request path"
                      />
                    </div>

                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded"
                      onClick={async () => {
                        const m = (
                          document.getElementById(
                            `method-${ep.id}`,
                          ) as HTMLSelectElement
                        ).value as any;
                        const p = (
                          document.getElementById(
                            `path-${ep.id}`,
                          ) as HTMLInputElement
                        ).value;
                        try {
                          const res = await axiosInstance.request({
                            url: p,
                            method: m,
                          });
                          setResponses((r) => ({
                            ...r,
                            ["__custom"]: {
                              ok: true,
                              status: 200,
                              data: res.data,
                            },
                          }));
                        } catch (err: any) {
                          const data = err?.response?.data ?? String(err);
                          const status = err?.response?.status ?? 0;
                          setResponses((r) => ({
                            ...r,
                            ["__custom"]: { ok: false, error: data, status },
                          }));
                        }
                      }}
                      aria-label="Invoke custom request"
                    >
                      Invoke Custom
                    </button>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs">Custom response</label>
                    <pre className="bg-muted p-2 rounded text-xs">
                      {responses["__custom"]
                        ? JSON.stringify(responses["__custom"], null, 2)
                        : "(no custom call yet)"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Path params inputs */}
            <div className="mt-2">
              {[...ep.path.matchAll(/\{([^}]+)\}/g)].map((m) => {
                const key = m[1];
                const inputId = `param-${ep.id}::${key}`;
                return (
                  <div key={key} className="mt-1">
                    <label htmlFor={inputId} className="block text-xs">
                      {key}
                    </label>
                    <input
                      id={inputId}
                      className="border rounded w-full p-1 text-sm"
                      value={pathParams[`${ep.id}::${key}`] || ""}
                      onChange={(e) =>
                        setPathParams((p) => ({
                          ...p,
                          [`${ep.id}::${key}`]: e.target.value,
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>

            {/* Body input */}
            <div className="mt-2">
              <label htmlFor={`body-${ep.id}`} className="block text-xs">
                Request body (JSON)
              </label>
              <textarea
                id={`body-${ep.id}`}
                className="border rounded w-full p-1 text-sm h-24"
                value={bodies[ep.id] || ""}
                onChange={(e) =>
                  setBodies((b) => ({ ...b, [ep.id]: e.target.value }))
                }
              />
            </div>

            {/* Response */}
            <div className="mt-2">
              <label className="block text-xs">Response</label>
              <pre className="bg-muted p-2 rounded text-xs">
                {responses[ep.id]
                  ? JSON.stringify(responses[ep.id], null, 2)
                  : "(no response yet)"}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
