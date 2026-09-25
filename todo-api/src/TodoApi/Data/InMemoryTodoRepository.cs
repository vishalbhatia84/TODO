using System.Collections.Concurrent;
using TodoApi.Models;

namespace TodoApi.Data;
public sealed class InMemoryTodoRepository : ITodoRepository
{
    private readonly ConcurrentDictionary<Guid, TodoItem> items = new();

    public TodoItem Add(TodoItem item)
    {
        ArgumentNullException.ThrowIfNull(item);

        if (!items.TryAdd(item.Id, item))
        {
            throw new InvalidOperationException($"A todo with id {item.Id} already exists.");
        }

        return item;
    }
    public IReadOnlyList<TodoItem> GetAll()
    {
        return [.. items.Values.OrderBy(item => item.CreatedAt).ThenBy(item => item.Id)];
    }

    public bool Delete(Guid id) => items.TryRemove(id, out _);
}
