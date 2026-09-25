import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { TodoApiService } from '../../../core/todo-api.service';
import { CreateTodoRequest, Todo } from '../../../core/todo.model';
import { TodoPage } from './todo-page';

const MILK: Todo = { id: 'id-1', title: 'Buy milk', createdAt: '2026-09-24T09:00:00+00:00' };
const BREAD: Todo = { id: 'id-2', title: 'Buy bread', createdAt: '2026-09-24T10:00:00+00:00' };

describe('TodoPage', () => {
  let fixture: ComponentFixture<TodoPage>;
  let api: {
    getAll: ReturnType<typeof vi.fn<() => Observable<Todo[]>>>;
    create: ReturnType<typeof vi.fn<(request: CreateTodoRequest) => Observable<Todo>>>;
    delete: ReturnType<typeof vi.fn<(id: string) => Observable<void>>>;
  };

  beforeEach(async () => {
    api = {
      getAll: vi.fn(() => of([] as Todo[])),
      create: vi.fn(() => of(MILK)),
      delete: vi.fn(() => of(undefined as void)),
    };

    await TestBed.configureTestingModule({
      imports: [TodoPage],
      providers: [{ provide: TodoApiService, useValue: api }],
    }).compileComponents();
  });

  /** Create component and settle initial load. */
  async function render(): Promise<void> {
    fixture = TestBed.createComponent(TodoPage);
    await fixture.whenStable();
  }

  function text(): string {
    return fixture.nativeElement.textContent as string;
  }

  function titles(): string[] {
    const host = fixture.nativeElement as HTMLElement;
    return Array.from(host.querySelectorAll<HTMLElement>('.todo-list__title'), (element) =>
      element.textContent!.trim(),
    );
  }

  async function addTodo(title: string): Promise<void> {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = title;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('loads the todos on init and renders them', async () => {
    api.getAll.mockReturnValue(of([MILK, BREAD]));

    await render();

    expect(api.getAll).toHaveBeenCalledOnce();
    expect(titles()).toEqual(['Buy milk', 'Buy bread']);
    expect(text()).toContain('2 items');
  });

  it('invites the user to start when there is nothing to show', async () => {
    await render();

    expect(text()).toContain('Nothing here yet');
  });

  it('adds a todo through the form and shows it in the list', async () => {
    await render();
    api.create.mockReturnValue(of(BREAD));

    await addTodo('Buy bread');

    expect(api.create).toHaveBeenCalledWith({ title: 'Buy bread' });
    expect(titles()).toEqual(['Buy bread']);
    expect(text()).toContain('1 item');
  });

  it('removes a todo when its delete button is pressed', async () => {
    api.getAll.mockReturnValue(of([MILK, BREAD]));
    await render();

    fixture.nativeElement.querySelectorAll('.todo-list__delete')[0].click();
    await fixture.whenStable();

    expect(api.delete).toHaveBeenCalledWith('id-1');
    expect(titles()).toEqual(['Buy bread']);
  });

  it('puts the row back if the delete fails', async () => {
    api.getAll.mockReturnValue(of([MILK, BREAD]));
    await render();
    api.delete.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 404, error: { detail: 'Todo not found.' } }),
      ),
    );

    fixture.nativeElement.querySelectorAll('.todo-list__delete')[0].click();
    await fixture.whenStable();

    expect(titles()).toEqual(['Buy milk', 'Buy bread']);
    expect(text()).toContain('Todo not found.');
  });

  it('offers a retry when the initial load fails, and recovers', async () => {
    api.getAll.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    await render();

    expect(text()).toContain('Could not reach the server');

    api.getAll.mockReturnValue(of([MILK]));
    fixture.nativeElement.querySelector('.todo-page__retry').click();
    await fixture.whenStable();

    expect(titles()).toEqual(['Buy milk']);
    expect(text()).not.toContain('Could not reach the server');
  });
});
