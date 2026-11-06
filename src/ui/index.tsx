import React from 'react';
import {
  render,
  Space
} from '@boardzilla/core';
import {
  default as setup,
  Board,
  Train,
  Stock,
  House,
  Banknote,
  Counter,
  PlayerTableau,
  RailwayCompany,
  ChicagoExpressPlayer,
  ChicagoExpressGame,
  Gauge,
  AuctionGauge,
  DevelopmentGauge,
  RouteConstructionGauge,
  HexagonalField,
  Bank,
  GameStates
} from '../game/index.js';

import { ChicagoExpressSetup, CostAndIncome, RailwayCompanies } from '../game/game-setup.js';

import './style.scss';

import stockImage_PRR from './assets/PRR-stock.jpg';
import stockImage_BandO from './assets/BandO-stock.jpg';
import stockImage_NYC from './assets/NYC-stock.jpg';
import stockImage_CandO from './assets/CandO-stock.jpg';
import stockImage_Wabash from './assets/Wabash-stock.jpg';
import gaugePointer from './assets/gauge-pointer.svg';
import trainImage_PRR from './pieces/PRR-train.svg'
import counterImage_PRR from './pieces/PRR-counter.svg'
import logo_PRR from './assets/PRR-logo.jpg'
import trainImage_BandO from './pieces/BandO-train.svg'
import counterImage_BandO from './pieces/BandO-counter.svg'
import logo_BandO from './assets/BandO-logo.jpg'
import trainImage_NYC from './pieces/NYC-train.svg'
import counterImage_NYC from './pieces/NYC-counter.svg'
import logo_NYC from './assets/NYC-logo.jpg'
import trainImage_CandO from './pieces/CandO-train.svg'
import counterImage_CandO from './pieces/CandO-counter.svg'
import logo_CandO from './assets/CandO-logo.jpg'
import trainImage_Wabash from './pieces/Wabash-train.svg'
import counterImage_Wabash from './pieces/Wabash-counter.svg'
import logo_Wabash from './assets/Wabash-logo.jpg'
import image_House from './pieces/house.svg'
import image_Train from './pieces/train.svg'
import image_Development from './assets/development.jpg'
import image_Banknote from './pieces/dollar-note.jpg'

const companyImages: Record<string, {
  train: string;
  counter: string;
  logo: string;
  stock: string;
}> = {
  Wabash: { train: trainImage_Wabash, counter: counterImage_Wabash, logo: logo_Wabash, stock: stockImage_Wabash },
  PRR: { train: trainImage_PRR, counter: counterImage_PRR, logo: logo_PRR, stock: stockImage_PRR },
  BandO: { train: trainImage_BandO, counter: counterImage_BandO, logo: logo_BandO, stock: stockImage_BandO },
  NYC: { train: trainImage_NYC, counter: counterImage_NYC, logo: logo_NYC, stock: stockImage_NYC },
  CandO: { train: trainImage_CandO, counter: counterImage_CandO, logo: logo_CandO, stock: stockImage_CandO },
};

const FIELD_INFO_EVENT = 'chicago-express:field-info';

function HexFieldInfoPanel() {
  const [field, setField] = React.useState<HexagonalField | null>(null);

  React.useEffect(() => {
    const handleFieldInfo = (event: Event) => {
      setField((event as CustomEvent<HexagonalField | null>).detail);
    };

    window.addEventListener(FIELD_INFO_EVENT, handleFieldInfo);
    return () => window.removeEventListener(FIELD_INFO_EVENT, handleFieldInfo);
  }, []);

  if (!field) return null;

  let terrainColor = "#e5c84b";
  if (ChicagoExpressSetup.fieldIsForest(field.row, field.column)) {
    terrainColor = "#527a42";
  } else if (ChicagoExpressSetup.fieldIsMountain(field.row, field.column)) {
    terrainColor = "#8b5e3c";
  } else if (ChicagoExpressSetup.fieldIsCity(field.row, field.column)) {
    terrainColor = "#c98c55";
  } else if (ChicagoExpressSetup.fieldIsStartField(field.row, field.column)) {
    terrainColor = "#a9a9a9";
  } else if (ChicagoExpressSetup.fieldIsIndustry(field.row, field.column)) {
    terrainColor = "#a9a9a9";
  }

  var costAndIncomeConfiguration = ChicagoExpressSetup.getCostAndIncomeConfiguration(field.row, field.column);
  var fieldContainsTrain = !ChicagoExpressSetup.fieldIsStartField(field.row, field.column);

  return (
    <div className="hex-field-info">
      <svg
        className="hex-field-info__schematic"
        viewBox="0 0 100 86"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      >
        <polygon
          points="25,1.5 74.5,1.5 98.5,43 74.5,84.5 25,84.5 1.5,43"
          fill={terrainColor}
          stroke="#28251f"
          strokeWidth="2"
        />
        {fieldContainsTrain && (
          <>
            <image
              href={image_Train}
              x="8"
              y="25"
              width="50"
              height="30"
              preserveAspectRatio="xMidYMid meet"/>
            <text
              className="hex-field-info__cost-value"
              x="25"
              y="48"
              textAnchor="middle">{costAndIncomeConfiguration[0]}</text>
            {costAndIncomeConfiguration[1] != 0 && (
              <text
                className="hex-field-info__income-values"
                x="45"
                y="48"
                textAnchor="middle">{costAndIncomeConfiguration[1]}</text>
            )}
          </>
        )}
        {ChicagoExpressSetup.fieldCanContainHouse(field.row, field.column) && (
          <>
            <image
              href={image_House}
              x="60"
              y="13"
              width="30"
              height="50"
              preserveAspectRatio="xMidYMid meet"/>
            <text
              className="hex-field-info__income-values"
              x="75"
              y="48"
              textAnchor="middle">{costAndIncomeConfiguration[2] != 0 ? costAndIncomeConfiguration[2] : "$"}</text>
          </>
        )}
        {ChicagoExpressSetup.fieldIsIndustry(field.row, field.column) && (
          <>
            <image
              href={image_Development}
              x="60"
              y="24"
              width="30"
              height="32"
              preserveAspectRatio="xMidYMid meet"/>
          </>
        )}
      </svg>
    </div>
  );
}

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
  announcements: {
    dividend: game => (
      <table className="dividend-table">
        <thead>
          <tr>
            <th>Railway Company</th>
            {game.players.map(p => (
              <th key={p.id}>{p.name}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {game.railwayCompanies.map(c => (
            <tr key={c.name}>
              <th>{c.name}</th>

              {game.players.map(p => (
                <td key={p.id}>
                  ${game.dividends[c.name]?.[p.id] ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
   ),
    victory: game => (
      <div>
        <h1>
          {game.getWinners()!.length > 1 ? "It's a tie!" : "Victory!"}
        </h1>

        <p>
          {game.getWinners()!.map(player => player.name).join(", ")}
          {game.getWinners()!.length > 1 ? " are the winners!" : " wins!"}
        </p>

        <p>
          Winning balance:{" "}
          {(game.getWinners()![0] as ChicagoExpressPlayer).getBalance()}
        </p>
      </div>
    )
  },
  layout: (game, player, boardSize) => {
    game.disableDefaultAppearance();
    // game.showLayoutBoundingBoxes();

    const board = game.first(Board, 'board')!;

    const fieldInfoPanel = board.first('field-info')!;
    board.layout('field-info', {
      area: { left: 44, top: 68.2, width: 11.17, height: 11.17 },
    });
    fieldInfoPanel.appearance({
      render: () => <HexFieldInfoPanel />,
    });

    const bank = game.first(Bank, 'bank')!;
    const bankAccount = bank.first('account')!;
    game.layout(bank.name, { area: { left: 81, top: 0, width: 19, height: 20 } });
    bank.layout('account', { area: { left: 5, top: 30, width: 90, height: 60 } });
    bank.appearance({
      render: (bank) => {
        return(
          <div className="bank-panel">
            <div className="bank-panel__header">
              <div className="player-bank__name">
                Bank
              </div>
            </div>
          </div>
        );
      }
    });
    bankAccount.appearance({
      render: (account) => {
        return (
          <div className="bank-account">
            ${bankAccount.all('banknote').length}
          </div>
        );
      }
    });
    bank.layout(Banknote, { rows: { min: 1, max: 2 }, columns: 1, });

    board.layout('house-pile', { area: { left: 21.5, top: 68.2, width: 18.7, height: 11.17 }});
    game.first('house-pile')!.layout(House, { offsetRow: {x: -50, y: 100}, offsetColumn: 100, haphazardly: 2, });

    const columnLeft: number[] = [ 2.8, 7.75 ];
    const columnTop: number[] = [ 4.1, 7.0 ];
    const hexHeight = 5.8;
    const hexWidth = 6.65;
    const hexColGap = 3.1;

    const map = game.all('map');

    type HexSlot = { left: number; top: number; width: number; height: number; };
    const slots: HexSlot[] = [];
    ChicagoExpressSetup.columnConfiguration.forEach((column, columnIndex) => {
      for (let row = column[0]; row <= column[1]; ++row) {
        slots.push({
          left: columnLeft[columnIndex % 2] + Math.trunc(columnIndex / 2) * ( hexWidth + hexColGap ),
          top: columnTop[columnIndex % 2] + row * hexHeight,
          width: hexWidth,
          height: hexHeight
        })
      }
    });
    map.configureLayout({ slots });

    game.all(HexagonalField).appearance({
      render: (hexField) => {
        const publishFieldInfo = (detail: HexagonalField | null) => {
          window.dispatchEvent(new CustomEvent(FIELD_INFO_EVENT, { detail }));
        };
          return (
          <div
            className={`hexagonal-field-inner ${game.gameState == GameStates.SelectFields && game.isFieldSelectable(hexField) ? "highlight" : ""}`}
            onMouseEnter={() =>
              publishFieldInfo(hexField)
            }
            onMouseLeave={() => publishFieldInfo(null)}
          />
        )
      }
    });

    const industrialCityTrackCellWidth = 11;
    const industrialCityTrackCellHeight = 32  ;
    const industrialCityTrackCellFrameWidth = 1.8;
    const industrialCityTrackCellFrameHeight = 2.2;
    game.layout(Board, { area: { left: 20, top: 0, width: 58, height: 100, }, });
    board.layout("industrial-city-track", { area: { left: 31.6, top: 80.5, width: 23.24, height: 11.95, } });
    ChicagoExpressSetup.industrialCities.forEach((industrialCity, i) => {
      ChicagoExpressSetup.industrialCityTrackCells[i].forEach((cellIndex, j) => {
        const k = ChicagoExpressSetup.industrialCityTrackCells[i][j] - 1;
        game.all("industrial-city-track").layout(
          `${ChicagoExpressSetup.industrialCityNames[i]}-${cellIndex}`, {
            area: {
              left: k*industrialCityTrackCellWidth + k*industrialCityTrackCellFrameWidth,
              top: i * (industrialCityTrackCellFrameHeight + industrialCityTrackCellHeight), width: industrialCityTrackCellWidth, height: industrialCityTrackCellHeight } });
      })
    });

    board.layout(AuctionGauge, { area: { left: 4.2, top: 52.6, width: 12.04, height: 12.04, } })
    board.layout(DevelopmentGauge, { area: { left: 4.2, top: 67.9, width: 12.04, height: 12.04, } })
    board.layout(RouteConstructionGauge, { area: { left: 4.2, top: 83.1, width: 12.04, height: 12.04, } })

    const wabashId = ChicagoExpressSetup.railwayCompanies[RailwayCompanies.Wabash].id;
    board.layout(wabashId, { area: { left: 62.1, top: 71.4, width: 29.76, height: 19.97, } });
    const wabashSpace = game.first(wabashId)!;
    wabashSpace.layout("trains", { area: { left:0, top: 0, width: 45, height: 100 }});
    wabashSpace.layout("account", { area: { left:45, top: 0, width: 42, height: 50 }});
    wabashSpace.layout("stocks", { area: { left:45, top: 50, width: 55, height: 50 }});

    game.railwayCompanies.forEach((company) => {
      const images = companyImages[company.name];

      game.all(`${company.name}-train`).appearance({aspectRatio: 1, render: () => <img src={images.train} />, });
      game.all(`${company.name}-counter`).appearance({ aspectRatio: 1, render: () => <img src={images.counter} />,});
      game.all(`${company.name}-logo`).appearance({ aspectRatio: 1, render: () => <img src={images.logo} />, });
      game.all(`${company.name}-stock`).appearance({ aspectRatio: 1, render: () => <img src={images.stock} />, });
    });

    game.all('house').appearance({ aspectRatio: 1, render: () => ( <img src={image_House}/> ) });
    game.all(Banknote).appearance({ aspectRatio: 1, render: () => ( <img src={image_Banknote}/> ) });

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
                ${tableau.first('account')?.all('banknote').length}
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
      tableau.layout("account", { area: { left: 1, top: 30, width: 98, height: 30 } }); 
      tableau.layout("stocks", { area: { left: 1, top: 60, width: 98, height: 30 } });
    });

    // position the railway company charters
    const charterHeight = 20;
    const charterGap = 0;
    ChicagoExpressSetup.railwayCompanies.slice(1).forEach((company, index) => {
      const companySpace = game.all(company.id);
      game.layout(company.id, { area: { left: 81, top: 20 + (index * charterHeight + charterGap), width: 19, height: charterHeight }});
      companySpace.layout("trains", { area: { left: 4.5, top: 10, width: 40, height: 80 }});
      companySpace.layout("account", { area: { left:45, top: 10, width: 38, height: 35 }});
      companySpace.layout("stocks", { area: { left:45, top: 45, width: 50, height: 45 }});
    });

    ChicagoExpressSetup.railwayCompanies.forEach((company, index) => {
      game.all(company.id).appearance({
        render: (company) => {
          const trainCompany = company as RailwayCompany;
          return (
            <div className="company-panel__header">
              <div className={`company-panel__cash${trainCompany.name === 'Wabash' ? ' company-panel__cash--wabash' : ''}`}>
                ${trainCompany.first('account')?.all('banknote').length}
              </div>
              <div className={`company-panel ${game.getSelectableCompanies().includes(trainCompany) && game.gameState == GameStates.SelectCompany ? "highlight" : ""}`}>
              </div>
            </div>
          );
        }
      });
    });

    game.all(Gauge).appearance({
      render: (gauge) => {
        return (
          <div className="gauge-header">
            <img
              className="gauge-pointer"
              src={gaugePointer}
              style={{
                transform: `rotate(${gauge.getAngle()}deg)`,
              }}
              alt=""
            />
            <div className={`gauge-inner ${gauge.isActionPossible() && game.gameState == GameStates.SelectAction ? "highlight" : ""}`}></div>
          </div>
        );
      }
    });

    // define the layout of the trains and stocks pile on each railway company charter
    game.all("trains").layout(Train, { offsetRow: {x: -50, y: 100}, offsetColumn: 100, haphazardly: 2, });
    game.all("stocks").layout(Stock, { rows: {max: 1}, offsetColumn: {x: 15, y: 15}, direction: 'ltr', });
    game.all("trains-space").layout(Train, { rows: {max: 1}, offsetColumn: {x: 15, y: 15}, direction: 'ltr', size: { width: 50, height: 50 }});
    game.all("house-space").layout(House, { size: { width: 50, height: 50 } });

    // define the layout for the income track
    const incomeTrackCellWidth = 3.21;
    const incomeTrackCellHeight = 4.85;
    const incomeTrackCellFrameWidth = 0.13;
    const incomeTrackCellFrameHeight = 0.15;
    board.layout('income-track-0', { area: { left: 16.7, top: 94.1, width: 2.52, height: 2.42 } });
    board.layout('income-track-horizontal', { area: { left: 21.4, top: 94.1, width: 75.58, height: 2.42 } });
    for (let i = 1; i <= ChicagoExpressSetup.incomeTrackHorizonalLength; ++i) {
      game.all('income-track-horizontal').layout(`income-track-${i}`, { area: { left: (i-1) * (incomeTrackCellFrameWidth + incomeTrackCellWidth), top: 0, width: incomeTrackCellWidth, height: 100 } });
    }
    board.layout('income-track-vertical', { area: { left: 94.6, top: 41.9, width: 2.42, height: 52 } });
    for (let i = ChicagoExpressSetup.incomeTrackHorizonalLength + ChicagoExpressSetup.incomeTrackVerticalLength; i > ChicagoExpressSetup.incomeTrackHorizonalLength; --i) {
      game.all('income-track-vertical').layout(`income-track-${i}`, { area: {
        left: 0,
        top: (ChicagoExpressSetup.incomeTrackHorizonalLength + ChicagoExpressSetup.incomeTrackVerticalLength - i) * (incomeTrackCellFrameHeight + incomeTrackCellHeight),
        width: 100,
        height: incomeTrackCellHeight
      } });
    }
    board.layout('plus-50-game-tokens', { area: { left: 21.4, top: 97, width: 10, height: 4 } });
  }
});
