import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { TodoApiService } from '../../core/todo-api.service';
import { CreateTodoRequest, Todo } from '../../core/todo.model';
import { TodoStore } from './todo-store';

function todo(id: string, title: string, createdAt = '2026-09-24T09:00:00+00:00'): Todo {
  return { id, title, createdAt };
}

const MILK = todo('id-1', 'Buy milk');
const BREAD = todo('id-2', 'Buy bread', '2026-09-24T10:00:00+00:00');

function apiStub() {
  return {
    getAll: vi.fn<() => Observable<Todo[]>>(() => of([])),
    create: vi.fn<(request: CreateTodoRequest) => Observable<Todo>>(() => of(MILK)),
    delete: vi.fn<(id: string) => Observable<void>>(() => of(undefined as void)),
  };
}

function serverError(status: number, body: unknown): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, error: body }));
}

describe('TodoStore', () => {
  let api: ReturnType<typeof apiStub>;
  let store: TodoStore;

  beforeEach(() => {
    api = apiStub();
    TestBed.configureTestingModule({
      providers: [{ provide: TodoApiService, useValue: api }],
    });
    store = TestBed.inject(TodoStore);
  });

  describe('load', () => {
    it('fills the list and clears the loading flag', async () => {
      api.getAll.mockReturnValue(of([MILK, BREAD]));

      await store.load();

      expect(store.items()).toEqual([MILK, BREAD]);
      expect(store.count()).toBe(2);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('reports an empty list only once loading has finished', async () => {
      expect(store.isEmpty()).toBe(false); // not loaded yet

      await store.load();

      expect(store.isEmpty()).toBe(true);
    });

    it('records a message when the request fails', async () => {
      api.getAll.mockReturnValue(serverError(500, { title: 'Server error' }));

      await store.load();

      expect(store.error()).toBe('Server error');
      expect(store.loading()).toBe(false);
      // A failed load must not be mistaken for "you have no todos".
      expect(store.isEmpty()).toBe(false);
    });

    it.each([
      [0, 'the browser reached nothing at all'],
      [504, 'the dev-server proxy could not reach the backend'],
    ])('explains an unreachable server (%i: %s)', async (status) => {
      api.getAll.mockReturnValue(serverError(status, null));

      await store.load();

      expect(store.error()).toContain('Could not reach the server');
    });
  });

  describe('add', () => {
    it('appends the todo the server returns', async () => {
      api.create.mockReturnValue(of(BREAD));

      const added = await store.add('Buy bread');

      expect(added).toBe(true);
      expect(api.create).toHaveBeenCalledWith({ title: 'Buy bread' });
      expect(store.items()).toEqual([BREAD]);
      expect(store.saving()).toBe(false);
    });

    it('prefers the server validation message over the generic one', async () => {
      api.create.mockReturnValue(
        serverError(400, { title: 'Bad Request', errors: { Title: ['Title is required.'] } }),
      );

      const added = await store.add('   ');

      expect(added).toBe(false);
      expect(store.items()).toEqual([]);
      expect(store.error()).toBe('Title is required.');
    });
  });

  describe('remove', () => {
    beforeEach(async () => {
      api.getAll.mockReturnValue(of([MILK, BREAD]));
      await store.load();
    });

    it('removes the item before the server responds', async () => {
      let resolve!: () => void;
      api.delete.mockReturnValue(
        new Observable<void>((subscriber) => {
          resolve = () => {
            subscriber.next();
            subscriber.complete();
          };
        }),
      );

      const pending = store.remove(MILK.id);
      expect(store.items()).toEqual([BREAD]);

      resolve();
      await pending;

      expect(store.items()).toEqual([BREAD]);
      expect(store.error()).toBeNull();
    });

    it('restores the list and reports the failure when the server rejects', async () => {
      api.delete.mockReturnValue(serverError(404, { detail: 'Todo not found.' }));

      await store.remove(MILK.id);

      expect(store.items()).toEqual([MILK, BREAD]);
      expect(store.error()).toBe('Todo not found.');
    });
  });
});
