// Reads a higly standardized, old csv file and outputs json in new format

const fs = require("fs");
const axios = require("axios");
const { exit } = require("process");
const { keys } = require("@material-ui/core/styles/createBreakpoints");

var args = process.argv.slice(2);

const processFile = async (err, data) => {
  if (err) throw err;
  csv = data.split("\n").map((x) => x.split("\t"));

  const definitions = {
    metadataRows: [],
    characterCols: [],
    taxonRows: [],
  };

  let i = 0;
  while (csv[i][0] !== "Character") {
    if (csv[i][0]) {
      definitions.metadataRows.push(csv[i][0]);
    }
    i++;
  }

  let j = 0;

  while (csv[i][j]) {
    definitions.characterCols.push(csv[i][j]);
    j++;
  }

  k = 0;
  while (k < i && csv[k][j]) {
    definitions.taxonRows.push(csv[k][j]);
    k++;
  }

  [key.creators, key.persons] = getResources(
    csv[definitions.metadataRows.indexOf("Key creators")][1],
    key.persons,
    "person"
  );

  [key.contributors, key.persons] = getResources(
    csv[definitions.metadataRows.indexOf("Key contributors")][1],
    key.persons,
    "person"
  );

  [key.publishers, key.organizations] = getResources(
    csv[definitions.metadataRows.indexOf("Key publishers")][1],
    key.organizations,
    "organization"
  );

  key["id"] = csv[definitions.metadataRows.indexOf("Key id")][1] || undefined;
  key["title"] =
    csv[definitions.metadataRows.indexOf("Key name")][1] || undefined;
  key["description"] =
    csv[definitions.metadataRows.indexOf("Key intro")][1] || undefined;
  key["descriptionUrl"] =
    csv[definitions.metadataRows.indexOf("Key description")][1] || undefined;
  key["language"] =
    csv[definitions.metadataRows.indexOf("Language")][1] || undefined;
  key["license"] =
    csv[definitions.metadataRows.indexOf("Key license")][1] || undefined;
  key["regionName"] =
    csv[definitions.metadataRows.indexOf("Geographic range")][1] || undefined;

  if (key["descriptionUrl"]) {
    key["descriptionUrl"] =
      "https://artsdatabanken.no/Widgets/" + key["descriptionUrl"];
  }

  key.characters = [];
  key.characterIds = [];
  key.stateIds = [];

  csv
    .slice(
      Math.max(definitions.metadataRows.length, definitions.taxonRows.length) +
        1
    )
    .forEach((row) => {
      if (row[definitions.characterCols.indexOf("Character")]) {
        key.characters.push({
          id: "character:character" + (key.characters.length + 1),
          title: row[definitions.characterCols.indexOf("Character")],
          logicalPremise: row[
            definitions.characterCols.indexOf("Character requirement")
          ]
            ? row[definitions.characterCols.indexOf("Character requirement")]
                .replace("{", "alternative:")
                .replace("}", "")
            : undefined,
          descriptionUrl: row[definitions.characterCols.indexOf("Description")]
            ? "https://artsdatabanken.no/Widgets/" +
              row[definitions.characterCols.indexOf("Description")]
            : undefined,
          alternatives: [],
        });
      }

      if (row[definitions.characterCols.indexOf("State")]) {
        let state = {
          id:
            "alternative:" +
            (row[definitions.characterCols.indexOf("State id")] ||
              "alternative" +
                key.characters.length +
                "_" +
                (key.characters[key.characters.length - 1].alternatives.length +
                  1)),
          title: row[definitions.characterCols.indexOf("State")],
          media: [
            row[definitions.characterCols.indexOf("State media")],
            row[definitions.characterCols.indexOf("State media license")],
            row[definitions.characterCols.indexOf("State media creators")],
            row[definitions.characterCols.indexOf("State media contributors")],
            row[definitions.characterCols.indexOf("State media publishers")],
          ],
        };

        [
          state.media,
          key.mediaElements,
          key.persons,
          key.organizations,
        ] = getMedia(
          state.media,
          key.mediaElements,
          key.persons,
          key.organizations
        );

        key.characters[key.characters.length - 1].alternatives.push(state);
        key.characterIds.push(key.characters[key.characters.length - 1].id);
        key.stateIds.push(state.id);
      }
    });

  key.taxa = [];
  key.taxonIds = [];
  key.ResultTaxonIds = [];
  key.HigherClassifications = [];

  for (let i = definitions.characterCols.length + 1; i < csv[0].length; i++) {
    let taxon;

    if (csv[definitions.taxonRows.indexOf("Morph")][i]) {
      taxon = {
        vernacularName: csv[definitions.taxonRows.indexOf("Morph")][i],
        media: [
          csv[definitions.taxonRows.indexOf("Media")][i],
          csv[definitions.taxonRows.indexOf("Media license")][i],
          csv[definitions.taxonRows.indexOf("Media creators")][i],
          csv[definitions.taxonRows.indexOf("Media contributors")][i],
          csv[definitions.taxonRows.indexOf("Media publishers")][i],
        ],
      };

      [
        taxon.media,
        key.mediaElements,
        key.persons,
        key.organizations,
      ] = getMedia(
        taxon.media,
        key.mediaElements,
        key.persons,
        key.organizations
      );
    }

    if (csv[definitions.taxonRows.indexOf("Subset")][i]) {
      if (taxon) {
        taxon = { children: [taxon], isResult: true };
      } else {
        taxon = {};
      }
      taxon.vernacularName = csv[definitions.taxonRows.indexOf("Subset")][i];

      if (!taxon.children) {
        taxon.media = [
          csv[definitions.taxonRows.indexOf("Media")][i],
          csv[definitions.taxonRows.indexOf("Media license")][i],
          csv[definitions.taxonRows.indexOf("Media creators")][i],
          csv[definitions.taxonRows.indexOf("Media contributors")][i],
          csv[definitions.taxonRows.indexOf("Media publishers")][i],
        ];

        [
          taxon.media,
          key.mediaElements,
          key.persons,
          key.organizations,
        ] = getMedia(
          taxon.media,
          key.mediaElements,
          key.persons,
          key.organizations
        );
      }
    }

    if (taxon) {
      taxon = { children: [taxon] };
      if (!csv[definitions.taxonRows.indexOf("Subset")][i]) {
        taxon.isResult = true;
      }
    } else {
      taxon = {};
    }

    taxon.externalReference = {
      serviceId: "service:nbic_scientificnameid",
      externalId: csv[definitions.taxonRows.indexOf("ScientificNameID")][i],
    };

    taxon = await fetchTaxonData(taxon);
    key.HigherClassifications.push(taxon.HigherClassification);
    //delete taxon.HigherClassification;

    taxon.id =
      "taxon:" + taxon.scientificName.replace(/\s+/g, "").toLowerCase();

    if (csv[definitions.taxonRows.indexOf("Subset")][i]) {
      taxon.children[0].id =
        taxon.id + "_" + csv[definitions.taxonRows.indexOf("Subset")][i];
      if (csv[definitions.taxonRows.indexOf("Morph")][i]) {
        taxon.children[0].children[0].id =
          taxon.id +
          "_" +
          csv[definitions.taxonRows.indexOf("Subset")][i]
            .replace(/\s+/g, "")
            .toLowerCase() +
          "_" +
          csv[definitions.taxonRows.indexOf("Morph")][i]
            .replace(/\s+/g, "")
            .toLowerCase();
      }
    } else if (csv[definitions.taxonRows.indexOf("Morph")][i]) {
      taxon.children[0].id =
        taxon.id +
        "_" +
        csv[definitions.taxonRows.indexOf("Morph")][i]
          .replace(/\s+/g, "")
          .toLowerCase();
    }

    key.ResultTaxonIds.push(taxon.externalReference.externalId);

    key.taxonIds.push(
      taxon.id +
        (csv[definitions.taxonRows.indexOf("Subset")][i] &&
          "_" +
            csv[definitions.taxonRows.indexOf("Subset")][i]
              .replace(/\s+/g, "")
              .toLowerCase()) +
        (csv[definitions.taxonRows.indexOf("Morph")][i] &&
          "_" +
            csv[definitions.taxonRows.indexOf("Morph")][i]
              .replace(/\s+/g, "")
              .toLowerCase())
    );

    if (!taxon.children) {
      taxon.media = [
        csv[definitions.taxonRows.indexOf("Media")][i],
        csv[definitions.taxonRows.indexOf("Media license")][i],
        csv[definitions.taxonRows.indexOf("Media creators")][i],
        csv[definitions.taxonRows.indexOf("Media contributors")][i],
        csv[definitions.taxonRows.indexOf("Media publishers")][i],
      ];

      [
        taxon.media,
        key.mediaElements,
        key.persons,
        key.organizations,
      ] = getMedia(
        taxon.media,
        key.mediaElements,
        key.persons,
        key.organizations
      );
    }

    let parents = csv[definitions.taxonRows.indexOf("Taxon path")][i]
      .split("|")
      .map((x) => x.trim());

    while (parents.length && parents[parents.length - 1]) {
      taxon = {
        externalReference: {
          serviceId: "service:nbic_scientificnameid",
          externalId: parents[parents.length - 1],
        },
        children: [taxon],
      };
      parents.pop();
    }

    key.taxa = mergeTaxon(taxon, key.taxa);
  }

  key.classification = [];

  while (
    !(
      key.HigherClassifications.find((c) => !c.length) ||
      key.HigherClassifications.find(
        (c) =>
          c[0].ScientificNameId !==
          key.HigherClassifications[0][0].ScientificNameId
      )
    )
  ) {
    key.classification.push(key.HigherClassifications[0][0]);
    key.HigherClassifications = key.HigherClassifications.map((c) =>
      c.slice(1)
    );
  }

  key.HigherClassifications = [].concat.apply([], key.HigherClassifications);

  key.subTaxa = [];
  key.HigherClassifications.forEach((c) => {
    if (!key.subTaxa.find((t) => t.ScientificNameId === c.ScientificNameId)) {
      key.subTaxa.push(c);
    }
  });
  delete key.HigherClassifications;

  key.resultTaxa = [];
  key.ResultTaxonIds.forEach((r) => {
    if (!key.resultTaxa.find((t) => t === r)) {
      key.resultTaxa.push(r);
    }
  });
  delete key.ResultTaxonIds;

  const facts = csv
    .slice(definitions.taxonRows.length + 1)
    .map((x) => x.slice(definitions.characterCols.length + 1))
    .filter((x) => x.length);

  key.statements = [];

  facts.forEach((row, stateIndex) => {
    row.forEach((fact, taxonIndex) => {
      if (+fact) {
        key.statements.push({
          id:
            "statement:" +
            key.taxonIds[taxonIndex].replace("taxon:", "") +
            "_" +
            key.stateIds[stateIndex].replace("alternative:", ""),
          taxonId: key.taxonIds[taxonIndex],
          characterId: key.characterIds[stateIndex],
          value: key.stateIds[stateIndex],
          frequency: +fact !== 1 ? fact : undefined,
        });
      }
    });
  });

  key.taxa = await supplementTaxa(
    key.taxa,
    key.classification[key.classification.length - 1]
  );

  console.log(`${key.statements.length} statements before simplification`);
  key.statements = simplify(key.statements, key.taxa);
  console.log(`${key.statements.length} statements after simplification`);

  fs.writeFile(
    args[0].replace(".csv", ".json"),
    JSON.stringify({
      $schema: key.$schema,
      id: key.id,
      title: key.title,
      classification: key.classification,
      description: key.description,
      descriptionDetails: key.descriptionDetails,
      descriptionUrl: key.descriptionUrl,
      language: key.language,
      license: key.license,
      regionName: key.regionName,
      creators: key.creators,
      contributors: key.contributors,
      publishers: key.publishers,
      created: key.created,
      lastModified: key.lastModified,
      persons: key.persons,
      organizations: key.organizations,
      externalServices: key.externalServices,
      mediaElements: key.mediaElements,
      taxa: key.taxa,
      characters: key.characters,
      statements: key.statements,
    }),
    "utf-8",
    (err) => {
      if (err) throw err;
      console.log(args[0].replace(".csv", ".json"), "written");
    }
  );

  let keysData = [];

  if (fs.existsSync("keys.json")) {
    keysData = JSON.parse(fs.readFileSync("keys.json")).keys;
  }

  let keyEntry = {
    id: key.id,
    filename: args[0].replace(".csv", ".json"),
    title: key.title,
    description: key.description,
    descriptionDetails: key.descriptionDetails,
    descriptionUrl: key.descriptionUrl,
    classification: key.classification,
    subTaxa: key.subTaxa,
    resultTaxa: key.resultTaxa,
    language: key.language,
    license: key.license,
    regionName: key.regionName,
    creators: (key.creators || []).map(
      (c) => key.persons.find((p) => p.id === c).name
    ),
    contributors: (key.contributors || []).map(
      (c) => key.persons.find((p) => p.id === c).name
    ),
    publishers: (key.publishers || []).map(
      (pub) => key.organizations.find((o) => o.id === pub).name
    ),
    mediaElement: key.mediaElements.length
      ? key.mediaElements[0].mediaElement
      : undefined,
  };

  if (keysData.find((k) => k.id === keyEntry.id)) {
    keysData = keysData.map((k) => (k.id === keyEntry.id ? keyEntry : k));
  } else {
    keysData.push(keyEntry);
  }

  fs.writeFile(
    "keys.json",
    JSON.stringify({
      keys: keysData,
    }),
    "utf-8",
    (err) => {
      if (err) throw err;
      console.log("keys.json updated");
    }
  );
};

const simplify = (statements, taxa) => {
  for (const taxon of taxa) {
    // continue if it has no children
    if (!taxon.children) {
      continue;
    }

    statements = simplify(statements, taxon.children);

    // for all statements for the first child
    let myStatements = statements.filter(
      (s) => s.taxonId === taxon.children[0].id
    );

    let siblingIds = taxon.children.map((x) => x.id).slice(1);

    for (const myStatement of myStatements) {
      let foundDifference = false;
      // find the same statement for each next child
      // continue when not found
      for (const siblingId of siblingIds) {
        if (
          !statements.find(
            (x) =>
              x.taxonId === siblingId &&
              x.value === myStatement.value &&
              x.frequency === myStatement.frequency
          )
        ) {
          foundDifference = true;
          break;
        }
      }

      if (!foundDifference) {
        // otherwise they are all the same
        // set simplified to true

        myStatement.taxonId = taxon.id;

        myStatement.id =
          taxon.id.replace("taxon:", "statement:") +
          myStatement.value.replace("alternative:", "_");
        // statements.push(myStatement);

        statements = statements.filter(
          (x) =>
            !(
              x.value === myStatement.value &&
              taxon.children.map((y) => y.id).includes(x.taxonId)
            )
        );
      }
    }
  }

  return statements;
};

const fetchTaxonData = async (taxon) => {
  console.log("Fetching name...");

  let language =
    key["language"].slice(0, 2).toLowerCase() === "no"
      ? key["language"].slice(3).toLowerCase()
      : key["language"].slice(0, 2).toLowerCase();

  let taxonResult = await axios.get(
    "https://artsdatabanken.no/api/Resource/?Take=1&Type=Taxon&AcceptedNameUsage=ScientificName/" +
      taxon.externalReference.externalId
  );

  if (taxonResult.data.length) {
    taxon.scientificName = taxonResult.data[0].AcceptedNameUsage.ScientificName;
    taxon.vernacularName =
      taxon.vernacularName ||
      (taxonResult.data[0]["VernacularName_" + language + "-NO"] &&
        taxonResult.data[0]["VernacularName_" + language + "-NO"][0]) ||
      taxon.scientificName;
    if (
      taxonResult.data[0]["Description_" + language] &&
      !taxon.descriptionUrl
    ) {
      taxon.descriptionUrl = taxonResult.data[0][
        "Description_" + language
      ][0].Id.replace("Nodes/", "https://artsdatabanken.no/Widgets/");
    }

    taxon.HigherClassification =
      taxonResult.data[0].ScientificNames[0].HigherClassification;

    if (!taxon.id || taxon.id === "taxon:") {
      taxon.id =
        "taxon:" + taxon.scientificName.replace(/\s+/g, "").toLowerCase();
    }
  } else {
    console.log(
      "Did not find ",
      "https://artsdatabanken.no/api/Resource/?Take=1&Type=Taxon&AcceptedNameUsage=ScientificName/" +
        taxon.externalReference.externalId
    );
  }

  return taxon;
};

const supplementTaxa = async (taxa, rootTaxon, parentTaxon = false) => {
  for (let index = 0; index < taxa.length; index++) {
    if (
      taxa[index].externalReference &&
      (!taxa[index].scientificName || !taxa[index].vernacularName)
    ) {
      taxa[index] = await fetchTaxonData(taxa[index]);
    }

    if (
      parentTaxon &&
      parentTaxon.externalReference &&
      taxa[index].HigherClassification
    ) {
      taxa[index].HigherClassification = taxa[index].HigherClassification.slice(
        taxa[index].HigherClassification.findIndex(
          (x) => x.ScientificNameId === parentTaxon.externalReference.externalId
        ) + 1
      );
    } else if (taxa[index].HigherClassification) {
      taxa[index].HigherClassification = taxa[index].HigherClassification.slice(
        taxa[index].HigherClassification.findIndex(
          (x) => x.ScientificNameId === rootTaxon.ScientificNameId
        ) + 1
      );
    }

    if (taxa[index].children) {
      taxa[index].children = await supplementTaxa(
        taxa[index].children,
        rootTaxon,
        taxa[index]
      );
    }

    if (!taxa[index].id) {
      taxa[index].id =
        taxa[index].scientificName &&
        "taxon:" + taxa[index].scientificName.replace(/\s+/g, "").toLowerCase();
    }
  }
  return taxa;
};

const mergeTaxon = (taxon, taxa) => {
  if (taxon.children) {
    for (let index = 0; index < taxa.length; index++) {
      if (
        (taxa[index].externalReference &&
          taxon.externalReference &&
          taxa[index].externalReference.externalId ===
            taxon.externalReference.externalId) ||
        (taxa[index].id && taxon.id && taxa[index].id === taxon.id)
      ) {
        // if the target taxon does not have children, it has to be a nameless (default) morph or subset.
        if (!taxa[index].children || !taxa[index].children.length) {
          taxa[index].children = [{ ...taxa[index] }];
          taxa[index].id = taxa[index].id + "_parent";
          taxa[index].isResult = taxon.isResult;
          delete taxa[index].media;
          delete taxa[index].children[0].externalReference;
          delete taxa[index].children[0].descriptionUrl;
          delete taxa[index].children[0].scientificName;

          taxa[index].children[0].vernacularName = "";
        }

        taxa[index].children = mergeTaxon(
          taxon.children[0],
          taxa[index].children
        );

        return taxa;
      }
    }
  }

  taxa.push(taxon);
  return taxa;
};

const getMedia = (mediaInfo, mediaElements, persons, organizations) => {
  mediaElements = mediaElements || [];
  output = mediaInfo[0] ? "media:media" + mediaInfo[0] : undefined;

  if (output && !mediaElements.find((x) => x.id === output)) {
    let mediaElement = {
      id: output,
      infoUrl: "https://artsdatabanken.no/Widgets/" + mediaInfo[0] || undefined,
      license: mediaInfo[1] || undefined,
      mediaElement: [
        {
          url:
            "https://artsdatabanken.no/Media/" + mediaInfo[0] + "?mode=128x128",
          width: 128,
          height: 128,
        },
        {
          url:
            "https://artsdatabanken.no/Media/" +
            mediaInfo[0] +
            "?mode=1024x1024",
          width: 1024,
          height: 1024,
        },
      ],
    };

    [mediaElement.creators, persons] = getResources(
      mediaInfo[2],
      persons,
      "person"
    );
    [mediaElement.contributors, persons] = getResources(
      mediaInfo[3],
      persons,
      "person"
    );
    [mediaElement.publishers, organizations] = getResources(
      mediaInfo[4],
      organizations,
      "organization"
    );

    mediaElements.push(mediaElement);
  }

  return [output, mediaElements, persons, organizations];
};

const getResources = (resourceString, targetArray, type) => {
  targetArray = targetArray || [];
  resourceString = resourceString || "";

  let resourceStrings = resourceString.split("|").map((x) => x.trim());

  let output = [];

  resourceStrings
    .filter((x) => x.length)
    .forEach((resourceString) => {
      let resource = targetArray.find((x) => x.name === resourceString);

      if (!resource) {
        resource = {
          id: type + ":" + resourceString.replace(/\s+/g, "").toLowerCase(),
          name: resourceString,
        };

        targetArray.push(resource);
      }

      output.push(resource.id);
    });

  return [
    output.length ? output : undefined,
    targetArray.length ? targetArray : undefined,
  ];
};

let csv;
let key = {
  $schema:
    "https://raw.githubusercontent.com/Artsdatabanken/identification_key_schema/f886188c5c285d7eaabb7b8adffc97c106772cbe/Identification_key_schema.json",
};

key.externalServices = [
  {
    id: "service:nbic_scientificnameid",
    title: "ScientificNameId in Artsnavnebasen",
    provider: "Norwegian Biodiversity I…Centre (Artsdatabanken)",
    url: "https://artsdatabanken.no/Api/Taxon/ScientificName/",
  },
];

if (!args[0]) {
  console.log("No file specified");
  exit(1);
}

fs.readFile(args[0], "utf-8", processFile);
