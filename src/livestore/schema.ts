import { Events, makeSchema, Schema, State } from '@livestore/livestore'

// You can model your state as SQLite tables (https://docs.livestore.dev/reference/state/sqlite-schema)
export const tables = {
  solarPanels: State.SQLite.table({
    name: 'solarPanels',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      x: State.SQLite.real(),
      y: State.SQLite.real(),
      z: State.SQLite.real(),
      deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber }),
    },
  }),
}

// Events describe data changes (https://docs.livestore.dev/reference/events)
export const events = {
  solarPanelCreated: Events.synced({
    name: 'v1.SolarPanelCreated',
    schema: Schema.Struct({ id: Schema.String, x: Schema.Number, y: Schema.Number, z: Schema.Number }),
  }),
  solarPanelDeleted: Events.synced({
    name: 'v1.SolarPanelDeleted',
    schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
  }),
}

// Materializers are used to map events to state (https://docs.livestore.dev/reference/state/materializers)
const materializers = State.SQLite.materializers(events, {
  'v1.SolarPanelCreated': ({ id, x, y, z }) => tables.solarPanels.insert({ id, x, y, z }),
  'v1.SolarPanelDeleted': ({ id, deletedAt }) => tables.solarPanels.update({ deletedAt }).where({ id }),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
