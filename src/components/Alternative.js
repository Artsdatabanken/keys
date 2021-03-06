import React from "react";
import Button from "@material-ui/core/Button";
import ClearIcon from "@material-ui/icons/Clear";
import CheckIcon from "@material-ui/icons/Check";
import RestoreIcon from "@material-ui/icons/Restore";
import Box from "@material-ui/core/Box";
import Hidden from "@material-ui/core/Hidden";

import { Avatar } from "@material-ui/core";

import ButtonGroup from "@material-ui/core/ButtonGroup";

function getMedia(props) {
  if (props.alternative.media) {
    return (
      <Avatar
        variant="square"
        src={
          props.alternative.media.mediaElement.find((m) => m.height >= 128).url
        }
        style={{ flex: "0 0 128px", height: "128px" }}
      />
    );
  }
  return null;
}

function AlternativeContent(props) {
  const { title, media } = props.alternative;

  return (
    <div
      style={{
        display: "flex",
        flex: "1 1 auto",
        cursor:
          media ||
          props.alternative.description ||
          props.alternative.descriptionUrl ||
          props.alternative.descriptionDetails
            ? "pointer"
            : "default",
      }}
      onClick={
        (media ||
          props.alternative.description ||
          props.alternative.descriptionUrl ||
          props.alternative.descriptionDetails) &&
        props.setModal.bind(this, { alternative: props.alternative })
      }
    >
      {getMedia(props)}
      <div
        style={{
          padding: "15px",
          flex: "1 1 auto",
          flexWrap: "wrap",
        }}
      >
        {media ? <Hidden xsDown>{title}</Hidden> : <div>{title} </div>}
      </div>
    </div>
  );
}

function Alternative(props) {
  const alternative = props.alternative;
  const { id, answerIs, isAnswered } = alternative;

  const getButtons = () => {
    if (answerIs === undefined) {
      return (
        <ButtonGroup size="large" orientation="vertical">
          <Button
            className="button--green"
            onClick={props.giveAnswer.bind(this, id, true)}
          >
            <CheckIcon />
          </Button>
          {props.siblings !== 1 ? (
            <Button
              className="button--red"
              onClick={props.giveAnswer.bind(this, id, false)}
            >
              <ClearIcon />
            </Button>
          ) : (
            ""
          )}
        </ButtonGroup>
      );
    } else if (isAnswered) {
      return (
        <ButtonGroup size="large" orientation="vertical">
          <Button
            className={answerIs ? "button--green" : "button--red"}
            variant="contained"
            onClick={props.undoAnswer.bind(this, id)}
          >
            <RestoreIcon />
          </Button>
        </ButtonGroup>
      );
    }
  };

  const getBoxStyle = () => {
    let style = {};
    if (answerIs) {
      style.backgroundColor = "#E8F5E9";
    } else if (answerIs === false) {
      style.backgroundColor = "#ffebee";
    }
    return style;
  };

  return (
    <Box style={getBoxStyle()}>
      <div style={{ display: "flex", flex: "1 1 auto" }}>
        <div style={{ flex: "1 1 auto" }}>
          <AlternativeContent
            alternative={alternative}
            media={props.media}
            setModal={props.setModal}
            key={alternative.id}
          />
        </div>
        <div style={{ flex: "0 1 auto", margin: "15px" }}>{getButtons()}</div>
      </div>

      {alternative.media && (
        <Hidden smUp>
          <div
            style={{
              padding: "15px",
            }}
          >
            {alternative.title}
          </div>
        </Hidden>
      )}
    </Box>
  );
}

export default Alternative;
