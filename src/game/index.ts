import {
  createGame,
  Player,
  Space,
  Piece,
  Game,  
  ConnectedSpaceMap,
  Do,
  HexGrid,
} from '@boardzilla/core';

import {
  ChicagoExpressSetup,
  CostAndIncome,
  IndustrialCities,
  RailwayCompanies
} from './game-setup.js'

export class ChicagoExpressPlayer extends Player<ChicagoExpressGame, ChicagoExpressPlayer> {
  //balance: number = 0;
  passedThisAuction: boolean = false;
  hasPlacedBid: boolean = false;
  dividendAmount: number = 0;

  getBalance() : number {
    return this.my(PlayerTableau)!.first('account')!.all('banknote').length;
  }
}

export enum GameStates {
  None = 0,
  SelectAction,
  SelectCompany,
  SelectFields
}

export class ChicagoExpressGame extends Game<ChicagoExpressGame, ChicagoExpressPlayer> {
  lastBid: number = 0
  // player who started the auction
  firstPlayerOfAuction?: ChicagoExpressPlayer = undefined;

  // contains spaces for each railway company in order as defined by RailwayCompanies enum
  railwayCompanies: RailwayCompany[] = [];

  gameState: GameStates = GameStates.None;

  // lists selectable fields when game is in state SelectFields
  selectableFields: HexagonalField[] = [];
  // lists selectable companies when game is in state SelectCompany
  selectableCompanies: RailwayCompany[] = [];

  selectedActionGauge?: Gauge = undefined;
  selectedCompany?: RailwayCompany = undefined;
  selectedField?: HexagonalField = undefined;

  isFieldSelectable(hexField: HexagonalField) : boolean {
    return this.selectableFields.find((element) => hexField.row == element.row && hexField.column == element.column) != undefined;
  }

  getActionGauges() : Gauge[] {
    var gauges = [this.first('auction-gauge') as Gauge, this.first('development-gauge') as Gauge, this.first('route-construction-gauge') as Gauge];
    return gauges;
  }

  getStartField(companyId: string) : HexagonalField {
    var startField = undefined;
    switch (companyId)
    {
      case ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].id:
        startField = this.game.first('hex-3-3')! as HexagonalField; break;
      case ChicagoExpressSetup.railwayCompanies[RailwayCompanies.PRR].id:
        startField = this.game.first('hex-5-17') as HexagonalField; break;
      case ChicagoExpressSetup.railwayCompanies[RailwayCompanies.BandO].id:
        startField = this.game.first('hex-7-16') as HexagonalField; break;
      case ChicagoExpressSetup.railwayCompanies[RailwayCompanies.NYC].id:
        startField = this.game.first('hex-3-18') as HexagonalField; break;
      case ChicagoExpressSetup.railwayCompanies[RailwayCompanies.CandO].id:
        startField = this.game.first('hex-9-16') as HexagonalField; break;
    }
    return startField!;
  }

  getSelectableActions() : Gauge[] {
    return this.getActionGauges().filter((gauge) => gauge.isActionPossible());
  }

  getSelectableCompaniesForAuction() : RailwayCompany[] {
    return this.railwayCompanies.filter((company) => company.isSelectableForAuction());
  }

  getSelectableCompaniesForConstruction(player: ChicagoExpressPlayer) : RailwayCompany[] {
    var companies: RailwayCompany[] = [];
    this.railwayCompanies.forEach((company) => {
      if (player.my('player-tableau')?.first('stocks')?.has(`${company.name}-stock`))
        companies.push(company);
    });
    return companies;
  }

  getSelectableCompanies() : RailwayCompany[] {
    return this.selectableCompanies;
  }

  getFieldsOccupiedByCompany(company: RailwayCompany) : HexagonalField[] {
   var fieldsOccupiedByCompany : HexagonalField[] = [];

    this.game.all(Piece, `${company.name}-train`).forEach((train) => {
      // trains are in trains-space of respective hex-{row}-{column} spaces
      const container = train.container()?.container();
      if (container!.name.startsWith('hex-')) {
        const hexField = container as HexagonalField;
        fieldsOccupiedByCompany.push(hexField);
      }
    });

    console.log(`fields occupied by ${company} are ${fieldsOccupiedByCompany}`);

    return fieldsOccupiedByCompany;
  }

  canPutTrainOnField(company: RailwayCompany, hexField: HexagonalField) : boolean {
    var canPutTrainOnField : boolean = false;

    // check if fields has space for the train to put
    if (!hexField.first('trains-space')!.has(`${company.name}-train`)) {
      // hex field does not contain any train of respective company
      console.log(`${hexField} has no train of company ${company}`);

      if (ChicagoExpressSetup.fieldIsMountain(hexField.row, hexField.column) || ChicagoExpressSetup.fieldIsForest(hexField.row, hexField.column)) {
        // if hex field is mountain or forest there must be no other train
        canPutTrainOnField = hexField.first('trains-space')!.all(Piece, (piece) => piece.name.endsWith('-train')).length == 0;
      }
      else
      if (ChicagoExpressSetup.fieldIsStartField(hexField.row, hexField.column)) {
        console.log(`${hexField} is start field`);
        canPutTrainOnField = false;
      }
      else {
        canPutTrainOnField = true;
      }
    }

    if (canPutTrainOnField) {
      // check if company can afford to put the train
      const presentTrains = 1 + hexField.first('trains-space')!.all(Piece, (piece) => piece.name.endsWith('-train')).length;
      const constructionCost = presentTrains * -ChicagoExpressSetup.getCostAndIncomeConfiguration(hexField.row, hexField.column)[CostAndIncome.ConstructionCost];

      console.log(`on field ${hexField} are ${presentTrains-1} trains present which results in construction cost of ${constructionCost}`);
      canPutTrainOnField = company.getBalance() >= constructionCost;
    }

    console.log(`${company} can put train on ${hexField}: ${canPutTrainOnField}`);

    return canPutTrainOnField;
  }

  getAdjacentFields(field: [number, number]) : [number, number][] {
    var adjacentFields : [number, number][] = [];
    if (field[1] % 2 == 0) {
      // field is in even column
      adjacentFields.push(
        [field[0]-1, field[1]],
        [field[0]-1, field[1]+1],
        [field[0], field[1]+1],
        [field[0]+1, field[1]],
        [field[0], field[1]-1],
        [field[0]-1, field[1]-1]
      );
    }
    else {
      // field is in odd colum
      adjacentFields.push(
        [field[0]-1, field[1]],
        [field[0], field[1]+1],
        [field[0]+1, field[1]+1],
        [field[0]+1, field[1]],
        [field[0]+1, field[1]-1],
        [field[0], field[1]-1]
      );
    }
    adjacentFields = adjacentFields.filter((field) => ChicagoExpressSetup.fieldExists(field[0], field[1]));
    console.log(`adjacent fields of ${field} are ${adjacentFields}`);
    return adjacentFields;
  }

  getSelectableFieldsForConstruction(company: RailwayCompany) : HexagonalField[] {
    var selectableFields : HexagonalField[] = [];

    this.getFieldsOccupiedByCompany(company).forEach((field) => {
      selectableFields = selectableFields.concat(this.getAdjacentFields([field.row, field.column]).map((field) => this.game.first(`hex-${field[0]}-${field[1]}`) as HexagonalField ));
    });
    console.log(`before unify: selectable fields for ${company} are ${selectableFields}`);

    selectableFields = [
      ...new Map(
        selectableFields.map((hexField) => [`${hexField.row},${hexField.column}`, hexField as HexagonalField])
      ).values(),
    ].filter((field) => this.canPutTrainOnField(company, field));
    console.log(`after unify: selectable fields for ${company} are ${selectableFields}`);

    return selectableFields;
  }

  getSelectableFieldsForDevelopment() : HexagonalField[] {
    var selectableFields : HexagonalField[] = [];

    // var citiesMountainsAndForests : [number, number][] = ChicagoExpressSetup.cities.concat(ChicagoExpressSetup.mountains).concat(ChicagoExpressSetup.forests);
    ChicagoExpressSetup.cities.forEach((field) => {
      const hexField = this.first(HexagonalField, `hex-${field[0]}-${field[1]}`);
      if (hexField != undefined && hexField.has(Piece, (piece) => piece.name.endsWith('-train')) && !hexField.first('house-space')!.has('house'))
        selectableFields.push(hexField);
    })

    var hexField = this.first(`hex-${ChicagoExpressSetup.Wheeling[0]}-${ChicagoExpressSetup.Wheeling[1]}`) as HexagonalField;
    if (hexField.has(Piece, (piece) => piece.name.endsWith('-train'))) {
      console.log(`wheeling has a train`);
      const cells = this.first('industrial-city-track')?.all(Space, (space) => space.name.startsWith(`${ChicagoExpressSetup.industrialCityNames[IndustrialCities.Wheeling]}-`));
      console.log(`cells size of ${cells?.length}`);
      for (const [index, cell] of cells!.entries()) {
        console.log(`testing ${index}`);
        const house = cell.first('house') as unknown as House;

        if (house != undefined && index < ChicagoExpressSetup.industrialCityTrackCells[IndustrialCities.Wheeling].length-1) {
          selectableFields.push(hexField);
          break;
        }
      }
    }

    var hexField = this.first(`hex-${ChicagoExpressSetup.Pittsburgh[0]}-${ChicagoExpressSetup.Pittsburgh[1]}`) as HexagonalField;
    if (hexField.has(Piece, (piece) => piece.name.endsWith('-train'))) {
      console.log(`pittsburgh has a train`);
      const cells = this.first('industrial-city-track')?.all(Space, (space) => space.name.startsWith(`${ChicagoExpressSetup.industrialCityNames[IndustrialCities.Pittsburgh]}-`));
      console.log(`cells size of ${cells?.length}`);
      for (const [index, cell] of cells!.entries()) {
        console.log(`testing ${index}`);
        const house = cell.first('house') as House;

        if (house != undefined && index < ChicagoExpressSetup.industrialCityTrackCells[IndustrialCities.Pittsburgh].length-1) {
          selectableFields.push(hexField);
          break;
        }
      }
    }

    return selectableFields;
  }

  getSelectableFields() : HexagonalField[] {
    return this.selectableFields;
  }

  gameEnds(): boolean {
    var numCompaniesWithNoTrains: number = 0;
    var numCompaniesWithNoStocks: number = 0;
    this.game.railwayCompanies.forEach((company) => {
      if (!company.has(`${company.name}-train`)) ++numCompaniesWithNoTrains;
      if (!company.has(`${company.name}-stock`)) ++numCompaniesWithNoStocks;
    })

    var lessEqualThreeHouses = this.game.first('house-pile')!.all('house').length <= 3;

    const lastDetroitCell = this.game.first(`${ChicagoExpressSetup.industrialCityNames[IndustrialCities.Detroit]}-${ChicagoExpressSetup.industrialCityTrackCells[IndustrialCities.Detroit][ChicagoExpressSetup.industrialCityTrackCells[IndustrialCities.Detroit].length-1]}`);

    console.log(`checking end condition, ${numCompaniesWithNoStocks} companies without stock, ${numCompaniesWithNoTrains} companies without trains, ${lessEqualThreeHouses}, ${lastDetroitCell?.has('house')}`);

    return (numCompaniesWithNoStocks >=3 || numCompaniesWithNoTrains >= 3 || lessEqualThreeHouses || lastDetroitCell!.has('house'));
  }

  isDividendPhaseDue() : boolean {
    return this.getActionGauges().filter((gauge) => gauge.isActionPossible()).length <= 1;
  }

  transferMoney(amount: number, fromSpace: Space<ChicagoExpressGame, ChicagoExpressPlayer>, toSpace: Space<ChicagoExpressGame, ChicagoExpressPlayer>) {
    for (let n = 0; n < amount; ++n) {
      const banknote = fromSpace.first('account')!.first('banknote')! as Banknote;
      banknote.putInto(toSpace.first('account')!);
    }
  }

  transferStocks(amount: number, fromSpace: Space<ChicagoExpressGame, ChicagoExpressPlayer>, toSpace: Space<ChicagoExpressGame, ChicagoExpressPlayer>) {
    for (let n = 0; n < amount; ++n) {
      const stock = fromSpace.first('stocks')!.first(Piece, (piece) => piece.name.endsWith('-stock'))! as Stock;
      stock.putInto(toSpace.first('stocks')!);
    }
  }
}

export class RailwayCompany extends Space<ChicagoExpressGame> {
  initialBid: number = 0;

  income: number = 0;

  public hasStocks(): boolean {
    return this.has(`${this.name}-stock`);
  }

  public isSelectableForAuction(): boolean {
    // Wabash is selectable only if there is at least 1 train in Chicago
    var isOpened = true;

    if (ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].id == this.name) {
      var field = this.game.first('hex-2-0'); // Chicago field
      if (field != undefined)
        isOpened = !field.first('trains-space')!.isEmpty();
    }

    return isOpened && this.hasStocks();
  }

  public countStocksOutstanding() : number {
    return Math.max(1, this.game.all(`${this.name}-stock`).length - this.game.first(`${this.name}`)!.first('stocks')!.all(`${this.name}-stock`).length);
  }

  getBalance() : number {
    return this.first('account')!.all('banknote').length;
  }
}

export class Board extends Space<ChicagoExpressGame> { }
export class PlayerTableau extends Space<ChicagoExpressGame, ChicagoExpressPlayer> { }
export class Gauge extends Space<ChicagoExpressGame, ChicagoExpressPlayer> {
  protected currentAction: number = 0;

  getAngle(): number { return (0); }
  isActionPossible(): boolean { return false; }
  makeAction() { ++this.currentAction; }
  resetAction() { this.currentAction = 0; }
}
export class AuctionGauge extends Gauge { 
  readonly actionAngles: number[] = [-40, 15, 46, 75];

  public override getAngle(): number {
    return (this.actionAngles[(this.currentAction < this.actionAngles.length) ? this.currentAction : this.actionAngles.length-1]);
  }
  public override isActionPossible(): boolean {
    return this.currentAction < this.actionAngles.length-1;
  }
}
export class DevelopmentGauge extends Gauge {
  readonly actionAngles: number[] = [-60, -15, 15, 46, 75];

  override getAngle(): number {
    return (this.actionAngles[(this.currentAction < this.actionAngles.length) ? this.currentAction : this.actionAngles.length-1]);
  }
  public override isActionPossible(): boolean {
    return this.currentAction < this.actionAngles.length-1;
  }
}
export class RouteConstructionGauge extends Gauge {
  readonly actionAngles: number[] = [-75, -45, -15, 15, 46, 75];

  override getAngle(): number {
    return (this.actionAngles[(this.currentAction < this.actionAngles.length) ? this.currentAction : this.actionAngles.length-1]);
  }
  public override isActionPossible(): boolean {
    return this.currentAction < this.actionAngles.length-1;
  }
}
export class HexagonalField extends Space<ChicagoExpressGame, ChicagoExpressPlayer> {
  row: number = 0;
  column: number = 0;
}
export class Bank extends Space<ChicagoExpressGame, ChicagoExpressPlayer> {

}

export class Train extends Piece<ChicagoExpressGame> {}
export class Stock extends Piece<ChicagoExpressGame> {}
export class House extends Piece<ChicagoExpressGame> {}
export class Banknote extends Piece<ChicagoExpressGame> {}

/**
 * Main game definitions.
 */
export default createGame(ChicagoExpressPlayer, ChicagoExpressGame, game => {

  const { action } = game;
  const { playerActions, forLoop, whileLoop, eachPlayer, forEach, ifElse, switchCase } = game.flowCommands;

  const bank = game.create(Bank, 'bank');
  const account = bank.create(Space, 'account');
  account.createMany(1593, Banknote, 'banknote');

  const board = game.create(Board, 'board');

  const map = board.create(ConnectedSpaceMap, 'map');
  ChicagoExpressSetup.columnConfiguration.forEach((column, columnIndex) => {
    for(let row = column[0]; row <= column[1]; ++row)
    {
      const hexField = map.create(HexagonalField, `hex-${row}-${columnIndex}`, { row: row, column: columnIndex });
      const trains = hexField.create(Space, 'trains-space')
      if (ChicagoExpressSetup.fieldCanContainHouse(row, columnIndex)) {
        const house = hexField.create(Space, 'house-space');
      }
    }
  })

  const housePile = board.create(Space, "house-pile");
  housePile.createMany(ChicagoExpressSetup.houses, House, 'house');

  const industrialTrack = board.create(Space, "industrial-city-track");
  ChicagoExpressSetup.industrialCities.forEach((industrialCity, index) => {
    ChicagoExpressSetup.industrialCityTrackCells[index].forEach((cellIndex) => {
      industrialTrack.create(Space, `${ChicagoExpressSetup.industrialCityNames[index]}-${cellIndex}`);
    });
    industrialTrack.first(`${ChicagoExpressSetup.industrialCityNames[index]}-${ChicagoExpressSetup.industrialCityTrackCells[index][0]}`)?.createMany(1, House, 'house');
  })

  const auctionGauge = board.create(AuctionGauge, "auction-gauge");
  board.create(DevelopmentGauge, "development-gauge");
  board.create(RouteConstructionGauge, "route-construction-gauge");

  // create tableau spaces for each player
  for (const player of game.players) {
    var playerTableau = game.create(PlayerTableau, `player-tableau`, { player });
    playerTableau.create(Space, 'account');
    playerTableau.create(Space, 'stocks');
  }

  // create space for Wabash railway company
  const wabashId = ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].id
  const wabash = board.create(RailwayCompany, wabashId, {initialBid: 0, income: 0});
  wabash.create(Space, 'account');
  var trains = wabash.create(Space, 'trains');
  trains.createMany(ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].trains, Train, `${wabashId}-train`);
  var stocks = wabash.create(Space, 'stocks');
  stocks.createMany(ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].stocks, Stock, `${wabashId}-stock`);
  game.railwayCompanies.push(wabash);

  // create spaces for the other railway companies
  ChicagoExpressSetup.railwayCompanies.slice(1).forEach((company, index) => {
    var thisCompany = game.create(RailwayCompany, company.id,
      {initialBid: company.initialBid, income: company.initialIncome});

    thisCompany.create(Space, 'account');
    var trains = thisCompany.create(Space, 'trains');
    trains.createMany(company.trains, Train, `${company.id}-train`);
    var stocks = thisCompany.create(Space, 'stocks');
    stocks.createMany(company.stocks, Stock, `${company.id}-stock`)

    game.railwayCompanies.push(thisCompany)
  })

  game.defineActions({
    bid: player => action({
      prompt: "Gebot abgeben",
      description: "Das neue Gebot muss höher als das bisherige",
      condition: !player.passedThisAuction
    }).chooseNumber(
      "amount", {
        min: game.lastBid + 1,
        max: player.getBalance(),
      }
    ).do(
      ({ amount }) => { game.lastBid = amount, player.hasPlacedBid = true }
    ).message(
      `{{player}} bid {{amount}}`
    ),
    pass: player => action({
      prompt: "Pass",
      description: "Pass on this auction",
      condition: !player.passedThisAuction
    }).do(
      () => player.passedThisAuction = true
    ).message(
      `{{player}} passed`
    ),
    skip: () => action({
      prompt: 'Done'
    }).do(() => {
      game.selectedActionGauge = undefined;
      game.selectedField = undefined;
    }),
    selectAction: player => action({
      prompt: "Select an action gauge",
      description: "Select an action by clicking on a gauge"
    }).chooseOnBoard('actionChoice', () => game.getSelectableActions())
    .do(({actionChoice}) => {
      game.selectedActionGauge = actionChoice;
    }).message(
      `{{player}} selected {{actionChoice}}`
    ),
    selectCompany: player => action({
      prompt: "Select a railway company",
      description: "Select a railway company by clicking on its panel"
    }).chooseOnBoard('companyChoice', () => game.getSelectableCompanies())
    .do(({companyChoice}) => {
      game.selectedCompany = companyChoice;
    }).message(
      `{{player}} selected {{companyChoice}}`
    ),
    selectField: player => action({
      prompt: "Select a field",
      description: "Select a field by clicking on the map"
    }).chooseOnBoard('fieldChoice', () => game.getSelectableFields())
    .do(({fieldChoice}) => {
      game.selectedField = fieldChoice;
    }).message(
      `{{player}} selected {{fieldChoice}}`
    ),
    confirmDividend: player => action({
      prompt: "Confirm dividend payment"
    })
    .do (() => {
    }),
  });

  game.defineFlow(
    // Initial set up of start values (balances, etc)
    () => {
      // start balance is 120$ and is divided equally among all players
      game.players.forEach(player => { game.transferMoney(120 / game.players.length, bank, player.my(PlayerTableau)!) })
      // TODO! select the players who starts the game
      game.players[0].setCurrent();

      game.railwayCompanies.slice(1).forEach((company) => {
        const train = company.first('trains')!.first(`${company.name}-train`)! as Train;
        train.putInto(game.getStartField(company.name).first('trains-space')!);
      });
    },

    // Initial auction phase
    () => { game.firstPlayerOfAuction = game.players.current(); },
    () => { Do.subflow('initial-auction'); Do.subflow('initial-auction'); },
    () => { game.firstPlayerOfAuction!.setCurrent(); },

    // Main game loop
    whileLoop({
      while: () => true, do:
        eachPlayer({
          name: 'playerAtTurn',
          do: [
            () => { game.gameState = GameStates.SelectAction },
            playerActions({ actions: ["selectAction", "skip"] }),
            () => ( game.gameState = GameStates.None ),
            ifElse({
              name: 'checkIfActionSelected',
              if: ({}) => { return game.selectedActionGauge != undefined },
              do: [
                () => { game.selectedActionGauge!.makeAction(); },
                switchCase({
                  name: 'actionSwitch',
                  switch: () => game.selectedActionGauge!.name,
                  cases: [
                    {
                      eq: 'auction-gauge', do: [
                        () => { game.selectableCompanies = game.getSelectableCompaniesForAuction(); game.gameState = GameStates.SelectCompany },
                        playerActions({ actions: ["selectCompany"] }),
                        () => { game.firstPlayerOfAuction = game.players.current(); },
                        () => { game.selectableCompanies = [game.selectedCompany!]; },
                        () => { Do.subflow('action-auction', { company: game.selectedCompany }); },
                        () => { game.firstPlayerOfAuction!.setCurrent(); },
                        () => { game.gameState = GameStates.None }
                      ]
                    },
                    {
                      eq: 'development-gauge', do: [
                        () => {
                          // determine fields that can be developed still
                          game.selectableFields = game.getSelectableFieldsForDevelopment();
                          game.gameState = GameStates.SelectFields;
                        },
                        ifElse({
                          name: 'checkIfFieldsAreSelectable',
                          if: ({}) => { return game.selectableFields.length > 0 },
                          do: [
                            playerActions({ actions: ["selectField", "skip"] }),
                            ifElse({
                              name: 'checkIfFieldSelected',
                              if: ({ }) => { return game.selectedField != undefined },
                              do: [
                                () => {
                                  if (ChicagoExpressSetup.fieldIsCity(game.selectedField!.row, game.selectedField!.column) ||
                                      ChicagoExpressSetup.fieldIsMountain(game.selectedField!.row, game.selectedField!.column)) {
                                    const house = game.first(Space, 'house-pile')!.first('house')! as House;
                                    house.putInto(game.selectedField!);

                                    // incomes of all affected railway companies increases
                                    const train = game.selectedField!.all(Piece, (piece) => piece.name.endsWith('-train')).forEach((train) => {
                                      const company = game.first(RailwayCompany, train.name.split('-')[0]) as RailwayCompany;
                                      company.income += ChicagoExpressSetup.getCostAndIncomeConfiguration(game.selectedField!.row, game.selectedField!.column)[CostAndIncome.IncomeIfDeveloped];
                                    });
                                  } else
                                  if (ChicagoExpressSetup.fieldIsForest(game.selectedField!.row, game.selectedField!.column)) {
                                    const house = game.first(Space, 'house-pile')!.first('house')! as House;
                                    house.putInto(game.selectedField!.first('house-space')!);

                                    // balance of affected railway company increases by $2
                                    const train = game.selectedField!.first(Piece, (piece) => piece.name.endsWith('-train'))!;
                                    const company = game.first(RailwayCompany, train.name.split('-')[0]) as RailwayCompany;
                                    game.transferMoney(2, bank, company);
                                  } else
                                  if (ChicagoExpressSetup.fieldIsIndustry(game.selectedField!.row, game.selectedField!.column)) {
                                    const industrialCityIndex = ChicagoExpressSetup.industrialCities.findIndex((field) => field[0] == game.selectedField!.row && field[1] == game.selectedField!.column);
                                    const cells = game.first('industrial-city-track')?.all(Space, (space) =>space.name.startsWith(`${ChicagoExpressSetup.industrialCityNames[industrialCityIndex]}-`));

                                    for (const [index, cell] of cells!.entries()) {
                                      const house = cell.first('house') as House;
                                      if (house != undefined) {
                                        const targetCell = game.first(
                                          `${ChicagoExpressSetup.industrialCityNames[industrialCityIndex]}-${ChicagoExpressSetup.industrialCityTrackCells[industrialCityIndex][index + 1]}`
                                        );
                                        house.putInto(targetCell!);

                                        // income of all affected railway company increases
                                        const train = game.selectedField!.all(Piece, (piece) => piece.name.endsWith('-train')).forEach((train) => {
                                          const company = game.first(RailwayCompany, train.name.split('-')[0]) as RailwayCompany;
                                          company.income += ChicagoExpressSetup.industrialCityTrackCells[industrialCityIndex][index+1] - ChicagoExpressSetup.industrialCityTrackCells[industrialCityIndex][index];
                                        });
                                        break;
                                      }
                                    }
                                  }
                                }
                              ],
                              else: Do.break
                            })
                          ]
                        }),
                        () => { game.gameState = GameStates.None; }
                      ]
                    },
                    {
                      eq: 'route-construction-gauge', do: [
                        () => {
                          // determine those companies for which the current player own at least one stock
                          game.selectableCompanies = game.getSelectableCompaniesForConstruction(game.players.current()!);
                          game.gameState = GameStates.SelectCompany;
                        },
                        ifElse({
                          name: 'checkIfCompaniesAreSelectable',
                          if: ({}) => { return game.selectableCompanies.length > 0 },
                          do: [
                            playerActions({ actions: ["selectCompany"] }),
                            forLoop({
                              name: 'contruction-loop',
                              initial: 0,
                              next: x => x + 1,
                              while: x => x < 3,
                              do: [
                                () => { game.selectableFields = game.getSelectableFieldsForConstruction(game.selectedCompany!); game.gameState = GameStates.SelectFields; },
                                ifElse({
                                  name: 'checkIfFieldsAreSelectable',
                                  if: ({}) => { return game.selectableFields.length > 0 },
                                  do: [
                                    playerActions({ actions: ["selectField", "skip"] }),
                                    ifElse({
                                      name: 'checkIfFieldSelected',
                                      if: ({}) => { return game.selectedField != undefined },
                                      do: [
                                        () => {
                                          const train = game.selectedCompany!.first(Space, 'trains')!.first(Train);
                                          train!.putInto(game.selectedField!.first('trains-space')!);
                                          game.transferMoney(
                                            -game.selectedField!.all(Piece, (piece) => piece.name.endsWith('-train')).length * ChicagoExpressSetup.getCostAndIncomeConfiguration(game.selectedField!.row, game.selectedField!.column)[CostAndIncome.ConstructionCost],
                                            game.selectedCompany!,
                                            bank);
                                          game.selectedCompany!.income += ChicagoExpressSetup.getCostAndIncomeConfiguration(game.selectedField!.row, game.selectedField!.column)[CostAndIncome.Income];
                                          if (game.selectedField!.has(Piece, 'house'))
                                            game.selectedCompany!.income += ChicagoExpressSetup.getCostAndIncomeConfiguration(game.selectedField!.row, game.selectedField!.column)[CostAndIncome.IncomeIfDeveloped];
                                        }
                                      ],
                                      else: Do.break
                                    })
                                  ],
                                  else: Do.break
                                })
                              ]
                            }),
                            () => { game.gameState = GameStates.None; }
                          ]
                        })
                      ]
                    },
                  ],
                  default: () => { }
                }),
              ]
            }),
            ifElse({
              name: 'checkDividendPhase',
              if: ({}) => game.isDividendPhaseDue(),
              do: [
                ({}) => Do.subflow('dividend-phase'),
                () => {
                  // reset the gauges
                  game.getActionGauges().forEach(element => { element.resetAction() });

                  // move foward in detroit track
                  const cells = game.first('industrial-city-track')?.all(Space, (space) => space.name.startsWith(`${ChicagoExpressSetup.industrialCityNames[IndustrialCities.Detroit]}-`));
                  for (const [index, cell] of cells!.entries()) {
                    const house = cell.first('house') as House;
                    if (house != undefined) {
                      const targetCell = game.first(
                        `${ChicagoExpressSetup.industrialCityNames[IndustrialCities.Detroit]}-${ChicagoExpressSetup.industrialCityTrackCells[IndustrialCities.Detroit][index + 1]}`
                      );
                      house.putInto(targetCell!);

                      // income of all affected railway company increases
                      const detroitField = game.first(HexagonalField, `hex-${ChicagoExpressSetup.Detroit[0]}-${ChicagoExpressSetup.Detroit[1]}`)!;
                      const train = detroitField.all(Piece, (piece) => piece.name.endsWith('-train')).forEach((train) => {
                        const company = game.first(RailwayCompany, train.name.split('-')[0]) as RailwayCompany;
                        company.income += ChicagoExpressSetup.industrialCityTrackCells[IndustrialCities.Detroit][index + 1] - ChicagoExpressSetup.industrialCityTrackCells[IndustrialCities.Detroit][index];
                      });
                      break;
                    }
                  }
                }
              ]
            }),
            () => {
              if (game.gameEnds()) {
                const highestBalance = Math.max(
                  ...game.players.map(player => player.getBalance())
                );

                const winners = game.players.filter(
                  player => player.getBalance() === highestBalance
                );

                game.finish(...winners, "victory");
              }
            }
          ],
        })
    })
  );

  game.defineSubflow(
    'initial-auction',
    forEach({
      name: 'company',
      collection: () => game.railwayCompanies.slice(1),
      do: [
        // Preparation: initialize minimum start bid (one less as described in the rules as minimum bid is increased by 1 on each bid)
        ({ company }) => {
          game.lastBid = company.initialBid - 1;
          game.players.forEach(player => { player.passedThisAuction = false; player.hasPlacedBid = false; });
          game.selectableCompanies = [company];
          game.gameState = GameStates.SelectCompany;
        },
        // Execution: let each player bid or pass until only one player is left
        ({}) => { Do.subflow('auction')},
        // Collection: determine the winner and deduct the winning bid from their balance
        ({ company }) => {
          var price = 0;
          var succeedingBidder = game.firstPlayerOfAuction;
          var succeedingBidderIndex = game.players.findIndex(player => !player.passedThisAuction);
          if (succeedingBidderIndex !== -1) {
            price = game.lastBid;
            succeedingBidder = game.players[succeedingBidderIndex];
          } else {
            price = 0;
            succeedingBidder = game.firstPlayerOfAuction;
          }

          game.transferMoney(price, succeedingBidder!.my(PlayerTableau)!, company);
          game.transferStocks(1, company, succeedingBidder!.my(PlayerTableau)!);

          game.firstPlayerOfAuction = succeedingBidder;
          succeedingBidder!.setCurrent();
          game.gameState = GameStates.None;
        },
      ],
    }),
  );

  game.defineSubflow(
    'action-auction',
    ({ company }) => {
      game.lastBid = Math.ceil( company.getBalance() / company.countStocksOutstanding() ) - 1;
      game.players.forEach(player => { player.passedThisAuction = false; player.hasPlacedBid = false; });
    },
    // Execution: let each player bid or pass until only one player is left
    ({ }) => { Do.subflow('auction') },
    // Collection: determine the winner and deduct the winning bid from their balance
    ({ company }) => {
      var succeedingBidderIndex = game.players.findIndex(player => !player.passedThisAuction);
      if (succeedingBidderIndex !== -1) {
        var price = game.lastBid;
        var succeedingBidder = game.players[succeedingBidderIndex];

        game.transferMoney(price, succeedingBidder!.my(PlayerTableau)!, company);
        game.transferStocks(1, company, succeedingBidder!.my(PlayerTableau)!);
      }
    }
  )

  game.defineSubflow(
    'auction',
    whileLoop({
      while: () => game.players.filter(player => !player.passedThisAuction).length > 1, do:
        eachPlayer({
          name: 'biddingPlayer',
          startingPlayer: () => game.firstPlayerOfAuction!,
          do: ifElse({
            if: (args) => !args.biddingPlayer.passedThisAuction && (!args.biddingPlayer.hasPlacedBid || game.players.filter(player => !player.passedThisAuction).length > 1),
            do: playerActions({ actions: ["bid", "pass"] }),
          }),
        }),
    }),
  );

  game.defineSubflow(
    'dividend-phase',

    eachPlayer({
      name: 'receivingPlayer',
      do: [
        // Calculate this player's dividend for this company
        ({ receivingPlayer }) => {
          receivingPlayer.dividendAmount = 0;
          game.railwayCompanies.forEach((company) => {
            receivingPlayer.dividendAmount += receivingPlayer.my(PlayerTableau).all(Stock, `${company.name}-stock`).length * Math.ceil(company.income / company.countStocksOutstanding());
          })
        },
        // Pause the flow until this player confirms
        playerActions({
          player: ({ receivingPlayer }) => receivingPlayer,
          skipIf: 'never',
          actions: [
            {
              name: 'confirmDividend',
              prompt: ({ receivingPlayer, company }) =>
                `Confirm: $${receivingPlayer.dividendAmount} dividend is paid to you.`,
              do: ({ receivingPlayer }) => {
                game.transferMoney(receivingPlayer.dividendAmount, bank, receivingPlayer.my(PlayerTableau)
                );
              },
            },
          ],
        }),
      ],
    }),
  );
});
