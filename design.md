### Design Rules

1. Minesweep board to begin with. 
2. 2 player can play this game.
3. On the bottom of the board there will be few uno cards. 
4. Deal 7 cards to each player on hand in random. Dispay all the cards each player has. 
5. The deck of the remaining card is placed at the center and never run out. 
6. So player take turn, when players turn comes, they put down 1 card from the hand, and they take one card from the pile. 
7. based on the card number you put down, you are allowed to revel that many squares of minesweeper. Each reveal or flag count as 1. 
8. Say user puts down card 4, then they are allowed to flag or shovel 4 squares. 
9. Color each players revelaled sqare and keep a counter of how many square did each player reveal. 
10. When Player 1 plays a Draw Two or Wild Draw Four, Player 2 must draw the penalty cards and lose their turn: 2 cards for Draw Two or 4 cards for Wild Draw Four. The turn then returns to Player 1.
11. If user say puts down card 2, the other player can put down reverse card immediately if they choose to so then can use that other users numbers card as their own, and reveal that many squares. 
12. If block card is placed, use essentially block other person's turn.
13 If the mine is blown, that is if they shovel the mine, the other player wins automatically
14. Like Uno, user can choose to change color using special color change card.
15. Like uno, if user do not have the color card and no color change card, they then draw from the pile.
16. For design phase, I need to be able to see both player cards, but in real game, player 1 should not be able to see player 2 cards and vice versa.
17. When starting to play, user can choose the name of the player to play with. 
18. Show the graphics of user holding cards and allow they to choose which card to throw on the pile. 
19. The Minesweeper board defaults to 9x9 squares.
20. A settings page allows the players to modify the board dimensions and the number of hidden mines before starting a game.
21. The draw pile never runs out; when cards are needed, the game always provides another card.
22. The game includes all standard UNO card types: number cards, Skip, Reverse, Draw Two, Wild, and Wild Draw Four.
23. Players may play a card that matches the active color or a number card that matches the number on the top discard card. Wild and Wild Draw Four cards may be played regardless of color and change the active color. Matching action symbols alone do not make a card playable.
24. “Shovel” means reveal a square. “Flag” means mark a square as suspected to contain a mine.
25. If a player accidentally shovels (reveals) a mine, that player automatically loses and the other player wins.
26. Each safe square revealed is worth 1 point. Each flag planted is worth 2 points. An incorrect flag receives a 5-point penalty after its 2-point award, for a net score of -3 points. The player who plants the final correct mine flag earns an additional 10-point bonus. When the board is complete, the player with the most points wins, unless a player has already revealed a mine.
27. The game uses standard Minesweeper difficulty settings: Beginner is 9x9 with 10 mines, Intermediate is 16x16 with 40 mines, and Expert is 30x16 with 99 mines. Custom settings must use at least a 9x9 board and 10 mines, and may not exceed 20.6% mines of the total squares (the standard Expert mine density). The settings page rejects any configuration that exceeds these limits or does not leave at least one safe square.
28. The game ends when both conditions are met: all safe squares have been revealed and all mines have been flagged.
29. Flagged squares remain hidden during play and are checked when the game ends. Each incorrect flag incurs a 5-point penalty in addition to the normal flag score.
30. A square may only be flagged once. A revealed square cannot be revealed again.
31. If a player draws a card, their turn immediately ends and the other player takes the next turn.
32. Skip and Reverse cards do not allow the player to reveal or flag any squares. Wild and Wild Draw Four force the opposing player to draw 4 cards; after choosing a color, the original player continues. The number on the next number card played determines how many squares that player may reveal or flag.
33. The default board action is Shovel. A single click on a covered square performs the currently selected board action.
34. A double click on a covered square always performs Flag, regardless of the currently selected board action.
35. The board displays two action buttons with icons: Shovel and Flag. A single click on an action button selects that tool and visibly highlights it.
36. Each action consumes one available action. A revealed square cannot be revealed again, and a flagged square cannot be flagged again or acted on again.
37. The board interface displays the current player, both scores, squares revealed by each player, the active UNO color, the current discard card, the draw pile, actions remaining, and both players’ card hands during the design phase.
38. When a new game starts, every board square is covered. No square is revealed at the beginning of the game.
39. Each new game randomly places the configured number of mines and randomly deals the starting cards to both players. The random mine locations remain hidden until a square is shoveled, and the draw pile continues to provide random cards.
40. There is no decline or stacking choice for Draw Two or Wild Draw Four. The opposing player automatically draws the penalty cards and loses their turn.
41. A revealed safe square cannot be flagged.
42. The total number of flags placed cannot exceed the configured number of mines on the board.
43. In a two-player game, Reverse acts like Skip and removes the next player's turn.
44. Skip completely removes the next player's turn.
45. After a player plays Wild and changes the active color, that player cannot immediately play another card and must wait until their next turn.
46. If all safe squares have been revealed while any flags are incorrect, the game ends immediately. Play does not continue to correct the flags, and each player who placed an incorrect flag receives an additional 10-point penalty.
47. If the final scores are tied, nobody wins. The players shake hands, and the next game determines the winner.
48. The first shovel is not guaranteed to be safe. If the first shovel reveals a mine, the other player automatically wins.
49. If a player has 0 actions remaining, their turn ends automatically. Players do not need to press End turn.
50. Save the selected player names, board dimensions, and mine count in browser storage. Pre-fill those saved values when the setup/settings page is opened so players can change them whenever needed.
51. Revealed squares with zero adjacent mines must use a distinct filled color so they are clearly different from covered squares. The color should also identify which player revealed them.
52. On refresh, if saved setup values exist, start a new game automatically with those values instead of reopening the setup page. The setup page remains available through Settings.
53. When a player shovels a safe square with zero adjacent mines, automatically reveal the connected empty area and its bordering numbered squares. This cascade counts as one shovel action, while each newly revealed safe square still earns 1 point.
54. Starting a next game uses the saved setup values immediately without opening the setup page. The setup page opens only through Settings when players want to change those values.
55. When a turn passes to the other player, show a brief animated turn-transition graphic with the incoming player’s name and a “Your turn” message.
56. Place the Shovel and Flag controls below the board at twice their previous size. The selected tool is used when the player clicks a square; selecting Flag makes a normal click flag it, and selecting Shovel makes a normal click reveal it. Double click also flags a square.
57. Use brighter, raised Minesweeper-style covered cells and high-contrast number colors so covered, revealed, blank, numbered, and flagged squares are immediately distinguishable.
58. If a player tries to shovel or flag before playing a card or drawing, show a large animated arrow and message pointing them toward the card hand and explaining the required next step.
59. When a player shovels a mine, reveal the hidden mines one at a time with explosion graphics. Then show a large loss message naming the player who lost and ask whether to play again or finish.
60. Show the current turn instruction in a large, centered banner between the board and player hand. Use prominent text for whether to play/draw a card or how many square actions remain.
61. In Flag mode, clicking a flagged square removes the flag and refunds its 2 flag points to its owner. Removing a flag consumes one action. If removing a flag invalidates the final-correct-flag bonus, remove that 10-point bonus as well.
62. Setup/settings includes an opponent choice between a second human and a Medium bot. Remember this choice in browser storage.
63. The Medium bot follows legal UNO and board rules, plays useful number/action cards, obeys forced draw-card penalties, makes safe and mine deductions from revealed clues, and otherwise chooses lower-risk squares with occasional uncertain moves. It must not use hidden mine locations to make decisions.
64. Hide the bot's cards from the human player during bot turns. Show a bot label and a short thinking delay so bot moves are understandable.

#Tech rules
1. Build it in html5 format so it can run on the browser. 
2. needs to be an offline game, so it does not rely on internet. 
3. Keep the game dependency-free and use local HTML, CSS, and JavaScript files only.
4. Use the Makefile commands `make serve`, `make stop`, `make check`, and `make clean` for development and verification.
5. `make serve` must stop any process using the configured port, start the local server, and open the default browser.
