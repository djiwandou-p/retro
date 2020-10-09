import React, { useContext, useEffect, useState } from "react";
import { Grid, makeStyles } from "@material-ui/core";
import { Redirect, useLocation, useRouteMatch } from "react-router-dom";
import isEqual from "lodash/isEqual";

import PokerHeader from "./PokerHeader";
import PokerActionButtons from "./PokerActionButtons";
import PokerTitle from "./PokerTitle";
import PokerParticipants from "./PokerParticipants";
import { PokerContext } from "../../context/PokerContext";
import { Poker } from "../../types/common.types";
import { defaultPoker } from "../../utils";
import { usePokerStore } from "../../hooks/poker.hooks";
import {
  getPokerUser,
  POKER_ROLE_MODERATOR,
  POKER_ROLE_PARTICIPANT,
} from "../../utils/poker.utils";
import {
  CONNECT,
  JOIN_POKER,
  JOIN_POKER_ERROR,
  POKER_ERROR,
  UPDATE_POKER_STATE,
  SHOW_POKER_RESULTS,
  UPDATE_AND_RESET_POKER_STATE,
} from "../../constants/event.constants";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  storyTitle: {
    padding: theme.spacing(2),
  },
}));

// TODO: remove setPoker() calls if zustand works
export default function PokerPage() {
  // const [poker, setPoker] = useState<Poker>(defaultPoker);
  const poker = usePokerStore();
  const [flip, setFlip] = useState(false);
  const { pokerId, socket, createPokerRole, resetPokerVotes } = useContext(
    PokerContext
  );
  const classes = useStyles();
  const match = useRouteMatch();
  const location = useLocation();

  useEffect(() => {
    document.title = "Retro | Planning Poker";

    return () => {
      document.title = "Retro";
    };
  });

  useEffect(() => {
    // pull state, when navigating back and forth
    if (isEqual(poker, defaultPoker) && match.isExact) {
      socket.emit(JOIN_POKER, pokerId);
    }

    socket.on(CONNECT, () => {
      socket.emit(JOIN_POKER, pokerId);
    });

    socket.on(JOIN_POKER, (pokerState: Poker) => {
      if (location.state && getPokerUser(pokerId) === null) {
        createPokerRole(pokerId, POKER_ROLE_MODERATOR);
      } else if (getPokerUser(pokerId) === null) {
        createPokerRole(pokerId, POKER_ROLE_PARTICIPANT);
      }

      poker.setPokerState(pokerState);
      // setPoker(pokerState);
    });

    socket.on(UPDATE_POKER_STATE, (newPokerState: Poker) => {
      poker.setPokerState(newPokerState);
      // setPoker(newPokerState);
    });

    socket.on(SHOW_POKER_RESULTS, () => {
      setFlip((prevFlip) => !prevFlip);
    });

    socket.on(UPDATE_AND_RESET_POKER_STATE, (newPokerState: Poker) => {
      resetPokerVotes(pokerId);
      setFlip(false);
      poker.setPokerState(newPokerState);
      // setPoker(newPokerState);
    });

    socket.on(POKER_ERROR, () => {
      poker.setPokerError();
      // setPoker({ ...poker, error: true });
    });

    socket.on(JOIN_POKER_ERROR, () => {
      poker.setPokerError();
      // setPoker({ ...poker, error: true });
    });

    return () => {
      socket.removeAllListeners();
    };
    // eslint-disable-next-line
  }, []);

  if (poker.error) {
    return <Redirect to={"/error"} />;
  }

  console.log(poker);

  return (
    <div>
      <PokerHeader />
      <Grid
        container
        className={classes.root}
        direction="column"
        justify="space-between"
      >
        <PokerActionButtons />
        <Grid item xs={12}>
          <PokerTitle
            storyTitle={poker.story.storyTitle}
            storyUrl={poker.story.storyUrl}
          />
        </Grid>
        <Grid item xs={12}>
          <PokerParticipants participants={poker.participants} flip={flip} />
        </Grid>
      </Grid>
    </div>
  );
}
