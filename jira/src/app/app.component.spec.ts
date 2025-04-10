import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClientModule } from '@angular/common/http';
import { By } from '@angular/platform-browser';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);  // Acceder al controlador de pruebas HTTP
  });

  afterEach(() => {
    httpMock.verify();  // Verificar que no haya peticiones HTTP pendientes
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should fetch tickets from backend', () => {
    // Simular una respuesta HTTP
    const mockTickets = [
      { key: 'TICKET-1', status: 'Abierta', summary: 'Resumen de ticket 1', assigned_to: 'Usuario 1' },
      { key: 'TICKET-2', status: 'Resuelto', summary: 'Resumen de ticket 2', assigned_to: 'Usuario 2' },
    ];

    // Llamar a la función que hace la solicitud HTTP
    app.fetchTickets();
    
    // Simular la respuesta HTTP
    const req = httpMock.expectOne('http://127.0.0.1:5000/api/jira/tickets');
    expect(req.request.method).toBe('GET');
    req.flush({ tickets: mockTickets });

    // Asegurarse de que los tickets se han recibido y filtrado correctamente
    expect(app.openTickets.length).toBe(1);
    expect(app.resolvedTickets.length).toBe(1);
  });

  it('should filter tickets correctly based on status', () => {
    const mockTickets = [
      { key: 'TICKET-1', status: 'Abierta', summary: 'Resumen de ticket 1' },
      { key: 'TICKET-2', status: 'Resuelto', summary: 'Resumen de ticket 2' },
      { key: 'TICKET-3', status: 'Esperando', summary: 'Resumen de ticket 3' },
    ];

    // Filtrar los tickets
    app.filterTickets(mockTickets);

    // Verificar los tickets filtrados
    expect(app.openTickets.length).toBe(1);
    expect(app.resolvedTickets.length).toBe(1);
    expect(app.waitingTickets.length).toBe(1);
  });

  it('should render ticket summaries in the template', () => {
    const mockTickets = [
      { key: 'TICKET-1', status: 'Abierta', summary: 'Resumen de ticket 1' },
    ];

    app.openTickets = mockTickets;  // Asignar los tickets a la lista de abiertos
    fixture.detectChanges();  // Forzar a Angular a realizar la actualización de la vista

    const ticketElements = fixture.debugElement.queryAll(By.css('.ticket'));
    expect(ticketElements.length).toBe(1);
    expect(ticketElements[0].nativeElement.querySelector('h4').textContent).toBe('TICKET-1');
    expect(ticketElements[0].nativeElement.querySelector('p').textContent).toBe('Resumen de ticket 1');
  });
});