import React from "react";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Alternative from "./Alternative";
import Divider from "@material-ui/core/Divider";
import { Avatar } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";

function Character(props) {
  return (
    <Card style={{ marginBottom: 15 }}>
      <CardHeader
        title={
          <div
            style={{
              display: "flex",
              cursor:
                props.character.media ||
                props.character.description ||
                props.character.descriptionUrl ||
                props.character.descriptionDetails
                  ? "pointer"
                  : "default",
            }}
          >
            {props.character.media_small && (
              <Avatar
                variant="square"
                src={props.character.media_small.url}
                style={{
                  flex: "0 0 50px",
                  height: "50px",
                  marginRight: "15px",
                }}
              />
            )}

            {!props.character.media_small &&
              (props.character.description ||
                props.character.descriptionUrl ||
                props.character.descriptionDetails) && (
                <HelpIcon style={{ marginRight: ".5em" }} />
              )}

            {props.character.title}
          </div>
        }
        onClick={
          (props.character.media ||
            props.character.description ||
            props.character.descriptionUrl ||
            props.character.descriptionDetails) &&
          props.setModal.bind(this, {character: props.character})
        }
      ></CardHeader>
      <CardContent>
        {props.character.alternatives.map((alternative) => (
          <React.Fragment key={alternative.id}>
            <Divider style={{ margin: "10px 0 10px 0"}} />
            <Alternative
              alternative={alternative}
              siblings={props.character.alternatives.filter(a => a.answerIs === undefined).length - 1}
              setModal={props.setModal}
              giveAnswer={props.giveAnswer}
              undoAnswer={props.undoAnswer}
              media={props.media}
            />
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  );
}

export default Character;
