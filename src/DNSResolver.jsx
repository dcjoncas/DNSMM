import React, { useState } from 'react';

export default function App() {
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState('A');
  const [resolved, setResolved] = useState(null);
  const [chainedResult, setChainedResult] = useState(null);
  const [showReference, setShowReference] = useState(false);
  const [sslInfo, setSslInfo] = useState(null);
  const [sslExpiry, setSslExpiry] = useState(null);
  const [lastChangedEstimate, setLastChangedEstimate] = useState(null);

  const resolveDNS = async () => {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=${recordType}`);
    const data = await res.json();
    setResolved(data);

    if (data.Answer && data.Answer[0].type === 5) {
      const cnameTarget = data.Answer[0].data;
      const chainedRes = await fetch(`https://dns.google/resolve?name=${cnameTarget}&type=A`);
      const chainedData = await chainedRes.json();
      setChainedResult(chainedData);
    } else {
      setChainedResult(null);
    }
  };

  const checkSSL = async () => {
    if (!domain) return;
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://' + domain)}`);
      const cert = res.headers.get("x-certificate-valid-until");
      if (cert) {
        const expiryDate = new Date(cert);
        const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        setSslInfo('Valid SSL Detected ✅');
        setSslExpiry(`Expires on: ${expiryDate.toDateString()} | Days Left: ${daysLeft}`);
      } else {
        setSslInfo('SSL Check Failed or Expiry Not Found ❌');
        setSslExpiry(null);
      }
    } catch {
      setSslInfo('SSL Check Failed ❌');
      setSslExpiry(null);
    }
  };

  const estimateLastChange = () => {
    if (!resolved || !resolved.Answer) {
      setLastChangedEstimate('No DNS info available.');
      return;
    }

    const ttl = resolved.Answer[0].TTL;
    const estimatedChange = new Date(Date.now() - ttl * 1000);
    const nextRefresh = new Date(estimatedChange.getTime() + ttl * 1000);
    setLastChangedEstimate(`Last Change Estimate: ${estimatedChange.toLocaleString()} | Next Refresh Around: ${nextRefresh.toLocaleString()}`);
  };

  const recordDescriptions = {
    "A": "Maps a domain to an IPv4 address.",
    "AAAA": "Maps a domain to an IPv6 address.",
    "CNAME": "Alias one domain to another domain.",
    "MX": "Mail Exchange - specifies mail servers.",
    "TXT": "Text records used for SPF, DKIM, DMARC, etc.",
    "NS": "Name Server - defines authoritative name servers.",
    "SRV": "Service locator for specific services.",
    "PTR": "Pointer record for reverse DNS lookups.",
    "SOA": "Start of Authority - information about the domain zone."
  };

  const recordValue = resolved?.Answer ? resolved.Answer[0].data : '';
  const ttlValue = resolved?.Answer ? resolved.Answer[0].TTL : null;
  const soaRecord = resolved?.Answer?.find(r => r.type === 6);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4">DNS Universal Resolver</h1>

      <button className="bg-gray-300 px-3 py-1 rounded" onClick={() => setShowReference(!showReference)}>
        {showReference ? "Hide Reference Table" : "Show Dynamic Reference Table"}
      </button>

      {showReference && resolved && resolved.Answer && (
        <table className="mt-4 w-full text-left border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Provider</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Name / Host</th>
              <th className="p-2 border">Value / Points to</th>
              <th className="p-2 border">TTL</th>
              <th className="p-2 border">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border">GoDaddy</td><td className="p-2 border">{recordType}</td><td className="p-2 border">{domain.includes('www') ? 'www' : '@'}</td><td className="p-2 border">{recordValue}</td><td className="p-2 border">1 hr</td><td className="p-2 border">GoDaddy input style</td></tr>
            <tr><td className="p-2 border">Cloudflare</td><td className="p-2 border">{recordType}</td><td className="p-2 border">{domain.includes('www') ? 'www' : '@'}</td><td className="p-2 border">{recordValue}</td><td className="p-2 border">Auto</td><td className="p-2 border">Cloudflare input style</td></tr>
            <tr><td className="p-2 border">Generic</td><td className="p-2 border">{recordType}</td><td className="p-2 border">{domain.includes('www') ? 'www' : '@'}</td><td className="p-2 border">{recordValue}</td><td className="p-2 border">Auto</td><td className="p-2 border">General usage</td></tr>
          </tbody>
        </table>
      )}

      <input className="border p-2 mb-2 w-full" placeholder="Enter domain (e.g., aiready.io)" value={domain} onChange={(e) => setDomain(e.target.value)} />

      <select className="border p-2 mb-2 w-full" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
        {Object.keys(recordDescriptions).map(type => (<option key={type} value={type}>{type} - {recordDescriptions[type]}</option>))}
      </select>

      <div className="flex gap-2 flex-wrap">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={resolveDNS}>Resolve DNS</button>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={checkSSL}>Check SSL</button>
        <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={estimateLastChange}>Estimate Last DNS Change</button>
      </div>

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

      {resolved && resolved.Answer && (
        <div className="mt-4 p-3 bg-yellow-100 border rounded space-y-2">
          <h3 className="font-semibold mb-2">Extra Insights</h3>
          <p><strong>TTL Remaining:</strong> {ttlValue ? `${ttlValue} seconds` : 'N/A'}</p>
          <p><strong>Chain Depth:</strong> {chainedResult ? '1 (CNAME detected)' : '0 (Direct record)'}</p>
          <p><strong>SOA Record:</strong> {soaRecord ? JSON.stringify(soaRecord) : 'No SOA record found in this query'}</p>
        </div>
      )}

      {sslInfo && (
        <div className="mt-4 p-3 bg-blue-100 border rounded space-y-2">
          <h3 className="font-semibold mb-2">SSL Check Result</h3>
          <p>{sslInfo}</p>
          {sslExpiry && <p>{sslExpiry}</p>}
        </div>
      )}

      {lastChangedEstimate && (
        <div className="mt-4 p-3 bg-purple-100 border rounded space-y-2">
          <h3 className="font-semibold mb-2">DNS Change Estimate</h3>
          <p>{lastChangedEstimate}</p>
        </div>
      )}
    </div>
  );
}
