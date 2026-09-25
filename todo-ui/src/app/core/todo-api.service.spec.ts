import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, TodoApiService } from './todo-api.service';
import { Todo } from './todo.model';

const TODO: Todo = {
  id: '5f1a2b3c-0000-4000-8000-000000000001',
  title: 'Buy milk',
  createdAt: '2026-09-24T09:00:00+00:00',
};

describe('TodoApiService', () => {
  let service: TodoApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });

    service = TestBed.inject(TodoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  // Fails the test if a call was made that no expectation accounted for.
  afterEach(() => http.verify());

  it('requests the todo collection', () => {
    let received: Todo[] | undefined;
    service.getAll().subscribe((todos) => (received = todos));

    const request = http.expectOne('/api/todos');
    expect(request.request.method).toBe('GET');

    request.flush([TODO]);
    expect(received).toEqual([TODO]);
  });

  it('posts the title and returns the created todo', () => {
    let received: Todo | undefined;
    service.create({ title: 'Buy milk' }).subscribe((todo) => (received = todo));

    const request = http.expectOne('/api/todos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: 'Buy milk' });

    request.flush(TODO);
    expect(received).toEqual(TODO);
  });

  it('deletes by id', () => {
    let completed = false;
    service.delete(TODO.id).subscribe(() => (completed = true));

    const request = http.expectOne(`/api/todos/${TODO.id}`);
    expect(request.request.method).toBe('DELETE');

    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });

  it('honours an overridden base url', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.test' },
      ],
    });

    const scoped = TestBed.inject(TodoApiService);
    const scopedHttp = TestBed.inject(HttpTestingController);

    scoped.getAll().subscribe();
    scopedHttp.expectOne('https://api.example.test/todos').flush([]);
    scopedHttp.verify();
  });

  it('surfaces server failures to the caller', () => {
    let status: number | undefined;
    service.getAll().subscribe({ error: (error) => (status = error.status) });

    http
      .expectOne('/api/todos')
      .flush({ title: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(status).toBe(500);
  });
});
