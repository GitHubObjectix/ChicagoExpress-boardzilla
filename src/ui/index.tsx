import React from 'react';
import {
  render,
} from '@boardzilla/core';
import {
  default as setup,
  Scenery,
  Train,
  Stock,
  PlayerTableau,
  RailwayCompany,
  ChicagoExpressPlayer,
  ChicagoExpressGame
} from '../game/index.js';

import { ChicagoExpressSetup } from '../game/game-setup.js';

import './style.scss';

import boardImage from './assets/chicago-express-board.jpg';
import stockImage_PRR from './assets/PRR-stock.jpg';
import stockImage_BandO from './assets/BandO-stock.jpg';
import stockImage_NYC from './assets/NYC-stock.jpg';
import stockImage_CandO from './assets/CandO-stock.jpg';
import trainImage_PRR from './pieces/PRR-train.svg'
import trainImage_BandO from './pieces/BandO-train.svg'
import trainImage_NYC from './pieces/NYC-train.svg'
import trainImage_CandO from './pieces/CandO-train.svg'

render(setup, {
  boardSizes: [
    {
      name: 'desktop',
      desktop: true,
      aspectRatio: 16 / 9,
      scaling: 'fit',
    },
  ],
  settings: {
  },
  layout: (game, player, boardSize) => {
    game.disableDefaultAppearance();
    //game.showLayoutBoundingBoxes();

    game.all(Scenery).appearance({
      render: () => (
        <img
          className="board-scenery-image"
          src={boardImage}
          alt="Chicago Express game board"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      ),
    });

    game.layout('scenery', {
      area: {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      },
    });

    game.all('PRR-train').appearance({ aspectRatio: 1, render: () => ( <img src={trainImage_PRR}/> ) });
    game.all('BandO-train').appearance({ aspectRatio: 1, render: () => ( <img src={trainImage_BandO}/> ) });
    game.all('NYC-train').appearance({ aspectRatio: 1, render: () => ( <img src={trainImage_NYC}/> ) });
    game.all('CandO-train').appearance({ aspectRatio: 1, render: () => ( <img src={trainImage_CandO}/> ) });
    game.all('PRR-stock').appearance({ aspectRatio: 1, render: () => ( <img src={stockImage_PRR}/> ) });
    game.all('BandO-stock').appearance({ aspectRatio: 1, render: () => ( <img src={stockImage_BandO}/> ) });
    game.all('NYC-stock').appearance({ aspectRatio: 1, render: () => ( <img src={stockImage_NYC}/> ) });
    game.all('CandO-stock').appearance({ aspectRatio: 1, render: () => ( <img src={stockImage_CandO}/> ) });

    game.all(PlayerTableau).appearance({
      render: (tableau) => {
        const player = tableau.player as ChicagoExpressPlayer;

        return (
          <div className="player-panel">
            <div className="player-panel__header">
              <div className="player-panel__name">
                {player.name}
              </div>
              <div className="player-panel__cash">
                ${player.balance}
              </div>
            </div>
          </div>
        );
      },
    });

    const players = [...game.players];
    const playerCount = players.length;

    const panelWidth = 15;
    const panelGap = 2;
    const panelHeight =
      (70 - panelGap * (playerCount - 1)) / playerCount;

    players.forEach((p, index) => {
      const tableau = p.my('player-tableau') as PlayerTableau;
      game.layout(tableau, {
        area: {
          left: 0,
          top: index * (panelHeight + panelGap),
          width: panelWidth,
          height: panelHeight,
        },
      });
      game.all(tableau).layout("stocks", {area: { left: 1, top: 30, width: 98, height: 65 }});
    });

    // position the railway company charters
    const charterHeight = 20;
    const charterGap = 10;
    ChicagoExpressSetup.railwayCompanies.slice(1).forEach((company, index) => {
      game.layout(company.id, { area: { left: 80, top: 10 + (index * charterHeight), width: 25, height: charterHeight }});
      game.all(company.id).layout("trains", { area: { left:0, top: 0, width: 45, height: 100 }});
      game.all(company.id).layout("stocks", { area: { left:45, top: 50, width: 55, height: 50 }});
    });

    // define the layout of the trains and stocks pile on each railway company charter
    game.all("trains").layout(Train, { offsetRow: {x: -50, y: 100}, offsetColumn: 100, haphazardly: 2, });
    game.all("stocks").layout(Stock, { rows: {max: 1}, offsetColumn: {x: 15, y: 15}, direction: 'ltr', });
  }
});
