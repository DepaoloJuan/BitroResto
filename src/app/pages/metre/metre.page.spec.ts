import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetrePage } from './metre.page';

describe('MetrePage', () => {
  let component: MetrePage;
  let fixture: ComponentFixture<MetrePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MetrePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
