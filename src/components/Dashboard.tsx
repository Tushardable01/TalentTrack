import { StudentDashboard } from "./StudentDashboard";
import { CompanyDashboard } from "./CompanyDashboard";
import { AdminDashboard } from "./AdminDashboard";

interface DashboardProps {
  userProfile: {
    user: any;
    profile: any;
  };
}

export function Dashboard({ userProfile }: DashboardProps) {
  const { profile } = userProfile;

  if (!profile.isApproved && profile.role === "company") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Account Pending Approval
          </h2>
          <p className="text-yellow-700">
            Your company account is pending approval from the placement office. 
            You'll be able to post jobs once approved.
          </p>
        </div>
      </div>
    );
  }

  switch (profile.role) {
    case "student":
      return <StudentDashboard userProfile={userProfile} />;
    case "company":
      return <CompanyDashboard userProfile={userProfile} />;
    case "admin":
      return <AdminDashboard userProfile={userProfile} />;
    default:
      return <div>Invalid role</div>;
  }
}
