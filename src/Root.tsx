import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import { FPSMeter } from '@overengineering/fps-meter'
import type React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

import { AdminPanel } from './components/AdminPanel.js'
import { Canvas } from './components/Canvas.js'
import { schema } from './livestore/schema.js'
import LiveStoreWorker from './livestore.worker?worker'
import { getStoreId } from './util/store-id.js'

const AppBody: React.FC = () => (
  <>
    <h1 style={{ textAlign: 'center', marginTop: '20px', color: '#333' }}>Solar Panel Field</h1>
    <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Click on the canvas to add solar panels</p>
    <Canvas />
    <AdminPanel />
  </>
)

// Use a new storeId to start with a fresh database after schema changes
const storeId = 'solar-panel-field-v2'

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

export const App: React.FC = () => (
  <LiveStoreProvider
    schema={schema}
    adapter={adapter}
    renderLoading={(_) => <div>Loading LiveStore ({_.stage})...</div>}
    batchUpdates={batchUpdates}
    storeId={storeId}
    syncPayload={{ authToken: 'insecure-token-change-me' }}
  >
    <div style={{ top: 0, right: 0, position: 'absolute', background: '#333' }}>
      <FPSMeter height={40} />
    </div>
    <AppBody />
  </LiveStoreProvider>
)
