import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TodoPage } from './features/todos/todo-page/todo-page';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoPage],
  template: '<app-todo-page />',
})
export class App {}
