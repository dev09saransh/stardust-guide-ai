import React from 'react';

const RecentActivity = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        <a href="#" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
          View All
        </a>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[
              { date: "2023-10-15", activity: "Added new life insurance policy", status: "Completed" },
              { date: "2023-10-12", activity: "Updated legal document: Will", status: "Completed" },
              { date: "2023-10-10", activity: "Added new nominee: John Smith", status: "Completed" },
              { date: "2023-10-05", activity: "Added new asset: Investment Account", status: "Completed" }
            ].map((activity, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.activity}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {activity.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentActivity;