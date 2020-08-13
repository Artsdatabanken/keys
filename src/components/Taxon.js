import React from "react";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import IconButton from "@material-ui/core/IconButton";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import RestoreIcon from "@material-ui/icons/Restore";
import TreeItem from "@material-ui/lab/TreeItem";
import Chip from "@material-ui/core/Chip";

import { Avatar } from "@material-ui/core";

function Taxon(props) {
  props.taxon.vernacularName =
    props.taxon.vernacularName.charAt(0).toUpperCase() +
    props.taxon.vernacularName.slice(1);

  const { vernacularName, scientificName, id, isResult } = props.taxon;
  let { media_small } = props.taxon;

  let children = [];
  if (props.taxon.children) {
    if (props.filter !== "irrelevant") {
      children = props.taxon.children.filter((child) => child.isRelevant);
    } else {
      children = props.taxon.children.filter((child) => child.isIrrelevant);
    }
  }

  // If this taxon has no media, but is a result with children, set the media element to that of the first child
  if (!media_small && isResult && children.length) {
    let child = children.find((child) => child.media);
    if (child) {
      media_small = child.media_small;
    }
  }

  const getButton = () => {
    if (props.taxon.dismissed) {
      return (
        <IconButton
          edge="end"
          aria-label="dismiss"
          onClick={props.toggleDismissTaxon.bind(this, id)}
        >
          <RestoreIcon />
        </IconButton>
      );
    } else if (props.filter !== "irrelevant") {
      return (
        <HighlightOffIcon
          onClick={props.toggleDismissTaxon.bind(this, id)}
          style={{ color: "#aaa", paddingTop: "15px", paddingRight: "5px" }}
        />
      );
    }
    return " ";
  };

  const nameCapitalizedHeader = (
    <Typography
      variant="h2"
      style={{ fontSize: "1.12em", lineHeight: ".5em" }}
      gutterBottom
    >
      {vernacularName}
    </Typography>
  );

  const scientificNameHeader = (
    <Typography variant="body2" gutterBottom style={{ fontSize: "0.8em" }}>
      <i>{scientificName}</i>
    </Typography>
  );

  let cardStyle = {};
  if (props.filter === "irrelevant") {
    cardStyle.backgroundColor = "#eee";
  }

  return (
    <TreeItem
      nodeId={props.taxon.id + "_" + props.filter}
      onLabelClick={(e) => {e.preventDefault()}}
      label={
        <Card variant="outlined" style={cardStyle}>
          <div style={{ display: "flex" }}>
            {media_small && (
              <Avatar
                variant="square"
                src={media_small.url}
                style={{ width: "55px", height: "55px" }}
                onClick={props.openModal.bind(this, props.taxon, "taxon")}
              />
            )}
            <CardHeader
              style={{ paddingBottom: 0, flex: "1" }}
              disableTypography={true}
              title={nameCapitalizedHeader}
              subheader={scientificNameHeader}
              onClick={props.openModal.bind(this, props.taxon, "taxon")}
            />

            <div style={{ flex: "0" }}>{getButton()}</div>
          </div>
          <div style={{ paddingLeft: "50px" }}>
            {props.taxon.isResult && children.length === 1 && (
              <Chip
                style={{ marginLeft: 15, marginBottom: 15, marginTop: -5 }}
                size="small"
                variant="default"
                label={
                  children[0].vernacularName.charAt(0).toUpperCase() +
                  children[0].vernacularName.slice(1)
                }
              />
            )}
          </div>
        </Card>
      }
    >
      {!props.taxon.isResult
        ? children.map((child) => (
            <Taxon
              toggleDismissTaxon={props.toggleDismissTaxon}
              openModal={props.openModal}
              taxon={child}
              media={props.media}
              key={child.id}
              filter={props.filter}
            />
          ))
        : ""}
    </TreeItem>
  );
}

export default Taxon;
