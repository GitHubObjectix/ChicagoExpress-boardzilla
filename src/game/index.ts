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
  RailwayCompanies
} from './game-setup.js'

export class ChicagoExpressPlayer extends Player<ChicagoExpressGame, ChicagoExpressPlayer> {
  balance: number = 0;
  passedThisAuction: boolean = false;
  hasPlacedBid: boolean = false;
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
  selectableFields: [number, number][] = [];

  selectedActionGauge?: Gauge = undefined;
  selectedCompany?: RailwayCompany = undefined;

  isFieldSelectable(hexField: HexagonalField) : boolean {
    return this.selectableFields.find((element) => hexField.row == element[0] && hexField.column == element[1]) != undefined;
  }

  getActionGauges() : Gauge[] {
    var gauges = [this.first('auction-gauge') as Gauge, this.first('development-gauge') as Gauge, this.first('route-construction-gauge') as Gauge];
    return gauges;
  }

  getSelectableActions() : Gauge[] {
    return this.getActionGauges().filter((gauge) => gauge.isActionPossible());
  }

  getSelectableCompanies() : RailwayCompany[] {
    return this.railwayCompanies.filter((company) => company.isSelectable());
  }

  gameEnds(): boolean {
    return false;
  }

  isDividendPhaseDue() : boolean {
    return this.getActionGauges().filter((gauge) => gauge.isActionPossible()).length <= 1;
  }
}

export class RailwayCompany extends Space<ChicagoExpressGame> {
  initialBid: number = 0;

  balance: number = 0;

  public hasStocks(): boolean {
    return this.has(`${this.name}-stock`);
  }

  public isSelectable(): boolean {
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

export class Train extends Piece<ChicagoExpressGame> {}
export class Stock extends Piece<ChicagoExpressGame> {}
export class House extends Piece<ChicagoExpressGame> {}

/**
 * Main game definitions.
 */
export default createGame(ChicagoExpressPlayer, ChicagoExpressGame, game => {

  const { action } = game;
  const { playerActions, loop, whileLoop, eachPlayer, forEach, ifElse, switchCase } = game.flowCommands;

  const board = game.create(Board, 'board');

  const map = board.create(ConnectedSpaceMap, 'map');
  ChicagoExpressSetup.columnConfiguration.forEach((column, columnIndex) => {
    for(let row = column[0]; row <= column[1]; ++row)
    {
      const hexField = map.create(HexagonalField, `hex-${row}-${columnIndex}`, { row: row, column: columnIndex });

      const trains = hexField.create(Space, 'trains-space')
      // trains.createMany(1, Train, 'PRR-train');
      // trains.createMany(1, Train, 'CandO-train');
      // trains.createMany(1, Train, 'BandO-train');

      if (ChicagoExpressSetup.fieldCanBeDeveloped(row, columnIndex)) {
        const house = hexField.create(Space, 'house-space');
        // house.createMany(1, House, 'house');
      }
    }
  })

  const housePile = board.create(Space, "house-pile");
  housePile.createMany(ChicagoExpressSetup.houses, House, 'house');

  const industrialTrack = board.create(Space, "industrial-city-track");
  for(let i = 0; i < 8; i++) { var cell = industrialTrack.create(Space, `detroit-${i}`);};
  for(let i = 0; i < 4; i++) { industrialTrack.create(Space, `wheeling-${i}`)};
  for(let i = 0; i < 3; i++) { industrialTrack.create(Space, `pittsburgh-${i}`)};
  industrialTrack.first(Space, 'detroit-0')!.createMany(1, House, 'house');
  industrialTrack.first(Space, 'wheeling-0')!.createMany(1, House, 'house');
  industrialTrack.first(Space, 'pittsburgh-0')!.createMany(1, House, 'house');

  const auctionGauge = board.create(AuctionGauge, "auction-gauge");
  board.create(DevelopmentGauge, "development-gauge");
  board.create(RouteConstructionGauge, "route-construction-gauge");

  // create tableau spaces for each player
  for (const player of game.players) {
    var playerTableau = game.create(PlayerTableau, `player-tableau`, { player });
    var stocks = playerTableau.create(Space, 'stocks');
  }

  // create space for Wabash railway company
  const wabashId = ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].id
  const wabash = board.create(RailwayCompany, wabashId, {initialBid: 0});
  var trains = wabash.create(Space, 'trains');
  trains.createMany(ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].trains, Train, `${wabashId}-train`);
  var stocks = wabash.create(Space, 'stocks');
  stocks.createMany(ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].stocks, Stock, `${wabashId}-stock`);

  // create spaces for the other railway companies
  ChicagoExpressSetup.railwayCompanies.slice(1).forEach((company, index) => {
    var thisCompany = game.create(RailwayCompany, company.id,
      {initialBid: company.initialBid});

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
        max: player.balance,
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
    )
  });

  game.defineFlow(
    // Initial set up of start values (balances, etc)
    () => {
      // start balance is 120$ and is divided equally among all players
      game.players.forEach(player => { player.balance = 120 / game.players.length; })
      // TODO! select the players who starts the game
      game.firstPlayerOfAuction = game.players[0];
    },

    // Initial auction phase
    ({}) => { Do.subflow('initial-auction')},

    // Main game loop
    whileLoop({
      while: () => !game.gameEnds(), do:
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
                        () => { game.gameState = GameStates.SelectCompany },
                        playerActions({ actions: ["selectCompany"] }),
                        () => { game.gameState = GameStates.None },
                        () => { game.firstPlayerOfAuction = game.players.current(); Do.subflow('action-auction', { company: game.selectedCompany }) },
                      ]
                    },
                    { eq: 'development-gauge', do: () => { game.message("development selected") } },
                    { eq: 'route-construction-gauge', do: () => { game.message("route construction selected") } },
                  ],
                  default: () => { }
                }),
              ]
            }),
            ifElse({
              name: 'checkDividendPhase',
              if: ({}) => game.isDividendPhaseDue(),
              do: [
                () => { },
                ({}) => Do.subflow('dividend-phase'),
                () => { game.getActionGauges().forEach(element => { element.resetAction() }); }
              ]
            })
          ],
        })
    })
  );

  game.defineSubflow(
    'initial-auction',
    forEach({
      name: 'company',
      collection: () => game.railwayCompanies.slice(0),
      do: [
        // Preparation: initialize minimum start bid (one less as described in the rules as minimum bid is increased by 1 on each bid)
        ({ company }) => {
          game.message(company.name + " is up for auction. Starting bid is " + company.initialBid + " starting player is " + game.firstPlayerOfAuction);
          game.lastBid = company.initialBid - 1;
          game.players.forEach(player => { player.passedThisAuction = false; player.hasPlacedBid = false; });
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

          game.message(`succeeding bidder is ${succeedingBidder} with a bid of ${price}`);
          succeedingBidder!.balance -= price;
          company.balance += price;
          const stock = company.first(Space, 'stocks').first(Stock);
          const tableau = succeedingBidder!.my('player-tableau');
          stock!.putInto(tableau!.first(Space, "stocks"));

          game.firstPlayerOfAuction = succeedingBidder;
        },
      ],
    }),
  );

  game.defineSubflow(
    'action-auction',
    ({ company }) => {
      game.lastBid = Math.ceil( company.balance / company.countStocksOutstanding() ) - 1;
      game.message(company.name + " is up for auction. Starting bid is " + (game.lastBid+1) + " starting player is " + game.firstPlayerOfAuction);
      game.message(`${company.countStocksOutstanding()} stocks are outstanding`)
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

        game.message(`succeeding bidder is ${succeedingBidder} with a bid of ${price}`);

        succeedingBidder!.balance -= price;
        company.balance += price;
        const stock = company.first(Space, 'stocks').first(Stock);
        const tableau = succeedingBidder!.my('player-tableau');
        stock!.putInto(tableau!.first(Space, "stocks"));
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

    () => { game.message("Dividend phase"); }
  );
});
