using Microsoft.AspNetCore.Mvc;
using TodoApi.DTOs;
using TodoApi.Services;

namespace TodoApi.Controllers;

/// <summary>
/// The todo API.
/// </summary>
/// <param name="todos"></param>
[ApiController]
[Route("api/todos")]
[Produces("application/json")]
public sealed class TodosController(ITodoService todos) : ControllerBase
{
    /// <summary>Lists all todos, oldest first.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TodoResponse>), StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<TodoResponse>> GetAll() => Ok(todos.GetAll());

    /// <summary>Adds a todo.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TodoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<TodoResponse> Create([FromBody] CreateTodoRequest request)
    {
        var result = todos.Create(request);

        if (result.IsInvalid)
        {
            ModelState.AddModelError(nameof(CreateTodoRequest.Title), result.Error);
            return ValidationProblem(ModelState);
        }

        return Created($"/api/todos/{result.Todo.Id}", result.Todo);
    }

    /// <summary>Deletes a todo item.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult Delete(Guid id)
    {
        return todos.Delete(id)
            ? NoContent()
            : Problem(
                detail: $"No todo with id {id} exists.",
                statusCode: StatusCodes.Status404NotFound,
                title: "Todo not found");
    }
}
