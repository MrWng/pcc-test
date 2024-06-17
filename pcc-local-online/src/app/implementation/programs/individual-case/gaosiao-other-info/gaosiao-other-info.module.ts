import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustSharedModule } from '../../../shared/cust-shared.module';
import { GaosiaoOtherInfoComponent } from './gaosiao-other-info.component';
import { ClueInformationComponent } from './components/clue-information/clue-information.component';
import { OpportunityInformationComponent } from './components/opportunity-information/opportunity-information.component';
import { BnusinessOpportunityPoAfterComponent } from './components/bnusiness-opportunity-po-after/bnusiness-opportunity-po-after.component';
import { GaosiaoOtherInfoService } from './gaosiao-other-info.service';

@NgModule({
  declarations: [
    GaosiaoOtherInfoComponent,
    ClueInformationComponent,
    OpportunityInformationComponent,
    BnusinessOpportunityPoAfterComponent,
  ],
  imports: [CommonModule, CustSharedModule],
  providers: [GaosiaoOtherInfoService],
})
export class GaosiaoOtherInfoModule {}
