import React from 'react'

const IncomeSources = () => {
  const incomeSources = [
    {
      id: '1',
      name: 'General',
      description: 'General income from club sales.',
      clubId: 'club-101',
    },
    {
      id: '2',
      name: 'Subscription',
      description: 'Monthly membership fees.',
      clubId: 'club-102',
    },
    {
      id: '3',
      name: 'Green',
      description: 'Eco-friendly project donations.',
      clubId: 'club-103',
    },
    {
      id: '4',
      name: 'General',
      description: 'Annual fundraising event.',
      clubId: 'club-104',
    },
    {
      id: '5',
      name: 'Subscription',
      description: 'Recurring online course fees.',
      clubId: 'club-105',
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="min-w-full max-w-5xl  p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Income Sources</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-200">
            <thead>
              <tr className=" text-left text-sm font-semibold  uppercase">
                <th className="px-4 py-3 border-b">ID</th>
                <th className="px-4 py-3 border-b">Name</th>
                <th className="px-4 py-3 border-b">Description</th>
                <th className="px-4 py-3 border-b">Club ID</th>
              </tr>
            </thead>
            <tbody>
              {incomeSources.map((source) => (
                <tr key={source.id} className=" text-sm ">
                  <td className="px-4 py-2 border-b">{source.id}</td>
                  <td className="px-4 py-2 border-b">{source.name}</td>
                  <td className="px-4 py-2 border-b">{source.description}</td>
                  <td className="px-4 py-2 border-b">{source.clubId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default IncomeSources
