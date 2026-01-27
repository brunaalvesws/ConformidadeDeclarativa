import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogGeneratorComponent } from './log-generator.component';

describe('LogGeneratorComponent', () => {
  let component: LogGeneratorComponent;
  let fixture: ComponentFixture<LogGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogGeneratorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
