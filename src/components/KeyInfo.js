import React from "react";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";

function KeyInfo(props) {
  let key = props.keyItem;

  return (
    <a href={"?key=" + key.id} style={{ textDecoration: "none" }}>
      <Card style={{ marginBottom: 25 }}>
        <CardContent>
          <div style={{ display: "flex", justifyContent: "space-between"}}>
            <div style={{ flex: "1 1 auto" }}>
              <Typography gutterBottom variant="h5" component="h2">
                {key.title}
              </Typography>
              <Typography variant="body2" component="p">
                {key.description}
              </Typography>
            </div>

            {key.mediaElement && (
              <CardMedia
                component="img"
                alt={key.title}
                height="140"
                image={key.mediaElement.find((m) => m.height >= 150).url}
                title={key.title}
                style={{ width: 150, height: 150, flex: "0 0 auto" }}
              />
            )}
          </div>
            <Typography color="textSecondary" variant="caption" display="p">
              Bestemmelsesnøkkel for {key.classification[key.classification.length-1].ScientificName} av{" "}
              {key.creators[0]}
              {key.creators.slice(1).map((c) => (
                <span>, {c}</span>
              ))}
              . Utgitt av {key.publishers[0]}
              {key.publishers.slice(1).map((pub) => (
                <span>, {pub}</span>
              ))}
              .
            </Typography>
        </CardContent>
      </Card>
    </a>
  );
}

export default KeyInfo;
