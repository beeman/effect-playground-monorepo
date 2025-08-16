import { HttpApiBuilder, HttpMiddleware, HttpServer } from '@effect/platform'
import { NodeHttpServer, NodeRuntime } from '@effect/platform-node'
import { Layer } from 'effect'
import { createServer } from 'node:http'
import { ApiLive } from './Api.js'
import { TodosRepository } from './TodosRepository.js'
import { TracingLive } from './Tracing.js'

const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  HttpServer.withLogAddress,
  Layer.provide(ApiLive),
  Layer.provide(TracingLive),
  Layer.provide(TodosRepository.Default),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
)
Layer.launch(HttpLive).pipe(
  NodeRuntime.runMain,
)
