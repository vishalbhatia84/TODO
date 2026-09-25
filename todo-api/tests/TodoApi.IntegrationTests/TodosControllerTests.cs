using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using TodoApi.DTOs;
using TodoApi.Services;

namespace TodoApi.IntegrationTests;
public sealed class TodosControllerTests : IDisposable
{
    private readonly WebApplicationFactory<Program> factory = new();
    private readonly HttpClient client;

    public TodosControllerTests() => client = factory.CreateClient();

    public void Dispose()
    {
        client.Dispose();
        factory.Dispose();
    }

    private async Task<TodoResponse> CreateAsync(string title)
    {
        var response = await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest(title));
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<TodoResponse>())!;
    }

    private async Task<IReadOnlyList<TodoResponse>> GetAllAsync() =>
        (await client.GetFromJsonAsync<List<TodoResponse>>("/api/todos"))!;

    [Fact]
    public async Task Get_returns_an_empty_list_on_a_fresh_server()
    {
        var response = await client.GetAsync("/api/todos");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty((await response.Content.ReadFromJsonAsync<List<TodoResponse>>())!);
    }

    [Fact]
    public async Task Post_trims_the_title()
    {
        var created = await CreateAsync("   Buy milk   ");

        Assert.Equal("Buy milk", created.Title);
    }

    [Fact]
    public async Task Post_rejects_a_missing_title()
    {
        // An empty JSON object, not an absent body: the field itself is gone.
        var response = await client.PostAsJsonAsync("/api/todos", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_rejects_an_over_long_title()
    {
        var response = await client.PostAsJsonAsync(
            "/api/todos",
            new CreateTodoRequest(new string('x', TodoService.TitleMaxLength + 1)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var problem = (await response.Content.ReadFromJsonAsync<ValidationProblemDetails>())!;
        Assert.Contains(
            $"{TodoService.TitleMaxLength} characters or fewer",
            Assert.Single(problem.Errors[nameof(CreateTodoRequest.Title)]),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Get_returns_created_todos_oldest_first()
    {
        var first = await CreateAsync("First");
        var second = await CreateAsync("Second");

        Assert.Equal([first.Id, second.Id], (await GetAllAsync()).Select(todo => todo.Id));
    }

    [Fact]
    public async Task Delete_removes_the_todo()
    {
        var created = await CreateAsync("Buy milk");

        var response = await client.DeleteAsync($"/api/todos/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Empty(await GetAllAsync());
    }

    [Fact]
    public async Task Delete_reports_a_problem_for_an_unknown_id()
    {
        var response = await client.DeleteAsync($"/api/todos/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var problem = (await response.Content.ReadFromJsonAsync<ProblemDetails>())!;
        Assert.Equal("Todo not found", problem.Title);
    }

    [Fact]
    public async Task A_full_round()
    {
        var milk = await CreateAsync("Buy milk");
        var bread = await CreateAsync("Buy bread");
        Assert.Equal(2, (await GetAllAsync()).Count);

        await client.DeleteAsync($"/api/todos/{milk.Id}");
        Assert.Equal(bread.Id, Assert.Single(await GetAllAsync()).Id);

        await client.DeleteAsync($"/api/todos/{bread.Id}");
        Assert.Empty(await GetAllAsync());
    }
}
