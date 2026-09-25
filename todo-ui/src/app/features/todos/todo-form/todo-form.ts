import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TITLE_MAX_LENGTH } from '../../../core/todo.model';

function nonBlank(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim().length > 0
    ? null
    : { nonBlank: true };
}

/** Input for a new todo.*/
@Component({
  selector: 'app-todo-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './todo-form.html',
})
export class TodoForm {
  readonly disabled = input(false);
  readonly submitted = output<string>();
  protected readonly maxLength = TITLE_MAX_LENGTH;

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [nonBlank, Validators.maxLength(TITLE_MAX_LENGTH)],
    }),
  });

  protected get title(): FormControl<string> {
    return this.form.controls.title;
  }

  protected get titleLength(): number {
    return this.title.value.length;
  }

  private readonly submitRejected = signal(false);

  protected get showError(): boolean {
    return this.title.invalid && (this.title.dirty || this.submitRejected());
  }

  protected submit(): void {
    if (this.disabled()) {
      return;
    }

    if (this.title.invalid) {
      this.submitRejected.set(true);
      return;
    }

    this.submitted.emit(this.title.value.trim());
    this.form.reset();
    this.submitRejected.set(false);
  }
}
