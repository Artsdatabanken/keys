import React, { useState } from "react";
import Typography from "@material-ui/core/Typography";

import SearchBox from "./SearchBox";
import KeyInfo from "./KeyInfo";

function KeyList(props) {
  const [filterTaxon, setfilterTaxon] = useState(false);
  const [keys, setKeys] = useState(false);

  const applyFilter = (taxon) => {
    setfilterTaxon(taxon);

    if (taxon) {
      setKeys({
        exact: props.keys.filter(
          (k) =>
            +k.classification[k.classification.length - 1].ScientificNameId ===
            +taxon.ScientificNameId
        ),
        isSubTaxon: props.keys.filter((k) =>
          k.classification
            .slice(0, k.classification.length - 1)
            .find((x) => +x.ScientificNameId === +taxon.ScientificNameId)
        ),

        containsSubTaxon: props.keys.filter((k) =>
          k.subTaxa.find((x) => +x.ScientificNameId === +taxon.ScientificNameId)
        ),

        containsResult: props.keys.filter((k) =>
          k.resultTaxa.find((x) => +x === +taxon.ScientificNameId)
        ),
      });
    } else {
      setKeys(false);
    }
  };

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

        <SearchBox applyFilter={applyFilter} />

        {keys &&
          !keys.exact.length &&
          !keys.containsSubTaxon.length &&
          !keys.isSubTaxon.length &&
          !keys.containsResult.length && (
            <Typography variant="overline" display="block">
              Ingen resultater for {filterTaxon.ScientificName}
            </Typography>
          )}

        {!keys &&
          props.keys.map((key) => (
            <KeyInfo key={key.id} keyItem={key} filterTaxon={filterTaxon} />
          ))}

        {keys &&
          keys.exact.map((key) => (
            <KeyInfo key={key.id} keyItem={key} subject={filterTaxon} />
          ))}

        {keys &&
          keys.containsSubTaxon.map((key) => (
            <KeyInfo key={key.id} keyItem={key} lowerTaxon={filterTaxon} />
          ))}

        {keys &&
          keys.isSubTaxon.map((key) => (
            <KeyInfo key={key.id} keyItem={key} higherTaxon={filterTaxon} />
          ))}

        {keys &&
          keys.containsResult.map((key) => (
            <KeyInfo key={key.id} keyItem={key} result={filterTaxon} />
          ))}
      </div>
    </main>
  );
}

export default KeyList;
