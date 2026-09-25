using TodoApi.Models;

namespace TodoApi.Data;

public interface ITodoRepository
{
    TodoItem Add(TodoItem item);
    IReadOnlyList<TodoItem> GetAll();
    bool Delete(Guid id);
}
