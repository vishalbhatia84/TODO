import { HttpClient } from '@angular/common/http';
import { InjectionToken, Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateTodoRequest, Todo } from './todo.model';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

@Injectable({ providedIn: 'root' })
export class TodoApiService {
  private readonly http = inject(HttpClient);
  private readonly todosUrl = `${inject(API_BASE_URL)}/todos`;

  getAll(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.todosUrl);
  }

  create(request: CreateTodoRequest): Observable<Todo> {
    return this.http.post<Todo>(this.todosUrl, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.todosUrl}/${encodeURIComponent(id)}`);
  }
}
