import { useState } from "react";
import { useForm } from "react-hook-form";
import { useListSupportTickets, useCreateSupportTicket } from "../../../hooks/support";
import { Badge } from "../../components/ui/Badge";

interface TicketFormData {
  subject: string;
  category: string;
  priority: string;
  description: string;
}

export default function SupportTickets() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const { data: tickets, isLoading } = useListSupportTickets();
  const createTicket = useCreateSupportTicket();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TicketFormData>();

  const onSubmit = async (data: TicketFormData) => {
    try {
      await createTicket.mutateAsync(data);
      setShowCreateForm(false);
      reset();
    } catch (error) {
      console.error("Failed to create ticket:", error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "RESOLVED": return "success";
      case "IN_PROGRESS": return "warning";
      case "OPEN": return "info";
      case "CLOSED": return "default";
      default: return "error";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "HIGH": return "error";
      case "MEDIUM": return "warning";
      case "LOW": return "default";
      default: return "default";
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading support tickets...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Support Tickets</h1>
          <p className="text-slate-600">Get help with your parcels and account issues.</p>
        </div>

        {/* Create Ticket Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600"
          >
            {showCreateForm ? "Cancel" : "Create New Ticket"}
          </button>
        </div>

        {/* Create Ticket Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Support Ticket</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    {...register("subject", { required: "Subject is required" })}
                    placeholder="Brief description of your issue"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.subject && <p className="text-red-500 text-sm">{errors.subject.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    {...register("category", { required: "Category is required" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select category</option>
                    <option value="DELIVERY">Delivery Issue</option>
                    <option value="PAYMENT">Payment Issue</option>
                    <option value="TRACKING">Tracking Problem</option>
                    <option value="ACCOUNT">Account Issue</option>
                    <option value="TECHNICAL">Technical Support</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  {...register("priority", { required: "Priority is required" })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select priority</option>
                  <option value="LOW">Low - General inquiry</option>
                  <option value="MEDIUM">Medium - Issue affecting service</option>
                  <option value="HIGH">High - Urgent delivery issue</option>
                </select>
                {errors.priority && <p className="text-red-500 text-sm">{errors.priority.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  {...register("description", { required: "Description is required" })}
                  rows={5}
                  placeholder="Please provide detailed information about your issue..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={createTicket.isPending}
                  className="bg-amber-500 text-white px-6 py-2 rounded hover:bg-amber-600 disabled:opacity-50"
                >
                  {createTicket.isPending ? "Creating..." : "Create Ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                  }}
                  className="bg-slate-100 text-slate-900 px-6 py-2 rounded hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Your Support Tickets</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {tickets?.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      #{ticket.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {ticket.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!tickets || tickets.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              No support tickets found. Create your first ticket to get help.
            </div>
          )}
        </div>

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Ticket #{selectedTicket.id}</h3>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-700">Subject:</span>
                      <p className="text-slate-900">{selectedTicket.subject}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">Status:</span>
                      <div className="mt-1">
                        <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>
                          {selectedTicket.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">Category:</span>
                      <p className="text-slate-900">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">Priority:</span>
                      <div className="mt-1">
                        <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-slate-700">Description:</span>
                    <p className="text-slate-900 mt-1">{selectedTicket.description}</p>
                  </div>

                  {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-slate-700">Responses:</span>
                      <div className="mt-2 space-y-3">
                        {selectedTicket.responses.map((response: any, index: number) => (
                          <div key={index} className="bg-slate-50 rounded p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-slate-700">
                                {response.author} ({response.authorRole})
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(response.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-900">{response.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium text-slate-700">Created:</span>
                    <p className="text-slate-900">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1 bg-slate-100 text-slate-900 px-4 py-2 rounded hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}