import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface AdminDashboardProps {
  userProfile: {
    user: any;
    profile: any;
  };
}

export function AdminDashboard({ userProfile }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "companies" | "students" | "jobs">("overview");
  const analytics = useQuery(api.admin.getAnalytics);
  const pendingCompanies = useQuery(api.admin.getPendingCompanies);
  const allStudents = useQuery(api.admin.getAllStudents);
  const allJobs = useQuery(api.jobs.getJobs, {});
  const approveCompany = useMutation(api.admin.approveCompany);

  const handleApproveCompany = async (companyId: string, isApproved: boolean) => {
    try {
      await approveCompany({ companyId: companyId as any, isApproved });
      toast.success(`Company ${isApproved ? "approved" : "rejected"} successfully!`);
    } catch (error) {
      toast.error("Failed to update company status: " + (error as Error).message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Placement Management System</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "companies", label: "Companies" },
            { id: "students", label: "Students" },
            { id: "jobs", label: "Jobs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
          
          {analytics === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
                  <p className="text-2xl font-bold text-blue-600">{analytics.totalStudents}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h3 className="text-sm font-medium text-gray-500">Active Companies</h3>
                  <p className="text-2xl font-bold text-green-600">{analytics.totalCompanies}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h3 className="text-sm font-medium text-gray-500">Total Jobs</h3>
                  <p className="text-2xl font-bold text-purple-600">{analytics.totalJobs}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h3 className="text-sm font-medium text-gray-500">Placements</h3>
                  <p className="text-2xl font-bold text-orange-600">{analytics.totalPlacements}</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Placement Rate</h3>
                  <p className="text-3xl font-bold text-green-600">{analytics.placementRate.toFixed(1)}%</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Package</h3>
                  <p className="text-3xl font-bold text-blue-600">₹{analytics.averagePackage.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Approvals</h3>
                  <p className="text-3xl font-bold text-red-600">{analytics.pendingCompanies}</p>
                </div>
              </div>

              {/* Branch-wise Stats */}
              <div className="bg-white rounded-lg shadow-md p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch-wise Placements</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.branchStats).map(([branch, count]) => (
                    <div key={branch} className="flex justify-between items-center">
                      <span className="text-gray-700">{branch}</span>
                      <span className="font-semibold text-blue-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === "companies" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Company Management</h2>
          
          {pendingCompanies === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingCompanies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending company approvals.
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
              {pendingCompanies.map((company) => (
                <div key={company._id} className="bg-white rounded-lg shadow-md p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{company.companyName}</h4>
                      <p className="text-gray-600">{company.user?.email}</p>
                      <p className="text-sm text-gray-500">{company.industry}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveCompany(company.userId, true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveCompany(company.userId, false)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{company.companyDescription}</p>
                  {company.website && (
                    <p className="text-blue-600">
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        {company.website}
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
          
          {allStudents === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CGPA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allStudents.map((student) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.user?.name || student.user?.email}
                            </div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.branch || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.cgpa || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.totalApplications}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.isPlaced 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {student.isPlaced ? "Placed" : "Not Placed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === "jobs" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Job Management</h2>
          
          {allJobs === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {allJobs.map((job) => (
                <div key={job._id} className="bg-white rounded-lg shadow-md p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-blue-600 font-medium">{job.companyName}</p>
                      <p className="text-gray-600">{job.location} • ₹{job.package.toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {job.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{job.description}</p>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Applications: {job.applicationCount}</p>
                    <p>Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
                    <p>Min CGPA: {job.eligibilityCriteria.minCgpa}</p>
                    <p>Branches: {job.eligibilityCriteria.branches.join(", ")}</p>
                    <p>Graduation Year: {job.eligibilityCriteria.graduationYear}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
