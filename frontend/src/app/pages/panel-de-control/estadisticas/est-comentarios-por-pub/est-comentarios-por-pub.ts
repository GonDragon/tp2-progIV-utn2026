import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgApexchartsModule,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexResponsive,
  ApexLegend,
  ApexTooltip,
  ApexDataLabels,
  ApexTitleSubtitle,
} from 'ng-apexcharts';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PublicacionesService, PublicacionItem } from '../../../../services/publicaciones';

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  legend: ApexLegend;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  title: ApexTitleSubtitle;
  colors: string[];
};

@Component({
  selector: 'app-est-comentarios-por-pub',
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './est-comentarios-por-pub.html',
  styleUrl: './est-comentarios-por-pub.css',
})
export class EstComentariosPorPub implements OnInit {
  private publicacionesService = inject(PublicacionesService);
  private cdr = inject(ChangeDetectorRef);

  fechaInicio: string = '';
  fechaFin: string = '';

  cargando: boolean = false;
  errorMensaje: string | null = null;
  totalComentarios: number = 0;
  pubsConComentarios: number = 0;
  publicacionPrincipal: string = '-';

  chartOptions: Partial<PieChartOptions> | null = null;

  ngOnInit(): void {
    this.inicializarFechasPorDefecto();
    this.consultarEstadisticas();
  }

  inicializarFechasPorDefecto(): void {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 29);

    this.fechaFin = this.formatDateToInput(hoy);
    this.fechaInicio = this.formatDateToInput(hace30Dias);
  }

  consultarEstadisticas(): void {
    this.errorMensaje = null;

    if (!this.fechaInicio || !this.fechaFin) {
      this.errorMensaje = 'Por favor selecciona fecha de inicio y fecha de fin.';
      this.cdr.detectChanges();
      return;
    }

    const [startYear, startMonth, startDay] = this.fechaInicio.split('-').map(Number);
    const [endYear, endMonth, endDay] = this.fechaFin.split('-').map(Number);

    const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      this.errorMensaje = 'Las fechas ingresadas son inválidas.';
      this.cdr.detectChanges();
      return;
    }

    if (startDate > endDate) {
      this.errorMensaje = 'La fecha de inicio debe ser anterior o igual a la fecha de fin.';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.publicacionesService
      .getPublicaciones({ limit: 1000 })
      .pipe(
        catchError((err) => {
          console.error('Error al obtener lista de publicaciones:', err);
          return of([] as PublicacionItem[]);
        }),
      )
      .subscribe({
        next: (publicaciones) => {
          if (!publicaciones || publicaciones.length === 0) {
            this.totalComentarios = 0;
            this.pubsConComentarios = 0;
            this.publicacionPrincipal = '-';
            this.chartOptions = null;
            this.cargando = false;
            this.cdr.detectChanges();
            return;
          }

          const peticiones = publicaciones.map((pub) =>
            this.publicacionesService
              .getCantidadComentarios({
                fecha_inicio: this.fechaInicio,
                fecha_fin: this.fechaFin,
                id_publicacion: pub._id,
              })
              .pipe(
                catchError((err) => {
                  console.error(`Error al obtener comentarios para publicación ${pub._id}:`, err);
                  return of({ cantidad: 0 });
                }),
                map((res) => ({
                  id: pub._id,
                  titulo: pub.titulo || 'Sin título',
                  cantidad: res?.cantidad || 0,
                })),
              ),
          );

          forkJoin(peticiones).subscribe({
            next: (resultados) => {
              this.totalComentarios = resultados.reduce((acc, curr) => acc + curr.cantidad, 0);

              const conComentarios = resultados
                .filter((r) => r.cantidad > 0)
                .sort((a, b) => b.cantidad - a.cantidad);

              this.pubsConComentarios = conComentarios.length;
              this.publicacionPrincipal = conComentarios.length > 0 ? conComentarios[0].titulo : '-';

              if (conComentarios.length === 0) {
                this.chartOptions = null;
                this.cargando = false;
                this.cdr.detectChanges();
                return;
              }

              const top5 = conComentarios.slice(0, 5);
              const resto = conComentarios.slice(5);
              const totalResto = resto.reduce((acc, curr) => acc + curr.cantidad, 0);

              const series: number[] = top5.map((p) => p.cantidad);
              const labels: string[] = top5.map((p) => p.titulo);

              if (totalResto > 0) {
                series.push(totalResto);
                labels.push('otras');
              }

              this.configurarGrafico(series, labels);
              this.cargando = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Error al consultar comentarios por publicación:', err);
              this.errorMensaje = 'Ocurrió un error al cargar las estadísticas del servidor.';
              this.cargando = false;
              this.cdr.detectChanges();
            },
          });
        },
        error: (err) => {
          console.error('Error al consultar publicaciones:', err);
          this.errorMensaje = 'Ocurrió un error al consultar las publicaciones.';
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
  }

  private configurarGrafico(series: number[], labels: string[]): void {
    this.chartOptions = {
      series: series,
      chart: {
        type: 'pie',
        height: 320,
        fontFamily: 'Tahoma, Arial, sans-serif',
        toolbar: {
          show: true,
        },
      },
      labels: labels,
      colors: [
        '#0055ea',
        '#3a9efd',
        '#22c55e',
        '#f59e0b',
        '#ec4899',
        '#8b5cf6',
        '#64748b',
      ],
      dataLabels: {
        enabled: true,
        formatter: (val: number, opts: any) => {
          const count = opts?.w?.globals?.series?.[opts.seriesIndex];
          return count !== undefined ? `${count}` : `${val.toFixed(1)}%`;
        },
        style: {
          fontFamily: 'Tahoma, Arial, sans-serif',
          fontWeight: 600,
          fontSize: '12px',
        },
      },
      legend: {
        position: 'right',
        fontSize: '12px',
        fontFamily: 'Tahoma, Arial, sans-serif',
        labels: {
          colors: '#0c2040',
        },
        itemMargin: {
          horizontal: 5,
          vertical: 4,
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} ${val === 1 ? 'comentario' : 'comentarios'}`,
        },
      },
      responsive: [
        {
          breakpoint: 600,
          options: {
            chart: {
              height: 300,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    };
  }

  private formatDateToInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
