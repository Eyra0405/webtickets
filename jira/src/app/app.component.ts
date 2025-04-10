import { Component, OnInit } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http'; 
import { NgFor, NgClass, CommonModule } from '@angular/common';  // Importa CommonModule aquí
import { interval } from 'rxjs';

  @Component({
    selector: 'app-root',
    standalone: true,
    imports: [HttpClientModule, NgFor, NgClass, CommonModule],  // Asegúrate de importar CommonModule aquí
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
    } )
export class AppComponent implements OnInit {
  openTickets: any[] = [];
  waitingTickets: any[] = [];
  resolvedTickets: any[] = [];

  herramientaImages: { [key: string]: string } = {
    'umb': 'umbrella.png',
    'edr': 'edr.png',
    'duo': 'duo.png',
    'mer': 'meraki.png'
  };

  constructor(private http: HttpClient) { };
  ngOnInit() {
    this.fetchTickets(); // Obtener los tickets al inicio
    interval(300000).subscribe(() => this.fetchTickets());  // Actualiza cada 5 minutos



  }

  // Función para obtener los tickets desde el backend
  fetchTickets() {
    this.http.get<any>('http://127.0.0.1:5000/api/jira/tickets')
      .subscribe(
        (        response: { tickets: any[]; }) => {
          console.log('Respuesta completa del backend:', response);
          if (Array.isArray(response.tickets)) {
            this.filterTickets(response.tickets);
          } else {
            console.error('La respuesta no contiene un array de tickets:', response);
          }
        },
        (        error: { error: any; }) => {
          console.error('Error al obtener tickets:', error);
          console.error('Detalles del error:', error.error);  // Aquí se imprime el error recibido
          alert('Ocurrió un error al obtener los tickets');
        }
      );
  }

  // Función para calcular el tiempo restante y el porcentaje de progreso
  calculateTimeLeft(createdAt: string): { timeLeft: number, progress: number, blinking: boolean } {
    const now = new Date();
  const createdDate = new Date(createdAt);
  const timeDiff = now.getTime() - createdDate.getTime(); // Diferencia en milisegundos
  const totalTime = 60 * 60 * 1000; // 1 hora en milisegundos
  const timeLeft = Math.max((totalTime - timeDiff) / (1000 * 60), 0); // Minutos restantes
  const progress = Math.min((timeDiff / totalTime) * 100, 100); // Porcentaje de progreso
  // Verificamos si el tiempo restante es menor o igual a 5 minutos  
    let blinking = false;

    // Usamos un if para verificar si el tiempo restante es menor o igual a 5 minutos
    if (timeLeft <= 5) {
      blinking = true;  // Si el tiempo restante es 5 minutos o menos, activamos el parpadeo
    }
     // 5 minutos en milisegundos
    console.log(`Ticket Key: ${createdAt}, Progress: ${progress}, Time Left: ${timeLeft}, Blinking: ${blinking}`);
    return { 
      timeLeft,
      progress,
      blinking 
    };
  }

  // Función para obtener el fondo del ticket con la barra de progreso
  getTicketBackground(progress: number): string {
    const whiteProgress = Math.min(100, progress); 
    return `linear-gradient(to right, white ${whiteProgress}%, rgb(252, 209, 194) ${whiteProgress}%)`; 
  }
  // Función para filtrar y organizar los tickets
  filterTickets(tickets: any[]) {
    this.openTickets = [];
    this.waitingTickets = [];
    this.resolvedTickets = [];
  
    // Ordena los tickets por la fecha de creación (de más antiguo a más reciente)
    tickets.sort((a, b) => {
      const dateA = new Date(a.hora);  // Cambié 'createdAt' por 'hora'
      const dateB = new Date(b.hora);  // Cambié 'createdAt' por 'hora'
  
      // Verificar si las fechas son válidas
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        console.error('Fechas inválidas:', a.hora, b.hora);  // Mostramos las fechas para depuración
        return 0; // Si alguna de las fechas no es válida, no realizar el orden
      }
  
      // Ordenar de más antiguo a más reciente
      return dateA.getTime() - dateB.getTime();
    });
  
    tickets.forEach(ticket => {
      const status = ticket.status?.trim().toLowerCase() || 'desconocido'; // Default value if no status
      let herramientaImage = '';
  
      // Determine the herramienta image
      switch ((ticket.herramienta || '').toLowerCase()) {
        case 'umb':
          herramientaImage = 'umbrella.png';
          break;
        case 'edr':
          herramientaImage = 'edr.png';
          break;
        case 'duo':
          herramientaImage = 'duo.png';
          break;
        case 'mer':
          herramientaImage = 'meraki.png';
          break;
        default:
          herramientaImage = '';
      }
  
      console.log('Imagen asignada para herramienta:', herramientaImage);
  
      // Calculate time left and progress
      const { timeLeft, progress, blinking } = this.calculateTimeLeft(ticket.hora); // Include blinking here
      console.log(`Ticket Key: ${ticket.key}, Progress: ${progress}, Time Left: ${timeLeft} minutos`);
  
      const ticketData = {
        key: ticket.key,
        prioridad: ticket.prioridad,
        herramienta: ticket.herramienta,
        organizacion: ticket.organizacion,
        herramientaImage: herramientaImage,
        timeLeft: timeLeft,
        progress: progress, // Add progress to the ticket
        blinking: blinking // Use the blinking variable here
      };
  
      console.log(`Ticket: ${ticket.key}, Blinking: ${ticketData.blinking}, Time Left: ${timeLeft}`);
  
      // Push ticketData to the appropriate array based on status
      if (status === 'abierto') {
        this.openTickets.push(ticketData);
      } else if (status.includes('trabajo')) {
        this.waitingTickets.push(ticketData);
      } else if (status === 'finalizado') {
        this.resolvedTickets.push(ticketData);
      } else {
        console.warn(`Ticket sin categoría de estado conocido:`, ticket);
      }
   
    });
  
    console.log("Tickets Abiertos:", this.openTickets);
    console.log("Tickets En Espera:", this.waitingTickets);
    console.log("Tickets Resueltos:", this.resolvedTickets);
  }
}  