export interface Ticket {
    _id: string,
    name: string,
    surname: string,
    from: TicketFromToProps,
    to: TicketFromToProps,
    company: TicketCompanyProps,
    flightNumber: string,
    aircraft: string,
    qrdata: string,
    qrtype: number,
    title: string,
    date: Date,
    creator: string,
    sharedBy?: string,
}

interface TicketFromToProps {
    iata: string,
    name: string,
}

interface TicketCompanyProps {
    name: string,
    iata: string,
    icao: string,
}

let tickets: Ticket[];

export function setTickets(t: Ticket[]) {
    tickets = t;
}

export function getTickets() {
    return tickets;
}

export function addTicket(t: Ticket) {
    tickets.push(t);
}

export function removeTicket(id: string) {
    tickets = tickets.filter((t) => t._id !== id);
}