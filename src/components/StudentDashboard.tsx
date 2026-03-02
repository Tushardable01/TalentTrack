import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface StudentDashboardProps {
  userProfile: {
    user: any;
    profile: any;
  };
}

export function StudentDashboard({ userProfile }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"jobs" | "applications" | "profile">("jobs");
  const jobs = useQuery(api.jobs.getJobs, { isActive: true });
  const myApplications = useQuery(api.applications.getMyApplications);
  const applyForJob = useMutation(api.applications.applyForJob);
  const updateProfile = useMutation(api.users.updateProfile);
  const uploadResume = useMutation(api.users.uploadResume);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const [profileData, setProfileData] = useState({
    studentId: userProfile.profile.studentId || "",
    branch: userProfile.profile.branch || "",
    cgpa: userProfile.profile.cgpa?.toString() || "",
    graduationYear: userProfile.profile.graduationYear?.toString() || "",
    skills: userProfile.profile.skills?.join(", ") || "",
    phone: userProfile.profile.phone || "",
  });

  const handleApply = async (jobId: string) => {
    try {
      await applyForJob({ jobId: jobId as any });
      toast.success("Application submitted successfully!");
    } catch (error) {
      toast.error("Failed to apply: " + (error as Error).message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        studentId: profileData.studentId,
        branch: profileData.branch,
        cgpa: profileData.cgpa ? parseFloat(profileData.cgpa) : undefined,
        graduationYear: profileData.graduationYear ? parseInt(profileData.graduationYear) : undefined,
        skills: profileData.skills ? profileData.skills.split(",").map((s: string) => s.trim()) : [],
        phone: profileData.phone,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile: " + (error as Error).message);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      await uploadResume({ resumeId: storageId });
      toast.success("Resume uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload resume: " + (error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied": return "bg-blue-100 text-blue-800";
      case "shortlisted": return "bg-amber-100 text-amber-800";
      case "selected": return "bg-emerald-100 text-emerald-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const branches = [
    "Computer Science", "Information Technology", "Electronics", 
    "Mechanical", "Civil", "Electrical", "Chemical"
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {userProfile.user.name || userProfile.user.email}
        </h1>
        <p className="text-gray-600">Student Dashboard</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "jobs", label: "Available Jobs" },
            { id: "applications", label: "My Applications" },
            { id: "profile", label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Jobs Tab */}
      {activeTab === "jobs" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Available Jobs</h2>
          {jobs === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No jobs available at the moment.
            </div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div key={job._id} className="bg-white rounded-lg shadow-md p-6 border border-emerald-100 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-emerald-600 font-medium">{job.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">₹{job.package.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{job.location}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{job.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {job.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Eligibility:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Min CGPA: {job.eligibilityCriteria.minCgpa}</p>
                      <p>Branches: {job.eligibilityCriteria.branches.join(", ")}</p>
                      <p>Graduation Year: {job.eligibilityCriteria.graduationYear}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      <p>Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
                      <p>Applications: {job.applicationCount}</p>
                    </div>
                    <button
                      onClick={() => handleApply(job._id)}
                      disabled={myApplications?.some(app => app.jobId === job._id)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {myApplications?.some(app => app.jobId === job._id) ? "Applied" : "Apply Now"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">My Applications</h2>
          {myApplications === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : myApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You haven't applied to any jobs yet.
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((application) => (
                <div key={application._id} className="bg-white rounded-lg shadow-md p-6 border border-emerald-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{application.job.title}</h3>
                      <p className="text-emerald-600 font-medium">{application.job.companyName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Applied on: {new Date(application.appliedAt).toLocaleDateString()}</p>
                    <p>Package: ₹{application.job.package?.toLocaleString()}</p>
                    <p>Location: {application.job.location}</p>
                    {application.interviewDate && (
                      <p>Interview Date: {new Date(application.interviewDate).toLocaleDateString()}</p>
                    )}
                    {application.notes && (
                      <p>Notes: {application.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-emerald-100">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={profileData.studentId}
                    onChange={(e) => setProfileData({...profileData, studentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <select
                    value={profileData.branch}
                    onChange={(e) => setProfileData({...profileData, branch: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={profileData.cgpa}
                    onChange={(e) => setProfileData({...profileData, cgpa: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={profileData.graduationYear}
                    onChange={(e) => setProfileData({...profileData, graduationYear: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={profileData.skills}
                  onChange={(e) => setProfileData({...profileData, skills: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resume (PDF only)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {userProfile.profile.resumeId && (
                  <p className="text-sm text-emerald-600 mt-1">✓ Resume uploaded</p>
                )}
              </div>

              <button
                type="submit"
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
              >
                Update Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
