import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../hooks/auth/useAuth";
import { useUpdateProfile } from "../../hooks/users/users";

interface ProfileFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      address: user?.address || "",
    }
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile Settings</h1>
          <p className="text-slate-600">Manage your account information and preferences.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    {...register("name", { required: "Name is required" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-slate-900 py-2">{user?.name || "Not provided"}</p>
                )}
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    {...register("phone", { required: "Phone is required" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-slate-900 py-2">{user?.phone || "Not provided"}</p>
                )}
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <p className="text-slate-900 py-2">{user?.email || "Not provided"}</p>
              )}
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              {isEditing ? (
                <textarea
                  {...register("address", { required: "Address is required" })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <p className="text-slate-900 py-2">{user?.address || "Not provided"}</p>
              )}
              {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
            </div>

            {/* Account Info (Read-only) */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <p className="text-slate-900 py-2 capitalize">{user?.role?.toLowerCase() || "Client"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Status</label>
                  <p className="text-slate-900 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user?.frozen ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}>
                      {user?.frozen ? "Frozen" : "Active"}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Member Since</label>
                <p className="text-slate-900 py-2">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="bg-amber-500 text-white px-6 py-2 rounded hover:bg-amber-600 disabled:opacity-50"
                >
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-slate-100 text-slate-900 px-6 py-2 rounded hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Security</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-slate-900">Change Password</h3>
                <p className="text-sm text-slate-600">Update your account password</p>
              </div>
              <button className="bg-slate-100 text-slate-900 px-4 py-2 rounded hover:bg-slate-200">
                Change Password
              </button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-slate-900">Two-Factor Authentication</h3>
                <p className="text-sm text-slate-600">Add an extra layer of security</p>
              </div>
              <button className="bg-slate-100 text-slate-900 px-4 py-2 rounded hover:bg-slate-200">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}