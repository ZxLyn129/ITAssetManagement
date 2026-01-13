import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisposedAssetList } from './disposed-asset.list';

describe('DisposedAssetList', () => {
  let component: DisposedAssetList;
  let fixture: ComponentFixture<DisposedAssetList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisposedAssetList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisposedAssetList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
