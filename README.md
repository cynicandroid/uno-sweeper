# UNO Sweeper

UNO Sweeper is a two-player strategy game that combines UNO card play with a Minesweeper board. Players use playable UNO cards to earn actions, then spend those actions revealing or flagging squares.

## Disclaimer

UNO Sweeper is an independent fan-made project created for fun and entertainment. It is not affiliated with, endorsed by, sponsored by, or otherwise associated with UNO, Microsoft, or Minecraft. UNO, Minecraft, and related names, marks, and imagery belong to their respective owners.

## Play online

Scan the QR code or visit [cynicandroid.github.io/uno-sweeper](https://cynicandroid.github.io/uno-sweeper/):

![QR code for the online UNO Sweeper game](assets/uno-sweeper-qr.png)

## Current status

The project is a playable offline pass-and-play build. It includes setup, random mine generation, random card dealing, UNO color validation, special-card turn rules, board actions, scoring, mine losses, flag penalties, and end-game results.

In Settings, choose either a second human or the Medium bot. The bot uses visible clues to make deductions and picks lower-risk squares when it cannot determine a safe move. Its mode is remembered with the other settings.

## Objective

Complete the Minesweeper board by revealing every safe square and correctly flagging every mine. The player with the most points wins. Revealing a mine causes an immediate loss.

## Board

- The default board is 9×9 with 10 mines.
- Every new game starts with all board squares covered and no squares revealed.
- Each new game randomly places the configured mines and randomly deals 7 starting cards to each player.
- Cards drawn during play are randomly selected from the UNO card pool, and mine locations remain hidden until a square is shoveled.
- The first shovel is not guaranteed to be safe. Revealing a mine immediately gives the other player the win.
- Beginner standard: 9×9 with 10 mines.
- Intermediate standard: 16×16 with 40 mines.
- Expert standard: 30×16 with 99 mines.
- The settings page will allow the board dimensions and mine count to be changed before a game begins.
- Custom boards must be at least 9×9, contain at least 10 mines, and contain no more than 20.6% mines.
- Invalid settings that leave no safe square are rejected.

## Turns and cards

- Two players take turns.
- Each player begins with 7 randomly dealt cards.
- The draw pile never runs out.
- A player plays one legal card, then uses the card’s action value to reveal or flag squares.
- If a player draws a card, their turn immediately ends.
- When a player has 0 actions remaining, their turn ends automatically.
- Players may play a card matching the active color or a number card matching the number on the top discard card. Matching action symbols alone do not make a card playable.
- Wild and Wild Draw Four cards may be played regardless of color, change the active color, force the opposing player to draw 4 cards, and let the original player continue.
- Number cards provide that number of actions.
- Skip, Reverse, and Wild do not provide reveal or flag actions.
- In a two-player game, Reverse acts like Skip and removes the next player’s turn.
- Skip completely removes the next player’s turn.
- After Wild changes the active color, the player must wait for their next turn before playing another card.
- Draw Two and Wild Draw Four force the opposing player to draw the penalty cards and lose their turn: 2 cards for Draw Two or 4 cards for Wild Draw Four.

The game includes number cards, Skip, Reverse, Draw Two, Wild, and Wild Draw Four.

## Board controls

- Shovel means reveal a square.
- Flag means mark a square as suspected to contain a mine.
- Select Shovel or Flag below the board, then click a covered square to perform that action.
- Double-clicking a covered square always flags it.
- Double-clicking a covered square always flags it.
- Each shovel or flag action uses one available action.
- A square can only be flagged once.
- The total number of flags cannot exceed the number of mines on the board.
- In Flag mode, clicking a flagged square removes it, refunds its 2 points, and consumes one action. Removing a flag also removes an invalidated final-flag bonus.
- A revealed square cannot be revealed again.
- A revealed safe square cannot be flagged.
- Flagged squares remain hidden until the game ends.
- Revealed squares with no adjacent mines use a distinct player-colored style so blank safe squares remain visible.
- Shoveling a safe square with zero adjacent mines automatically reveals the connected empty area and bordering number squares. The cascade uses one action, while each newly revealed safe square earns 1 point.

## Scoring

- Each safe square revealed is worth 1 point.
- Each flag placed is worth 2 points.
- The player who places the final correct mine flag receives a 10-point bonus.
- Each incorrect flag receives the normal 2-point flag award and a 5-point penalty, for a net score of -3 points.
- The game ends only when all safe squares are revealed and all mines are flagged.
- If all safe squares are revealed while any flags are incorrect, the game ends immediately. The player who placed an incorrect flag receives an additional 10-point penalty, and play does not continue.
- The player with the highest score wins.
- Revealing a mine overrides scoring and gives the other player an automatic win.
- A tie has no winner. The players shake hands, and the next game determines the winner.

## Running the project

The game is designed to run offline and uses only local files.

```bash
make serve
```

This stops any existing server on port 8000, starts the local server, and opens the default browser. Other available commands are:

```bash
make check   # validate JavaScript, required files, and offline assets
make stop    # stop the local server on port 8000
make clean   # stop the server and remove generated dist/ files
```

To use another port:

```bash
make serve PORT=8080
```

Player names, board dimensions, and mine count are saved in the browser so the setup form remembers the last selection. Players can change these values at any time from Settings.
When returning to the game, saved settings are used automatically and the setup screen is skipped. The first visit opens setup normally.
Starting the next game also uses the saved settings immediately. Open Settings to change the defaults.

When control passes to the other player, the game briefly displays an animated turn notification with that player’s name.
If a player tries to use the board before playing or drawing a card, a large animated arrow points them to the card hand with the required instruction.
If a player shovels a mine, the hidden mines explode one at a time, followed by a large loss screen with options to play again or finish.
The current turn instruction appears in a large centered banner above the active player’s hand.
