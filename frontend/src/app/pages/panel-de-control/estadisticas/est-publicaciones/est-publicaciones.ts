import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexTooltip,
  ApexGrid,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PublicacionesService } from '../../../../services/publicaciones';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  colors: string[];
};

@Component({
  selector: 'app-est-publicaciones',
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './est-publicaciones.html',
  styleUrl: './est-publicaciones.css',
})
export class EstPublicaciones implements OnInit {
  private publicacionesService = inject(PublicacionesService);
  private cdr = inject(ChangeDetectorRef);

  fechaInicio: string = '';
  fechaFin: string = '';
  usuarioFiltro: string = '';

  cargando: boolean = false;
  errorMensaje: string | null = null;
  totalComentarios: number = 0;
  promedioPorUsuario: number = 0;
  maxComentarios: number = 0;

  chartOptions: Partial<ChartOptions> | null = null;

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

    const topObservable = this.publicacionesService
      .getTopUsuariosComentarios({
        fecha_inicio: this.fechaInicio,
        fecha_fin: this.fechaFin,
        limite: 5,
      })
      .pipe(
        catchError((err) => {
          console.error('Error al obtener top usuarios con más comentarios:', err);
          return of([]);
        }),
      );

    const usuarioOpcional = this.usuarioFiltro.trim();
    const opcionalObservable = usuarioOpcional
      ? this.publicacionesService
          .getCantidadComentarios({
            fecha_inicio: this.fechaInicio,
            fecha_fin: this.fechaFin,
            usuario: usuarioOpcional,
          })
          .pipe(
            catchError((err) => {
              console.error('Error al obtener comentarios para usuario opcional:', err);
              return of({ cantidad: 0 });
            }),
          )
      : of(null);

    forkJoin({
      top: topObservable,
      opcional: opcionalObservable,
    }).subscribe({
      next: ({ top, opcional }) => {
        const top5 = top || [];
        const categorias: string[] = top5.map((u) => u.username || 'Desconocido');
        const cantidades: number[] = top5.map((u) => u.cantidad || 0);

        if (usuarioOpcional && opcional !== null) {
          categorias.push(usuarioOpcional);
          cantidades.push(opcional.cantidad || 0);
        }

        this.totalComentarios = cantidades.reduce((acc, c) => acc + c, 0);
        this.promedioPorUsuario =
          cantidades.length > 0
            ? Number((this.totalComentarios / cantidades.length).toFixed(1))
            : 0;
        this.maxComentarios = cantidades.length > 0 ? Math.max(...cantidades) : 0;

        this.configurarGrafico(categorias, cantidades);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al consultar estadísticas:', err);
        this.errorMensaje = 'Ocurrió un error al cargar las estadísticas del servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private configurarGrafico(categorias: string[], cantidades: number[]): void {
    this.chartOptions = {
      series: [
        {
          name: 'Comentarios',
          data: cantidades,
        },
      ],
      chart: {
        type: 'bar',
        height: 280,
        fontFamily: 'Tahoma, Arial, sans-serif',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
      },
      plotOptions: {
        bar: {
          columnWidth: '55%',
          borderRadius: 2,
        },
      },
      stroke: {
        show: true,
        width: 1,
        colors: ['transparent'],
      },
      colors: ['#0055ea'],
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '11px',
          fontFamily: 'Tahoma, Arial, sans-serif',
        },
      },
      xaxis: {
        categories: categorias,
        labels: {
          rotate: -45,
          rotateAlways: categorias.length > 8,
          style: {
            fontSize: '11px',
            fontFamily: 'Tahoma, Arial, sans-serif',
          },
        },
        title: {
          text: 'Usuarios',
          style: {
            fontFamily: 'Tahoma, Arial, sans-serif',
            fontWeight: 600,
            fontSize: '12px',
          },
        },
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
          formatter: (val: number) => Math.round(val).toString(),
          style: {
            fontFamily: 'Tahoma, Arial, sans-serif',
          },
        },
        title: {
          text: 'Cantidad de comentarios',
          style: {
            fontFamily: 'Tahoma, Arial, sans-serif',
            fontWeight: 600,
            fontSize: '12px',
          },
        },
      },
      grid: {
        borderColor: '#e0e0e0',
        strokeDashArray: 4,
      },
      tooltip: {
        x: {
          show: true,
        },
        y: {
          formatter: (val: number) => `${val} comentarios`,
        },
      },
    };
  }

  private formatDateToInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
