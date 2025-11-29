# Issue #015: High Score Implementation

**Status**: Completed

## Description
Implement local storage saving for high scores. The game should save the highest score achieved and display it on the HUD.

## Requirements
- [ ] Save high score to `localStorage` when the game ends (crash or landing) if the current score is higher than the stored high score.
- [ ] Load high score from `localStorage` when the game starts.
- [ ] Display the high score on the HUD (e.g., "HIGH SCORE: 1000").
- [ ] Update the high score display dynamically if the current score exceeds it during gameplay (optional, or just update on game over). *Decision: Update on game over to keep it simple, or update immediately if we want to show "New Record". Let's update on Game Over for now, but display the *current* session high score if we want.*
    - *Refinement*: Usually High Score is the all-time best. Current Score is what the player is doing now. If Current > High, High should probably update to match Current, or we just show "New High Score" at the end.
    - *Plan*: Always display "HIGH SCORE: X". If current score > X, we can either update X immediately or wait. Let's update `localStorage` at the end of the game, but we can update the in-memory high score immediately if we want.
    - Let's keep it simple: Load at start. Check at end of game (Crash or Safe Landing). If current > high, save new high.

## Technical Details
- **GameState**: Add `highScore` property.
- **GameStateManager**: Handle loading and saving of high score.
    - `loadHighScore()`
    - `saveHighScore(score: number)`
- **HUD**: Update `draw()` to render the high score.

## Verification
- Check if high score is 0 on first run (or cleared storage).
- Play game, get a score.
- Refresh page (or restart game).
- Verify high score is persisted.
- Beat the high score.
- Verify new high score is saved.
