import React from 'react';
import {
  render,
  ProfileBadge,
} from '@boardzilla/core';
import {
  default as setup,
  Scenery,
  PlayerTableau,
  ChicagoExpressPlayer,
} from '../game/index.js';

import './style.scss';

import boardImage from './assets/chicago-express-board.jpg';

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
    game.showLayoutBoundingBoxes();

    game.all(Scenery).appearance({
      render: () => (
        <img
          className="board-scenery-image"
          src={boardImage}
          alt="Chicago Express game board"
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
      game.layout(`player-tableau-${p.position}`, {
        area: {
          left: 0,
          top: index * (panelHeight + panelGap),
          width: panelWidth,
          height: panelHeight,
        },
      });
    });
  }
});
