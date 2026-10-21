export enum RailwayCompanies {
  Wabash = 0,
  PRR,
  BandO,
  NYC,
  CandO,
}

class RC {
  id: string = "";
  name: string = "";
  trains: number = 0;
  stocks: number = 0;
  initialBid: number = 0;
}

export class ChicagoExpressSetup {
  static readonly railwayCompanies: RC[] = [
    {id: "Wabash", name: "Wabash Railroad Company", trains: 11, stocks: 2, initialBid: 0},
    {id: "PRR", name: "The Pennsylvania Railroad Company", trains: 20, stocks: 3, initialBid: 7},
    {id: "BandO", name: "Baltimore & Ohio", trains: 22, stocks: 4, initialBid: 6},
    {id: "NYC", name: "New York Central", trains: 24, stocks: 5, initialBid: 5},
    {id: "CandO", name: "Chesapeake & Ohio", trains: 6, stocks: 6, initialBid: 8},
  ]
}
