import { Todo, TodoId, TodoNotFound } from '@beeman-playground/domain/TodosApi'
import { Effect, HashMap, pipe, Ref } from 'effect'

export class TodosRepository extends Effect.Service<TodosRepository>()('api/TodosRepository', {
  effect: Effect.gen(function*() {
    const todos = yield* Ref.make(HashMap.empty<TodoId, Todo>())

    const getAll = Ref.get(todos).pipe(
      Effect.map((todos) => Array.from(HashMap.values(todos))),
      Effect.withSpan('Todos.getAll'),
    )

    function getById(id: TodoId): Effect.Effect<Todo, TodoNotFound> {
      return Ref.get(todos).pipe(
        Effect.flatMap(HashMap.get(id)),
        Effect.catchTag('NoSuchElementException', () => new TodoNotFound({ id })),
        Effect.withSpan('Todos.getById', { attributes: { id } }),
      )
    }

    function create(text: string): Effect.Effect<Todo> {
      return pipe(
        Ref.modify(todos, (map) => {
          const id = TodoId.make(HashMap.reduce(map, -1, (max, todo) => todo.id > max ? todo.id : max) + 1)
          const todo = new Todo({ id, text, done: false })
          return [todo, HashMap.set(map, id, todo)]
        }),
        Effect.tap((todo) => Effect.withSpan('Todos.create', { attributes: { id: todo.id } })),
      )
    }

    function complete(id: TodoId): Effect.Effect<Todo, TodoNotFound> {
      return getById(id).pipe(
        Effect.map((todo) => new Todo({ ...todo, done: true })),
        Effect.tap((todo) => Ref.update(todos, HashMap.set(todo.id, todo))),
        Effect.withSpan('Todos.complete', { attributes: { id } }),
      )
    }

    function remove(id: TodoId): Effect.Effect<void, TodoNotFound> {
      return getById(id).pipe(
        Effect.flatMap((todo) => Ref.update(todos, HashMap.remove(todo.id))),
        Effect.withSpan('Todos.remove', { attributes: { id } }),
      )
    }

    return {
      getAll,
      getById,
      create,
      complete,
      remove,
    } as const
  }),
}) {}
