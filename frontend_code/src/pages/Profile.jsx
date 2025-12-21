// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfile, saveProfile } from "../services/api";
import { toast } from "react-toastify";

/**
 * Profile page
 * - Uses existing getProfile() and saveProfile() from services/api
 * - Shows inline messages (err/ok) and also toast notifications
 * - Does NOT change your auth / routing / backend flow
 */

export default function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    hospital: "",
    specialization: "",
    phone: "",
    location: "",
    about: "",
  });

  // If not logged in, don't attempt to load profile
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setErr("");
    setOk("");
    setLoading(true);

    getProfile()
      .then((data) => {
        setForm({
          name: data.name || "",
          email: data.email || "",
          hospital: data.hospital || "",
          specialization: data.specialization || "",
          phone: data.phone || "",
          location: data.location || "",
          about: data.about || "",
        });
      })
      .catch((e) => {
        const message = (e && (e.message || e.toString())) || "Failed to load profile";
        setErr(message);
        // optional toast on load failure (you can remove if you prefer only save toasts)
        toast.error("❌ Failed to load profile");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setOk("");
    setErr("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("You must be signed in to update profile.");
      return;
    }

    setSaving(true);
    setErr("");
    setOk("");

    try {
      // saveProfile is expected to send PUT /api/profile (your existing function)
      const res = await saveProfile(form);

      // handle common response shapes:
      // { success: true, message: "...", profile: {...} }
      // or the API might return the profile directly
      if (res && res.success === false) {
        const m = res.message || "Update failed";
        throw new Error(m);
      }

      // Update local "user" store if display name changed (frontend-only)
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        const merged = { ...stored, name: form.name || stored.name };
        localStorage.setItem("user", JSON.stringify(merged));
      } catch {
        /* ignore localStorage parse errors */
      }

      // If API returned profile, use it to refresh UI
      if (res && res.profile && typeof res.profile === "object") {
        setForm((f) => ({ ...f, ...res.profile }));
      } else if (res && typeof res === "object" && "name" in res) {
        // some endpoints may return the profile directly
        setForm((f) => ({ ...f, ...res }));
      }

      setOk("Profile updated");
      toast.success("✅ Profile updated successfully");
    } catch (error) {
      const msg = (error && (error.message || error.toString())) || "Update failed";
      setErr(msg);
      toast.error(`❌ Failed to update profile${msg ? `: ${msg}` : ""}`);
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-3">Profile</h1>
          <p className="text-gray-600 mb-6">You’re not signed in. Please log in to view or edit your profile.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/login" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Go to Login
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-gray-600">These details are stored in the backend and will persist across logins.</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" onClick={() => navigate("/dashboard")}>
            ⟵ Back to Dashboard
          </button>
          <Link to="/logout" className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
            Logout
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-xl p-6">
        {loading ? (
          <p>Loading profile…</p>
        ) : (
          <>
            {err && <div className="mb-3 text-red-600">{err}</div>}
            {ok && <div className="mb-3 text-green-700">{ok}</div>}

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold">
                {form.name?.[0]?.toUpperCase() || form.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="text-lg font-semibold">{form.name || "Unnamed User"}</div>
                <div className="text-gray-600">{form.email}</div>
                <span className="inline-block mt-2 text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Authenticated</span>
              </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Display Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" placeholder="Dr. Jane Doe" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Email (read-only)</label>
                <input value={form.email} readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Hospital / Organization</label>
                <input name="hospital" value={form.hospital} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" placeholder="City General Hospital" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Specialization</label>
                <input name="specialization" value={form.specialization} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" placeholder="Hematology / Oncology" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" placeholder="+1 555 123 4567" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Location</label>
                <input name="location" value={form.location} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" placeholder="Bengaluru, IN" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">About / Notes</label>
                <textarea name="about" value={form.about} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="Clinic hours, preferred contact, research interests, etc." />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 mt-2">
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? "Saving…" : "Save Profile"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
