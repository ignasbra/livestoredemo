import { Events, makeSchema, Schema, SessionIdSymbol, State } from '@livestore/livestore'

// You can model your state as SQLite tables (https://docs.livestore.dev/reference/state/sqlite-schema)
export const tables = {
  todos: State.SQLite.table({
    name: 'todos',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      text: State.SQLite.text({ default: '' }),
      completed: State.SQLite.boolean({ default: false }),
      deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber }),
    },
  }),
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
  // Client documents can be used for local-only state (e.g. form inputs)
  uiState: State.SQLite.clientDocument({
    name: 'uiState',
    schema: Schema.Struct({ newTodoText: Schema.String, filter: Schema.Literal('all', 'active', 'completed') }),
    default: { id: SessionIdSymbol, value: { newTodoText: '', filter: 'all' } },
  }),
}

// Events describe data changes (https://docs.livestore.dev/reference/events)
export const events = {
  todoCreated: Events.synced({
    name: 'v1.TodoCreated',
    schema: Schema.Struct({ id: Schema.String, text: Schema.String }),
  }),
  todoCompleted: Events.synced({
    name: 'v1.TodoCompleted',
    schema: Schema.Struct({ id: Schema.String }),
  }),
  todoUncompleted: Events.synced({
    name: 'v1.TodoUncompleted',
    schema: Schema.Struct({ id: Schema.String }),
  }),
  todoDeleted: Events.synced({
    name: 'v1.TodoDeleted',
    schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
  }),
  todoClearedCompleted: Events.synced({
    name: 'v1.TodoClearedCompleted',
    schema: Schema.Struct({ deletedAt: Schema.Date }),
  }),
  solarPanelCreated: Events.synced({
    name: 'v1.SolarPanelCreated',
    schema: Schema.Struct({ id: Schema.String, x: Schema.Number, y: Schema.Number, z: Schema.Number }),
  }),
  solarPanelDeleted: Events.synced({
    name: 'v1.SolarPanelDeleted',
    schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
  }),
  uiStateSet: tables.uiState.set,
}

// Materializers are used to map events to state (https://docs.livestore.dev/reference/state/materializers)
const materializers = State.SQLite.materializers(events, {
  'v1.TodoCreated': ({ id, text }) => tables.todos.insert({ id, text, completed: false }),
  'v1.TodoCompleted': ({ id }) => tables.todos.update({ completed: true }).where({ id }),
  'v1.TodoUncompleted': ({ id }) => tables.todos.update({ completed: false }).where({ id }),
  'v1.TodoDeleted': ({ id, deletedAt }) => tables.todos.update({ deletedAt }).where({ id }),
  'v1.TodoClearedCompleted': ({ deletedAt }) => tables.todos.update({ deletedAt }).where({ completed: true }),
  'v1.SolarPanelCreated': ({ id, x, y, z }) => tables.solarPanels.insert({ id, x, y, z }),
  'v1.SolarPanelDeleted': ({ id, deletedAt }) => tables.solarPanels.update({ deletedAt }).where({ id }),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
