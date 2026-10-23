import React from 'react';
import {
  render,
} from '@boardzilla/core';
import {
  default as setup,
  Board,
  Train,
  Stock,
  House,
  PlayerTableau,
  RailwayCompany,
  ChicagoExpressPlayer,
  ChicagoExpressGame,
  AuctionGauge,
  DevelopmentGauge,
  RouteConstructionGauge
} from '../game/index.js';

import { ChicagoExpressSetup, RailwayCompanies } from '../game/game-setup.js';

import './style.scss';

import stockImage_PRR from './assets/PRR-stock.jpg';
import stockImage_BandO from './assets/BandO-stock.jpg';
import stockImage_NYC from './assets/NYC-stock.jpg';
import stockImage_CandO from './assets/CandO-stock.jpg';
import stockImage_Wabash from './assets/Wabash-stock.jpg';
import trainImage_PRR from './pieces/PRR-train.svg'
import trainImage_BandO from './pieces/BandO-train.svg'
import trainImage_NYC from './pieces/NYC-train.svg'
import trainImage_CandO from './pieces/CandO-train.svg'
import trainImage_Wabash from './pieces/Wabash-train.svg'
import image_House from './pieces/house.svg'

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

    game.all(Board).layout('house-pile', { area: { left: 21.5, top: 68.2, width: 18.7, height: 11.17 }});
    game.all('house-pile').layout(House, { offsetRow: {x: -50, y: 100}, offsetColumn: 100, haphazardly: 2, });

    const industrialCityTrackCellWidth = 11;
    const industrialCityTrackCellHeight = 32  ;
    const industrialCityTrackCellFrameWidth = 1.8;
    const industrialCityTrackCellFrameHeight = 2.2;
    game.layout(Board, { area: { left: 20, top: 0, width: 58, height: 100, }, });
    game.all(Board).layout("industrial-city-track", { area: { left: 31.6, top: 80.5, width: 23.24, height: 11.95, } });
    for(let i = 0; i < 8; ++i) {
      game.all("industrial-city-track").layout(`detroit-${i}`, { area: { left: i*industrialCityTrackCellWidth + i*industrialCityTrackCellFrameWidth, top: 0, width: industrialCityTrackCellWidth, height: industrialCityTrackCellHeight } });
    }
    for(let i = 0; i < 4; ++i) {
      let j = i + 2;
      game.all("industrial-city-track").layout(`wheeling-${i}`, { area: { left: j * industrialCityTrackCellWidth + j * industrialCityTrackCellFrameWidth, top: industrialCityTrackCellFrameHeight + industrialCityTrackCellHeight, width: industrialCityTrackCellWidth, height: industrialCityTrackCellHeight } });
    }
    for(let i = 0; i < 3; i=i+2) {
      let j = 3 + 2 * i;
      game.all("industrial-city-track").layout(`pittsburgh-${i}`, { area: { left: j * industrialCityTrackCellWidth + j * industrialCityTrackCellFrameWidth, top: 2 * (industrialCityTrackCellFrameHeight + industrialCityTrackCellHeight), width: industrialCityTrackCellWidth, height: industrialCityTrackCellHeight } });
    }

    game.all(Board).layout(AuctionGauge, { area: { left: 4.2, top: 52.6, width: 12.04, height: 12.04, } })
    game.all(Board).layout(DevelopmentGauge, { area: { left: 4.2, top: 67.9, width: 12.04, height: 12.04, } })
    game.all(Board).layout(RouteConstructionGauge, { area: { left: 4.2, top: 83.1, width: 12.04, height: 12.04, } })

    const wabashId = ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].id;
    game.all(Board).layout(wabashId, { area: { left: 62.1, top: 71.4, width: 29.76, height: 19.97, } });
    game.all(wabashId).layout("trains", { area: { left:0, top: 0, width: 45, height: 100 }});
    game.all(wabashId).layout("stocks", { area: { left:45, top: 50, width: 55, height: 50 }});

    game.all('Wabash-train').appearance({ aspectRatio: 1, render: () => ( <img src={trainImage_Wabash}/> ) });
    game.all('PRR-train').appearance({ aspectRatio: 1, render: () => ( <img src={trainImage_PRR}/> ) });
    game.all('BandO-train').appearance({ aspectRatio: 1, render: () => ( <img src={trainImage_BandO}/> ) });
    game.all('NYC-train').appearance({ aspectRatio: 1, render: () => ( <img src={trainImage_NYC}/> ) });
    game.all('CandO-train').appearance({ aspectRatio: 1, render: () => ( <img src={trainImage_CandO}/> ) });
    game.all('Wabash-stock').appearance({ aspectRatio: 1, render: () => ( <img src={stockImage_Wabash}/> ) });
    game.all('PRR-stock').appearance({ aspectRatio: 1, render: () => ( <img src={stockImage_PRR}/> ) });
    game.all('BandO-stock').appearance({ aspectRatio: 1, render: () => ( <img src={stockImage_BandO}/> ) });
    game.all('NYC-stock').appearance({ aspectRatio: 1, render: () => ( <img src={stockImage_NYC}/> ) });
    game.all('CandO-stock').appearance({ aspectRatio: 1, render: () => ( <img src={stockImage_CandO}/> ) });
    game.all('house').appearance({ aspectRatio: 1, render: () => ( <img src={image_House}/> ) });

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
