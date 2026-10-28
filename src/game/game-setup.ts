export enum RailwayCompanies {
  Wabash = 0,
  PRR,
  BandO,
  NYC,
  CandO,
}

export enum CostAndIncome {
  ConstructionCost = 0,
  Income,
  IncomeIfDeveloped
}

class RC {
  id: string = "";
  name: string = "";
  trains: number = 0;
  stocks: number = 0;
  initialBid: number = 0;
  initialIncome: number = 0;
}

export class ChicagoExpressSetup {
  static readonly railwayCompanies: RC[] = [
    {id: "Wabash", name: "Wabash Railroad Company", trains: 11, stocks: 2, initialBid: 0, initialIncome: 1},
    {id: "PRR", name: "The Pennsylvania Railroad Company", trains: 20, stocks: 3, initialBid: 7, initialIncome: 7},
    {id: "BandO", name: "Baltimore & Ohio", trains: 22, stocks: 4, initialBid: 6, initialIncome: 6},
    {id: "NYC", name: "New York Central", trains: 24, stocks: 5, initialBid: 5, initialIncome: 8},
    {id: "CandO", name: "Chesapeake & Ohio", trains: 26, stocks: 6, initialBid: 8, initialIncome: 5},
  ]
  static readonly houses: number = 20;

  static readonly columnConfiguration: [number, number][] = [
    [2, 4],
    [2, 6],
    [0, 7],
    [0, 7],
    [0, 8],
    [1, 8],
    [2, 9],
    [2, 9],
    [2, 10],
    [1, 9],
    [1, 10],
    [0, 9],
    [0, 10],
    [0, 9],
    [0, 10],
    [0, 9],
    [0, 9],
    [0, 6],
    [0, 5]
  ]

  // configures cost and incomes per field in each row, list only existing fields as per columnConfiguration
  // 1st number => cost
  // 2nd number => train income
  // 3rd number => development income
  static readonly columnCostAndIncomeConfiguration: [number, number, number][][] = [
    [[-3, 7, 0], [-1, 0, 0], [-1, 0, 0]], // column 0
    [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 2, 2], [-1, 0, 0]],
    [[-1, 0, 0], [-1, 0, 0], [-2, 1, 2], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]],
    [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 1, 2], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-2, 2, 2]],
    [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]],
    [[-2, 1, 1], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 1, 1], [-1, 0, 0], [-1, 0, 0], [-2, 2, 1]],
    [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-2, 0, 0], [-3, 1, 2]],
    [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-2, 0, 0], [-2, 0, 0], [-3, 1, 2]], // column 7
    [[-1, 2, 2], [-1, 0, 0], [-2, 1, 1], [-2, 0, 0], [-3, 0, 0], [-2, 0, 0], [-4, 1, 2], [-3, 2, 1], [-3, 1, 2]],
    [[-1, 0, 0], [-1, 0, 0], [-2, 0, 0], [-2, 0, 0], [-2, 0, 0], [-3, 1, 2], [-4, 1, 2], [-4, 1, 2], [-3, 1, 2]],
    [[-1, 0, 0], [-2, 0, 0], [-4, 0, 0], [-4, 0, 0], [-4, 0, 0], [-4, 1, 2], [-2, 1, 2], [-4, 1, 2], [-2, 0, 0], [-2, 1, 1]],
    [[-2, 3, 2], [-1, 0, 0], [-2, 0, 0], [-3, 0, 0], [-3, 1, 2], [-4, 1, 2], [-2, 1, 2], [-3, 0, 0], [-2, 0, 0], [-1, 0, 0]],
    [[-1, 0, 0], [-2, 0, 0], [-2, 0, 0], [-3, 0, 0], [-2, 1, 1], [-4, 1, 2], [-2, 1, 2], [-2, 0, 0], [-2, 0, 0], [-2, 0, 0], [-1, 1, 1]],
    [[-1, 0, 0], [-2, 0, 0], [-3, 0, 0], [-2, 0, 0], [-3, 1, 2], [-4, 0, 0], [-2, 1, 1], [-1, 0, 0], [-2, 0, 0], [-2, 0, 0], [-1, 0, 0]],
    [[-2, 1, 2], [-2, 0, 0], [-3, 0, 0], [-3, 0, 0], [-2, 1, 1], [-2, 0, 0], [-2, 0, 0], [-1, 0, 0], [-2, 0, 0], [-2, 0, 0], [-2, 2, 1]],
    [[-1, 0, 0], [-2, 0, 0], [-2, 0, 0], [-2, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]],
    [[-2, 1, 1], [-2, 0, 0], [-2, 0, 0], [-2, 1, 1], [-2, 0, 0], [-1, 0, 0], [-1, 0, 0], [0, 0, 0], [-1, 0, 0], [0, 0, 0]],
    [[-1, 0, 0], [-2, 0, 0], [-2, 0, 0], [-2, 0, 0], [-1, 0, 0], [0, 0, 0], [-1, 0, 0]],
    [[-2, 1, 2], [-1, 0, 0], [-1, 0, 0], [0, 0, 0], [-1, 0, 0], [-1, 0, 0],], // column 18
  ]

  public static getCostAndIncomeConfiguration(rowIndex: number, columnIndex: number) {
    return this.columnCostAndIncomeConfiguration[columnIndex][rowIndex - this.columnConfiguration[columnIndex][0]];
  }

  static readonly forests: [number, number][] = [
    [8, 6],
    [7, 7], [8, 7],
    [5, 8], [7, 8],
    [2, 9], [3, 9], [4, 9], [5, 9],
    [2, 10], [3, 10], [4, 10], [5, 10], [9, 10],
    [2, 11], [3, 11], [7, 11], [8, 11],
    [1, 12], [2, 12], [3, 12], [7, 12], [8, 12], [9, 12],
    [1, 13], [2, 13], [3, 13], [7, 13],
    [1, 14], [2, 14], [3, 14], [9, 14],
    [1, 15], [2, 15], [3, 15],
    [1, 16], [2, 16], [4, 16],
    [1, 17], [2, 17], [3, 17],
  ]

  static readonly industries: [number, number][] = [
    [0, 4], [6, 8], [4, 10]
  ]

  static readonly cities: [number, number][] = [
    [2, 0], [5, 1], [2, 2], [3, 3], [7, 3], [1, 5], [5, 5], [8, 5],
    [2, 8], [4, 8], [9, 8], [7, 10], [10, 10], [0, 11],
    [4, 12], [10, 12], [6, 13], [0, 14], [4, 14], [10, 14], [0, 16], [3, 16],
    [0, 18]
  ]

  static readonly mountains: [number, number][] = [
    [9, 6], [9, 7], [8, 8], [10, 8], [6, 9], [7, 9], [8, 9], [9, 9],
    [6, 10], [8, 10], [4, 11], [5, 11], [6, 11], [5, 12], [6, 12],
    [4, 13],
  ]

  public static fieldIsForest(rowIndex: number, columnIndex: number) {
    return ChicagoExpressSetup.forests.some(([a, b]) => a == rowIndex && b == columnIndex);
  }

  public static fieldIsIndustry(rowIndex: number, columnIndex: number) {
    return ChicagoExpressSetup.industries.some(([a, b]) => a == rowIndex && b == columnIndex);
  }

  public static fieldIsCity(rowIndex: number, columnIndex: number) {
    return ChicagoExpressSetup.cities.some(([a, b]) => a == rowIndex && b == columnIndex);
  }

  public static fieldIsMountain(rowIndex: number, columnIndex: number) {
    return ChicagoExpressSetup.mountains.some(([a, b]) => a == rowIndex && b == columnIndex);
  }

  public static fieldCanBeDeveloped(rowIndex: number, columnIndex: number) {
    return (
      ChicagoExpressSetup.fieldIsForest(rowIndex, columnIndex) ||
      ChicagoExpressSetup.fieldIsCity(rowIndex, columnIndex) ||
      ChicagoExpressSetup.fieldIsMountain(rowIndex, columnIndex)
    );
  }

  public static fieldExists(rowIndex: number, columnIndex: number) {
    var fieldExists = false;
    if (columnIndex >= 0 && columnIndex < this.columnConfiguration.length) {
      fieldExists = rowIndex >= this.columnConfiguration[columnIndex][0] && rowIndex <= this.columnConfiguration[columnIndex][1]
    }
    return fieldExists;
  }
}
