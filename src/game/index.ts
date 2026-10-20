import {
  createGame,
  Player,
  Space,
  Piece,
  Game,
  ConnectedSpaceMap,
} from '@boardzilla/core';

export class ChicagoExpressPlayer extends Player<ChicagoExpressGame, ChicagoExpressPlayer> {
  balance: number = 0;
  passedThisAuction: boolean = false;
}

export class ChicagoExpressGame extends Game<ChicagoExpressGame, ChicagoExpressPlayer> {
  lastBid: number = 0
}

class RailwayCompany {
  name: string = "";
  abbreviation: string = "";
  trains: number = 0;
  balance: number = 0;
  stocks: number = 0;

  constructor(name: string, abbreviation: string, trains: number, balance: number, stocks: number) {
    this.name = name;
    this.abbreviation = abbreviation;
    this.trains = trains;
    this.balance = balance;
    this.stocks = stocks;
  }
}

export class RailwayCompanySpace extends Space<ChicagoExpressGame> {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'black';
  company: RailwayCompany;
}

/**
 * Following section defines the different types of pieces in Chicago Express.
 * These are stocks, trains and houses.
 */
export class Stock extends Piece<ChicagoExpressGame> {
}

export class Train extends Piece<ChicagoExpressGame> {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'black';
}

export class CounterPiece extends Piece<ChicagoExpressGame> {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'black';
}

/**
 * Main game definitions.
 */
export default createGame(ChicagoExpressPlayer, ChicagoExpressGame, game => {

  const { action } = game;
  const { playerActions, loop, whileLoop, eachPlayer, ifElse } = game.flowCommands;

  const wabashCompany = new RailwayCompany('Wabash Railroad Company', 'Wabash', 11, 2, 0);
  const railwayCompanies: RailwayCompany[] = [
    new RailwayCompany('The Pennsylvania Railroad Company', 'PRR', 20, 3, 0),
    new RailwayCompany('Baltimore & Ohio', 'BandO', 22, 4, 0),
    new RailwayCompany('New York Central', 'NYC', 24, 5, 0),
    new RailwayCompany('Chesapeake & Ohio', 'CandO', 26, 6, 0),
  ]

  game.create(RailwayCompanySpace, wabashCompany.abbreviation, { company: wabashCompany });
  railwayCompanies.forEach((railwayCompany: RailwayCompany) => {
    game.create(RailwayCompanySpace, railwayCompany.abbreviation, { company: railwayCompany });
  })

  // const map = game.create(ConnectedSpaceMap, 'scenery-map');
  // const space1 = map.create(Space, 'space1');
  // const space2 = map.create(Space, 'space2');
  // map.connect(space1, space2, 1);

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
      ({ amount }) => game.lastBid = amount
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
  });

  game.defineFlow(
    // Initial set up of start values (balances, etc)
    () => { 
      // start balance is 120$ and is divided equally among all players
      game.players.forEach(player => { player.balance = 120 / game.players.length; })
      // TODO! select the players who starts the game
    },
    // Initial auction phase
    // Preparation: initialize minimum start bid (one less as described in the rules as minimum bid is increased by 1 on each bid)
    () => { (game as ChicagoExpressGame).lastBid = 6 },
    // Execution: let each player bid or pass until only one player is left
    whileLoop({ while: () => game.players.filter(player => !player.passedThisAuction).length > 1, do: 
      eachPlayer({
        name: 'biddingPlayer',
        do: ifElse ({
          if: (args) => !args.biddingPlayer.passedThisAuction && game.players.filter(player => !player.passedThisAuction).length > 1,
          do: playerActions({ actions: ["bid", "pass"] }),
        }),
      }),
    }),
    // Collection: determine the winner and deduct the winning bid from their balance
    () => {
      const succeedingBidder = game.players.findIndex(player => !player.passedThisAuction);
      if (succeedingBidder !== -1) {
        const winningPlayer = game.players[succeedingBidder];
        winningPlayer.balance -= game.lastBid;
        game.message(`{{winningPlayer}} won the auction with a bid of {{lastBid}}`, { winningPlayer, lastBid: game.lastBid });
      } else {
        game.message("No player won the auction");
      }
    }
  );
});
