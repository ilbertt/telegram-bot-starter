# bun-telegram-bot-starter

This is a Bun/grammY/Elysia template that compiles its migrations and optional Mini App into one
binary. Preserve these rules when changing it:

- Keep controller → service → repository layering. Commands, flows, callbacks, and HTTP routes are
  controllers: no SQL or business rules. Services contain business rules but no SQL. Repositories
  contain SQL but no business rules.
- Instantiate services once in `services/container.ts` and inject the same instances into Elysia
  and grammY.
- Backend imports use `#*` with `.ts`; Mini App imports are relative.
- Every Elysia route declares body/params/query and response schemas. Protected HTTP routes use
  `Authorization: tma <raw init data>`; only the WebSocket upgrade may use a query parameter.
- Never trust unsigned Mini App launch data or `initDataUnsafe`. Verify the signature, age, and
  parsed user in that order.
- Never key sessions by chat alone. Use the shared one-user-in-one-chat key for both grammY session
  storage and `sequentialize`; unsafe updates return `undefined`.
- Never trust callback IDs. Every user-owned read, update, and delete includes the Telegram user ID
  in its SQL `WHERE` clause.
- Anything that must survive deployment belongs in SQLite. Store Telegram IDs as text and
  timestamps as timezone-explicit ISO-8601 text.
- Named `Bun.SQL` queries live in repositories. Run `bun backend db:gen` after a migration or query
  change; never hand-write generated row types or add an ORM.
- Webhook handlers authenticate and acknowledge promptly. Ordinary startup never drops pending
  updates. Two processes must not long-poll the same token.
- Keep `miniapp/` removable. Build/dev/check scripts and backend static serving must work without
  it, and SPA fallback exists only when an index was embedded.
- After changes run `bun fix:codestyle && bun check:all && bun test`. For build/runtime work also
  build both targets and exercise the affected path against a running server.
