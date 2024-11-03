import React, { useState, useEffect } from 'react';

const AttentionVisualization = () => {
  const [text, setText] = useState("The cat sat on the mat");
  const [tokens, setTokens] = useState([]);
  const [attentionData, setAttentionData] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttentionData();
  }, []);

  const fetchAttentionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/get_attention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch attention data');
      }
      const data = await response.json();
      const cleanedTokens = data.tokens.map(token => token.replace('Ġ', ' ').trim());
      setTokens(cleanedTokens);
      setAttentionData(data.attention);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const interpolateMultiColor = (t) => {
    const colors = [
      [68, 1, 84],    // Deep purple
      [59, 82, 139],  // Blue
      [33, 145, 140], // Teal
      [94, 201, 98],  // Green
      [253, 231, 37]  // Yellow
    ];

    const index = Math.min(Math.floor(t * (colors.length - 1)), colors.length - 2);
    const f = t * (colors.length - 1) - index;

    const r = Math.round(colors[index][0] * (1 - f) + colors[index + 1][0] * f);
    const g = Math.round(colors[index][1] * (1 - f) + colors[index + 1][1] * f);
    const b = Math.round(colors[index][2] * (1 - f) + colors[index + 1][2] * f);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getColor = (value) => {
    if (value === 0) return 'white';
    const scaledValue = Math.pow(value, 0.3);
    return interpolateMultiColor(scaledValue);
  };

  const cellSize = 80; // Increased cell size
  const margin = 100; // Increased margin
  const width = tokens.length * cellSize + 2 * margin;
  const height = tokens.length * cellSize + 2 * margin;

  const renderColorLegend = () => {
    const legendWidth = 300; // Increased legend width
    const legendHeight = 30; // Increased legend height
    const gradientStops = 20;

    return (
      <svg width={legendWidth} height={legendHeight + 40}>
        <defs>
          <linearGradient id="legend-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {Array.from({ length: gradientStops }).map((_, i) => (
              <stop
                key={i}
                offset={`${(i / (gradientStops - 1)) * 100}%`}
                stopColor={interpolateMultiColor(i / (gradientStops - 1))}
              />
            ))}
          </linearGradient>
        </defs>
        <rect width={legendWidth} height={legendHeight} fill="url(#legend-gradient)" />
        <rect width={30} height={legendHeight} fill="white" stroke="black" strokeWidth="1" />
        <text x="0" y={legendHeight + 25} fontSize="16" fill="white">Zero</text>
        <text x={30} y={legendHeight + 25} fontSize="16" fill="white">Low</text>
        <text x={legendWidth} y={legendHeight + 25} fontSize="16" textAnchor="end" fill="white">High</text>
      </svg>
    );
  };

  return (
    <div style={{ width: '100%', padding: '20px', color: 'white', backgroundColor: '#1a1a1a' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>DistilGPT-2 Attention Visualization</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to analyze..."
        style={{ width: '100%', marginBottom: '20px', padding: '10px', backgroundColor: '#333', color: 'white', fontSize: '16px' }}
      />
      <button
        onClick={fetchAttentionData}
        disabled={isLoading}
        style={{ marginBottom: '20px', backgroundColor: '#4a4a4a', color: 'white', border: 'none', padding: '10px 20px', fontSize: '16px' }}
      >
        {isLoading ? 'Loading...' : 'Update Visualization'}
      </button>
      {error && <p style={{ color: 'red', fontSize: '16px' }}>{error}</p>}

      {!isLoading && !error && attentionData.length > 0 && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <button
              disabled={selectedLayer === 0}
              onClick={() => setSelectedLayer(prev => Math.max(0, prev - 1))}
              style={{ backgroundColor: '#4a4a4a', color: 'white', border: 'none', padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}
            >
              Previous Layer
            </button>
            <span style={{ margin: '0 20px', fontSize: '18px' }}>Layer {selectedLayer + 1} of {attentionData.length}</span>
            <button
              disabled={selectedLayer === attentionData.length - 1}
              onClick={() => setSelectedLayer(prev => Math.min(attentionData.length - 1, prev + 1))}
              style={{ backgroundColor: '#4a4a4a', color: 'white', border: 'none', padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
            >
              Next Layer
            </button>
          </div>

          <svg width={width} height={height} style={{ maxWidth: '100%', height: 'auto' }}>
            <g transform={`translate(${margin}, ${margin})`}>
              {attentionData[selectedLayer].map((row, i) =>
                row.map((cell, j) => {
                  const color = getColor(cell);
                  return (
                    <g key={`${i}-${j}`}>
                      <rect
                        x={j * cellSize}
                        y={i * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill={color}
                        stroke="#333"
                        strokeWidth="1"
                      />
                      <text
                        x={j * cellSize + cellSize / 2}
                        y={i * cellSize + cellSize / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="14"
                        fill={cell > 0.5 ? 'black' : 'white'}
                      >
                        {cell.toFixed(2)}
                      </text>
                    </g>
                  );
                })
              )}
              {tokens.map((token, i) => (
                <React.Fragment key={`label-${i}`}>
                  <text
                    x={-10}
                    y={i * cellSize + cellSize / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize="16"
                    fill="white"
                  >
                    {token}
                  </text>
                  <text
                    x={i * cellSize + cellSize / 2}
                    y={-10}
                    textAnchor="middle"
                    dominantBaseline="end"
                    fontSize="16"
                    fill="white"
                    transform={`rotate(-45, ${i * cellSize + cellSize / 2}, -10)`}
                  >
                    {token}
                  </text>
                </React.Fragment>
              ))}
            </g>
          </svg>
          {renderColorLegend()}
        </>
      )}
    </div>
  );
};

export default AttentionVisualization;