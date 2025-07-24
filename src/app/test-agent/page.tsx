"use client";

import { useState } from 'react';

export default function TestAgentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
          AgentGroupChat Test
        </h1>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Setup</h2>
          <p className="text-neutral-600 dark:text-neutral-300 mb-4">
            Initialize the database with sample agents and a test group.
          </p>
          
          <button
            onClick={handleSeed}
            disabled={loading}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Seeding...' : 'Seed Database'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Database seeded successfully!</h3>
            <p className="text-sm">
              Created group: <strong>{result.data?.group?.name}</strong>
            </p>
            <p className="text-sm">
              Group ID: <code className="bg-green-200 dark:bg-green-800 px-1 rounded">{result.data?.group?.id}</code>
            </p>
            <p className="text-sm mt-2">
              <a 
                href={`/group/${result.data?.group?.id}`}
                className="text-orange-600 dark:text-orange-400 hover:underline"
              >
                → Go to group chat
              </a>
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
            <li>Make sure you have set up your <code>.env.local</code> file with a Google AI API key</li>
            <li>Click "Seed Database" above to create sample agents and a test group</li>
            <li>Navigate to the group chat using the link that appears</li>
            <li>Try sending a message like: "How should we build a todo app?"</li>
            <li>Watch the agents collaborate automatically!</li>
          </ol>
          
          <div className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-700 rounded">
            <h3 className="font-medium mb-2">Sample Agents Created:</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Maya</strong> - Product Manager</li>
              <li><strong>Zara</strong> - UX/UI Designer</li>
              <li><strong>Sam</strong> - Full-Stack Developer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
