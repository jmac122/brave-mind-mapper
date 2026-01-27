import React from 'react';

const App: React.FC = () => {
  const handleOpenMindMap = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('mindmap.html') });
  };

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '18px', marginBottom: '16px' }}>
        🧠 Mind Mapper
      </h1>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Visualize your browsing history as an interactive mind map.
      </p>
      <button
        onClick={handleOpenMindMap}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Open Mind Map
      </button>
    </div>
  );
};

export default App;
