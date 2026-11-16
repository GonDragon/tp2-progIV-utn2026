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

export type IntervaloTipo = 'hora' | 'dia' | 'mes';

interface IntervalSlot {
  start: string;
  end: string;
  label: string;
}

@Component({
  selector: 'app-est-comentarios',
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './est-comentarios.html',
  styleUrl: './est-comentarios.css',
})
export class EstComentarios implements OnInit {
  private publicacionesService = inject(PublicacionesService);
  private cdr = inject(ChangeDetectorRef);

  fechaInicio: string = '';
  fechaFin: string = '';
  intervalo: IntervaloTipo = 'dia';
  usuarioFiltro: string = '';

  cargando: boolean = false;
  errorMensaje: string | null = null;
  totalComentarios: number = 0;
  promedioPorIntervalo: number = 0;
  maxComentariosEnPunto: number = 0;

  chartOptions: Partial<ChartOptions> | null = null;

  ngOnInit(): void {
    this.inicializarFechasPorDefecto();
    this.consultarEstadisticas();
  }

  inicializarFechasPorDefecto(): void {
    const hoy = new Date();
    const hace7Dias = new Date();
    hace7Dias.setDate(hoy.getDate() - 6);

    this.fechaFin = this.formatDateToInput(hoy);
    this.fechaInicio = this.formatDateToInput(hace7Dias);
  }

  onIntervaloChange(): void {
    const hoy = new Date();
    if (this.intervalo === 'hora') {
      const hoyInicio = new Date();
      this.fechaInicio = this.formatDateToInput(hoyInicio);
      this.fechaFin = this.formatDateToInput(hoy);
    } else if (this.intervalo === 'dia') {
      const hace7Dias = new Date();
      hace7Dias.setDate(hoy.getDate() - 6);
      this.fechaInicio = this.formatDateToInput(hace7Dias);
      this.fechaFin = this.formatDateToInput(hoy);
    } else if (this.intervalo === 'mes') {
      const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
      this.fechaInicio = this.formatDateToInput(inicioAnio);
      this.fechaFin = this.formatDateToInput(hoy);
    }
    this.consultarEstadisticas();
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

    const slots = this.generarSlots(startDate, endDate, this.intervalo);

    if (slots.length === 0) {
      this.errorMensaje = 'No se pudieron generar intervalos con el rango seleccionado.';
      this.cdr.detectChanges();
      return;
    }

    if (slots.length > 500) {
      this.errorMensaje = `El rango seleccionado genera ${slots.length} intervalos. Por favor seleccione un rango menor o un intervalo más amplio (día/mes).`;
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    const peticiones = slots.map((slot) =>
      this.publicacionesService
        .getCantidadComentarios({
          fecha_inicio: slot.start,
          fecha_fin: slot.end,
          usuario: this.usuarioFiltro.trim() || undefined,
        })
        .pipe(
          catchError((err) => {
            console.error('Error al obtener cantidad de comentarios para intervalo:', slot, err);
            return of({ cantidad: 0 });
          }),
        ),
    );

    forkJoin(peticiones).subscribe({
      next: (respuestas) => {
        const cantidades = respuestas.map((r) => r?.cantidad || 0);
        this.totalComentarios = cantidades.reduce((acc, c) => acc + c, 0);
        this.promedioPorIntervalo =
          cantidades.length > 0 ? Number((this.totalComentarios / cantidades.length).toFixed(1)) : 0;
        this.maxComentariosEnPunto = cantidades.length > 0 ? Math.max(...cantidades) : 0;

        const categorias = slots.map((s) => s.label);
        this.configurarGrafico(categorias, cantidades);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al consultar estadísticas de comentarios:', err);
        this.errorMensaje = 'Ocurrió un error al cargar las estadísticas del servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private generarSlots(startDate: Date, endDate: Date, intervalo: IntervaloTipo): IntervalSlot[] {
    const slots: IntervalSlot[] = [];

    if (intervalo === 'hora') {
      const current = new Date(startDate.getTime());
      while (current <= endDate) {
        const slotStart = new Date(current.getTime());
        const slotEnd = new Date(current.getTime() + 60 * 60 * 1000 - 1);
        const label = this.formatHourLabel(slotStart);
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          label,
        });
        current.setTime(current.getTime() + 60 * 60 * 1000);
      }
    } else if (intervalo === 'dia') {
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
      const targetEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

      while (current <= targetEnd) {
        const slotStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0);
        const slotEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999);
        const label = this.formatDayLabel(slotStart);
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          label,
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (intervalo === 'mes') {
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0);
      const targetEnd = new Date(endDate.getFullYear(), endDate.getMonth(), 1, 0, 0, 0, 0);

      while (current <= targetEnd) {
        const y = current.getFullYear();
        const m = current.getMonth();
        const slotStart = new Date(y, m, 1, 0, 0, 0, 0);
        const slotEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
        const label = this.formatMonthLabel(slotStart);
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          label,
        });
        current.setMonth(current.getMonth() + 1);
      }
    }

    return slots;
  }

  private configurarGrafico(categorias: string[], cantidades: number[]): void {
    const ejeIntervalo =
      this.intervalo === 'hora' ? 'Horas' : this.intervalo === 'dia' ? 'Días' : 'Meses';

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
        enabled: categorias.length <= 15,
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
          text: `Intervalo (${ejeIntervalo})`,
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

  private formatHourLabel(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    return `${day}/${month} ${hours}:00`;
  }

  private formatDayLabel(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  private formatMonthLabel(date: Date): string {
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }
}
