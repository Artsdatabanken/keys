import React from "react";
import Typography from "@material-ui/core/Typography";

import KeyInfo from "./KeyInfo";

function KeyList(props) {
  return (
    <main style={{ width: "100%" }}>
      <div style={{ padding: 25 }}>
        <Typography
          variant="h3"
          component="h3"
          style={{
            display: "flex",
            fontSize: "2em",
            paddingBottom: 20,
          }}
        >
          Velg en nøkkel
        </Typography>

        {props.keys.map((key) => (
          <KeyInfo key={key.id} keyItem={key} />
        ))}
      </div>
    </main>
  );
}

export default KeyList;
