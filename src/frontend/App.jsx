import React from 'react'
import './App.css'
import AttentionVisualization from './components/AttentionVisualization'
import InteractiveVisualization from './components/InteractiveVisualization'

function App() {
  return (
    <div className="App">
      <h1>DistilGPT-2 Attention Visualization</h1>
      {/* <AttentionVisualization /> */}
      <InteractiveVisualization />
    </div>
  )
}

export default App