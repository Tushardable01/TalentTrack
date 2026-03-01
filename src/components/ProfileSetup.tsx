import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ProfileSetup() {
  const [role, setRole] = useState<"student" | "company" | "admin">("student");
  const [formData, setFormData] = useState({
    // Student fields
    studentId: "",
    branch: "",
    cgpa: "",
    graduationYear: "",
    skills: "",
    phone: "",
    // Company fields
    companyName: "",
    companyDescription: "",
    website: "",
    industry: "",
  });

  const createProfile = useMutation(api.users.createProfile);
  const adminEligibility = useQuery(api.users.checkAdminEligibility);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const profileData: any = { role };
      
      if (role === "student") {
        profileData.studentId = formData.studentId;
        profileData.branch = formData.branch;
        profileData.cgpa = formData.cgpa ? parseFloat(formData.cgpa) : undefined;
        profileData.graduationYear = formData.graduationYear ? parseInt(formData.graduationYear) : undefined;
        profileData.skills = formData.skills ? formData.skills.split(",").map(s => s.trim()) : [];
        profileData.phone = formData.phone;
      } else if (role === "company") {
        profileData.companyName = formData.companyName;
        profileData.companyDescription = formData.companyDescription;
        profileData.website = formData.website;
        profileData.industry = formData.industry;
      }

      await createProfile(profileData);
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error("Failed to create profile: " + (error as Error).message);
    }
  };

  const branches = [
    "Computer Science", "Information Technology", "Electronics", 
    "Mechanical", "Civil", "Electrical", "Chemical"
  ];

  const industries = [
    "Technology", "Finance", "Healthcare", "Manufacturing", 
    "Consulting", "E-commerce", "Education"
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 border border-emerald-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="student"
                  checked={role === "student"}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="capitalize">Student</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="company"
                  checked={role === "company"}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mr-2 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="capitalize">Company</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="admin"
                  checked={role === "admin"}
                  onChange={(e) => setRole(e.target.value as any)}
                  disabled={!adminEligibility?.isEligible}
                  className="mr-2 disabled:opacity-50 text-emerald-600 focus:ring-emerald-500"
                />
                <span className={`capitalize ${!adminEligibility?.isEligible ? 'text-gray-400' : ''}`}>
                  Admin
                </span>
              </label>
            </div>
            {role === "admin" && !adminEligibility?.isEligible && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">
                  Admin access is restricted to authorized personnel only. 
                  {adminEligibility?.email && (
                    <span className="block mt-1">
                      Current email: {adminEligibility.email}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Student Fields */}
          {role === "student" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch *
                  </label>
                  <select
                    required
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
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
                    value={formData.cgpa}
                    onChange={(e) => setFormData({...formData, cgpa: e.target.value})}
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
                    value={formData.graduationYear}
                    onChange={(e) => setFormData({...formData, graduationYear: e.target.value})}
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
                  placeholder="e.g., JavaScript, React, Python, Machine Learning"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </>
          )}

          {/* Company Fields */}
          {role === "company" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.companyDescription}
                  onChange={(e) => setFormData({...formData, companyDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Admin Notice */}
          {role === "admin" && adminEligibility?.isEligible && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
              <p className="text-emerald-800">
                Admin accounts have full access to manage students, companies, and placement activities.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={role === "admin" && !adminEligibility?.isEligible}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create Profile
          </button>
        </form>
      </div>
    </div>
  );
}
