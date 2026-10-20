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
  hasPlacedBid: boolean = false;
}

export class ChicagoExpressGame extends Game<ChicagoExpressGame, ChicagoExpressPlayer> {
  lastBid: number = 0
}

class RailwayCompany extends Space<ChicagoExpressGame> {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'black';
  companyName: string = "";
  abbreviation: string = "";
  trains: number = 0;
  balance: number = 0;
  stocks: number = 0;
  initialBid: number = 0;

  initialize(companyName: string, abbreviation: string, trains: number, balance: number, stocks: number, initialBid: number = 0) {
    this.companyName = companyName;
    this.abbreviation = abbreviation;
    this.trains = trains;
    this.balance = balance;
    this.stocks = stocks;
    this.initialBid = initialBid;
  }
}

export class Scenery extends Space<ChicagoExpressGame> { }
export class PlayerTableau extends Space<ChicagoExpressGame, ChicagoExpressPlayer> { }

/**
 * Main game definitions.
 */
export default createGame(ChicagoExpressPlayer, ChicagoExpressGame, game => {

  const { action } = game;
  const { playerActions, loop, whileLoop, eachPlayer, forEach, ifElse } = game.flowCommands;

  game.create(Scenery, 'scenery');

  // create tableau spaces for each player
  for (const player of game.players) {
    game.create(PlayerTableau, `player-tableau-${player.position}`, { player });
  }

  // create spaces for Wabash and the other railway companies
  const wabashCompany : RailwayCompany = game.create(RailwayCompany, 'Wabash',{companyName: "Wabash Railroad Company", abbreviation: 'Wabash', trains: 11, balance: 2, stocks: 0, initialBid: 0}) as RailwayCompany;
  const railwayCompanies: RailwayCompany[] = [
    game.create(RailwayCompany, 'PRR', {companyName: 'The Pennsylvania Railroad Company', abbreviation: 'PRR', trains: 20, balance: 3, stocks: 0, initialBid: 6}) as RailwayCompany,
    game.create(RailwayCompany, 'BandO', {companyName: 'Baltimore & Ohio', abbreviation: 'BandO', trains: 22, balance: 4, stocks: 0, initialBid: 5}) as RailwayCompany,
    game.create(RailwayCompany, 'NYC', {companyName: 'New York Central', abbreviation: 'NYC', trains: 24, balance: 5, stocks: 0, initialBid: 4}) as RailwayCompany,
    game.create(RailwayCompany, 'CandO', {companyName: 'Chesapeake & Ohio', abbreviation: 'CandO', trains: 26, balance: 6, stocks: 0, initialBid: 7}) as RailwayCompany,
  ]

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
  });

  game.defineFlow(
    // Initial set up of start values (balances, etc)
    () => {
      // start balance is 120$ and is divided equally among all players
      game.players.forEach(player => { player.balance = 120 / game.players.length; })
      // TODO! select the players who starts the game
    },

    // Initial auction phase
    forEach({
      name: 'company',
      collection: () => railwayCompanies,
      do: [
        // Preparation: initialize minimum start bid (one less as described in the rules as minimum bid is increased by 1 on each bid)
        ({ company }) => {
          game.message(company.name + " is up for auction. Starting bid is " + company.initialBid);
          (game as ChicagoExpressGame).lastBid = company.initialBid;
          game.players.forEach(player => { player.passedThisAuction = false; player.hasPlacedBid = false; });
        },
        // Execution: let each player bid or pass until only one player is left
        whileLoop({
          while: () => game.players.filter(player => !player.passedThisAuction).length > 1, do:
            eachPlayer({
              name: 'biddingPlayer',
              do: ifElse({
                if: (args) => !args.biddingPlayer.passedThisAuction && ( !args.biddingPlayer.hasPlacedBid || game.players.filter(player => !player.passedThisAuction).length > 1 ),
                do: playerActions({ actions: ["bid", "pass"] }),
              }),
            }),
        }),
        // Collection: determine the winner and deduct the winning bid from their balance
        ({ company }) => {
          const succeedingBidder = game.players.findIndex(player => !player.passedThisAuction);
          if (succeedingBidder !== -1) {
            const winningPlayer = game.players[succeedingBidder];
            winningPlayer.balance -= game.lastBid;
            game.message(`{{winningPlayer}} won the auction with a bid of {{lastBid}}`, { winningPlayer, lastBid: game.lastBid });
          } else {
            game.message("No player won the auction");
          }
        },
      ],
    }),


    // Initial auction phase
    // Preparation: initialize minimum start bid (one less as described in the rules as minimum bid is increased by 1 on each bid)
    // () => { (game as ChicagoExpressGame).lastBid = 6 },
    // // Execution: let each player bid or pass until only one player is left
    // whileLoop({ while: () => game.players.filter(player => !player.passedThisAuction).length > 1, do:
    //   eachPlayer({
    //     name: 'biddingPlayer',
    //     do: ifElse ({
    //       if: (args) => !args.biddingPlayer.passedThisAuction || !args.biddingPlayer.hasPlacedBid,
    //       do: playerActions({ actions: ["bid", "pass"] }),
    //     }),
    //   }),
    // }),
    // // Collection: determine the winner and deduct the winning bid from their balance
    // () => {
    //   const succeedingBidder = game.players.findIndex(player => !player.passedThisAuction);
    //   if (succeedingBidder !== -1) {
    //     const winningPlayer = game.players[succeedingBidder];
    //     winningPlayer.balance -= game.lastBid;
    //     game.message(`{{winningPlayer}} won the auction with a bid of {{lastBid}}`, { winningPlayer, lastBid: game.lastBid });
    //   } else {
    //     game.message("No player won the auction");
    //   }
    // }
  );
});
