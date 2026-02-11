import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParseFilesComponent } from './parse-files.component';

describe('ParseFilesComponent', () => {
  let component: ParseFilesComponent;
  let fixture: ComponentFixture<ParseFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParseFilesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParseFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
