import { queryDb } from '@livestore/livestore'

import { tables } from './schema.js'

export const solarPanels$ = queryDb(
  tables.solarPanels.where({ deletedAt: null }),
  { label: 'solarPanels' }
)
