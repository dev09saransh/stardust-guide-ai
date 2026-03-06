import React from 'react';

const SummaryCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[
        { 
          title: "Total Assets", 
          value: "$125,890", 
          icon: "💰", 
          change: "+12.5% from last month",
          changeColor: "text-green-600"
        },
        { 
          title: "Insurance Policies", 
          value: "5 Active", 
          icon: "🛡️", 
          change: "3 new policies",
          changeColor: "text-blue-600"
        },
        { 
          title: "Legal Documents", 
          value: "12", 
          icon: "📑", 
          change: "2 updated",
          changeColor: "text-purple-600"
        },
        { 
          title: "Nominees", 
          value: "3", 
          icon: "👥", 
          change: "1 new nominee",
          changeColor: "text-indigo-600"
        }
      ].map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl">{card.icon}</div>
            <div className="text-gray-500 text-sm">Today</div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
          <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          <p className={`text-sm mt-2 ${card.changeColor}`}>{card.change}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;