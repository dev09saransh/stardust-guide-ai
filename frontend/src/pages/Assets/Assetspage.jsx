import React, { useState } from 'react';
import Navigation from '../../components/Dashboard/Navigation';

const Assetspage = () => {
  const [assets, setAssets] = useState([
    {
      id: 1,
      type: 'Property',
      name: 'Family Home',
      value: '$450,000',
      description: 'Residential property in downtown area',
      dateAdded: '2023-10-15'
    },
    {
      id: 2,
      type: 'Investment',
      name: 'Stock Portfolio',
      value: '$125,000',
      description: 'Diversified stock investments',
      dateAdded: '2023-09-20'
    },
    {
      id: 3,
      type: 'Bank Account',
      name: 'Savings Account',
      value: '$35,000',
      description: 'Emergency fund savings',
      dateAdded: '2023-11-05'
    },
    {
      id: 4,
      type: 'Vehicle',
      name: 'Family Car',
      value: '$28,000',
      description: '2022 SUV - 30,000 miles',
      dateAdded: '2023-08-12'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
              <p className="text-gray-500 mt-2">Manage and track all your family assets</p>
            </div>
            <button className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
              + Add Asset
            </button>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">
                    {asset.type.charAt(0)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{asset.dateAdded}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">{asset.name}</h3>
              <p className="text-gray-500 text-sm mb-3">{asset.type}</p>

              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">Value</p>
                <p className="text-2xl font-bold text-gray-900">{asset.value}</p>
              </div>

              <p className="text-gray-600 text-sm mb-4">{asset.description}</p>

              <div className="flex space-x-3">
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  Edit
                </button>
                <button className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Assetspage;