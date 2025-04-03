import React, { useState } from 'react';

export default function App() {
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState('');
  const [resolved, setResolved] = useState(null);
  const [chainedResult, setChainedResult] = useState(null);

  const resolveDNS = async () => {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=${recordType}`);
    const data = await res.json();
    setResolved(data);

    // Auto-chain CNAME
    if (data.Answer && data.Answer[0].type === 5) { // 5 = CNAME
      const cnameTarget = data.Answer[0].data;
      const chainedRes = await fetch(`https://dns.google/resolve?name=${cnameTarget}&type=A`);
      const chainedData = await chainedRes.json();
      setChainedResult(chainedData);
    } else {
      setChainedResult(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4">DNS Middle-Man Resolver + Tree</h1>
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Enter domain (e.g., aiready.io)"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Enter record type (A, CNAME, MX, TXT)"
        value={recordType}
        onChange={(e) => setRecordType(e.target.value)}
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={resolveDNS}>
        Resolve DNS
      </button>

      {/* Table Output */}
      {resolved && resolved.Answer && (
        <table className="mt-4 w-full text-left border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">TTL</th>
              <th className="p-2 border">Data</th>
            </tr>
          </thead>
          <tbody>
            {resolved.Answer.map((record, idx) => (
              <tr key={idx}>
                <td className="p-2 border">{record.name}</td>
                <td className="p-2 border">{record.type}</td>
                <td className="p-2 border">{record.TTL}</td>
                <td className="p-2 border">{record.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Graphical Tree */}
      {(resolved && resolved.Answer) && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Visual Tree</h2>
          <div className="ml-4">
            <div>🌳 <strong>Domain:</strong> {domain}</div>
            {resolved.Answer[0].type === 5 && (
              <div className="ml-4">↳ 🌿 <strong>CNAME:</strong> {resolved.Answer[0].data}</div>
            )}
            {chainedResult && chainedResult.Answer && (
              <div className="ml-8">↳ 🍃 <strong>Resolved IP(s):</strong> {chainedResult.Answer.map(r => r.data).join(', ')}</div>
            )}
            {resolved.Answer[0].type !== 5 && (
              <div className="ml-4">↳ 🍃 <strong>Direct Data:</strong> {resolved.Answer[0].data}</div>
            )}
          </div>
        </div>
      )}

      {resolved && !resolved.Answer && (
        <p className="mt-4 text-red-500">No records found or invalid query.</p>
      )}
    </div>
  );
}
