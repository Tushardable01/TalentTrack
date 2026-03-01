import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CompanyDashboardProps {
  userProfile: {
    user: any;
    profile: any;
  };
}

export function CompanyDashboard({ userProfile }: CompanyDashboardProps) {
  const [activeTab, setActiveTab] = useState<"jobs" | "applications" | "post-job">("jobs");
  const jobs = useQuery(api.jobs.getJobs, { companyId: userProfile.user._id });
  const applications = useQuery(api.applications.getApplications, {});
  const createJob = useMutation(api.jobs.createJob);
  const updateJobStatus = useMutation(api.jobs.updateJobStatus);
  const updateApplicationStatus = useMutation(api.applications.updateApplicationStatus);

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    requirements: "",
    package: "",
    location: "",
    jobType: "full-time" as "full-time" | "internship",
    minCgpa: "",
    branches: [] as string[],
    graduationYear: "",
    deadline: "",
    maxApplications: "",
  });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJob({
        title: jobForm.title,
        description: jobForm.description,
        requirements: jobForm.requirements.split("\n").filter(r => r.trim()),
        package: parseFloat(jobForm.package),
        location: jobForm.location,
        jobType: jobForm.jobType,
        eligibilityCriteria: {
          minCgpa: parseFloat(jobForm.minCgpa),
          branches: jobForm.branches,
          graduationYear: parseInt(jobForm.graduationYear),
        },
        deadline: new Date(jobForm.deadline).getTime(),
        maxApplications: jobForm.maxApplications ? parseInt(jobForm.maxApplications) : undefined,
      });
      
      toast.success("Job posted successfully!");
      setJobForm({
        title: "",
        description: "",
        requirements: "",
        package: "",
        location: "",
        jobType: "full-time",
        minCgpa: "",
        branches: [],
        graduationYear: "",
        deadline: "",
        maxApplications: "",
      });
      setActiveTab("jobs");
    } catch (error) {
      toast.error("Failed to create job: " + (error as Error).message);
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      await updateJobStatus({ jobId: jobId as any, isActive: !currentStatus });
      toast.success(`Job ${!currentStatus ? "activated" : "deactivated"} successfully!`);
    } catch (error) {
      toast.error("Failed to update job status: " + (error as Error).message);
    }
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string, 
    status: "applied" | "shortlisted" | "rejected" | "selected",
    notes?: string
  ) => {
    try {
      await updateApplicationStatus({ 
        applicationId: applicationId as any, 
        status,
        notes 
      });
      toast.success("Application status updated successfully!");
    } catch (error) {
      toast.error("Failed to update application status: " + (error as Error).message);
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

  // Filter applications for this company's jobs
  const companyApplications = applications?.filter(app => 
    jobs?.some(job => job._id === app.jobId)
  ) || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {userProfile.profile.companyName}
        </h1>
        <p className="text-gray-600">Company Dashboard</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "jobs", label: "My Jobs" },
            { id: "applications", label: "Applications" },
            { id: "post-job", label: "Post New Job" },
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
          <h2 className="text-xl font-semibold text-gray-900">Posted Jobs</h2>
          {jobs === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No jobs posted yet. Click "Post New Job" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job._id} className="bg-white rounded-lg shadow-md p-6 border border-emerald-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-gray-600">{job.location} • ₹{job.package.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        job.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {job.isActive ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => handleToggleJobStatus(job._id, job.isActive)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          job.isActive 
                            ? "bg-red-600 text-white hover:bg-red-700" 
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {job.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{job.description}</p>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Applications: {job.applicationCount}</p>
                    <p>Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
                    <p>Min CGPA: {job.eligibilityCriteria.minCgpa}</p>
                    <p>Branches: {job.eligibilityCriteria.branches.join(", ")}</p>
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
          <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
          {companyApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No applications received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {companyApplications.map((application) => (
                <div key={application._id} className="bg-white rounded-lg shadow-md p-6 border border-emerald-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.student.name || application.student.email}
                      </h3>
                      <p className="text-emerald-600 font-medium">{application.job?.title}</p>
                      <p className="text-gray-600 text-sm">
                        {application.student.profile?.branch} • 
                        CGPA: {application.student.profile?.cgpa} • 
                        {application.student.profile?.graduationYear}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Applied on: {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                    {application.student.profile?.skills && (
                      <p className="text-sm text-gray-600">
                        Skills: {application.student.profile.skills.join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateApplicationStatus(application._id, "shortlisted")}
                      disabled={application.status === "shortlisted"}
                      className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 disabled:bg-gray-400"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleUpdateApplicationStatus(application._id, "selected")}
                      disabled={application.status === "selected"}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:bg-gray-400"
                    >
                      Select
                    </button>
                    <button
                      onClick={() => handleUpdateApplicationStatus(application._id, "rejected")}
                      disabled={application.status === "rejected"}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Job Tab */}
      {activeTab === "post-job" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Post New Job</h2>
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-emerald-100">
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements (one per line) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Bachelor's degree in Computer Science&#10;2+ years of experience&#10;Knowledge of React and Node.js"
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({...jobForm, requirements: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={jobForm.package}
                    onChange={(e) => setJobForm({...jobForm, package: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobForm.location}
                    onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type *
                  </label>
                  <select
                    required
                    value={jobForm.jobType}
                    onChange={(e) => setJobForm({...jobForm, jobType: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="full-time">Full Time</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min CGPA *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    max="10"
                    value={jobForm.minCgpa}
                    onChange={(e) => setJobForm({...jobForm, minCgpa: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Graduation Year *
                  </label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2030"
                    value={jobForm.graduationYear}
                    onChange={(e) => setJobForm({...jobForm, graduationYear: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={jobForm.deadline}
                    onChange={(e) => setJobForm({...jobForm, deadline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eligible Branches *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {branches.map(branch => (
                    <label key={branch} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={jobForm.branches.includes(branch)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setJobForm({...jobForm, branches: [...jobForm.branches, branch]});
                          } else {
                            setJobForm({...jobForm, branches: jobForm.branches.filter(b => b !== branch)});
                          }
                        }}
                        className="mr-2 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm">{branch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors font-medium"
              >
                Post Job
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
