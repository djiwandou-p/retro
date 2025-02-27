import React, {
  Fragment,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import ThumbDownIcon from "@material-ui/icons/ThumbDown";
import { makeStyles } from "@material-ui/core/styles";
import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  Theme,
  Typography,
} from "@material-ui/core";

import DeleteItemButton from "./DeleteItemButton";
import MarkAsDiscussedButton from "./MarkAsDiscussedButton";
import EditItemButton from "./EditItemButton";
import UpvoteItemButton from "./UpvoteItemButton";
import BlurredItem from "./BlurredItem";
import { UserContext } from "../../../context/UserContext";
import { BoardContext } from "../../../context/BoardContext";
import { CardAuthor, CardContainer, CardText } from "../../styled-components";
import {
  FOCUS_CARD,
  REMOVE_FOCUS_CARD,
  VOTE_CARD,
} from "../../../constants/event.constants";
import { ROLE_MODERATOR } from "../../../utils/user.utils";
import { ColorThemeContext } from "../../../context/ColorThemeContext";

type RetroItemProps = {
  id: string;
  author: string;
  content: string;
  points: number;
  isBlurred: boolean;
  isVoted: boolean;
  isDiscussed: boolean;
};

const getCardBorderColor = (colorTheme: Theme, theme: Theme) => {
  if (colorTheme.palette.type === "dark") {
    return theme.palette.secondary.light;
  } else {
    return "lightgrey";
  }
};

const useStyles = makeStyles((theme) => ({
  avatar: {
    color: theme.palette.secondary.contrastText,
    backgroundColor: theme.palette.secondary.dark,
  },
  avatarVoted: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.dark,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
  },
  card: (colorTheme: Theme) => ({
    border: `1px solid ${getCardBorderColor(colorTheme, theme)}`,
  }),
  cardHeader: {
    padding: "8px",
  },
  cardFocused: {
    border: "4px solid red",
  },
  contentBody: {
    whiteSpace: "pre-line",
  },
  downVoteButton: {
    marginTop: theme.spacing(1),
  },
  likeButton: {
    marginLeft: "auto",
  },
  cardLink: {
    color: theme.palette.primary.main, 
    borderBottom: "dashed 1px",
    borderColor: theme.palette.primary.main,
    textDecoration: "none"
  }
}));

function RetroItem(props: RetroItemProps) {
  const { id, author, content, points, isBlurred, isVoted, isDiscussed } =
    props;
  const [blurStatus, setBlurStatus] = useState(isBlurred);
  const [hasMouseFocus, setMouseFocus] = useState(false);
  const { boardId, boardState, socket } = useContext(BoardContext);
  const { userState, downvoteCard } = useContext(UserContext);
  const { currentTheme } = useContext(ColorThemeContext);
  const classes = useStyles(currentTheme);
  const contentWithLinks = createContentWithLinks(content); 

  function createContentWithLinks(content: string) {
    // Regex for matching every kind of URLs
    const urls = /(?:\w+:\/\/[\w.]+|[\w.]+\.\w+).*/.exec(content);
    
    urls?.forEach((url: string) => {
      const editedUrl = url.indexOf('//') == -1 ? 'https://' + url : url;
      content = content.replace(url, `<a href="${editedUrl}" target="_blank" class="${classes.cardLink}">${url}</a>`); 
    });

    return content;
  }

  function downVote() {
    const votesLeft = userState.votesLeft;
    socket.emit(VOTE_CARD, id, boardId, false);
    downvoteCard(boardId, id, votesLeft);
  }

  function handleFocus(event: KeyboardEvent) {
    const role = userState.role;

    if (role === ROLE_MODERATOR) {
      if (hasMouseFocus && event.key === "f" && event.code === "KeyF") {
        socket.emit(FOCUS_CARD, id);
      } else if (
        event.shiftKey &&
        event.key === "F" &&
        event.code === "KeyF" &&
        boardState.focusedCard !== ""
      ) {
        socket.emit(REMOVE_FOCUS_CARD);
      }
    }
  }

  function handleHover(
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    isFocused: boolean
  ) {
    setMouseFocus(isFocused);
  }

  const getIsBlurred = useCallback(() => {
    setBlurStatus(author === userState.name ? false : isBlurred);
  }, [author, isBlurred, userState.name]);

  useEffect(() => {
    document.addEventListener("keypress", handleFocus);

    return () => {
      document.removeEventListener("keypress", handleFocus);
    };
  });

  useEffect(() => {
    getIsBlurred();
  }, [getIsBlurred]);

  return (
    <Fragment>
      {blurStatus ? (
        <BlurredItem />
      ) : (
        <CardContainer>
          <Card
            elevation={20}
            onMouseEnter={(event) => handleHover(event, true)}
            onMouseLeave={(event) => handleHover(event, false)}
            className={
              boardState.focusedCard === id ? classes.cardFocused : classes.card
            }
          >
            <CardHeader
              className={classes.cardHeader}
              avatar={
                <Avatar
                  className={isVoted ? classes.avatarVoted : classes.avatar}
                  aria-label="number of votes"
                >
                  {points}
                </Avatar>
              }
              title={
                <Typography variant="body2" component={"span"}>
                  <CardAuthor>{author}</CardAuthor>
                </Typography>
              }
            />
            <Divider />
            <CardContent>
              <Typography
                className={classes.contentBody}
                variant="body2"
                color="textSecondary"
                component={"span"}
              >
                <CardText dangerouslySetInnerHTML={{__html : contentWithLinks }}/>
              </Typography>
            </CardContent>
            <CardActions disableSpacing className={classes.actions}>
              <div>
                {isDiscussed ? (
                  <Chip label={"Discussed"} variant="outlined" size={"small"} />
                ) : null}
              </div>
              <div>
                <UpvoteItemButton id={id} />
                {isVoted ? (
                  <IconButton
                    className={classes.downVoteButton}
                    size="small"
                    color="inherit"
                    onClick={downVote}
                  >
                    <ThumbDownIcon fontSize="small" />
                  </IconButton>
                ) : null}
                <EditItemButton id={id} author={author} content={content} />
                <MarkAsDiscussedButton id={id} />
                <DeleteItemButton id={id} />
              </div>
            </CardActions>
          </Card>
        </CardContainer>
      )}
    </Fragment>
  );
}

export default React.memo(RetroItem);
