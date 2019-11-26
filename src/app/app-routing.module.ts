import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VizComponent } from './viz/viz.component';

const routes: Routes = [
  { path: '', redirectTo: '/viz', pathMatch: 'full' },
  { path: 'viz', component: VizComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
