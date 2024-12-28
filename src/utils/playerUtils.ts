import { Move, Player } from "../minesweeper/types"
import combinedPlayer from "../players/combinedPlayer"
import contextAwarePlayer from "../players/contextAwarePlayer"
import contextAwarePlayerV2 from "../players/contextAwarePlayerV2"
import cspPlayer from "../players/cspPlayer"
import naivePlayer from "../players/naivePlayer"
import simplePlayer from "../players/simplePlayer"
import userPlayer from "../players/userPlayer"

export const getPlayerForId = (
    playerId: string,
    showHighlights: boolean = true,
    delayMs: number = 100,
    onUserMove?: () => Promise<Move>,
): Player => {
    switch (playerId) {
      case "NAIVE":
        return naivePlayer
      case "USER":
        return userPlayer(onUserMove!!)()
      case "SIMPLE":
        return simplePlayer(showHighlights, delayMs)
      case "CONTEXT":
        return contextAwarePlayer(showHighlights, delayMs)
      case "CONTEXTV2":
        return contextAwarePlayerV2(showHighlights, delayMs)
      case "CSP":
        return cspPlayer(showHighlights, delayMs)
      case "COMBINED":
        return combinedPlayer(showHighlights, delayMs)
    }
    return naivePlayer;
  }
