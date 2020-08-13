import React from "react";
import Button from "@material-ui/core/Button";
import ClearIcon from "@material-ui/icons/Clear";
import CheckIcon from "@material-ui/icons/Check";
import RestoreIcon from "@material-ui/icons/Restore";
import Box from "@material-ui/core/Box";

import { Avatar } from "@material-ui/core";

import ButtonGroup from "@material-ui/core/ButtonGroup";

function AlternativeContent(props) {
  const { title } = props.content;
  const { media } = props.content;

  let avatar = "";
  if (media) {
    avatar = (
      <Avatar
        variant="square"
        src={props.content.media_small.url}
        style={{ flex: "0 0 85px", height: "85px", marginRight: "15px" }}
      />
    );
  }

  return (
    <div
      style={{ display: "flex", flex: "1 1 auto", cursor: (props.content.media ||
        props.content.description ||
        props.content.descriptionUrl ||
        props.content.descriptionDetails) ? "pointer" : "default"
       }}
      onClick={
        (props.content.media ||
          props.content.description ||
          props.content.descriptionUrl ||
          props.content.descriptionDetails) &&
        props.openModal.bind(this, props.content)
      }
    >
      {avatar}
      <div
        style={{
          paddingTop: "15px",
          paddingBottom: "15px",
          flex: "1 1 auto",
          flexWrap: "wrap",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function Alternative(props) {
  const { id, answerIs, isAnswered, content } = props.alternative;

  const getButtons = () => {
    if (answerIs === undefined) {
      return (
        <ButtonGroup size="small">
          <Button
            style={{ color: "rgb(76, 175, 80)", backgroundColor: "white" }}
            variant="outlined"
            onClick={props.giveAnswer.bind(this, id, true)}
          >
            <CheckIcon />
          </Button>
          {props.siblings !== 1 ? (
            <Button
              style={{ color: "rgb(245, 0, 87)", backgroundColor: "white" }}
              variant="outlined"
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
        <ButtonGroup size="small">
          <Button
            style={
              answerIs
                ? { backgroundColor: "rgb(76, 175, 80)", color: "white" }
                : { backgroundColor: "rgb(245, 0, 87)", color: "white" }
            }
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
    let style = { display: "flex", flex: "1 1 auto" };
    if (answerIs) {
      style.backgroundColor = "#E8F5E9";
    } else if (answerIs === false) {
      style.backgroundColor = "#ffebee";
    }
    return style;
  };

  return (
    <Box style={getBoxStyle()}>
      <div style={{ flex: "1 1 auto" }}>
        {content.map((c, index) => (
          <AlternativeContent
            content={c}
            media={props.media}
            openModal={props.openModal}
            key={index}
          />
        ))}
      </div>
      <div style={{ flex: "0 1 auto", margin: "15px" }}>{getButtons()}</div>
    </Box>
  );
}

export default Alternative;
