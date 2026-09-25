# TODO
 TODO list app

A todo list you can read, add to and delete from. Angular front end, .NET
minimal-API back end, items held in the API process's memory.

## Prerequisites

- **Node 22.12+** (built against v22.14)
- **.NET 10 SDK** — `dotnet --list-sdks` should show a `10.x` entry

## The API

| Verb   | Route             | Success             | Failure                                     |
| ------ | ----------------- | ------------------- | ------------------------------------------- |
| GET    | `/api/todos`      | `200` — oldest first | —                                           |
| POST   | `/api/todos`      | `201` + `Location`  | `400` if the title is blank or over 200 chars |
| DELETE | `/api/todos/{id}` | `204`               | `404` if no such id                          |



## Known limits

- **Data is lost when the API restarts.** In-memory storage is the brief, not
  an oversight.
- **No auth**, so the list is global rather than per-user.
- Items can be added and deleted but not edited or marked complete.
