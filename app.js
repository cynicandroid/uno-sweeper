const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const COLORS = ['red', 'blue', 'green', 'yellow'];
const COLOR_NAMES = { red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow' };
const SETTINGS_KEY = 'uno-sweeper-settings';
const state = { round: 0, game: null };
let selectedTool = 'shovel';
let clickTimer;
let botRunning = false;
let botTimer;

function makeCard(type, color = null, numberValue = null) {
  const values = { skip: 0, reverse: 0, draw2: 2, wild: 0, wild4: 4 };
  const value = type === 'number' ? numberValue : values[type];
  return { type, color, value, label: type === 'number' ? String(value) : ({ skip: 'Skip', reverse: 'Reverse', draw2: '+2', wild: 'Wild', wild4: 'Wild +4' })[type] };
}

const cardPool = [
  ...COLORS.flatMap((color) => Array.from({ length: 10 }, (_, value) => makeCard('number', color, value))),
  ...COLORS.flatMap((color) => ['skip', 'reverse', 'draw2'].map((type) => makeCard(type, color))),
  makeCard('wild'), makeCard('wild4')
];

function randomCard() {
  const card = cardPool[Math.floor(Math.random() * cardPool.length)];
  return { ...card };
}

function randomCards(count) {
  return Array.from({ length: count }, randomCard);
}

function placeRandomMines(totalSquares, mineCount) {
  const mines = new Set();
  while (mines.size < mineCount) mines.add(Math.floor(Math.random() * totalSquares));
  return mines;
}

function newGame(config) {
  saveSettings(config);
  state.round += 1;
  const total = config.width * config.height;
  const openingCard = makeCard('number', COLORS[Math.floor(Math.random() * COLORS.length)], Math.floor(Math.random() * 10));
  state.game = {
    width: config.width,
    height: config.height,
    mineCount: config.mines,
    mines: placeRandomMines(total, config.mines),
    flags: new Map(),
    revealed: new Map(),
    players: [
      { name: config.playerOne, hand: randomCards(7), score: 0, revealed: 0, flags: 0 },
      { name: config.playerTwo, hand: randomCards(7), score: 0, revealed: 0, flags: 0, isBot: config.opponentMode === 'medium-bot' }
    ],
    current: 0,
    activeColor: openingCard.color,
    discard: openingCard,
    phase: 'card',
    actions: null,
    pendingWild: null,
    bonusAwarded: false,
    bonusOwner: null,
    animating: false,
    gameOver: false
  };
  closeModal('result-modal');
  closeModal('setup-modal');
  render();
}

function neighbors(index) {
  const game = state.game;
  const row = Math.floor(index / game.width);
  const column = index % game.width;
  const result = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (!rowOffset && !columnOffset) continue;
      const nextRow = row + rowOffset;
      const nextColumn = column + columnOffset;
      if (nextRow >= 0 && nextRow < game.height && nextColumn >= 0 && nextColumn < game.width) result.push(nextRow * game.width + nextColumn);
    }
  }
  return result;
}

function adjacentMines(index) {
  return neighbors(index).filter((neighbor) => state.game.mines.has(neighbor)).length;
}

function cardClass(card) {
  if (card.type === 'wild4') return 'wild4-card';
  return card.color ? `${card.color}-card` : 'wild-card';
}

function cardTitle(card) {
  return card.type === 'wild4' ? 'Wild Draw Four' : card.label;
}

function cardMarkup(card) {
  if (card.type === 'wild4') {
    return `<span class="card-corner">+4</span><span class="wild4-quadrants" aria-hidden="true"><i></i><i></i><i></i><i></i></span><strong class="wild4-center">+4</strong><span class="card-corner bottom">+4</span>`;
  }
  if (card.type === 'wild') {
    return `<span class="card-corner">Wild</span><span class="wild-quadrants" aria-hidden="true"><i></i><i></i><i></i><i></i></span><strong class="wild-center">Wild</strong><span class="card-corner bottom">Wild</span>`;
  }
  return `<span class="card-corner">${card.label}</span><strong>${card.label}</strong><span class="card-corner bottom">${card.label}</span>`;
}

function makeCardButton(card, index, hidden = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `uno-card small-card ${hidden ? 'card-back' : cardClass(card)}`;
  if (hidden) {
    button.innerHTML = '<strong>UNO</strong>';
    button.setAttribute('aria-label', 'Opponent card');
    button.disabled = true;
    return button;
  }
  button.innerHTML = cardMarkup(card);
  button.setAttribute('aria-label', `Play ${cardTitle(card)}`);
  button.addEventListener('click', () => playCard(index));
  return button;
}

function renderHands() {
  const game = state.game;
  const current = game.current;
  const opponent = 1 - current;
  const currentHand = $('#player-hand');
  const opponentHand = $('#opponent-hand');
  const hideCurrentHand = game.players[current].isBot;
  currentHand.replaceChildren(...game.players[current].hand.map((card, index) => makeCardButton(card, index, hideCurrentHand)));
  opponentHand.replaceChildren(...game.players[opponent].hand.map((card) => makeCardButton(card, 0, true)));
  $('#player-hand-title').textContent = `${game.players[current].name}’s hand`;
  if (hideCurrentHand) $('#player-hand-title').textContent = `${game.players[current].name}’s cards are hidden`;
  $('#opponent-hand-title').textContent = `${game.players[opponent].name}’s hand`;
  $('#player-card-count').textContent = `${game.players[current].hand.length} cards`;
  $('#opponent-card-count').textContent = `${game.players[opponent].hand.length} cards`;
}

function renderBoard() {
  const game = state.game;
  const board = $('#mine-board');
  board.style.gridTemplateColumns = `repeat(${game.width}, 1fr)`;
  board.setAttribute('aria-label', `${game.width} by ${game.height} Minesweeper board`);
  board.replaceChildren();
  for (let index = 0; index < game.width * game.height; index += 1) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.index = index;
    const revealedBy = game.revealed.get(index);
    const flagBy = game.flags.get(index);
    if (revealedBy !== undefined) {
      cell.classList.add('revealed', `p${revealedBy + 1}`);
      if (game.mines.has(index)) {
        cell.classList.add('mine');
        if (game.explodingMine === index) cell.classList.add('exploding');
        cell.textContent = '✹';
        cell.setAttribute('aria-label', 'Mine revealed');
      } else {
        const number = adjacentMines(index);
        cell.classList.add(['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][number]);
        cell.textContent = number || '';
        cell.setAttribute('aria-label', `Revealed safe square, ${number} adjacent mines`);
      }
    } else if (flagBy !== undefined) {
      cell.classList.add('flagged', `p${flagBy + 1}`);
      cell.textContent = '⚑';
      cell.setAttribute('aria-label', 'Flagged square');
    } else {
      cell.setAttribute('aria-label', 'Covered square');
    }
    cell.addEventListener('click', () => {
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => useTool(index, selectedTool), 220);
    });
    cell.addEventListener('dblclick', (event) => {
      event.preventDefault();
      clearTimeout(clickTimer);
      useTool(index, 'flag');
    });
    cell.addEventListener('keydown', (event) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      clearTimeout(clickTimer);
      useTool(index, 'flag');
    });
    board.append(cell);
  }
}

function renderCardPanel() {
  const game = state.game;
  const card = game.discard;
  const discard = $('#discard-card');
  discard.className = `discard-card uno-card large-card ${cardClass(card)}`;
  discard.innerHTML = cardMarkup(card);
  $('#active-color').textContent = COLOR_NAMES[game.activeColor];
  $('#active-color').className = `color-chip ${game.activeColor}`;
  const instruction = $('#turn-instruction');
  if (game.gameOver) instruction.innerHTML = '<strong>Game over</strong><span>Start another game to play again.</span>';
  else if (game.phase === 'actions') instruction.innerHTML = `<strong>${game.actions} square action${game.actions === 1 ? '' : 's'} left</strong><span>${game.players[game.current].isBot ? 'Medium bot is choosing a move…' : 'Select Shovel or Flag below the board, then click a square.'}</span>`;
  else instruction.innerHTML = `<strong>${game.players[game.current].name}: ${game.players[game.current].isBot ? 'choosing a card…' : 'play a card or draw'}</strong><span>${game.players[game.current].isBot ? 'Medium bot is taking its turn.' : `Match ${COLOR_NAMES[game.activeColor].toLowerCase()}, match the number, play Wild, or draw to end your turn.`}</span>`;
  $('#draw-pile').disabled = game.phase !== 'card' || game.gameOver;
  $('#end-turn').disabled = game.phase !== 'actions' || game.gameOver;
  $('#color-choices').hidden = !game.pendingWild;
}

function render() {
  if (!state.game) return;
  const game = state.game;
  for (let playerIndex = 0; playerIndex < 2; playerIndex += 1) {
    const player = game.players[playerIndex];
    $(`#name-${playerIndex}`).innerHTML = `${player.name}${player.isBot ? ' <span class="bot-pill">Medium bot</span>' : ''}${game.current === playerIndex && !game.gameOver ? ' <span class="turn-pill">Your turn</span>' : ''}`;
    $(`#avatar-${playerIndex}`).textContent = player.name.charAt(0).toUpperCase();
    $(`#score-${playerIndex}`).textContent = player.score;
    $(`#revealed-${playerIndex}`).textContent = player.revealed;
    $(`#flags-${playerIndex}`).textContent = player.flags;
    $(`#player-card-${playerIndex}`).classList.toggle('active-player', game.current === playerIndex && !game.gameOver);
  }
  $('#round-label').textContent = `Round ${state.round}`;
  $('#board-label').textContent = `${game.width} × ${game.height} · ${game.mineCount} mines`;
  $('#mine-counter').innerHTML = `<span>☠</span> ${game.mineCount} mines · ${game.mineCount - game.flags.size} flags left`;
  $('#actions-left').textContent = game.actions === null ? '—' : game.actions;
  $('#footer-status').textContent = game.gameOver ? 'Game complete' : `${game.players[game.current].name} · ${game.phase === 'actions' ? 'Choose squares' : 'Choose a card'}`;
  renderBoard();
  renderHands();
  renderCardPanel();
  scheduleBotTurn();
}

function isPlayable(card) {
  const game = state.game;
  if (card.type === 'wild' || card.type === 'wild4') return true;
  const sameColor = card.color === game.activeColor;
  const sameNumber = card.type === 'number' && game.discard.type === 'number' && card.value === game.discard.value;
  return sameColor || sameNumber;
}

function playCard(index) {
  const game = state.game;
  if (!game || game.gameOver || game.phase !== 'card' || game.pendingWild) return;
  const card = game.players[game.current].hand[index];
  if (!card || !isPlayable(card)) {
    setFooter('That card cannot be played right now. Match the active color or use Wild.');
    return;
  }
  hideTurnGuide();
  const playerIndex = game.current;
  game.players[playerIndex].hand.splice(index, 1);
  game.discard = card;
  if (card.color) game.activeColor = card.color;
  if (card.type === 'wild' || card.type === 'wild4') {
    game.pendingWild = { playerIndex, card };
    render();
    return;
  }
  if (card.type === 'draw2') {
    drawCards(1 - playerIndex, card.value);
    game.current = playerIndex;
    game.phase = 'card';
    game.actions = null;
    announceTurn(game.current);
    render();
    return;
  }
  if (card.type === 'number') {
    game.actions = card.value;
    game.phase = 'actions';
    render();
    if (game.actions === 0) endTurn();
    return;
  }
  finishSpecial(playerIndex, card.type);
}

function finishSpecial(playerIndex, type) {
  const game = state.game;
  drawCards(playerIndex, 1);
  if (type === 'skip' || type === 'reverse') game.current = playerIndex;
  else game.current = 1 - playerIndex;
  game.phase = 'card';
  game.actions = null;
  render();
}

function chooseWildColor(color) {
  const game = state.game;
  if (!game.pendingWild) return;
  const { playerIndex, card } = game.pendingWild;
  game.activeColor = color;
  game.pendingWild = null;
  if (card.type === 'wild4') {
    drawCards(1 - playerIndex, card.value);
    game.current = playerIndex;
  } else {
    drawCards(playerIndex, 1);
    game.current = 1 - playerIndex;
  }
  game.phase = 'card';
  game.actions = null;
  announceTurn(game.current);
  render();
}

function drawCard() {
  const game = state.game;
  if (!game || game.gameOver || game.phase !== 'card') return;
  hideTurnGuide();
  const player = game.current;
  drawCards(player, 1);
  game.current = 1 - player;
  announceTurn(game.current);
  render();
}

function drawCards(playerIndex, count) {
  for (let index = 0; index < count; index += 1) state.game.players[playerIndex].hand.push(randomCard());
}

async function animateFlagPlacement(index) {
  const cell = $(`#mine-board .cell[data-index="${index}"]`);
  if (!cell) return;
  cell.classList.add('flag-planting');
  await new Promise((resolve) => setTimeout(resolve, 560));
}

async function useTool(index, tool) {
  const game = state.game;
  if (!game || game.gameOver) return;
  if (game.animating) return;
  if (game.phase !== 'actions' || game.actions < 1) {
    showTurnGuide();
    return;
  }
  if (game.revealed.has(index)) return;
  if (game.flags.has(index)) {
    if (tool !== 'flag') return;
    const flagOwner = game.flags.get(index);
    game.flags.delete(index);
    game.players[flagOwner].flags -= 1;
    game.players[flagOwner].score -= 2;
    if (game.bonusAwarded && (game.flags.size !== game.mineCount || [...game.flags.keys()].some((flag) => !game.mines.has(flag)))) {
      game.players[game.bonusOwner].score -= 10;
      game.bonusAwarded = false;
      game.bonusOwner = null;
    }
    game.actions -= 1;
    render();
    if (game.actions === 0) endTurn();
    return;
  }
  if (tool === 'flag' && game.flags.size >= game.mineCount) return;
  const playerIndex = game.current;
  if (tool === 'flag') {
    game.flags.set(index, playerIndex);
    game.players[playerIndex].flags += 1;
    game.players[playerIndex].score += 2;
    game.animating = true;
    if (game.flags.size === game.mineCount && [...game.flags.keys()].every((flag) => game.mines.has(flag)) && !game.bonusAwarded) {
      game.players[playerIndex].score += 10;
      game.bonusAwarded = true;
      game.bonusOwner = playerIndex;
      setFooter(`${game.players[playerIndex].name} found the final mine flag: +10 bonus!`);
    }
  } else {
    if (game.mines.has(index)) {
      finishGame('mine', playerIndex);
      return;
    }
    revealSafeArea(index, playerIndex);
  }
  game.actions -= 1;
  render();
  if (tool === 'flag') {
    await animateFlagPlacement(index);
    game.animating = false;
    if (state.game !== game) return;
  }
  checkBoardEnd();
  if (!game.gameOver && game.actions === 0) endTurn();
}

function revealSafeArea(startIndex, playerIndex) {
  const game = state.game;
  const queue = [startIndex];
  const visited = new Set();
  while (queue.length) {
    const index = queue.shift();
    if (visited.has(index) || game.revealed.has(index) || game.flags.has(index) || game.mines.has(index)) continue;
    visited.add(index);
    game.revealed.set(index, playerIndex);
    game.players[playerIndex].revealed += 1;
    game.players[playerIndex].score += 1;
    if (adjacentMines(index) === 0) {
      neighbors(index).forEach((neighbor) => {
        if (!visited.has(neighbor) && !game.revealed.has(neighbor) && !game.flags.has(neighbor) && !game.mines.has(neighbor)) queue.push(neighbor);
      });
    }
  }
}

function checkBoardEnd() {
  const game = state.game;
  const safeSquares = game.width * game.height - game.mineCount;
  if (game.revealed.size < safeSquares) return;
  const wrongFlags = [...game.flags.entries()].filter(([index]) => !game.mines.has(index));
  if (wrongFlags.length) {
    const penalized = new Set(wrongFlags.map(([, player]) => player));
    penalized.forEach((playerIndex) => { game.players[playerIndex].score -= 10; });
    finishGame('wrong-flags');
  } else if (game.flags.size === game.mineCount) finishGame('complete');
}

function finishGame(reason, losingPlayer = null) {
  const game = state.game;
  if (game.gameOver) return;
  game.gameOver = true;
  game.phase = 'over';
  game.actions = null;
  render();
  if (reason === 'mine') {
    animateMineLoss(losingPlayer);
    return;
  }
  presentResult(reason, losingPlayer);
}

async function animateMineLoss(losingPlayer) {
  const game = state.game;
  const mineIndexes = [...game.mines];
  for (const mineIndex of mineIndexes) {
    game.revealed.set(mineIndex, losingPlayer);
    game.explodingMine = mineIndex;
    render();
    await new Promise((resolve) => setTimeout(resolve, 320));
  }
  game.explodingMine = null;
  render();
  presentResult('mine', losingPlayer);
}

function presentResult(reason, losingPlayer = null) {
  const game = state.game;
  const [first, second] = game.players;
  let title = 'The board is settled';
  let message;
  const resultCard = $('#result-modal-card');
  resultCard.classList.toggle('mine-loss', reason === 'mine');
  $('#result-burst').textContent = reason === 'mine' ? '✹' : '✦';
  if (reason === 'mine') {
    title = `${game.players[losingPlayer].name} loses!`;
    message = `${game.players[losingPlayer].name} shoveled a mine. ${game.players[1 - losingPlayer].name} wins automatically.`;
  }
  else if (reason === 'wrong-flags') message = `Incorrect flags ended the game. ${first.name}: ${first.score} points · ${second.name}: ${second.score} points.`;
  else if (first.score === second.score) message = `It is a tie at ${first.score} points. Nobody wins this round; the next game decides the winner.`;
  else { const winner = first.score > second.score ? first : second; message = `${winner.name} wins with ${winner.score} points.`; }
  $('#result-title').textContent = title;
  $('#result-copy').textContent = message;
  openModal('result-modal');
}

function endTurn() {
  const game = state.game;
  if (!game || game.gameOver || game.phase !== 'actions') return;
  const player = game.current;
  drawCards(player, 1);
  game.current = 1 - player;
  announceTurn(game.current);
  game.phase = 'card';
  game.actions = null;
  render();
}

let turnPopTimer;
function positionOverlayAtBoardCenter(element) {
  const board = $('#mine-board');
  if (!board || !element) return;
  const bounds = board.getBoundingClientRect();
  element.style.left = `${bounds.left + bounds.width / 2}px`;
  element.style.top = `${bounds.top + bounds.height / 2}px`;
  element.style.bottom = 'auto';
}

function announceTurn(playerIndex) {
  const pop = $('#turn-pop');
  if (!pop || !state.game) return;
  positionOverlayAtBoardCenter(pop);
  $('#turn-pop-name').textContent = state.game.players[playerIndex].name;
  pop.classList.remove('show');
  void pop.offsetWidth;
  pop.classList.add('show');
  clearTimeout(turnPopTimer);
  turnPopTimer = setTimeout(() => pop.classList.remove('show'), 1900);
}

function setFooter(message) { $('#footer-status').textContent = message; }
function openModal(id) { $(`#${id}`).hidden = false; }
function closeModal(id) { $(`#${id}`).hidden = true; }

let guideTimer;
function showTurnGuide() {
  const guide = $('#turn-guide');
  positionOverlayAtBoardCenter(guide);
  $('#guide-title').textContent = 'Play a card or draw first';
  $('#guide-copy').textContent = 'Choose a playable card from your hand below.';
  guide.classList.remove('show');
  void guide.offsetWidth;
  guide.classList.add('show');
  clearTimeout(guideTimer);
  guideTimer = setTimeout(() => guide.classList.remove('show'), 2500);
}

function hideTurnGuide() {
  clearTimeout(guideTimer);
  $('#turn-guide').classList.remove('show');
}

function scheduleBotTurn() {
  const game = state.game;
  if (!game || game.gameOver || botRunning || botTimer || !game.players[game.current].isBot) return;
  botTimer = setTimeout(() => {
    botTimer = null;
    runBotTurn();
  }, 700);
}

const botPause = (duration = 520) => new Promise((resolve) => setTimeout(resolve, duration));

async function runBotTurn() {
  if (botRunning) return;
  botRunning = true;
  const startingGame = state.game;
  try {
    while (state.game === startingGame && !startingGame.gameOver && startingGame.players[startingGame.current].isBot) {
      const isTilePhase = startingGame.phase === 'actions';
      await botPause(isTilePhase ? 0 : 520);
      if (state.game !== startingGame || startingGame.gameOver || !startingGame.players[startingGame.current].isBot) break;
      const game = startingGame;
      const botIndex = game.current;
      if (game.pendingWild) {
        chooseWildColor(botChooseColor(botIndex));
        continue;
      }
      if (game.phase === 'card') {
        const playable = game.players[botIndex].hand
          .map((card, index) => ({ card, index }))
          .filter(({ card }) => isPlayable(card));
        if (!playable.length) {
          drawCard();
          continue;
        }
        playable.sort((a, b) => botCardValue(b.card, game.players[botIndex].hand) - botCardValue(a.card, game.players[botIndex].hand));
        playCard(playable[0].index);
        continue;
      }
      if (game.phase === 'actions' && game.actions > 0) {
        const action = botChooseBoardAction(botIndex);
        await useTool(action.index, action.tool);
        if (state.game === startingGame && !startingGame.gameOver && startingGame.phase === 'actions' && startingGame.actions > 0) {
          await botPause(1000);
        }
      } else break;
    }
  } finally {
    botRunning = false;
    scheduleBotTurn();
  }
}

function botCardValue(card, hand) {
  if (card.type === 'number') return 5 + card.value + hand.filter((held) => held.color === card.color && held !== card).length * 0.45;
  if (card.type === 'draw2') return 9;
  if (card.type === 'wild4') return 8;
  if (card.type === 'skip' || card.type === 'reverse') return 6;
  return 3;
}

function botChooseColor(playerIndex) {
  const counts = Object.fromEntries(COLORS.map((color) => [color, 0]));
  state.game.players[playerIndex].hand.forEach((card) => { if (card.color) counts[card.color] += 1; });
  return COLORS.sort((a, b) => counts[b] - counts[a])[0];
}

function botChooseBoardAction(playerIndex) {
  const game = state.game;
  const hidden = [];
  for (let index = 0; index < game.width * game.height; index += 1) {
    if (!game.revealed.has(index) && !game.flags.has(index)) hidden.push(index);
  }
  const safeCertain = new Set();
  const minesCertain = new Set();
  const risks = new Map();
  for (const [clueIndex] of game.revealed) {
    if (game.mines.has(clueIndex)) continue;
    const clue = adjacentMines(clueIndex);
    const surrounding = neighbors(clueIndex);
    const covered = surrounding.filter((index) => !game.revealed.has(index) && !game.flags.has(index));
    const flagged = surrounding.filter((index) => game.flags.has(index)).length;
    const remaining = clue - flagged;
    if (!covered.length) continue;
    if (remaining === 0) covered.forEach((index) => safeCertain.add(index));
    else if (remaining === covered.length) covered.forEach((index) => minesCertain.add(index));
    const localRisk = Math.max(0, Math.min(1, remaining / covered.length));
    covered.forEach((index) => {
      const entry = risks.get(index) || { total: 0, samples: 0 };
      entry.total += localRisk;
      entry.samples += 1;
      risks.set(index, entry);
    });
  }
  const availableFlags = game.flags.size < game.mineCount;
  const forcedMine = [...minesCertain].find((index) => hidden.includes(index));
  if (availableFlags && forcedMine !== undefined) return { index: forcedMine, tool: 'flag' };
  const forcedSafe = [...safeCertain].filter((index) => hidden.includes(index));
  if (forcedSafe.length) return { index: forcedSafe[Math.floor(Math.random() * forcedSafe.length)], tool: 'shovel' };

  const baseRisk = (game.mineCount - game.flags.size) / Math.max(1, hidden.length);
  const ranked = hidden.map((index) => {
    const sample = risks.get(index);
    return { index, risk: sample ? (sample.total / sample.samples + baseRisk) / 2 : baseRisk };
  }).sort((a, b) => a.risk - b.risk);
  if (availableFlags && ranked.length && ranked[ranked.length - 1].risk > 0.72 && Math.random() < 0.65) {
    return { index: ranked[ranked.length - 1].index, tool: 'flag' };
  }
  const safestRisk = ranked[0]?.risk ?? 1;
  const similarlySafe = ranked.filter((candidate) => candidate.risk <= safestRisk + 0.08);
  return { index: similarlySafe[Math.floor(Math.random() * similarlySafe.length)].index, tool: 'shovel' };
}

function populateSetup() {
  const form = $('#setup-form');
  const game = state.game;
  const saved = loadSettings();
  form.playerOne.value = game?.players[0].name || saved.playerOne;
  form.playerTwo.value = game?.players[1].name || saved.playerTwo;
  form.width.value = game?.width || saved.width;
  form.height.value = game?.height || saved.height;
  form.mines.value = game?.mineCount || saved.mines;
  form.opponentMode.value = game ? (game.players[1].isBot ? 'medium-bot' : 'human') : saved.opponentMode;
  if (['Brainrot Bot', 'Jimothy', 'Player Two'].includes(form.playerTwo.value.trim())) {
    form.playerTwo.value = form.opponentMode.value === 'medium-bot' ? 'Brainrot Bot' : 'Jimothy';
  }
}

function loadSettings() {
  const defaults = { playerOne: 'Player One', playerTwo: 'Brainrot Bot', opponentMode: 'medium-bot', width: 9, height: 9, mines: 10 };
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...defaults, ...saved };
  } catch {
    return defaults;
  }
}

function hasSavedSettings() {
  try {
    return Boolean(localStorage.getItem(SETTINGS_KEY));
  } catch {
    return false;
  }
}

function saveSettings(config) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ playerOne: config.playerOne, playerTwo: config.playerTwo, opponentMode: config.opponentMode, width: config.width, height: config.height, mines: config.mines }));
  } catch {
    // Private browsing or disabled storage should not prevent the game from running.
  }
}

function submitSetup(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const config = { playerOne: form.playerOne.value.trim(), playerTwo: form.playerTwo.value.trim(), opponentMode: form.opponentMode.value, width: Number(form.width.value), height: Number(form.height.value), mines: Number(form.mines.value) };
  const maxMines = Math.floor(config.width * config.height * 0.206);
  const error = $('#form-error');
  if (!config.playerOne || !config.playerTwo || config.width < 9 || config.height < 9 || config.mines < 10 || config.mines > maxMines || config.mines >= config.width * config.height) {
    error.textContent = `Use names, dimensions of at least 9 × 9, and 10–${maxMines} mines for this board.`;
    return;
  }
  error.textContent = '';
  newGame(config);
}

function bindEvents() {
  $('#setup-form').addEventListener('submit', submitSetup);
  $('#setup-form').opponentMode.addEventListener('change', (event) => {
    const playerTwo = $('#setup-form').playerTwo;
    if (['Brainrot Bot', 'Jimothy', 'Player Two'].includes(playerTwo.value.trim())) {
      playerTwo.value = event.target.value === 'medium-bot' ? 'Brainrot Bot' : 'Jimothy';
    }
  });
  $('#settings-button').addEventListener('click', () => { populateSetup(); openModal('setup-modal'); });
  $('#new-game-button').addEventListener('click', () => { closeModal('result-modal'); newGame(loadSettings()); });
  $('#close-result-button').addEventListener('click', () => closeModal('result-modal'));
  $('#draw-pile').addEventListener('click', drawCard);
  $('#end-turn').addEventListener('click', endTurn);
  $('#help-button').addEventListener('click', () => openModal('help-modal'));
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
  $$('[data-color]').forEach((button) => button.addEventListener('click', () => chooseWildColor(button.dataset.color)));
  $$('.tool-button').forEach((button) => button.addEventListener('click', () => {
    selectedTool = button.dataset.tool;
    $$('.tool-button').forEach((tool) => {
      const active = tool === button;
      tool.classList.toggle('selected', active);
      tool.setAttribute('aria-pressed', String(active));
    });
  }));
}

bindEvents();
populateSetup();
if (hasSavedSettings()) newGame(loadSettings());
else openModal('setup-modal');
