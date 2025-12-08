import { useStore } from '@livestore/react'
import React, { useState } from 'react'

import { events } from '../livestore/schema.js'
import { solarPanels$ } from '../livestore/queries.js'

export const AdminPanel: React.FC = () => {
  const { store } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const solarPanels = store.useQuery(solarPanels$)

  const deletePanel = (id: string) => {
    store.commit(events.solarPanelDeleted({ id, deletedAt: new Date() }))
  }

  const clearAll = () => {
    const now = new Date()
    solarPanels.forEach(panel => {
      store.commit(events.solarPanelDeleted({ id: panel.id, deletedAt: now }))
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}
      >
        📊 Admin Panel
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '500px',
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '15px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px' }}>Solar Panels Database</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0 5px',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '15px', overflowY: 'auto', flex: 1 }}>
        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
          Total panels: {solarPanels.length}
        </div>

        {solarPanels.length > 0 && (
          <button
            onClick={clearAll}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              marginBottom: '15px',
            }}
          >
            Clear All Panels
          </button>
        )}

        <div style={{ fontSize: '12px' }}>
          {solarPanels.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No solar panels yet. Click on the canvas to add some!
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>X</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Y</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Z</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {solarPanels.map((panel) => (
                  <tr key={panel.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', fontSize: '10px', color: '#666' }}>
                      {panel.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '8px' }}>{panel.x.toFixed(2)}</td>
                    <td style={{ padding: '8px' }}>{panel.y.toFixed(2)}</td>
                    <td style={{ padding: '8px' }}>{panel.z.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => deletePanel(panel.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
