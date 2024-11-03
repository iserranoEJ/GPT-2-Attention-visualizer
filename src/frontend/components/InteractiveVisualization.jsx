import React, { useState, useEffect, useRef } from 'react';

const InteractiveVisualization = () => {
  const [text, setText] = useState("The quick brown fox jumped over the lazy cat");
  const [tokens, setTokens] = useState([]);
  const [attentionData, setAttentionData] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedHead, setSelectedHead] = useState(0);
  const [hoveredToken, setHoveredToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const tokenRefs = useRef([]);
  const svgRef = useRef(null);

  useEffect(() => {
    console.log('useEffect triggered, calling fetchAttentionData');
    fetchAttentionData();
  }, []);

  const fetchAttentionData = async () => {
    console.log('Fetching attention data...');
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
        throw new Error(`Failed to fetch attention data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Full response:', data);

      // Process tokens
      const processedTokens = data.tokens.map(token => token.replace('Ġ', ' ').trim());
      setTokens(processedTokens);
      setAttentionData(data.attention);

      // Reset refs array to match new tokens length
      tokenRefs.current = tokenRefs.current.slice(0, processedTokens.length);

    } catch (err) {
      console.error('Error fetching attention data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAttentionValues = (sourceIdx) => {
    try {
      const layerData = attentionData[selectedLayer];
      if (!layerData || !Array.isArray(layerData)) {
        console.log('Invalid layer data:', layerData);
        return new Array(tokens.length).fill(0);
      }

      const headData = layerData[selectedHead];
      if (!headData || !Array.isArray(headData)) {
        console.log('Invalid head data:', headData);
        return new Array(tokens.length).fill(0);
      }

      console.log('Raw attention data:', {
        layerData,
        headData,
        sourceIdx,
        token: tokens[sourceIdx]
      });

      const attentionValues = layerData[sourceIdx];

      if (!attentionValues || !Array.isArray(attentionValues)) {
        console.log('No attention values found for token:', tokens[sourceIdx]);
        return new Array(tokens.length).fill(0);
      }

      console.log(`Found attention values for "${tokens[sourceIdx]}":`, attentionValues);
      return attentionValues;

    } catch (err) {
      console.error('Error in getAttentionValues:', err);
      return new Array(tokens.length).fill(0);
    }
  };

  const getTokenCenter = (index) => {
    const element = tokenRefs.current[index];
    if (!element || !svgRef.current) return 0;

    const rect = element.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();
    return rect.top + (rect.height / 2) - svgRect.top;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#FFFFFF'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #333',
        backgroundColor: '#1a1a1a'
      }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '32px' }}>
          Attention Visualization {isLoading ? '(Loading...)' : ''}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                backgroundColor: '#333',
                border: '1px solid #666',
                color: '#FFFFFF',
                borderRadius: '4px'
              }}
            >
              {Array.from({ length: attentionData?.length || 0 }, (_, i) => (
                <option key={i} value={i}>Layer {i + 1}</option>
              ))}
            </select>

            <select
              value={selectedHead}
              onChange={(e) => setSelectedHead(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                backgroundColor: '#333',
                border: '1px solid #666',
                color: '#FFFFFF',
                borderRadius: '4px'
              }}
            >
              {Array.from({ length: attentionData?.[selectedLayer]?.length || 0 }, (_, i) => (
                <option key={i} value={i}>Head {i + 1}</option>
              ))}
            </select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchAttentionData();
            }}
            style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '600px' }}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                flex: 1,
                padding: '4px 12px',
                backgroundColor: '#333',
                border: '1px solid #666',
                color: '#FFFFFF',
                borderRadius: '4px',
                fontSize: '20px'
              }}
              placeholder="Enter text to analyze..."
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '4px 16px',
                backgroundColor: '#333',
                border: '1px solid #666',
                color: '#FFFFFF',
                cursor: isLoading ? 'wait' : 'pointer',
                borderRadius: '4px'
              }}
            >
              {isLoading ? 'Loading...' : 'Analyze'}
            </button>
          </form>
        </div>
      </div>

      {/* Visualization */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '800px',
          position: 'relative'
        }}>
          {/* Source Tokens */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '4px',
            width: '150px',
            position: 'relative',
            zIndex: 1
          }}>
            {tokens.map((token, idx) => (
              <div
                key={`source-${idx}`}
                ref={el => tokenRefs.current[idx] = el}
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: 'rgb(200, 200, 200)',
                  backgroundColor: hoveredToken === idx ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  transition: 'background-color 0.2s ease',
                  fontSize: '32px',
                  fontFamily: 'monospace',
                  width: 'fit-content'
                }}
                onMouseEnter={() => setHoveredToken(idx)}
                onMouseLeave={() => setHoveredToken(null)}
              >
                {token}
              </div>
            ))}
          </div>

          <svg
            ref={svgRef}
            style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            {hoveredToken !== null && attentionData?.length > 0 && (() => {
              const attentions = getAttentionValues(hoveredToken);

              return tokens.map((token, targetIdx) => {
                const attention = attentions[targetIdx] || 0;
                return (
                  <line
                    key={`line-${targetIdx}`}
                    x1="150"
                    y1={getTokenCenter(hoveredToken)}
                    x2="650"
                    y2={getTokenCenter(targetIdx)}
                    stroke="#FFA500"
                    strokeWidth={5}
                    strokeOpacity={Math.max(0.1, attention)}
                    style={{
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                );
              });
            })()}
          </svg>

          {/* Target Tokens */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '4px',
            width: '150px',
            position: 'relative',
            zIndex: 1
          }}>
            {tokens.map((token, idx) => (
              <div
                key={`target-${idx}`}
                style={{
                  padding: '4px 8px',
                  color: 'rgb(200, 200, 200)',
                  fontSize: '32px',
                  fontFamily: 'monospace',
                  width: 'fit-content'
                }}
              >
                {token}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff44441a',
          color: '#FF4444',
          padding: '8px 16px',
          borderRadius: '4px',
          border: '1px solid #FF4444'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default InteractiveVisualization;